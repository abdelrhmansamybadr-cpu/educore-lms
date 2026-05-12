import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { LibraryService } from './library.service'
import { SchoolId } from '../../common/decorators/school.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { Role } from '@prisma/client'

@ApiTags('Library')
@ApiBearerAuth()
@Controller('library')
export class LibraryController {
  constructor(private library: LibraryService) {}

  @Get('books')
  @ApiOperation({ summary: 'Get all books' })
  getBooks(
    @SchoolId() schoolId: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.library.getBooks(schoolId, search, category)
  }

  @Post('books')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.LIBRARIAN)
  @ApiOperation({ summary: 'Add a book to the library' })
  createBook(@SchoolId() schoolId: string, @Body() dto: any) {
    return this.library.createBook(schoolId, dto)
  }

  @Patch('books/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.LIBRARIAN)
  @ApiOperation({ summary: 'Update book details' })
  updateBook(@SchoolId() schoolId: string, @Param('id') id: string, @Body() dto: any) {
    return this.library.updateBook(schoolId, id, dto)
  }

  @Delete('books/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.LIBRARIAN)
  @ApiOperation({ summary: 'Delete a book' })
  deleteBook(@SchoolId() schoolId: string, @Param('id') id: string) {
    return this.library.deleteBook(schoolId, id)
  }

  @Post('books/:id/loan')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.LIBRARIAN)
  @ApiOperation({ summary: 'Issue a book loan to a student' })
  loanBook(
    @SchoolId() schoolId: string,
    @Param('id') bookId: string,
    @Body() body: { userId: string; dueDays?: number },
  ) {
    return this.library.loanBook(schoolId, bookId, body.userId, body.dueDays)
  }

  @Patch('loans/:id/return')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.LIBRARIAN)
  @ApiOperation({ summary: 'Mark a loan as returned' })
  returnBook(@Param('id') id: string) {
    return this.library.returnBook(id)
  }

  @Get('loans')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.LIBRARIAN)
  @ApiOperation({ summary: 'Get all loans' })
  getLoans(
    @SchoolId() schoolId: string,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
  ) {
    return this.library.getLoans(schoolId, status, userId)
  }

  @Get('my-loans')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get current student loans' })
  getMyLoans(@CurrentUser('id') userId: string) {
    return this.library.getStudentLoans(userId)
  }
}
