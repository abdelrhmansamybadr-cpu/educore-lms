import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../features/auth/models/user_model.dart';

class SecureStorage {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static const _tokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _userKey = 'user_data';
  static const _schoolSlugKey = 'school_slug';
  static const _localeKey = 'app_locale';

  // Token
  static Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  static Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  static Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: _refreshTokenKey, value: token);
  }

  static Future<String?> getRefreshToken() async {
    return await _storage.read(key: _refreshTokenKey);
  }

  static Future<void> clearToken() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _refreshTokenKey);
  }

  // User
  static Future<void> saveUser(UserModel user) async {
    await _storage.write(key: _userKey, value: jsonEncode(user.toJson()));
  }

  static Future<UserModel?> getUser() async {
    final data = await _storage.read(key: _userKey);
    if (data == null) return null;
    try {
      return UserModel.fromJson(jsonDecode(data));
    } catch (_) {
      return null;
    }
  }

  static Future<void> clearUser() async {
    await _storage.delete(key: _userKey);
  }

  // School Slug
  static Future<void> saveSchoolSlug(String slug) async {
    await _storage.write(key: _schoolSlugKey, value: slug);
  }

  static Future<String> getSchoolSlug() async {
    return await _storage.read(key: _schoolSlugKey) ?? 'demo';
  }

  // Locale
  static Future<void> saveLocale(String locale) async {
    await _storage.write(key: _localeKey, value: locale);
  }

  static Future<String?> getLocale() async {
    return await _storage.read(key: _localeKey);
  }

  // Clear All
  static Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
