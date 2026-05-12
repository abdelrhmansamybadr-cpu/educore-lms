import { Controller, Post, Body } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { AiService } from './ai.service'
import { Roles } from '../../common/decorators/roles.decorator'
import { Role } from '@prisma/client'
import { IsString, IsOptional, IsArray, IsEnum, IsNumber } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

class ChatDto {
  @ApiProperty() @IsArray() messages: { role: 'user' | 'assistant'; content: string }[]
  @ApiPropertyOptional() @IsOptional() @IsString() subject?: string
  @ApiPropertyOptional() @IsOptional() @IsString() gradeLevel?: string
  @ApiPropertyOptional() @IsOptional() @IsString() language?: 'ar' | 'en'
  @ApiPropertyOptional() @IsOptional() @IsString() studentName?: string
}

class LessonPlanDto {
  @ApiProperty() @IsString() subject: string
  @ApiProperty() @IsString() topic: string
  @ApiProperty() @IsString() gradeLevel: string
  @ApiProperty() @IsNumber() duration: number
  @ApiPropertyOptional() @IsOptional() @IsString() language?: 'ar' | 'en'
  @ApiPropertyOptional() @IsOptional() @IsString() curriculum?: string
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) learningObjectives?: string[]
}

class QuizGeneratorDto {
  @ApiProperty() @IsString() topic: string
  @ApiProperty() @IsString() subject: string
  @ApiProperty() @IsString() gradeLevel: string
  @ApiProperty() @IsNumber() questionCount: number
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) questionTypes?: string[]
  @ApiPropertyOptional() @IsOptional() @IsString() difficulty?: 'EASY' | 'MEDIUM' | 'HARD'
  @ApiPropertyOptional() @IsOptional() @IsString() language?: 'ar' | 'en'
}

class FeedbackDto {
  @ApiProperty() @IsString() assignmentTitle: string
  @ApiProperty() @IsString() submissionText: string
  @ApiProperty() @IsNumber() maxPoints: number
  @ApiPropertyOptional() @IsOptional() @IsString() language?: 'ar' | 'en'
}

@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private ai: AiService) {}

  @Post('tutor/chat')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Chat with AI tutor (Arabic-aware)' })
  chat(@Body() dto: ChatDto) {
    return this.ai.chat(dto)
  }

  @Post('lesson-plan')
  @Roles(Role.TEACHER, Role.SUB_TEACHER, Role.ACADEMIC_DIRECTOR)
  @ApiOperation({ summary: 'Generate AI lesson plan' })
  generateLessonPlan(@Body() dto: LessonPlanDto) {
    return this.ai.generateLessonPlan(dto)
  }

  @Post('quiz-generator')
  @Roles(Role.TEACHER, Role.SUB_TEACHER)
  @ApiOperation({ summary: 'Generate quiz questions with AI' })
  generateQuiz(@Body() dto: QuizGeneratorDto) {
    return this.ai.generateQuizQuestions(dto)
  }

  @Post('grade-submission')
  @Roles(Role.TEACHER, Role.SUB_TEACHER)
  @ApiOperation({ summary: 'Get AI-powered submission feedback and suggested score' })
  gradeFeedback(@Body() dto: FeedbackDto) {
    return this.ai.generateSubmissionFeedback(dto)
  }
}
