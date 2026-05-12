# EduCore LMS — Full Project Structure
# File & Folder Architecture (Frontend + Backend + Mobile + Desktop)

---

## ROOT STRUCTURE (Monorepo)

```
educore-lms/
├── apps/
│   ├── web/                    ← Next.js 14 (Website)
│   ├── api/                    ← NestJS (Backend API)
│   ├── mobile/                 ← Expo React Native (iOS + Android)
│   └── desktop/                ← Electron (Windows + Mac + Linux)
│
├── packages/
│   ├── ui/                     ← Shared React components
│   ├── types/                  ← Shared TypeScript types/interfaces
│   ├── utils/                  ← Shared utility functions
│   ├── i18n/                   ← Arabic & English translations
│   └── config/                 ← Shared ESLint, TSConfig, Tailwind
│
├── prisma/                     ← Database schema & migrations
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── docker/
│   ├── docker-compose.yml      ← Local dev (postgres + redis)
│   ├── Dockerfile.api
│   └── Dockerfile.web
│
├── docs/                       ← Project documentation
├── .github/workflows/          ← CI/CD pipelines
├── turbo.json                  ← Turborepo config
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

## FRONTEND WEB (apps/web) — Next.js 14

```
apps/web/
├── src/
│   ├── app/                        ← Next.js App Router
│   │   ├── [locale]/               ← Language prefix (ar, en)
│   │   │   ├── layout.tsx          ← Root layout with RTL/LTR
│   │   │   ├── page.tsx            ← Landing page
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   ├── forgot-password/page.tsx
│   │   │   │   ├── reset-password/page.tsx
│   │   │   │   └── verify-email/page.tsx
│   │   │   │
│   │   │   ├── super-admin/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── schools/
│   │   │   │   │   ├── page.tsx            ← All schools list
│   │   │   │   │   ├── new/page.tsx        ← Create school
│   │   │   │   │   └── [id]/page.tsx       ← School detail
│   │   │   │   ├── analytics/page.tsx
│   │   │   │   ├── subscriptions/page.tsx
│   │   │   │   └── settings/page.tsx
│   │   │   │
│   │   │   ├── admin/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── settings/
│   │   │   │   │   ├── school/page.tsx     ← School profile
│   │   │   │   │   ├── payment/page.tsx    ← Currency, gateways
│   │   │   │   │   ├── academic/page.tsx   ← Year, grades, sections
│   │   │   │   │   └── curriculum/page.tsx ← Curriculum config
│   │   │   │   ├── users/
│   │   │   │   │   ├── students/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   │   ├── [id]/page.tsx
│   │   │   │   │   │   └── import/page.tsx
│   │   │   │   │   ├── teachers/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── [id]/page.tsx
│   │   │   │   │   └── parents/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── finance/
│   │   │   │   │   ├── fees/page.tsx
│   │   │   │   │   ├── invoices/page.tsx
│   │   │   │   │   ├── payments/page.tsx
│   │   │   │   │   ├── reports/page.tsx
│   │   │   │   │   └── scholarships/page.tsx
│   │   │   │   ├── reports/page.tsx
│   │   │   │   └── announcements/page.tsx
│   │   │   │
│   │   │   ├── teacher/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── courses/
│   │   │   │   │   ├── page.tsx            ← My courses
│   │   │   │   │   ├── new/page.tsx        ← Create course
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx        ← Course overview
│   │   │   │   │       ├── builder/page.tsx ← Course builder
│   │   │   │   │       ├── students/page.tsx
│   │   │   │   │       └── analytics/page.tsx
│   │   │   │   ├── assignments/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       └── grade/page.tsx
│   │   │   │   ├── quizzes/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       └── results/page.tsx
│   │   │   │   ├── gradebook/page.tsx
│   │   │   │   ├── attendance/page.tsx
│   │   │   │   ├── live-class/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx       ← In live class room
│   │   │   │   └── messages/page.tsx
│   │   │   │
│   │   │   ├── student/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── courses/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       └── lessons/[lessonId]/page.tsx
│   │   │   │   ├── assignments/page.tsx
│   │   │   │   ├── quizzes/
│   │   │   │   │   └── [id]/take/page.tsx
│   │   │   │   ├── grades/page.tsx
│   │   │   │   ├── schedule/page.tsx
│   │   │   │   ├── messages/page.tsx
│   │   │   │   ├── ai-tutor/page.tsx
│   │   │   │   ├── portfolio/page.tsx
│   │   │   │   └── achievements/page.tsx
│   │   │   │
│   │   │   └── parent/
│   │   │       ├── layout.tsx
│   │   │       ├── dashboard/page.tsx
│   │   │       ├── grades/page.tsx
│   │   │       ├── attendance/page.tsx
│   │   │       ├── assignments/page.tsx
│   │   │       ├── messages/page.tsx
│   │   │       ├── payments/page.tsx
│   │   │       ├── bus-tracking/page.tsx
│   │   │       └── schedule/page.tsx
│   │   │
│   │   └── api/                    ← Next.js API routes (if needed)
│   │       └── auth/[...nextauth]/
│   │
│   ├── components/                 ← Page-specific components
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── course-builder/
│   │   ├── lesson-viewer/
│   │   ├── assignment/
│   │   ├── quiz/
│   │   ├── gradebook/
│   │   ├── attendance/
│   │   ├── messaging/
│   │   ├── live-class/
│   │   ├── financial/
│   │   └── shared/
│   │       ├── DataTable.tsx
│   │       ├── FileUpload.tsx
│   │       ├── RichTextEditor.tsx    ← TipTap with RTL
│   │       ├── VideoPlayer.tsx
│   │       ├── PDFViewer.tsx
│   │       ├── Charts.tsx
│   │       ├── Modal.tsx
│   │       ├── Notifications.tsx
│   │       └── LanguageToggle.tsx
│   │
│   ├── hooks/                      ← Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useCourse.ts
│   │   ├── useGradebook.ts
│   │   └── useNotifications.ts
│   │
│   ├── lib/                        ← Utilities
│   │   ├── api.ts                  ← Axios instance
│   │   ├── auth.ts                 ← Auth helpers
│   │   ├── utils.ts
│   │   └── currency.ts             ← Currency formatting
│   │
│   ├── stores/                     ← Zustand stores
│   │   ├── authStore.ts
│   │   ├── schoolStore.ts
│   │   └── uiStore.ts
│   │
│   ├── styles/
│   │   └── globals.css
│   │
│   └── middleware.ts               ← Auth + locale middleware
│
├── public/
│   ├── fonts/
│   ├── images/
│   └── icons/
│
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## BACKEND API (apps/api) — NestJS

