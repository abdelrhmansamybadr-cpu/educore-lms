import 'package:go_router/go_router.dart';
import '../features/auth/providers/auth_provider.dart';
import '../features/auth/screens/splash_screen.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/dashboard/screens/student_dashboard_screen.dart';
import '../features/dashboard/screens/teacher_dashboard_screen.dart';
import '../features/dashboard/screens/parent_dashboard_screen.dart';
import '../features/dashboard/screens/admin_dashboard_screen.dart';
import '../features/courses/screens/courses_screen.dart';
import '../features/courses/screens/course_detail_screen.dart';
import '../features/assignments/screens/assignments_screen.dart';
import '../features/assignments/screens/assignment_detail_screen.dart';
import '../features/grades/screens/grades_screen.dart';
import '../features/quizzes/screens/quizzes_screen.dart';
import '../features/attendance/screens/attendance_screen.dart';
import '../features/notifications/screens/notifications_screen.dart';
import '../features/profile/screens/profile_screen.dart';
import '../features/ai_tutor/screens/ai_tutor_screen.dart';
import '../features/library/screens/library_screen.dart';
import '../features/gamification/screens/gamification_screen.dart';
import '../features/messaging/screens/inbox_screen.dart';
import '../features/messaging/screens/chat_screen.dart';
import '../features/events/screens/events_screen.dart';
import '../features/schedule/screens/schedule_screen.dart';
import '../features/teacher/screens/take_attendance_screen.dart';
import '../features/teacher/screens/submissions_screen.dart';
import '../features/parent/screens/children_screen.dart';
import '../features/parent/screens/child_detail_screen.dart';
import '../features/admin/screens/users_screen.dart';
import '../features/admin/screens/events_manage_screen.dart';
import '../features/settings/screens/settings_screen.dart';
import '../features/quizzes/screens/quiz_attempt_screen.dart';
import '../features/finance/screens/fees_screen.dart';
import '../features/transport/screens/transport_screen.dart';
import '../features/courses/screens/lesson_screen.dart';
import '../features/live_classes/screens/live_classes_screen.dart';
import '../features/analytics/screens/analytics_screen.dart';
import '../features/teacher/screens/gradebook_screen.dart';
import '../features/hr/screens/hr_screen.dart';
import '../features/canteen/screens/canteen_screen.dart';
import '../features/store/screens/store_screen.dart';
import '../features/admission/screens/admission_screen.dart';
import '../features/boarding/screens/boarding_screen.dart';
import '../features/counselor/screens/counselor_screen.dart';
import '../features/receptionist/screens/receptionist_screen.dart';
import '../features/admin/screens/super_admin_screen.dart';

class AppRouter {
  final AuthProvider _authProvider;

  AppRouter(this._authProvider);

