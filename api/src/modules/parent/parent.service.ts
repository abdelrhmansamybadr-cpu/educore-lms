import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class ParentService {
  constructor(private readonly prisma: PrismaService) {}

  async getChildren(parentId: string) {
    const links = await this.prisma.parentStudentLink.findMany({
      where: { parentId },
      include: {
        student: {
          include: {
            profile: true,
            enrollments: {
              include: { course: { include: { subject: true } } },
            },
          },
        },
      },
    })
    return links
  }

  async getChildrenInvoices(parentId: string) {
    const links = await this.prisma.parentStudentLink.findMany({ where: { parentId } })
    const studentIds = links.map((l) => l.studentId)
    if (!studentIds.length) return []
    return this.prisma.invoice.findMany({
      where: { studentId: { in: studentIds } },
      include: { items: true, payments: true },
      orderBy: { dueDate: 'asc' },
    })
  }

  async getChildDetails(parentId: string, studentId: string) {
    // Verify relationship
    await this.prisma.parentStudentLink.findFirstOrThrow({
      where: { parentId, studentId },
    })

    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: {
        profile: true,
        enrollments: {
          include: {
            course: {
              include: { subject: true, sections: { include: { lessons: true } } },
            },
          },
        },
      },
    })

    const grades = await this.prisma.grade.findMany({
      where: { studentId },
      orderBy: { gradedAt: 'desc' },
      take: 20,
    })

    const attendance = await this.prisma.attendanceRecord.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
      take: 30,
    })

    const avgGrade =
      grades.length > 0
        ? Math.round(grades.reduce((s, g) => s + (g.percentage || 0), 0) / grades.length)
        : null

    const presentCount = attendance.filter((a) => a.status === 'PRESENT').length
    const attendancePct = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : null

    return { student, grades, attendance, avgGrade, attendancePct }
  }
}
