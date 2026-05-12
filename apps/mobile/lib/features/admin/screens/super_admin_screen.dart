import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';
import '../../../shared/widgets/stat_card_widget.dart';

class SuperAdminScreen extends StatefulWidget {
  const SuperAdminScreen({super.key});

  @override
  State<SuperAdminScreen> createState() => _SuperAdminScreenState();
}

class _SuperAdminScreenState extends State<SuperAdminScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _schools = [];
  Map<String, dynamic> _stats = {};

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final schoolsRes = await ApiClient.instance.get(ApiEndpoints.superAdminSchools);
      final statsRes = await ApiClient.instance.get(ApiEndpoints.superAdminStats).catchError((_) async => null);
      final schoolsRaw = schoolsRes.data;
      final sd = (schoolsRaw is Map && schoolsRaw['data'] != null) ? schoolsRaw['data'] : schoolsRaw;
      final statsRaw = statsRes?.data;
      setState(() {
        _schools = sd is List ? List.from(sd) : [];
        _stats = (statsRaw is Map ? (statsRaw['data'] ?? statsRaw) : {}) as Map<String, dynamic>;
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
          title: Text(isAr ? 'لوحة المشرف العام' : 'Super Admin', style: const TextStyle(fontWeight: FontWeight.bold)),
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
                    const SizedBox(height: 12), Text(_error!),
                    const SizedBox(height: 12), ElevatedButton(onPressed: _loadData, child: Text(isAr ? 'إعادة' : 'Retry')),
                  ]))
                : RefreshIndicator(
                    onRefresh: _loadData,
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(16),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        if (_stats.isNotEmpty) ...[
                          Text(isAr ? 'إحصائيات المنصة' : 'Platform Stats',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                          const SizedBox(height: 12),
                          GridView.count(
                            crossAxisCount: 2,
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                            childAspectRatio: 1.4,
                            children: [
                              StatCard(value: '${_stats['totalSchools'] ?? _schools.length}', label: isAr ? 'المدارس' : 'Schools', icon: Icons.account_balance_rounded, iconColor: AppColors.primary),
                              StatCard(value: '${_stats['totalStudents'] ?? 0}', label: isAr ? 'الطلاب' : 'Students', icon: Icons.people_rounded, iconColor: AppColors.info),
                              StatCard(value: '${_stats['totalTeachers'] ?? 0}', label: isAr ? 'المعلمون' : 'Teachers', icon: Icons.school_rounded, iconColor: AppColors.success),
                              StatCard(value: '${_stats['totalRevenue'] ?? 0}', label: isAr ? 'الإيرادات' : 'Revenue', icon: Icons.attach_money_rounded, iconColor: AppColors.warning),
                            ],
                          ),
                          const SizedBox(height: 20),
                        ],
                        Text(isAr ? 'المدارس' : 'Schools',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                        const SizedBox(height: 12),
                        if (_schools.isEmpty)
                          Center(child: Text(isAr ? 'لا توجد مدارس' : 'No schools', style: const TextStyle(color: AppColors.textSecondary)))
                        else
                          ...List.generate(_schools.length, (i) {
                            final school = _schools[i];
                            final studentCount = school['_count']?['students'] ?? school['studentCount'] ?? 0;
                            return Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                              padding: const EdgeInsets.all(16),
                              child: Row(children: [
                                Container(
                                  width: 48, height: 48,
                                  decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                                  child: const Icon(Icons.account_balance_rounded, color: AppColors.primary),
                                ),
                                const SizedBox(width: 12),
                                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                  Text(school['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                                  Text(school['domain'] ?? school['email'] ?? '', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                ])),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                                  child: Text('$studentCount ${isAr ? 'طالب' : 'students'}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary)),
                                ),
                              ]),
                            );
                          }),
                      ]),
                    ),
                  ),
      ),
    );
  }
}
