import { IsString, IsOptional, IsBoolean, IsEnum, IsNumber, IsDateString, IsArray } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ContentType } from '@prisma/client'

export class CreateCourseDto {
  @ApiProperty() @IsString() title: string
  @ApiPropertyOptional() @IsOptional() @IsString() titleAr?: string
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string
  @ApiPropertyOptional() @IsOptional() @IsString() descAr?: string
  @ApiPropertyOptional() @IsOptional() @IsString() subjectId?: string
  @ApiPropertyOptional() @IsOptional() @IsString() coverImage?: string
}

export class UpdateCourseDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string
  @ApiPropertyOptional() @IsOptional() @IsString() titleAr?: string
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string
  @ApiPropertyOptional() @IsOptional() @IsString() descAr?: string
  @ApiPropertyOptional() @IsOptional() @IsString() coverImage?: string
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean
}

export class CreateSectionDto {
  @ApiProperty() @IsString() title: string
  @ApiPropertyOptional() @IsOptional() @IsString() titleAr?: string
  @ApiPropertyOptional() @IsOptional() @IsNumber() order?: number
}

export class CreateLessonDto {
  @ApiProperty() @IsString() title: string
  @ApiPropertyOptional() @IsOptional() @IsString() titleAr?: string
  @ApiProperty({ enum: ContentType }) @IsEnum(ContentType) contentType: ContentType
  @ApiProperty() content: Record<string, any>
  @ApiPropertyOptional() @IsOptional() @IsNumber() order?: number
  @ApiPropertyOptional() @IsOptional() @IsNumber() estimatedMinutes?: number
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isRequired?: boolean
  @ApiPropertyOptional() @IsOptional() @IsDateString() availableFrom?: string
}

export class UpdateLessonDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string
  @ApiPropertyOptional() @IsOptional() @IsString() titleAr?: string
  @ApiPropertyOptional() @IsOptional() content?: Record<string, any>
  @ApiPropertyOptional() @IsOptional() @IsNumber() estimatedMinutes?: number
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean
}

export class EnrollStudentDto {
  @ApiProperty() @IsString() studentId: string
  @ApiPropertyOptional() @IsOptional() @IsString() sectionId?: string
}

export class BulkEnrollDto {
  @ApiProperty({ type: [String] }) @IsArray() @IsString({ each: true }) studentIds: string[]
  @ApiPropertyOptional() @IsOptional() @IsString() sectionId?: string
}

export class UpdateProgressDto {
  @ApiProperty() @IsBoolean() isCompleted: boolean
  @ApiPropertyOptional() @IsOptional() @IsNumber() lastPosition?: number
}
