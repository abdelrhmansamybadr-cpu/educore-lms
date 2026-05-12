import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../features/auth/providers/auth_provider.dart';

class QuizAttemptScreen extends StatefulWidget {
  final String quizId;
  final String quizTitle;

  const QuizAttemptScreen({
    super.key,
    required this.quizId,
    required this.quizTitle,
  });

  @override
  State<QuizAttemptScreen> createState() => _QuizAttemptScreenState();
}

class _QuizAttemptScreenState extends State<QuizAttemptScreen> {
  List<dynamic> _questions = [];
  int _currentIndex = 0;
  final Map<String, String> _answers = {};
  String? _attemptId;
  bool _loading = true;
  bool _submitted = false;
  Map? _result;
  int? _timeRemaining;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _initQuiz();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _initQuiz() async {
    setState(() => _loading = true);
    try {
      final quizRes = await ApiClient.instance.get(ApiEndpoints.quizById(widget.quizId));
      final quizData = quizRes.data is Map ? (quizRes.data['data'] ?? quizRes.data) : quizRes.data;
      final questions = (quizData['questions'] as List?) ?? [];
      final timeLimitMinutes = quizData['timeLimit'] ?? quizData['timeLimitMinutes'];

      final startRes = await ApiClient.instance.post(ApiEndpoints.startQuizAttempt(widget.quizId));
      final startData = startRes.data is Map ? (startRes.data['data'] ?? startRes.data) : startRes.data;
      final attemptId = startData['attemptId']?.toString();

      setState(() {
        _questions = questions;
        _attemptId = attemptId;
        if (timeLimitMinutes != null) {
          _timeRemaining = (timeLimitMinutes as num).toInt() * 60;
          _startTimer();
        }
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load quiz: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_timeRemaining == null || _timeRemaining! <= 0) {
        _timer?.cancel();
        _submitQuiz();
      } else {
        setState(() => _timeRemaining = _timeRemaining! - 1);
      }
    });
  }

