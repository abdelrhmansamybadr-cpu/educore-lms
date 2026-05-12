# EduCore LMS — Full Task Breakdown
# All Phases, All Modules, All Platforms

---

## HOW TO READ THIS FILE
- [ ] = Not started
- [x] = Completed
- Priority: P0=Must have, P1=Important, P2=Nice to have

---

## PHASE 0: DESIGN & PLANNING (Before any code)

### 0.1 — Design System (Figma)
- [ ] P0 Define color palette (primary, secondary, neutral, status, error)
- [ ] P0 Define typography scale (Arabic Cairo + English Inter)
- [ ] P0 Define spacing system (8px grid)
- [ ] P0 Design component library: Buttons, Inputs, Cards, Modals, Tables, Badges
- [ ] P0 Design dark mode tokens
- [ ] P0 Design Arabic RTL layout guidelines
- [ ] P0 Design mobile-first breakpoints (320, 375, 428, 768, 1024, 1280, 1440px)

### 0.2 — Screen Design (Figma)
#### Authentication
- [ ] P0 Login page (web + mobile)
- [ ] P0 Register page (school self-registration)
- [ ] P0 Forgot password page
- [ ] P0 OTP verification page
- [ ] P0 New password page

#### Super Admin
- [ ] P0 Super admin dashboard
- [ ] P0 All schools list
- [ ] P0 Create new school
- [ ] P0 School details & settings
- [ ] P0 Platform analytics
- [ ] P0 Subscription plans management

#### School Admin
- [ ] P0 School admin dashboard (stats, quick actions)
- [ ] P0 School settings (logo, name, timezone, curriculum, language, currency)
- [ ] P0 Payment gateway configuration screen
- [ ] P0 Academic year management
- [ ] P0 Grade levels & sections management
- [ ] P0 Users: Students list + add/edit/deactivate
- [ ] P0 Users: Teachers list + assign subjects/classes
- [ ] P0 Users: Parents list
- [ ] P0 School calendar
- [ ] P0 Announcements management
- [ ] P0 Reports dashboard

#### Teacher
- [ ] P0 Teacher dashboard
- [ ] P0 My classes/courses overview
- [ ] P0 Course builder (full flow)
- [ ] P0 Create lesson (content types)
- [ ] P0 Assignment creation + grading
- [ ] P0 Quiz builder (all question types)
- [ ] P0 Gradebook view
- [ ] P0 Attendance marking
- [ ] P0 Student profile view (from teacher)
- [ ] P0 Messaging center
- [ ] P0 Live class (teacher view)
- [ ] P1 Analytics per class
- [ ] P1 AI lesson plan generator UI

#### Student
- [ ] P0 Student dashboard
- [ ] P0 Course list + course detail
- [ ] P0 Lesson viewer (video, PDF, interactive)
- [ ] P0 Assignment submission
- [ ] P0 Quiz taking experience
- [ ] P0 My grades view
- [ ] P0 Calendar / schedule
- [ ] P0 Notifications center
- [ ] P0 Messages inbox
- [ ] P0 Live class (student view)
- [ ] P1 AI tutor chat interface
- [ ] P1 Portfolio page
- [ ] P1 Achievements / badges page
- [ ] P1 Study planner

#### Parent
- [ ] P0 Parent dashboard
- [ ] P0 Child selector (if multiple children)
- [ ] P0 Child grade summary
- [ ] P0 Child attendance view
- [ ] P0 Assignments tracker
- [ ] P0 Messages with teacher
- [ ] P0 Fees & payment
- [ ] P0 School announcements
- [ ] P1 Bus tracking map
- [ ] P1 Book parent-teacher meeting

#### Financial
- [ ] P0 Fee structure setup
- [ ] P0 Invoice generation
- [ ] P0 Payment tracking dashboard
- [ ] P0 Outstanding balances
- [ ] P0 Receipts

