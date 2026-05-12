export enum ContentType {
  VIDEO = 'VIDEO',
  PDF = 'PDF',
  TEXT = 'TEXT',
  LINK = 'LINK',
  AUDIO = 'AUDIO',
  SCORM = 'SCORM',
  H5P = 'H5P',
  PRESENTATION = 'PRESENTATION',
  LIVE_SESSION = 'LIVE_SESSION',
}

export interface Course {
  id: string
  schoolId: string
  teacherId: string
  subjectId: string
  gradeLevelId: string
  title: string
  titleAr?: string
  description?: string
  descriptionAr?: string
  coverImage?: string
  isPublished: boolean
  sections: CourseSection[]
  createdAt: Date
  updatedAt: Date
}

export interface CourseSection {
  id: string
  courseId: string
  title: string
  titleAr?: string
  order: number
  lessons: Lesson[]
}

export interface Lesson {
  id: string
  sectionId: string
  title: string
  titleAr?: string
  contentType: ContentType
  content: LessonContent
  order: number
  isPublished: boolean
  availableFrom?: Date
  estimatedMinutes?: number
  isRequired: boolean
}

export interface LessonContent {
  // For VIDEO
  videoUrl?: string
  videoKey?: string     // S3 key
  thumbnailUrl?: string
  duration?: number     // seconds
  // For PDF / PRESENTATION
  fileUrl?: string
  fileKey?: string
  // For TEXT
  html?: string
  htmlAr?: string
  // For LINK
  externalUrl?: string
  embedUrl?: string
  // For SCORM
  scormPath?: string
  // For LIVE_SESSION
  liveClassId?: string
}

export interface Enrollment {
  id: string
  studentId: string
  courseId: string
  enrolledAt: Date
  completedAt?: Date
  progress: number  // 0-100 percentage
}

export interface LessonProgress {
  id: string
  studentId: string
  lessonId: string
  isCompleted: boolean
  lastPosition?: number  // video position in seconds
  completedAt?: Date
}
