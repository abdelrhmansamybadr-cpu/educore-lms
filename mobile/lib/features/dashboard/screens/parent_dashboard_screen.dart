import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/network/api_client.dart';
import '../../../core/utils/helpers.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/bottom_nav_widget.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../../shared/widgets/skeleton_loader.dart';

class ParentDashboardScreen extends StatefulWidget {
  const ParentDashboardScreen({super.key});

  @override
  State<ParentDashboardScreen> createState() => _ParentDashboardScreenState();
}

class _ParentDashboardScreenState extends State<ParentDashboardScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _children = [];

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
      final response = await ApiClient.instance.get('/parent/children');
      final data = response.data;
      setState(() {
        _children = (data is Map ? data['data'] : data) ?? [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isAr = auth.isAr;
    final user = auth.user;

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        bottomNavigationBar: ParentBottomNav(currentIndex: 0, isAr: isAr),
        body: SafeArea(
          child: Column(
            children: [
              // Header
              Container(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.primary, AppColors.primaryLight],
                  ),
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(24),
                    bottomRight: Radius.circular(24),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          Helpers.getGreeting(isAr),
                          style: TextStyle(
                              color: Colors.white.withOpacity(0.8), fontSize: 14),
                        ),
                        Text(
                          user?.displayName(isAr) ?? '',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        GestureDetector(
                          onTap: auth.toggleLocale,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              isAr ? 'EN' : 'ع',
                              style: const TextStyle(
                                  color: Colors.white, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          onPressed: () => context.go('/parent/notifications'),
                          icon: const Icon(Icons.notifications_outlined,
                              color: Colors.white),
                        ),
                        IconButton(
                          onPressed: () => context.go('/parent/settings'),
                          icon: const Icon(Icons.settings_outlined,
                              color: Colors.white),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              // Content
              Expanded(
                child: _isLoading
                    ? const Padding(
                        padding: EdgeInsets.all(16),
                        child: ListSkeletonLoader(),
                      )
                    : _error != null
                        ? AppErrorWidget(
                            message: _error!, onRetry: _loadData)
                        : RefreshIndicator(
                            onRefresh: _loadData,
                            child: CustomScrollView(
                              slivers: [
                                // Quick actions
                                SliverPadding(
                                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                                  sliver: SliverToBoxAdapter(child: _buildQuickAccessRow(isAr)),
                                ),
                                // Section header
                                SliverToBoxAdapter(
                                  child: Padding(
                                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          S.myChildren(isAr),
                                          style: const TextStyle(
                                            fontSize: 17,
                                            fontWeight: FontWeight.bold,
                                            color: AppColors.textPrimary,
                                          ),
                                        ),
                                        GestureDetector(
                                          onTap: () => context.go('/parent/children'),
                                          child: Text(
                                            S.seeAll(isAr),
                                            style: const TextStyle(
                                              fontSize: 13,
                                              color: AppColors.primary,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                // Children list
                                _children.isEmpty
                                    ? SliverToBoxAdapter(
                                        child: Center(
                                          child: Padding(
                                            padding: const EdgeInsets.all(32),
                                            child: Text(S.noChildren(isAr),
                                                style: const TextStyle(
                                                    color: AppColors.textSecondary)),
                                          ),
                                        ),
                                      )
                                    : SliverPadding(
                                        padding: const EdgeInsets.symmetric(horizontal: 16),
                                        sliver: SliverList(
                                          delegate: SliverChildSeparatedBuilderDelegate(
                                            (_, i) => _buildChildCard(_children[i], isAr),
                                            (_, __) => const SizedBox(height: 12),
                                            childCount: _children.length,
                                          ),
                                        ),
                                      ),
                                const SliverToBoxAdapter(child: SizedBox(height: 80)),
                              ],
                            ),
                          ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickAccessRow(bool isAr) {
    return Row(
      children: [
        Expanded(
          child: _quickBtn(
            icon: Icons.child_care_rounded,
            label: isAr ? 'الأبناء' : 'Children',
            color: AppColors.primary,
            onTap: () => context.go('/parent/children'),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _quickBtn(
            icon: Icons.chat_bubble_rounded,
            label: isAr ? 'الرسائل' : 'Messages',
            color: AppColors.info,
            onTap: () => context.go('/parent/messages'),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _quickBtn(
            icon: Icons.event_rounded,
            label: isAr ? 'الفعاليات' : 'Events',
            color: AppColors.success,
            onTap: () => context.go('/parent/events'),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _quickBtn(
            icon: Icons.settings_rounded,
            label: isAr ? 'الإعدادات' : 'Settings',
            color: AppColors.textSecondary,
            onTap: () => context.go('/parent/settings'),
          ),
        ),
      ],
    );
  }

  Widget _quickBtn({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Container(
              width: 36, height: 36,
              decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 6),
            Text(label,
                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }

  Widget _buildChildCard(dynamic child, bool isAr) {
    final Map<String, dynamic> c = child is Map<String, dynamic> ? child : {};
    final profile = (c['profile'] as Map?) ?? c;
    final first = profile['firstName']?.toString() ?? c['firstName']?.toString() ?? '';
    final last = profile['lastName']?.toString() ?? c['lastName']?.toString() ?? '';
    final name = '$first $last'.trim();
    final grade = c['grade'] ?? c['class'] ?? '';
    final attendance = (c['attendance'] ?? 0.0).toDouble();
    final childId = c['id']?.toString() ?? '';

    return GestureDetector(
      onTap: () => context.push('/parent/children/$childId?name=${Uri.encodeComponent(name)}'),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: AppColors.primary.withOpacity(0.1),
                  child: Text(
                    Helpers.getInitials(first, last),
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name.isNotEmpty ? name : 'Child',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      if (grade.toString().isNotEmpty)
                        Text(
                          '${S.grade(isAr)}: $grade',
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppColors.textSecondary,
                          ),
                        ),
                    ],
                  ),
                ),
                // Attendance ring
                SizedBox(
                  width: 50,
                  height: 50,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      CircularProgressIndicator(
                        value: attendance / 100,
                        backgroundColor: AppColors.border,
                        color: AppColors.success,
                        strokeWidth: 4,
                      ),
                      Text(
                        '${attendance.toStringAsFixed(0)}%',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: AppColors.success,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildQuickAction(
                    icon: Icons.grade_rounded,
                    label: S.viewGrades(isAr),
                    color: AppColors.info,
                    onTap: () => context.push('/parent/children/$childId?name=${Uri.encodeComponent(name)}'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildQuickAction(
                    icon: Icons.fact_check_rounded,
                    label: S.viewAttendance(isAr),
                    color: AppColors.success,
                    onTap: () => context.push('/parent/children/$childId?name=${Uri.encodeComponent(name)}'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildQuickAction(
                    icon: Icons.notifications_outlined,
                    label: S.notifications(isAr),
                    color: AppColors.warning,
                    onTap: () => context.go('/parent/notifications'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickAction({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                color: color,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

// Helper delegate for SliverList with separators
class SliverChildSeparatedBuilderDelegate extends SliverChildBuilderDelegate {
  SliverChildSeparatedBuilderDelegate(
    Widget Function(BuildContext, int) itemBuilder,
    Widget Function(BuildContext, int) separatorBuilder, {
    required int childCount,
  }) : super(
          (context, index) {
            final itemIndex = index ~/ 2;
            if (index.isEven) {
              return itemBuilder(context, itemIndex);
            }
            return separatorBuilder(context, itemIndex);
          },
          childCount: childCount == 0 ? 0 : childCount * 2 - 1,
        );
}
