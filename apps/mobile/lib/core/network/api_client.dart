import 'package:dio/dio.dart';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import '../storage/secure_storage.dart';
import 'api_endpoints.dart';

class ApiClient {
  static ApiClient? _instance;
  late final Dio _dio;
  late final CookieJar _cookieJar;

  // Navigation callback for 401 handling
  static void Function()? onUnauthorized;

  ApiClient._() {
    _cookieJar = CookieJar();
    _dio = Dio(BaseOptions(
      baseUrl: ApiEndpoints.baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    _dio.interceptors.add(CookieManager(_cookieJar));
    _dio.interceptors.add(_AuthInterceptor());
    _dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
      error: true,
    ));
  }

  static ApiClient get instance {
    _instance ??= ApiClient._();
    return _instance!;
  }

  Dio get dio => _dio;

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) {
    return _dio.get(path, queryParameters: queryParameters);
  }

  Future<Response> post(String path, {dynamic data}) {
    return _dio.post(path, data: data);
  }

  Future<Response> put(String path, {dynamic data}) {
    return _dio.put(path, data: data);
  }

  Future<Response> patch(String path, {dynamic data}) {
    return _dio.patch(path, data: data);
  }

  Future<Response> delete(String path) {
    return _dio.delete(path);
  }
}

class _AuthInterceptor extends Interceptor {
  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await SecureStorage.getToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }

    final slug = await SecureStorage.getSchoolSlug();
    options.headers['x-school-slug'] = slug;

    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (err.response?.statusCode == 401) {
      SecureStorage.clearAll().then((_) {
        ApiClient.onUnauthorized?.call();
      });
    }
    handler.next(err);
  }
}
