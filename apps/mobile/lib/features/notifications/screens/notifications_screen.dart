import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/app_bar_widget.dart';
import '../../../shared/widgets/skeleton_loader.dart';
import '../../../shared/widgets/empty_state_widget.dart';
import '../../../shared/widgets/error_widget.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _notifications = [];

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final response = await ApiClient.instance.get(ApiEndpoints.notifications);
      final data = response.data;
      setState(() {
        _notifications = (data is Map ? data['data'] : data) ?? [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _markRead(String id, int index) async {
    try {
      await ApiClient.instance.patch(ApiEndpoints.markRead(id));
      setState(() {
        _notifications[index]['isRead'] = true;
        _notifications[index]['read'] = true;
      });
    } catch (_) {}
  }

  Future<void> _markAllRead() async {
    try {
      await ApiClient.instance.patch(ApiEndpoints.markAllRead);
      setState(() {
        for (final n in _notifications) {
          n['isRead'] = true;
          n['read'] = true;
        }
      });
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isAr = auth.isAr;
    final unread = _notifications.where((n) => !(n['isRead'] ?? n['read'] ?? false)).length;

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBarWidget(
          title: S.notifications(isAr),
          actions: unread > 0
              ? [
                  TextButton(
                    onPressed: _markAllRead,
                    child: Text(
                      S.markAllRead(isAr),
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ]
              : null,
        ),
        body: _isLoading
            ? const Padding(
                padding: EdgeInsets.all(16),
                child: ListSkeletonLoader(),
              )
            : _error != null
                ? AppErrorWidget(
                    message: _error!,
                    onRetry: _loadNotifications,
                    retryLabel: S.retry(isAr),
                  )
                : _notifications.isEmpty
                    ? EmptyStateWidget(
                        emoji: '🔔',
                        title: S.noNotifications(isAr),
                        subtitle: S.noNotificationsSubtitle(isAr),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadNotifications,
                        child: ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _notifications.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 8),
                          itemBuilder: (_, i) {
                            final n = _notifications[i];
                            return _buildNotificationCard(n, i, isAr);
                          },
                        ),
                      ),
      ),
    );
  }

  Widget _buildNotificationCard(Map<String, dynamic> n, int index, bool isAr) {
    final isRead = n['isRead'] ?? n['read'] ?? false;
    final type = n['type'] ?? 'general';
    final title = n['title'] ?? '';
    final body = n['body'] ?? n['message'] ?? '';
    final createdAt =
        n['createdAt'] != null ? DateTime.tryParse(n['createdAt']) : null;

    IconData icon;
    Color iconColor;

    switch (type) {
      case 'assignment':
        icon = Icons.assignment_outlined;
        iconColor = AppColors.warning;
        break;
      case 'grade':
        icon = Icons.grade_outlined;
        iconColor = AppColors.success;
        break;
      case 'announcement':
        icon = Icons.campaign_outlined;
        iconColor = AppColors.info;
        break;
      case 'quiz':
        icon = Icons.quiz_outlined;
        iconColor = AppColors.primary;
        break;
      default:
        icon = Icons.notifications_outlined;
        iconColor = AppColors.textSecondary;
    }

    return GestureDetector(
      onTap: () {
        if (!isRead) _markRead(n['id']?.toString() ?? '', index);
      },
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isRead ? AppColors.surface : AppColors.primary.withOpacity(0.04),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isRead ? AppColors.border : AppColors.primary.withOpacity(0.2),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: iconColor, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight:
                                isRead ? FontWeight.w500 : FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                      if (!isRead)
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                  if (body.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      body,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                        height: 1.4,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  if (createdAt != null) ...[
                    const SizedBox(height: 6),
                    Text(
                      timeago.format(createdAt, locale: isAr ? 'ar' : 'en'),
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
