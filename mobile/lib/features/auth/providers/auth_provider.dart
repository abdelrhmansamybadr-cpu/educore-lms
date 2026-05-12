import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../models/user_model.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/storage/secure_storage.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _user;
  bool _isLoading = false;
  bool _isAuthenticated = false;
  String? _error;
  String _locale = 'en';

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;
  String? get error => _error;
  String get locale => _locale;
  bool get isAr => _locale == 'ar';

  void toggleLocale() {
    _locale = _locale == 'en' ? 'ar' : 'en';
    SecureStorage.saveLocale(_locale);
    notifyListeners();
  }

  void setLocale(String locale) {
    _locale = locale;
    notifyListeners();
  }

  Future<void> loadFromStorage() async {
    try {
      final savedLocale = await SecureStorage.getLocale();
      if (savedLocale != null) _locale = savedLocale;

      final token = await SecureStorage.getToken();
      if (token == null) {
        _isAuthenticated = false;
        notifyListeners();
        return;
      }

      final savedUser = await SecureStorage.getUser();
      if (savedUser != null) {
        _user = savedUser;
        _isAuthenticated = true;
        notifyListeners();

        // Refresh user data from API
        try {
          final response = await ApiClient.instance.get(ApiEndpoints.me);
          if (response.statusCode == 200) {
            final raw = response.data;
            final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
            _user = UserModel.fromJson(d['user'] ?? d);
            await SecureStorage.saveUser(_user!);
            notifyListeners();
          }
        } catch (_) {
          // Use cached user data
        }
      } else {
        _isAuthenticated = false;
        notifyListeners();
      }
    } catch (e) {
      _isAuthenticated = false;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password, String schoolSlug) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await SecureStorage.saveSchoolSlug(schoolSlug.isEmpty ? 'demo' : schoolSlug);

      final response = await ApiClient.instance.post(
        ApiEndpoints.login,
        data: {
          'email': email.trim(),
          'password': password,
        },
      );

      final raw = response.data;
      // API wraps responses: { success, data: { user, accessToken, refreshToken } }
      final data = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
      final token = data['accessToken'] ?? data['access_token'] ?? data['token'];
      final refreshToken = data['refreshToken'] ?? data['refresh_token'];

      if (token == null) {
        _error = 'Invalid response from server';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      await SecureStorage.saveToken(token);
      if (refreshToken != null) {
        await SecureStorage.saveRefreshToken(refreshToken);
      }

      final userData = data['user'] ?? data;
      _user = UserModel.fromJson(userData);
      await SecureStorage.saveUser(_user!);

      _isAuthenticated = true;
      _isLoading = false;
      notifyListeners();
      return true;
    } on DioException catch (e) {
      _isLoading = false;
      if (e.response?.statusCode == 401 || e.response?.statusCode == 400) {
        _error = _locale == 'ar'
            ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            : 'Invalid email or password';
      } else if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.connectionError) {
        _error = _locale == 'ar' ? 'تعذر الاتصال بالخادم' : 'Cannot connect to server';
      } else {
        _error = e.response?.data?['message'] ?? 'Login failed';
      }
      notifyListeners();
      return false;
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await ApiClient.instance.post(ApiEndpoints.logout);
    } catch (_) {}

    await SecureStorage.clearAll();
    _user = null;
    _isAuthenticated = false;
    notifyListeners();
  }

  Future<bool> updateProfile(Map<String, dynamic> data) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await ApiClient.instance.patch(ApiEndpoints.updateMe, data: data);
      final raw = response.data;
      final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
      _user = UserModel.fromJson(d['user'] ?? d);
      await SecureStorage.saveUser(_user!);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
