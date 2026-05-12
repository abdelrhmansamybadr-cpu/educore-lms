import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/network/api_client.dart';
import '../../../core/utils/helpers.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/bottom_nav_widget.dart';
import '../../../shared/widgets/stat_card_widget.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  Map<String, dynamic> _stats = {};

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    String? totalUsers, totalCourses, totalStudents, totalTeachers;
    try {
      final r = await ApiClient.instance.get('/dashboard/stats');
      final d = r.data is Map ? (r.data['data'] ?? r.data) : r.data;
      if (d is Map) {
        totalUsers = d['totalUsers']?.toString();
        totalStudents = d['totalStudents']?.toString();
        totalTeachers = d['totalTeachers']?.toString();
        totalCourses = d['totalCourses']?.toString();
      }
    } catch (_) {}
    if (totalUsers == null) {
      try {
        final r = await ApiClient.instance.get('/users?limit=1');
        final meta = r.data is Map ? r.data['meta'] : null;
        totalUsers = meta?['total']?.toString();
      } catch (_) {}
    }
    if (totalCourses == null) {
      try {
        final r = await ApiClient.instance.get('/courses?limit=1');
        final meta = r.data is Map ? r.data['meta'] : null;
        totalCourses = meta?['total']?.toString();
      } catch (_) {}
    }
    if (mounted) {
      setState(() {
        _stats = {
          'users': totalUsers ?? '—',
          'students': totalStudents ?? '—',
          'teachers': totalTeachers ?? '—',
          'courses': totalCourses ?? '—',
        };
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
        bottomNavigationBar: AdminBottomNav(currentIndex: 0, isAr: isAr),
        body: SafeArea(
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Container(
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
                          Container(
                            margin: const EdgeInsets.only(top: 4),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.accent.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              S.admin(isAr),
                              style: const TextStyle(
                                color: AppColors.accent,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          IconButton(
                            onPressed: () => context.go('/admin/notifications'),
                            icon: const Icon(Icons.notifications_outlined, color: Colors.white),
                          ),
                          IconButton(
                            onPressed: () => context.go('/admin/settings'),
                            icon: const Icon(Icons.settings_outlined, color: Colors.white),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.2,
                  ),
                  delegate: SliverChildListDelegate([
                    StatCard(
                        value: _stats['students'] ?? '—',
                        label: isAr ? 'الطلاب' : 'Students',
                        icon: Icons.people_rounded,
                        iconColor: AppColors.primary),
                    StatCard(
                        value: _stats['teachers'] ?? '—',
                        label: isAr ? 'المعلمون' : 'Teachers',
                        icon: Icons.school_rounded,
                        iconColor: AppColors.success),
                    StatCard(
                        value: _stats['courses'] ?? '—',
                        label: isAr ? 'المقررات' : 'Courses',
                        icon: Icons.menu_book_rounded,
                        iconColor: AppColors.info),
                    StatCard(
                        value: _stats['users'] ?? '—',
                        label: isAr ? 'المستخدمون' : 'All Users',
                        icon: Icons.people_outline_rounded,
                        iconColor: AppColors.warning),
                  ]),
                ),
              ),
              // Quick management actions
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                sliver: SliverToBoxAdapter(
                  child: Text(
                    isAr ? 'أدوات الإدارة' : 'Management Tools',
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.8,
                  ),
                  delegate: SliverChildListDelegate([
                    _adminActionCard(
                      context,
                      icon: Icons.people_rounded,
                      label: isAr ? 'إدارة المستخدمين' : 'User Management',
                      color: AppColors.primary,
                      route: '/admin/users',
                    ),
                    _adminActionCard(
                      context,
                      icon: Icons.event_rounded,
                      label: isAr ? 'إدارة الفعاليات' : 'Events',
                      color: AppColors.success,
                      route: '/admin/events',
                    ),
                    _adminActionCard(
                      context,
                      icon: Icons.chat_bubble_rounded,
                      label: isAr ? 'الرسائل' : 'Messages',
                      color: AppColors.info,
                      route: '/admin/messages',
                    ),
                    _adminActionCard(
                      context,
                      icon: Icons.notifications_rounded,
                      label: isAr ? 'الإشعارات' : 'Notifications',
                      color: AppColors.warning,
                      route: '/admin/notifications',
                    ),
                    _adminActionCard(
                      context,
                      icon: Icons.settings_rounded,
                      label: isAr ? 'الإعدادات' : 'Settings',
                      color: AppColors.textSecondary,
                      route: '/admin/settings',
                    ),
                    _adminActionCard(
                      context,
                      icon: Icons.person_rounded,
                      label: isAr ? 'الملف الشخصي' : 'Profile',
                      color: AppColors.error,
                      route: '/admin/profile',
                    ),
                  ]),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 80)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _adminActionCard(
    BuildContext context, {
    required IconData icon,
    required String label,
    required Color color,
    required String route,
  }) {
    return GestureDetector(
      onTap: () => context.go(route),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              width: 38, height: 38,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
