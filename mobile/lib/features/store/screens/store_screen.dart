import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';

// Roles that manage the store inventory and can approve/reject requests
const _storeAdminRoles = {
  'SCHOOL_ADMIN', 'STORE_MANAGER', 'IT_ADMIN', 'VICE_PRINCIPAL',
  'FINANCE_OFFICER', 'SUPER_ADMIN', 'DEVELOPER',
};

class StoreScreen extends StatefulWidget {
  const StoreScreen({super.key});

  @override
  State<StoreScreen> createState() => _StoreScreenState();
}

class _StoreScreenState extends State<StoreScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  String _userRole = '';

  @override
  void initState() {
    super.initState();
    final auth = context.read<AuthProvider>();
    final user = auth.user;
    _userRole = user is Map ? (user['role'] ?? '') : ((user as dynamic)?.role ?? '');
    _tabs = TabController(
      length: 3,
      vsync: this,
    );
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  bool get _isAdmin => _storeAdminRoles.contains(_userRole);

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isAr = auth.isAr;

    final employeeTabs = [
      Tab(text: isAr ? 'طلب جديد' : 'New Request'),
      Tab(text: isAr ? 'طلباتي' : 'My Requests'),
      Tab(text: isAr ? 'مقتنياتي' : 'My Collections'),
    ];
    final adminTabs = [
      Tab(text: isAr ? 'إدارة الطلبات' : 'Manage Requests'),
      Tab(text: isAr ? 'المخزون' : 'Inventory'),
      Tab(text: isAr ? 'طلباتي' : 'My Requests'),
    ];

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: Text(isAr ? 'المستودع' : 'Store', style: const TextStyle(fontWeight: FontWeight.bold)),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.primary,
          elevation: 0,
          bottom: TabBar(
            controller: _tabs,
            tabs: _isAdmin ? adminTabs : employeeTabs,
            labelColor: AppColors.primary,
            unselectedLabelColor: AppColors.textSecondary,
            indicatorColor: AppColors.primary,
            labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          ),
        ),
        body: TabBarView(
          controller: _tabs,
          children: _isAdmin
              ? [
                  _ManageRequestsTab(isAr: isAr),
                  _InventoryTab(isAr: isAr),
                  _MyRequestsTab(isAr: isAr),
                ]
              : [
                  _NewRequestTab(isAr: isAr),
                  _MyRequestsTab(isAr: isAr),
                  _MyCollectionsTab(isAr: isAr),
                ],
        ),
      ),
    );
  }
}

// ── New Request Tab ────────────────────────────────────────────────────────────

class _NewRequestTab extends StatefulWidget {
  final bool isAr;
  const _NewRequestTab({required this.isAr});
  @override
  State<_NewRequestTab> createState() => _NewRequestTabState();
}

class _NewRequestTabState extends State<_NewRequestTab> {
  final _formKey = GlobalKey<FormState>();
  final _itemNameCtrl = TextEditingController();
  final _reasonCtrl = TextEditingController();
  int _quantity = 1;
  bool _submitting = false;

