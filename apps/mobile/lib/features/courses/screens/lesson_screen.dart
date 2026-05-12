import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';

class LessonScreen extends StatefulWidget {
  final String lessonId;
  final String courseId;
  final String lessonTitle;

  const LessonScreen({
    super.key,
    required this.lessonId,
    required this.courseId,
    required this.lessonTitle,
  });

  @override
  State<LessonScreen> createState() => _LessonScreenState();
}

class _LessonScreenState extends State<LessonScreen> {
  List<dynamic> _lessons = [];
  Map<String, dynamic>? _lesson;
  bool _loading = true;
  bool _markingComplete = false;
  bool _isCompleted = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient.instance.get(ApiEndpoints.courseLessons(widget.courseId));
      final data = res.data;
      final lessons = ((data is Map ? data['data'] : data) ?? []) as List;
      lessons.sort((a, b) => ((a['order'] ?? 0) as num).compareTo((b['order'] ?? 0) as num));

      final found = lessons.firstWhere(
        (l) => l['id']?.toString() == widget.lessonId,
        orElse: () => lessons.isNotEmpty ? lessons.first : null,
      );

      setState(() {
        _lessons = lessons;
        _lesson = found is Map ? Map<String, dynamic>.from(found) : null;
        _isCompleted = _lesson?['isCompleted'] ?? false;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load lesson: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _markComplete() async {
    setState(() => _markingComplete = true);
    try {
      await ApiClient.instance.patch(
        ApiEndpoints.completeLesson(widget.courseId, widget.lessonId),
      );
      setState(() {
        _isCompleted = true;
        _markingComplete = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Lesson marked as complete!'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (_) {
      setState(() => _markingComplete = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not mark complete. Try again later.'),
            backgroundColor: AppColors.warning,
          ),
        );
      }
    }
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  int get _currentLessonIndex =>
      _lessons.indexWhere((l) => l['id']?.toString() == widget.lessonId);

  void _navigateToLesson(dynamic lesson, bool isAr) {
    final title = isAr && lesson['titleAr'] != null ? lesson['titleAr'] : lesson['title'] ?? '';
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => LessonScreen(
          lessonId: lesson['id'].toString(),
          courseId: widget.courseId,
          lessonTitle: title,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthProvider>();
    final isAr = auth.isAr;

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: Text(
            _lesson != null
                ? (isAr && _lesson!['titleAr'] != null ? _lesson!['titleAr'] : _lesson!['title'] ?? widget.lessonTitle)
                : widget.lessonTitle,
          ),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.primary,
          elevation: 0,
          bottom: const PreferredSize(
            preferredSize: Size.fromHeight(1),
            child: Divider(height: 1, color: AppColors.border),
          ),
        ),
        body: _loading
            ? const Padding(
                padding: EdgeInsets.all(16),
                child: Column(children: [
                  SkeletonLoader(height: 200), SizedBox(height: 12),
                  SkeletonLoader(height: 150),
                ]),
              )
            : _lesson == null
                ? Center(
                    child: Text(
                      isAr ? 'الدرس غير موجود' : 'Lesson not found',
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                  )
                : _buildContent(isAr),
      ),
    );
  }

  Widget _buildContent(bool isAr) {
    final lesson = _lesson!;
    final type = lesson['type'] ?? 'TEXT';
    final videoUrl = lesson['videoUrl'];
    final pdfUrl = lesson['pdfUrl'];
    final content = isAr && lesson['contentAr'] != null ? lesson['contentAr'] : lesson['content'];
    final duration = lesson['duration'];

    final currentIdx = _currentLessonIndex;
    final hasPrev = currentIdx > 0;
    final hasNext = currentIdx < _lessons.length - 1;

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Type badge + duration
                Row(
                  children: [
                    _typeBadge(type, isAr),
                    if (duration != null) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.info.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.timer_outlined, size: 13, color: AppColors.info),
                            const SizedBox(width: 4),
                            Text(
                              '$duration min',
                              style: const TextStyle(fontSize: 11, color: AppColors.info, fontWeight: FontWeight.w500),
                            ),
                          ],
                        ),
                      ),
                    ],
                    if (_isCompleted) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.success.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.check_circle_rounded, size: 13, color: AppColors.success),
                            const SizedBox(width: 4),
                            Text(
                              isAr ? 'مكتمل' : 'Completed',
                              style: const TextStyle(fontSize: 11, color: AppColors.success, fontWeight: FontWeight.w500),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 16),

                // Video section
                if (type == 'VIDEO' || videoUrl != null) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      gradient: AppColors.gradientPrimary,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.play_circle_filled_rounded, color: Colors.white, size: 64),
                        const SizedBox(height: 12),
                        Text(
                          isAr ? 'فيديو الدرس' : 'Lesson Video',
                          style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 16),
                        if (videoUrl != null)
                          ElevatedButton.icon(
                            onPressed: () => _launchUrl(videoUrl),
                            icon: const Icon(Icons.open_in_new_rounded, size: 16),
                            label: Text(isAr ? 'فتح الفيديو' : 'Open Video'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: AppColors.primary,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // PDF section
                if (type == 'PDF' || pdfUrl != null) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.picture_as_pdf_rounded, color: AppColors.error, size: 48),
                        const SizedBox(height: 8),
                        Text(
                          isAr ? 'ملف PDF' : 'PDF Document',
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                        ),
                        const SizedBox(height: 12),
                        if (pdfUrl != null)
                          ElevatedButton.icon(
                            onPressed: () => _launchUrl(pdfUrl),
                            icon: const Icon(Icons.open_in_new_rounded, size: 16),
                            label: Text(isAr ? 'فتح الملف' : 'Open PDF'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Text content
                if (content != null && content.toString().isNotEmpty) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.article_outlined, color: AppColors.primary, size: 18),
                            const SizedBox(width: 8),
                            Text(
                              isAr ? 'محتوى الدرس' : 'Lesson Content',
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Divider(color: AppColors.border),
                        const SizedBox(height: 12),
                        Text(
                          content.toString(),
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppColors.textSecondary,
                            height: 1.7,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 80),
              ],
            ),
          ),
        ),

        // Bottom bar: prev/next + mark complete
        Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: AppColors.border)),
          ),
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Mark complete
              if (!_isCompleted)
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _markingComplete ? null : _markComplete,
                    icon: _markingComplete
                        ? const SizedBox(
                            width: 16, height: 16,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : const Icon(Icons.check_circle_outline_rounded, size: 18),
                    label: Text(isAr ? 'تحديد كمكتمل' : 'Mark as Complete'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.success,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                  ),
                ),
              if (!_isCompleted) const SizedBox(height: 10),
              // Prev / Next
              Row(
                children: [
                  if (hasPrev)
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _navigateToLesson(_lessons[currentIdx - 1], isAr),
                        icon: const Icon(Icons.arrow_back_rounded, size: 16),
                        label: Text(isAr ? 'السابق' : 'Previous'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.primary,
                          side: const BorderSide(color: AppColors.primary),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                  if (hasPrev && hasNext) const SizedBox(width: 12),
                  if (hasNext)
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _navigateToLesson(_lessons[currentIdx + 1], isAr),
                        icon: const Icon(Icons.arrow_forward_rounded, size: 16),
                        label: Text(isAr ? 'التالي' : 'Next'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 0,
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _typeBadge(String type, bool isAr) {
    IconData icon;
    Color color;
    String label;

    switch (type) {
      case 'VIDEO':
        icon = Icons.play_circle_outline_rounded;
        color = AppColors.error;
        label = isAr ? 'فيديو' : 'Video';
        break;
      case 'PDF':
        icon = Icons.picture_as_pdf_rounded;
        color = AppColors.warning;
        label = 'PDF';
        break;
      case 'QUIZ':
        icon = Icons.quiz_outlined;
        color = AppColors.success;
        label = isAr ? 'اختبار' : 'Quiz';
        break;
      default:
        icon = Icons.article_outlined;
        color = AppColors.info;
        label = isAr ? 'نص' : 'Text';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
