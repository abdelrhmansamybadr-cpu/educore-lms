import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';
import '../../../shared/widgets/empty_state_widget.dart';

class TransportScreen extends StatefulWidget {
  const TransportScreen({super.key});

  @override
  State<TransportScreen> createState() => _TransportScreenState();
}

class _TransportScreenState extends State<TransportScreen> {
  List<dynamic> _routes = [];
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
      final res = await ApiClient.instance.get(ApiEndpoints.myBusRoute);
      final data = res.data;
      final payload = data is Map ? data['data'] : data;
      // my-route returns a single object {route, stopId} or null
      setState(() {
        if (payload == null) {
          _routes = [];
        } else if (payload is Map && payload['route'] != null) {
          _routes = [payload];
        } else if (payload is List) {
          _routes = payload;
        } else {
          _routes = [];
        }
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

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: Text(isAr ? 'حافلتي' : 'My Bus'),
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
                    SkeletonLoader(height: 200), SizedBox(height: 12),
                    SkeletonLoader(height: 200),
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
                  : _routes.isEmpty
                      ? ListView(children: [
                          EmptyStateWidget(
                            emoji: '🚌',
                            title: isAr ? 'لا توجد مسارات حافلة' : 'No Bus Routes',
                            subtitle: isAr
                                ? 'لا توجد مسارات حافلة مُعدَّة'
                                : 'No bus routes configured',
                          ),
                        ])
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _routes.length,
                          itemBuilder: (ctx, i) => _buildRouteCard(_routes[i], isAr),
                        ),
        ),
      ),
    );
  }

  Widget _buildRouteCard(dynamic route, bool isAr) {
    final name = route['name'] ?? route['routeName'] ?? (isAr ? 'مسار' : 'Route');
    final busNumber = route['busNumber'] ?? route['vehicleNumber'];
    final driverName = route['driverName'] ?? (route['driver'] is Map
        ? '${route['driver']['firstName'] ?? ''} ${route['driver']['lastName'] ?? ''}'.trim()
        : null);
    final stops = (route['stops'] as List?) ?? [];

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              gradient: AppColors.gradientPrimary,
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.directions_bus_rounded, color: Colors.white, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (busNumber != null)
                        Text(
                          '${isAr ? "رقم الحافلة" : "Bus"}: $busNumber',
                          style: const TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          // Driver info
          if (driverName != null && driverName.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Row(
                children: [
                  const Icon(Icons.person_outline_rounded, size: 16, color: AppColors.textSecondary),
                  const SizedBox(width: 8),
                  Text(
                    '${isAr ? "السائق" : "Driver"}: $driverName',
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          // Stops timeline
          if (stops.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
              child: Text(
                isAr ? 'المحطات' : 'Stops',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
            ...stops.asMap().entries.map((entry) {
              final idx = entry.key;
              final stop = entry.value;
              final stopName = stop['name'] ?? stop['stopName'] ?? '';
              final time = stop['time'] ?? stop['arrivalTime'];
              final isFirst = idx == 0;
              final isLast = idx == stops.length - 1;

              return Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Column(
                      children: [
                        if (!isFirst)
                          Container(width: 2, height: 10, color: AppColors.border),
                        Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isFirst || isLast ? AppColors.primary : AppColors.border,
                            border: Border.all(color: AppColors.primary, width: isFirst || isLast ? 0 : 2),
                          ),
                        ),
                        if (!isLast)
                          Container(width: 2, height: 16, color: AppColors.border),
                      ],
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              stopName,
                              style: TextStyle(
                                fontSize: 13,
                                color: isFirst || isLast ? AppColors.textPrimary : AppColors.textSecondary,
                                fontWeight: isFirst || isLast ? FontWeight.w600 : FontWeight.normal,
                              ),
                            ),
                            if (time != null)
                              Text(
                                time.toString(),
                                style: const TextStyle(fontSize: 12, color: AppColors.info),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }),
            const SizedBox(height: 16),
          ] else
            const SizedBox(height: 16),
        ],
      ),
    );
  }
}
