import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';

/// Holds school configuration loaded after login.
/// Used to gate modules and adapt UI per curriculum type.
class SchoolProvider extends ChangeNotifier {
  Map<String, dynamic>? _school;
  Set<String> _enabledModules = {};
  bool _isLoading = false;

  Map<String, dynamic>? get school => _school;
  Set<String> get enabledModules => _enabledModules;
  bool get isLoading => _isLoading;

  String get curriculumType => _school?['curriculumType'] ?? 'CUSTOM';
  String get schoolName => _school?['name'] ?? 'EduCore';
  String get schoolNameAr => _school?['nameAr'] ?? schoolName;
  String? get logo => _school?['logo'];

  bool isModuleEnabled(String module) {
    // If not loaded yet, show everything (fail-open for UX)
    if (_enabledModules.isEmpty) return true;
    return _enabledModules.contains(module);
  }

  /// Call this after login to load school data + enabled modules
  Future<void> load() async {
    _isLoading = true;
    notifyListeners();
    try {
      final results = await Future.wait([
        ApiClient.instance.get('/schools/my'),
        ApiClient.instance.get('/schools/my/modules'),
      ]);

      final schoolRaw = results[0].data;
      _school = (schoolRaw is Map && schoolRaw['data'] != null)
          ? Map<String, dynamic>.from(schoolRaw['data'])
          : Map<String, dynamic>.from(schoolRaw ?? {});

      final modulesRaw = results[1].data;
      final modulesList = (modulesRaw is Map && modulesRaw['data'] != null)
          ? modulesRaw['data'] as List
          : (modulesRaw is List ? modulesRaw : []);

      _enabledModules = modulesList
          .where((m) => m['enabled'] == true)
          .map((m) => m['module'].toString())
          .toSet();
    } catch (_) {
      // Keep defaults — fail-open
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void reset() {
    _school = null;
    _enabledModules = {};
    notifyListeners();
  }
}
