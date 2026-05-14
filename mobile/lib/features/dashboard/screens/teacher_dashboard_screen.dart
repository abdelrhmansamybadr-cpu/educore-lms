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

class TeacherDashboardScreen extends StatefulWidget {
  const TeacherDashboardScreen({super.key});

  @override
  State<TeacherDashboardScreen> createState() => _TeacherDashboardScreenState();
}

class _TeacherDashboardScreenState extends State<TeacherDashboardScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _courses = [];
  List<dynamic> _assignments = [];

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
    try {
      // Fetch independently so one failure doesn't block the whole dashboard
      dynamic coursesData, assignmentsData;
      await Future.wait([
        ApiClient.instance.get(ApiEndpoints.courses, queryParameters: {'limit': 10})
            .then((r) => coursesData = r.data)
            .catchError((_) {}),
        ApiClient.instance.get(ApiEndpoints.pendingGrading)
            .then((r) => assignmentsData = r.data)
            .catchError((_) {}),
      ]);

      setState(() {
        _courses = (coursesData is Map ? coursesData['data'] : coursesData) ?? [];
        _assignments =
            (assignmentsData is Map ? assignmentsData['data'] : assignmentsData) ?? [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
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
                          SliverToBoxAdapter(child: _buildHeader(isAr, user)),
                          SliverPadding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            sliver: SliverToBoxAdapter(child: _buildStats(isAr)),
                          ),
                          SliverToBoxAdapter(
                            child: _buildSectionHeader(
                              S.myCourses(isAr),
                              S.seeAll(isAr),
                              () => context.go('/teacher/courses'),
                            ),
                          ),
                          SliverToBoxAdapter(child: _buildCoursesCarousel(isAr)),
                          SliverToBoxAdapter(
                            child: _buildSectionHeader(
                              S.pendingSubmissions(isAr),
                              S.seeAll(isAr),
                              () => context.go('/teacher/assignments'),
                            ),
                          ),
                          SliverPadding(
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                            sliver: SliverToBoxAdapter(
                              child: _buildSubmissionsList(isAr),
                            ),
                          ),
                          // Quick Actions
                          SliverToBoxAdapter(
                            child: _buildSectionHeader(
                              isAr ? 'أدوات سريعة' : 'Quick Tools',
                              '',
                              () {},
                            ),
                          ),
                          SliverPadding(
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                            sliver: SliverToBoxAdapter(child: _buildQuickActions(isAr, school)),
                          ),
                        ],
                      ),
                    ),
        ),
        bottomNavigationBar: TeacherBottomNav(currentIndex: 0, isAr: isAr),
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
          colors: [Color(0xFF0F2A47), Color(0xFF1A3F6F)],
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(24),
          bottomRight: Radius.circular(24),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                Helpers.getGreeting(isAr),
                style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 14),
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
              Container(
                margin: const EdgeInsets.only(top: 4),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.accent.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.accent.withOpacity(0.4)),
                ),
                child: Text(
                  S.teacherRole(isAr),
                  style: const TextStyle(
                    color: AppColors.accent,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(height: 6),
              const CurriculumBadge(),
            ],
          ),
          Row(
            children: [
              IconButton(
                onPressed: () => context.go('/teacher/notifications'),
                icon: const Icon(Icons.notifications_outlined, color: Colors.white),
              ),
              CircleAvatar(
                radius: 20,
                backgroundColor: AppColors.accent,
                child: Text(
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
    );
  }

  Widget _buildStats(bool isAr) {
    return Padding(
      padding: const EdgeInsets.only(top: 16, bottom: 8),
      child: Row(
        children: [
          Expanded(
            child: StatCard(
              value: '${_courses.length}',
              label: S.enrolledCourses(isAr),
              icon: Icons.menu_book_rounded,
              iconColor: AppColors.primary,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: StatCard(
              value: '${_assignments.length}',
              label: S.pendingReview(isAr),
              icon: Icons.grading_rounded,
              iconColor: AppColors.warning,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: StatCard(
              value: '42',
              label: S.studentsCount(isAr),
              icon: Icons.people_rounded,
              iconColor: AppColors.info,
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
          Text(title,
              style: const TextStyle(
                  fontSize: 17, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          GestureDetector(
            onTap: onAction,
            child: Text(actionLabel,
                style: const TextStyle(
                    fontSize: 13, color: AppColors.primary, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  Widget _buildCoursesCarousel(bool isAr) {
    if (_courses.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: 16),
        child: SizedBox(
          height: 100,
          child: Center(child: Text('No courses assigned')),
        ),
      );
    }
    return SizedBox(
      height: 160,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _courses.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, i) {
          final c = _courses[i];
          final coverImage = c['coverImage'] ?? c['thumbnail'];
          return GestureDetector(
            onTap: () => context.go('/teacher/courses/${c['id']}'),
            child: Container(
              width: 200,
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                    child: coverImage != null
                        ? CachedNetworkImage(
                            imageUrl: coverImage,
                            height: 90,
                            width: double.infinity,
                            fit: BoxFit.cover,
                            errorWidget: (_, __, ___) => _placeholder(),
                          )
                        : _placeholder(),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          c['title'] ?? '',
                          style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimary),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${c['studentsCount'] ?? 0} ${S.studentsCount(isAr)}',
                          style: const TextStyle(
                              fontSize: 11, color: AppColors.textSecondary),
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

  Widget _buildQuickActions(bool isAr, SchoolProvider school) {
    final allActions = [
      {'icon': Icons.fact_check_rounded, 'label': isAr ? 'تسجيل الحضور' : 'Take Attendance', 'color': AppColors.success, 'route': '/teacher/take-attendance', 'module': null},
      {'icon': Icons.grading_rounded, 'label': isAr ? 'التسليمات' : 'Grade Submissions', 'color': AppColors.warning, 'route': '/teacher/submissions', 'module': null},
      {'icon': Icons.chat_bubble_rounded, 'label': isAr ? 'الرسائل' : 'Messages', 'color': AppColors.primary, 'route': '/teacher/messages', 'module': null},
      {'icon': Icons.event_rounded, 'label': isAr ? 'الفعاليات' : 'Events', 'color': AppColors.info, 'route': '/teacher/events', 'module': 'EVENTS'},
      {'icon': Icons.settings_rounded, 'label': isAr ? 'الإعدادات' : 'Settings', 'color': AppColors.textSecondary, 'route': '/teacher/settings', 'module': null},
      {'icon': Icons.notifications_rounded, 'label': isAr ? 'الإشعارات' : 'Notifications', 'color': AppColors.error, 'route': '/teacher/notifications', 'module': null},
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
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _placeholder() {
    return Container(
      height: 90,
      width: double.infinity,
      color: AppColors.primaryLight,
      child: const Center(child: Text('📚', style: TextStyle(fontSize: 30))),
    );
  }

  Widget _buildSubmissionsList(bool isAr) {
    if (_assignments.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: const Center(child: Text('✅ No pending submissions!')),
      );
    }
    return Column(
      children: _assignments.take(5).map((a) {
        final submissionsCount = a['submissionsCount'] ?? 0;
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
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.grading_rounded,
                    color: AppColors.primary, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(a['title'] ?? '',
                        style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                    Text(
                      a['courseName'] ?? '',
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: AppColors.warning.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '$submissionsCount ${S.submissions(isAr)}',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.warning,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
