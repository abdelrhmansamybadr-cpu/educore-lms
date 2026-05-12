import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';

class AdmissionScreen extends StatefulWidget {
  const AdmissionScreen({super.key});

  @override
  State<AdmissionScreen> createState() => _AdmissionScreenState();
}

class _AdmissionScreenState extends State<AdmissionScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _applications = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final res = await ApiClient.instance.get(ApiEndpoints.admissionApplications);
      final raw = res.data;
      final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
      setState(() {
        _applications = d is List ? List.from(d) : [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  static const _steps = ['APPLIED', 'REVIEW', 'INTERVIEW', 'DECISION'];

  int _stepIndex(String? status) {
    final idx = _steps.indexOf(status ?? '');
    return idx < 0 ? 0 : idx;
  }

  Color _statusColor(String? status) {
    switch (status) {
      case 'ACCEPTED': return AppColors.success;
      case 'REJECTED': return AppColors.error;
      case 'INTERVIEW': return AppColors.info;
      case 'REVIEW': return AppColors.warning;
      default: return AppColors.textSecondary;
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
          title: Text(isAr ? 'طلبات القبول' : 'Admission', style: const TextStyle(fontWeight: FontWeight.bold)),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.primary,
          elevation: 0,
          bottom: const PreferredSize(preferredSize: Size.fromHeight(1), child: Divider(height: 1, color: AppColors.border)),
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
                    child: _applications.isEmpty
                        ? ListView(children: [SizedBox(height: MediaQuery.of(context).size.height * 0.5,
                            child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                              const Icon(Icons.school_outlined, size: 64, color: AppColors.border),
                              const SizedBox(height: 16),
                              Text(isAr ? 'لا توجد طلبات قبول' : 'No admission applications', style: const TextStyle(color: AppColors.textSecondary)),
                            ])))])
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: _applications.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 16),
                            itemBuilder: (_, i) {
                              final app = _applications[i];
                              final status = app['status'] ?? 'APPLIED';
                              final studentName = app['studentName'] ?? app['applicantName'] ?? '';
                              final createdAt = app['createdAt'] != null ? DateTime.tryParse(app['createdAt']) : null;
                              return Container(
                                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                                padding: const EdgeInsets.all(16),
                                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                  Row(children: [
                                    Expanded(child: Text(studentName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.textPrimary))),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(color: _statusColor(status).withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                                      child: Text(status, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: _statusColor(status))),
                                    ),
                                  ]),
                                  if (createdAt != null) ...[
                                    const SizedBox(height: 4),
                                    Text('${createdAt.day}/${createdAt.month}/${createdAt.year}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                  ],
                                  const SizedBox(height: 16),
                                  Row(children: List.generate(_steps.length, (si) {
                                    final stepIdx = _stepIndex(status);
                                    final active = si <= stepIdx;
                                    return Expanded(child: Column(children: [
                                      Row(children: [
                                        if (si > 0) Expanded(child: Container(height: 2, color: active ? AppColors.primary : AppColors.border)),
                                        Container(
                                          width: 20, height: 20,
                                          decoration: BoxDecoration(
                                            color: active ? AppColors.primary : AppColors.border,
                                            shape: BoxShape.circle,
                                          ),
                                          child: active ? const Icon(Icons.check, color: Colors.white, size: 12) : null,
                                        ),
                                        if (si < _steps.length - 1) Expanded(child: Container(height: 2, color: si < stepIdx ? AppColors.primary : AppColors.border)),
                                      ]),
                                      const SizedBox(height: 4),
                                      Text(_steps[si], style: TextStyle(fontSize: 9, color: active ? AppColors.primary : AppColors.textSecondary, fontWeight: active ? FontWeight.bold : FontWeight.normal)),
                                    ]));
                                  })),
                                ]),
                              );
                            },
                          ),
                  ),
      ),
    );
  }
}
