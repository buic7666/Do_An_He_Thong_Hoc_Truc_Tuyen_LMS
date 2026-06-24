import '../core/helpers.dart';

class QuizModel {
  const QuizModel({
    required this.id,
    required this.courseId,
    required this.title,
    this.description = '',
    this.duration = 0,
    this.passScore = 0,
    this.maxAttempts = 0,
    this.questions = const [],
  });

  final int id;
  final int courseId;
  final String title;
  final String description;
  final int duration;
  final int passScore;
  final int maxAttempts;
  final List<QuestionModel> questions;

  factory QuizModel.fromJson(dynamic json) {
    final map = asMap(json);
    return QuizModel(
      id: asInt(map['id']),
      courseId: asInt(map['courseId']),
      title: asString(map['title'], fallback: 'Bài kiểm tra'),
      description: stripHtml(asString(map['description'])),
      duration: asInt(map['duration']),
      passScore: asInt(map['passScore']),
      maxAttempts: asInt(map['maxAttempts']),
      questions: asList(map['questions']).map(QuestionModel.fromJson).toList(),
    );
  }
}

class QuestionModel {
  const QuestionModel({
    required this.id,
    required this.type,
    required this.content,
    required this.options,
    required this.metadata,
  });

  final int id;
  final String type;
  final String content;
  final List<dynamic> options;
  final Map<String, dynamic> metadata;

  factory QuestionModel.fromJson(dynamic json) {
    final map = asMap(json);
    final metadata = asMap(map['metadata']);
    final rawOptions = map['options'];
    final parsedOptions = asList(rawOptions);
    final options = parsedOptions.isNotEmpty ? parsedOptions : asList(metadata['options']);
    var questionType = asString(map['type'], fallback: 'MULTIPLE_CHOICE').toUpperCase();
    if (questionType == 'MULTICHOICE' || questionType == 'MCQ') {
      questionType = 'MULTIPLE_CHOICE';
    }

    final textFromBlocks = asList(map['contentBlocks'] ?? metadata['contentBlocks'])
        .map((block) => asString(asMap(block)['text'] ?? asMap(block)['content']))
        .where((item) => item.trim().isNotEmpty)
        .join('\n');

    return QuestionModel(
      id: asInt(map['id']),
      type: questionType,
      content: stripHtml(asString(
        map['questionText'] ?? map['content'] ?? metadata['questionText'] ?? metadata['title'] ?? textFromBlocks,
        fallback: 'Câu hỏi',
      )),
      options: options,
      metadata: metadata,
    );
  }
}

class QuizAttemptResult {
  const QuizAttemptResult({
    required this.id,
    this.attemptNumber = 0,
    this.totalScore = 0,
    this.isPassed = false,
    this.submittedAt = '',
  });

  final int id;
  final int attemptNumber;
  final int totalScore;
  final bool isPassed;
  final String submittedAt;

  bool get isSubmitted => submittedAt.trim().isNotEmpty;

  factory QuizAttemptResult.fromJson(dynamic json) {
    final map = asMap(json);
    return QuizAttemptResult(
      id: asInt(map['id'] ?? map['attemptId']),
      attemptNumber: asInt(map['attemptNumber']),
      totalScore: asInt(map['totalScore'] ?? map['score']),
      isPassed: map['isPassed'] == true || map['passed'] == true,
      submittedAt: asString(map['submittedAt']),
    );
  }
}
