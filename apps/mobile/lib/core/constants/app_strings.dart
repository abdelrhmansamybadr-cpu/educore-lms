class S {
  S._();

  static String t(String en, String ar, bool isAr) => isAr ? ar : en;

  // App
  static String appName(bool isAr) => t('EduCore', 'إيدوكور', isAr);
  static String loading(bool isAr) => t('Loading...', 'جاري التحميل...', isAr);
  static String error(bool isAr) => t('Something went wrong', 'حدث خطأ ما', isAr);
  static String retry(bool isAr) => t('Retry', 'إعادة المحاولة', isAr);
  static String cancel(bool isAr) => t('Cancel', 'إلغاء', isAr);
  static String save(bool isAr) => t('Save', 'حفظ', isAr);
  static String submit(bool isAr) => t('Submit', 'إرسال', isAr);
  static String edit(bool isAr) => t('Edit', 'تعديل', isAr);
  static String delete(bool isAr) => t('Delete', 'حذف', isAr);
  static String confirm(bool isAr) => t('Confirm', 'تأكيد', isAr);
  static String noData(bool isAr) => t('No data available', 'لا توجد بيانات', isAr);
  static String seeAll(bool isAr) => t('See All', 'عرض الكل', isAr);

  // Auth
  static String login(bool isAr) => t('Login', 'تسجيل الدخول', isAr);
  static String logout(bool isAr) => t('Logout', 'تسجيل الخروج', isAr);
  static String email(bool isAr) => t('Email', 'البريد الإلكتروني', isAr);
  static String password(bool isAr) => t('Password', 'كلمة المرور', isAr);
  static String schoolSlug(bool isAr) => t('School Code', 'رمز المدرسة', isAr);
  static String schoolSlugHint(bool isAr) => t('e.g. demo', 'مثال: demo', isAr);
  static String emailHint(bool isAr) => t('Enter your email', 'أدخل بريدك الإلكتروني', isAr);
  static String passwordHint(bool isAr) => t('Enter your password', 'أدخل كلمة المرور', isAr);
  static String loginButton(bool isAr) => t('Sign In', 'دخول', isAr);
  static String loginWelcome(bool isAr) => t('Welcome Back!', 'مرحباً بعودتك!', isAr);
  static String loginSubtitle(bool isAr) =>
      t('Sign in to continue learning', 'سجل دخولك لمواصلة التعلم', isAr);
  static String invalidCredentials(bool isAr) =>
      t('Invalid email or password', 'البريد الإلكتروني أو كلمة المرور غير صحيحة', isAr);

  // Dashboard
  static String dashboard(bool isAr) => t('Dashboard', 'لوحة التحكم', isAr);
  static String goodMorning(bool isAr) => t('Good Morning', 'صباح الخير', isAr);
  static String goodAfternoon(bool isAr) => t('Good Afternoon', 'مساء الخير', isAr);
  static String goodEvening(bool isAr) => t('Good Evening', 'مساء النور', isAr);
  static String myCourses(bool isAr) => t('My Courses', 'موادي', isAr);
  static String upcomingAssignments(bool isAr) =>
      t('Upcoming Assignments', 'الواجبات القادمة', isAr);
  static String recentGrades(bool isAr) => t('Recent Grades', 'الدرجات الأخيرة', isAr);
  static String enrolledCourses(bool isAr) => t('Courses', 'المواد', isAr);
  static String pendingAssignments(bool isAr) => t('Pending', 'المعلقة', isAr);
  static String attendanceRate(bool isAr) => t('Attendance', 'الحضور', isAr);
  static String studentsCount(bool isAr) => t('Students', 'الطلاب', isAr);
  static String pendingReview(bool isAr) => t('To Review', 'للمراجعة', isAr);
  static String pendingSubmissions(bool isAr) =>
      t('Pending Submissions', 'التسليمات المعلقة', isAr);

  // Courses
  static String courses(bool isAr) => t('Courses', 'المواد', isAr);
  static String courseDetail(bool isAr) => t('Course Detail', 'تفاصيل المادة', isAr);
  static String lessons(bool isAr) => t('Lessons', 'الدروس', isAr);
  static String progress(bool isAr) => t('Progress', 'التقدم', isAr);
  static String teacher(bool isAr) => t('Teacher', 'المعلم', isAr);
  static String noCourses(bool isAr) => t('No courses yet', 'لا توجد مواد حتى الآن', isAr);
  static String noCoursesSubtitle(bool isAr) =>
      t('Your courses will appear here', 'ستظهر موادك هنا', isAr);

  // Assignments
  static String assignments(bool isAr) => t('Assignments', 'الواجبات', isAr);
  static String assignmentDetail(bool isAr) => t('Assignment Detail', 'تفاصيل الواجب', isAr);
  static String dueDate(bool isAr) => t('Due Date', 'تاريخ التسليم', isAr);
  static String status(bool isAr) => t('Status', 'الحالة', isAr);
  static String pending(bool isAr) => t('Pending', 'معلق', isAr);
  static String submitted(bool isAr) => t('Submitted', 'تم التسليم', isAr);
  static String graded(bool isAr) => t('Graded', 'مقيّم', isAr);
  static String late(bool isAr) => t('Late', 'متأخر', isAr);
  static String active(bool isAr) => t('Active', 'نشط', isAr);
  static String past(bool isAr) => t('Past', 'منتهي', isAr);
  static String noAssignments(bool isAr) =>
      t('No assignments', 'لا توجد واجبات', isAr);
  static String noAssignmentsSubtitle(bool isAr) =>
      t('You\'re all caught up!', 'أنت في الموعد!', isAr);
  static String submitAssignment(bool isAr) => t('Submit Assignment', 'تسليم الواجب', isAr);
  static String submissions(bool isAr) => t('submissions', 'تسليمات', isAr);

  // Grades
  static String grades(bool isAr) => t('Grades', 'الدرجات', isAr);
  static String average(bool isAr) => t('Average', 'المعدل', isAr);
  static String score(bool isAr) => t('Score', 'الدرجة', isAr);
  static String noGrades(bool isAr) => t('No grades yet', 'لا توجد درجات بعد', isAr);
  static String noGradesSubtitle(bool isAr) =>
      t('Grades will appear after evaluation', 'ستظهر الدرجات بعد التقييم', isAr);

  // Notifications
  static String notifications(bool isAr) => t('Notifications', 'الإشعارات', isAr);
  static String markAllRead(bool isAr) => t('Mark All Read', 'تحديد الكل كمقروء', isAr);
  static String noNotifications(bool isAr) =>
      t('No notifications', 'لا توجد إشعارات', isAr);
  static String noNotificationsSubtitle(bool isAr) =>
      t('You\'re all caught up!', 'لا يوجد جديد!', isAr);

  // Profile
  static String profile(bool isAr) => t('Profile', 'الملف الشخصي', isAr);
  static String editProfile(bool isAr) => t('Edit Profile', 'تعديل الملف الشخصي', isAr);
  static String changePassword(bool isAr) => t('Change Password', 'تغيير كلمة المرور', isAr);
  static String firstName(bool isAr) => t('First Name', 'الاسم الأول', isAr);
  static String lastName(bool isAr) => t('Last Name', 'اسم العائلة', isAr);
  static String phone(bool isAr) => t('Phone', 'الهاتف', isAr);
  static String currentPassword(bool isAr) => t('Current Password', 'كلمة المرور الحالية', isAr);
  static String newPassword(bool isAr) => t('New Password', 'كلمة المرور الجديدة', isAr);
  static String confirmPassword(bool isAr) => t('Confirm Password', 'تأكيد كلمة المرور', isAr);

  // AI Tutor
  static String aiTutor(bool isAr) => t('AI Tutor', 'المعلم الذكي', isAr);
  static String aiTutorSubtitle(bool isAr) =>
      t('Ask me anything about your studies', 'اسألني أي شيء عن دراستك', isAr);
  static String typeMessage(bool isAr) => t('Type a message...', 'اكتب رسالة...', isAr);
  static String selectSubject(bool isAr) => t('Select Subject', 'اختر المادة', isAr);
  static String allSubjects(bool isAr) => t('All Subjects', 'كل المواد', isAr);

  // Library
  static String library(bool isAr) => t('Library', 'المكتبة', isAr);
  static String search(bool isAr) => t('Search...', 'بحث...', isAr);
  static String books(bool isAr) => t('Books', 'الكتب', isAr);
  static String myLoans(bool isAr) => t('My Loans', 'إعاراتي', isAr);
  static String available(bool isAr) => t('Available', 'متاح', isAr);
  static String borrowed(bool isAr) => t('Borrowed', 'معار', isAr);
  static String author(bool isAr) => t('Author', 'المؤلف', isAr);
  static String noBooks(bool isAr) => t('No books found', 'لا توجد كتب', isAr);
  static String noBooksSubtitle(bool isAr) =>
      t('Try a different search', 'جرب بحثاً مختلفاً', isAr);

  // Gamification
  static String gamification(bool isAr) => t('Achievements', 'الإنجازات', isAr);
  static String points(bool isAr) => t('Points', 'النقاط', isAr);
  static String badges(bool isAr) => t('Badges', 'الشارات', isAr);
  static String leaderboard(bool isAr) => t('Leaderboard', 'المتصدرون', isAr);
  static String streak(bool isAr) => t('Day Streak', 'أيام متواصلة', isAr);
  static String rank(bool isAr) => t('Rank', 'الترتيب', isAr);

  // Attendance
  static String attendance(bool isAr) => t('Attendance', 'الحضور', isAr);
  static String present(bool isAr) => t('Present', 'حاضر', isAr);
  static String absent(bool isAr) => t('Absent', 'غائب', isAr);
  static String lateLabel(bool isAr) => t('Late', 'متأخر', isAr);
  static String submitAttendance(bool isAr) => t('Submit Attendance', 'تسجيل الحضور', isAr);
  static String selectDate(bool isAr) => t('Select Date', 'اختر التاريخ', isAr);
  static String noStudents(bool isAr) => t('No students', 'لا يوجد طلاب', isAr);

  // Quizzes
  static String quizzes(bool isAr) => t('Quizzes', 'الاختبارات', isAr);
  static String noQuizzes(bool isAr) => t('No quizzes', 'لا توجد اختبارات', isAr);
  static String noQuizzesSubtitle(bool isAr) =>
      t('Quizzes will appear here', 'ستظهر الاختبارات هنا', isAr);
  static String startQuiz(bool isAr) => t('Start Quiz', 'ابدأ الاختبار', isAr);
  static String score_(bool isAr) => t('Score', 'النتيجة', isAr);
  static String duration(bool isAr) => t('Duration', 'المدة', isAr);
  static String questions(bool isAr) => t('Questions', 'الأسئلة', isAr);

  // Roles
  static String student(bool isAr) => t('Student', 'طالب', isAr);
  static String teacherRole(bool isAr) => t('Teacher', 'معلم', isAr);
  static String parent(bool isAr) => t('Parent', 'ولي أمر', isAr);
  static String admin(bool isAr) => t('Admin', 'مشرف', isAr);

  // Navigation
  static String home(bool isAr) => t('Home', 'الرئيسية', isAr);
  static String more(bool isAr) => t('More', 'المزيد', isAr);

  // Parent Dashboard
  static String myChildren(bool isAr) => t('My Children', 'أبنائي', isAr);
  static String grade(bool isAr) => t('Grade', 'الصف', isAr);
  static String viewGrades(bool isAr) => t('View Grades', 'عرض الدرجات', isAr);
  static String viewAttendance(bool isAr) => t('View Attendance', 'عرض الحضور', isAr);
  static String noChildren(bool isAr) => t('No children linked', 'لا يوجد أبناء مرتبطون', isAr);
}
