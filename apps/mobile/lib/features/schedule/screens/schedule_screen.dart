import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';

class ScheduleScreen extends StatefulWidget {
  const ScheduleScreen({super.key});

  @override
  State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  String? _error;
  late TabController _tabCtrl;
  Map<String, List<Map<String, dynamic>>> _scheduleByDay = {};

  static const _days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  static const _daysAr = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 5, vsync: this);
    // Default to today's weekday index (Mon=0 ... Fri=4)
    final todayIndex = DateTime.now().weekday - 1;
    if (todayIndex >= 0 && todayIndex < 5) {
      _tabCtrl.index = todayIndex;
    }
    _loadData();
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final res = await ApiClient.instance.get(ApiEndpoints.courses);
      final raw = res.data;
      final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
      final courses = d is List ? List<dynamic>.from(d) : <dynamic>[];

      // Group by schedule days if schedule field exists
      final map = <String, List<Map<String, dynamic>>>{};
      for (final day in _days) {
        map[day] = [];
      }

      for (final course in courses) {
        final schedule = course['schedule'];
        if (schedule is List) {
          for (final slot in schedule) {
            final day = slot['day']?.toString() ?? '';
            if (map.containsKey(day)) {
              map[day]!.add({
                'course': course['title'] ?? '',
                'room': slot['room'] ?? slot['classroom'] ?? '',
                'teacher': _getTeacherName(course),
                'startTime': slot['startTime'] ?? slot['start'] ?? '',
                'endTime': slot['endTime'] ?? slot['end'] ?? '',
              });
            }
          }
        } else if (schedule is Map) {
          // Schedule as map of day -> slots
          for (final day in _days) {
            final slots = schedule[day] ?? schedule[day.toLowerCase()];
            if (slots is List) {
              for (final slot in slots) {
                map[day]!.add({
                  'course': course['title'] ?? '',
                  'room': slot['room'] ?? '',
                  'teacher': _getTeacherName(course),
                  'startTime': slot['startTime'] ?? slot['start'] ?? '',
                  'endTime': slot['endTime'] ?? slot['end'] ?? '',
                });
              }
            }
          }
        }
      }

      // Sort each day's slots by startTime
      for (final day in _days) {
        map[day]!.sort((a, b) => (a['startTime'] as String).compareTo(b['startTime'] as String));
      }

      setState(() {
        _scheduleByDay = map;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  String _getTeacherName(dynamic course) {
    if (course['teacher'] is Map) {
      final t = course['teacher'] as Map;
      final profile = t['profile'] as Map?;
      if (profile != null) {
        return '${profile['firstName'] ?? ''} ${profile['lastName'] ?? ''}'.trim();
      }
      return '${t['firstName'] ?? ''} ${t['lastName'] ?? ''}'.trim();
    }
    return course['teacherName']?.toString() ?? '';
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
          title: Text(
            isAr ? 'الجدول الأسبوعي' : 'Weekly Schedule',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.primary,
          elevation: 0,
          bottom: TabBar(
            controller: _tabCtrl,
            isScrollable: true,
            labelColor: AppColors.primary,
            unselectedLabelColor: AppColors.textSecondary,
            indicatorColor: AppColors.primary,
            labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
            tabs: List.generate(5, (i) => Tab(text: isAr ? _daysAr[i] : _days[i].substring(0, 3))),
          ),
        ),
        body: _isLoading
            ? const Padding(padding: EdgeInsets.all(16), child: ListSkeletonLoader())
            : _error != null
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.error_outline, color: AppColors.error, size: 48),
                        const SizedBox(height: 12),
                        Text(isAr ? 'فشل تحميل الجدول' : 'Failed to load schedule'),
                        const SizedBox(height: 12),
                        ElevatedButton(onPressed: _loadData, child: Text(isAr ? 'إعادة' : 'Retry')),
                      ],
                    ),
                  )
                : TabBarView(
                    controller: _tabCtrl,
                    children: List.generate(5, (i) {
                      final day = _days[i];
                      final slots = _scheduleByDay[day] ?? [];
                      return RefreshIndicator(
                        onRefresh: _loadData,
                        child: slots.isEmpty
                            ? ListView(
                                children: [
                                  SizedBox(
                                    height: MediaQuery.of(context).size.height * 0.55,
                                    child: Center(
                                      child: Column(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Icon(Icons.event_note_rounded, size: 64, color: AppColors.border),
                                          const SizedBox(height: 16),
                                          Text(
                                            isAr ? 'لا توجد حصص هذا اليوم' : 'No classes scheduled',
                                            style: const TextStyle(fontSize: 15, color: AppColors.textSecondary),
                                          ),
                                          const SizedBox(height: 8),
                                          Text(
                                            isAr ? 'الجدول قيد الإعداد' : 'Schedule coming soon',
                                            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              )
                            : ListView.separated(
                                padding: const EdgeInsets.all(16),
                                itemCount: slots.length,
                                separatorBuilder: (_, __) => const SizedBox(height: 10),
                                itemBuilder: (_, j) => _buildSlotCard(slots[j], isAr),
                              ),
                      );
                    }),
                  ),
      ),
    );
  }

  Widget _buildSlotCard(Map<String, dynamic> slot, bool isAr) {
    final colors = [
      AppColors.primary, AppColors.info, AppColors.success,
      AppColors.warning, AppColors.error,
    ];
    final colorIndex = slot['course'].hashCode.abs() % colors.length;
    final color = colors[colorIndex];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: IntrinsicHeight(
        child: Row(
          children: [
            Container(
              width: 4,
              decoration: BoxDecoration(
                color: color,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(14),
                  bottomLeft: Radius.circular(14),
                ),
              ),
            ),
            if (slot['startTime'].toString().isNotEmpty)
              Container(
                width: 64,
                padding: const EdgeInsets.symmetric(vertical: 14),
                alignment: Alignment.center,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      slot['startTime'].toString(),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: color,
                      ),
                    ),
                    if (slot['endTime'].toString().isNotEmpty)
                      Text(
                        slot['endTime'].toString(),
                        style: const TextStyle(fontSize: 10, color: AppColors.textSecondary),
                      ),
                  ],
                ),
              ),
            Container(width: 1, color: AppColors.border),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      slot['course'].toString(),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    if (slot['teacher'].toString().isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.person_rounded, size: 13, color: AppColors.textSecondary),
                          const SizedBox(width: 4),
                          Text(
                            slot['teacher'].toString(),
                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ],
                    if (slot['room'].toString().isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.room_rounded, size: 13, color: AppColors.textSecondary),
                          const SizedBox(width: 4),
                          Text(
                            slot['room'].toString(),
                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ],
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
