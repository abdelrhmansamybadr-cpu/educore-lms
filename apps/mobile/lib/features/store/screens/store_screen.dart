import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';

class StoreScreen extends StatefulWidget {
  const StoreScreen({super.key});

  @override
  State<StoreScreen> createState() => _StoreScreenState();
}

class _StoreScreenState extends State<StoreScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _items = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final res = await ApiClient.instance.get(ApiEndpoints.storeItems);
      final raw = res.data;
      final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
      setState(() {
        _items = d is List ? List.from(d) : [];
        _isLoading = false;
      });
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
    final auth = context.watch<AuthProvider>();
    final isAr = auth.isAr;

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: Text(isAr ? 'المستودع' : 'Store', style: const TextStyle(fontWeight: FontWeight.bold)),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.primary,
          elevation: 0,
          bottom: const PreferredSize(preferredSize: Size.fromHeight(1), child: Divider(height: 1, color: AppColors.border)),
        ),
        body: _isLoading
            ? const Padding(padding: EdgeInsets.all(16), child: ListSkeletonLoader())
            : _error != null
                ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                    const Icon(Icons.error_outline, color: AppColors.error, size: 48),
                    const SizedBox(height: 12), Text(_error!),
                    const SizedBox(height: 12), ElevatedButton(onPressed: _loadData, child: Text(isAr ? 'إعادة' : 'Retry')),
                  ]))
                : RefreshIndicator(
                    onRefresh: _loadData,
                    child: _items.isEmpty
                        ? ListView(children: [SizedBox(height: MediaQuery.of(context).size.height * 0.5,
                            child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                              const Icon(Icons.inventory_2_outlined, size: 64, color: AppColors.border),
                              const SizedBox(height: 16),
                              Text(isAr ? 'لا توجد منتجات' : 'No items in store', style: const TextStyle(color: AppColors.textSecondary)),
                            ])))])
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: _items.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (_, i) {
                              final item = _items[i];
                              final name = (isAr && item['nameAr'] != null) ? item['nameAr'] : item['name'];
                              final qty = (item['quantity'] ?? item['stock'] ?? 0) as int;
                              return Container(
                                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                                padding: const EdgeInsets.all(14),
                                child: Row(children: [
                                  Container(
                                    width: 56, height: 56,
                                    decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                                    child: const Icon(Icons.inventory_rounded, color: AppColors.primary),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                    Text(name?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                                    Text(item['category'] ?? '', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                                    Text('${item['price']} ${isAr ? 'ج.م' : 'EGP'}', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
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
                  ),
      ),
    );
  }
}
