class LessonModel {
  const LessonModel({
    required this.id,
    required this.courseId,
    required this.title,
    required this.contentUrl,
  });

  final int id;
  final int courseId;
  final String title;
  final String contentUrl;

  factory LessonModel.fromJson(Map<String, dynamic> json) {
    return LessonModel(
      id: json['id'] as int? ?? 0,
      courseId: json['courseId'] as int? ?? 0,
      title: json['title'] as String? ?? '',
      contentUrl: json['contentUrl'] as String? ?? '',
    );
  }
}