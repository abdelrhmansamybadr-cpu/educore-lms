import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/utils/helpers.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';

class TakeAttendanceScreen extends StatefulWidget {
  const TakeAttendanceScreen({super.key});

  @override
  State<TakeAttendanceScreen> createState() => _TakeAttendanceScreenState();
}

class _TakeAttendanceScreenState extends State<TakeAttendanceScreen> {
  bool _loadingCourses = true;
  bool _loadingStudents = false;
  bool _submitting = false;
  // ignore: unused_field
  String? _error;

  List<dynamic> _courses = [];
  List<dynamic> _students = [];
  String? _selectedCourseId;
  // ignore: unused_field
  String _selectedCourseName = '';
  DateTime _selectedDate = DateTime.now();
  Map<String, String> _attendance = {}; // studentId -> status

  @override
  void initState() {
    super.initState();
    _loadCourses();
  }

  Future<void> _loadCourses() async {
    setState(() { _loadingCourses = true; _error = null; });
    try {
      final res = await ApiClient.instance.get(ApiEndpoints.courses);
      final raw = res.data;
      final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
      setState(() {
        _courses = d is List ? List<dynamic>.from(d) : <dynamic>[];
        _loadingCourses = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _loadingCourses = false; });
    }
  }

  Future<void> _loadStudents(String courseId) async {
    setState(() { _loadingStudents = true; _students = []; _attendance = {}; });
    try {
      final res = await ApiClient.instance.get(
        ApiEndpoints.schoolUsers,
        queryParameters: {'role': 'STUDENT', 'courseId': courseId},
      );
      final raw = res.data;
      final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
      final students = d is List ? List<dynamic>.from(d) : <dynamic>[];
      final map = <String, String>{};
      for (final s in students) {
        map[s['id']?.toString() ?? ''] = 'PRESENT';
      }
      setState(() {
        _students = students;
        _attendance = map;
        _loadingStudents = false;
      });
    } catch (e) {
      setState(() { _loadingStudents = false; });
    }
  }

