import {
  IsString, IsEmail, IsEnum, IsOptional,
  IsBoolean, IsArray,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { CurriculumType, SchoolLanguage, Currency } from '@prisma/client'

export class CreateSchoolDto {
  @ApiProperty() @IsString() name: string
  @ApiPropertyOptional() @IsOptional() @IsString() nameAr?: string
  @ApiProperty() @IsEmail() email: string
  @ApiProperty() @IsString() countryCode: string
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string
  @ApiPropertyOptional() @IsOptional() @IsString() website?: string
  @ApiPropertyOptional({ enum: CurriculumType }) @IsOptional() @IsEnum(CurriculumType) curriculumType?: CurriculumType
  @ApiPropertyOptional({ enum: SchoolLanguage }) @IsOptional() @IsEnum(SchoolLanguage) language?: SchoolLanguage
  @ApiPropertyOptional({ enum: Currency }) @IsOptional() @IsEnum(Currency) currency?: Currency
  @ApiPropertyOptional() @IsOptional() @IsString() timezone?: string
}

export class UpdateSchoolDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string
  @ApiPropertyOptional() @IsOptional() @IsString() nameAr?: string
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string
  @ApiPropertyOptional() @IsOptional() @IsString() website?: string
  @ApiPropertyOptional({ enum: CurriculumType }) @IsOptional() @IsEnum(CurriculumType) curriculumType?: CurriculumType
  @ApiPropertyOptional({ enum: SchoolLanguage }) @IsOptional() @IsEnum(SchoolLanguage) language?: SchoolLanguage
  @ApiPropertyOptional({ enum: Currency }) @IsOptional() @IsEnum(Currency) currency?: Currency
  @ApiPropertyOptional() @IsOptional() @IsString() timezone?: string
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean
}

export class SchoolSettingsDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() stripeEnabled?: boolean
  @ApiPropertyOptional() @IsOptional() @IsString() stripePublicKey?: string
  @ApiPropertyOptional() @IsOptional() @IsBoolean() paymobEnabled?: boolean
  @ApiPropertyOptional() @IsOptional() @IsBoolean() fawryEnabled?: boolean
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hyperpayEnabled?: boolean
  @ApiPropertyOptional() @IsOptional() @IsBoolean() tapEnabled?: boolean
  @ApiPropertyOptional() @IsOptional() @IsBoolean() paytabsEnabled?: boolean
  @ApiPropertyOptional() @IsOptional() @IsBoolean() moyasarEnabled?: boolean
  @ApiPropertyOptional() @IsOptional() @IsString() gradingSystem?: string
  @ApiPropertyOptional() @IsOptional() @IsString() attendanceMethod?: string
  @ApiPropertyOptional() @IsOptional() @IsBoolean() allowParentMessages?: boolean
  @ApiPropertyOptional() @IsOptional() @IsBoolean() allowStudentMessages?: boolean
  @ApiPropertyOptional() @IsOptional() @IsBoolean() lateSubmissionAllowed?: boolean
  @ApiPropertyOptional() @IsOptional() latePenaltyPercent?: number
}

export class ModuleToggleDto {
  @ApiProperty() @IsString() module: string
  @ApiProperty() @IsBoolean() enabled: boolean
}
