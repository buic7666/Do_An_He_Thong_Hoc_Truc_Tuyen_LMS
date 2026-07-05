import '../core/helpers.dart';

class UserModel {
  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.token,
  });

  final int id;
  final String name;
  final String email;
  final String role;
  final String? token;

  factory UserModel.fromJson(dynamic json) {
    final map = asMap(json);
    final nestedUser = asMap(map['user']);
    final source = nestedUser.isNotEmpty ? nestedUser : map;

    final token = asString(
      map['token'] ??
          map['accessToken'] ??
          map['access_token'] ??
          source['token'] ??
          source['accessToken'] ??
          source['access_token'],
    );

    return UserModel(
      id: asInt(source['id']),
      name: asString(source['name'] ?? source['fullName'], fallback: 'Học viên'),
      email: asString(source['email']),
      role: asString(source['role'], fallback: 'student'),
      token: token.isEmpty ? null : token,
    );
  }
}
