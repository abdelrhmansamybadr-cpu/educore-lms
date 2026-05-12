import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';
import '../../../shared/widgets/empty_state_widget.dart';

class FeesScreen extends StatefulWidget {
  const FeesScreen({super.key});

  @override
  State<FeesScreen> createState() => _FeesScreenState();
}

class _FeesScreenState extends State<FeesScreen> {
  List<dynamic> _invoices = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final res = await ApiClient.instance.get(ApiEndpoints.myInvoices);
      final data = res.data;
      setState(() {
        _invoices = (data is Map ? data['data'] : data) ?? [];
        _loading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthProvider>();
    final isAr = auth.isAr;

    final totalDue = _invoices
        .where((inv) => inv['status'] == 'PENDING' || inv['status'] == 'OVERDUE')
        .fold<double>(0, (sum, inv) {
      final amount = inv['feeStructure']?['amount'];
      return sum + (amount != null ? (amount as num).toDouble() : 0);
    });

    final totalPaid = _invoices
        .where((inv) => inv['status'] == 'PAID')
        .fold<double>(0, (sum, inv) {
      final amount = inv['feeStructure']?['amount'];
      return sum + (amount != null ? (amount as num).toDouble() : 0);
    });

    final currency = _invoices.isNotEmpty
        ? (_invoices.first['feeStructure']?['currency'] ?? 'USD')
        : 'USD';

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: Text(isAr ? 'رسومي' : 'My Fees'),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.primary,
          elevation: 0,
          bottom: const PreferredSize(
            preferredSize: Size.fromHeight(1),
            child: Divider(height: 1, color: AppColors.border),
          ),
        ),
        body: RefreshIndicator(
          onRefresh: _load,
          child: _loading
              ? const Padding(
                  padding: EdgeInsets.all(16),
                  child: Column(children: [
                    SkeletonLoader(height: 140), SizedBox(height: 12),
                    SkeletonLoader(height: 100), SizedBox(height: 12),
                    SkeletonLoader(height: 100),
                  ]),
                )
              : _error != null
                  ? ListView(children: [
                      Padding(
                        padding: const EdgeInsets.all(32),
                        child: Center(
                          child: Text(_error!, style: const TextStyle(color: AppColors.error)),
                        ),
                      ),
                    ])
                  : _invoices.isEmpty
                      ? ListView(children: [
                          EmptyStateWidget(
                            emoji: '💰',
                            title: isAr ? 'لا توجد رسوم' : 'No Fees',
                            subtitle: isAr ? 'لا توجد فواتير متاحة حالياً' : 'No invoices available right now',
                          ),
                        ])
                      : ListView(
                          padding: const EdgeInsets.all(16),
                          children: [
                            // Summary card
                            Container(
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                gradient: AppColors.gradientPrimary,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    isAr ? 'ملخص الرسوم' : 'Fees Summary',
                                    style: const TextStyle(
                                      color: Colors.white70,
                                      fontSize: 13,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: _summaryItem(
                                          isAr ? 'المستحق' : 'Total Due',
                                          '$currency ${totalDue.toStringAsFixed(2)}',
                                          AppColors.accent,
                                        ),
                                      ),
                                      Container(width: 1, height: 50, color: Colors.white24),
                                      Expanded(
                                        child: _summaryItem(
                                          isAr ? 'المدفوع' : 'Total Paid',
                                          '$currency ${totalPaid.toStringAsFixed(2)}',
                                          AppColors.success,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 20),
                            Text(
                              isAr ? 'الفواتير' : 'Invoices',
                              style: const TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 12),
                            ..._invoices.map((inv) => _buildInvoiceCard(inv, isAr)),
                          ],
                        ),
        ),
      ),
    );
  }

  Widget _summaryItem(String label, String value, Color valueColor) {
    return Column(
      children: [
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12)),
        const SizedBox(height: 6),
        Text(
          value,
          style: TextStyle(
            color: valueColor,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildInvoiceCard(dynamic inv, bool isAr) {
    final feeStructure = inv['feeStructure'] ?? {};
    final name = isAr && feeStructure['nameAr'] != null
        ? feeStructure['nameAr']
        : feeStructure['name'] ?? '';
    final amount = (feeStructure['amount'] as num?)?.toDouble() ?? 0;
    final currency = feeStructure['currency'] ?? 'USD';
    final status = inv['status'] ?? 'PENDING';
    final dueDate = inv['dueDate'] != null ? DateTime.tryParse(inv['dueDate']) : null;
    final isPending = status == 'PENDING' || status == 'OVERDUE';

    Color statusColor;
    String statusLabel;
    switch (status) {
      case 'PAID':
        statusColor = AppColors.success;
        statusLabel = isAr ? 'مدفوع' : 'Paid';
        break;
      case 'OVERDUE':
        statusColor = AppColors.error;
        statusLabel = isAr ? 'متأخر' : 'Overdue';
        break;
      default:
        statusColor = AppColors.warning;
        statusLabel = isAr ? 'معلق' : 'Pending';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$currency ${amount.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
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
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: statusColor,
                  ),
                ),
              ),
            ],
          ),
          if (dueDate != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.calendar_today_outlined, size: 13, color: AppColors.textSecondary),
                const SizedBox(width: 5),
                Text(
                  '${isAr ? "تاريخ الاستحقاق" : "Due"}: ${_formatDate(dueDate)}',
                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                ),
              ],
            ),
          ],
          if (isPending) ...[
            const SizedBox(height: 8),
            Text(
              isAr ? 'ادفع في مكتب المدرسة' : 'Pay at school office',
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.textSecondary,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