  String _formatTime(int seconds) {
    final h = seconds ~/ 3600;
    final m = (seconds % 3600) ~/ 60;
    final s = seconds % 60;
    if (h > 0) {
      return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
    }
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  Future<void> _submitQuiz() async {
    _timer?.cancel();
    setState(() => _loading = true);
    try {
      final answers = _answers.entries
          .map((e) => {'questionId': e.key, 'selectedOptionId': e.value})
          .toList();
      final res = await ApiClient.instance.post(
        ApiEndpoints.submitQuizAttempt(_attemptId ?? ''),
        data: {'answers': answers},
      );
      final data = res.data is Map ? (res.data['data'] ?? res.data) : res.data;
      setState(() {
        _result = data is Map ? data : {};
        _submitted = true;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to submit: $e'), backgroundColor: AppColors.error),
        );
      }
    }
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
          title: Text(widget.quizTitle),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.primary,
          elevation: 0,
          bottom: const PreferredSize(
            preferredSize: Size.fromHeight(1),
            child: Divider(height: 1, color: AppColors.border),
          ),
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
            : _submitted
                ? _buildResult(isAr)
                : _questions.isEmpty
                    ? Center(
                        child: Text(
                          isAr ? 'لا توجد أسئلة' : 'No questions found',
                          style: const TextStyle(color: AppColors.textSecondary),
                        ),
                      )
                    : _buildQuiz(isAr),
      ),
    );
  }

  Widget _buildQuiz(bool isAr) {
    final total = _questions.length;
    final q = _questions[_currentIndex];
    final qId = q['id']?.toString() ?? '$_currentIndex';
    final qText = isAr && q['textAr'] != null ? q['textAr'] : q['text'] ?? '';
    final options = (q['options'] as List?) ?? [];
    final selectedOption = _answers[qId];
    final isLast = _currentIndex == total - 1;

    return Column(
      children: [
        // Progress bar
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    isAr
                        ? 'السؤال ${_currentIndex + 1} من $total'
                        : 'Question ${_currentIndex + 1} of $total',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  if (_timeRemaining != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: _timeRemaining! < 60
                            ? AppColors.error.withOpacity(0.1)
                            : AppColors.info.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: _timeRemaining! < 60
                              ? AppColors.error.withOpacity(0.4)
                              : AppColors.info.withOpacity(0.4),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.timer_outlined,
                            size: 14,
                            color: _timeRemaining! < 60 ? AppColors.error : AppColors.info,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _formatTime(_timeRemaining!),
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: _timeRemaining! < 60 ? AppColors.error : AppColors.info,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              LinearProgressIndicator(
                value: (_currentIndex + 1) / total,
                backgroundColor: AppColors.border,
                color: AppColors.primary,
                minHeight: 6,
                borderRadius: BorderRadius.circular(3),
              ),
            ],
          ),
        ),
        // Question + options
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Text(
                    qText,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                      height: 1.5,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                ...options.map((opt) {
                  final optId = opt['id']?.toString() ?? '';
                  final optText = isAr && opt['textAr'] != null ? opt['textAr'] : opt['text'] ?? '';
                  final isSelected = selectedOption == optId;

                  return GestureDetector(
                    onTap: () => setState(() => _answers[qId] = optId),
                    child: Container(
                      width: double.infinity,
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.primary.withOpacity(0.05) : Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: isSelected ? AppColors.primary : AppColors.border,
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 24,
                            height: 24,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isSelected ? AppColors.primary : Colors.transparent,
                              border: Border.all(
                                color: isSelected ? AppColors.primary : AppColors.border,
                                width: 2,
                              ),
                            ),
                            child: isSelected
                                ? const Icon(Icons.check, color: Colors.white, size: 14)
                                : null,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              optText,
                              style: TextStyle(
                                fontSize: 14,
                                color: isSelected ? AppColors.primary : AppColors.textPrimary,
                                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
        ),
        // Navigation buttons
        Container(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: AppColors.border)),
          ),
          child: Row(
            children: [
              if (_currentIndex > 0)
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => setState(() => _currentIndex--),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      side: const BorderSide(color: AppColors.primary),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text(isAr ? 'السابق' : 'Previous'),
                  ),
                ),
              if (_currentIndex > 0) const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: isLast ? _submitQuiz : () => setState(() => _currentIndex++),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isLast ? AppColors.success : AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  child: Text(
                    isLast
                        ? (isAr ? 'إرسال' : 'Submit')
                        : (isAr ? 'التالي' : 'Next'),
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildResult(bool isAr) {
    final score = (_result?['score'] ?? 0).toInt();
    final total = (_result?['totalPoints'] ?? _questions.length).toInt();
    final percentage = total > 0 ? (score / total * 100) : 0.0;

    String message;
    Color messageColor;
    if (percentage >= 80) {
      message = isAr ? 'ممتاز! 🎉' : 'Excellent! 🎉';
      messageColor = AppColors.success;
    } else if (percentage >= 60) {
      message = isAr ? 'عمل جيد! 👍' : 'Good work! 👍';
      messageColor = AppColors.info;
    } else {
      message = isAr ? 'استمر في التدرب! 💪' : 'Keep practicing! 💪';
      messageColor = AppColors.warning;
    }

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.primary.withOpacity(0.08),
                border: Border.all(color: AppColors.primary.withOpacity(0.2), width: 3),
              ),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '${percentage.toStringAsFixed(0)}%',
                      style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              '$score / $total ${isAr ? "نقطة" : "points"}',
              style: const TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: LinearProgressIndicator(
                value: percentage / 100,
                backgroundColor: AppColors.border,
                color: messageColor,
                minHeight: 10,
                borderRadius: BorderRadius.circular(5),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              message,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: messageColor,
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => context.go('/student/quizzes'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
                child: Text(
                  isAr ? 'العودة إلى الاختبارات' : 'Back to Quizzes',
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