### 0.3 — Database Schema Design
- [ ] P0 Users table + profiles
- [ ] P0 Schools table + settings
- [ ] P0 Roles + permissions
- [ ] P0 Academic years, terms, grades, sections
- [ ] P0 Subjects / courses
- [ ] P0 Enrollments
- [ ] P0 Course content (sections, lessons, materials)
- [ ] P0 Assignments + submissions
- [ ] P0 Quizzes + questions + answers + attempts
- [ ] P0 Grades + gradebook
- [ ] P0 Attendance records
- [ ] P0 Messages + threads
- [ ] P0 Notifications
- [ ] P0 Files + media
- [ ] P0 Financial: fees, invoices, payments
- [ ] P1 Library: books, loans
- [ ] P1 Health: student health records, visits
- [ ] P1 Transport: routes, buses, student assignments
- [ ] P1 Events
- [ ] P1 Gamification: points, badges, achievements

### 0.4 — API Design
- [ ] P0 Document all REST endpoints (OpenAPI/Swagger)
- [ ] P0 Define authentication flow
- [ ] P0 Define file upload flow
- [ ] P0 Define WebSocket events (messaging, notifications)
- [ ] P0 Define payment webhook handling

---

## PHASE 1: PROJECT SETUP & INFRASTRUCTURE

### 1.1 — Monorepo Setup
- [ ] P0 Initialize pnpm workspace
- [ ] P0 Set up Turborepo
- [ ] P0 Create `apps/web` (Next.js 14)
- [ ] P0 Create `apps/api` (NestJS)
- [ ] P0 Create `apps/mobile` (Expo React Native)
- [ ] P0 Create `apps/desktop` (Electron)
- [ ] P0 Create `packages/ui` (shared components)
- [ ] P0 Create `packages/types` (shared TypeScript types)
- [ ] P0 Create `packages/utils` (shared utilities)
- [ ] P0 Create `packages/i18n` (Arabic + English translations)
- [ ] P0 Configure ESLint (shared config)
- [ ] P0 Configure Prettier
- [ ] P0 Configure TypeScript (shared tsconfig)
- [ ] P0 Set up Git with .gitignore
- [ ] P0 Set up Husky + commitlint + lint-staged

### 1.2 — Web App (Next.js) Setup
- [ ] P0 Install Tailwind CSS + configure RTL support
- [ ] P0 Install Shadcn/UI + customize theme
- [ ] P0 Set up next-intl (Arabic + English routing)
- [ ] P0 Configure Arabic RTL layout (`dir` toggle)
- [ ] P0 Set up TanStack Query
- [ ] P0 Set up Zustand store structure
- [ ] P0 Set up axios with interceptors (auth headers, token refresh)
- [ ] P0 Set up environment variables
- [ ] P0 Set up Next.js middleware (auth protection)
- [ ] P0 Set up Sentry

### 1.3 — API (NestJS) Setup
- [ ] P0 Initialize NestJS project
- [ ] P0 Configure environment variables (dotenv)
- [ ] P0 Set up Prisma + connect to PostgreSQL
- [ ] P0 Run initial Prisma migrations
- [ ] P0 Set up Redis connection (ioredis)
- [ ] P0 Configure Swagger (API docs)
- [ ] P0 Configure global validation pipe (class-validator)
- [ ] P0 Configure CORS
- [ ] P0 Configure rate limiting (throttler)
- [ ] P0 Set up file upload (Multer + S3)
- [ ] P0 Set up BullMQ (job queue)
- [ ] P0 Set up Socket.io gateway
- [ ] P0 Set up Sentry for backend

### 1.4 — Database Setup
- [ ] P0 Set up PostgreSQL (local Docker)
- [ ] P0 Set up Redis (local Docker)
- [ ] P0 Write Prisma schema — all models
- [ ] P0 Run migrations
- [ ] P0 Write database seed script (test data)

### 1.5 — Cloud Infrastructure (AWS)
- [ ] P0 Create AWS account + IAM user
- [ ] P0 Set up S3 bucket (file storage)
- [ ] P0 Configure CloudFront CDN
- [ ] P0 Set up SES (email)
- [ ] P0 Set up RDS PostgreSQL (production)
- [ ] P0 Set up ElastiCache Redis (production)
- [ ] P0 Configure EC2 or ECS for API deployment
- [ ] P0 Set up domain + SSL (AWS ACM)
- [ ] P1 Set up CloudWatch monitoring

### 1.6 — CI/CD
- [ ] P0 GitHub Actions: lint + type-check on PR
- [ ] P0 GitHub Actions: run tests on PR
- [ ] P0 GitHub Actions: deploy web to staging
- [ ] P0 GitHub Actions: deploy API to staging
- [ ] P1 GitHub Actions: deploy to production on tag

