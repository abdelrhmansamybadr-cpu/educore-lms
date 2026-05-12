import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';

class LiveClassesScreen extends StatefulWidget {
  const LiveClassesScreen({super.key});

  @override
  State<LiveClassesScreen> createState() => _LiveClassesScreenState();
}

class _LiveClassesScreenState extends State<LiveClassesScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _classes = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final res = await ApiClient.instance.get(ApiEndpoints.liveClasses);
      final raw = res.data;
      final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
      setState(() {
        _classes = d is List ? List.from(d) : [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  Future<void> _joinClass(Map<String, dynamic> cls) async {
    final url = cls['meetingUrl'] ?? cls['roomId'];
    if (url == null || url.toString().isEmpty) return;
    final uri = Uri.parse(url.toString());
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _startClass(bool isAr) async {
    final titleCtrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => Padding(
        padding: EdgeInsets.fromLTRB(16, 20, 16, MediaQuery.of(context).viewInsets.bottom + 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(isAr ? 'بدء حصة مباشرة' : 'Start Live Class', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            TextField(
              controller: titleCtrl,
              decoration: InputDecoration(
                hintText: isAr ? 'عنوان الحصة' : 'Class title',
                filled: true,
                fillColor: AppColors.background,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  Navigator.pop(context);
                  try {
                    await ApiClient.instance.post(ApiEndpoints.liveClasses, data: {
                      'title': titleCtrl.text.trim(),
                      'scheduledAt': DateTime.now().toIso8601String(),
                    });
                    _loadData();
                  } catch (_) {}
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(isAr ? 'بدء الحصة' : 'Start Class'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isAr = auth.isAr;
    final role = (auth.user?.role ?? '').toUpperCase();
    final isTeacher = role.contains('TEACHER') || role.contains('ADMIN');

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: Text(isAr ? 'الفصول المباشرة' : 'Live Classes', style: const TextStyle(fontWeight: FontWeight.bold)),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.primary,
          elevation: 0,
          bottom: const PreferredSize(preferredSize: Size.fromHeight(1), child: Divider(height: 1, color: AppColors.border)),
        ),
        floatingActionButton: isTeacher
            ? FloatingActionButton.extended(
                onPressed: () => _startClass(isAr),
                backgroundColor: AppColors.primary,
                icon: const Icon(Icons.video_call_rounded, color: Colors.white),
                label: Text(isAr ? 'بدء حصة' : 'Start Class', style: const TextStyle(color: Colors.white)),
              )
            : null,
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
                : RefreshIndicator(
                    onRefresh: _loadData,
                    child: _classes.isEmpty
                        ? ListView(children: [
                            SizedBox(height: MediaQuery.of(context).size.height * 0.5,
                              child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                                const Icon(Icons.videocam_off_rounded, size: 64, color: AppColors.border),
                                const SizedBox(height: 16),
                                Text(isAr ? 'لا توجد فصول مباشرة' : 'No live classes', style: const TextStyle(color: AppColors.textSecondary)),
                              ])),
                            ),
                          ])
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: _classes.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (_, i) => _buildCard(_classes[i], isAr),
                          ),
                  ),
      ),
    );
  }

  Widget _buildCard(Map<String, dynamic> cls, bool isAr) {
    final title = (isAr && cls['titleAr'] != null) ? cls['titleAr'] : cls['title'];
    final scheduled = cls['scheduledAt'] != null ? DateTime.tryParse(cls['scheduledAt']) : null;
    final isCompleted = cls['isCompleted'] == true;
    final hasUrl = cls['meetingUrl'] != null || cls['roomId'] != null;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 48, height: 48,
              decoration: BoxDecoration(
                color: isCompleted ? AppColors.border : AppColors.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                isCompleted ? Icons.check_circle_rounded : Icons.video_camera_front_rounded,
                color: isCompleted ? AppColors.textSecondary : AppColors.primary,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                  if (scheduled != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      '${scheduled.day}/${scheduled.month}/${scheduled.year} ${scheduled.hour}:${scheduled.minute.toString().padLeft(2, '0')}',
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                  ],
                  if (isCompleted) Text(isAr ? 'مكتملة' : 'Completed', style: const TextStyle(fontSize: 11, color: AppColors.success)),
                ],
              ),
            ),
            if (!isCompleted && hasUrl)
              ElevatedButton(
                onPressed: () => _joinClass(cls),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: Text(isAr ? 'انضم' : 'Join', style: const TextStyle(fontSize: 13)),
              ),
          ],
        ),
      ),
    );
  }
}
