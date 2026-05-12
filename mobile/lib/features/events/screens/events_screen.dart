import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/utils/helpers.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';

class EventsScreen extends StatefulWidget {
  const EventsScreen({super.key});

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _events = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final res = await ApiClient.instance.get(ApiEndpoints.upcomingEvents);
      final raw = res.data;
      final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
      setState(() {
        _events = d is List ? List<dynamic>.from(d) : <dynamic>[];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _createEvent(Map<String, dynamic> data) async {
    try {
      await ApiClient.instance.post(ApiEndpoints.events, data: data);
      _loadData();
    } catch (_) {}
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

  void _showCreateSheet(bool isAr) {
    final titleCtrl = TextEditingController();
    final titleArCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    final locationCtrl = TextEditingController();
    DateTime? startDate;
    DateTime? endDate;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(builder: (ctx, setSheet) {
          return SingleChildScrollView(
            padding: EdgeInsets.only(
              left: 16, right: 16, top: 20,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isAr ? 'إضافة حدث' : 'Create Event',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 16),
                _inputField(titleCtrl, isAr ? 'العنوان (إنجليزي)' : 'Title (English)'),
                const SizedBox(height: 12),
                _inputField(titleArCtrl, isAr ? 'العنوان (عربي)' : 'Title (Arabic)'),
                const SizedBox(height: 12),
                _inputField(descCtrl, isAr ? 'الوصف' : 'Description', maxLines: 3),
                const SizedBox(height: 12),
                _inputField(locationCtrl, isAr ? 'الموقع' : 'Location'),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          final d = await showDatePicker(
                            context: ctx,
                            initialDate: DateTime.now(),
                            firstDate: DateTime.now().subtract(const Duration(days: 1)),
                            lastDate: DateTime.now().add(const Duration(days: 365)),
                          );
                          if (d != null) setSheet(() => startDate = d);
                        },
                        icon: const Icon(Icons.calendar_today_rounded, size: 16),
                        label: Text(
                          startDate != null
                              ? Helpers.formatDate(startDate!)
                              : (isAr ? 'تاريخ البدء' : 'Start Date'),
                          style: const TextStyle(fontSize: 13),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          final d = await showDatePicker(
                            context: ctx,
                            initialDate: startDate ?? DateTime.now(),
                            firstDate: startDate ?? DateTime.now(),
                            lastDate: DateTime.now().add(const Duration(days: 365)),
                          );
                          if (d != null) setSheet(() => endDate = d);
                        },
                        icon: const Icon(Icons.calendar_month_rounded, size: 16),
                        label: Text(
                          endDate != null
                              ? Helpers.formatDate(endDate!)
                              : (isAr ? 'تاريخ الانتهاء' : 'End Date'),
                          style: const TextStyle(fontSize: 13),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      if (titleCtrl.text.trim().isEmpty || startDate == null) return;
                      Navigator.pop(ctx);
                      _createEvent({
                        'title': titleCtrl.text.trim(),
                        'titleAr': titleArCtrl.text.trim(),
                        'description': descCtrl.text.trim(),
                        'location': locationCtrl.text.trim(),
                        'startDate': startDate!.toIso8601String(),
                        'endDate': (endDate ?? startDate!).toIso8601String(),
                      });
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text(isAr ? 'إنشاء الحدث' : 'Create Event'),
                  ),
                ),
              ],
            ),
          );
        });
      },
    );
  }

  Widget _inputField(TextEditingController ctrl, String hint, {int maxLines = 1}) {
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
    final role = (auth.user?.role ?? '').toUpperCase();
    final isAdmin = role.contains('ADMIN') || role.contains('PRINCIPAL') || role.contains('DIRECTOR');

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: Text(
            isAr ? 'الأحداث والفعاليات' : 'Events',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.primary,
          elevation: 0,
          bottom: const PreferredSize(
            preferredSize: Size.fromHeight(1),
            child: Divider(height: 1, color: AppColors.border),
          ),
        ),
        floatingActionButton: isAdmin
            ? FloatingActionButton(
                onPressed: () => _showCreateSheet(isAr),
                backgroundColor: AppColors.primary,
                child: const Icon(Icons.add_rounded, color: Colors.white),
              )
            : null,
        body: _isLoading
            ? const Padding(padding: EdgeInsets.all(16), child: ListSkeletonLoader())
            : _error != null
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.error_outline, color: AppColors.error, size: 48),
                        const SizedBox(height: 12),
                        Text(_error!, textAlign: TextAlign.center),
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
                                      const Icon(Icons.event_available_rounded, size: 64, color: AppColors.border),
                                      const SizedBox(height: 16),
                                      Text(
                                        isAr ? 'لا توجد فعاليات قادمة' : 'No upcoming events',
                                        style: const TextStyle(fontSize: 16, color: AppColors.textSecondary),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: _events.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (_, i) => _buildEventCard(_events[i], isAr),
                          ),
                  ),
      ),
    );
  }

  Widget _buildEventCard(Map<String, dynamic> event, bool isAr) {
    final title = isAr
        ? (event['titleAr']?.toString().isNotEmpty == true ? event['titleAr'] : event['title'])
        : event['title'];
    final desc = isAr
        ? (event['descriptionAr']?.toString().isNotEmpty == true ? event['descriptionAr'] : event['description'])
        : event['description'];
    final type = event['type']?.toString() ?? '';
    final location = event['location']?.toString() ?? '';
    final startRaw = event['startDate']?.toString();
    final color = _typeColor(type);

    DateTime? startDate;
    if (startRaw != null) startDate = DateTime.tryParse(startRaw);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: IntrinsicHeight(
        child: Row(
          children: [
            Container(
              width: 5,
              decoration: BoxDecoration(
                color: color,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(16),
                  bottomLeft: Radius.circular(16),
                ),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            title?.toString() ?? '',
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ),
                        if (type.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: color.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              type,
                              style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600),
                            ),
                          ),
                      ],
                    ),
                    if (desc != null && desc.toString().isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        desc.toString(),
                        style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        if (startDate != null) ...[
                          const Icon(Icons.calendar_today_rounded, size: 14, color: AppColors.textSecondary),
                          const SizedBox(width: 4),
                          Text(
                            Helpers.formatDate(startDate),
                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                          ),
                          const SizedBox(width: 16),
                        ],
                        if (location.isNotEmpty) ...[
                          const Icon(Icons.location_on_rounded, size: 14, color: AppColors.textSecondary),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              location,
                              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