```
apps/api/
├── src/
│   ├── main.ts                     ← Bootstrap (Swagger, CORS, pipes)
│   ├── app.module.ts               ← Root module
│   │
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── jwt.config.ts
│   │   └── s3.config.ts
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── school.decorator.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── school.guard.ts
│   │   ├── interceptors/
│   │   │   ├── transform.interceptor.ts
│   │   │   └── logging.interceptor.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── pipes/
│   │   │   └── zod-validation.pipe.ts
│   │   └── dto/
│   │       ├── pagination.dto.ts
│   │       └── response.dto.ts
│   │
│   ├── modules/
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   ├── google.strategy.ts
│   │   │   │   └── microsoft.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       ├── register.dto.ts
│   │   │       └── reset-password.dto.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── dto/
│   │   │       ├── create-user.dto.ts
│   │   │       └── update-user.dto.ts
│   │   │
│   │   ├── schools/
│   │   │   ├── schools.module.ts
│   │   │   ├── schools.controller.ts
│   │   │   ├── schools.service.ts
│   │   │   ├── school-settings.service.ts
│   │   │   └── dto/
│   │   │       ├── create-school.dto.ts
│   │   │       └── school-settings.dto.ts
│   │   │
│   │   ├── courses/
│   │   │   ├── courses.module.ts
│   │   │   ├── courses.controller.ts
│   │   │   ├── courses.service.ts
│   │   │   ├── lessons.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── assignments/
│   │   │   ├── assignments.module.ts
│   │   │   ├── assignments.controller.ts
│   │   │   ├── assignments.service.ts
│   │   │   ├── submissions.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── quizzes/
│   │   │   ├── quizzes.module.ts
│   │   │   ├── quizzes.controller.ts
│   │   │   ├── quizzes.service.ts
│   │   │   ├── questions.service.ts
│   │   │   ├── grading.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── gradebook/
│   │   │   ├── gradebook.module.ts
│   │   │   ├── gradebook.controller.ts
│   │   │   ├── gradebook.service.ts
│   │   │   └── report-card.service.ts
│   │   │
│   │   ├── attendance/
│   │   │   ├── attendance.module.ts
│   │   │   ├── attendance.controller.ts
│   │   │   └── attendance.service.ts
│   │   │
│   │   ├── messaging/
│   │   │   ├── messaging.module.ts
│   │   │   ├── messaging.controller.ts
│   │   │   ├── messaging.service.ts
│   │   │   └── messaging.gateway.ts    ← Socket.io
│   │   │
│   │   ├── notifications/
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.service.ts
│   │   │   └── push.service.ts
│   │   │
│   │   ├── live-class/
│   │   │   ├── live-class.module.ts
│   │   │   ├── live-class.controller.ts
│   │   │   └── live-class.service.ts   ← LiveKit integration
│   │   │
│   │   ├── finance/
│   │   │   ├── finance.module.ts
│   │   │   ├── finance.controller.ts
│   │   │   ├── fees.service.ts
│   │   │   ├── invoices.service.ts
│   │   │   ├── payments.service.ts
│   │   │   └── gateways/
│   │   │       ├── stripe.gateway.ts
│   │   │       ├── paymob.gateway.ts
│   │   │       ├── fawry.gateway.ts
│   │   │       └── hyperpay.gateway.ts
│   │   │
│   │   ├── library/
│   │   │   ├── library.module.ts
│   │   │   ├── library.controller.ts
│   │   │   └── library.service.ts
│   │   │
│   │   ├── health/
│   │   │   ├── health.module.ts
│   │   │   ├── health.controller.ts
│   │   │   └── health.service.ts
│   │   │
│   │   ├── transport/
│   │   │   ├── transport.module.ts
│   │   │   ├── transport.controller.ts
│   │   │   └── transport.service.ts
│   │   │
│   │   ├── ai/
│   │   │   ├── ai.module.ts
│   │   │   ├── ai.controller.ts
│   │   │   ├── tutor.service.ts        ← Claude/OpenAI API
│   │   │   └── lesson-plan.service.ts
│   │   │
│   │   ├── analytics/
│   │   │   ├── analytics.module.ts
│   │   │   ├── analytics.controller.ts
│   │   │   └── analytics.service.ts
│   │   │
│   │   ├── storage/
│   │   │   ├── storage.module.ts
│   │   │   └── storage.service.ts      ← S3 upload/download
│   │   │
│   │   └── email/
│   │       ├── email.module.ts
│   │       └── email.service.ts        ← AWS SES + React Email
│   │
│   └── jobs/                           ← BullMQ background jobs
│       ├── video-processing.job.ts
│       ├── email.job.ts
│       ├── notification.job.ts
│       └── report-generation.job.ts
│
├── test/
├── nest-cli.json
├── tsconfig.json
└── package.json
```

