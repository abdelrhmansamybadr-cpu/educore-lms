import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class LibraryService {
  constructor(private prisma: PrismaService) {}

  async getBooks(schoolId: string, search?: string, category?: string) {
    return this.prisma.book.findMany({
      where: {
        schoolId,
        ...(search && { OR: [{ title: { contains: search, mode: 'insensitive' } }, { author: { contains: search, mode: 'insensitive' } }] }),
        ...(category && { category }),
      },
      include: { _count: { select: { loans: { where: { status: 'BORROWED' } } } } },
      orderBy: { title: 'asc' },
    })
  }

  async createBook(schoolId: string, data: any) {
    return this.prisma.book.create({ data: { ...data, schoolId } })
  }

  async updateBook(schoolId: string, id: string, data: any) {
    await this.findBook(schoolId, id)
    return this.prisma.book.update({ where: { id }, data })
  }

  async deleteBook(schoolId: string, id: string) {
    await this.findBook(schoolId, id)
    return this.prisma.book.delete({ where: { id } })
  }

  async loanBook(schoolId: string, bookId: string, userId: string, dueDays = 14) {
    const book = await this.findBook(schoolId, bookId)
    const activeLoanCount = await this.prisma.bookLoan.count({ where: { bookId, status: 'BORROWED' } })
    if (activeLoanCount >= book.totalCopies) throw new BadRequestException('No copies available')

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + dueDays)
    return this.prisma.bookLoan.create({ data: { bookId, userId, dueDate }, include: { book: true, user: { include: { profile: true } } } })
  }

  async returnBook(loanId: string) {
    const loan = await this.prisma.bookLoan.findUnique({ where: { id: loanId } })
    if (!loan) throw new NotFoundException('Loan not found')
    return this.prisma.bookLoan.update({ where: { id: loanId }, data: { returnedAt: new Date(), status: 'RETURNED' } })
  }

  async getLoans(schoolId: string, status?: string, userId?: string) {
    return this.prisma.bookLoan.findMany({
      where: {
        book: { schoolId },
        ...(status && { status: status as any }),
        ...(userId && { userId }),
      },
      include: { book: true, user: { include: { profile: true } } },
      orderBy: { borrowedAt: 'desc' },
    })
  }

  async getStudentLoans(userId: string) {
    return this.prisma.bookLoan.findMany({
      where: { userId },
      include: { book: true },
      orderBy: { borrowedAt: 'desc' },
    })
  }

  private async findBook(schoolId: string, id: string) {
    const book = await this.prisma.book.findFirst({ where: { id, schoolId } })
    if (!book) throw new NotFoundException('Book not found')
    return book
  }
}
