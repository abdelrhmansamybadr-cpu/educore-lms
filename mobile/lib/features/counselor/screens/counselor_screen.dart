import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';

class CounselorScreen extends StatefulWidget {
  const CounselorScreen({super.key});

  @override
  State<CounselorScreen> createState() => _CounselorScreenState();
}

class _CounselorScreenState extends State<CounselorScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _checkins = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final res = await ApiClient.instance.get(ApiEndpoints.mentalHealthCheckins);
      final raw = res.data;
      final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
      setState(() {
        _checkins = d is List ? List.from(d) : [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  Color _moodColor(int? score) {
    if (score == null) return AppColors.textSecondary;
    if (score >= 4) return AppColors.success;
    if (score >= 2) return AppColors.warning;
    return AppColors.error;
  }

  IconData _moodIcon(int? score) {
    if (score == null) return Icons.sentiment_neutral_rounded;
    if (score >= 4) return Icons.sentiment_very_satisfied_rounded;
    if (score >= 2) return Icons.sentiment_neutral_rounded;
    return Icons.sentiment_very_dissatisfied_rounded;
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
          title: Text(isAr ? 'الإرشاد النفسي' : 'Counseling', style: const TextStyle(fontWeight: FontWeight.bold)),
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
                    child: _checkins.isEmpty
                        ? ListView(children: [SizedBox(height: MediaQuery.of(context).size.height * 0.5,
                            child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                              const Icon(Icons.psychology_outlined, size: 64, color: AppColors.border),
                              const SizedBox(height: 16),
                              Text(isAr ? 'لا توجد بيانات صحية نفسية' : 'No mental health check-ins', style: const TextStyle(color: AppColors.textSecondary)),
                            ])))])
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: _checkins.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (_, i) {
                              final c = _checkins[i];
                              final profile = c['user']?['profile'];
                              final name = profile != null
                                  ? '${profile['firstName']} ${profile['lastName']}'
                                  : c['user']?['email'] ?? '';
                              final score = c['moodScore'] as int?;
                              final notes = c['notes'] as String?;
                              final createdAt = c['createdAt'] != null ? DateTime.tryParse(c['createdAt']) : null;
                              return Container(
                                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                                padding: const EdgeInsets.all(14),
                                child: Row(children: [
                                  Container(
                                    width: 48, height: 48,
                                    decoration: BoxDecoration(color: _moodColor(score).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                                    child: Icon(_moodIcon(score), color: _moodColor(score)),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                    Text(name, style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                                    if (notes != null && notes.isNotEmpty)
                                      Text(notes, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary), maxLines: 2, overflow: TextOverflow.ellipsis),
                                    if (createdAt != null)
                                      Text('${createdAt.day}/${createdAt.month}/${createdAt.year}', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                                  ])),
                                  if (score != null)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                      decoration: BoxDecoration(color: _moodColor(score).withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                                      child: Text('$score/5', style: TextStyle(fontWeight: FontWeight.bold, color: _moodColor(score))),
                                    ),
                                ]),
                              );
                            },
                          ),
                  ),
      ),
    );
  }
}
