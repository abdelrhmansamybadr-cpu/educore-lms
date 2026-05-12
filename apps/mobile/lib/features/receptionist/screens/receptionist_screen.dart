import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';

class ReceptionistScreen extends StatefulWidget {
  const ReceptionistScreen({super.key});

  @override
  State<ReceptionistScreen> createState() => _ReceptionistScreenState();
}

class _ReceptionistScreenState extends State<ReceptionistScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _visitors = [];
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final today = DateTime.now();
      final dateStr = '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';
      final res = await ApiClient.instance.get('${ApiEndpoints.visitors}?date=$dateStr');
      final raw = res.data;
      final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
      setState(() {
        _visitors = d is List ? List.from(d) : [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  void _showCheckInForm(bool isAr) {
    final nameCtrl = TextEditingController();
    final purposeCtrl = TextEditingController();
    final hostCtrl = TextEditingController();

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
            Text(isAr ? 'تسجيل زائر' : 'Check In Visitor', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            TextField(
              controller: nameCtrl,
              decoration: InputDecoration(
                labelText: isAr ? 'اسم الزائر' : 'Visitor Name',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: purposeCtrl,
              decoration: InputDecoration(
                labelText: isAr ? 'الغرض من الزيارة' : 'Purpose',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: hostCtrl,
              decoration: InputDecoration(
                labelText: isAr ? 'اسم المضيف' : 'Host Name',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(width: double.infinity, child: ElevatedButton(
              onPressed: () async {
                if (nameCtrl.text.trim().isEmpty || purposeCtrl.text.trim().isEmpty) return;
                Navigator.pop(context);
                setState(() => _submitting = true);
                try {
                  await ApiClient.instance.post(ApiEndpoints.visitors, data: {
                    'visitorName': nameCtrl.text.trim(),
                    'purpose': purposeCtrl.text.trim(),
                    'hostName': hostCtrl.text.trim().isEmpty ? null : hostCtrl.text.trim(),
                  });
                  _loadData();
                } catch (_) {
                  setState(() => _submitting = false);
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary, foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(isAr ? 'تسجيل الدخول' : 'Check In'),
            )),
          ],
        ),
      ),
    );
  }

  Future<void> _checkOut(String visitorId) async {
    try {
      await ApiClient.instance.patch('${ApiEndpoints.visitors}/$visitorId/checkout', data: {});
      _loadData();
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
          title: Text(isAr ? 'الاستقبال' : 'Receptionist', style: const TextStyle(fontWeight: FontWeight.bold)),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.primary,
          elevation: 0,
          bottom: const PreferredSize(preferredSize: Size.fromHeight(1), child: Divider(height: 1, color: AppColors.border)),
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () => _showCheckInForm(isAr),
          backgroundColor: AppColors.primary,
          child: const Icon(Icons.person_add_rounded, color: Colors.white),
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
                    child: _visitors.isEmpty
                        ? ListView(children: [SizedBox(height: MediaQuery.of(context).size.height * 0.5,
                            child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                              const Icon(Icons.people_outline_rounded, size: 64, color: AppColors.border),
                              const SizedBox(height: 16),
                              Text(isAr ? 'لا يوجد زوار اليوم' : 'No visitors today', style: const TextStyle(color: AppColors.textSecondary)),
                            ])))])
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: _visitors.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (_, i) {
                              final v = _visitors[i];
                              final checkedOut = v['checkOut'] != null;
                              final checkIn = v['checkIn'] != null ? DateTime.tryParse(v['checkIn']) : null;
                              return Container(
                                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                                padding: const EdgeInsets.all(14),
                                child: Row(children: [
                                  Container(
                                    width: 48, height: 48,
                                    decoration: BoxDecoration(
                                      color: checkedOut ? AppColors.border : AppColors.success.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Icon(Icons.person_rounded, color: checkedOut ? AppColors.textSecondary : AppColors.success),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                    Text(v['visitorName'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                                    Text(v['purpose'] ?? '', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                    if (v['hostName'] != null)
                                      Text('→ ${v['hostName']}', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                                    if (checkIn != null)
                                      Text('${checkIn.hour}:${checkIn.minute.toString().padLeft(2, '0')}', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                                  ])),
                                  if (!checkedOut)
                                    TextButton(
                                      onPressed: () => _checkOut(v['id']),
                                      child: Text(isAr ? 'خروج' : 'Check Out', style: const TextStyle(color: AppColors.error)),
                                    )
                                  else
                                    Text(isAr ? 'خرج' : 'Left', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                ]),
                              );
                            },
                          ),
                  ),
      ),
    );
  }
}