---

## PHASE 2: AUTHENTICATION MODULE

### 2.1 — Backend Auth API
- [ ] P0 POST /auth/register (school self-registration)
- [ ] P0 POST /auth/login (email + password)
- [ ] P0 POST /auth/refresh (refresh access token)
- [ ] P0 POST /auth/logout
- [ ] P0 POST /auth/forgot-password
- [ ] P0 POST /auth/reset-password
- [ ] P0 POST /auth/verify-email
- [ ] P0 POST /auth/login/google (OAuth)
- [ ] P0 POST /auth/login/microsoft (OAuth)
- [ ] P0 POST /auth/login/apple (OAuth)
- [ ] P0 POST /auth/otp/send
- [ ] P0 POST /auth/otp/verify
- [ ] P0 GET /auth/me (current user)
- [ ] P1 POST /auth/2fa/enable
- [ ] P1 POST /auth/2fa/verify

### 2.2 — Frontend Auth
- [ ] P0 Login page with email/password form
- [ ] P0 Google OAuth button
- [ ] P0 Microsoft OAuth button
- [ ] P0 Forgot password flow
- [ ] P0 Reset password page
- [ ] P0 Email verification page
- [ ] P0 OTP entry page
- [ ] P0 Auth token storage (httpOnly cookie)
- [ ] P0 Auto-refresh token logic
- [ ] P0 Redirect to role-based dashboard after login
- [ ] P0 Logout with token invalidation
- [ ] P1 QR code login screen (for young students)

---

## PHASE 3: SCHOOL & USER MANAGEMENT

### 3.1 — School Management API
- [ ] P0 POST /schools (create school — super admin)
- [ ] P0 GET /schools (list all — super admin)
- [ ] P0 GET /schools/:id
- [ ] P0 PATCH /schools/:id (update settings)
- [ ] P0 POST /schools/:id/logo (upload logo)
- [ ] P0 GET /schools/:id/settings (currency, payment, language, curriculum)
- [ ] P0 PATCH /schools/:id/settings
- [ ] P0 POST /schools/:id/academic-years
- [ ] P0 GET /schools/:id/academic-years
- [ ] P0 POST /schools/:id/grades
- [ ] P0 POST /schools/:id/sections
- [ ] P0 POST /schools/:id/subjects

### 3.2 — User Management API
- [ ] P0 POST /users/students (create student)
- [ ] P0 POST /users/students/bulk-import (CSV)
- [ ] P0 GET /users/students (list with filters)
- [ ] P0 GET /users/students/:id
- [ ] P0 PATCH /users/students/:id
- [ ] P0 DELETE /users/students/:id (deactivate)
- [ ] P0 POST /users/teachers
- [ ] P0 GET /users/teachers
- [ ] P0 POST /users/parents
- [ ] P0 GET /users/parents
- [ ] P0 POST /users/parents/:id/link-child (link to student)
- [ ] P0 PATCH /users/:id/role
- [ ] P0 GET /users/:id/profile

### 3.3 — Frontend School Admin
- [ ] P0 School settings form (name, logo, curriculum, language)
- [ ] P0 Currency selection + payment gateway toggles
- [ ] P0 Academic year management UI
- [ ] P0 Grades and sections management
- [ ] P0 Students: list with search, filter, pagination
- [ ] P0 Add/edit student modal
- [ ] P0 Bulk import students (CSV with validation preview)
- [ ] P0 Teachers: list with subject assignments
- [ ] P0 Add/edit teacher modal
- [ ] P0 Parents: list, link to children
- [ ] P0 User deactivate/reactivate

---

## PHASE 4: COURSE MANAGEMENT

### 4.1 — Course API
- [ ] P0 POST /courses
- [ ] P0 GET /courses (list by school)
- [ ] P0 GET /courses/:id
- [ ] P0 PATCH /courses/:id
- [ ] P0 DELETE /courses/:id
- [ ] P0 POST /courses/:id/sections
- [ ] P0 POST /courses/:id/sections/:sectionId/lessons
- [ ] P0 POST /lessons/:id/content (upload video, PDF, etc.)
- [ ] P0 PATCH /lessons/:id
- [ ] P0 DELETE /lessons/:id
- [ ] P0 POST /courses/:id/enroll/:studentId
- [ ] P0 GET /courses/:id/students (enrolled list)
- [ ] P0 GET /students/:id/courses
- [ ] P0 POST /courses/:id/clone
- [ ] P1 GET /courses/:id/analytics

