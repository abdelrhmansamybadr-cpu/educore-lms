import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';
import '../../../shared/widgets/empty_state_widget.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  List<dynamic> _records = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final res = await ApiClient.instance.get(ApiEndpoints.myAttendance);
      final data = res.data;
      setState(() {
        _records = (data is Map ? data['data'] : data) ?? [];
        _loading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Color _statusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PRESENT': return AppColors.success;
      case 'ABSENT': return AppColors.error;
      case 'LATE': return AppColors.warning;
      default: return AppColors.textSecondary;
    }
  }

  String _statusLabel(String status, bool isAr) {
    switch (status.toUpperCase()) {
      case 'PRESENT': return isAr ? 'حاضر' : 'Present';
      case 'ABSENT': return isAr ? 'غائب' : 'Absent';
      case 'LATE': return isAr ? 'متأخر' : 'Late';
      default: return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthProvider>();
    final isAr = auth.isAr;

    // Calculate summary
    final total = _records.length;
    final present = _records.where((r) => r['status']?.toString().toUpperCase() == 'PRESENT').length;
    final absent = _records.where((r) => r['status']?.toString().toUpperCase() == 'ABSENT').length;
    final late = _records.where((r) => r['status']?.toString().toUpperCase() == 'LATE').length;
    final pct = total > 0 ? (present / total * 100).toStringAsFixed(0) : '0';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(isAr ? 'الحضور والغياب' : 'Attendance'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(1),
          child: Divider(height: 1, color: AppColors.border),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Padding(
                padding: EdgeInsets.all(16),
                child: Column(children: [
                  SkeletonLoader(height: 120), SizedBox(height: 12),
                  SkeletonLoader(height: 80), SizedBox(height: 12),
                  SkeletonLoader(height: 80),
                ]),
              )
            : _error != null
                ? Center(child: Text(_error!, style: const TextStyle(color: AppColors.error)))
                : _records.isEmpty
                    ? EmptyStateWidget(
                        emoji: '📅',
                        title: isAr ? 'لا توجد سجلات' : 'No Records',
                        subtitle: isAr ? 'لا توجد سجلات حضور حتى الآن' : 'No attendance records yet',
                      )
                    : ListView(
                        padding: const EdgeInsets.all(16),
                        children: [
                          // Summary card
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              gradient: AppColors.gradientPrimary,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Column(children: [
                              Text(
                                isAr ? 'نسبة الحضور' : 'Attendance Rate',
                                style: const TextStyle(color: Colors.white70, fontSize: 14),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                '$pct%',
                                style: const TextStyle(color: Colors.white, fontSize: 40, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 16),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceAround,
                                children: [
                                  _summaryItem(isAr ? 'حاضر' : 'Present', present, AppColors.success),
                                  _summaryItem(isAr ? 'غائب' : 'Absent', absent, AppColors.error),
                                  _summaryItem(isAr ? 'متأخر' : 'Late', late, AppColors.warning),
                                ],
                              ),
                            ]),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            isAr ? 'سجل الحضور' : 'Attendance Log',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                          ),
                          const SizedBox(height: 12),
                          ..._records.reversed.map((rec) {
                            final status = rec['status']?.toString() ?? 'PRESENT';
                            final date = rec['date'] != null
                                ? DateTime.tryParse(rec['date'].toString())
                                : null;
                            return Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: ListTile(
                                leading: Container(
                                  width: 40, height: 40,
                                  decoration: BoxDecoration(
                                    color: _statusColor(status).withOpacity(0.1),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    status.toUpperCase() == 'PRESENT' ? Icons.check_circle_outline
                                        : status.toUpperCase() == 'ABSENT' ? Icons.cancel_outlined
                                        : Icons.access_time,
                                    color: _statusColor(status),
                                    size: 20,
                                  ),
                                ),
                                title: Text(
                                  date != null
                                      ? '${date.day}/${date.month}/${date.year}'
                                      : rec['date']?.toString() ?? '',
                                  style: const TextStyle(fontWeight: FontWeight.w500, color: AppColors.textPrimary),
                                ),
                                subtitle: rec['courseId'] != null
                                    ? Text(rec['courseId'].toString(), style: const TextStyle(fontSize: 12, color: AppColors.textSecondary))
                                    : null,
                                trailing: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: _statusColor(status).withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    _statusLabel(status, isAr),
                                    style: TextStyle(color: _statusColor(status), fontSize: 12, fontWeight: FontWeight.w600),
                                  ),
                                ),
                              ),
                            );
                          }),
                        ],
                      ),
      ),
    );
  }

  Widget _summaryItem(String label, int count, Color color) {
    return Column(children: [
      Text(count.toString(), style: TextStyle(color: color, fontSize: 24, fontWeight: FontWeight.bold)),
      const SizedBox(height: 4),
      Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12)),
    ]);
  }
}