  Future<void> _submit(bool isAr) async {
    if (_selectedCourseId == null || _students.isEmpty) return;
    setState(() => _submitting = true);

    final dateStr = '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}';
    final records = _students.map((s) {
      final sid = s['id']?.toString() ?? '';
      return {'studentId': sid, 'status': _attendance[sid] ?? 'PRESENT', 'date': dateStr};
    }).toList();

    try {
      await ApiClient.instance.post(ApiEndpoints.bulkAttendance, data: {
        'date': dateStr,
        'courseId': _selectedCourseId,
        'records': records,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(isAr ? 'تم تسجيل الحضور بنجاح' : 'Attendance submitted successfully'),
          backgroundColor: AppColors.success,
        ));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(e.toString()),
          backgroundColor: AppColors.error,
        ));
      }
    } finally {
      setState(() => _submitting = false);
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
          title: Text(isAr ? 'تسجيل الحضور' : 'Take Attendance',
              style: const TextStyle(fontWeight: FontWeight.bold)),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.primary,
          elevation: 0,
          bottom: const PreferredSize(
            preferredSize: Size.fromHeight(1),
            child: Divider(height: 1, color: AppColors.border),
          ),
        ),
        body: _loadingCourses
            ? const Padding(padding: EdgeInsets.all(16), child: ListSkeletonLoader())
            : Column(
                children: [
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        // Date picker row
                        GestureDetector(
                          onTap: () async {
                            final d = await showDatePicker(
                              context: context,
                              initialDate: _selectedDate,
                              firstDate: DateTime.now().subtract(const Duration(days: 30)),
                              lastDate: DateTime.now(),
                            );
                            if (d != null) setState(() => _selectedDate = d);
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            decoration: BoxDecoration(
                              color: AppColors.background,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.calendar_today_rounded, color: AppColors.primary, size: 18),
                                const SizedBox(width: 10),
                                Text(
                                  Helpers.formatDate(_selectedDate),
                                  style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                                ),
                                const Spacer(),
                                const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.textSecondary),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        // Course dropdown
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14),
                          decoration: BoxDecoration(
                            color: AppColors.background,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _selectedCourseId,
                              isExpanded: true,
                              hint: Text(
                                isAr ? 'اختر المادة' : 'Select Course',
                                style: const TextStyle(color: AppColors.textSecondary),
                              ),
                              items: _courses.map((c) {
                                return DropdownMenuItem<String>(
                                  value: c['id']?.toString(),
                                  child: Text(c['title']?.toString() ?? ''),
                                );
                              }).toList(),
                              onChanged: (val) {
                                if (val == null) return;
                                final course = _courses.firstWhere((c) => c['id']?.toString() == val, orElse: () => {});
                                setState(() {
                                  _selectedCourseId = val;
                                  _selectedCourseName = course['title']?.toString() ?? '';
                                });
                                _loadStudents(val);
                              },
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 1, color: AppColors.border),
                  Expanded(
                    child: _loadingStudents
                        ? const Padding(padding: EdgeInsets.all(16), child: ListSkeletonLoader())
                        : _selectedCourseId == null
                            ? Center(
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.class_rounded, size: 64, color: AppColors.border),
                                    const SizedBox(height: 12),
                                    Text(
                                      isAr ? 'اختر مادة لعرض الطلاب' : 'Select a course to view students',
                                      style: const TextStyle(color: AppColors.textSecondary),
                                    ),
                                  ],
                                ),
                              )
                            : _students.isEmpty
                                ? Center(
                                    child: Text(
                                      isAr ? 'لا يوجد طلاب في هذه المادة' : 'No students in this course',
                                      style: const TextStyle(color: AppColors.textSecondary),
                                    ),
                                  )
                                : ListView.separated(
                                    padding: const EdgeInsets.all(16),
                                    itemCount: _students.length,
                                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                                    itemBuilder: (_, i) {
                                      final s = _students[i];
                                      final profile = (s['profile'] as Map?) ?? {};
                                      final first = profile['firstName']?.toString() ?? s['firstName']?.toString() ?? '';
                                      final last = profile['lastName']?.toString() ?? s['lastName']?.toString() ?? '';
                                      final name = '$first $last'.trim();
                                      final sid = s['id']?.toString() ?? '';
                                      final status = _attendance[sid] ?? 'PRESENT';

                                      return Container(
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(
                                          color: Colors.white,
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(color: AppColors.border),
                                        ),
                                        child: Row(
                                          children: [
                                            CircleAvatar(
                                              radius: 20,
                                              backgroundColor: AppColors.primary.withOpacity(0.1),
                                              child: Text(
                                                Helpers.getInitials(first, last),
                                                style: const TextStyle(
                                                  color: AppColors.primary,
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 13,
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: 12),
                                            Expanded(
                                              child: Text(
                                                name.isNotEmpty ? name : s['email']?.toString() ?? '',
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.w600,
                                                  color: AppColors.textPrimary,
                                                ),
                                              ),
                                            ),
                                            _statusButton(
                                              isAr ? 'حاضر' : 'P',
                                              'PRESENT',
                                              AppColors.success,
                                              status,
                                              sid,
                                              Icons.check_circle_rounded,
                                            ),
                                            const SizedBox(width: 6),
                                            _statusButton(
                                              isAr ? 'متأخر' : 'L',
                                              'LATE',
                                              AppColors.warning,
                                              status,
                                              sid,
                                              Icons.access_time_rounded,
                                            ),
                                            const SizedBox(width: 6),
                                            _statusButton(
                                              isAr ? 'غائب' : 'A',
                                              'ABSENT',
                                              AppColors.error,
                                              status,
                                              sid,
                                              Icons.cancel_rounded,
                                            ),
                                          ],
                                        ),
                                      );
                                    },
                                  ),
                  ),
                  if (_students.isNotEmpty)
                    Container(
                      color: Colors.white,
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                      child: SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _submitting ? null : () => _submit(isAr),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          child: _submitting
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                )
                              : Text(
                                  isAr ? 'تسجيل الحضور' : 'Submit Attendance',
                                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                                ),
                        ),
                      ),
                    ),
                ],
              ),
      ),
    );
  }

  Widget _statusButton(
    String label,
    String value,
    Color color,
    String current,
    String studentId,
    IconData icon,
  ) {
    final selected = current == value;
    return GestureDetector(
      onTap: () => setState(() => _attendance[studentId] = value),
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: selected ? color : color.withOpacity(0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(
          icon,
          color: selected ? Colors.white : color,
          size: 18,
        ),
      ),
    );
  }
}