  late final router = GoRouter(
    initialLocation: '/splash',
    refreshListenable: _authProvider,
    redirect: (context, state) {
      final isAuth = _authProvider.isAuthenticated;
      final loc = state.matchedLocation;

      if (loc == '/splash') return null;
      if (!isAuth && loc != '/login') return '/login';
      if (isAuth && loc == '/login') {
        return _dashboardRoute(_authProvider.user?.role ?? '');
      }
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (c, s) => const SplashScreen()),
      GoRoute(path: '/login', builder: (c, s) => const LoginScreen()),

      // Student routes
      GoRoute(path: '/student', builder: (c, s) => const StudentDashboardScreen()),
      GoRoute(path: '/student/courses', builder: (c, s) => const CoursesScreen()),
      GoRoute(
        path: '/student/courses/:id',
        builder: (c, s) => CourseDetailScreen(courseId: s.pathParameters['id']!),
      ),
      GoRoute(path: '/student/assignments', builder: (c, s) => const AssignmentsScreen()),
      GoRoute(
        path: '/student/assignments/:id',
        builder: (c, s) => AssignmentDetailScreen(assignmentId: s.pathParameters['id']!),
      ),
      GoRoute(path: '/student/grades', builder: (c, s) => const GradesScreen()),
      GoRoute(path: '/student/quizzes', builder: (c, s) => const QuizzesScreen()),
      GoRoute(path: '/student/ai-tutor', builder: (c, s) => const AiTutorScreen()),
      GoRoute(path: '/student/library', builder: (c, s) => const LibraryScreen()),
      GoRoute(path: '/student/gamification', builder: (c, s) => const GamificationScreen()),
      GoRoute(path: '/student/notifications', builder: (c, s) => const NotificationsScreen()),
      GoRoute(path: '/student/profile', builder: (c, s) => const ProfileScreen()),
      GoRoute(path: '/student/messages', builder: (c, s) => const InboxScreen()),
      GoRoute(
        path: '/student/messages/:id',
        builder: (c, s) => ChatScreen(
          conversationId: s.pathParameters['id']!,
          otherUserName: s.uri.queryParameters['name'] ?? '',
        ),
      ),
      GoRoute(path: '/student/events', builder: (c, s) => const EventsScreen()),
      GoRoute(path: '/student/schedule', builder: (c, s) => const ScheduleScreen()),
      GoRoute(path: '/student/settings', builder: (c, s) => const SettingsScreen()),
      GoRoute(path: '/student/attendance', builder: (c, s) => const AttendanceScreen()),
      GoRoute(
        path: '/student/quizzes/:id',
        builder: (c, s) => QuizAttemptScreen(
          quizId: s.pathParameters['id']!,
          quizTitle: s.uri.queryParameters['title'] ?? 'Quiz',
        ),
      ),
      GoRoute(path: '/student/fees', builder: (c, s) => const FeesScreen()),
      GoRoute(path: '/student/transport', builder: (c, s) => const TransportScreen()),
      GoRoute(path: '/student/canteen', builder: (c, s) => const CanteenScreen()),
      GoRoute(path: '/student/store', builder: (c, s) => const StoreScreen()),
      GoRoute(path: '/student/boarding', builder: (c, s) => const BoardingScreen()),
      GoRoute(path: '/student/admission', builder: (c, s) => const AdmissionScreen()),
      GoRoute(path: '/student/live-classes', builder: (c, s) => const LiveClassesScreen()),
      GoRoute(
        path: '/student/courses/:id/lessons/:lessonId',
        builder: (c, s) => LessonScreen(
          courseId: s.pathParameters['id']!,
          lessonId: s.pathParameters['lessonId']!,
          lessonTitle: s.uri.queryParameters['title'] ?? 'Lesson',
        ),
      ),

      // Teacher routes
      GoRoute(path: '/teacher', builder: (c, s) => const TeacherDashboardScreen()),
      GoRoute(path: '/teacher/courses', builder: (c, s) => const CoursesScreen()),
      GoRoute(
        path: '/teacher/courses/:id',
        builder: (c, s) => CourseDetailScreen(courseId: s.pathParameters['id']!),
      ),
      GoRoute(path: '/teacher/assignments', builder: (c, s) => const AssignmentsScreen()),
      GoRoute(path: '/teacher/attendance', builder: (c, s) => const AttendanceScreen()),
      GoRoute(path: '/teacher/grades', builder: (c, s) => const GradesScreen()),
      GoRoute(path: '/teacher/notifications', builder: (c, s) => const NotificationsScreen()),
      GoRoute(path: '/teacher/profile', builder: (c, s) => const ProfileScreen()),
      GoRoute(path: '/teacher/take-attendance', builder: (c, s) => const TakeAttendanceScreen()),
      GoRoute(path: '/teacher/submissions', builder: (c, s) => const SubmissionsScreen()),
      GoRoute(path: '/teacher/messages', builder: (c, s) => const InboxScreen()),
      GoRoute(
        path: '/teacher/messages/:id',
        builder: (c, s) => ChatScreen(
          conversationId: s.pathParameters['id']!,
          otherUserName: s.uri.queryParameters['name'] ?? '',
        ),
      ),
      GoRoute(path: '/teacher/events', builder: (c, s) => const EventsScreen()),
      GoRoute(path: '/teacher/settings', builder: (c, s) => const SettingsScreen()),
      GoRoute(path: '/teacher/gradebook', builder: (c, s) => const GradebookScreen()),
      GoRoute(path: '/teacher/live-classes', builder: (c, s) => const LiveClassesScreen()),
      GoRoute(path: '/teacher/analytics', builder: (c, s) => const AnalyticsScreen()),
      GoRoute(path: '/teacher/hr', builder: (c, s) => const HrScreen()),
      GoRoute(path: '/teacher/canteen', builder: (c, s) => const CanteenScreen()),

      // Parent routes
      GoRoute(path: '/parent', builder: (c, s) => const ParentDashboardScreen()),
      GoRoute(path: '/parent/notifications', builder: (c, s) => const NotificationsScreen()),
      GoRoute(path: '/parent/profile', builder: (c, s) => const ProfileScreen()),
      GoRoute(path: '/parent/children', builder: (c, s) => const ChildrenScreen()),
      GoRoute(
        path: '/parent/children/:id',
        builder: (c, s) => ChildDetailScreen(
          childId: s.pathParameters['id']!,
          childName: s.uri.queryParameters['name'] ?? '',
        ),
      ),
      GoRoute(path: '/parent/messages', builder: (c, s) => const InboxScreen()),
      GoRoute(
        path: '/parent/messages/:id',
        builder: (c, s) => ChatScreen(
          conversationId: s.pathParameters['id']!,
          otherUserName: s.uri.queryParameters['name'] ?? '',
        ),
      ),
      GoRoute(path: '/parent/events', builder: (c, s) => const EventsScreen()),
      GoRoute(path: '/parent/settings', builder: (c, s) => const SettingsScreen()),
      GoRoute(path: '/parent/admission', builder: (c, s) => const AdmissionScreen()),

      // Admin routes
      GoRoute(path: '/admin', builder: (c, s) => const AdminDashboardScreen()),
      GoRoute(path: '/admin/notifications', builder: (c, s) => const NotificationsScreen()),
      GoRoute(path: '/admin/profile', builder: (c, s) => const ProfileScreen()),
      GoRoute(path: '/admin/users', builder: (c, s) => const UsersScreen()),
      GoRoute(path: '/admin/events', builder: (c, s) => const EventsManageScreen()),
      GoRoute(path: '/admin/messages', builder: (c, s) => const InboxScreen()),
      GoRoute(
        path: '/admin/messages/:id',
        builder: (c, s) => ChatScreen(
          conversationId: s.pathParameters['id']!,
          otherUserName: s.uri.queryParameters['name'] ?? '',
        ),
      ),
      GoRoute(path: '/admin/settings', builder: (c, s) => const SettingsScreen()),
      GoRoute(path: '/admin/analytics', builder: (c, s) => const AnalyticsScreen()),
      GoRoute(path: '/admin/live-classes', builder: (c, s) => const LiveClassesScreen()),
      GoRoute(path: '/admin/hr', builder: (c, s) => const HrScreen()),
      GoRoute(path: '/admin/canteen', builder: (c, s) => const CanteenScreen()),
      GoRoute(path: '/admin/store', builder: (c, s) => const StoreScreen()),
      GoRoute(path: '/admin/boarding', builder: (c, s) => const BoardingScreen()),
      GoRoute(path: '/admin/counselor', builder: (c, s) => const CounselorScreen()),
      GoRoute(path: '/admin/receptionist', builder: (c, s) => const ReceptionistScreen()),
      GoRoute(path: '/admin/super', builder: (c, s) => const SuperAdminScreen()),
    ],
  );

  String _dashboardRoute(String role) {
    switch (role.toUpperCase()) {
      case 'STUDENT':
        return '/student';
      case 'TEACHER':
      case 'SUB_TEACHER':
      case 'DEPARTMENT_HEAD':
        return '/teacher';
      case 'PARENT':
        return '/parent';
      case 'SCHOOL_ADMIN':
      case 'SUPER_ADMIN':
      case 'VICE_PRINCIPAL':
      case 'ACADEMIC_DIRECTOR':
        return '/admin';
      default:
        return '/student';
    }
  }
}
