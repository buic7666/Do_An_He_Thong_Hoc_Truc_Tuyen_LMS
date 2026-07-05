import '../core/api_client.dart';
import '../core/helpers.dart';
import '../core/session_manager.dart';
import '../models/course_model.dart';
import '../models/quiz_model.dart';
import '../models/user_model.dart';

class LmsRepository {
  LmsRepository({ApiClient? apiClient, SessionManager? sessionManager})
    : _api = apiClient ?? ApiClient(),
      _session = sessionManager ?? SessionManager();

  final ApiClient _api;
  final SessionManager _session;

  Map<String, dynamic> _normalizeAuthPayload(dynamic data) {
    final root = asMap(data);
    final nestedUser = asMap(root['user']);
    final payload = <String, dynamic>{...nestedUser, ...root};

    final token = asString(
      root['token'] ??
          root['accessToken'] ??
          root['access_token'] ??
          nestedUser['token'] ??
          nestedUser['accessToken'] ??
          nestedUser['access_token'],
    );

    if (token.isNotEmpty) {
      payload['token'] = token;
    }

    return payload;
  }

  Future<UserModel> login(String email, String password) async {
    final data = await _api.post(
      '/auth/login',
      body: {'email': email.trim(), 'password': password},
    );
    final user = UserModel.fromJson(_normalizeAuthPayload(data));
    final token = user.token ?? '';
    if (token.trim().isEmpty) {
      throw ApiException('Phản hồi đăng nhập không có token hợp lệ.');
    }

    await _session.saveSession(token: token, user: user);
    return user;
  }

  Future<UserModel> register({
    required String name,
    required String email,
    required String password,
  }) async {
    final data = await _api.post(
      '/auth/register',
      body: {
        'name': name.trim(),
        'fullName': name.trim(),
        'email': email.trim(),
        'password': password,
        'role': 'student',
      },
    );
    final user = UserModel.fromJson(_normalizeAuthPayload(data));
    final token = user.token ?? '';
    if (token.trim().isEmpty) {
      throw ApiException('Phản hồi đăng ký không có token hợp lệ.');
    }

    await _session.saveSession(token: token, user: user);
    return user;
  }

  Future<UserModel?> getLocalUser() => _session.getLocalUser();
  Future<bool> isLoggedIn() => _session.isLoggedIn();
  Future<void> logout() => _session.clear();

  Future<UserModel> getCurrentUserFromToken() async {
    final data = await _api.get('/auth/me');
    final user = UserModel.fromJson(data);
    final token = await _session.getToken();

    if (token != null && token.trim().isNotEmpty) {
      await _session.saveSession(token: token, user: user);
    } else {
      await _session.saveUser(user);
    }

    return user;
  }

  Future<UserModel?> validateOrRefreshSession() async {
    final token = await _session.getToken();
    if (token == null || token.trim().isEmpty) {
      return null;
    }

    try {
      return await getCurrentUserFromToken();
    } on ApiException catch (e) {
      if (e.statusCode == 401 || e.statusCode == 403) {
        await _session.clear();
        return null;
      }
      rethrow;
    }
  }

  Future<List<CourseModel>> getCourses() async {
    final data = await _api.get('/courses');
    return _list(data).map(CourseModel.fromJson).toList();
  }

  Future<CourseDetailModel> getCourseDetail(int courseId) async {
    final data = await _api.get('/courses/$courseId');
    return CourseDetailModel.fromJson(data);
  }

  Future<List<EnrollmentModel>> getMyEnrollments() async {
    final data = await _api.get('/enrollments/me');
    return _list(data).map(EnrollmentModel.fromJson).toList();
  }

  Future<EnrollmentModel?> enrollCourse(int courseId) async {
    final data = await _api.post('/enrollments', body: {'courseId': courseId});
    if (data == null) return null;
    return EnrollmentModel.fromJson(data);
  }

  Future<CourseProgressModel> getCourseProgress(int courseId) async {
    final data = await _api.get('/courses/$courseId/progress');
    return CourseProgressModel.fromJson(data);
  }

