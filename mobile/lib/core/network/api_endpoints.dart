class ApiEndpoints {
  ApiEndpoints._();

  static const baseUrl = 'http://10.0.2.2:4000/api';

  // Auth
  static const login = '/auth/login';
  static const logout = '/auth/logout';
  static const refreshToken = '/auth/refresh';
  static const me = '/users/me';
  static const updateMe = '/users/me';

  // Courses
  static const courses = '/courses';
  static String courseById(String id) => '/courses/$id';
  static String courseLessons(String id) => '/courses/$id/lessons';

  // Assignments
  static const assignments = '/assignments';
  static String assignmentById(String id) => '/assignments/$id';
  static String submitAssignment(String id) => '/assignments/$id/submit';

  // Grades (via gradebook module)
  static const grades = '/gradebook';
  static const myGrades = '/gradebook/my-grades';
  static const gradebook = '/gradebook/school/summary';

  // Quizzes
  static const quizzes = '/quizzes';
  static String quizById(String id) => '/quizzes/$id';
  static String submitQuiz(String id) => '/quizzes/$id/submit';

  // Attendance
  static const myAttendance = '/attendance/my';
  static const bulkAttendance = '/attendance/bulk';

  // Notifications
  static const notifications = '/notifications';
  static String markRead(String id) => '/notifications/$id/read';
  static const markAllRead = '/notifications/read-all';

  // Library
  static const libraryBooks = '/library/books';
  static const myLoans = '/library/my-loans';

  // Gamification
  static const myPoints = '/gamification/my-points';
  static const myBadges = '/gamification/my-badges';
  static const leaderboard = '/gamification/leaderboard';

  // AI Tutor
  static const aiTutorChat = '/ai/tutor/chat';

  // Dashboard stats
  static const dashboardStats = '/dashboard/stats';

  // Students (teacher view)
  static const students = '/users?role=student';

  // Messaging
  static const inbox = '/messaging/inbox';
  static String conversationMessages(String id) => '/messaging/conversations/$id/messages';
  static const startConversation = '/messaging/conversations/start';
  static const sendMessage = '/messaging/messages/send';
  static const schoolUsers = '/users';

  // Events
  static const events = '/events';
  static const upcomingEvents = '/events/upcoming';

  // Parent
  static const myChildren = '/parent/children';
  static String childDetails(String id) => '/parent/children/$id';

  // Users (admin)
  static const users = '/users';
  static String userById(String id) => '/users/$id';
  static String deactivateUser(String id) => '/users/$id/deactivate';

  // Attendance (teacher marks students)
  static const markAttendance = '/attendance/mark';
  static String attendanceByDate(String date) => '/attendance/date/$date';
  static String studentAttendance(String id) => '/attendance/student/$id';

  // Assignments (teacher-specific)
  static const pendingGrading = '/assignments/pending-grading';
  static const mySubmissions = '/assignments/my-submissions';
  static String assignmentsByCourse(String courseId) => '/assignments/course/$courseId';
  static String gradeSubmissionById(String id) => '/assignments/submissions/$id/grade';

  // Grades (teacher)
  static const gradeSubmission = '/grades';
  static String submissionsByAssignment(String id) => '/assignments/$id/submissions';

  // Finance
  static const fees = '/finance/fee-structures';
  static const myFees = '/finance/invoices/my';
  static const myInvoices = '/finance/invoices/my';

  // Transport
  static const myBusRoute = '/transport/my-route';
  static const busRoutes = '/transport/routes';

  // Quizzes (attempt flow)
  static String startQuizAttempt(String quizId) => '/quizzes/$quizId/start';
  static String submitQuizAttempt(String attemptId) => '/quizzes/attempts/$attemptId/submit';
  static String myQuizAttempts(String quizId) => '/quizzes/$quizId/my-attempts';

  // Courses - lesson complete
  static String completeLesson(String courseId, String lessonId) => '/courses/$courseId/lessons/$lessonId/complete';

  // Settings
  static const changePassword = '/auth/change-password';

  // Live Classes
  static const liveClasses = '/live-classes';
  static String liveClassById(String id) => '/live-classes/$id';

  // Analytics
  static const analyticsOverview = '/analytics/overview';
  static const analyticsSchool = '/analytics/school';

  // Teacher gradebook
  static const teacherGradebook = '/gradebook/teacher';

  // HR
  static const myLeaves = '/hr/leaves';
  static const requestLeave = '/hr/leaves';

  // Canteen
  static const canteenItems = '/canteen/items';
  static const canteenOrders = '/canteen/orders';
  static const myCanteenOrders = '/canteen/orders/me';

  // Store
  static const storeItems = '/store/items';

  // Admission
  static const admissionApplications = '/admission/applications';

  // Boarding
  static const myRoom = '/boarding/my-room';

  // Receptionist
  static const visitors = '/receptionist/visitors';

  // Counselor / mental health
  static const mentalHealthCheckins = '/health/mental';

  // Super admin
  static const superAdminSchools = '/super-admin/schools';
  static const superAdminStats = '/super-admin/stats';

  // NOTE: For physical device testing, change baseUrl to your machine's local IP
  // e.g. http://192.168.1.100:4000/api
}
