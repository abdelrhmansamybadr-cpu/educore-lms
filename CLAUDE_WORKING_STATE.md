# CLAUDE WORKING STATE FILE
# This file is for Claude AI to track exact progress.
# If context resets or a new Claude session starts — READ THIS FILE FIRST.
# Update this file every time a task is completed.

## STATUS: PHASES 21-29 COMPLETE — SPECIALIST MODULES DONE (Session 7)

## COMPLETED IN SESSION 7 (Phases 21-29)

### Phase 21: HR Module ✅
- `apps/api/src/modules/hr/` — HrService + HrController + HrModule (staff directory, leave management, contracts, performance reviews)
- `apps/web/.../admin/hr/page.tsx` — Staff directory with search, leave approval, contracts list, review creation
- Prisma: StaffProfile, LeaveRequest, StaffContract, PerformanceReview models + enums
- Sidebar: Added "HR" to admin management section

### Phase 22: Canteen Module ✅
- `apps/api/src/modules/canteen/` — CanteenService + CanteenController + CanteenModule
- `apps/web/.../admin/canteen/page.tsx` — Menu management (add/toggle), order management (view/update status), daily stats
- Prisma: CanteenItem, CanteenOrder, CanteenOrderItem models
- Sidebar: Added "Canteen" to admin management section

### Phase 23: Store/Inventory Module ✅
- `apps/api/src/modules/store/` — StoreService + StoreController + StoreModule
- `apps/web/.../admin/store/page.tsx` — Inventory list with low-stock alerts, stock IN/OUT/ADJUSTMENT, movement history
- Prisma: StoreItem, StockMovement models
- Sidebar: Added "Store" to admin management section

### Phase 24: Admission Module ✅
- `apps/api/src/modules/admission/` — AdmissionService + AdmissionController + AdmissionModule (uses existing AdmissionApplication model)
- `apps/web/.../admin/admission/page.tsx` — Full pipeline: create, review, update status with color-coded kanban-like view
- Sidebar: Added "Admission" to admin management section

### Phase 25: Receptionist Page ✅
- `apps/web/.../admin/receptionist/page.tsx` — Local visitor log (check-in/out), recent admission applications view

### Phase 26: Counselor Dashboard ✅
- `apps/web/.../counselor/page.tsx` — At-risk students from analytics API + flagged mental health check-ins
- `apps/web/.../counselor/layout.tsx` — Layout with Sidebar
- Sidebar: Added "counselor" role nav section

### Phase 29: Boarding/Matron Page ✅
- `apps/web/.../admin/boarding/page.tsx` — Room occupancy grid, health visits from nurse API, incident tab stub
- Sidebar: Added "Boarding" to admin management section

### Schema additions (all validated):
- HR enums: LeaveType, LeaveStatus, ContractType, ContractStatus
- Canteen enums: OrderStatus
- Store enums: StockMovementType
- New models: StaffProfile, LeaveRequest, StaffContract, PerformanceReview, CanteenItem, CanteenOrder, CanteenOrderItem, StoreItem, StockMovement

### IMPORTANT: Run after stopping dev server:
```bash
pnpm db:generate
pnpm db:migrate  # name: "add_hr_canteen_store_modules"
```

## LAST COMPLETED SESSION (Session 2)
- Built super-admin module end-to-end: dashboard, schools, users pages + backend service/controller
- Added `super-admin` role navigation to Sidebar.tsx
- Expanded events, health, transport backend services with full CRUD + registrations/stats
- Added missing Prisma models: EventRegistration, MentalHealthCheckIn, BusLocation
- Added schema relations: SchoolEvent→EventRegistration, User→EventRegistrations/MentalHealthCheckIns/OrganizerEvents, BusRoute→BusLocation/Driver
- Fixed parent controller: `@CurrentUser('sub')` → `@CurrentUser('id')`
- Fixed student course player: correct API endpoints for progress tracking
- Added `getCourseProgress` method to courses service
- Added `GET /courses/:id/my-progress` endpoint
- Created super-admin settings page

## PHASES COMPLETED

### Phase 1-2: Planning ✅
### Phase 3: Backend (all NestJS modules) ✅ + expanded
### Phase 4: Frontend Foundation ✅
### Phase 5: Frontend Pages ✅
### Phase 6: Super Admin + Backend expansion ✅

**ALL PAGES BUILT:**
- Super Admin: dashboard, schools, users, settings
- Admin: dashboard, users, finance, tickets, events, health, library, transport, devices, settings
- Teacher: dashboard, courses, courses/[id] builder, attendance, gradebook, quizzes, live-classes, assignments, announcements, ai-planner
- Student: dashboard, courses, courses/[id] viewer, ai-tutor, grades, assignments, quizzes, attendance, library, gamification, live-classes
- Parent: dashboard, children, children/[id], grades, attendance, finance, announcements
- Shared: messaging (real-time Socket.io), notifications

