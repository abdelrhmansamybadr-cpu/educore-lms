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

  async chargeFineToAccount(loanId: string, fineAmount: number, schoolId: string) {
    const loan = await this.prisma.bookLoan.findUnique({
      where: { id: loanId },
      include: { book: true, user: true },
    })
    if (!loan) throw new NotFoundException('Loan not found')

    // Find or create an open invoice for this student (this academic year)
    let invoice: any = await this.prisma.invoice.findFirst({
      where: { studentId: loan.userId, schoolId, status: 'PENDING' as any },
      orderBy: { createdAt: 'desc' },
    })

    const fineDesc = `Library fine: "${(loan.book as any).title}" (overdue/lost)`

    if (invoice) {
      // Add fine as invoice item
      await (this.prisma as any).invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          feeStructureId: null,
          description: fineDesc,
          amount: fineAmount,
        },
      })
      // Update totals
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          subtotal: { increment: fineAmount } as any,
          total: { increment: fineAmount } as any,
        } as any,
      })
    } else {
      // Create a new mini-invoice for the fine
      const school = await this.prisma.school.findUnique({ where: { id: schoolId } })
      const academicYear = await this.prisma.academicYear.findFirst({ where: { schoolId } })
      if (academicYear) {
        const count = await this.prisma.invoice.count({ where: { schoolId } })
        const invoiceNumber = `INV-FINE-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`
        invoice = await this.prisma.invoice.create({
          data: {
            invoiceNumber,
            studentId: loan.userId,
            schoolId,
            academicYearId: academicYear.id,
            subtotal: fineAmount,
            discount: 0,
            tax: 0,
            total: fineAmount,
            currency: 'SAR' as any,
            dueDate: new Date(),
            status: 'PENDING' as any,
            items: {
              create: [{ feeStructureId: null, description: fineDesc, amount: fineAmount }],
            },
          } as any,
        })
      }
    }

    // Mark loan as having a charged fine
    await this.prisma.bookLoan.update({
      where: { id: loanId },
      data: { status: 'OVERDUE' as any },
    })

    return { charged: true, fineAmount, invoiceId: invoice?.id }
  }

  private async findBook(schoolId: string, id: string) {
    const book = await this.prisma.book.findFirst({ where: { id, schoolId } })
    if (!book) throw new NotFoundException('Book not found')
    return book
  }
}
