import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';

class HrScreen extends StatefulWidget {
  const HrScreen({super.key});

  @override
  State<HrScreen> createState() => _HrScreenState();
}

class _HrScreenState extends State<HrScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _leaves = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final res = await ApiClient.instance.get(ApiEndpoints.myLeaves);
      final raw = res.data;
      final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
      setState(() {
        _leaves = d is List ? List.from(d) : [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  void _showLeaveForm(bool isAr) {
    final reasonCtrl = TextEditingController();
    String leaveType = 'ANNUAL';
    DateTime? startDate;
    DateTime? endDate;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => StatefulBuilder(
        builder: (ctx, setSheet) => SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(16, 20, 16, MediaQuery.of(context).viewInsets.bottom + 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(isAr ? 'طلب إجازة' : 'Request Leave', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: leaveType,
                decoration: InputDecoration(labelText: isAr ? 'نوع الإجازة' : 'Leave Type', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))),
                items: ['ANNUAL', 'SICK', 'EMERGENCY', 'MATERNITY', 'STUDY', 'UNPAID']
                    .map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                onChanged: (v) => setSheet(() => leaveType = v ?? 'ANNUAL'),
              ),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: OutlinedButton.icon(
                  onPressed: () async {
                    final d = await showDatePicker(context: context, initialDate: DateTime.now(), firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 365)));
                    if (d != null) setSheet(() => startDate = d);
                  },
                  icon: const Icon(Icons.calendar_today_rounded, size: 16),
                  label: Text(startDate != null ? '${startDate!.day}/${startDate!.month}/${startDate!.year}' : (isAr ? 'تاريخ البدء' : 'Start Date'), style: const TextStyle(fontSize: 12)),
                )),
                const SizedBox(width: 8),
                Expanded(child: OutlinedButton.icon(
                  onPressed: () async {
                    final d = await showDatePicker(context: context, initialDate: startDate ?? DateTime.now(), firstDate: startDate ?? DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 365)));
                    if (d != null) setSheet(() => endDate = d);
                  },
                  icon: const Icon(Icons.calendar_month_rounded, size: 16),
                  label: Text(endDate != null ? '${endDate!.day}/${endDate!.month}/${endDate!.year}' : (isAr ? 'تاريخ الانتهاء' : 'End Date'), style: const TextStyle(fontSize: 12)),
                )),
              ]),
              const SizedBox(height: 12),
              TextField(
                controller: reasonCtrl,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: isAr ? 'سبب الإجازة' : 'Reason for leave',
                  filled: true, fillColor: AppColors.background,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(width: double.infinity, child: ElevatedButton(
                onPressed: () async {
                  if (startDate == null || endDate == null || reasonCtrl.text.trim().isEmpty) return;
                  Navigator.pop(context);
                  final days = endDate!.difference(startDate!).inDays + 1;
                  try {
                    await ApiClient.instance.post(ApiEndpoints.requestLeave, data: {
                      'type': leaveType,
                      'startDate': startDate!.toIso8601String(),
                      'endDate': endDate!.toIso8601String(),
                      'days': days,
                      'reason': reasonCtrl.text.trim(),
                    });
                    _loadData();
                  } catch (_) {}
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary, foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(isAr ? 'إرسال الطلب' : 'Submit Request'),
              )),
            ],
          ),
        ),
      ),
    );
  }

  Color _statusColor(String? status) {
    switch (status) {
      case 'APPROVED': return AppColors.success;
      case 'REJECTED': return AppColors.error;
      case 'CANCELLED': return AppColors.textSecondary;
      default: return AppColors.warning;
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
          title: Text(isAr ? 'طلبات الإجازة' : 'Leave Requests', style: const TextStyle(fontWeight: FontWeight.bold)),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.primary,
          elevation: 0,
          bottom: const PreferredSize(preferredSize: Size.fromHeight(1), child: Divider(height: 1, color: AppColors.border)),
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () => _showLeaveForm(isAr),
          backgroundColor: AppColors.primary,
          child: const Icon(Icons.add_rounded, color: Colors.white),
        ),
        body: _isLoading
            ? const Padding(padding: EdgeInsets.all(16), child: ListSkeletonLoader())
            : _error != null
                ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                    const Icon(Icons.error_outline, color: AppColors.error, size: 48),
                    const SizedBox(height: 12), Text(_error!),
                    const SizedBox(height: 12), ElevatedButton(onPressed: _loadData, child: Text(isAr ? 'إعادة' : 'Retry')),
                  ]))
                : RefreshIndicator(
                    onRefresh: _loadData,
                    child: _leaves.isEmpty
                        ? ListView(children: [SizedBox(height: MediaQuery.of(context).size.height * 0.5,
                            child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                              const Icon(Icons.event_busy_rounded, size: 64, color: AppColors.border),
                              const SizedBox(height: 16),
                              Text(isAr ? 'لا توجد طلبات إجازة' : 'No leave requests', style: const TextStyle(color: AppColors.textSecondary)),
                            ])))])
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: _leaves.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (_, i) {
                              final l = _leaves[i];
                              final status = l['status'] ?? 'PENDING';
                              final startRaw = l['startDate'];
                              final endRaw = l['endDate'];
                              final start = startRaw != null ? DateTime.tryParse(startRaw) : null;
                              final end = endRaw != null ? DateTime.tryParse(endRaw) : null;
                              return Container(
                                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                                padding: const EdgeInsets.all(16),
                                child: Row(
                                  children: [
                                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                      Text(l['type'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                                      const SizedBox(height: 4),
                                      if (start != null && end != null)
                                        Text('${start.day}/${start.month} – ${end.day}/${end.month}/${end.year} · ${l['days']} days', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                      if (l['reason'] != null)
                                        Text(l['reason'], style: const TextStyle(fontSize: 12, color: AppColors.textSecondary), maxLines: 1, overflow: TextOverflow.ellipsis),
                                    ])),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(color: _statusColor(status).withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                                      child: Text(status, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: _statusColor(status))),
                                    ),
                                  ],
                                ),
                              );
                            }),
                  ),
      ),
    );
  }
}
