import 'package:flutter/foundation.dart';

class AppConfig {
  static const String appName = 'LMS Học Viên';

  // Chạy Flutter Web: dùng localhost.
  static const String webApiBaseUrl = 'http://localhost:5000/api';

  // Chạy Android Emulator: đổi sang 10.0.2.2 nếu cần.
  static const String androidEmulatorApiBaseUrl = 'http://10.0.2.2:5000/api';

  static String get apiBaseUrl {
    if (kIsWeb) return webApiBaseUrl;
    if (defaultTargetPlatform == TargetPlatform.android) {
      return androidEmulatorApiBaseUrl;
    }
    return webApiBaseUrl;
  }

  static String get fileBaseUrl => apiBaseUrl.replaceFirst('/api', '');

  static String fullFileUrl(String raw) {
    final value = raw.trim();
    if (value.startsWith('http://') || value.startsWith('https://')) return value;
    if (value.startsWith('/')) return '$fileBaseUrl$value';
    return value;
  }
}