### 4.2 — Frontend Course Builder (Teacher)
- [ ] P0 Course list view (teacher's courses)
- [ ] P0 Create course form (name, description, subject, grade, cover image)
- [ ] P0 Course builder: sections (drag to reorder)
- [ ] P0 Add lesson to section: choose content type
- [ ] P0 Video lesson: upload + preview player
- [ ] P0 PDF lesson: upload + embedded viewer
- [ ] P0 Text/HTML lesson: TipTap rich text editor (RTL)
- [ ] P0 Link lesson: embed external URL
- [ ] P0 Publish/draft toggle per lesson
- [ ] P0 Set lesson available date/time
- [ ] P0 Set sequential unlock rules
- [ ] P1 H5P content creation
- [ ] P1 SCORM package upload

### 4.3 — Frontend Course View (Student)
- [ ] P0 Course list (enrolled courses with progress)
- [ ] P0 Course overview page (syllabus, progress bar)
- [ ] P0 Lesson viewer: video with progress tracking
- [ ] P0 Lesson viewer: PDF reader
- [ ] P0 Lesson viewer: text content
- [ ] P0 Mark lesson complete button
- [ ] P0 Resume from last position (video)
- [ ] P0 Next/previous lesson navigation
- [ ] P0 Download resource toggle
- [ ] P1 Note-taking sidebar
- [ ] P1 Bookmark lesson

---

## PHASE 5: ASSIGNMENT MODULE

### 5.1 — Assignment API
- [ ] P0 POST /assignments
- [ ] P0 GET /assignments (by course or class)
- [ ] P0 GET /assignments/:id
- [ ] P0 PATCH /assignments/:id
- [ ] P0 DELETE /assignments/:id
- [ ] P0 POST /assignments/:id/submit (student submits)
- [ ] P0 GET /assignments/:id/submissions
- [ ] P0 GET /submissions/:id
- [ ] P0 PATCH /submissions/:id/grade (teacher grades)
- [ ] P0 POST /submissions/:id/feedback
- [ ] P1 POST /assignments/:id/rubric
- [ ] P1 GET /assignments/:id/plagiarism-report

### 5.2 — Frontend Assignments
- [ ] P0 Assignment creation form (title, instructions, type, due date, points)
- [ ] P0 File upload assignment type
- [ ] P0 Text submission assignment type
- [ ] P0 Assignment list (teacher): all submissions status
- [ ] P0 Student assignment submission form
- [ ] P0 Submission viewer (teacher): side-by-side grade entry
- [ ] P0 Grade entry + written feedback
- [ ] P0 Student: view graded assignment + feedback
- [ ] P0 Late submission indicator
- [ ] P1 Rubric builder
- [ ] P1 Audio/video feedback recording

---

## PHASE 6: QUIZ & ASSESSMENT ENGINE

### 6.1 — Quiz API
- [ ] P0 POST /quizzes
- [ ] P0 GET /quizzes/:id
- [ ] P0 PATCH /quizzes/:id
- [ ] P0 POST /quizzes/:id/questions
- [ ] P0 GET /question-banks (by school/subject)
- [ ] P0 POST /question-banks/questions
- [ ] P0 POST /quizzes/:id/start (student starts attempt)
- [ ] P0 POST /quizzes/:id/answer (student submits answer)
- [ ] P0 POST /quizzes/:id/submit (student finishes)
- [ ] P0 GET /quizzes/:id/results/:studentId
- [ ] P0 GET /quizzes/:id/analytics
- [ ] P1 POST /quizzes/:id/questions/ai-generate

### 6.2 — Frontend Quiz Builder (Teacher)
- [ ] P0 Quiz settings (title, time limit, attempts, instructions)
- [ ] P0 Question builder: Multiple Choice
- [ ] P0 Question builder: True/False
- [ ] P0 Question builder: Short Answer
- [ ] P0 Question builder: Essay
- [ ] P0 Question builder: Fill in the Blank
- [ ] P0 Question builder: Matching
- [ ] P0 Question builder: Ordering
- [ ] P1 Question builder: Drag and Drop
- [ ] P1 Question builder: Hotspot (image click)
- [ ] P1 Question builder: Math equation
- [ ] P0 Question bank browser (import from bank)
- [ ] P0 Quiz preview
- [ ] P0 Publish quiz (by date)

### 6.3 — Frontend Quiz Taking (Student)
- [ ] P0 Quiz start page (instructions, time, attempts left)
- [ ] P0 Question view — all question types
- [ ] P0 Progress indicator (question X of Y)
- [ ] P0 Timer countdown
- [ ] P0 Auto-save answers
- [ ] P0 Submit confirmation
- [ ] P0 Results page (score, percentage, review)
- [ ] P1 Review mode (see correct answers after grading)

### 6.4 — Frontend Quiz Results (Teacher)
- [ ] P0 All students results table
- [ ] P0 Item analysis (per question difficulty)
- [ ] P0 Grade distribution chart
- [ ] P0 Individual student attempt review

---

## PHASE 7: GRADEBOOK

### 7.1 — Gradebook API
- [ ] P0 GET /gradebook/:courseId (full gradebook)
- [ ] P0 PATCH /grades/:gradeId (update grade)
- [ ] P0 POST /grades/manual-entry
- [ ] P0 GET /gradebook/student/:studentId (all courses)
- [ ] P0 GET /gradebook/report-card/:studentId
- [ ] P0 POST /grade-scales (school-level configuration)
- [ ] P0 POST /grade-categories (weighted categories)
- [ ] P0 GET /gradebook/:courseId/export (CSV/Excel)

### 7.2 — Frontend Gradebook
- [ ] P0 Gradebook grid (students × assignments)
- [ ] P0 Inline grade editing
- [ ] P0 Category columns with weighted totals
- [ ] P0 Color coding (green > pass, red < fail)
- [ ] P0 Missing/late/excused indicators
- [ ] P0 Student detail row (click to expand)
- [ ] P0 Export to Excel
- [ ] P0 Report card generator (PDF with school branding)
- [ ] P1 Standards mastery gradebook view

---

## PHASE 8: ATTENDANCE MODULE

### 8.1 — Attendance API
- [ ] P0 POST /attendance (mark attendance for a class)
- [ ] P0 GET /attendance/:classId/:date
- [ ] P0 PATCH /attendance/:recordId
- [ ] P0 GET /attendance/student/:studentId (history)
- [ ] P0 GET /attendance/reports/:classId
- [ ] P0 GET /attendance/reports/:schoolId (school-wide)
- [ ] P0 POST /attendance/qr-generate (QR for class)
- [ ] P0 POST /attendance/qr-scan (student scans)

### 8.2 — Frontend Attendance
- [ ] P0 Attendance marking page (class roster, status buttons)
- [ ] P0 Bulk mark all present then adjust
- [ ] P0 QR code display for class (teacher shows QR on screen)
- [ ] P0 Student QR scan page (mobile)
- [ ] P0 Attendance calendar view (per student)
- [ ] P0 Attendance report page (statistics, trends)
- [ ] P0 Parent notification on absence (automated)
- [ ] P1 Chronic absenteeism alerts

---

## PHASE 9: MESSAGING & NOTIFICATIONS

### 9.1 — Messaging API
- [ ] P0 GET /conversations (list)
- [ ] P0 GET /conversations/:id/messages
- [ ] P0 POST /conversations/:id/messages
- [ ] P0 POST /conversations (create new)
- [ ] P0 WebSocket: message sent event
- [ ] P0 WebSocket: message received event
- [ ] P0 WebSocket: read receipt event
- [ ] P0 POST /announcements
- [ ] P0 GET /announcements (by school/grade/class)

### 9.2 — Notification API
- [ ] P0 GET /notifications (user's notifications)
- [ ] P0 PATCH /notifications/:id/read
- [ ] P0 PATCH /notifications/read-all
- [ ] P0 POST /notifications/push/subscribe (FCM token)
- [ ] P0 Fire push notification on: new message, grade posted, assignment due, attendance alert

### 9.3 — Frontend Messaging
- [ ] P0 Inbox list view (conversations)
- [ ] P0 Chat view (messages with bubble UI, RTL)
- [ ] P0 New conversation modal (search users)
- [ ] P0 File attachment in messages
- [ ] P0 Read receipt indicators
- [ ] P0 Notification bell (popover with list)
- [ ] P0 Announcements feed (school/grade/class)

---

## PHASE 10: LIVE CLASS MODULE

### 10.1 — Live Class API
- [ ] P0 POST /live-classes (schedule a class)
- [ ] P0 GET /live-classes (upcoming for user)
- [ ] P0 POST /live-classes/:id/join (get access token)
- [ ] P0 POST /live-classes/:id/end
- [ ] P0 GET /live-classes/:id/recording
- [ ] P0 POST /live-classes/:id/attendance (auto from join events)

### 10.2 — Frontend Live Class
- [ ] P0 Schedule live class form (title, date, time, class)
- [ ] P0 Upcoming classes list (student and teacher)
- [ ] P0 Join class button (enters video room)
- [ ] P0 Video room: camera, mic, screen share controls
- [ ] P0 Video room: participant list
- [ ] P0 Video room: chat panel
- [ ] P0 Video room: raise hand
- [ ] P0 Video room: shared whiteboard (Excalidraw)
- [ ] P0 Video room: end class (teacher)
- [ ] P0 Post-class: recording available in course
- [ ] P1 Breakout rooms
- [ ] P1 In-class polling
- [ ] P1 In-class quiz

---

## PHASE 11: FINANCIAL MODULE

### 11.1 — Financial API
- [ ] P0 POST /fee-structures (define fee types per school)
- [ ] P0 POST /invoices (generate invoice for student)
- [ ] P0 POST /invoices/bulk-generate (all students in grade)
- [ ] P0 GET /invoices/:id
- [ ] P0 GET /invoices?studentId= (student's invoices)
- [ ] P0 POST /payments/initiate (call payment gateway)
- [ ] P0 POST /payments/webhook (receive gateway callback)
- [ ] P0 GET /payments/:id/receipt
- [ ] P0 GET /financial/reports/collections
- [ ] P0 GET /financial/reports/outstanding
- [ ] P0 POST /financial/scholarships
- [ ] P0 POST /financial/discounts

### 11.2 — Frontend Financial
- [ ] P0 Fee structure setup (admin)
- [ ] P0 Bulk invoice generation
- [ ] P0 Invoice list with status (paid/partial/unpaid)
- [ ] P0 Invoice detail + payment button
- [ ] P0 Payment flow (gateway redirect or embedded)
- [ ] P0 Receipt page (PDF download)
- [ ] P0 Outstanding balances report
- [ ] P0 Daily collections summary
- [ ] P1 Installment plan setup
- [ ] P1 Scholarship application and approval

---

## PHASE 12: PARENT PORTAL

### 12.1 — Frontend Parent
- [ ] P0 Parent dashboard (child overview)
- [ ] P0 Child selector dropdown
- [ ] P0 Grades page (all subjects, current grades)
- [ ] P0 Attendance page (calendar, statistics)
- [ ] P0 Homework tracker (due, submitted, late)
- [ ] P0 Messages with teacher
- [ ] P0 Fee payment portal
- [ ] P0 Announcements / school news
- [ ] P1 Bus tracking map (real-time)
- [ ] P1 Parent-teacher conference booking

---

## PHASE 13: AI FEATURES

### 13.1 — AI API
- [ ] P1 POST /ai/tutor/chat (student AI chat)
- [ ] P1 POST /ai/lesson-plan/generate
- [ ] P1 POST /ai/quiz/generate-questions
- [ ] P1 POST /ai/essay/feedback
- [ ] P1 POST /ai/plagiarism/check
- [ ] P1 GET /ai/at-risk-students/:classId

### 13.2 — Frontend AI
- [ ] P1 AI Study Buddy chat widget (student)
- [ ] P1 Language toggle in AI chat (Arabic/English)
- [ ] P1 AI lesson plan generator form (teacher)
- [ ] P1 AI quiz question generator (inside quiz builder)
- [ ] P1 At-risk students panel (teacher/admin)

---

## PHASE 14: MOBILE APP (EXPO REACT NATIVE)

- [ ] P0 Set up Expo project with Expo Router
- [ ] P0 Configure NativeWind (Tailwind for RN)
- [ ] P0 Configure RTL support (I18nManager)
- [ ] P0 Auth flow (login, OTP, forgot password)
- [ ] P0 Student dashboard
- [ ] P0 Course list + course viewer
- [ ] P0 Lesson viewer (video, PDF, text)
- [ ] P0 Assignment submission
- [ ] P0 Quiz taking
- [ ] P0 Grades view
- [ ] P0 Messages / chat
- [ ] P0 Notifications
- [ ] P0 Parent dashboard + grades + attendance
- [ ] P0 Teacher attendance marking (with QR generator)
- [ ] P0 Teacher gradebook
- [ ] P0 Push notifications (FCM + APNs)
- [ ] P0 Offline mode (WatermelonDB sync)
- [ ] P0 iOS App Store submission
- [ ] P0 Android Play Store submission
- [ ] P1 Bus tracking map (parent)
- [ ] P1 AI tutor chat

---

## PHASE 15: DESKTOP APP (ELECTRON)

- [ ] P0 Set up Electron project
- [ ] P0 Embed Next.js web app in Electron
- [ ] P0 Configure auto-updater
- [ ] P0 Windows installer (.exe, NSIS)
- [ ] P0 macOS installer (.dmg, code-signed)
- [ ] P0 Linux AppImage
- [ ] P0 Deep link handling (open links from browser to desktop)
- [ ] P0 System tray (notifications)
- [ ] P0 File system access for downloads

---

## PHASE 16: ADVANCED MODULES

### Library Module
- [ ] P2 Book catalog (add, edit, search)
- [ ] P2 Digital book viewer
- [ ] P2 Loan management (check out, return)
- [ ] P2 Overdue alerts
- [ ] P2 Student loan history
- [ ] P2 QR/barcode scan for physical books

### Health/Nurse Module
- [ ] P2 Student health profile
- [ ] P2 Visit log
- [ ] P2 Incident report (instant parent notification)
- [ ] P2 Medication records
- [ ] P2 Immunization records

### Transportation Module
- [ ] P2 Bus route management
- [ ] P2 Student-bus assignment
- [ ] P2 Driver app (simple)
- [ ] P2 Real-time GPS tracking integration
- [ ] P2 ETA notification to parents

### Events Module
- [ ] P2 Event creation
- [ ] P2 RSVP system
- [ ] P2 Digital permission slip
- [ ] P2 Event ticketing with payment

### Gamification Module
- [ ] P1 Points engine
- [ ] P1 Badge award system
- [ ] P1 Leaderboard
- [ ] P1 Achievement certificates (PDF)
- [ ] P1 Streak tracking

---

## TESTING CHECKLIST

- [ ] P0 Unit tests: Auth module (>80% coverage)
- [ ] P0 Unit tests: Gradebook calculations
- [ ] P0 Unit tests: Quiz scoring
- [ ] P0 Integration tests: API endpoints
- [ ] P0 E2E tests: Login → course → assignment submit
- [ ] P0 E2E tests: Teacher → create quiz → student takes → grade
- [ ] P0 E2E tests: Admin → create school → create users
- [ ] P0 RTL layout testing (Arabic)
- [ ] P0 Mobile responsive testing (320px–1440px)
- [ ] P0 Performance: Lighthouse score > 85
- [ ] P0 Accessibility: axe-core checks pass
- [ ] P0 Security: OWASP top 10 review
- [ ] P0 Load testing: 500 concurrent users

---

## LAUNCH CHECKLIST

- [ ] P0 Domain configured + SSL working
- [ ] P0 Production environment variables set
- [ ] P0 Database backup automated
- [ ] P0 Error monitoring (Sentry) active
- [ ] P0 Performance monitoring active
- [ ] P0 CDN configured for static assets
- [ ] P0 GDPR privacy policy page
- [ ] P0 Terms of service page
- [ ] P0 Cookie consent banner
- [ ] P0 Admin panel secured (IP restriction option)
- [ ] P0 Rate limiting verified
- [ ] P0 File upload size limits enforced
- [ ] P0 Mobile apps submitted to stores
- [ ] P0 Desktop installers published

---

*Total tasks: ~400+ | Expected timeline: 12-18 months for full platform*
*Start with Phase 0 (Design) before writing any code.*
