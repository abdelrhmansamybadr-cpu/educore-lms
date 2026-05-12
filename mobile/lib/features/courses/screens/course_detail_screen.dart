import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';
import '../../../shared/widgets/error_widget.dart';

class CourseDetailScreen extends StatefulWidget {
  final String courseId;

  const CourseDetailScreen({super.key, required this.courseId});

  @override
  State<CourseDetailScreen> createState() => _CourseDetailScreenState();
}

class _CourseDetailScreenState extends State<CourseDetailScreen> {
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _course;
  List<dynamic> _lessons = [];

  @override
  void initState() {
    super.initState();
    _loadCourse();
  }

  Future<void> _loadCourse() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        ApiClient.instance.get(ApiEndpoints.courseById(widget.courseId)),
        ApiClient.instance.get(ApiEndpoints.courseLessons(widget.courseId)),
      ]);
      setState(() {
        _course = results[0].data is Map ? results[0].data : {};
        final lessonsData = results[1].data;
        _lessons = (lessonsData is Map ? lessonsData['data'] : lessonsData) ?? [];
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

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: _isLoading
            ? const Padding(
                padding: EdgeInsets.all(16),
                child: DashboardSkeletonLoader(),
              )
            : _error != null
                ? AppErrorWidget(message: _error!, onRetry: _loadCourse)
                : _buildContent(isAr),
      ),
    );
  }

  Widget _buildContent(bool isAr) {
    final c = _course!;
    final title = isAr && c['titleAr'] != null ? c['titleAr'] : c['title'] ?? '';
    final description = isAr && c['descriptionAr'] != null
        ? c['descriptionAr']
        : c['description'] ?? '';
    final coverImage = c['coverImage'] ?? c['thumbnail'];
    final teacherName = c['teacherName'] ??
        (c['teacher'] is Map
            ? '${c['teacher']['firstName'] ?? ''} ${c['teacher']['lastName'] ?? ''}'
            : '');
    final progress = (c['progress'] ?? 0).toDouble();

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: 240,
          pinned: true,
          backgroundColor: AppColors.primary,
          flexibleSpace: FlexibleSpaceBar(
            title: Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            background: coverImage != null
                ? CachedNetworkImage(
                    imageUrl: coverImage,
                    fit: BoxFit.cover,
                    color: Colors.black.withOpacity(0.3),
                    colorBlendMode: BlendMode.darken,
                  )
                : Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [AppColors.primary, AppColors.primaryLight],
                      ),
                    ),
                    child: const Center(
                      child: Text('📚', style: TextStyle(fontSize: 60)),
                    ),
                  ),
          ),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.all(16),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              // Course Info Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.person_outline_rounded,
                            size: 16, color: AppColors.textSecondary),
                        const SizedBox(width: 6),
                        Text(
                          teacherName,
                          style: const TextStyle(
                              fontSize: 13, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    if (description.isNotEmpty) ...[
                      Text(
                        description,
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppColors.textSecondary,
                          height: 1.6,
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    // Progress
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          S.progress(isAr),
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        Text(
                          '${progress.toStringAsFixed(0)}%',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    LinearProgressIndicator(
                      value: progress / 100,
                      backgroundColor: AppColors.border,
                      color: AppColors.primary,
                      minHeight: 8,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              // Lessons
              Text(
                S.lessons(isAr),
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 12),
              if (_lessons.isEmpty)
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: const Center(
                    child: Text('No lessons yet',
                        style: TextStyle(color: AppColors.textSecondary)),
                  ),
                )
              else
                ...List.generate(_lessons.length, (i) {
                  final lesson = _lessons[i];
                  final lessonTitle = isAr && lesson['titleAr'] != null
                      ? lesson['titleAr']
                      : lesson['title'] ?? '';
                  final isCompleted = lesson['isCompleted'] ?? false;

                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: ListTile(
                      onTap: () {
                        final lessonTitle = isAr && lesson['titleAr'] != null
                            ? lesson['titleAr']
                            : lesson['title'] ?? '';
                        context.go(
                          '/student/courses/${widget.courseId}/lessons/${lesson['id']}?title=${Uri.encodeComponent(lessonTitle)}',
                        );
                      },
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 8),
                      leading: Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: isCompleted
                              ? AppColors.success.withOpacity(0.1)
                              : AppColors.primary.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Center(
                          child: isCompleted
                              ? const Icon(Icons.check_circle_rounded,
                                  color: AppColors.success, size: 20)
                              : Text(
                                  '${i + 1}',
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primary,
                                  ),
                                ),
                        ),
                      ),
                      title: Text(
                        lessonTitle,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: isCompleted
                              ? AppColors.textSecondary
                              : AppColors.textPrimary,
                          decoration: isCompleted
                              ? TextDecoration.lineThrough
                              : null,
                        ),
                      ),
                      subtitle: lesson['duration'] != null
                          ? Text(
                              '${lesson['duration']} min',
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            )
                          : null,
                      trailing: const Icon(
                        Icons.play_circle_outline_rounded,
                        color: AppColors.primary,
                      ),
                    ),
                  );
                }),
              const SizedBox(height: 80),
            ]),
          ),
        ),
      ],
    );
  }
}
