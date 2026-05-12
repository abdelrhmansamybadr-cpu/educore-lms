import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsArray, IsDateString } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { QuestionType } from '@prisma/client'

export class CreateQuizDto {
  @ApiProperty() @IsString() courseId: string
  @ApiProperty() @IsString() title: string
  @ApiPropertyOptional() @IsOptional() @IsString() titleAr?: string
  @ApiPropertyOptional() @IsOptional() @IsString() instructions?: string
  @ApiPropertyOptional() @IsOptional() @IsNumber() timeLimitMinutes?: number
  @ApiPropertyOptional() @IsOptional() @IsNumber() maxAttempts?: number
  @ApiPropertyOptional() @IsOptional() @IsNumber() passingScore?: number
  @ApiPropertyOptional() @IsOptional() @IsBoolean() randomizeQuestions?: boolean
  @ApiPropertyOptional() @IsOptional() @IsBoolean() randomizeAnswers?: boolean
  @ApiPropertyOptional() @IsOptional() @IsBoolean() showOneAtATime?: boolean
  @ApiPropertyOptional() @IsOptional() @IsBoolean() allowBacktrack?: boolean
  @ApiPropertyOptional() @IsOptional() @IsDateString() availableFrom?: string
  @ApiPropertyOptional() @IsOptional() @IsDateString() availableUntil?: string
}

export class UpdateQuizDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string
  @ApiPropertyOptional() @IsOptional() @IsString() instructions?: string
  @ApiPropertyOptional() @IsOptional() @IsNumber() timeLimitMinutes?: number
  @ApiPropertyOptional() @IsOptional() @IsNumber() passingScore?: number
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean
  @ApiPropertyOptional() @IsOptional() @IsDateString() availableFrom?: string
  @ApiPropertyOptional() @IsOptional() @IsDateString() availableUntil?: string
}

export class CreateQuestionDto {
  @ApiProperty({ enum: QuestionType }) @IsEnum(QuestionType) type: QuestionType
  @ApiProperty() @IsString() text: string
  @ApiPropertyOptional() @IsOptional() @IsString() textAr?: string
  @ApiPropertyOptional() @IsOptional() @IsString() imageUrl?: string
  @ApiPropertyOptional() @IsOptional() @IsNumber() points?: number
  @ApiPropertyOptional() @IsOptional() @IsString() difficulty?: string
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[]
  @ApiPropertyOptional() @IsOptional() options?: Array<{ text: string; textAr?: string; isCorrect?: boolean }>
  @ApiPropertyOptional() @IsOptional() correctAnswer?: any
  @ApiPropertyOptional() @IsOptional() @IsString() explanation?: string
  @ApiPropertyOptional() @IsOptional() @IsString() explanationAr?: string
}

export class StartAttemptDto {
  @ApiProperty() @IsString() quizId: string
}

export class SubmitAnswerDto {
  @ApiProperty() @IsString() questionId: string
  @ApiProperty() answer: any  // can be string, string[], number, etc.
}

export class SubmitAttemptDto {
  @ApiProperty({ type: [SubmitAnswerDto] }) @IsArray() answers: SubmitAnswerDto[]
}