  Future<List<LessonModel>> getLessonsByCourse(int courseId) async {
    final data = await _api.get('/lessons/course/$courseId');
    return _list(data).map(LessonModel.fromJson).toList();
  }

  Future<LessonModel> getLessonDetail(int lessonId) async {
    final data = await _api.get('/lessons/$lessonId');
    final lesson = LessonModel.fromJson(data);
    if (lesson.segments.isNotEmpty) return lesson;

    try {
      final segments = await getLessonSegments(lessonId);
      return LessonModel(
        id: lesson.id,
        courseId: lesson.courseId,
        title: lesson.title,
        content: lesson.content,
        videoUrl: lesson.videoUrl,
        chapterId: lesson.chapterId,
        orderIndex: lesson.orderIndex,
        segments: segments,
      );
    } catch (_) {
      return lesson;
    }
  }

  Future<List<LessonSegmentModel>> getLessonSegments(int lessonId) async {
    final data = await _api.get('/lessons/$lessonId/segments');
    return _list(data).map(LessonSegmentModel.fromJson).toList();
  }

  Future<void> markLessonCompleted(
    int lessonId, {
    Map<String, dynamic>? studyState,
    double? positionSeconds,
  }) async {
    final body = <String, dynamic>{};
    if (studyState != null) {
      body['studyState'] = studyState;
    }
    if (positionSeconds != null && positionSeconds >= 0) {
      body['positionSeconds'] = positionSeconds.floor();
    }

    await _api.post('/lessons/$lessonId/progress', body: body);
  }

  Future<Map<String, dynamic>> getLessonWatchPosition(int lessonId) async {
    final data = await _api.get('/lessons/$lessonId/watch-position');
    return asMap(data);
  }

  Future<Map<String, dynamic>> saveLessonWatchPosition(
    int lessonId, {
    required double positionSeconds,
    Map<String, dynamic>? studyState,
  }) async {
    final body = <String, dynamic>{'positionSeconds': positionSeconds.floor()};
    if (studyState != null) {
      body['studyState'] = studyState;
    }

    final data = await _api.post(
      '/lessons/$lessonId/watch-position',
      body: body,
    );
    return asMap(data);
  }

  Future<List<QuizModel>> getQuizzesByCourse(int courseId) async {
    final data = await _api.get('/quiz/courses/$courseId/quizzes');
    return _list(data).map(QuizModel.fromJson).toList();
  }

  Future<QuizModel> getQuizDetail(int quizId) async {
    final data = await _api.get('/quiz/quizzes/$quizId');
    return QuizModel.fromJson(data);
  }

  Future<QuizAttemptResult?> getLatestQuizAttempt(int quizId) async {
    final data = await _api.get('/quiz/quizzes/$quizId/latest-attempt');
    if (data == null) return null;
    if (data is Map && data.isEmpty) return null;
    return QuizAttemptResult.fromJson(data);
  }

  Future<List<QuizAttemptResult>> getQuizAttempts(int quizId) async {
    final data = await _api.get('/quiz/quizzes/$quizId/attempts');
    return _list(data).map(QuizAttemptResult.fromJson).toList();
  }

  Future<void> startQuiz(int quizId) async {
    await _api.post('/quiz/quizzes/$quizId/start');
  }

  Future<QuizAttemptResult> submitQuiz(
    int quizId,
    Map<String, dynamic> answers,
  ) async {
    final data = await _api.post(
      '/quiz/quizzes/$quizId/submit',
      body: {'answers': answers},
    );
    return QuizAttemptResult.fromJson(data);
  }

  List<dynamic> _list(dynamic data) {
    if (data is List) return data;
    if (data is Map && data['items'] is List) return data['items'] as List;
    if (data is Map && data['rows'] is List) return data['rows'] as List;
    if (data is Map && data['data'] is List) return data['data'] as List;
    return <dynamic>[];
  }
}
