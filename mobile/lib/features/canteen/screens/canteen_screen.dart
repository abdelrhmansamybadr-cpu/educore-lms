import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';

class CanteenScreen extends StatefulWidget {
  const CanteenScreen({super.key});

  @override
  State<CanteenScreen> createState() => _CanteenScreenState();
}

class _CanteenScreenState extends State<CanteenScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _items = [];
  List<dynamic> _orders = [];
  final Map<String, int> _cart = {};
  bool _showCart = false;
  bool _placing = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final res = await ApiClient.instance.get(ApiEndpoints.canteenItems);
      final raw = res.data;
      final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
      final ordersRes = await ApiClient.instance.get(ApiEndpoints.myCanteenOrders).catchError((_) async => null);
      final ordersRaw = ordersRes.data;
      setState(() {
        _items = d is List ? List.from(d) : [];
        final od = ordersRaw is Map ? (ordersRaw['data'] ?? ordersRaw) : ordersRaw;
        _orders = od is List ? List.from(od) : [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  Future<void> _placeOrder(bool isAr) async {
    if (_cart.isEmpty) return;
    setState(() => _placing = true);
    try {
      final cartItems = _cart.entries.map((e) {
        final item = _items.firstWhere((i) => i['id'] == e.key, orElse: () => {});
        return {'itemId': e.key, 'quantity': e.value, 'unitPrice': item['price'] ?? 0};
      }).toList();
      final total = _cart.entries.fold(0.0, (sum, e) {
        final item = _items.firstWhere((i) => i['id'] == e.key, orElse: () => {});
        return sum + (item['price'] ?? 0) * e.value;
      });
      await ApiClient.instance.post(ApiEndpoints.canteenOrders, data: {'items': cartItems, 'total': total});
      setState(() { _cart.clear(); _showCart = false; _placing = false; });
      _loadData();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(isAr ? 'تم تقديم الطلب!' : 'Order placed!')));
      }
    } catch (e) {
      setState(() => _placing = false);
    }
  }

  int get _totalCartItems => _cart.values.fold(0, (s, q) => s + q);
  double get _totalCartPrice => _cart.entries.fold(0.0, (s, e) {
    final item = _items.firstWhere((i) => i['id'] == e.key, orElse: () => {});
    return s + (item['price'] ?? 0) * e.value;
  });

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isAr = auth.isAr;

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: Text(isAr ? 'الكافتيريا' : 'Canteen', style: const TextStyle(fontWeight: FontWeight.bold)),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.primary,
          elevation: 0,
          bottom: const PreferredSize(preferredSize: Size.fromHeight(1), child: Divider(height: 1, color: AppColors.border)),
          actions: [
            if (_totalCartItems > 0)
              Stack(children: [
                IconButton(icon: const Icon(Icons.shopping_cart_rounded), onPressed: () => setState(() => _showCart = !_showCart)),
                Positioned(right: 6, top: 6, child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(color: AppColors.error, shape: BoxShape.circle),
                  child: Text('$_totalCartItems', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                )),
              ]),
          ],
        ),
        body: _isLoading
            ? const Padding(padding: EdgeInsets.all(16), child: ListSkeletonLoader())
            : _error != null
                ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                    const Icon(Icons.error_outline, color: AppColors.error, size: 48),
                    const SizedBox(height: 12), Text(_error!),
                    const SizedBox(height: 12), ElevatedButton(onPressed: _loadData, child: Text(isAr ? 'إعادة' : 'Retry')),
                  ]))
                : _showCart
                    ? _buildCart(isAr)
                    : RefreshIndicator(
                        onRefresh: _loadData,
                        child: _items.isEmpty
                            ? Center(child: Text(isAr ? 'القائمة فارغة' : 'Menu is empty', style: const TextStyle(color: AppColors.textSecondary)))
                            : ListView.separated(
                                padding: const EdgeInsets.all(16),
                                itemCount: _items.length,
                                separatorBuilder: (_, __) => const SizedBox(height: 12),
                                itemBuilder: (_, i) => _buildItemCard(_items[i], isAr),
                              ),
                      ),
      ),
    );
  }

  Widget _buildItemCard(Map<String, dynamic> item, bool isAr) {
    final name = (isAr && item['nameAr'] != null) ? item['nameAr'] : item['name'];
    final qty = _cart[item['id']] ?? 0;
    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
      padding: const EdgeInsets.all(14),
      child: Row(children: [
        Container(
          width: 56, height: 56,
          decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
          child: const Icon(Icons.restaurant_rounded, color: AppColors.primary),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(name?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          Text(item['category'] ?? '', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
          Text('${item['price']} ${isAr ? 'ج.م' : 'EGP'}', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
        ])),
        Row(children: [
          if (qty > 0) ...[
            IconButton(icon: const Icon(Icons.remove_circle_outline, color: AppColors.error, size: 24),
              onPressed: () => setState(() { if (_cart[item['id']]! > 1) { _cart[item['id']] = _cart[item['id']]! - 1; } else { _cart.remove(item['id']); } })),
            Text('$qty', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ],
          IconButton(icon: const Icon(Icons.add_circle_rounded, color: AppColors.success, size: 24),
            onPressed: item['isAvailable'] == false ? null : () => setState(() => _cart[item['id']] = (_cart[item['id']] ?? 0) + 1)),
        ]),
      ]),
    );
  }

  Widget _buildCart(bool isAr) {
    final cartEntries = _cart.entries.where((e) => e.value > 0).toList();
    return Column(children: [
      Expanded(child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: cartEntries.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (_, i) {
          final e = cartEntries[i];
          final item = _items.firstWhere((it) => it['id'] == e.key, orElse: () => {});
          final name = (isAr && item['nameAr'] != null) ? item['nameAr'] : item['name'];
          return Container(
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(children: [
              Expanded(child: Text(name?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w600))),
              Text('×${e.value}  ${((item['price'] ?? 0) * e.value).toStringAsFixed(0)} EGP', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
            ]),
          );
        },
      )),
      Container(
        padding: const EdgeInsets.all(16),
        color: Colors.white,
        child: Column(children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text(isAr ? 'الإجمالي' : 'Total', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            Text('${_totalCartPrice.toStringAsFixed(0)} EGP', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primary)),
          ]),
          const SizedBox(height: 12),
          SizedBox(width: double.infinity, child: ElevatedButton(
            onPressed: _placing ? null : () => _placeOrder(isAr),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary, foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text(_placing ? (isAr ? 'جاري الطلب...' : 'Placing order...') : (isAr ? 'تأكيد الطلب' : 'Place Order')),
          )),
        ]),
      ),
    ]);
  }
}
