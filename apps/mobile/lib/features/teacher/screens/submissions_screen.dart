import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/utils/helpers.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';

class SubmissionsScreen extends StatefulWidget {
  const SubmissionsScreen({super.key});

  @override
  State<SubmissionsScreen> createState() => _SubmissionsScreenState();
}

class _SubmissionsScreenState extends State<SubmissionsScreen> {
  bool _loadingAssignments = true;
  bool _loadingSubmissions = false;
  List<dynamic> _assignments = [];
  List<dynamic> _submissions = [];
  String? _selectedAssignmentId;
  // ignore: unused_field
  String _selectedAssignmentTitle = '';

  @override
  void initState() {
    super.initState();
    _loadAssignments();
  }

  Future<void> _loadAssignments() async {
    setState(() { _loadingAssignments = true; });
    try {
      final res = await ApiClient.instance.get(ApiEndpoints.pendingGrading);
      final raw = res.data;
      final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
      setState(() {
        _assignments = d is List ? List<dynamic>.from(d) : <dynamic>[];
        _loadingAssignments = false;
      });
    } catch (_) {
      setState(() => _loadingAssignments = false);
    }
  }

  Future<void> _loadSubmissions(String assignmentId) async {
    setState(() { _loadingSubmissions = true; _submissions = []; });
    try {
      final res = await ApiClient.instance.get(
        ApiEndpoints.submissionsByAssignment(assignmentId),
      );
      final raw = res.data;
      final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
      setState(() {
        _submissions = d is List ? List<dynamic>.from(d) : <dynamic>[];
        _loadingSubmissions = false;
      });
    } catch (_) {
      setState(() => _loadingSubmissions = false);
    }
  }

