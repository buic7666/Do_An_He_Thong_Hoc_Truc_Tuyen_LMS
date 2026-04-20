class EnrollmentModel {
  const EnrollmentModel({
    required this.id,
    required this.userId,
    required this.courseId,
  });

  final int id;
  final int userId;
  final int courseId;

  factory EnrollmentModel.fromJson(Map<String, dynamic> json) {
    return EnrollmentModel(
      id: json['id'] as int? ?? 0,
      userId: json['userId'] as int? ?? 0,
      courseId: json['courseId'] as int? ?? 0,
    );
  }
}