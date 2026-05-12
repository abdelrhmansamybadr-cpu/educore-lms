import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/utils/helpers.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';

class InboxScreen extends StatefulWidget {
  const InboxScreen({super.key});

  @override
  State<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends State<InboxScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _conversations = [];

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
      final res = await ApiClient.instance.get(ApiEndpoints.inbox);
      final raw = res.data;
      final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
      setState(() {
        _conversations = d is List ? List<dynamic>.from(d) : <dynamic>[];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  String _getOtherUserName(Map<String, dynamic> conv, String myId) {
    final participants = conv['participants'] as List? ?? [];
    for (final p in participants) {
      final uid = p['userId']?.toString() ?? '';
      if (uid != myId) {
        final user = p['user'] as Map?;
        final profile = user?['profile'] as Map?;
        final first = profile?['firstName'] ?? '';
        final last = profile?['lastName'] ?? '';
        if (first.isNotEmpty || last.isNotEmpty) return '$first $last'.trim();
        return user?['email'] ?? 'User';
      }
    }
    return 'Unknown';
  }

  String _getLastMessage(Map<String, dynamic> conv) {
    final messages = conv['messages'] as List?;
    if (messages != null && messages.isNotEmpty) {
      return messages.last['content']?.toString() ?? '';
    }
    return '';
  }

  String _getLastTime(Map<String, dynamic> conv) {
    final messages = conv['messages'] as List?;
    if (messages != null && messages.isNotEmpty) {
      final raw = messages.last['createdAt']?.toString();
      if (raw != null) {
        final dt = DateTime.tryParse(raw);
        if (dt != null) return Helpers.formatDate(dt, format: 'MMM dd');
      }
    }
    return '';
  }

  void _showNewConversationSheet(bool isAr) {
    final searchCtrl = TextEditingController();
    List<dynamic> results = [];
    bool searching = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(builder: (ctx, setSheet) {
          Future<void> search(String q) async {
            if (q.trim().isEmpty) {
              setSheet(() => results = []);
              return;
            }
            setSheet(() => searching = true);
            try {
              final res = await ApiClient.instance.get(
                ApiEndpoints.schoolUsers,
                queryParameters: {'search': q},
              );
              final raw = res.data;
              final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
              setSheet(() {
                results = d is List ? List<dynamic>.from(d) : <dynamic>[];
                searching = false;
              });
            } catch (_) {
              setSheet(() => searching = false);
            }
          }

          Future<void> startConversation(String otherUserId, String name) async {
            Navigator.pop(ctx);
            try {
              final res = await ApiClient.instance.post(
                ApiEndpoints.startConversation,
                data: {'otherUserId': otherUserId},
              );
              final raw = res.data;
              final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
              final convId = (d is Map ? d['id'] : null)?.toString() ?? '';
              if (convId.isNotEmpty && mounted) {
                final role = (context.read<AuthProvider>().user?.role ?? 'student').toLowerCase();
                context.push('/$role/messages/$convId?name=${Uri.encodeComponent(name)}');
              }
              _loadData();
            } catch (_) {}
          }

          return Padding(
            padding: EdgeInsets.only(
              left: 16, right: 16, top: 20,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isAr ? 'رسالة جديدة' : 'New Message',
                  style: const TextStyle(
                    fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: searchCtrl,
                  autofocus: true,
                  onChanged: search,
                  decoration: InputDecoration(
                    hintText: isAr ? 'ابحث عن مستخدم...' : 'Search by name or email...',
                    hintStyle: const TextStyle(color: AppColors.textSecondary),
                    prefixIcon: const Icon(Icons.search, color: AppColors.textSecondary),
                    filled: true,
                    fillColor: AppColors.background,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                if (searching)
                  const Center(child: Padding(
                    padding: EdgeInsets.all(16),
                    child: CircularProgressIndicator(color: AppColors.primary),
                  ))
                else if (results.isEmpty && searchCtrl.text.isNotEmpty)
                  Center(child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      isAr ? 'لا نتائج' : 'No results found',
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                  ))
                else
                  ...results.take(8).map((u) {
                    final profile = (u['profile'] as Map?) ?? {};
                    final first = profile['firstName']?.toString() ?? '';
                    final last = profile['lastName']?.toString() ?? '';
                    final name = '$first $last'.trim().isNotEmpty ? '$first $last'.trim() : u['email']?.toString() ?? '';
                    final initials = Helpers.getInitials(first, last);
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: AppColors.primary.withOpacity(0.1),
                        child: Text(initials, style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                      ),
                      title: Text(name, style: const TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: Text(u['email']?.toString() ?? '', style: const TextStyle(fontSize: 12)),
                      onTap: () => startConversation(u['id']?.toString() ?? '', name),
                    );
                  }),
              ],
            ),
          );
        });
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isAr = auth.isAr;
    final myId = auth.user?.id.toString() ?? '';
    final role = (auth.user?.role ?? 'student').toLowerCase();

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: Text(
            isAr ? 'الرسائل' : 'Messages',
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
        floatingActionButton: FloatingActionButton(
          onPressed: () => _showNewConversationSheet(isAr),
          backgroundColor: AppColors.primary,
          child: const Icon(Icons.edit_rounded, color: Colors.white),
        ),
        body: _isLoading
            ? const Padding(padding: EdgeInsets.all(16), child: ListSkeletonLoader())
            : _error != null
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_error!, style: const TextStyle(color: AppColors.error)),
                        const SizedBox(height: 12),
                        ElevatedButton(onPressed: _loadData, child: Text(isAr ? 'إعادة' : 'Retry')),
                      ],
                    ),
                  )
                : _conversations.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.chat_bubble_outline_rounded, size: 64, color: AppColors.border),
                            const SizedBox(height: 16),
                            Text(
                              isAr ? 'لا توجد رسائل' : 'No conversations yet',
                              style: const TextStyle(fontSize: 16, color: AppColors.textSecondary),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              isAr ? 'ابدأ محادثة جديدة' : 'Start a new conversation',
                              style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadData,
                        child: ListView.separated(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          itemCount: _conversations.length,
                          separatorBuilder: (_, __) => const Divider(height: 1, indent: 72, color: AppColors.border),
                          itemBuilder: (_, i) {
                            final conv = _conversations[i] as Map<String, dynamic>;
                            final name = _getOtherUserName(conv, myId);
                            final lastMsg = _getLastMessage(conv);
                            final lastTime = _getLastTime(conv);
                            final convId = conv['id']?.toString() ?? '';
                            final initials = name.split(' ').where((s) => s.isNotEmpty).take(2).map((s) => s[0].toUpperCase()).join();

                            return ListTile(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                              leading: CircleAvatar(
                                radius: 24,
                                backgroundColor: AppColors.primary.withOpacity(0.1),
                                child: Text(
                                  initials.isEmpty ? '?' : initials,
                                  style: const TextStyle(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                              ),
                              title: Text(
                                name,
                                style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                              ),
                              subtitle: Text(
                                lastMsg,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                              ),
                              trailing: Text(
                                lastTime,
                                style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
                              ),
                              onTap: () => context.push(
                                '/$role/messages/$convId?name=${Uri.encodeComponent(name)}',
                              ),
                            );
                          },
                        ),
                      ),
      ),
    );
  }
}
