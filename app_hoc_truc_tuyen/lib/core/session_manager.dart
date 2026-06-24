import 'package:shared_preferences/shared_preferences.dart';

import '../models/user_model.dart';

class SessionManager {
  static const String tokenKey = 'accessToken';
  static const String userIdKey = 'userId';
  static const String userNameKey = 'userName';
  static const String userEmailKey = 'userEmail';
  static const String userRoleKey = 'userRole';

  Future<void> saveUser(UserModel user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(tokenKey, user.token ?? '');
    await prefs.setString(userIdKey, user.id.toString());
    await prefs.setString(userNameKey, user.name);
    await prefs.setString(userEmailKey, user.email);
    await prefs.setString(userRoleKey, user.role);
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(tokenKey);
    if (token == null || token.isEmpty) return null;
    return token;
  }

  Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  Future<UserModel?> getLocalUser() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(tokenKey);
    final email = prefs.getString(userEmailKey);
    if (token == null || token.isEmpty || email == null || email.isEmpty) {
      return null;
    }

    return UserModel(
      id: int.tryParse(prefs.getString(userIdKey) ?? '0') ?? 0,
      name: prefs.getString(userNameKey) ?? 'Học viên',
      email: email,
      role: prefs.getString(userRoleKey) ?? 'student',
      token: token,
    );
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(tokenKey);
    await prefs.remove(userIdKey);
    await prefs.remove(userNameKey);
    await prefs.remove(userEmailKey);
    await prefs.remove(userRoleKey);
  }
}