## IMPORTANT SCHEMA CORRECTIONS (READ BEFORE WRITING SERVICES)
- `Lesson`: `contentType` (not `type`), `estimatedMinutes` (not `duration`), `content: Json` (required)
- `Course`: NO `slug`, NO `gradeLevel`, NO `language`, NO `academicYearId`
- `Grade`: NO `schoolId`, NO `type` field
- `Assignment`: `maxPoints` (not `maxScore`), `instructions` (required, not `description`)
- `Enrollment`: NO `schoolId`
- `ParentStudentLink`: NO `schoolId`
- `Subject`: no unique constraint → use `findFirst` not `upsert`
- `AcademicYear` unique: `@@unique([schoolId, name])` → key is `schoolId_name`
- `Attendance`: unique `[studentId, courseId, date, period]`, NO `schoolId`
- Messages: conversation-based model
- Notification: `isRead: Boolean` (not `readAt`)
- `HealthVisit`: uses `complaint` (not `symptoms`), has `treatment`, `temperature`, `sentHome`, `parentNotified`
- `SchoolEvent`: `requiresRsvp`, `requiresRegistration`, `isPublic`, `maxAttendees`, `organizerId`, `type` (String)
- `EventRegistration`: new model (added in session 2)
- `MentalHealthCheckIn`: new model (added in session 2)
- `BusLocation`: new model (added in session 2)

## FILES CHANGED IN SESSION 2
- `apps/api/src/modules/super-admin/super-admin.service.ts` — new full service
- `apps/api/src/modules/super-admin/super-admin.controller.ts` — new controller + PATCH users endpoint
- `apps/api/src/modules/super-admin/super-admin.module.ts` — new module
- `apps/api/src/app.module.ts` — added SuperAdminModule import
- `apps/api/src/modules/events/events.service.ts` — expanded with registrations, stats
- `apps/api/src/modules/events/events.controller.ts` — added registration, attendance endpoints
- `apps/api/src/modules/health/health.service.ts` — expanded with dashboard stats, mental health
- `apps/api/src/modules/health/health.controller.ts` — added dashboard, visit notification, mental health
- `apps/api/src/modules/transport/transport.service.ts` — expanded with GPS, stops, driver, stats
- `apps/api/src/modules/transport/transport.controller.ts` — added all new endpoints
- `apps/api/src/modules/parent/parent.controller.ts` — fixed @CurrentUser('sub') → ('id')
- `apps/api/src/modules/courses/courses.service.ts` — added getCourseProgress
- `apps/api/src/modules/courses/courses.controller.ts` — added GET courses/:id/my-progress
- `prisma/schema.prisma` — added EventRegistration, MentalHealthCheckIn, BusLocation models + relations
- `apps/web/src/app/[locale]/super-admin/layout.tsx` — new layout
- `apps/web/src/app/[locale]/super-admin/dashboard/page.tsx` — new dashboard
- `apps/web/src/app/[locale]/super-admin/schools/page.tsx` — new schools management
- `apps/web/src/app/[locale]/super-admin/users/page.tsx` — new users management
- `apps/web/src/app/[locale]/super-admin/settings/page.tsx` — new settings page
- `apps/web/src/components/layout/Sidebar.tsx` — added super-admin nav sections
- `apps/web/src/app/[locale]/student/courses/[id]/page.tsx` — fixed API endpoints

## TO START THE APP

### Prerequisites
1. Docker Desktop running
2. Run: `docker-compose up -d` (starts PostgreSQL + Redis)
3. Create `.env` file in `apps/api/` from `apps/api/.env.example`
   - Set DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY

### IMPORTANT: Run migration for new schema models
```bash
cd C:/Users/abdel/Desktop/LMS
pnpm db:generate
pnpm db:migrate
```

### Start
```bash
pnpm dev
```

### URLs
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- API Docs: http://localhost:4000/api/docs

### Test Credentials
- Super Admin: superadmin@demo.educore.app / Demo@1234
- Admin:   admin@demo.educore.app / Demo@1234
- Teacher: teacher@demo.educore.app / Demo@1234
- Student: student@demo.educore.app / Demo@1234
- Parent:  parent@demo.educore.app / Demo@1234

## FIXES MADE IN SESSION 3 (API endpoint alignment)

