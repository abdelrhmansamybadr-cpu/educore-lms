import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';
import '../../../shared/widgets/empty_state_widget.dart';

class QuizzesScreen extends StatefulWidget {
  const QuizzesScreen({super.key});

  @override
  State<QuizzesScreen> createState() => _QuizzesScreenState();
}

class _QuizzesScreenState extends State<QuizzesScreen> {
  List<dynamic> _quizzes = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadQuizzes();
  }

  Future<void> _loadQuizzes() async {
    setState(() { _loading = true; _error = null; });
    try {
      // No base GET /quizzes route — fetch courses first, then quizzes per course
      final coursesRes = await ApiClient.instance.get(ApiEndpoints.courses);
      final coursesRaw = coursesRes.data;
      final courses = ((coursesRaw is Map ? coursesRaw['data'] : coursesRaw) ?? []) as List;

      final allQuizzes = <dynamic>[];
      await Future.wait(courses.take(10).map((c) async {
        try {
          final qRes = await ApiClient.instance.get('/quizzes/course/${c['id']}');
          final qRaw = qRes.data;
          final qs = (qRaw is Map ? qRaw['data'] : qRaw) ?? [];
          if (qs is List) allQuizzes.addAll(qs);
        } catch (_) {}
      }));

      setState(() {
        _quizzes = allQuizzes;
        _loading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthProvider>();
    final isAr = auth.isAr;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(isAr ? 'الاختبارات' : 'Quizzes'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(1),
          child: Divider(height: 1, color: AppColors.border),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadQuizzes,
        child: _loading
            ? const Padding(
                padding: EdgeInsets.all(16),
                child: Column(children: [
                  SkeletonLoader(height: 100), SizedBox(height: 12),
                  SkeletonLoader(height: 100), SizedBox(height: 12),
                  SkeletonLoader(height: 100),
                ]),
              )
            : _error != null
                ? Center(child: Text(_error!, style: const TextStyle(color: AppColors.error)))
                : _quizzes.isEmpty
                    ? EmptyStateWidget(
                        emoji: '📝',
                        title: isAr ? 'لا توجد اختبارات' : 'No Quizzes',
                        subtitle: isAr ? 'لا توجد اختبارات متاحة حالياً' : 'No quizzes available right now',
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _quizzes.length,
                        itemBuilder: (ctx, i) {
                          final quiz = _quizzes[i];
                          final title = isAr ? (quiz['titleAr'] ?? quiz['title']) : quiz['title'];
                          final questions = quiz['_count']?['questions'] ?? quiz['questionCount'] ?? 0;
                          final timeLimit = quiz['timeLimitMinutes'];
                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: ListTile(
                              contentPadding: const EdgeInsets.all(16),
                              leading: Container(
                                width: 48, height: 48,
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(Icons.quiz_outlined, color: AppColors.primary),
                              ),
                              title: Text(
                                title ?? '',
                                style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                              ),
                              subtitle: Padding(
                                padding: const EdgeInsets.only(top: 6),
                                child: Row(children: [
                                  _chip(Icons.help_outline, '$questions ${isAr ? "سؤال" : "Q"}', AppColors.info),
                                  if (timeLimit != null) ...[
                                    const SizedBox(width: 8),
                                    _chip(Icons.timer_outlined, '$timeLimit ${isAr ? "د" : "min"}', AppColors.warning),
                                  ],
                                ]),
                              ),
                              trailing: ElevatedButton(
                                onPressed: () {
                                  final quizTitle = isAr ? (quiz['titleAr'] ?? quiz['title']) : quiz['title'];
                                  context.go('/student/quizzes/${quiz['id']}?title=${Uri.encodeComponent(quizTitle ?? '')}');
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                  textStyle: const TextStyle(fontSize: 12),
                                ),
                                child: Text(isAr ? 'ابدأ' : 'Start'),
                              ),
                            ),
                          );
                        },
                      ),
      ),
    );
  }

  Widget _chip(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 12, color: color),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w500)),
      ]),
    );
  }

}
