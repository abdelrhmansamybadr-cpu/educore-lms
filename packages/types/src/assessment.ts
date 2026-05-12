export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  MULTIPLE_RESPONSE = 'MULTIPLE_RESPONSE',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  ESSAY = 'ESSAY',
  FILL_BLANK = 'FILL_BLANK',
  MATCHING = 'MATCHING',
  ORDERING = 'ORDERING',
  DRAG_DROP = 'DRAG_DROP',
  HOTSPOT = 'HOTSPOT',
  MATH = 'MATH',
  CODE = 'CODE',
  AUDIO_RESPONSE = 'AUDIO_RESPONSE',
  FILE_UPLOAD = 'FILE_UPLOAD',
}

export interface Quiz {
  id: string
  courseId: string
  title: string
  titleAr?: string
  instructions?: string
  instructionsAr?: string
  timeLimitMinutes?: number
  maxAttempts: number
  passingScore?: number
  randomizeQuestions: boolean
  randomizeAnswers: boolean
  showOneAtATime: boolean
  allowBacktrack: boolean
  isPublished: boolean
  availableFrom?: Date
  availableUntil?: Date
  questions: Question[]
}

export interface Question {
  id: string
  quizId?: string
  bankId?: string
  type: QuestionType
  text: string
  textAr?: string
  imageUrl?: string
  points: number
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  tags: string[]
  options?: QuestionOption[]
  correctAnswer?: string | string[]
  explanation?: string
  explanationAr?: string
}

export interface QuestionOption {
  id: string
  text: string
  textAr?: string
  isCorrect: boolean
  order: number
}

export interface QuizAttempt {
  id: string
  quizId: string
  studentId: string
  startedAt: Date
  submittedAt?: Date
  score?: number
  percentage?: number
  isPassed?: boolean
  answers: AttemptAnswer[]
}

export interface AttemptAnswer {
  id: string
  attemptId: string
  questionId: string
  answer: string | string[]
  isCorrect?: boolean
  pointsEarned?: number
  aiScore?: number
  teacherScore?: number
}

export interface Assignment {
  id: string
  courseId: string
  title: string
  titleAr?: string
  instructions: string
  instructionsAr?: string
  type: 'FILE_UPLOAD' | 'TEXT' | 'VIDEO' | 'AUDIO' | 'LINK' | 'MIXED'
  maxPoints: number
  dueDate: Date
  allowLate: boolean
  latePenaltyPercent?: number
  maxAttempts: number
  isGroupWork: boolean
  isPeerReview: boolean
  isAnonymousGrading: boolean
  rubricId?: string
}

export interface Submission {
  id: string
  assignmentId: string
  studentId: string
  submittedAt: Date
  isLate: boolean
  files?: string[]
  textContent?: string
  linkUrl?: string
  score?: number
  feedback?: string
  feedbackAudioUrl?: string
  similarityPercent?: number
  gradedAt?: Date
  gradedById?: string
}
