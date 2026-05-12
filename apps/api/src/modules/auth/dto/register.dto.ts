import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Role } from '@prisma/client'

export class RegisterDto {
  @ApiProperty({ example: 'admin@school.com' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  password: string

  @ApiProperty({ example: 'Ahmed' })
  @IsString()
  firstName: string

  @ApiPropertyOptional({ example: 'أحمد' })
  @IsOptional()
  @IsString()
  firstNameAr?: string

  @ApiProperty({ example: 'Hassan' })
  @IsString()
  lastName: string

  @ApiPropertyOptional({ example: 'حسن' })
  @IsOptional()
  @IsString()
  lastNameAr?: string

  @ApiPropertyOptional({ example: 'SCHOOL_ADMIN' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  schoolId?: string
}