---

## MOBILE APP (apps/mobile) — Expo React Native

```
apps/mobile/
├── app/                            ← Expo Router (file-based)
│   ├── _layout.tsx                 ← Root layout
│   ├── index.tsx                   ← Splash/redirect
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── forgot-password.tsx
│   │   └── otp.tsx
│   ├── (student)/
│   │   ├── _layout.tsx             ← Tab navigator
│   │   ├── dashboard.tsx
│   │   ├── courses/
│   │   │   ├── index.tsx
│   │   │   └── [id]/
│   │   │       ├── index.tsx
│   │   │       └── lesson/[lessonId].tsx
│   │   ├── assignments.tsx
│   │   ├── grades.tsx
│   │   ├── messages.tsx
│   │   └── profile.tsx
│   ├── (teacher)/
│   │   ├── _layout.tsx
│   │   ├── dashboard.tsx
│   │   ├── attendance.tsx          ← QR code generator
│   │   ├── gradebook.tsx
│   │   └── messages.tsx
│   └── (parent)/
│       ├── _layout.tsx
│       ├── dashboard.tsx
│       ├── grades.tsx
│       ├── attendance.tsx
│       ├── bus-tracking.tsx        ← Map view
│       └── messages.tsx
│
├── components/
│   ├── VideoPlayer.tsx
│   ├── PDFViewer.tsx
│   ├── QRScanner.tsx
│   ├── ChatBubble.tsx
│   └── NotificationBadge.tsx
│
├── hooks/
├── lib/
│   ├── api.ts
│   └── offline.ts                  ← WatermelonDB sync
│
├── stores/
├── assets/
├── app.json
└── package.json
```

