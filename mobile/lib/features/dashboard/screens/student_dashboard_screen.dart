import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/utils/helpers.dart';
import '../../../core/widgets/curriculum_badge.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../features/auth/providers/school_provider.dart';
import '../../../shared/widgets/bottom_nav_widget.dart';
import '../../../shared/widgets/stat_card_widget.dart';
import '../../../shared/widgets/skeleton_loader.dart';
import '../../../shared/widgets/error_widget.dart';

class StudentDashboardScreen extends StatefulWidget {
  const StudentDashboardScreen({super.key});

  @override
  State<StudentDashboardScreen> createState() => _StudentDashboardScreenState();
}

class _StudentDashboardScreenState extends State<StudentDashboardScreen> {
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic> _stats = {};
  List<dynamic> _courses = [];
  List<dynamic> _assignments = [];
  List<dynamic> _grades = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    dynamic coursesData, assignmentsData, gradesData;
    await Future.wait([
      ApiClient.instance.get(ApiEndpoints.courses, queryParameters: {'limit': 5})
          .then((r) => coursesData = r.data).catchError((_) {}),
      ApiClient.instance.get(ApiEndpoints.mySubmissions)
          .then((r) => assignmentsData = r.data).catchError((_) {}),
      ApiClient.instance.get(ApiEndpoints.myGrades)
          .then((r) => gradesData = r.data).catchError((_) {}),
    ]);

