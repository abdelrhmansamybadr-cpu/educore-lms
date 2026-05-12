import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Anthropic from '@anthropic-ai/sdk'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface TutorSessionDto {
  messages: ChatMessage[]
  subject?: string
  gradeLevel?: string
  language?: 'ar' | 'en'
  studentName?: string
}

interface LessonPlanDto {
  subject: string
  topic: string
  gradeLevel: string
  duration: number    // minutes
  language?: 'ar' | 'en'
  curriculum?: string // EGYPTIAN, SAUDI, AMERICAN, BRITISH, IB
  learningObjectives?: string[]
}

interface QuizGeneratorDto {
  topic: string
  subject: string
  gradeLevel: string
  questionCount: number
  questionTypes?: string[]
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD'
  language?: 'ar' | 'en'
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name)
  private anthropic: Anthropic

  constructor(private config: ConfigService) {
    this.anthropic = new Anthropic({
      apiKey: config.get<string>('ANTHROPIC_API_KEY') || '',
    })
  }

  // ── AI Tutor (Chat) ───────────────────────────────────────────────────────────

  async chat(dto: TutorSessionDto): Promise<{ response: string; usage: any }> {
    const { messages, subject, gradeLevel, language = 'ar', studentName } = dto

    const isArabic = language === 'ar'
    const systemPrompt = isArabic
      ? this.buildArabicSystemPrompt(subject, gradeLevel, studentName)
      : this.buildEnglishSystemPrompt(subject, gradeLevel, studentName)

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    })

    const textContent = response.content.find((c) => c.type === 'text')
    return {
      response: textContent ? textContent.text : '',
      usage: response.usage,
    }
  }

  private buildArabicSystemPrompt(subject?: string, gradeLevel?: string, studentName?: string): string {
    return `أنت مدرس ذكاء اصطناعي ودود ومتعاطف في منظومة EduCore للتعلم الإلكتروني.

${studentName ? `اسم الطالب: ${studentName}` : ''}
${subject ? `المادة الدراسية: ${subject}` : ''}
${gradeLevel ? `المرحلة الدراسية: ${gradeLevel}` : ''}

قواعد مهمة:
- تحدث دائماً باللغة العربية الفصحى البسيطة المناسبة لعمر الطالب
- كن صبوراً ومشجعاً دائماً
- اشرح المفاهيم بأمثلة من الحياة اليومية العربية
- لا تحل الواجبات بشكل مباشر، بل وجّه الطالب للتفكير والاكتشاف
- استخدم الرموز التعبيرية باعتدال لجعل التعلم ممتعاً
- إذا كان السؤال خارج نطاق المادة، أعد التركيز برفق على المادة الدراسية
- قدم تشجيعاً إيجابياً بعد كل إجابة صحيحة`
  }

  private buildEnglishSystemPrompt(subject?: string, gradeLevel?: string, studentName?: string): string {
    return `You are a friendly and empathetic AI tutor in the EduCore Learning Management System.

${studentName ? `Student name: ${studentName}` : ''}
${subject ? `Subject: ${subject}` : ''}
${gradeLevel ? `Grade level: ${gradeLevel}` : ''}

Important rules:
- Always use clear, age-appropriate English
- Be patient and encouraging at all times
- Explain concepts with relatable real-world examples
- Guide students to think and discover, don't just give answers to homework
- Use emojis occasionally to make learning fun
- If the question is off-topic, gently redirect to the subject matter
- Give positive reinforcement after correct answers`
  }

  // ── Lesson Plan Generator ─────────────────────────────────────────────────────

  async generateLessonPlan(dto: LessonPlanDto): Promise<string> {
    const isArabic = dto.language === 'ar'

    const prompt = isArabic
      ? `أنشئ خطة درس مفصلة ومنظمة للمعلومات التالية:
        المادة: ${dto.subject}
        الموضوع: ${dto.topic}
        المرحلة الدراسية: ${dto.gradeLevel}
        مدة الحصة: ${dto.duration} دقيقة
        ${dto.curriculum ? `المنهج الدراسي: ${dto.curriculum}` : ''}
        ${dto.learningObjectives?.length ? `أهداف التعلم: ${dto.learningObjectives.join('، ')}` : ''}

        يجب أن تتضمن خطة الدرس:
        - الأهداف التعليمية (SMART)
        - المواد والأدوات المطلوبة
        - التمهيد والتهيئة (5 دقائق)
        - العرض والشرح مع أمثلة
        - التطبيق والأنشطة التفاعلية
        - التقييم والتغذية الراجعة
        - الواجب المنزلي
        - ملاحظات للمعلم`
      : `Create a detailed and structured lesson plan for the following:
        Subject: ${dto.subject}
        Topic: ${dto.topic}
        Grade Level: ${dto.gradeLevel}
        Duration: ${dto.duration} minutes
        ${dto.curriculum ? `Curriculum: ${dto.curriculum}` : ''}
        ${dto.learningObjectives?.length ? `Learning Objectives: ${dto.learningObjectives.join(', ')}` : ''}

        Include: SMART objectives, materials needed, introduction/hook (5 min),
        main instruction with examples, interactive activities, assessment, homework, teacher notes`

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const textContent = response.content.find((c) => c.type === 'text')
    return textContent ? textContent.text : ''
  }

  // ── Quiz Generator ────────────────────────────────────────────────────────────

  async generateQuizQuestions(dto: QuizGeneratorDto): Promise<any[]> {
    const isArabic = dto.language === 'ar'
    const types = dto.questionTypes?.join(', ') || 'multiple choice, true/false, short answer'

    const prompt = isArabic
      ? `أنشئ ${dto.questionCount} سؤالاً متنوعاً لاختبار في المادة التالية:
        المادة: ${dto.subject}
        الموضوع: ${dto.topic}
        المرحلة: ${dto.gradeLevel}
        مستوى الصعوبة: ${dto.difficulty || 'MEDIUM'}
        أنواع الأسئلة: ${types}

        أرجع النتيجة بتنسيق JSON كمصفوفة من الأسئلة بالشكل التالي:
        [{"type": "MULTIPLE_CHOICE", "text": "نص السؤال", "options": [{"text": "أ", "isCorrect": false}, ...], "correctAnswer": "text", "explanation": "شرح الإجابة", "points": 1}]`
      : `Generate ${dto.questionCount} diverse questions for a quiz on:
        Subject: ${dto.subject}, Topic: ${dto.topic}, Grade: ${dto.gradeLevel}
        Difficulty: ${dto.difficulty || 'MEDIUM'}, Types: ${types}

        Return JSON array: [{"type": "MULTIPLE_CHOICE", "text": "question", "options": [{"text": "A", "isCorrect": false}...], "correctAnswer": "text", "explanation": "explanation", "points": 1}]`

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const textContent = response.content.find((c) => c.type === 'text')
    if (!textContent) return []

    try {
      const jsonMatch = textContent.text.match(/\[[\s\S]*\]/)
      return jsonMatch ? JSON.parse(jsonMatch[0]) : []
    } catch {
      this.logger.error('Failed to parse AI quiz response')
      return []
    }
  }

  // ── Feedback Generator ────────────────────────────────────────────────────────

  async generateSubmissionFeedback(data: {
    assignmentTitle: string
    submissionText: string
    maxPoints: number
    language?: 'ar' | 'en'
  }): Promise<{ feedback: string; suggestedScore: number }> {
    const isArabic = data.language === 'ar'

    const prompt = isArabic
      ? `راجع هذا التسليم للواجب وقدم تغذية راجعة بنّاءة باللغة العربية:
        عنوان الواجب: ${data.assignmentTitle}
        إجابة الطالب: ${data.submissionText}
        الدرجة القصوى: ${data.maxPoints}

        قدم: تقييماً شاملاً، نقاط القوة، مجالات التحسين، ودرجة مقترحة (رقم فقط في النهاية).
        اكتب JSON: {"feedback": "...", "suggestedScore": number}`
      : `Review this assignment submission and provide constructive feedback:
        Assignment: ${data.assignmentTitle}
        Student Response: ${data.submissionText}
        Max Points: ${data.maxPoints}

        Provide: comprehensive assessment, strengths, areas for improvement, and suggested score.
        Return JSON: {"feedback": "...", "suggestedScore": number}`

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const textContent = response.content.find((c) => c.type === 'text')
    if (!textContent) return { feedback: '', suggestedScore: 0 }

    try {
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { feedback: textContent.text, suggestedScore: 0 }
    } catch {
      return { feedback: textContent.text, suggestedScore: 0 }
    }
  }
}
