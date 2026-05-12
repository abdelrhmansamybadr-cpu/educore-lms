import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class GradebookService {
  constructor(private prisma: PrismaService) {}

  async setGrade(data: {
    studentId: string
    courseId: string
    assignmentId?: string
    quizId?: string
    points: number
    maxPoints: number
    letterGrade?: string
    feedback?: string
    gradedById?: string
  }) {
    const percentage = data.maxPoints > 0 ? (data.points / data.maxPoints) * 100 : 0
    const letterGrade = data.letterGrade || this.toLetterGrade(percentage)

    return this.prisma.grade.create({
      data: {
        ...data,
        percentage,
        letterGrade,
        gradedAt: new Date(),
      } as any,
    })
  }

  async getStudentGrades(studentId: string, courseId?: string) {
    const where: any = { studentId }
    if (courseId) where.courseId = courseId

    const grades = await this.prisma.grade.findMany({
      where,
      orderBy: { gradedAt: 'desc' },
    })

    const total = grades.length
    const avg = total > 0
      ? grades.reduce((sum, g) => sum + (g.percentage || 0), 0) / total
      : 0

    return { grades, average: Math.round(avg * 10) / 10 }
  }

  async getCourseGradebook(courseId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId },
      include: {
        student: {
          include: {
            profile: { select: { firstName: true, lastName: true, avatar: true, studentId: true } },
            grades: {
              where: { courseId },
              orderBy: { gradedAt: 'desc' },
            },
          },
        },
      },
    })

    return enrollments.map((e) => {
      const grades = e.student.grades
      const avg = grades.length > 0
        ? grades.reduce((sum, g) => sum + (g.percentage || 0), 0) / grades.length
        : null

      return {
        studentId: e.studentId,
        student: {
          name: `${e.student.profile?.firstName} ${e.student.profile?.lastName}`,
          avatar: e.student.profile?.avatar,
          studentId: e.student.profile?.studentId,
        },
        grades,
        average: avg ? Math.round(avg * 10) / 10 : null,
        letterGrade: avg ? this.toLetterGrade(avg) : null,
        progress: e.progress,
      }
    })
  }

  async getParentChildGrades(parentId: string) {
    const links = await this.prisma.parentStudentLink.findMany({
      where: { parentId },
      include: {
        student: {
          include: {
            profile: { select: { firstName: true, lastName: true } },
            grades: {
              orderBy: { gradedAt: 'desc' },
              take: 10,
            },
            enrollments: { include: { course: { select: { title: true } } } },
          },
        },
      },
    })

    return links.map((link) => ({
      student: {
        id: link.studentId,
        name: `${link.student.profile?.firstName} ${link.student.profile?.lastName}`,
      },
      grades: link.student.grades,
      enrollments: link.student.enrollments,
    }))
  }

  async bulkSetGrades(grades: Array<{
    studentId: string; courseId: string; points: number; maxPoints: number;
    assignmentId?: string; quizId?: string; feedback?: string;
  }>, gradedById: string) {
    const results = await Promise.all(
      grades.map(async (g) => {
        const percentage = g.maxPoints > 0 ? (g.points / g.maxPoints) * 100 : 0
        const letterGrade = this.toLetterGrade(percentage)
        return this.prisma.grade.create({
          data: { ...g, percentage, letterGrade, gradedById, gradedAt: new Date() } as any,
        })
      }),
    )
    return { count: results.length, grades: results }
  }

  async getStudentGPA(studentId: string) {
    const grades = await this.prisma.grade.findMany({ where: { studentId } })
    const total = grades.length
    const average = total > 0 ? grades.reduce((s, g) => s + (g.percentage || 0), 0) / total : 0

    const gpaMap: Record<string, number> = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'D-': 0.7,
      'F': 0.0,
    }
    const gpa = total > 0
      ? grades.reduce((s, g) => s + (gpaMap[g.letterGrade || 'F'] ?? 0), 0) / total
      : 0

    return { gpa: Math.round(gpa * 100) / 100, average: Math.round(average * 10) / 10, total }
  }

  async getCourseGradeAnalytics(courseId: string) {
    const grades = await this.prisma.grade.findMany({ where: { courseId } })
    const dist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 }
    let sum = 0, highest = 0, lowest = 100

    for (const g of grades) {
      const pct = g.percentage || 0
      sum += pct
      if (pct > highest) highest = pct
      if (pct < lowest) lowest = pct
      const letter = (g.letterGrade || 'F')[0]
      if (letter in dist) dist[letter]++
      else dist['F']++
    }

    const total = grades.length
    return {
      total,
      distribution: dist,
      average: total > 0 ? Math.round((sum / total) * 10) / 10 : 0,
      highest: total > 0 ? Math.round(highest * 10) / 10 : 0,
      lowest: total > 0 ? Math.round(lowest * 10) / 10 : 0,
      passRate: total > 0 ? Math.round((grades.filter((g) => (g.percentage || 0) >= 60).length / total) * 100) : 0,
    }
  }

  async getReportCard(studentId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: { select: { id: true, title: true, titleAr: true } },
      },
    })

    const courseReports = await Promise.all(
      enrollments.map(async (e) => {
        const grades = await this.prisma.grade.findMany({
          where: { studentId, courseId: e.courseId },
        })
        const avg = grades.length > 0
          ? grades.reduce((s, g) => s + (g.percentage || 0), 0) / grades.length : 0

        return {
          courseId: e.courseId,
          courseTitle: e.course.title,
          courseTitleAr: e.course.titleAr,
          progress: e.progress,
          gradeCount: grades.length,
          average: Math.round(avg * 10) / 10,
          letterGrade: avg > 0 ? this.toLetterGrade(avg) : null,
        }
      }),
    )

    const gpaData = await this.getStudentGPA(studentId)
    return { studentId, gpa: gpaData.gpa, overallAverage: gpaData.average, courses: courseReports }
  }

  async getSchoolGradeSummary(schoolId: string) {
    return this.prisma.grade.findMany({
      where: { course: { schoolId } } as any,
      include: {
        student: { include: { profile: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { gradedAt: 'desc' },
      take: 100,
    })
  }

  private toLetterGrade(percentage: number): string {
    if (percentage >= 97) return 'A+'
    if (percentage >= 93) return 'A'
    if (percentage >= 90) return 'A-'
    if (percentage >= 87) return 'B+'
    if (percentage >= 83) return 'B'
    if (percentage >= 80) return 'B-'
    if (percentage >= 77) return 'C+'
    if (percentage >= 73) return 'C'
    if (percentage >= 70) return 'C-'
    if (percentage >= 67) return 'D+'
    if (percentage >= 63) return 'D'
    if (percentage >= 60) return 'D-'
    return 'F'
  }
}
