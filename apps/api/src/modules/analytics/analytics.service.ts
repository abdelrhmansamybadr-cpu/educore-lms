import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  private async getSchoolCourseIds(schoolId: string): Promise<string[]> {
    const courses = await this.prisma.course.findMany({ where: { schoolId }, select: { id: true } })
    return courses.map((c) => c.id)
  }

  private async getSchoolStudentIds(schoolId: string): Promise<string[]> {
    const students = await this.prisma.user.findMany({
      where: { schoolId, role: 'STUDENT', isActive: true },
      select: { id: true },
    })
    return students.map((s) => s.id)
  }

  async getSchoolOverview(schoolId: string) {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const courseIds = await this.getSchoolCourseIds(schoolId)

    const [totalStudents, totalTeachers, totalCourses, totalEnrollments, gradeAgg] = await Promise.all([
      this.prisma.user.count({ where: { schoolId, role: 'STUDENT', isActive: true } }),
      this.prisma.user.count({ where: { schoolId, role: 'TEACHER', isActive: true } }),
      this.prisma.course.count({ where: { schoolId, isPublished: true } }),
      this.prisma.enrollment.count({ where: { courseId: { in: courseIds } } }),
      this.prisma.grade.aggregate({
        _avg: { percentage: true },
        where: { courseId: { in: courseIds } },
      }),
    ])

    // Attendance rate last 30 days
    const attendanceRecords = await this.prisma.attendanceRecord.findMany({
      where: { date: { gte: thirtyDaysAgo }, courseId: { in: courseIds } },
      select: { status: true },
    })
    const presentCount = attendanceRecords.filter((r) => r.status === 'PRESENT').length
    const avgAttendance = attendanceRecords.length > 0
      ? Math.round((presentCount / attendanceRecords.length) * 100)
      : 0

    return {
      totalStudents,
      totalTeachers,
      totalCourses,
      totalEnrollments,
      avgGrade: Math.round((gradeAgg._avg.percentage || 0) * 10) / 10,
      avgAttendance,
    }
  }

  async getAttendanceTrends(schoolId: string, days = 30) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const courseIds = await this.getSchoolCourseIds(schoolId)

    const records = await this.prisma.attendanceRecord.findMany({
      where: { date: { gte: cutoff }, courseId: { in: courseIds } },
      select: { date: true, status: true },
      orderBy: { date: 'asc' },
    })

    // Group by date string
    const byDate = new Map<string, { present: number; absent: number; late: number; total: number }>()
    for (const r of records) {
      const key = r.date.toISOString().slice(0, 10)
      if (!byDate.has(key)) byDate.set(key, { present: 0, absent: 0, late: 0, total: 0 })
      const entry = byDate.get(key)!
      entry.total++
      if (r.status === 'PRESENT') entry.present++
      else if (r.status === 'ABSENT') entry.absent++
      else if (r.status === 'LATE') entry.late++
    }

    return Array.from(byDate.entries()).map(([date, counts]) => ({
      date,
      ...counts,
      rate: counts.total > 0 ? Math.round((counts.present / counts.total) * 100) : 0,
    }))
  }

  async getGradeDistribution(schoolId: string, courseId?: string) {
    let where: any
    if (courseId) {
      where = { courseId }
    } else {
      const courseIds = await this.getSchoolCourseIds(schoolId)
      where = { courseId: { in: courseIds } }
    }
    const grades = await this.prisma.grade.findMany({ where, select: { percentage: true, letterGrade: true } })

    const dist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 }
    let sum = 0

    for (const g of grades) {
      sum += g.percentage || 0
      const letter = (g.letterGrade || 'F')[0]
      if (letter in dist) dist[letter]++
      else dist['F']++
    }

    const total = grades.length
    const passCount = grades.filter((g) => (g.percentage || 0) >= 60).length

    return {
      ...dist,
      total,
      average: total > 0 ? Math.round((sum / total) * 10) / 10 : 0,
      passRate: total > 0 ? Math.round((passCount / total) * 100) : 0,
    }
  }

  async getCourseEngagement(schoolId: string) {
    const courses = await this.prisma.course.findMany({
      where: { schoolId, isPublished: true },
      include: {
        _count: { select: { enrollments: true } },
        enrollments: { select: { progress: true } },
      },
      orderBy: { enrollments: { _count: 'desc' } },
      take: 10,
    })

    return courses.map((c) => {
      const enrollmentCount = c._count.enrollments
      const completions = c.enrollments.filter((e) => e.progress >= 100).length
      const avgProgress = enrollmentCount > 0
        ? Math.round(c.enrollments.reduce((s, e) => s + e.progress, 0) / enrollmentCount)
        : 0

      return {
        courseId: c.id,
        title: c.title,
        titleAr: c.titleAr,
        enrollmentCount,
        avgProgress,
        completionRate: enrollmentCount > 0 ? Math.round((completions / enrollmentCount) * 100) : 0,
      }
    })
  }

  async getAtRiskStudents(schoolId: string) {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const students = await this.prisma.user.findMany({
      where: { schoolId, role: 'STUDENT', isActive: true },
      include: {
        profile: { select: { firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, avatar: true } },
        grades: { select: { percentage: true } },
        attendanceRecords: {
          where: { date: { gte: thirtyDaysAgo } },
          select: { status: true },
        },
      },
    })

    const atRisk = students
      .map((s) => {
        const gradeTotal = s.grades.length
        const avgGrade = gradeTotal > 0
          ? s.grades.reduce((sum, g) => sum + (g.percentage || 0), 0) / gradeTotal : null

        const attTotal = s.attendanceRecords?.length || 0
        const presentCount = s.attendanceRecords?.filter((r) => r.status === 'PRESENT').length || 0
        const attendanceRate = attTotal > 0 ? Math.round((presentCount / attTotal) * 100) : null

        const riskFactors: string[] = []
        if (avgGrade !== null && avgGrade < 60) riskFactors.push('low_grades')
        if (attendanceRate !== null && attendanceRate < 75) riskFactors.push('low_attendance')

        return {
          studentId: s.id,
          name: `${s.profile?.firstName} ${s.profile?.lastName}`,
          nameAr: `${s.profile?.firstNameAr || s.profile?.firstName} ${s.profile?.lastNameAr || s.profile?.lastName}`,
          avatar: s.profile?.avatar,
          avgGrade: avgGrade !== null ? Math.round(avgGrade * 10) / 10 : null,
          attendanceRate,
          riskFactors,
        }
      })
      .filter((s) => s.riskFactors.length > 0)
      .sort((a, b) => b.riskFactors.length - a.riskFactors.length)
      .slice(0, 20)

    return atRisk
  }
}
