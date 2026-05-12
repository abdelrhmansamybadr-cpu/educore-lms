import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';

class BoardingScreen extends StatefulWidget {
  const BoardingScreen({super.key});

  @override
  State<BoardingScreen> createState() => _BoardingScreenState();
}

class _BoardingScreenState extends State<BoardingScreen> {
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _roomData;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final res = await ApiClient.instance.get(ApiEndpoints.myRoom);
      final raw = res.data;
      final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
      setState(() {
        _roomData = d is Map ? Map<String, dynamic>.from(d) : null;
        _isLoading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _isLoading = false; });
    }
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
          title: Text(isAr ? 'السكن الداخلي' : 'Boarding', style: const TextStyle(fontWeight: FontWeight.bold)),
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
                    child: _roomData == null
                        ? ListView(children: [SizedBox(height: MediaQuery.of(context).size.height * 0.5,
                            child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                              const Icon(Icons.bed_outlined, size: 64, color: AppColors.border),
                              const SizedBox(height: 16),
                              Text(isAr ? 'لا يوجد غرفة مخصصة لك' : 'No room assigned', style: const TextStyle(color: AppColors.textSecondary)),
                            ])))])
                        : SingleChildScrollView(
                            padding: const EdgeInsets.all(16),
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Container(
                                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                                padding: const EdgeInsets.all(20),
                                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                  Row(children: [
                                    Container(
                                      width: 56, height: 56,
                                      decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(14)),
                                      child: const Icon(Icons.meeting_room_rounded, color: AppColors.primary, size: 28),
                                    ),
                                    const SizedBox(width: 16),
                                    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                      Text(isAr ? 'غرفة رقم' : 'Room Number', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                      Text(_roomData!['room']?['roomNumber']?.toString() ?? _roomData!['roomNumber']?.toString() ?? '-',
                                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.primary)),
                                    ]),
                                  ]),
                                  const Divider(height: 24, color: AppColors.border),
                                  _infoRow(isAr ? 'الطابق' : 'Floor', _roomData!['room']?['floor'] ?? _roomData!['floor'] ?? '-'),
                                  _infoRow(isAr ? 'النوع' : 'Type', _roomData!['room']?['type'] ?? _roomData!['type'] ?? '-'),
                                  _infoRow(isAr ? 'السعة' : 'Capacity', '${_roomData!['room']?['capacity'] ?? _roomData!['capacity'] ?? '-'}'),
                                ]),
                              ),
                              const SizedBox(height: 16),
                              Text(isAr ? 'زملاء الغرفة' : 'Roommates',
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                              const SizedBox(height: 12),
                              ...() {
                                final occupants = (_roomData!['room']?['occupants'] ?? _roomData!['occupants'] ?? []) as List;
                                if (occupants.isEmpty) {
                                  return [Center(child: Text(isAr ? 'لا يوجد زملاء' : 'No roommates', style: const TextStyle(color: AppColors.textSecondary)))];
                                }
                                return occupants.map((o) {
                                  final profile = o['user']?['profile'];
                                  final name = profile != null
                                      ? '${profile['firstName']} ${profile['lastName']}'
                                      : o['user']?['email'] ?? '';
                                  return Container(
                                    margin: const EdgeInsets.only(bottom: 8),
                                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                    child: Row(children: [
                                      CircleAvatar(radius: 18, backgroundColor: AppColors.primary.withOpacity(0.1),
                                        child: Text(name.isNotEmpty ? name[0] : '?', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold))),
                                      const SizedBox(width: 12),
                                      Text(name, style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                                    ]),
                                  );
                                }).toList();
                              }(),
                            ]),
                          ),
                  ),
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(children: [
        Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
        const Spacer(),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary, fontSize: 13)),
      ]),
    );
  }
}
