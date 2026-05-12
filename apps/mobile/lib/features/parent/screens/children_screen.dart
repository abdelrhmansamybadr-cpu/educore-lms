import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/utils/helpers.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';

class ChildrenScreen extends StatefulWidget {
  const ChildrenScreen({super.key});

  @override
  State<ChildrenScreen> createState() => _ChildrenScreenState();
}

class _ChildrenScreenState extends State<ChildrenScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _children = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final res = await ApiClient.instance.get(ApiEndpoints.myChildren);
      final raw = res.data;
      final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
      setState(() {
        _children = d is List ? List<dynamic>.from(d) : <dynamic>[];
        _isLoading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  String _getChildClass(Map<String, dynamic> child) {
    final enrollments = child['enrollments'] as List?;
    if (enrollments != null && enrollments.isNotEmpty) {
      final cls = enrollments.first['class'] as Map?;
      return cls?['name']?.toString() ?? '';
    }
    return child['grade']?.toString() ?? child['class']?.toString() ?? '';
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
            isAr ? 'أبنائي' : 'My Children',
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
        body: _isLoading
            ? const Padding(padding: EdgeInsets.all(16), child: ListSkeletonLoader())
            : _error != null
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.error_outline, color: AppColors.error, size: 48),
                        const SizedBox(height: 12),
                        Text(_error!),
                        const SizedBox(height: 12),
                        ElevatedButton(onPressed: _loadData, child: Text(isAr ? 'إعادة' : 'Retry')),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _loadData,
                    child: _children.isEmpty
                        ? ListView(
                            children: [
                              SizedBox(
                                height: MediaQuery.of(context).size.height * 0.6,
                                child: Center(
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.child_care_rounded, size: 64, color: AppColors.border),
                                      const SizedBox(height: 16),
                                      Text(
                                        isAr ? 'لا يوجد أبناء مرتبطون بحسابك' : 'No children linked to your account',
                                        style: const TextStyle(color: AppColors.textSecondary),
                                        textAlign: TextAlign.center,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: _children.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (_, i) => _buildChildCard(_children[i], isAr),
                          ),
                  ),
      ),
    );
  }

  Widget _buildChildCard(Map<String, dynamic> child, bool isAr) {
    final profile = (child['profile'] as Map?) ?? child;
    final first = profile['firstName']?.toString() ?? child['firstName']?.toString() ?? '';
    final last = profile['lastName']?.toString() ?? child['lastName']?.toString() ?? '';
    final name = '$first $last'.trim();
    final childId = child['id']?.toString() ?? '';
    final className = _getChildClass(child);
    final studentId = profile['studentId']?.toString() ?? '';

    return GestureDetector(
      onTap: () => context.push('/parent/children/$childId?name=${Uri.encodeComponent(name)}'),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 28,
              backgroundColor: AppColors.primary.withOpacity(0.1),
              child: Text(
                Helpers.getInitials(first, last),
                style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
            ),
            const SizedBox(width: 16),
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
                  if (className.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.class_rounded, size: 14, color: AppColors.textSecondary),
                        const SizedBox(width: 4),
                        Text(
                          className,
                          style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ],
                  if (studentId.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        const Icon(Icons.badge_rounded, size: 14, color: AppColors.textSecondary),
                        const SizedBox(width: 4),
                        Text(
                          'ID: $studentId',
                          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: AppColors.textSecondary),
          ],
        ),
      ),
    );
  }
}
