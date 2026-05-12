import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/utils/helpers.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';

class ChildDetailScreen extends StatefulWidget {
  final String childId;
  final String childName;

  const ChildDetailScreen({
    super.key,
    required this.childId,
    required this.childName,
  });

  @override
  State<ChildDetailScreen> createState() => _ChildDetailScreenState();
}

class _ChildDetailScreenState extends State<ChildDetailScreen> with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  String? _error;
  late TabController _tabCtrl;
  // ignore: unused_field
  Map<String, dynamic> _data = {};
  List<dynamic> _grades = [];
  List<dynamic> _attendance = [];
  List<dynamic> _courses = [];

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final res = await ApiClient.instance.get(
        ApiEndpoints.childDetails(widget.childId),
      );
      final raw = res.data;
      final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
      if (d is Map) {
        setState(() {
          _data = Map<String, dynamic>.from(d);
          final rawGrades = d['grades'];
          final rawAttendance = d['attendance'];
          final rawCourses = d['courses'];
          _grades = rawGrades is List ? List<dynamic>.from(rawGrades) : <dynamic>[];
          _attendance = rawAttendance is List ? List<dynamic>.from(rawAttendance) : <dynamic>[];
          _courses = rawCourses is List ? List<dynamic>.from(rawCourses) : <dynamic>[];
          _isLoading = false;
        });
      } else {
        setState(() { _isLoading = false; });
      }
    } catch (e) {
      setState(() { _error = e.toString(); _isLoading = false; });
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
        appBar: AppBar(
          title: Text(
            widget.childName.isNotEmpty ? widget.childName : (isAr ? 'تفاصيل الطالب' : 'Student Details'),
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.primary,
          elevation: 0,
          bottom: TabBar(
            controller: _tabCtrl,
            labelColor: AppColors.primary,
            unselectedLabelColor: AppColors.textSecondary,
            indicatorColor: AppColors.primary,
            tabs: [
              Tab(text: isAr ? 'نظرة عامة' : 'Overview'),
              Tab(text: isAr ? 'الدرجات' : 'Grades'),
              Tab(text: isAr ? 'الحضور' : 'Attendance'),
            ],
          ),
        ),
        body: _isLoading
            ? const Padding(padding: EdgeInsets.all(16), child: ListSkeletonLoader())
            : _error != null
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.error_outline, color: AppColors.error, size: 48),
                        const SizedBox(height: 12),
                        Text(_error!),
                        const SizedBox(height: 12),
                        ElevatedButton(onPressed: _loadData, child: Text(isAr ? 'إعادة' : 'Retry')),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _loadData,
                    child: TabBarView(
                      controller: _tabCtrl,
                      children: [
                        _buildOverview(isAr),
                        _buildGrades(isAr),
                        _buildAttendance(isAr),
                      ],
                    ),
                  ),
      ),
    );
  }

  Widget _buildOverview(bool isAr) {
    final avgScore = _grades.isNotEmpty
        ? _grades.fold<double>(0, (sum, g) => sum + ((g['score'] ?? 0) as num).toDouble()) / _grades.length
        : 0.0;
    final presentCount = _attendance.where((a) => a['status'] == 'PRESENT').length;
    final totalAttendance = _attendance.length;
    final attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance * 100) : 0.0;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Stats row
          Row(
            children: [
              Expanded(
                child: _statBox(
                  isAr ? 'المعدل' : 'Avg Grade',
                  Helpers.getLetterGrade(avgScore),
                  Helpers.getGradeColor(avgScore),
                  Icons.grade_rounded,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _statBox(
                  isAr ? 'الحضور' : 'Attendance',
                  '${attendanceRate.toStringAsFixed(0)}%',
                  attendanceRate >= 75 ? AppColors.success : AppColors.error,
                  Icons.fact_check_rounded,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _statBox(
                  isAr ? 'المواد' : 'Courses',
                  '${_courses.length}',
                  AppColors.primary,
                  Icons.menu_book_rounded,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // Recent grades
          if (_grades.isNotEmpty) ...[
            Text(isAr ? 'آخر الدرجات' : 'Recent Grades',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            const SizedBox(height: 12),
            ..._grades.take(3).map((g) => _buildGradeRow(g, isAr)),
          ],
          const SizedBox(height: 20),
          // Courses
          if (_courses.isNotEmpty) ...[
            Text(isAr ? 'المواد المسجلة' : 'Enrolled Courses',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            const SizedBox(height: 12),
            ..._courses.take(5).map((c) => Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  const Icon(Icons.menu_book_rounded, color: AppColors.primary, size: 18),
                  const SizedBox(width: 10),
                  Expanded(child: Text(c['title']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w500))),
                ],
              ),
            )),
          ],
        ],
      ),
    );
  }

  Widget _statBox(String label, String value, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 8),
          Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
          Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary), textAlign: TextAlign.center),
        ],
      ),
    );
  }

  Widget _buildGrades(bool isAr) {
    if (_grades.isEmpty) {
      return Center(child: Text(isAr ? 'لا توجد درجات' : 'No grades available',
          style: const TextStyle(color: AppColors.textSecondary)));
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _grades.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (_, i) => _buildGradeRow(_grades[i], isAr),
    );
  }

  Widget _buildGradeRow(Map<String, dynamic> g, bool isAr) {
    final subject = g['subject']?.toString() ??
        g['courseName']?.toString() ??
        (g['course'] is Map ? g['course']['title']?.toString() : null) ??
        '';
    final score = (g['score'] ?? 0).toDouble();
    final maxScore = (g['maxPoints'] ?? g['maxScore'] ?? g['max_score'] ?? 100).toDouble();
    final percentage = maxScore > 0 ? (score / maxScore * 100) : 0.0;
    final color = Helpers.getGradeColor(percentage);

    return Container(
      margin: const EdgeInsets.only(bottom: 0),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
            child: Center(
              child: Text(
                Helpers.getLetterGrade(percentage),
                style: TextStyle(fontWeight: FontWeight.bold, color: color),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(subject, style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary))),
          Text(
            Helpers.formatScore(score, maxScore),
            style: TextStyle(fontWeight: FontWeight.bold, color: color),
          ),
        ],
      ),
    );
  }

  Widget _buildAttendance(bool isAr) {
    if (_attendance.isEmpty) {
      return Center(child: Text(isAr ? 'لا توجد بيانات حضور' : 'No attendance records',
          style: const TextStyle(color: AppColors.textSecondary)));
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _attendance.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, i) {
        final a = _attendance[i] as Map<String, dynamic>;
        final status = a['status']?.toString() ?? 'PRESENT';
        final dateRaw = a['date']?.toString();
        DateTime? date;
        if (dateRaw != null) date = DateTime.tryParse(dateRaw);

        Color color;
        IconData icon;
        switch (status.toUpperCase()) {
          case 'PRESENT':
            color = AppColors.success; icon = Icons.check_circle_rounded; break;
          case 'ABSENT':
            color = AppColors.error; icon = Icons.cancel_rounded; break;
          case 'LATE':
            color = AppColors.warning; icon = Icons.access_time_rounded; break;
          default:
            color = AppColors.textSecondary; icon = Icons.help_outline_rounded;
        }

        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              Container(
                width: 36, height: 36,
                decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
                child: Icon(icon, color: color, size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      date != null ? Helpers.formatDate(date) : dateRaw ?? '',
                      style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                    ),
                    if (a['courseName'] != null || a['course'] is Map)
                      Text(
                        a['courseName']?.toString() ?? (a['course'] as Map?)?['title']?.toString() ?? '',
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  status == 'PRESENT' ? (isAr ? 'حاضر' : 'Present')
                      : status == 'ABSENT' ? (isAr ? 'غائب' : 'Absent')
                      : status == 'LATE' ? (isAr ? 'متأخر' : 'Late')
                      : status,
                  style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
