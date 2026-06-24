import '../core/helpers.dart';

class CourseModel {
  const CourseModel({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
    required this.instructorName,
    this.category = 'Chưa phân loại',
    this.durationText = '',
    this.lessonsCount = 0,
    this.totalStudents = 0,
  });

  final int id;
  final String title;
  final String description;
  final double price;
  final String instructorName;
  final String category;
  final String durationText;
  final int lessonsCount;
  final int totalStudents;

  factory CourseModel.fromJson(dynamic json) {
    final map = asMap(json);
    final instructor = asMap(map['instructor'] ?? map['teacher'] ?? map['Instructor']);
    final stats = asMap(map['stats']);
    final categoryMap = asMap(map['category']);
    final name = asString(
      instructor['name'] ?? instructor['fullName'] ?? instructor['email'],
      fallback: 'Giảng viên',
    );
    return CourseModel(
      id: asInt(map['id']),
      title: asString(map['title'] ?? map['name'], fallback: 'Khóa học'),
      description: stripHtml(asString(map['description'] ?? map['shortDescription'])),
      price: asDouble(map['price']),
      instructorName: name,
      category: asString(categoryMap['name'] ?? map['categoryName'] ?? map['category'], fallback: 'Chưa phân loại'),
      durationText: asString(map['duration'] ?? map['durationText']),
      lessonsCount: asInt(map['lessonsCount'] ?? stats['totalLessons'] ?? map['totalLessons']),
      totalStudents: asInt(map['totalStudents'] ?? stats['totalStudents'] ?? map['studentsCount']),
    );
  }
}

class ChapterModel {
  const ChapterModel({
    required this.id,
    required this.title,
    this.description = '',
    required this.orderIndex,
  });

  final int id;
  final String title;
  final String description;
  final int orderIndex;

  factory ChapterModel.fromJson(dynamic json) {
    final map = asMap(json);
    return ChapterModel(
      id: asInt(map['id']),
      title: asString(map['title'], fallback: 'Chương học'),
      description: stripHtml(asString(map['description'])),
      orderIndex: asInt(map['orderIndex']),
    );
  }
}

class CourseDetailModel {
  const CourseDetailModel({
    required this.course,
    required this.chapters,
    required this.lessons,
  });

  final CourseModel course;
  final List<ChapterModel> chapters;
  final List<LessonModel> lessons;

  factory CourseDetailModel.fromJson(dynamic json) {
    final map = asMap(json);
    final chapters = asList(map['chapters']).map(ChapterModel.fromJson).toList()
      ..sort((a, b) => a.orderIndex.compareTo(b.orderIndex));
    final lessons = asList(map['lessons']).map(LessonModel.fromJson).toList()
      ..sort((a, b) {
        final chapter = a.chapterId.compareTo(b.chapterId);
        return chapter != 0 ? chapter : a.orderIndex.compareTo(b.orderIndex);
      });

    return CourseDetailModel(
      course: CourseModel.fromJson(map),
      chapters: chapters,
      lessons: lessons,
    );
  }
}

class CourseProgressModel {
  const CourseProgressModel({
    required this.courseId,
    this.totalLessons = 0,
    this.completedLessons = 0,
    this.completionPercent = 0,
    this.completedLessonIds = const [],
  });

  final int courseId;
  final int totalLessons;
  final int completedLessons;
  final double completionPercent;
  final List<int> completedLessonIds;

  bool get isCompleted => totalLessons > 0 && completedLessons >= totalLessons;

  factory CourseProgressModel.empty(int courseId) {
    return CourseProgressModel(courseId: courseId);
  }

  factory CourseProgressModel.fromJson(dynamic json) {
    final map = asMap(json);
    return CourseProgressModel(
      courseId: asInt(map['courseId']),
      totalLessons: asInt(map['totalLessons']),
      completedLessons: asInt(map['completedLessons']),
      completionPercent: asDouble(map['completionPercent']),
      completedLessonIds: asList(map['completedLessonIds']).map(asInt).where((id) => id > 0).toList(),
    );
  }
}

class EnrollmentModel {
  const EnrollmentModel({
    required this.id,
    required this.courseId,
    required this.status,
    this.course,
    this.progress = 0,
    this.paymentStatus = '',
    this.createdAt = '',
  });

  final int id;
  final int courseId;
  final String status;
  final CourseModel? course;
  final int progress;
  final String paymentStatus;
  final String createdAt;

  factory EnrollmentModel.fromJson(dynamic json) {
    final map = asMap(json);
    final courseMap = asMap(map['course']);
    return EnrollmentModel(
      id: asInt(map['id']),
      courseId: asInt(map['courseId'] ?? courseMap['id']),
      status: asString(map['status'], fallback: 'active'),
      progress: asInt(map['progress']),
      paymentStatus: asString(map['paymentStatus'], fallback: map['status'] == 'active' ? 'paid' : ''),
      createdAt: asString(map['createdAt']),
      course: courseMap.isEmpty ? null : CourseModel.fromJson(courseMap),
    );
  }
}

