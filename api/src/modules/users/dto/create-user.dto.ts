import {
  IsEmail, IsString, IsEnum, IsOptional,
  MinLength, IsDateString, IsBoolean,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Role } from '@prisma/client'

export class CreateUserDto {
  @ApiProperty() @IsEmail() email: string
  @ApiProperty() @IsString() @MinLength(8) password: string
  @ApiProperty({ enum: Role }) @IsEnum(Role) role: Role
  @ApiProperty() @IsString() firstName: string
  @ApiProperty() @IsString() lastName: string
  @ApiPropertyOptional() @IsOptional() @IsString() firstNameAr?: string
  @ApiPropertyOptional() @IsOptional() @IsString() lastNameAr?: string
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateOfBirth?: string
  @ApiPropertyOptional() @IsOptional() @IsString() gender?: string
  @ApiPropertyOptional() @IsOptional() @IsString() nationality?: string
  @ApiPropertyOptional() @IsOptional() @IsString() studentId?: string
  @ApiPropertyOptional() @IsOptional() @IsString() gradeLevelId?: string
  @ApiPropertyOptional() @IsOptional() @IsString() sectionId?: string
  @ApiPropertyOptional() @IsOptional() @IsString() departmentId?: string
}

export class UpdateUserDto {
  @ApiPropertyOptional() @IsOptional() @IsString() firstName?: string
  @ApiPropertyOptional() @IsOptional() @IsString() lastName?: string
  @ApiPropertyOptional() @IsOptional() @IsString() firstNameAr?: string
  @ApiPropertyOptional() @IsOptional() @IsString() lastNameAr?: string
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string
  @ApiPropertyOptional() @IsOptional() @IsString() avatar?: string
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean
  @ApiPropertyOptional() @IsOptional() @IsString() language?: string
}

export class UserQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() role?: Role
  @ApiPropertyOptional() @IsOptional() @IsString() gradeLevelId?: string
  @ApiPropertyOptional() @IsOptional() @IsString() sectionId?: string
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string
  @ApiPropertyOptional() @IsOptional() page?: number
  @ApiPropertyOptional() @IsOptional() limit?: number
}
