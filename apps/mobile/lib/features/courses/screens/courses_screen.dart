import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/app_bar_widget.dart';
import '../../../shared/widgets/bottom_nav_widget.dart';
import '../../../shared/widgets/skeleton_loader.dart';
import '../../../shared/widgets/empty_state_widget.dart';
import '../../../shared/widgets/error_widget.dart';

class CoursesScreen extends StatefulWidget {
  const CoursesScreen({super.key});

  @override
  State<CoursesScreen> createState() => _CoursesScreenState();
}

class _CoursesScreenState extends State<CoursesScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _courses = [];

  @override
  void initState() {
    super.initState();
    _loadCourses();
  }

  Future<void> _loadCourses() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final response = await ApiClient.instance.get(ApiEndpoints.courses);
      final data = response.data;
      setState(() {
        _courses = (data is Map ? data['data'] : data) ?? [];
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
    final isAr = auth.isAr;
    final isTeacher = auth.user?.isTeacher ?? false;
    final basePath = isTeacher ? '/teacher' : '/student';

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBarWidget(
          title: S.courses(isAr),
          showBack: false,
        ),
        body: _isLoading
            ? GridView.builder(
                padding: const EdgeInsets.all(16),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 0.75,
                ),
                itemCount: 6,
                itemBuilder: (_, __) => const CardSkeletonLoader(),
              )
            : _error != null
                ? AppErrorWidget(
                    message: _error!,
                    onRetry: _loadCourses,
                    retryLabel: S.retry(isAr),
                  )
                : _courses.isEmpty
                    ? EmptyStateWidget(
                        emoji: '📚',
                        title: S.noCourses(isAr),
                        subtitle: S.noCoursesSubtitle(isAr),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadCourses,
                        child: GridView.builder(
                          padding: const EdgeInsets.all(16),
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                            childAspectRatio: 0.72,
                          ),
                          itemCount: _courses.length,
                          itemBuilder: (_, i) {
                            final c = _courses[i];
                            return _buildCourseCard(c, isAr, basePath);
                          },
                        ),
                      ),
        bottomNavigationBar: isTeacher
            ? TeacherBottomNav(currentIndex: 1, isAr: isAr)
            : StudentBottomNav(currentIndex: 1, isAr: isAr),
      ),
    );
  }

  Widget _buildCourseCard(Map<String, dynamic> c, bool isAr, String basePath) {
    final coverImage = c['coverImage'] ?? c['thumbnail'];
    final progress = (c['progress'] ?? 0).toDouble();
    final title = isAr && c['titleAr'] != null ? c['titleAr'] : c['title'] ?? '';
    final teacher = c['teacherName'] ??
        (c['teacher'] is Map
            ? '${c['teacher']['firstName'] ?? ''} ${c['teacher']['lastName'] ?? ''}'
            : '');

    return GestureDetector(
      onTap: () => context.go('$basePath/courses/${c['id']}'),
      child: Container(
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
                      height: 110,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      errorWidget: (_, __, ___) => _placeholder(),
                    )
                  : _placeholder(),
            ),
            Expanded(
              child: Padding(
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
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      teacher,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const Spacer(),
                    LinearProgressIndicator(
                      value: progress / 100,
                      backgroundColor: AppColors.border,
                      color: AppColors.primary,
                      minHeight: 4,
                      borderRadius: BorderRadius.circular(2),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${progress.toStringAsFixed(0)}% ${S.progress(isAr)}',
                      style: const TextStyle(
                        fontSize: 10,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _placeholder() {
    return Container(
      height: 110,
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primary, AppColors.primaryLight],
        ),
      ),
      child: const Center(child: Text('📚', style: TextStyle(fontSize: 36))),
    );
  }
}