  void _showGradeSheet(Map<String, dynamic> submission, bool isAr) {
    final gradeCtrl = TextEditingController(
      text: submission['grade']?['score']?.toString() ?? '',
    );
    final feedbackCtrl = TextEditingController(
      text: submission['grade']?['feedback']?.toString() ?? '',
    );
    bool saving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(builder: (ctx, setSheet) {
          final profile = (submission['student']?['profile'] as Map?) ??
              (submission['student'] as Map?) ?? {};
          final first = profile['firstName']?.toString() ?? '';
          final last = profile['lastName']?.toString() ?? '';
          final name = '$first $last'.trim();

          Future<void> save() async {
            final score = double.tryParse(gradeCtrl.text.trim());
            if (score == null) return;
            setSheet(() => saving = true);
            try {
              await ApiClient.instance.post(ApiEndpoints.gradeSubmission, data: {
                'studentId': submission['studentId']?.toString() ?? submission['student']?['id']?.toString(),
                'assignmentId': _selectedAssignmentId,
                'score': score,
                'feedback': feedbackCtrl.text.trim(),
              });
              Navigator.pop(ctx);
              if (_selectedAssignmentId != null) _loadSubmissions(_selectedAssignmentId!);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                  content: Text(isAr ? 'تم حفظ الدرجة' : 'Grade saved successfully'),
                  backgroundColor: AppColors.success,
                ));
              }
            } catch (e) {
              setSheet(() => saving = false);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                  content: Text(e.toString()),
                  backgroundColor: AppColors.error,
                ));
              }
            }
          }

          return Padding(
            padding: EdgeInsets.only(
              left: 16, right: 16, top: 20,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: AppColors.primary.withOpacity(0.1),
                      child: Text(
                        Helpers.getInitials(first, last),
                        style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name.isNotEmpty ? name : 'Student',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        Text(isAr ? 'تقييم التسليم' : 'Grade Submission',
                            style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Text(isAr ? 'الدرجة (0 - 100)' : 'Score (0 - 100)',
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                const SizedBox(height: 8),
                TextField(
                  controller: gradeCtrl,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    hintText: '0 - 100',
                    filled: true,
                    fillColor: AppColors.background,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    suffixText: '/ 100',
                  ),
                ),
                const SizedBox(height: 12),
                Text(isAr ? 'التغذية الراجعة (اختياري)' : 'Feedback (optional)',
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                const SizedBox(height: 8),
                TextField(
                  controller: feedbackCtrl,
                  maxLines: 3,
                  decoration: InputDecoration(
                    hintText: isAr ? 'أضف تعليقاً...' : 'Add feedback...',
                    filled: true,
                    fillColor: AppColors.background,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: saving ? null : save,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: saving
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : Text(isAr ? 'حفظ الدرجة' : 'Save Grade'),
                  ),
                ),
              ],
            ),
          );
        });
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isAr = auth.isAr;

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: Text(isAr ? 'تسليمات الطلاب' : 'Student Submissions',
              style: const TextStyle(fontWeight: FontWeight.bold)),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.primary,
          elevation: 0,
          bottom: const PreferredSize(
            preferredSize: Size.fromHeight(1),
            child: Divider(height: 1, color: AppColors.border),
          ),
        ),
        body: _loadingAssignments
            ? const Padding(padding: EdgeInsets.all(16), child: ListSkeletonLoader())
            : Column(
                children: [
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.all(16),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _selectedAssignmentId,
                          isExpanded: true,
                          hint: Text(
                            isAr ? 'اختر الواجب' : 'Select Assignment',
                            style: const TextStyle(color: AppColors.textSecondary),
                          ),
                          items: _assignments.map((a) {
                            return DropdownMenuItem<String>(
                              value: a['id']?.toString(),
                              child: Text(a['title']?.toString() ?? '', overflow: TextOverflow.ellipsis),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val == null) return;
                            final a = _assignments.firstWhere((x) => x['id']?.toString() == val, orElse: () => {});
                            setState(() {
                              _selectedAssignmentId = val;
                              _selectedAssignmentTitle = a['title']?.toString() ?? '';
                            });
                            _loadSubmissions(val);
                          },
                        ),
                      ),
                    ),
                  ),
                  const Divider(height: 1, color: AppColors.border),
                  Expanded(
                    child: _loadingSubmissions
                        ? const Padding(padding: EdgeInsets.all(16), child: ListSkeletonLoader())
                        : _selectedAssignmentId == null
                            ? Center(
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.assignment_turned_in_rounded, size: 64, color: AppColors.border),
                                    const SizedBox(height: 12),
                                    Text(
                                      isAr ? 'اختر واجباً لعرض التسليمات' : 'Select an assignment to view submissions',
                                      style: const TextStyle(color: AppColors.textSecondary),
                                    ),
                                  ],
                                ),
                              )
                            : _submissions.isEmpty
                                ? Center(
                                    child: Text(
                                      isAr ? 'لا توجد تسليمات بعد' : 'No submissions yet',
                                      style: const TextStyle(color: AppColors.textSecondary),
                                    ),
                                  )
                                : RefreshIndicator(
                                    onRefresh: () => _loadSubmissions(_selectedAssignmentId!),
                                    child: ListView.separated(
                                      padding: const EdgeInsets.all(16),
                                      itemCount: _submissions.length,
                                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                                      itemBuilder: (_, i) => _buildSubmissionCard(_submissions[i], isAr),
                                    ),
                                  ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildSubmissionCard(Map<String, dynamic> sub, bool isAr) {
    final profile = (sub['student']?['profile'] as Map?) ?? (sub['student'] as Map?) ?? {};
    final first = profile['firstName']?.toString() ?? '';
    final last = profile['lastName']?.toString() ?? '';
    final name = '$first $last'.trim();
    final submittedAt = sub['submittedAt']?.toString();
    final grade = sub['grade'] as Map?;
    final score = grade?['score'];
    final hasGrade = score != null;

    DateTime? submitted;
    if (submittedAt != null) submitted = DateTime.tryParse(submittedAt);

    return GestureDetector(
      onTap: () => _showGradeSheet(sub, isAr),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 22,
              backgroundColor: AppColors.primary.withOpacity(0.1),
              child: Text(
                Helpers.getInitials(first, last),
                style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name.isNotEmpty ? name : 'Student',
                    style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                  ),
                  if (submitted != null)
                    Text(
                      '${isAr ? 'تسليم:' : 'Submitted:'} ${Helpers.formatDateTime(submitted.toLocal())}',
                      style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                    ),
                  if (sub['fileUrl'] != null || sub['attachments'] != null)
                    Row(
                      children: [
                        const Icon(Icons.attach_file_rounded, size: 12, color: AppColors.info),
                        const SizedBox(width: 4),
                        Text(isAr ? 'ملف مرفق' : 'File attached',
                            style: const TextStyle(fontSize: 11, color: AppColors.info)),
                      ],
                    ),
                ],
              ),
            ),
            if (hasGrade)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Helpers.getGradeColor(score.toDouble()).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '$score/100',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Helpers.getGradeColor(score.toDouble()),
                    fontSize: 13,
                  ),
                ),
              )
            else
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.warning.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  isAr ? 'تقييم' : 'Grade',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    color: AppColors.warning,
                    fontSize: 12,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