- `devices.service.ts` — Added `available` and `assigned` to `getStats()` (frontend needed these)
- `users.service.ts` — Added `remove()` method (DELETE user)
- `users.controller.ts` — Added `DELETE /users/:id` endpoint; removed unused `UseGuards`/`ParseUUIDPipe` imports
- `attendance.service.ts` — Added `getCourseStudents(courseId)` and `getCourseAttendanceByDate(courseId, date?)`
- `attendance.controller.ts` — Added `GET /attendance/course/:courseId/students` and `GET /attendance/course/:courseId`
- `parent.service.ts` — Added `getChildrenInvoices(parentId)` (looks up children via ParentStudentLink, then their invoices)
- `parent.controller.ts` — Added `GET /parent/invoices` endpoint
- `apps/web/parent/dashboard/page.tsx` — Fixed invoice query from restricted `/finance/invoices?status=UNPAID` → `/parent/invoices`
- `apps/web/parent/finance/page.tsx` — Fixed invoice query from `/finance/invoices/my` (wrong for parents) → `/parent/invoices`

## BUILT IN SESSION 6 (Phase 31: Electron Desktop App)

### Desktop App — `apps/desktop/`
- `package.json` — Electron 30 + electron-builder config (Win NSIS, Mac DMG, Linux AppImage)
- `electron.cjs` — Main process: BrowserWindow loads http://localhost:4001, system tray icon, minimize-to-tray on close, auto-retry if web not ready, window state persistence, IPC handlers, native notifications
- `preload.cjs` — Exposes `window.electronAPI`: sendNotification, updateBadge, minimize, maximize, close, platform, onFocusMessages
- Global shortcuts: `Ctrl+Shift+M` → Messages, `Ctrl+Shift+D` → Dashboard
- Run with: `cd apps/desktop && npx electron .`

### Mobile App Status
- Flutter app exists at `apps/mobile/` — fully built, connects to API at `http://10.0.2.2:4000/api`
- Run: `cd apps/mobile && flutter pub get && flutter run`
- `apps/mobile_expo_draft/` — alternative React Native/Expo draft (secondary)

## FIXES MADE IN SESSION 5 (Phase 8 Gradebook + Phase 19 Analytics)

### Gradebook Backend Extensions
- `gradebook.service.ts` — Added: `bulkSetGrades()`, `getStudentGPA()`, `getCourseGradeAnalytics()`, `getReportCard()`
- `gradebook.controller.ts` — Added: `POST /gradebook/grades/bulk`, `GET /gradebook/my-gpa`, `GET /gradebook/gpa/:studentId`, `GET /gradebook/analytics/:courseId`, `GET /gradebook/report-card/:studentId`, `GET /gradebook/my-report-card`

### Analytics Module (NEW - Phase 19)
- `analytics/analytics.service.ts` — Created with: `getSchoolOverview()`, `getAttendanceTrends()`, `getGradeDistribution()`, `getCourseEngagement()`, `getAtRiskStudents()`
- `analytics/analytics.controller.ts` — Created: `GET /analytics/overview|attendance|grades|engagement|at-risk`
- `analytics/analytics.module.ts` — Created
- `app.module.ts` — Registered AnalyticsModule

### Admin Frontend Pages (3 NEW)
- `admin/analytics/page.tsx` — KPI cards + grade distribution BarChart + top courses + at-risk students
- `admin/attendance/page.tsx` — Attendance rate KPI + 30-day LineChart + daily table + low-attendance students
- `admin/gradebook/page.tsx` — Course selector + student grades table + grade distribution mini chart

### Sidebar
- Added 3 admin nav links: Gradebook, Attendance, Analytics

## FIXES MADE IN SESSION 4 (XP Gamification Hooks)

- `gamification.module.ts` — Added `exports: [GamificationService]`
- `courses.module.ts` — Imported `GamificationModule`
- `quizzes.module.ts` — Imported `GamificationModule`
- `assignments.module.ts` — Imported `GamificationModule`
- `courses.service.ts` — Injected `GamificationService`; awards **10 XP** on first lesson completion in `updateLessonProgress()`
- `quizzes.service.ts` — Injected `GamificationService`; awards **20 XP** on quiz submit + **10 XP bonus** if passed, in `submitAttempt()`
- `assignments.service.ts` — Injected `GamificationService`; awards **15 XP** on first assignment submission in `submit()`
- `prisma/seed.ts` — Added 9 default badges with `pointsRequired` thresholds (10→1000 XP)
- Badge auto-award: `GamificationService.checkAndAwardBadges()` runs after every `addPoints()` call and awards all badges where `pointsRequired ≤ totalPoints`

## REMAINING WORK (Phase 7+)

### Mobile App (Flutter/React Native — not started):
- See Phase 30 in the plan

### Desktop App (Electron — not started):
- See Phase 31 in the plan

### CI/CD (not started):
- See Phase 33 in the plan

### Nice-to-have additional backend:
- Gamification: XP awarding on lesson completion, quiz completion
- Finance: payment gateway webhooks (Stripe/Paymob)
- Notifications: push notification delivery via FCM
- AI: streaming quiz generation, AI grading endpoints
