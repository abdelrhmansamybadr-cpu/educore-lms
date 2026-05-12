import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { GamificationService } from '../gamification/gamification.service'
import { QuestionType } from '@prisma/client'
import type { CreateQuizDto, UpdateQuizDto, CreateQuestionDto, SubmitAttemptDto } from './dto/quiz.dto'

@Injectable()
export class QuizzesService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}

  // ── Quizzes ───────────────────────────────────────────────────────────────────

  async create(dto: CreateQuizDto) {
    return this.prisma.quiz.create({ data: dto as any })
  }

  async findByCourse(courseId: string) {
    return this.prisma.quiz.findMany({
      where: { courseId },
      include: { _count: { select: { questions: true, attempts: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string, includeAnswers = false) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: {
            options: true,
            // Only include correct answers if teacher is viewing
            ...(includeAnswers ? {} : {}),
          },
        },
        _count: { select: { attempts: true } },
      },
    })
    if (!quiz) throw new NotFoundException('Quiz not found')

    // Remove correct answers from student-facing data
    if (!includeAnswers) {
      quiz.questions = quiz.questions.map((q) => ({
        ...q,
        correctAnswer: undefined,
        options: q.options.map((o) => ({ ...o, isCorrect: undefined })),
      })) as any
    }
    return quiz
  }

  async update(id: string, dto: UpdateQuizDto) {
    return this.prisma.quiz.update({ where: { id }, data: dto as any })
  }

  async remove(id: string) {
    return this.prisma.quiz.delete({ where: { id } })
  }

  async togglePublish(id: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id } })
    if (!quiz) throw new NotFoundException('Quiz not found')
    return this.prisma.quiz.update({ where: { id }, data: { isPublished: !quiz.isPublished } })
  }

  // ── Questions ─────────────────────────────────────────────────────────────────

  async addQuestion(quizId: string, dto: CreateQuestionDto) {
    const count = await this.prisma.question.count({ where: { quizId } })
    const { options, ...rest } = dto

    return this.prisma.question.create({
      data: {
        ...rest,
        quizId,
        order: count + 1,
        ...(options ? {
          options: {
            create: options.map((o, i) => ({ text: o.text, textAr: o.textAr, isCorrect: o.isCorrect || false, order: i })),
          },
        } : {}),
      } as any,
      include: { options: true },
    })
  }

  async removeQuestion(questionId: string) {
    return this.prisma.question.delete({ where: { id: questionId } })
  }

  async reorderQuestions(quizId: string, questionIds: string[]) {
    await Promise.all(
      questionIds.map((id, index) =>
        this.prisma.question.update({ where: { id }, data: { order: index + 1 } }),
      ),
    )
    return { success: true }
  }

  // ── Attempts ──────────────────────────────────────────────────────────────────

  async startAttempt(quizId: string, studentId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { include: { options: true }, orderBy: { order: 'asc' } } },
    })
    if (!quiz) throw new NotFoundException('Quiz not found')
    if (!quiz.isPublished) throw new BadRequestException('Quiz is not available yet')

    // Check attempt count
    const existingAttempts = await this.prisma.quizAttempt.count({
      where: { quizId, studentId },
    })
    if (existingAttempts >= quiz.maxAttempts) {
      throw new BadRequestException(`Maximum attempts (${quiz.maxAttempts}) reached`)
    }

    // Check availability window
    const now = new Date()
    if (quiz.availableFrom && now < quiz.availableFrom) {
      throw new BadRequestException('Quiz is not yet available')
    }
    if (quiz.availableUntil && now > quiz.availableUntil) {
      throw new BadRequestException('Quiz submission window has closed')
    }

    // Shuffle if needed
    let questions = quiz.questions
    if (quiz.randomizeQuestions) {
      questions = questions.sort(() => Math.random() - 0.5)
    }
    if (quiz.randomizeAnswers) {
      questions = questions.map((q) => ({
        ...q,
        options: q.options.sort(() => Math.random() - 0.5),
      }))
    }

    const attempt = await this.prisma.quizAttempt.create({
      data: { quizId, studentId, startedAt: now },
    })

    // Strip correct answers for student
    const safeQuestions = questions.map((q) => ({
      ...q,
      correctAnswer: undefined,
      options: q.options.map((o) => ({ ...o, isCorrect: undefined })),
    }))

    return {
      attempt,
      quiz: { ...quiz, questions: safeQuestions, timeLimitMinutes: quiz.timeLimitMinutes },
    }
  }

  async submitAttempt(attemptId: string, studentId: string, dto: SubmitAttemptDto) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: { quiz: { include: { questions: { include: { options: true } } } } },
    })
    if (!attempt) throw new NotFoundException('Attempt not found')
    if (attempt.studentId !== studentId) throw new BadRequestException('Not your attempt')
    if (attempt.submittedAt) throw new BadRequestException('Attempt already submitted')

    let totalPoints = 0
    let earnedPoints = 0

    // Save answers and auto-grade
    const answerRecords = await Promise.all(
      dto.answers.map(async (a) => {
        const question = attempt.quiz.questions.find((q) => q.id === a.questionId)
        if (!question) return null

        totalPoints += question.points
        const { isCorrect, pointsEarned } = this.autoGrade(question, a.answer)
        earnedPoints += pointsEarned

        return this.prisma.attemptAnswer.create({
          data: {
            attemptId,
            questionId: a.questionId,
            answer: a.answer,
            isCorrect,
            pointsEarned,
          } as any,
        })
      }),
    )

    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0
    const isPassed = attempt.quiz.passingScore ? score >= attempt.quiz.passingScore : true
    const submittedAt = new Date()
    const timeSpentSeconds = Math.floor((submittedAt.getTime() - attempt.startedAt.getTime()) / 1000)

    const updatedAttempt = await this.prisma.quizAttempt.update({
      where: { id: attemptId },
      data: { submittedAt, score, isPassed, timeSpentSeconds } as any,
    })

    // Award XP: 20 for completing, bonus 10 if passed
    await this.gamification.addPoints(studentId, 20, 'quiz_complete').catch(() => null)
    if (isPassed) {
      await this.gamification.addPoints(studentId, 10, 'quiz_passed').catch(() => null)
    }

    return { attempt: updatedAttempt, score, isPassed, earnedPoints, totalPoints }
  }

  async getAttempts(quizId: string, studentId?: string) {
    return this.prisma.quizAttempt.findMany({
      where: { quizId, studentId: studentId || undefined },
      include: {
        student: { include: { profile: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { startedAt: 'desc' },
    })
  }

  // ── Auto-grading ──────────────────────────────────────────────────────────────

  private autoGrade(question: any, answer: any): { isCorrect: boolean; pointsEarned: number } {
    const type = question.type as QuestionType

    switch (type) {
      case QuestionType.MULTIPLE_CHOICE:
      case QuestionType.TRUE_FALSE: {
        const correct = String(question.correctAnswer).toLowerCase()
        const given = String(answer).toLowerCase()
        const isCorrect = correct === given
        return { isCorrect, pointsEarned: isCorrect ? question.points : 0 }
      }

      case QuestionType.MULTIPLE_RESPONSE: {
        const correctSet = new Set(
          (Array.isArray(question.correctAnswer) ? question.correctAnswer : []).map((v: any) =>
            String(v).toLowerCase(),
          ),
        )
        const givenSet = new Set(
          (Array.isArray(answer) ? answer : []).map((v: any) => String(v).toLowerCase()),
        )
        const isCorrect =
          correctSet.size === givenSet.size && [...correctSet].every((v: string) => givenSet.has(v))
        return { isCorrect, pointsEarned: isCorrect ? question.points : 0 }
      }

      case QuestionType.FILL_BLANK:
      case QuestionType.SHORT_ANSWER: {
        const correct = String(question.correctAnswer || '').toLowerCase().trim()
        const given = String(answer || '').toLowerCase().trim()
        const isCorrect = correct === given
        return { isCorrect, pointsEarned: isCorrect ? question.points : 0 }
      }

      // Essay, Code, AudioResponse, FileUpload require manual grading
      case QuestionType.ESSAY:
      case QuestionType.CODE:
      case QuestionType.AUDIO_RESPONSE:
      case QuestionType.FILE_UPLOAD:
        return { isCorrect: false, pointsEarned: 0 } // manual grading needed

      default:
        return { isCorrect: false, pointsEarned: 0 }
    }
  }
}
