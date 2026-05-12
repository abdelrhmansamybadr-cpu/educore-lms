import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';
import '../../../shared/widgets/stat_card_widget.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic> _overview = {};

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final res = await ApiClient.instance.get(ApiEndpoints.analyticsOverview).catchError((_) async {
        return await ApiClient.instance.get(ApiEndpoints.analyticsSchool);
      });
      final raw = res.data;
      setState(() {
        _overview = (raw is Map ? (raw['data'] ?? raw) : {}) as Map<String, dynamic>;
        _isLoading = false;
      });
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
          title: Text(isAr ? 'التحليلات' : 'Analytics', style: const TextStyle(fontWeight: FontWeight.bold)),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.primary,
          elevation: 0,
          bottom: const PreferredSize(preferredSize: Size.fromHeight(1), child: Divider(height: 1, color: AppColors.border)),
        ),
        body: _isLoading
            ? const Padding(padding: EdgeInsets.all(16), child: DashboardSkeletonLoader())
            : _error != null
                ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                    const Icon(Icons.error_outline, color: AppColors.error, size: 48),
                    const SizedBox(height: 12),
                    Text(_error!),
                    const SizedBox(height: 12),
                    ElevatedButton(onPressed: _loadData, child: Text(isAr ? 'إعادة' : 'Retry')),
                  ]))
                : RefreshIndicator(
                    onRefresh: _loadData,
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(isAr ? 'نظرة عامة' : 'Overview', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                          const SizedBox(height: 16),
                          GridView.count(
                            crossAxisCount: 2,
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                            childAspectRatio: 1.4,
                            children: [
                              StatCard(value: '${_overview['totalStudents'] ?? _overview['students'] ?? 0}', label: isAr ? 'إجمالي الطلاب' : 'Total Students', icon: Icons.people_rounded, iconColor: AppColors.primary),
                              StatCard(value: '${_overview['totalTeachers'] ?? _overview['teachers'] ?? 0}', label: isAr ? 'المعلمون' : 'Teachers', icon: Icons.school_rounded, iconColor: AppColors.info),
                              StatCard(value: '${_overview['attendanceRate'] ?? _overview['avgAttendance'] ?? 0}%', label: isAr ? 'نسبة الحضور' : 'Attendance Rate', icon: Icons.fact_check_rounded, iconColor: AppColors.success),
                              StatCard(value: '${_overview['avgGrade'] ?? _overview['averageGrade'] ?? 0}%', label: isAr ? 'متوسط الدرجات' : 'Avg Grade', icon: Icons.grade_rounded, iconColor: AppColors.warning),
                              StatCard(value: '${_overview['totalCourses'] ?? _overview['courses'] ?? 0}', label: isAr ? 'المقررات' : 'Courses', icon: Icons.menu_book_rounded, iconColor: AppColors.accent),
                              StatCard(value: '${_overview['revenue'] ?? _overview['totalRevenue'] ?? 0}', label: isAr ? 'الإيرادات' : 'Revenue', icon: Icons.attach_money_rounded, iconColor: AppColors.primary),
                            ],
                          ),
                          if (_overview.isEmpty) ...[
                            const SizedBox(height: 32),
                            Center(child: Text(isAr ? 'لا تتوفر بيانات تحليلية حاليًا' : 'No analytics data available', style: const TextStyle(color: AppColors.textSecondary))),
                          ],
                        ],
                      ),
                    ),
                  ),
      ),
    );
  }
}
