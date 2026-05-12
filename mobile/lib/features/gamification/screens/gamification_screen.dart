import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';

class GamificationScreen extends StatefulWidget {
  const GamificationScreen({super.key});

  @override
  State<GamificationScreen> createState() => _GamificationScreenState();
}

class _GamificationScreenState extends State<GamificationScreen> {
  Map<String, dynamic>? _points;
  List<dynamic> _badges = [];
  List<dynamic> _leaderboard = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    dynamic pointsData, badgesData, leaderboardData;
    await Future.wait([
      ApiClient.instance.get(ApiEndpoints.myPoints).then((r) => pointsData = r.data).catchError((_) {}),
      ApiClient.instance.get(ApiEndpoints.myBadges).then((r) => badgesData = r.data).catchError((_) {}),
      ApiClient.instance.get(ApiEndpoints.leaderboard).then((r) => leaderboardData = r.data).catchError((_) {}),
    ]);
    setState(() {
      _points = pointsData is Map ? (pointsData['data'] ?? pointsData) : null;
      _badges = (badgesData is Map ? badgesData['data'] : badgesData) ?? [];
      _leaderboard = (leaderboardData is Map ? leaderboardData['data'] : leaderboardData) ?? [];
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthProvider>();
    final isAr = auth.isAr;
    final myId = auth.user?.id;
    final myRank = _leaderboard.indexWhere((e) => e['userId'] == myId);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(isAr ? 'المكافآت والإنجازات' : 'Rewards & Achievements'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        bottom: const PreferredSize(preferredSize: Size.fromHeight(1), child: Divider(height: 1, color: AppColors.border)),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Padding(padding: EdgeInsets.all(16), child: Column(children: [SkeletonLoader(height: 150), SizedBox(height: 12), SkeletonLoader(height: 200)]))
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Points header
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      gradient: AppColors.gradientPrimary,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Column(children: [
                      const Icon(Icons.star_rounded, color: AppColors.accent, size: 48),
                      const SizedBox(height: 8),
                      Text(
                        '${_points?['total'] ?? 0}',
                        style: const TextStyle(color: Colors.white, fontSize: 48, fontWeight: FontWeight.bold),
                      ),
                      Text(isAr ? 'نقطة' : 'Points', style: const TextStyle(color: Colors.white70, fontSize: 16)),
                      const SizedBox(height: 16),
                      Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
                        _stat(isAr ? 'التتابع' : 'Streak', '${_points?['streak'] ?? 0} ${isAr ? "يوم" : "days"}', Icons.local_fire_department_rounded, AppColors.accent),
                        _stat(isAr ? 'مركزي' : 'Rank', myRank >= 0 ? '#${myRank + 1}' : '—', Icons.emoji_events_rounded, Colors.amber),
                        _stat(isAr ? 'شاراتي' : 'Badges', '${_badges.length}', Icons.workspace_premium_rounded, Colors.white),
                      ]),
                    ]),
                  ),
                  const SizedBox(height: 20),

                  // Badges
                  Text(isAr ? 'شاراتي' : 'My Badges', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                  const SizedBox(height: 12),
                  if (_badges.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                      child: Column(children: [
                        const Text('🏅', style: TextStyle(fontSize: 40)),
                        const SizedBox(height: 8),
                        Text(isAr ? 'لا توجد شارات بعد\nاستمر في الكسب!' : 'No badges yet\nKeep earning points!',
                            textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textSecondary)),
                      ]),
                    )
                  else
                    Wrap(
                      spacing: 12, runSpacing: 12,
                      children: _badges.map((ub) {
                        final badge = ub['badge'] ?? ub;
                        final name = isAr ? (badge['nameAr'] ?? badge['name']) : badge['name'];
                        return Container(
                          width: 80,
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white, borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: AppColors.accent.withOpacity(0.4)),
                          ),
                          child: Column(children: [
                            Text(badge['icon'] ?? '🏅', style: const TextStyle(fontSize: 28)),
                            const SizedBox(height: 6),
                            Text(name ?? '', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.textPrimary), textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis),
                          ]),
                        );
                      }).toList(),
                    ),
                  const SizedBox(height: 20),

                  // Leaderboard
                  Text(isAr ? 'المتصدرون' : 'Leaderboard', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                  const SizedBox(height: 12),
                  ..._leaderboard.take(10).toList().asMap().entries.map((entry) {
                    final idx = entry.key;
                    final e = entry.value;
                    final isMe = e['userId'] == myId;
                    final name = isAr ? (e['nameAr'] ?? e['name']) : e['name'];
                    final medals = ['🥇', '🥈', '🥉'];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: isMe ? AppColors.primary.withOpacity(0.06) : Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: isMe ? AppColors.primary.withOpacity(0.3) : AppColors.border),
                      ),
                      child: Row(children: [
                        SizedBox(
                          width: 32,
                          child: idx < 3
                              ? Text(medals[idx], style: const TextStyle(fontSize: 20))
                              : Text('${idx + 1}', style: const TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Row(children: [
                              Text(name ?? '', style: TextStyle(fontWeight: FontWeight.w600, color: isMe ? AppColors.primary : AppColors.textPrimary)),
                              if (isMe) ...[
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(4)),
                                  child: Text(isAr ? 'أنا' : 'You', style: const TextStyle(color: Colors.white, fontSize: 10)),
                                ),
                              ],
                            ]),
                            Text('${e['badgeCount'] ?? 0} ${isAr ? "شارة" : "badges"} · ${e['streak'] ?? 0} ${isAr ? "يوم" : "day streak"}',
                                style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                          ]),
                        ),
                        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                          Text('${e['totalPoints'] ?? 0}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.textPrimary)),
                          Text(isAr ? 'نقطة' : 'pts', style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                        ]),
                      ]),
                    );
                  }),
                ],
              ),
      ),
    );
  }

  Widget _stat(String label, String value, IconData icon, Color color) {
    return Column(children: [
      Icon(icon, color: color, size: 20),
      const SizedBox(height: 4),
      Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
      Text(label, style: const TextStyle(color: Colors.white60, fontSize: 11)),
    ]);
  }
}
