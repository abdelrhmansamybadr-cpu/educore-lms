import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { ScheduleModule } from '@nestjs/schedule'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { SchoolsModule } from './modules/schools/schools.module'
import { OnboardingModule } from './modules/onboarding/onboarding.module'
import { CoursesModule } from './modules/courses/courses.module'
import { AssignmentsModule } from './modules/assignments/assignments.module'
import { QuizzesModule } from './modules/quizzes/quizzes.module'
import { GradebookModule } from './modules/gradebook/gradebook.module'
import { AttendanceModule } from './modules/attendance/attendance.module'
import { MessagingModule } from './modules/messaging/messaging.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { FinanceModule } from './modules/finance/finance.module'
import { StorageModule } from './modules/storage/storage.module'
import { EmailModule } from './modules/email/email.module'
import { AiModule } from './modules/ai/ai.module'
import { TicketsModule } from './modules/tickets/tickets.module'
import { DevicesModule } from './modules/devices/devices.module'
import { LiveClassModule } from './modules/live-class/live-class.module'
import { ParentModule } from './modules/parent/parent.module'
import { LibraryModule } from './modules/library/library.module'
import { HealthModule } from './modules/health/health.module'
import { GamificationModule } from './modules/gamification/gamification.module'
import { EventsModule } from './modules/events/events.module'
import { TransportModule } from './modules/transport/transport.module'
import { SuperAdminModule } from './modules/super-admin/super-admin.module'
import { AnalyticsModule } from './modules/analytics/analytics.module'
import { HrModule } from './modules/hr/hr.module'
import { CanteenModule } from './modules/canteen/canteen.module'
import { StoreModule } from './modules/store/store.module'
import { AdmissionModule } from './modules/admission/admission.module'
import { BoardingModule } from './modules/boarding/boarding.module'
import { ReceptionistModule } from './modules/receptionist/receptionist.module'
import { StudentAffairsModule } from './modules/student-affairs/student-affairs.module'
import { OwnerModule } from './modules/owner/owner.module'
import { RequisitionsModule } from './modules/requisitions/requisitions.module'
import { SalaryModule } from './modules/salary/salary.module'
import { ItModule } from './modules/it/it.module'
import { PrismaModule } from './prisma/prisma.module'

@Module({
  imports: [
    // Config — load .env
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Cron jobs
    ScheduleModule.forRoot(),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    SchoolsModule,
    OnboardingModule,
    CoursesModule,
    AssignmentsModule,
    QuizzesModule,
    GradebookModule,
    AttendanceModule,
    MessagingModule,
    NotificationsModule,
    FinanceModule,
    StorageModule,
    EmailModule,
    AiModule,
    TicketsModule,
    DevicesModule,
    LiveClassModule,
    ParentModule,
    LibraryModule,
    HealthModule,
    GamificationModule,
    EventsModule,
    TransportModule,
    SuperAdminModule,
    AnalyticsModule,
    HrModule,
    CanteenModule,
    StoreModule,
    AdmissionModule,
    BoardingModule,
    ReceptionistModule,
    StudentAffairsModule,
    OwnerModule,
    RequisitionsModule,
    SalaryModule,
    ItModule,
  ],
})
export class AppModule {}