  @override
  void dispose() {
    _itemNameCtrl.dispose();
    _reasonCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);
    try {
      await ApiClient.instance.post(ApiEndpoints.storeRequests, data: {
        'itemName': _itemNameCtrl.text.trim(),
        'quantity': _quantity,
        'reason': _reasonCtrl.text.trim().isEmpty ? null : _reasonCtrl.text.trim(),
      });
      _itemNameCtrl.clear();
      _reasonCtrl.clear();
      setState(() { _quantity = 1; _submitting = false; });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(widget.isAr ? 'تم إرسال الطلب' : 'Request submitted successfully'),
          backgroundColor: AppColors.success,
        ));
      }
    } catch (e) {
      setState(() => _submitting = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(widget.isAr ? 'فشل الإرسال' : 'Failed to submit request'),
          backgroundColor: AppColors.error,
        ));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isAr = widget.isAr;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Form(
        key: _formKey,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Header card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.primary.withOpacity(0.08), AppColors.primary.withOpacity(0.02)],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.primary.withOpacity(0.2)),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                const Icon(Icons.inventory_2_outlined, color: AppColors.primary, size: 20),
                const SizedBox(width: 8),
                Text(isAr ? 'طلب من المستودع' : 'Request from Store',
                    style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
              ]),
              const SizedBox(height: 6),
              Text(
                isAr
                    ? 'أرسل طلبك وسيقوم مدير المستودع بمراجعته والرد عليك'
                    : 'Submit your request and the store manager will review and respond',
                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
            ]),
          ),
          const SizedBox(height: 24),

          // Item name
          Text(isAr ? 'اسم الصنف *' : 'Item Name *',
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary)),
          const SizedBox(height: 8),
          TextFormField(
            controller: _itemNameCtrl,
            decoration: InputDecoration(
              hintText: isAr ? 'مثال: أقلام، ورق A4، كابل HDMI...' : 'e.g. Pens, A4 paper, HDMI cable...',
              filled: true, fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            ),
            validator: (v) => (v == null || v.trim().isEmpty) ? (isAr ? 'مطلوب' : 'Required') : null,
          ),
          const SizedBox(height: 20),

          // Quantity
          Text(isAr ? 'الكمية' : 'Quantity',
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary)),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
            child: Row(children: [
              IconButton(
                onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                icon: const Icon(Icons.remove_rounded),
                color: AppColors.primary,
              ),
              Expanded(child: Center(
                child: Text('$_quantity', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              )),
              IconButton(
                onPressed: () => setState(() => _quantity++),
                icon: const Icon(Icons.add_rounded),
                color: AppColors.primary,
              ),
            ]),
          ),
          const SizedBox(height: 20),

          // Reason
          Text(isAr ? 'سبب الطلب (اختياري)' : 'Reason (optional)',
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary)),
          const SizedBox(height: 8),
          TextFormField(
            controller: _reasonCtrl,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: isAr ? 'لماذا تحتاج هذا الصنف؟' : 'Why do you need this item?',
              filled: true, fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
              contentPadding: const EdgeInsets.all(16),
            ),
          ),
          const SizedBox(height: 32),

          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _submitting ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: _submitting
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
                  : Text(isAr ? 'إرسال الطلب' : 'Submit Request',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ),
          ),
        ]),
      ),
    );
  }
}

// ── My Requests Tab ────────────────────────────────────────────────────────────

class _MyRequestsTab extends StatefulWidget {
  final bool isAr;
  const _MyRequestsTab({required this.isAr});
  @override
  State<_MyRequestsTab> createState() => _MyRequestsTabState();
}

class _MyRequestsTabState extends State<_MyRequestsTab> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _requests = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final res = await ApiClient.instance.get('${ApiEndpoints.storeRequests}?mine=true');
      final raw = res.data;
      final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
      setState(() { _requests = d is List ? d : []; _isLoading = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'APPROVED': return AppColors.success;
      case 'REJECTED': return AppColors.error;
      case 'READY': return Colors.blue;
      case 'COLLECTED': return Colors.purple;
      case 'RETURNED': return Colors.grey;
      default: return Colors.orange;
    }
  }

  String _statusLabel(String status, bool isAr) {
    switch (status) {
      case 'PENDING': return isAr ? 'قيد المراجعة' : 'Pending Review';
      case 'APPROVED': return isAr ? 'موافق — توجه للمستودع' : 'Approved — Go collect';
      case 'REJECTED': return isAr ? 'مرفوض' : 'Rejected';
      case 'READY': return isAr ? 'جاهز للاستلام' : 'Ready for pickup';
      case 'COLLECTED': return isAr ? 'تم الاستلام' : 'Collected';
      case 'RETURNED': return isAr ? 'تم الإرجاع' : 'Returned';
      default: return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isAr = widget.isAr;
    if (_isLoading) return const Padding(padding: EdgeInsets.all(16), child: ListSkeletonLoader());
    if (_error != null) return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.error_outline, color: AppColors.error, size: 48),
      const SizedBox(height: 12), Text(_error!),
      const SizedBox(height: 12), ElevatedButton(onPressed: _load, child: Text(isAr ? 'إعادة' : 'Retry')),
    ]));
    if (_requests.isEmpty) return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.inbox_outlined, size: 64, color: AppColors.border),
      const SizedBox(height: 16),
      Text(isAr ? 'لا توجد طلبات' : 'No requests yet', style: const TextStyle(color: AppColors.textSecondary)),
    ]));

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _requests.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, i) {
          final r = _requests[i];
          final status = r['status'] ?? 'PENDING';
          final isLoan = r['isLoan'] == true;
          final loanDue = r['loanDueDate'] != null ? DateTime.tryParse(r['loanDueDate']) : null;
          final isOverdue = isLoan && loanDue != null && loanDue.isBefore(DateTime.now()) && status == 'COLLECTED';

          return Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isOverdue ? AppColors.error.withOpacity(0.5) : AppColors.border),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))],
            ),
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Container(
                  width: 42, height: 42,
                  decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                  child: const Icon(Icons.inventory_2_outlined, color: AppColors.primary, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(r['itemName'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.textPrimary)),
                  Text('${isAr ? 'الكمية' : 'Qty'}: ${r['quantity'] ?? 1}',
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                ])),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: _statusColor(status).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(_statusLabel(status, isAr),
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: _statusColor(status))),
                ),
              ]),
              if (isLoan) ...[
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: isOverdue ? AppColors.error.withOpacity(0.08) : Colors.orange.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(children: [
                    Icon(isOverdue ? Icons.warning_amber_rounded : Icons.loop_rounded,
                        size: 14, color: isOverdue ? AppColors.error : Colors.orange),
                    const SizedBox(width: 6),
                    Text(
                      isOverdue
                          ? (isAr ? 'متأخر الإرجاع!' : 'Overdue return!')
                          : '${isAr ? 'يُرجع قبل' : 'Return by'}: ${loanDue != null ? '${loanDue.day}/${loanDue.month}/${loanDue.year}' : '-'}',
                      style: TextStyle(
                          fontSize: 11, fontWeight: FontWeight.w600,
                          color: isOverdue ? AppColors.error : Colors.orange),
                    ),
                  ]),
                ),
              ],
              if (r['notes'] != null && r['notes'].toString().isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(r['notes'].toString(),
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontStyle: FontStyle.italic)),
              ],
            ]),
          );
        },
      ),
    );
  }
}