---

## DESKTOP APP (apps/desktop) — Electron

```
apps/desktop/
├── electron/
│   ├── main.ts                     ← Electron main process
│   ├── preload.ts                  ← IPC bridge
│   └── updater.ts                  ← Auto-update logic
├── renderer/                       ← Points to apps/web build
├── resources/
│   ├── icon.png
│   ├── icon.ico                    ← Windows
│   └── icon.icns                   ← macOS
├── electron-builder.config.js      ← Build config (win/mac/linux)
└── package.json
```

---

## SHARED PACKAGES

### packages/types
```
packages/types/
├── src/
│   ├── user.ts
│   ├── school.ts
│   ├── course.ts
│   ├── assignment.ts
│   ├── quiz.ts
│   ├── grade.ts
│   ├── attendance.ts
│   ├── message.ts
│   ├── finance.ts
│   └── index.ts
└── package.json
```

### packages/i18n
```
packages/i18n/
├── locales/
│   ├── ar.json                     ← Arabic translations (full)
│   └── en.json                     ← English translations (full)
└── package.json
```

### packages/ui
```
packages/ui/
├── src/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   ├── Table.tsx
│   ├── Badge.tsx
│   ├── Avatar.tsx
│   ├── Select.tsx
│   ├── Checkbox.tsx
│   ├── DatePicker.tsx
│   ├── Tabs.tsx
│   ├── Tooltip.tsx
│   ├── Toast.tsx
│   └── index.ts
└── package.json
```

---

## DATABASE SCHEMA (Prisma — Key Models)

```prisma
// Key models (simplified)

model School {
  id            String   @id @default(cuid())
  name          String
  nameAr        String?
  logo          String?
  currency      String   @default("USD")
  countryCode   String
  curriculumType CurriculumType
  language      Language @default(BILINGUAL)
  // ... settings, academic years
}

model User {
  id          String   @id @default(cuid())
  email       String   @unique
  password    String?
  role        Role
  schoolId    String
  school      School   @relation(...)
  profile     UserProfile?
  // ...
}

model Course {
  id          String   @id @default(cuid())
  title       String
  titleAr     String?
  schoolId    String
  teacherId   String
  gradeId     String
  sections    Section[]
  enrollments Enrollment[]
  // ...
}

model Lesson {
  id          String      @id @default(cuid())
  sectionId   String
  title       String
  titleAr     String?
  contentType ContentType
  content     Json        // flexible content data
  order       Int
  isPublished Boolean
  // ...
}

model Assignment {
  id          String   @id @default(cuid())
  courseId    String
  title       String
  dueDate     DateTime
  maxPoints   Float
  submissions Submission[]
  // ...
}

model Quiz {
  id          String     @id @default(cuid())
  courseId    String
  title       String
  timeLimit   Int?       // minutes
  maxAttempts Int
  questions   Question[]
  attempts    QuizAttempt[]
  // ...
}

model Grade {
  id           String   @id @default(cuid())
  studentId    String
  courseId     String
  assignmentId String?
  quizId       String?
  points       Float
  feedback     String?
  // ...
}

model Invoice {
  id          String        @id @default(cuid())
  schoolId    String
  studentId   String
  amount      Float
  currency    String
  status      PaymentStatus
  payments    Payment[]
  // ...
}

enum Role { SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT, PARENT, LIBRARIAN, NURSE, FINANCE, TRANSPORT }
enum CurriculumType { EGYPTIAN, SAUDI, AMERICAN, BRITISH, IB, CUSTOM }
enum Language { ARABIC, ENGLISH, BILINGUAL }
enum ContentType { VIDEO, PDF, TEXT, LINK, SCORM, H5P, LIVE }
enum PaymentStatus { PENDING, PARTIAL, PAID, OVERDUE, CANCELLED }
```

---

*See 05_LMS_Tasks.md for development tasks.*
*See 02_LMS_Tech_Stack.md for technology details.*
