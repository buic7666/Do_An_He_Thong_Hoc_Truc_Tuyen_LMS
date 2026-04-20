class EnrollmentEntity {
  const EnrollmentEntity({
    required this.id,
    required this.userId,
    required this.courseId,
  });

  final int id;
  final int userId;
  final int courseId;
}