// ── My Collections Tab ─────────────────────────────────────────────────────────

class _MyCollectionsTab extends StatefulWidget {
  final bool isAr;
  const _MyCollectionsTab({required this.isAr});
  @override
  State<_MyCollectionsTab> createState() => _MyCollectionsTabState();
}

class _MyCollectionsTabState extends State<_MyCollectionsTab> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _collections = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final res = await ApiClient.instance.get(ApiEndpoints.storeMyCollections);
      final raw = res.data;
      final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
      setState(() { _collections = d is List ? d : []; _isLoading = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isAr = widget.isAr;
    if (_isLoading) return const Padding(padding: EdgeInsets.all(16), child: ListSkeletonLoader());
    if (_error != null) return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.error_outline, color: AppColors.error, size: 48),
      const SizedBox(height: 12), Text(_error!),
      ElevatedButton(onPressed: _load, child: Text(isAr ? 'إعادة' : 'Retry')),
    ]));
    if (_collections.isEmpty) return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.history_outlined, size: 64, color: AppColors.border),
      const SizedBox(height: 16),
      Text(isAr ? 'لا توجد مقتنيات' : 'No collections yet', style: const TextStyle(color: AppColors.textSecondary)),
    ]));

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _collections.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, i) {
          final c = _collections[i];
          final isLoan = c['isLoan'] == true;
          final returned = c['returnedAt'] != null;
          final loanDue = c['loanDueDate'] != null ? DateTime.tryParse(c['loanDueDate']) : null;

          return Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            padding: const EdgeInsets.all(14),
            child: Row(children: [
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(
                  color: (isLoan ? Colors.orange : AppColors.success).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  isLoan ? Icons.loop_rounded : Icons.check_circle_outline_rounded,
                  color: isLoan ? Colors.orange : AppColors.success, size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(c['itemName'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                Text('${isAr ? 'الكمية' : 'Qty'}: ${c['quantity'] ?? 1}',
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                if (isLoan && loanDue != null)
                  Text(
                    returned
                        ? (isAr ? 'تم الإرجاع' : 'Returned')
                        : '${isAr ? 'يُرجع' : 'Due'}: ${loanDue.day}/${loanDue.month}/${loanDue.year}',
                    style: TextStyle(fontSize: 11, color: returned ? AppColors.success : Colors.orange, fontWeight: FontWeight.w500),
                  ),
              ])),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: (isLoan && !returned ? Colors.orange : AppColors.success).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  isLoan ? (returned ? (isAr ? 'مُرجع' : 'Returned') : (isAr ? 'عارية' : 'On loan')) : (isAr ? 'مُستلم' : 'Collected'),
                  style: TextStyle(
                      fontSize: 10, fontWeight: FontWeight.bold,
                      color: isLoan && !returned ? Colors.orange : AppColors.success),
                ),
              ),
            ]),
          );
        },
      ),
    );
  }
}

// ── Manage Requests Tab (Admin/Store Manager) ──────────────────────────────────

class _ManageRequestsTab extends StatefulWidget {
  final bool isAr;
  const _ManageRequestsTab({required this.isAr});
  @override
  State<_ManageRequestsTab> createState() => _ManageRequestsTabState();
}

