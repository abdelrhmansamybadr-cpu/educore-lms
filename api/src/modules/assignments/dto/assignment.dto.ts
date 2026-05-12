import { IsString, IsOptional, IsBoolean, IsNumber, IsDateString, IsArray, IsEnum } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateAssignmentDto {
  @ApiProperty() @IsString() courseId: string
  @ApiProperty() @IsString() title: string
  @ApiPropertyOptional() @IsOptional() @IsString() titleAr?: string
  @ApiProperty() @IsString() instructions: string
  @ApiPropertyOptional() @IsOptional() @IsString() instructionsAr?: string
  @ApiPropertyOptional() @IsOptional() @IsString() type?: string
  @ApiProperty() @IsNumber() maxPoints: number
  @ApiProperty() @IsDateString() dueDate: string
  @ApiPropertyOptional() @IsOptional() @IsBoolean() allowLate?: boolean
  @ApiPropertyOptional() @IsOptional() @IsNumber() latePenaltyPercent?: number
  @ApiPropertyOptional() @IsOptional() @IsNumber() maxAttempts?: number
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isGroupWork?: boolean
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPeerReview?: boolean
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isAnonymousGrading?: boolean
}

export class UpdateAssignmentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string
  @ApiPropertyOptional() @IsOptional() @IsString() titleAr?: string
  @ApiPropertyOptional() @IsOptional() @IsString() instructions?: string
  @ApiPropertyOptional() @IsOptional() @IsNumber() maxPoints?: number
  @ApiPropertyOptional() @IsOptional() @IsDateString() dueDate?: string
  @ApiPropertyOptional() @IsOptional() @IsBoolean() allowLate?: boolean
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean
}

export class SubmitAssignmentDto {
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) files?: string[]
  @ApiPropertyOptional() @IsOptional() @IsString() textContent?: string
  @ApiPropertyOptional() @IsOptional() @IsString() linkUrl?: string
}

export class GradeSubmissionDto {
  @ApiProperty() @IsNumber() score: number
  @ApiPropertyOptional() @IsOptional() @IsString() feedback?: string
  @ApiPropertyOptional() @IsOptional() @IsString() feedbackAudioUrl?: string
}
