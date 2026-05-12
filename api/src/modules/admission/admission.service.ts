import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class AdmissionService {
  constructor(private prisma: PrismaService) {}

  async getApplications(schoolId: string, filters: { status?: string; search?: string; grade?: string }) {
    const where: any = { schoolId }
    if (filters.status) where.status = filters.status
    if (filters.grade) where.applyingForGrade = filters.grade
    if (filters.search) {
      where.OR = [
        { studentFirstName: { contains: filters.search, mode: 'insensitive' } },
        { studentLastName: { contains: filters.search, mode: 'insensitive' } },
        { parentEmail: { contains: filters.search, mode: 'insensitive' } },
        { parentName: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
    return this.prisma.admissionApplication.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
    })
  }

  async getApplicationById(schoolId: string, id: string) {
    const app = await this.prisma.admissionApplication.findFirst({ where: { id, schoolId } })
    if (!app) throw new NotFoundException('Application not found')
    return app
  }

  async createApplication(schoolId: string, data: {
    studentFirstName: string
    studentLastName: string
    studentFirstNameAr?: string
    studentLastNameAr?: string
    dateOfBirth: string
    applyingForGrade: string
    parentName: string
    parentEmail: string
    parentPhone: string
    documents?: string[]
    notes?: string
  }) {
    return this.prisma.admissionApplication.create({
      data: {
        schoolId,
        studentFirstName: data.studentFirstName,
        studentLastName: data.studentLastName,
        studentFirstNameAr: data.studentFirstNameAr,
        studentLastNameAr: data.studentLastNameAr,
        dateOfBirth: new Date(data.dateOfBirth),
        applyingForGrade: data.applyingForGrade,
        parentName: data.parentName,
        parentEmail: data.parentEmail,
        parentPhone: data.parentPhone,
        documents: data.documents ?? [],
        notes: data.notes,
      },
    })
  }

  async updateStatus(schoolId: string, id: string, reviewerId: string, status: string, notes?: string) {
    await this.getApplicationById(schoolId, id)
    return this.prisma.admissionApplication.update({
      where: { id },
      data: {
        status: status as any,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        ...(notes ? { notes } : {}),
      },
    })
  }

  async getStats(schoolId: string) {
    const all = await this.prisma.admissionApplication.groupBy({
      by: ['status'],
      where: { schoolId },
      _count: true,
    })

    const total = all.reduce((sum, s) => sum + s._count, 0)
    const byStatus = Object.fromEntries(all.map((s) => [s.status, s._count]))

    const byGrade = await this.prisma.admissionApplication.groupBy({
      by: ['applyingForGrade'],
      where: { schoolId },
      _count: true,
    })

    return {
      total,
      submitted: byStatus['SUBMITTED'] ?? 0,
      underReview: byStatus['UNDER_REVIEW'] ?? 0,
      accepted: byStatus['ACCEPTED'] ?? 0,
      rejected: byStatus['REJECTED'] ?? 0,
      enrolled: byStatus['ENROLLED'] ?? 0,
      byGrade: byGrade.map((g) => ({ grade: g.applyingForGrade, count: g._count })),
    }
  }
}
