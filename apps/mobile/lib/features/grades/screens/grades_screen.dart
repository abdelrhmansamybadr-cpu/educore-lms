import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/utils/helpers.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/app_bar_widget.dart';
import '../../../shared/widgets/bottom_nav_widget.dart';
import '../../../shared/widgets/skeleton_loader.dart';
import '../../../shared/widgets/empty_state_widget.dart';
import '../../../shared/widgets/error_widget.dart';

class GradesScreen extends StatefulWidget {
  const GradesScreen({super.key});

  @override
  State<GradesScreen> createState() => _GradesScreenState();
}

class _GradesScreenState extends State<GradesScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _grades = [];
  double _average = 0;

  @override
  void initState() {
    super.initState();
    _loadGrades();
  }

  Future<void> _loadGrades() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final response = await ApiClient.instance.get(ApiEndpoints.myGrades);
      final data = response.data;
      final grades = (data is Map ? data['data'] : data) ?? [];
      double sum = 0;
      double count = 0;
      for (final g in grades) {
        final score = (g['score'] ?? 0).toDouble();
        final maxScore = (g['maxPoints'] ?? g['maxScore'] ?? g['max_score'] ?? 100).toDouble();
        if (maxScore > 0) {
          sum += score / maxScore * 100;
          count++;
        }
      }
      setState(() {
        _grades = grades;
        _average = count > 0 ? sum / count : 0;
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

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBarWidget(
          title: S.grades(isAr),
          showBack: false,
        ),
        body: _isLoading
            ? const Padding(
                padding: EdgeInsets.all(16),
                child: ListSkeletonLoader(),
              )
            : _error != null
                ? AppErrorWidget(
                    message: _error!,
                    onRetry: _loadGrades,
                    retryLabel: S.retry(isAr),
                  )
                : _grades.isEmpty
                    ? EmptyStateWidget(
                        emoji: '📊',
                        title: S.noGrades(isAr),
                        subtitle: S.noGradesSubtitle(isAr),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadGrades,
                        child: ListView(
                          padding: const EdgeInsets.all(16),
                          children: [
                            // Average Card
                            _buildAverageCard(isAr),
                            const SizedBox(height: 20),
                            Text(
                              isAr ? 'الدرجات التفصيلية' : 'Grade Details',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 12),
                            ..._grades.map((g) => _buildGradeCard(g, isAr)),
                          ],
                        ),
                      ),
        bottomNavigationBar: isTeacher
            ? TeacherBottomNav(currentIndex: 3, isAr: isAr)
            : StudentBottomNav(currentIndex: 3, isAr: isAr),
      ),
    );
  }

  Widget _buildAverageCard(bool isAr) {
    final letterGrade = Helpers.getLetterGrade(_average);
    final color = Helpers.getGradeColor(_average);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, AppColors.primaryLight],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  S.average(isAr),
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.8),
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '${_average.toStringAsFixed(1)}%',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 36,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '${_grades.length} ${S.grades(isAr)}',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.7),
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.15),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white.withOpacity(0.3), width: 2),
            ),
            child: Center(
              child: Text(
                letterGrade,
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGradeCard(Map<String, dynamic> g, bool isAr) {
    final subject = g['subject'] ??
        g['courseName'] ??
        (g['course'] is Map ? g['course']['title'] : '');
    final score = (g['score'] ?? 0).toDouble();
    final maxScore = (g['maxScore'] ?? g['max_score'] ?? 100).toDouble();
    final percentage = maxScore > 0 ? score / maxScore * 100 : 0.0;
    final grade = Helpers.getLetterGrade(percentage);
    final color = Helpers.getGradeColor(percentage);
    final date = g['createdAt'] != null
        ? DateTime.tryParse(g['createdAt'])
        : null;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    grade,
                    style: TextStyle(
                      fontSize: 16,
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
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    if (date != null)
                      Text(
                        Helpers.formatDate(date),
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    Helpers.formatScore(score, maxScore),
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                  Text(
                    '${percentage.toStringAsFixed(1)}%',
                    style: TextStyle(
                      fontSize: 12,
                      color: color.withOpacity(0.7),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          LinearProgressIndicator(
            value: percentage / 100,
            backgroundColor: AppColors.border,
            color: color,
            minHeight: 6,
            borderRadius: BorderRadius.circular(3),
          ),
        ],
      ),
    );
  }
}
