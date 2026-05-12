import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { GamificationService } from '../gamification/gamification.service'
import type {
  CreateCourseDto, UpdateCourseDto, CreateSectionDto,
  CreateLessonDto, UpdateLessonDto, EnrollStudentDto, BulkEnrollDto, UpdateProgressDto,
} from './dto/course.dto'

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}

  // ── Courses ───────────────────────────────────────────────────────────────────

  async create(teacherId: string, schoolId: string, dto: CreateCourseDto) {
    return this.prisma.course.create({
      data: { ...dto, teacherId, schoolId },
      include: { subject: true, _count: { select: { enrollments: true, sections: true } } },
    })
  }

  async findAll(schoolId: string, query: {
    search?: string; subjectId?: string; teacherId?: string;
    published?: boolean; page?: number; limit?: number
  }) {
    const { search, subjectId, teacherId, published, page = 1, limit = 20 } = query
    const skip = (page - 1) * limit
    const where: any = { schoolId }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { titleAr: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (subjectId) where.subjectId = subjectId
    if (teacherId) where.teacherId = teacherId
    if (published !== undefined) where.isPublished = published

    const [data, total] = await Promise.all([
      this.prisma.course.findMany({
        where, skip, take: +limit,
        include: {
          subject: { select: { name: true, nameAr: true } },
          _count: { select: { enrollments: true, sections: true, assignments: true, quizzes: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where }),
    ])
    return { data, meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / limit) } }
  }

  async findOne(id: string, schoolId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id, schoolId },
      include: {
        subject: true,
        sections: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              where: { isPublished: true },
            },
          },
        },
        _count: { select: { enrollments: true } },
      },
    })
    if (!course) throw new NotFoundException('Course not found')
    return course
  }

  async update(id: string, schoolId: string, dto: UpdateCourseDto) {
    await this.findOne(id, schoolId)
    return this.prisma.course.update({ where: { id }, data: dto })
  }

  async remove(id: string, schoolId: string) {
    await this.findOne(id, schoolId)
    return this.prisma.course.delete({ where: { id } })
  }

  async togglePublish(id: string, schoolId: string) {
    const course = await this.findOne(id, schoolId)
    return this.prisma.course.update({
      where: { id },
      data: { isPublished: !course.isPublished },
    })
  }

  // ── Sections ──────────────────────────────────────────────────────────────────

  async createSection(courseId: string, schoolId: string, dto: CreateSectionDto) {
    await this.findOne(courseId, schoolId)
    const count = await this.prisma.courseSection.count({ where: { courseId } })
    return this.prisma.courseSection.create({
      data: { ...dto, courseId, order: dto.order ?? count + 1 },
    })
  }

  async reorderSections(courseId: string, sectionIds: string[]) {
    await Promise.all(
      sectionIds.map((id, index) =>
        this.prisma.courseSection.update({ where: { id }, data: { order: index + 1 } }),
      ),
    )
    return { success: true }
  }

  async deleteSection(sectionId: string) {
    return this.prisma.courseSection.delete({ where: { id: sectionId } })
  }

  // ── Lessons ───────────────────────────────────────────────────────────────────

  async createLesson(sectionId: string, dto: CreateLessonDto) {
    const count = await this.prisma.lesson.count({ where: { sectionId } })
    return this.prisma.lesson.create({
      data: { ...dto, sectionId, order: dto.order ?? count + 1 },
    })
  }

  async updateLesson(lessonId: string, dto: UpdateLessonDto) {
    return this.prisma.lesson.update({ where: { id: lessonId }, data: dto as any })
  }

  async deleteLesson(lessonId: string) {
    return this.prisma.lesson.delete({ where: { id: lessonId } })
  }

  // ── Enrollments ───────────────────────────────────────────────────────────────

  async enroll(courseId: string, dto: EnrollStudentDto) {
    const existing = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: dto.studentId, courseId } },
    })
    if (existing) throw new ConflictException('Student already enrolled')

    return this.prisma.enrollment.create({
      data: { studentId: dto.studentId, courseId, sectionId: dto.sectionId },
    })
  }

  async bulkEnroll(courseId: string, dto: BulkEnrollDto) {
    const results = await Promise.allSettled(
      dto.studentIds.map((studentId) =>
        this.prisma.enrollment.upsert({
          where: { studentId_courseId: { studentId, courseId } },
          create: { studentId, courseId, sectionId: dto.sectionId },
          update: {},
        }),
      ),
    )
    const enrolled = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length
    return { enrolled, failed }
  }

  async unenroll(courseId: string, studentId: string) {
    return this.prisma.enrollment.delete({
      where: { studentId_courseId: { studentId, courseId } },
    })
  }

  async getStudentCourses(studentId: string, schoolId: string) {
    return this.prisma.enrollment.findMany({
      where: { studentId, course: { schoolId } },
      include: {
        course: {
          include: {
            subject: { select: { name: true, nameAr: true } },
            _count: { select: { sections: true } },
          },
        },
      },
    })
  }

  // ── Progress ──────────────────────────────────────────────────────────────────

  async updateLessonProgress(studentId: string, lessonId: string, dto: UpdateProgressDto) {
    // Check if already completed before upsert (to avoid duplicate XP)
    const existing = await this.prisma.lessonProgress.findUnique({
      where: { studentId_lessonId: { studentId, lessonId } },
    })
    const wasAlreadyCompleted = existing?.isCompleted ?? false

    const record = await this.prisma.lessonProgress.upsert({
      where: { studentId_lessonId: { studentId, lessonId } },
      create: {
        studentId, lessonId,
        isCompleted: dto.isCompleted,
        lastPosition: dto.lastPosition,
        completedAt: dto.isCompleted ? new Date() : null,
      },
      update: {
        isCompleted: dto.isCompleted,
        lastPosition: dto.lastPosition,
        completedAt: dto.isCompleted ? new Date() : null,
      },
    })

    // Award XP only on first completion
    if (dto.isCompleted && !wasAlreadyCompleted) {
      await this.gamification.addPoints(studentId, 10, 'lesson_complete').catch(() => null)
    }

    // Update enrollment progress percentage
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { section: { include: { course: { include: { sections: { include: { lessons: true } } } } } } },
    })

    if (lesson) {
      const courseId = lesson.section.courseId
      const allLessons = lesson.section.course.sections.flatMap((s) => s.lessons)
      const completedCount = await this.prisma.lessonProgress.count({
        where: { studentId, isCompleted: true, lessonId: { in: allLessons.map((l) => l.id) } },
      })
      const progress = allLessons.length > 0 ? (completedCount / allLessons.length) * 100 : 0

      await this.prisma.enrollment.updateMany({
        where: { studentId, courseId },
        data: { progress, completedAt: progress >= 100 ? new Date() : null },
      })
    }

    return record
  }

  async getCourseProgress(studentId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { studentId, courseId },
    })
    if (!enrollment) return { progress: 0, completedLessons: [] }

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { sections: { include: { lessons: { select: { id: true } } } } },
    })

    if (!course) return { progress: 0, completedLessons: [] }

    const allLessonIds = course.sections.flatMap((s) => s.lessons.map((l) => l.id))

    const completedRecords = await this.prisma.lessonProgress.findMany({
      where: { studentId, lessonId: { in: allLessonIds }, isCompleted: true },
      select: { lessonId: true, completedAt: true, lastPosition: true },
    })

    return {
      progress: enrollment.progress,
      completedAt: enrollment.completedAt,
      completedLessons: completedRecords,
    }
  }
}