class _ManageRequestsTabState extends State<_ManageRequestsTab> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _requests = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final res = await ApiClient.instance.get(ApiEndpoints.storeRequests);
      final raw = res.data;
      final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
      setState(() { _requests = d is List ? d : []; _isLoading = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  Future<void> _approve(String id, {String? notes, bool isLoan = false, String? loanDueDate}) async {
    await ApiClient.instance.patch(
      '${ApiEndpoints.storeRequests}/$id/approve',
      data: {'notes': notes, 'isLoan': isLoan, 'loanDueDate': loanDueDate},
    );
    _load();
  }

  Future<void> _reject(String id, String notes) async {
    await ApiClient.instance.patch('${ApiEndpoints.storeRequests}/$id/reject', data: {'notes': notes});
    _load();
  }

  Future<void> _markReady(String id) async {
    await ApiClient.instance.patch('${ApiEndpoints.storeRequests}/$id/ready', data: {});
    _load();
  }

  Future<void> _markCollected(String id) async {
    await ApiClient.instance.patch('${ApiEndpoints.storeRequests}/$id/collect', data: {});
    _load();
  }

  Future<void> _markReturned(String id) async {
    await ApiClient.instance.patch('${ApiEndpoints.storeRequests}/$id/return', data: {});
    _load();
  }

  void _showApproveDialog(String id) {
    final isAr = widget.isAr;
    bool isLoan = false;
    DateTime? dueDate;
    final notesCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(builder: (ctx, setSt) => AlertDialog(
        title: Text(isAr ? 'الموافقة على الطلب' : 'Approve Request'),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          TextField(controller: notesCtrl,
              decoration: InputDecoration(labelText: isAr ? 'ملاحظات' : 'Notes', hintText: isAr ? 'اختياري' : 'Optional')),
          const SizedBox(height: 12),
          Row(children: [
            Text(isAr ? 'عارية (يُرجع)' : 'Loan item'),
            const Spacer(),
            Switch(value: isLoan, onChanged: (v) => setSt(() => isLoan = v)),
          ]),
          if (isLoan) ...[
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () async {
                final d = await showDatePicker(context: ctx, initialDate: DateTime.now().add(const Duration(days: 7)),
                    firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 365)));
                if (d != null) setSt(() => dueDate = d);
              },
              icon: const Icon(Icons.calendar_today, size: 16),
              label: Text(dueDate != null
                  ? '${dueDate!.day}/${dueDate!.month}/${dueDate!.year}'
                  : (isAr ? 'تاريخ الإرجاع' : 'Return date')),
            ),
          ],
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(isAr ? 'إلغاء' : 'Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              _approve(id, notes: notesCtrl.text, isLoan: isLoan,
                  loanDueDate: dueDate?.toIso8601String());
            },
            child: Text(isAr ? 'موافقة' : 'Approve'),
          ),
        ],
      )),
    );
  }

  void _showRejectDialog(String id) {
    final isAr = widget.isAr;
    final ctrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(isAr ? 'رفض الطلب' : 'Reject Request'),
        content: TextField(controller: ctrl,
            decoration: InputDecoration(labelText: isAr ? 'سبب الرفض' : 'Rejection reason'),
            maxLines: 2),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(isAr ? 'إلغاء' : 'Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () { Navigator.pop(ctx); _reject(id, ctrl.text); },
            child: Text(isAr ? 'رفض' : 'Reject', style: const TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isAr = widget.isAr;
    if (_isLoading) return const Padding(padding: EdgeInsets.all(16), child: ListSkeletonLoader());
    if (_error != null) return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.error_outline, color: AppColors.error, size: 48),
      const SizedBox(height: 12), Text(_error!),
      ElevatedButton(onPressed: _load, child: Text(isAr ? 'إعادة' : 'Retry')),
    ]));
    if (_requests.isEmpty) return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.inbox_outlined, size: 64, color: AppColors.border),
      const SizedBox(height: 16),
      Text(isAr ? 'لا توجد طلبات' : 'No requests', style: const TextStyle(color: AppColors.textSecondary)),
    ]));

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _requests.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, i) {
          final r = _requests[i];
          final status = r['status'] ?? 'PENDING';
          final isLoan = r['isLoan'] == true;
          final requesterName = r['user']?['profile'] != null
              ? '${r['user']['profile']['firstName'] ?? ''} ${r['user']['profile']['lastName'] ?? ''}'.trim()
              : r['user']?['email'] ?? '';

          return Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))],
            ),
            padding: const EdgeInsets.all(14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                  child: const Icon(Icons.inventory_2_outlined, color: AppColors.primary, size: 20),
                ),
                const SizedBox(width: 10),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(r['itemName'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary)),
                  Text('$requesterName · ${isAr ? 'كمية' : 'Qty'}: ${r['quantity'] ?? 1}',
                      style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                ])),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _statusColor(status).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(status, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: _statusColor(status))),
                ),
              ]),
              if (isLoan) Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Row(children: [
                  const Icon(Icons.loop_rounded, size: 13, color: Colors.orange),
                  const SizedBox(width: 4),
                  Text(isAr ? 'صنف عارية' : 'Loan item',
                      style: const TextStyle(fontSize: 11, color: Colors.orange, fontWeight: FontWeight.w500)),
                ]),
              ),
              const SizedBox(height: 10),
              // Action buttons
              Wrap(spacing: 8, runSpacing: 6, children: [
                if (status == 'PENDING') ...[
                  _ActionBtn(label: isAr ? 'موافقة' : 'Approve', color: AppColors.success, onTap: () => _showApproveDialog(r['id'])),
                  _ActionBtn(label: isAr ? 'رفض' : 'Reject', color: AppColors.error, onTap: () => _showRejectDialog(r['id'])),
                ],
                if (status == 'APPROVED')
                  _ActionBtn(label: isAr ? 'جاهز للاستلام' : 'Mark Ready', color: Colors.blue, onTap: () => _markReady(r['id'])),
                if (status == 'READY')
                  _ActionBtn(label: isAr ? 'تم الاستلام' : 'Mark Collected', color: Colors.purple, onTap: () => _markCollected(r['id'])),
                if (status == 'COLLECTED' && isLoan)
                  _ActionBtn(label: isAr ? 'تم الإرجاع' : 'Mark Returned', color: Colors.grey, onTap: () => _markReturned(r['id'])),
              ]),
            ]),
          );
        },
      ),
    );
  }

  Color _statusColor(String s) {
    switch (s) {
      case 'APPROVED': return AppColors.success;
      case 'REJECTED': return AppColors.error;
      case 'READY': return Colors.blue;
      case 'COLLECTED': return Colors.purple;
      case 'RETURNED': return Colors.grey;
      default: return Colors.orange;
    }
  }
}

