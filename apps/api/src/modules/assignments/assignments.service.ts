import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { GamificationService } from '../gamification/gamification.service'
import type {
  CreateAssignmentDto, UpdateAssignmentDto, SubmitAssignmentDto, GradeSubmissionDto,
} from './dto/assignment.dto'

@Injectable()
export class AssignmentsService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}

  // ── Assignments ───────────────────────────────────────────────────────────────

  async create(dto: CreateAssignmentDto) {
    return this.prisma.assignment.create({ data: dto as any })
  }

  async findByCourse(courseId: string) {
    return this.prisma.assignment.findMany({
      where: { courseId },
      include: { _count: { select: { submissions: true } } },
      orderBy: { dueDate: 'asc' },
    })
  }

  async findOne(id: string) {
    const a = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        _count: { select: { submissions: true } },
        submissions: {
          include: { student: { include: { profile: true } } },
          orderBy: { submittedAt: 'desc' },
        },
      },
    })
    if (!a) throw new NotFoundException('Assignment not found')
    return a
  }

  async update(id: string, dto: UpdateAssignmentDto) {
    return this.prisma.assignment.update({ where: { id }, data: dto as any })
  }

  async remove(id: string) {
    return this.prisma.assignment.delete({ where: { id } })
  }

  async togglePublish(id: string) {
    const a = await this.prisma.assignment.findUnique({ where: { id } })
    if (!a) throw new NotFoundException('Assignment not found')
    return this.prisma.assignment.update({ where: { id }, data: { isPublished: !a.isPublished } })
  }

  // ── Submissions ───────────────────────────────────────────────────────────────

  async submit(assignmentId: string, studentId: string, dto: SubmitAssignmentDto) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } })
    if (!assignment) throw new NotFoundException('Assignment not found')

    const now = new Date()
    const isLate = now > assignment.dueDate

    const existing = await this.prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId } },
    })

    if (existing && !assignment.allowLate) {
      throw new BadRequestException('Re-submission not allowed')
    }

    const submission = await this.prisma.submission.upsert({
      where: { assignmentId_studentId: { assignmentId, studentId } },
      create: {
        assignmentId, studentId, isLate,
        files: dto.files || [],
        textContent: dto.textContent,
        linkUrl: dto.linkUrl,
      },
      update: {
        submittedAt: now, isLate,
        files: dto.files || [],
        textContent: dto.textContent,
        linkUrl: dto.linkUrl,
        score: null, feedback: null, gradedAt: null, gradedById: null,
      },
    })

    // Award XP on first submission (not resubmissions)
    if (!existing) {
      await this.gamification.addPoints(studentId, 15, 'assignment_submit').catch(() => null)
    }

    return submission
  }

  async gradeSubmission(submissionId: string, graderId: string, dto: GradeSubmissionDto) {
    const submission = await this.prisma.submission.findUnique({ where: { id: submissionId } })
    if (!submission) throw new NotFoundException('Submission not found')

    return this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        score: dto.score,
        feedback: dto.feedback,
        feedbackAudioUrl: dto.feedbackAudioUrl,
        gradedAt: new Date(),
        gradedById: graderId,
      },
    })
  }

  async getStudentSubmissions(studentId: string, courseId?: string) {
    return this.prisma.submission.findMany({
      where: {
        studentId,
        assignment: courseId ? { courseId } : undefined,
      },
      include: {
        assignment: { select: { title: true, maxPoints: true, dueDate: true } },
      },
      orderBy: { submittedAt: 'desc' },
    })
  }

  async getPendingGrading(teacherId: string, courseId?: string) {
    return this.prisma.submission.findMany({
      where: {
        gradedAt: null,
        assignment: {
          courseId: courseId || undefined,
          course: { teacherId },
        },
      },
      include: {
        assignment: { select: { title: true, maxPoints: true, courseId: true } },
        student: { include: { profile: { select: { firstName: true, lastName: true, avatar: true } } } },
      },
      orderBy: { submittedAt: 'asc' },
    })
  }
}