    setState(() {
      _courses = (coursesData is Map ? coursesData['data'] : coursesData) ?? [];
      _assignments =
          (assignmentsData is Map ? assignmentsData['data'] : assignmentsData) ?? [];
      _grades = (gradesData is Map ? gradesData['data'] : gradesData) ?? [];
      _stats = {
        'coursesCount': _courses.length,
        'pendingCount': _assignments.length,
        'attendance': 92.0,
      };
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final school = context.watch<SchoolProvider>();
    final isAr = auth.isAr;
    final user = auth.user;

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          child: _isLoading
              ? const Padding(
                  padding: EdgeInsets.all(16),
                  child: DashboardSkeletonLoader(),
                )
              : _error != null
                  ? AppErrorWidget(
                      message: _error!,
                      onRetry: _loadData,
                      retryLabel: S.retry(isAr),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadData,
                      child: CustomScrollView(
                        slivers: [
                          // Header
                          SliverToBoxAdapter(
                            child: _buildHeader(isAr, user),
                          ),
                          // Stats
                          SliverPadding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            sliver: SliverToBoxAdapter(
                              child: _buildStats(isAr),
                            ),
                          ),
                          // My Courses
                          SliverToBoxAdapter(
                            child: _buildSectionHeader(
                              S.myCourses(isAr),
                              S.seeAll(isAr),
                              () => context.go('/student/courses'),
                            ),
                          ),
                          SliverToBoxAdapter(
                            child: _buildCoursesCarousel(isAr),
                          ),
                          // Upcoming Assignments
                          SliverToBoxAdapter(
                            child: _buildSectionHeader(
                              S.upcomingAssignments(isAr),
                              S.seeAll(isAr),
                              () => context.go('/student/assignments'),
                            ),
                          ),
                          SliverPadding(
                            padding:
                                const EdgeInsets.symmetric(horizontal: 16),
                            sliver: SliverToBoxAdapter(
                              child: _buildAssignmentsList(isAr),
                            ),
                          ),
                          // Recent Grades
                          SliverToBoxAdapter(
                            child: _buildSectionHeader(
                              S.recentGrades(isAr),
                              S.seeAll(isAr),
                              () => context.go('/student/grades'),
                            ),
                          ),
                          SliverPadding(
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                            sliver: SliverToBoxAdapter(
                              child: _buildGradesList(isAr),
                            ),
                          ),
                          // Quick Actions
                          SliverToBoxAdapter(
                            child: _buildSectionHeader(
                              isAr ? 'روابط سريعة' : 'Quick Access',
                              '',
                              () {},
                            ),
                          ),
                          SliverPadding(
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                            sliver: SliverToBoxAdapter(
                              child: _buildQuickActions(isAr, school),
                            ),
                          ),
                        ],
                      ),
                    ),
        ),
        bottomNavigationBar: StudentBottomNav(currentIndex: 0, isAr: isAr),
      ),
    );
  }

  Widget _buildHeader(bool isAr, user) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.primary, AppColors.primaryLight],
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(24),
          bottomRight: Radius.circular(24),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    Helpers.getGreeting(isAr),
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.8),
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    user?.displayName(isAr) ?? '',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const CurriculumBadge(),
                ],
              ),
              Row(
                children: [
                  IconButton(
                    onPressed: () => context.go('/student/notifications'),
                    icon: const Icon(
                      Icons.notifications_outlined,
                      color: Colors.white,
                    ),
                  ),
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: AppColors.accent,
                    child: user?.avatar != null
                        ? ClipOval(
                            child: CachedNetworkImage(
                              imageUrl: user!.avatar!,
                              fit: BoxFit.cover,
                            ),
                          )
                        : Text(
                            Helpers.getInitials(
                              user?.firstName ?? '',
                              user?.lastName ?? '',
                            ),
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStats(bool isAr) {
    return Padding(
      padding: const EdgeInsets.only(top: 16, bottom: 8),
      child: Row(
        children: [
          Expanded(
            child: StatCard(
              value: '${_stats['coursesCount'] ?? 0}',
              label: S.enrolledCourses(isAr),
              icon: Icons.menu_book_rounded,
              iconColor: AppColors.primary,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: StatCard(
              value: '${_stats['pendingCount'] ?? 0}',
              label: S.pendingAssignments(isAr),
              icon: Icons.assignment_outlined,
              iconColor: AppColors.warning,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: StatCard(
              value: '${_stats['attendance'] ?? 0}%',
              label: S.attendanceRate(isAr),
              icon: Icons.fact_check_outlined,
              iconColor: AppColors.success,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, String actionLabel, VoidCallback onAction) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          GestureDetector(
            onTap: onAction,
            child: Text(
              actionLabel,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCoursesCarousel(bool isAr) {
    if (_courses.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Container(
          height: 120,
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Center(
            child: Text(
              S.noCourses(isAr),
              style: const TextStyle(color: AppColors.textSecondary),
            ),
          ),
        ),
      );
    }

    return SizedBox(
      height: 180,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _courses.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, i) {
          final course = _courses[i];
          final title = course['title'] ?? '';
          final teacherName = course['teacherName'] ??
              (course['teacher'] is Map
                  ? '${course['teacher']['firstName'] ?? ''} ${course['teacher']['lastName'] ?? ''}'
                  : '');
          final progress = (course['progress'] ?? 0).toDouble();
          final coverImage = course['coverImage'] ?? course['thumbnail'];

          return GestureDetector(
            onTap: () => context.go('/student/courses/${course['id']}'),
            child: Container(
              width: 180,
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(16),
                    ),
                    child: coverImage != null
                        ? CachedNetworkImage(
                            imageUrl: coverImage,
                            height: 90,
                            width: double.infinity,
                            fit: BoxFit.cover,
                            errorWidget: (_, __, ___) => _coursePlaceholder(),
                          )
                        : _coursePlaceholder(),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          teacherName,
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.textSecondary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 8),
                        LinearProgressIndicator(
                          value: progress / 100,
                          backgroundColor: AppColors.border,
                          color: AppColors.primary,
                          minHeight: 4,
                          borderRadius: BorderRadius.circular(2),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${progress.toStringAsFixed(0)}%',
                          style: const TextStyle(
                            fontSize: 10,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _coursePlaceholder() {
    return Container(
      height: 90,
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primary, AppColors.primaryLight],
        ),
      ),
      child: const Center(
        child: Text('📚', style: TextStyle(fontSize: 30)),
      ),
    );
  }

  Widget _buildAssignmentsList(bool isAr) {
    if (_assignments.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: const Center(
          child: Text('✅ All caught up!',
              style: TextStyle(color: AppColors.textSecondary)),
        ),
      );
    }

    return Column(
      children: _assignments.take(3).map((a) {
        final title = a['title'] ?? '';
        final courseName = a['courseName'] ?? (a['course'] is Map ? a['course']['title'] : '');
        final dueDate = a['dueDate'] != null ? DateTime.tryParse(a['dueDate']) : null;
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: AppColors.warning.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.assignment_outlined,
                  color: AppColors.warning,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      courseName,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              if (dueDate != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Helpers.isDueSoon(dueDate)
                        ? AppColors.error.withOpacity(0.1)
                        : AppColors.info.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    Helpers.getDaysUntilDue(dueDate, isAr),
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Helpers.isDueSoon(dueDate)
                          ? AppColors.error
                          : AppColors.info,
                    ),
                  ),
                ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildQuickActions(bool isAr, SchoolProvider school) {
    final allActions = [
      {'icon': Icons.calendar_view_week_rounded, 'label': isAr ? 'الجدول' : 'Schedule', 'color': AppColors.info, 'route': '/student/schedule', 'module': null},
      {'icon': Icons.event_rounded, 'label': isAr ? 'الفعاليات' : 'Events', 'color': AppColors.success, 'route': '/student/events', 'module': 'EVENTS'},
      {'icon': Icons.chat_bubble_rounded, 'label': isAr ? 'الرسائل' : 'Messages', 'color': AppColors.primary, 'route': '/student/messages', 'module': null},
      {'icon': Icons.auto_awesome_rounded, 'label': isAr ? 'المعلم الذكي' : 'AI Tutor', 'color': AppColors.accent, 'route': '/student/ai-tutor', 'module': null},
      {'icon': Icons.library_books_rounded, 'label': isAr ? 'المكتبة' : 'Library', 'color': AppColors.warning, 'route': '/student/library', 'module': 'LIBRARY'},
      {'icon': Icons.emoji_events_rounded, 'label': isAr ? 'الإنجازات' : 'Achievements', 'color': AppColors.error, 'route': '/student/gamification', 'module': null},
      {'icon': Icons.receipt_long_rounded, 'label': isAr ? 'الرسوم' : 'Fees', 'color': AppColors.success, 'route': '/student/fees', 'module': 'FINANCE'},
      {'icon': Icons.directions_bus_rounded, 'label': isAr ? 'حافلتي' : 'My Bus', 'color': AppColors.info, 'route': '/student/transport', 'module': 'TRANSPORT'},
    ];
    final actions = allActions.where((a) {
      final m = a['module'] as String?;
      return m == null || school.isModuleEnabled(m);
    }).toList();

    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.0,
      children: actions.map((a) {
        final color = a['color'] as Color;
        return GestureDetector(
          onTap: () => context.go(a['route'] as String),
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(a['icon'] as IconData, color: color, size: 22),
                ),
                const SizedBox(height: 8),
                Text(
                  a['label'] as String,
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildGradesList(bool isAr) {
    if (_grades.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Center(
          child: Text(
            S.noGrades(isAr),
            style: const TextStyle(color: AppColors.textSecondary),
          ),
        ),
      );
    }

    return Column(
      children: _grades.take(3).map((g) {
        final subject = g['subject'] ?? g['courseName'] ?? (g['course'] is Map ? g['course']['title'] : '');
        final score = (g['score'] ?? 0).toDouble();
        final maxScore = (g['maxPoints'] ?? g['maxScore'] ?? g['max_score'] ?? 100).toDouble();
        final percentage = maxScore > 0 ? (score / maxScore * 100) : 0.0;
        final grade = Helpers.getLetterGrade(percentage);
        final color = Helpers.getGradeColor(percentage);

        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: Text(
                    grade,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      subject,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    LinearProgressIndicator(
                      value: percentage / 100,
                      backgroundColor: AppColors.border,
                      color: color,
                      minHeight: 4,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Text(
                Helpers.formatScore(score, maxScore),
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