class LessonModel {
  const LessonModel({
    required this.id,
    required this.courseId,
    required this.title,
    this.content = '',
    this.videoUrl = '',
    this.chapterId = 0,
    this.orderIndex = 0,
    this.segments = const [],
  });

  final int id;
  final int courseId;
  final int chapterId;
  final String title;
  final String content;
  final String videoUrl;
  final int orderIndex;
  final List<LessonSegmentModel> segments;

  factory LessonModel.fromJson(dynamic json) {
    final map = asMap(json);
    final segments = asList(map['segments'] ?? map['lessonSegments']).map(LessonSegmentModel.fromJson).toList()
      ..sort((a, b) => a.orderIndex.compareTo(b.orderIndex));
    return LessonModel(
      id: asInt(map['id']),
      courseId: asInt(map['courseId']),
      chapterId: asInt(map['chapterId']),
      title: asString(map['title'], fallback: 'Bài học'),
      content: stripHtml(asString(map['content'] ?? map['description'])),
      videoUrl: asString(map['videoUrl'] ?? map['youtubeUrl']),
      orderIndex: asInt(map['orderIndex']),
      segments: segments,
    );
  }
}

class LessonSegmentModel {
  const LessonSegmentModel({
    required this.id,
    required this.title,
    this.description = '',
    this.orderIndex = 0,
    this.contentItems = const [],
  });

  final int id;
  final String title;
  final String description;
  final int orderIndex;
  final List<ContentItemModel> contentItems;

  factory LessonSegmentModel.fromJson(dynamic json) {
    final map = asMap(json);
    final rawItems = map['contentItems'] ?? map['items'] ?? map['contents'];
    final items = asList(rawItems).map(ContentItemModel.fromJson).toList()
      ..sort((a, b) => a.orderIndex.compareTo(b.orderIndex));
    return LessonSegmentModel(
      id: asInt(map['id']),
      title: asString(map['title'], fallback: 'Phần học'),
      description: stripHtml(asString(map['description'])),
      orderIndex: asInt(map['orderIndex']),
      contentItems: items,
    );
  }
}

class ContentItemModel {
  const ContentItemModel({
    required this.type,
    required this.title,
    required this.text,
    required this.url,
    this.quizId = 0,
    this.orderIndex = 0,
    this.startTime,
    this.endTime,
  });

  final String type;
  final String title;
  final String text;
  final String url;
  final int quizId;
  final int orderIndex;
  final int? startTime;
  final int? endTime;

  bool get isText => type == 'text' || type == 'question';
  bool get isDocument => type == 'document' || type == 'file' || type == 'pdf';
  bool get isVideo => type == 'videoClip' || type == 'video' || type == 'youtube';
  bool get isQuiz => type == 'quiz' || type == 'exercise';

  factory ContentItemModel.fromJson(dynamic json) {
    final map = asMap(json);
    final metadata = asMap(map['metadata']);
    final value = map['value'];
    final content = map['content'];
    final contentBlocks = asList(map['contentBlocks'] ?? metadata['contentBlocks'] ?? metadata['blocks']);

    String text = '';
    String url = '';

    if (value is Map || content is Map) {
      final source = asMap(value is Map ? value : content);
      text = asString(source['text'] ?? source['content'] ?? source['description'] ?? source['html']);
      url = asString(source['url'] ?? source['fileUrl'] ?? source['documentUrl'] ?? source['resourceUrl'] ?? source['videoUrl']);
    } else {
      text = asString(value ?? content ?? map['text'] ?? map['description']);
      url = asString(map['url'] ?? map['fileUrl'] ?? map['documentUrl'] ?? map['resourceUrl'] ?? map['videoUrl']);
    }

    if (text.trim().isEmpty && contentBlocks.isNotEmpty) {
      text = contentBlocks
          .map((block) => asString(asMap(block)['text'] ?? asMap(block)['content'] ?? asMap(block)['html']))
          .where((item) => item.trim().isNotEmpty)
          .join('\n');
    }

    if (url.trim().isEmpty) {
      url = asString(metadata['url'] ?? metadata['fileUrl'] ?? metadata['documentUrl'] ?? metadata['resourceUrl'] ?? metadata['videoUrl']);
    }

    int? nullableInt(dynamic value) {
      if (value == null || '$value'.trim().isEmpty) return null;
      final number = int.tryParse('$value');
      return number != null && number >= 0 ? number : null;
    }

    return ContentItemModel(
      type: asString(map['type'] ?? metadata['type'], fallback: 'text'),
      title: asString(map['title'] ?? metadata['title'], fallback: 'Nội dung'),
      text: stripHtml(text),
      url: url,
      quizId: asInt(map['quizId'] ?? metadata['quizId']),
      orderIndex: asInt(map['orderIndex']),
      startTime: nullableInt(map['startTime'] ?? metadata['startTime']),
      endTime: nullableInt(map['endTime'] ?? metadata['endTime']),
    );
  }
}
