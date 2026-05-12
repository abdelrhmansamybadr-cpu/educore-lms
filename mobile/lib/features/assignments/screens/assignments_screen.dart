import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/utils/helpers.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/app_bar_widget.dart';
import '../../../shared/widgets/bottom_nav_widget.dart';
import '../../../shared/widgets/skeleton_loader.dart';
import '../../../shared/widgets/empty_state_widget.dart';
import '../../../shared/widgets/error_widget.dart';

class AssignmentsScreen extends StatefulWidget {
  const AssignmentsScreen({super.key});

  @override
  State<AssignmentsScreen> createState() => _AssignmentsScreenState();
}

class _AssignmentsScreenState extends State<AssignmentsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  String? _error;
  List<dynamic> _active = [];
  List<dynamic> _past = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadAssignments();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadAssignments() async {
    setState(() { _isLoading = true; _error = null; });

    // Use role-appropriate endpoints — GET /assignments base route does not exist
    dynamic activeData, pastData;
    await Future.wait([
      ApiClient.instance.get(ApiEndpoints.mySubmissions)
          .then((r) => activeData = r.data).catchError((_) {}),
      ApiClient.instance.get(ApiEndpoints.mySubmissions)
          .then((r) => pastData = r.data).catchError((_) {}),
    ]);

    final all = ((activeData is Map ? activeData['data'] : activeData) ?? []) as List;
    setState(() {
      // Split by submission status: submitted/graded = past, everything else = active
      _active = all.where((a) {
        final s = (a['status'] ?? a['submission']?['status'] ?? '').toString().toLowerCase();
        return s != 'submitted' && s != 'graded';
      }).toList();
      _past = all.where((a) {
        final s = (a['status'] ?? a['submission']?['status'] ?? '').toString().toLowerCase();
        return s == 'submitted' || s == 'graded';
      }).toList();
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isAr = auth.isAr;
    final isTeacher = auth.user?.isTeacher ?? false;
    final basePath = isTeacher ? '/teacher' : '/student';

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBarWidget(
          title: S.assignments(isAr),
          showBack: false,
          bottom: TabBar(
            controller: _tabController,
            labelColor: AppColors.primary,
            unselectedLabelColor: AppColors.textSecondary,
            indicatorColor: AppColors.primary,
            tabs: [
              Tab(text: S.active(isAr)),
              Tab(text: S.past(isAr)),
            ],
          ),
        ),
        body: _isLoading
            ? const Padding(
                padding: EdgeInsets.all(16),
                child: ListSkeletonLoader(),
              )
            : _error != null
                ? AppErrorWidget(
                    message: _error!,
                    onRetry: _loadAssignments,
                    retryLabel: S.retry(isAr),
                  )
                : TabBarView(
                    controller: _tabController,
                    children: [
                      _buildList(_active, isAr, isTeacher, basePath, false),
                      _buildList(_past, isAr, isTeacher, basePath, true),
                    ],
                  ),
        bottomNavigationBar: isTeacher
            ? TeacherBottomNav(currentIndex: 2, isAr: isAr)
            : StudentBottomNav(currentIndex: 2, isAr: isAr),
      ),
    );
  }

  Widget _buildList(List<dynamic> items, bool isAr, bool isTeacher,
      String basePath, bool isPast) {
    if (items.isEmpty) {
      return EmptyStateWidget(
        emoji: isPast ? '✅' : '📝',
        title: S.noAssignments(isAr),
        subtitle: S.noAssignmentsSubtitle(isAr),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadAssignments,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, i) {
          final a = items[i];
          return _buildAssignmentCard(a, isAr, isTeacher, basePath);
        },
      ),
    );
  }

  Widget _buildAssignmentCard(
      Map<String, dynamic> a, bool isAr, bool isTeacher, String basePath) {
    final title = a['title'] ?? '';
    final courseName = a['courseName'] ??
        (a['course'] is Map ? a['course']['title'] : '');
    final status = a['status'] ?? 'pending';
    final score = a['score'];
    final maxScore = a['maxPoints'] ?? a['maxScore'] ?? a['max_score'] ?? 100;
    final dueDate =
        a['dueDate'] != null ? DateTime.tryParse(a['dueDate']) : null;
    final submissionsCount = a['submissionsCount'] ?? 0;

    Color statusColor;
    String statusLabel;
    IconData statusIcon;

    switch (status) {
      case 'submitted':
        statusColor = AppColors.info;
        statusLabel = S.submitted(isAr);
        statusIcon = Icons.upload_file_rounded;
        break;
      case 'graded':
        statusColor = AppColors.success;
        statusLabel = S.graded(isAr);
        statusIcon = Icons.grade_rounded;
        break;
      case 'late':
        statusColor = AppColors.error;
        statusLabel = S.late(isAr);
        statusIcon = Icons.timer_off_rounded;
        break;
      default:
        statusColor = AppColors.warning;
        statusLabel = S.pending(isAr);
        statusIcon = Icons.assignment_outlined;
    }

    return GestureDetector(
      onTap: () => context.go('$basePath/assignments/${a['id']}'),
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
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(statusIcon, color: statusColor, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        courseName,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: statusColor.withOpacity(0.3)),
                  ),
                  child: Text(
                    statusLabel,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: statusColor,
                    ),
                  ),
                ),
              ],
            ),
            if (dueDate != null || score != null || isTeacher) ...[
              const SizedBox(height: 12),
              const Divider(height: 1),
              const SizedBox(height: 12),
              Row(
                children: [
                  if (dueDate != null) ...[
                    const Icon(Icons.calendar_today_outlined,
                        size: 13, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Text(
                      Helpers.formatDate(dueDate),
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.textSecondary),
                    ),
                  ],
                  const Spacer(),
                  if (score != null)
                    Text(
                      Helpers.formatScore(
                          score.toDouble(), maxScore.toDouble()),
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Helpers.getGradeColor(
                            score / maxScore * 100),
                      ),
                    ),
                  if (isTeacher && submissionsCount > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.info.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '$submissionsCount ${S.submissions(isAr)}',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.info,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
