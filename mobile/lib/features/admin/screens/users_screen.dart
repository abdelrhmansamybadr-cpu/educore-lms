import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/utils/helpers.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';

class UsersScreen extends StatefulWidget {
  const UsersScreen({super.key});

  @override
  State<UsersScreen> createState() => _UsersScreenState();
}

class _UsersScreenState extends State<UsersScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _users = [];
  String _searchQuery = '';
  String _roleFilter = 'ALL';
  final TextEditingController _searchCtrl = TextEditingController();

  static const _roles = ['ALL', 'STUDENT', 'TEACHER', 'PARENT', 'SCHOOL_ADMIN'];

  @override
  void initState() {
    super.initState();
    _loadUsers();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadUsers() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final params = <String, dynamic>{};
      if (_roleFilter != 'ALL') params['role'] = _roleFilter;
      if (_searchQuery.isNotEmpty) params['search'] = _searchQuery;

      final res = await ApiClient.instance.get(ApiEndpoints.users, queryParameters: params);
      final raw = res.data;
      final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
      setState(() {
        _users = d is List ? List<dynamic>.from(d) : <dynamic>[];
        _isLoading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  Future<void> _toggleUserActive(Map<String, dynamic> user, bool isAr) async {
    final userId = user['id']?.toString() ?? '';
    final isActive = user['isActive'] as bool? ?? true;
    try {
      await ApiClient.instance.patch(
        ApiEndpoints.userById(userId),
        data: {'isActive': !isActive},
      );
      _loadUsers();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(!isActive
              ? (isAr ? 'تم تفعيل المستخدم' : 'User activated')
              : (isAr ? 'تم تعطيل المستخدم' : 'User deactivated')),
          backgroundColor: !isActive ? AppColors.success : AppColors.warning,
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

  void _showUserDetail(Map<String, dynamic> user, bool isAr) {
    final profile = (user['profile'] as Map?) ?? {};
    final first = profile['firstName']?.toString() ?? user['firstName']?.toString() ?? '';
    final last = profile['lastName']?.toString() ?? user['lastName']?.toString() ?? '';
    final name = '$first $last'.trim();
    final email = user['email']?.toString() ?? '';
    final role = user['role']?.toString() ?? '';
    final isActive = user['isActive'] as bool? ?? true;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircleAvatar(
                radius: 36,
                backgroundColor: AppColors.primary.withOpacity(0.1),
                child: Text(
                  Helpers.getInitials(first, last),
                  style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 22),
                ),
              ),
              const SizedBox(height: 12),
              Text(name.isNotEmpty ? name : email,
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
              const SizedBox(height: 4),
              Text(email, style: const TextStyle(color: AppColors.textSecondary)),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _roleBadge(role),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: isActive ? AppColors.success.withOpacity(0.1) : AppColors.error.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'معطل' : 'Inactive'),
                      style: TextStyle(
                        fontSize: 12,
                        color: isActive ? AppColors.success : AppColors.error,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pop(ctx);
                    _toggleUserActive(user, isAr);
                  },
                  icon: Icon(isActive ? Icons.block_rounded : Icons.check_circle_rounded),
                  label: Text(isActive
                      ? (isAr ? 'تعطيل الحساب' : 'Deactivate Account')
                      : (isAr ? 'تفعيل الحساب' : 'Activate Account')),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isActive ? AppColors.error : AppColors.success,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _roleBadge(String role) {
    Color color;
    switch (role.toUpperCase()) {
      case 'STUDENT': color = AppColors.primary; break;
      case 'TEACHER': case 'SUB_TEACHER': color = AppColors.info; break;
      case 'PARENT': color = AppColors.success; break;
      default: color = AppColors.warning;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        role,
        style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w600),
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
          title: Text(isAr ? 'إدارة المستخدمين' : 'User Management',
              style: const TextStyle(fontWeight: FontWeight.bold)),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.primary,
          elevation: 0,
          bottom: const PreferredSize(
            preferredSize: Size.fromHeight(1),
            child: Divider(height: 1, color: AppColors.border),
          ),
        ),
        body: Column(
          children: [
            // Search bar
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: TextField(
                controller: _searchCtrl,
                onChanged: (v) {
                  _searchQuery = v;
                  _loadUsers();
                },
                decoration: InputDecoration(
                  hintText: isAr ? 'بحث عن مستخدم...' : 'Search users...',
                  hintStyle: const TextStyle(color: AppColors.textSecondary),
                  prefixIcon: const Icon(Icons.search_rounded, color: AppColors.textSecondary),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear_rounded, color: AppColors.textSecondary),
                          onPressed: () {
                            _searchCtrl.clear();
                            _searchQuery = '';
                            _loadUsers();
                          },
                        )
                      : null,
                  filled: true,
                  fillColor: AppColors.background,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
            // Role filter chips
            Container(
              color: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _roles.map((r) {
                    final selected = _roleFilter == r;
                    final label = r == 'ALL' ? (isAr ? 'الكل' : 'All') : r;
                    return GestureDetector(
                      onTap: () {
                        setState(() => _roleFilter = r);
                        _loadUsers();
                      },
                      child: Container(
                        margin: const EdgeInsets.only(right: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                        decoration: BoxDecoration(
                          color: selected ? AppColors.primary : AppColors.background,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: selected ? AppColors.primary : AppColors.border),
                        ),
                        child: Text(
                          label,
                          style: TextStyle(
                            color: selected ? Colors.white : AppColors.textSecondary,
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
            const Divider(height: 1, color: AppColors.border),
            // User list
            Expanded(
              child: _isLoading
                  ? const Padding(padding: EdgeInsets.all(16), child: ListSkeletonLoader())
                  : _error != null
                      ? Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(_error!),
                              const SizedBox(height: 12),
                              ElevatedButton(onPressed: _loadUsers, child: Text(isAr ? 'إعادة' : 'Retry')),
                            ],
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _loadUsers,
                          child: _users.isEmpty
                              ? ListView(
                                  children: [
                                    SizedBox(
                                      height: MediaQuery.of(context).size.height * 0.5,
                                      child: Center(
                                        child: Text(
                                          isAr ? 'لا يوجد مستخدمون' : 'No users found',
                                          style: const TextStyle(color: AppColors.textSecondary),
                                        ),
                                      ),
                                    ),
                                  ],
                                )
                              : ListView.separated(
                                  padding: const EdgeInsets.all(16),
                                  itemCount: _users.length,
                                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                                  itemBuilder: (_, i) {
                                    final u = _users[i];
                                    final profile = (u['profile'] as Map?) ?? {};
                                    final first = profile['firstName']?.toString() ?? u['firstName']?.toString() ?? '';
                                    final last = profile['lastName']?.toString() ?? u['lastName']?.toString() ?? '';
                                    final name = '$first $last'.trim();
                                    final email = u['email']?.toString() ?? '';
                                    final role = u['role']?.toString() ?? '';
                                    final isActive = u['isActive'] as bool? ?? true;

                                    return GestureDetector(
                                      onTap: () => _showUserDetail(u, isAr),
                                      child: Container(
                                        padding: const EdgeInsets.all(14),
                                        decoration: BoxDecoration(
                                          color: Colors.white,
                                          borderRadius: BorderRadius.circular(14),
                                          border: Border.all(color: AppColors.border),
                                        ),
                                        child: Row(
                                          children: [
                                            Stack(
                                              children: [
                                                CircleAvatar(
                                                  radius: 22,
                                                  backgroundColor: AppColors.primary.withOpacity(0.1),
                                                  child: Text(
                                                    Helpers.getInitials(first, last),
                                                    style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                                                  ),
                                                ),
                                                if (!isActive)
                                                  Positioned(
                                                    right: 0,
                                                    bottom: 0,
                                                    child: Container(
                                                      width: 12,
                                                      height: 12,
                                                      decoration: BoxDecoration(
                                                        color: AppColors.error,
                                                        shape: BoxShape.circle,
                                                        border: Border.all(color: Colors.white, width: 1.5),
                                                      ),
                                                    ),
                                                  ),
                                              ],
                                            ),
                                            const SizedBox(width: 12),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    name.isNotEmpty ? name : email,
                                                    style: const TextStyle(
                                                      fontWeight: FontWeight.w600,
                                                      color: AppColors.textPrimary,
                                                    ),
                                                  ),
                                                  Text(
                                                    email,
                                                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                                  ),
                                                ],
                                              ),
                                            ),
                                            _roleBadge(role),
                                          ],
                                        ),
                                      ),
                                    );
                                  },
                                ),
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
