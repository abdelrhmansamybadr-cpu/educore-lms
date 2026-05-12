import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';

class GradebookScreen extends StatefulWidget {
  const GradebookScreen({super.key});

  @override
  State<GradebookScreen> createState() => _GradebookScreenState();
}

class _GradebookScreenState extends State<GradebookScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _courses = [];
  Map<String, dynamic>? _selectedCourse;
  List<dynamic> _courseGrades = [];
  bool _gradesLoading = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final res = await ApiClient.instance.get(ApiEndpoints.courses);
      final raw = res.data;
      final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
      setState(() {
        _courses = d is List ? List.from(d) : [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  Future<void> _loadCourseGrades(String courseId) async {
    setState(() { _gradesLoading = true; });
    try {
      final res = await ApiClient.instance.get('/gradebook/course/$courseId');
      final raw = res.data;
      final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
      setState(() {
        _courseGrades = d is List ? List.from(d) : [];
        _gradesLoading = false;
      });
    } catch (_) {
      setState(() { _gradesLoading = false; _courseGrades = []; });
    }
  }

  Future<void> _saveGrade(String studentId, String courseId, double points, double maxPoints) async {
    try {
      await ApiClient.instance.post('/grades', data: {
        'studentId': studentId,
        'courseId': courseId,
        'points': points,
        'maxPoints': maxPoints,
      });
    } catch (_) {}
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
          title: Text(isAr ? 'دفتر الدرجات' : 'Gradebook', style: const TextStyle(fontWeight: FontWeight.bold)),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.primary,
          elevation: 0,
          bottom: const PreferredSize(preferredSize: Size.fromHeight(1), child: Divider(height: 1, color: AppColors.border)),
          leading: _selectedCourse != null
              ? IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => setState(() { _selectedCourse = null; _courseGrades = []; }))
              : null,
        ),
        body: _isLoading
            ? const Padding(padding: EdgeInsets.all(16), child: ListSkeletonLoader())
            : _error != null
                ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                    const Icon(Icons.error_outline, color: AppColors.error, size: 48),
                    const SizedBox(height: 12),
                    Text(_error!),
                    const SizedBox(height: 12),
                    ElevatedButton(onPressed: _loadData, child: Text(isAr ? 'إعادة' : 'Retry')),
                  ]))
                : _selectedCourse == null
                    ? _buildCourseList(isAr)
                    : _buildGradeList(isAr),
      ),
    );
  }

  Widget _buildCourseList(bool isAr) {
    if (_courses.isEmpty) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.book_outlined, size: 64, color: AppColors.border),
        const SizedBox(height: 16),
        Text(isAr ? 'لا توجد مقررات' : 'No courses', style: const TextStyle(color: AppColors.textSecondary)),
      ]));
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _courses.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, i) {
        final c = _courses[i];
        final title = (isAr && c['titleAr'] != null) ? c['titleAr'] : c['title'];
        return InkWell(
          onTap: () {
            setState(() { _selectedCourse = c; });
            _loadCourseGrades(c['id']);
          },
          borderRadius: BorderRadius.circular(16),
          child: Container(
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 48, height: 48,
                  decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                  child: const Icon(Icons.menu_book_rounded, color: AppColors.primary),
                ),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(title?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                  Text(c['subject']?['name'] ?? '', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                ])),
                const Icon(Icons.chevron_right, color: AppColors.textSecondary),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildGradeList(bool isAr) {
    final courseName = (isAr && _selectedCourse!['titleAr'] != null) ? _selectedCourse!['titleAr'] : _selectedCourse!['title'];
    if (_gradesLoading) return const Padding(padding: EdgeInsets.all(16), child: ListSkeletonLoader());
    if (_courseGrades.isEmpty) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.grade_outlined, size: 64, color: AppColors.border),
        const SizedBox(height: 16),
        Text(isAr ? 'لا توجد درجات لـ $courseName' : 'No grades for $courseName', style: const TextStyle(color: AppColors.textSecondary)),
      ]));
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _courseGrades.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, i) {
        final g = _courseGrades[i];
        final name = g['student']?['profile'] != null
            ? '${g['student']['profile']['firstName']} ${g['student']['profile']['lastName']}'
            : g['student']?['email'] ?? '';
        final points = (g['points'] ?? 0).toDouble();
        final maxPoints = (g['maxPoints'] ?? 100).toDouble();
        final pct = maxPoints > 0 ? (points / maxPoints * 100) : 0.0;
        return Container(
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              CircleAvatar(radius: 20, backgroundColor: AppColors.primary.withOpacity(0.1), child: Text(name.isNotEmpty ? name[0] : '?', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold))),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(name, style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                Text('${points.toStringAsFixed(0)} / ${maxPoints.toStringAsFixed(0)} pts', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              ])),
              Text('${pct.toStringAsFixed(1)}%', style: TextStyle(fontWeight: FontWeight.bold, color: pct >= 60 ? AppColors.success : AppColors.error)),
            ],
          ),
        );
      },
    );
  }
}
