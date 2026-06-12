class LessonEntity {
  const LessonEntity({
    required this.id,
    required this.courseId,
    required this.title,
    required this.contentUrl,
  });

  final int id;
  final int courseId;
  final String title;
  final String contentUrl;
}