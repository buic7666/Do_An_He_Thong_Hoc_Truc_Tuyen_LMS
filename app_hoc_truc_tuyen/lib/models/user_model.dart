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
    return UserModel(
      id: asInt(map['id']),
      name: asString(map['name'] ?? map['fullName'], fallback: 'Học viên'),
      email: asString(map['email']),
      role: asString(map['role'], fallback: 'student'),
      token: map['token']?.toString(),
    );
  }
}
