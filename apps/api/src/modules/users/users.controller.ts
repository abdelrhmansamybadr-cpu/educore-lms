import {
  Controller, Get, Post, Patch, Delete, Body,
  Param, Query,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { UsersService } from './users.service'
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './dto/create-user.dto'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { SchoolId } from '../../common/decorators/school.decorator'

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Post()
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.VICE_PRINCIPAL, Role.ADMISSION_OFFICER)
  @ApiOperation({ summary: 'Create a new user in the school' })
  create(@SchoolId() schoolId: string, @Body() dto: CreateUserDto) {
    return this.users.create(schoolId, dto)
  }

  @Post('bulk-import')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Bulk import users from parsed CSV data' })
  bulkCreate(@SchoolId() schoolId: string, @Body() dto: { users: CreateUserDto[] }) {
    return this.users.bulkCreate(schoolId, dto.users)
  }

  @Get()
  @Roles(
    Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.VICE_PRINCIPAL, Role.ACADEMIC_DIRECTOR,
    Role.DEPARTMENT_HEAD, Role.TEACHER, Role.HR_MANAGER,
  )
  @ApiOperation({ summary: 'List all users in the school with filters' })
  findAll(@SchoolId() schoolId: string, @Query() query: UserQueryDto) {
    return this.users.findAll(schoolId, query)
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@SchoolId() schoolId: string, @CurrentUser('id') id: string) {
    return this.users.findOne(schoolId, id)
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user own profile' })
  updateMe(
    @SchoolId() schoolId: string,
    @CurrentUser('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.users.update(schoolId, id, dto)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@SchoolId() schoolId: string, @Param('id') id: string) {
    return this.users.findOne(schoolId, id)
  }

  @Patch(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.VICE_PRINCIPAL, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Update user profile' })
  update(
    @SchoolId() schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.users.update(schoolId, id, dto)
  }

  @Delete(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a user account permanently' })
  remove(@SchoolId() schoolId: string, @Param('id') id: string) {
    return this.users.remove(schoolId, id)
  }

  @Patch(':id/deactivate')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Deactivate a user account' })
  deactivate(@SchoolId() schoolId: string, @Param('id') id: string) {
    return this.users.setActive(schoolId, id, false)
  }

  @Patch(':id/activate')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reactivate a user account' })
  activate(@SchoolId() schoolId: string, @Param('id') id: string) {
    return this.users.setActive(schoolId, id, true)
  }

  @Post(':parentId/link/:studentId')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.ADMISSION_OFFICER)
  @ApiOperation({ summary: 'Link a parent account to a student' })
  linkParent(
    @SchoolId() schoolId: string,
    @Param('parentId') parentId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.users.linkParentToChild(schoolId, parentId, studentId)
  }

  @Get('parent/my-children')
  @Roles(Role.PARENT)
  @ApiOperation({ summary: 'Get all children linked to current parent' })
  getMyChildren(@CurrentUser('id') parentId: string) {
    return this.users.getChildren(parentId)
  }
}