class _ActionBtn extends StatelessWidget {
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _ActionBtn({required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(8),
            border: Border.all(color: color.withOpacity(0.3))),
        child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
      ),
    );
  }
}

// ── Inventory Tab (Admin) ──────────────────────────────────────────────────────

class _InventoryTab extends StatefulWidget {
  final bool isAr;
  const _InventoryTab({required this.isAr});
  @override
  State<_InventoryTab> createState() => _InventoryTabState();
}

class _InventoryTabState extends State<_InventoryTab> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _items = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final res = await ApiClient.instance.get(ApiEndpoints.storeItems);
      final raw = res.data;
      final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
      setState(() { _items = d is List ? d : []; _isLoading = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  Color _stockColor(int qty) {
    if (qty <= 0) return AppColors.error;
    if (qty <= 5) return AppColors.warning;
    return AppColors.success;
  }

  @override
  Widget build(BuildContext context) {
    final isAr = widget.isAr;
    if (_isLoading) return const Padding(padding: EdgeInsets.all(16), child: ListSkeletonLoader());
    if (_error != null) return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.error_outline, color: AppColors.error, size: 48),
      const SizedBox(height: 12), Text(_error!),
      ElevatedButton(onPressed: _load, child: Text(isAr ? 'إعادة' : 'Retry')),
    ]));
    if (_items.isEmpty) return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.inventory_2_outlined, size: 64, color: AppColors.border),
      const SizedBox(height: 16),
      Text(isAr ? 'لا يوجد مخزون' : 'No inventory items', style: const TextStyle(color: AppColors.textSecondary)),
    ]));

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (_, i) {
          final item = _items[i];
          final name = (isAr && item['nameAr'] != null) ? item['nameAr'] : item['name'];
          final qty = (item['quantity'] ?? 0) as int;
          return Container(
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
            padding: const EdgeInsets.all(14),
            child: Row(children: [
              Container(
                width: 52, height: 52,
                decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.inventory_rounded, color: AppColors.primary),
              ),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(name?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                Text(item['category'] ?? '', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
              ])),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(color: _stockColor(qty).withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                child: Column(children: [
                  Text('$qty', style: TextStyle(fontWeight: FontWeight.bold, color: _stockColor(qty), fontSize: 16)),
                  Text(isAr ? 'متاح' : 'in stock', style: TextStyle(fontSize: 10, color: _stockColor(qty))),
                ]),
              ),
            ]),
          );
        },
      ),
    );
  }
}
