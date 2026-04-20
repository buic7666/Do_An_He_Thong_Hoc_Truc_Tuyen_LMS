class UserModel {
  const UserModel({
    required this.id,
    required this.email,
    required this.fullName,
  });

  final int id;
  final String email;
  final String fullName;

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as int? ?? 0,
      email: json['email'] as String? ?? '',
      fullName: json['fullName'] as String? ?? '',
    );
  }
}