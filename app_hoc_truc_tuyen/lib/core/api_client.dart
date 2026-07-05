import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import 'app_config.dart';
import 'session_manager.dart';

class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient({http.Client? client, SessionManager? sessionManager})
      : _client = client ?? http.Client(),
        _sessionManager = sessionManager ?? SessionManager();

  final http.Client _client;
  final SessionManager _sessionManager;

  Uri _uri(String path) {
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    return Uri.parse('${AppConfig.apiBaseUrl}$normalizedPath');
  }

  Future<Map<String, String>> _headers() async {
    final token = await _sessionManager.getToken();
    // Debug log: token used for request
    // ignore: avoid_print
    print('[ApiClient] using token: ${token ?? '<null>'}');
    return {
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  Future<dynamic> get(String path) async {
    try {
      final response = await _client.get(_uri(path), headers: await _headers()).timeout(const Duration(seconds: 20));
      return _handleResponse(response);
    } on TimeoutException {
      throw ApiException('Kết nối máy chủ quá lâu. Kiểm tra backend đã chạy chưa.');
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException('Không gọi được API ${AppConfig.apiBaseUrl}. Nếu chạy Flutter Web hãy kiểm tra CORS backend. Chi tiết: $e');
    }
  }

  Future<dynamic> post(String path, {Map<String, dynamic>? body}) async {
    try {
      final response = await _client
          .post(
            _uri(path),
            headers: await _headers(),
            body: jsonEncode(body ?? <String, dynamic>{}),
          )
          .timeout(const Duration(seconds: 20));
      return _handleResponse(response);
    } on TimeoutException {
      throw ApiException('Kết nối máy chủ quá lâu. Kiểm tra backend đã chạy chưa.');
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException('Không gọi được API ${AppConfig.apiBaseUrl}. Nếu chạy Flutter Web hãy kiểm tra CORS backend. Chi tiết: $e');
    }
  }

  Future<dynamic> put(String path, {Map<String, dynamic>? body}) async {
    try {
      final response = await _client
          .put(
            _uri(path),
            headers: await _headers(),
            body: jsonEncode(body ?? <String, dynamic>{}),
          )
          .timeout(const Duration(seconds: 20));
      return _handleResponse(response);
    } on TimeoutException {
      throw ApiException('Kết nối máy chủ quá lâu. Kiểm tra backend đã chạy chưa.');
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException('Không gọi được API ${AppConfig.apiBaseUrl}. Nếu chạy Flutter Web hãy kiểm tra CORS backend. Chi tiết: $e');
    }
  }

  dynamic _handleResponse(http.Response response) {
    dynamic decoded;
    final raw = utf8.decode(response.bodyBytes);

    try {
      decoded = raw.isEmpty ? null : jsonDecode(raw);
    } catch (_) {
      decoded = raw;
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (decoded is Map && decoded.containsKey('data')) return decoded['data'];
      return decoded;
    }

    String message = 'Không thể kết nối đến máy chủ';
    if (decoded is Map) {
      message = (decoded['message'] ?? decoded['error'] ?? message).toString();
    } else if (decoded is String && decoded.trim().isNotEmpty) {
      message = decoded;
    }

    throw ApiException(message, statusCode: response.statusCode);
  }
}
