import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/utils/helpers.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';

class EventsManageScreen extends StatefulWidget {
  const EventsManageScreen({super.key});

  @override
  State<EventsManageScreen> createState() => _EventsManageScreenState();
}

class _EventsManageScreenState extends State<EventsManageScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _events = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final res = await ApiClient.instance.get(ApiEndpoints.events);
      final raw = res.data;
      final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
      setState(() {
        _events = d is List ? List<dynamic>.from(d) : <dynamic>[];
        _isLoading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  Future<void> _deleteEvent(String id, bool isAr) async {
    try {
      await ApiClient.instance.delete('${ApiEndpoints.events}/$id');
      _loadData();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(isAr ? 'تم حذف الحدث' : 'Event deleted'),
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
    }
  }

  Color _typeColor(String? type) {
    switch (type?.toLowerCase()) {
      case 'exam': return AppColors.error;
      case 'holiday': return AppColors.success;
      case 'meeting': return AppColors.info;
      case 'sport': return AppColors.warning;
      case 'cultural': return AppColors.accent;
      default: return AppColors.primary;
    }
  }

  void _showEventForm(bool isAr, {Map<String, dynamic>? existing}) {
    final titleCtrl = TextEditingController(text: existing?['title'] ?? '');
    final titleArCtrl = TextEditingController(text: existing?['titleAr'] ?? '');
    final descCtrl = TextEditingController(text: existing?['description'] ?? '');
    final locationCtrl = TextEditingController(text: existing?['location'] ?? '');
    DateTime? startDate = existing?['startDate'] != null ? DateTime.tryParse(existing!['startDate']) : null;
    DateTime? endDate = existing?['endDate'] != null ? DateTime.tryParse(existing!['endDate']) : null;
    bool saving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(builder: (ctx, setSheet) {
          Future<void> save() async {
            if (titleCtrl.text.trim().isEmpty || startDate == null) return;
            setSheet(() => saving = true);
            final data = {
              'title': titleCtrl.text.trim(),
              'titleAr': titleArCtrl.text.trim(),
              'description': descCtrl.text.trim(),
              'location': locationCtrl.text.trim(),
              'startDate': startDate!.toIso8601String(),
              'endDate': (endDate ?? startDate!).toIso8601String(),
            };
            try {
              if (existing != null) {
                await ApiClient.instance.patch('${ApiEndpoints.events}/${existing['id']}', data: data);
              } else {
                await ApiClient.instance.post(ApiEndpoints.events, data: data);
              }
              Navigator.pop(ctx);
              _loadData();
            } catch (e) {
              setSheet(() => saving = false);
            }
          }

          return SingleChildScrollView(
            padding: EdgeInsets.only(
              left: 16, right: 16, top: 20,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  existing != null ? (isAr ? 'تعديل الحدث' : 'Edit Event') : (isAr ? 'حدث جديد' : 'New Event'),
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 16),
                _field(titleCtrl, isAr ? 'العنوان (إنجليزي)' : 'Title (English)'),
                const SizedBox(height: 10),
                _field(titleArCtrl, isAr ? 'العنوان (عربي)' : 'Title (Arabic)'),
                const SizedBox(height: 10),
                _field(descCtrl, isAr ? 'الوصف' : 'Description', maxLines: 3),
                const SizedBox(height: 10),
                _field(locationCtrl, isAr ? 'الموقع' : 'Location'),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          final d = await showDatePicker(
                            context: ctx,
                            initialDate: startDate ?? DateTime.now(),
                            firstDate: DateTime(2020),
                            lastDate: DateTime(2030),
                          );
                          if (d != null) setSheet(() => startDate = d);
                        },
                        icon: const Icon(Icons.calendar_today_rounded, size: 16),
                        label: Text(startDate != null ? Helpers.formatDate(startDate!) : (isAr ? 'البداية' : 'Start'), style: const TextStyle(fontSize: 13)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          final d = await showDatePicker(
                            context: ctx,
                            initialDate: endDate ?? startDate ?? DateTime.now(),
                            firstDate: startDate ?? DateTime(2020),
                            lastDate: DateTime(2030),
                          );
                          if (d != null) setSheet(() => endDate = d);
                        },
                        icon: const Icon(Icons.event_rounded, size: 16),
                        label: Text(endDate != null ? Helpers.formatDate(endDate!) : (isAr ? 'النهاية' : 'End'), style: const TextStyle(fontSize: 13)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: saving ? null : save,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: saving
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : Text(isAr ? 'حفظ' : 'Save'),
                  ),
                ),
              ],
            ),
          );
        });
      },
    );
  }

  Widget _field(TextEditingController ctrl, String hint, {int maxLines = 1}) {
    return TextField(
      controller: ctrl,
      maxLines: maxLines,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: AppColors.textSecondary),
        filled: true,
        fillColor: AppColors.background,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
    );
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
          title: Text(isAr ? 'إدارة الفعاليات' : 'Manage Events',
              style: const TextStyle(fontWeight: FontWeight.bold)),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.primary,
          elevation: 0,
          bottom: const PreferredSize(
            preferredSize: Size.fromHeight(1),
            child: Divider(height: 1, color: AppColors.border),
          ),
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () => _showEventForm(isAr),
          backgroundColor: AppColors.primary,
          child: const Icon(Icons.add_rounded, color: Colors.white),
        ),
        body: _isLoading
            ? const Padding(padding: EdgeInsets.all(16), child: ListSkeletonLoader())
            : _error != null
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_error!),
                        const SizedBox(height: 12),
                        ElevatedButton(onPressed: _loadData, child: Text(isAr ? 'إعادة' : 'Retry')),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _loadData,
                    child: _events.isEmpty
                        ? ListView(
                            children: [
                              SizedBox(
                                height: MediaQuery.of(context).size.height * 0.6,
                                child: Center(
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.event_rounded, size: 64, color: AppColors.border),
                                      const SizedBox(height: 16),
                                      Text(isAr ? 'لا توجد فعاليات' : 'No events yet',
                                          style: const TextStyle(color: AppColors.textSecondary)),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                            itemCount: _events.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 10),
                            itemBuilder: (_, i) {
                              final event = _events[i] as Map<String, dynamic>;
                              final title = isAr
                                  ? (event['titleAr']?.toString().isNotEmpty == true ? event['titleAr'] : event['title'])
                                  : event['title'];
                              final type = event['type']?.toString() ?? '';
                              final startRaw = event['startDate']?.toString();
                              final color = _typeColor(type);
                              DateTime? start;
                              if (startRaw != null) start = DateTime.tryParse(startRaw);

                              return Dismissible(
                                key: Key(event['id']?.toString() ?? i.toString()),
                                direction: DismissDirection.endToStart,
                                background: Container(
                                  alignment: Alignment.centerRight,
                                  padding: const EdgeInsets.only(right: 20),
                                  decoration: BoxDecoration(
                                    color: AppColors.error,
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                  child: const Icon(Icons.delete_rounded, color: Colors.white),
                                ),
                                confirmDismiss: (_) async {
                                  return await showDialog<bool>(
                                    context: context,
                                    builder: (ctx) => AlertDialog(
                                      title: Text(isAr ? 'تأكيد الحذف' : 'Confirm Delete'),
                                      content: Text(isAr ? 'هل تريد حذف هذا الحدث؟' : 'Delete this event?'),
                                      actions: [
                                        TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(isAr ? 'إلغاء' : 'Cancel')),
                                        ElevatedButton(
                                          onPressed: () => Navigator.pop(ctx, true),
                                          style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
                                          child: Text(isAr ? 'حذف' : 'Delete'),
                                        ),
                                      ],
                                    ),
                                  ) ?? false;
                                },
                                onDismissed: (_) => _deleteEvent(event['id']?.toString() ?? '', isAr),
                                child: GestureDetector(
                                  onTap: () => _showEventForm(isAr, existing: event),
                                  child: Container(
                                    padding: const EdgeInsets.all(14),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(14),
                                      border: Border.all(color: AppColors.border),
                                    ),
                                    child: Row(
                                      children: [
                                        Container(
                                          width: 44,
                                          height: 44,
                                          decoration: BoxDecoration(
                                            color: color.withOpacity(0.1),
                                            borderRadius: BorderRadius.circular(10),
                                          ),
                                          child: Icon(Icons.event_rounded, color: color, size: 22),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                title?.toString() ?? '',
                                                style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                              if (start != null)
                                                Text(
                                                  Helpers.formatDate(start),
                                                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                                ),
                                            ],
                                          ),
                                        ),
                                        if (type.isNotEmpty)
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                            decoration: BoxDecoration(
                                              color: color.withOpacity(0.1),
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            child: Text(type, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600)),
                                          ),
                                        const SizedBox(width: 8),
                                        const Icon(Icons.chevron_right_rounded, color: AppColors.textSecondary),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                  ),
      ),
    );
  }
}
