import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/api_client.dart';
import '../core/app_config.dart';
import '../core/helpers.dart';
import '../core/session_manager.dart';
import '../models/course_model.dart';
import '../models/user_model.dart';
import '../services/lms_repository.dart';
import '../widgets/app_widgets.dart';
import 'quiz_screen.dart';
import 'youtube_learning_screen.dart';

class LearningScreen extends StatefulWidget {
  const LearningScreen({
    super.key,
    required this.courseId,
    this.initialLessonId,
  });

  final int courseId;
  final int? initialLessonId;

  @override
  State<LearningScreen> createState() => _LearningScreenState();
}

class _LearningScreenState extends State<LearningScreen>
    with WidgetsBindingObserver {
  final LmsRepository _repo = LmsRepository();
  final SessionManager _session = SessionManager();
  final ScrollController _scrollController = ScrollController();

  bool _loading = true;
  bool _lessonLoading = false;
  bool _marking = false;

  String _error = '';

  CourseDetailModel? _detail;
  CourseProgressModel? _courseProgress;
  UserModel? _currentUser;
  LessonModel? _currentLesson;
  int? _currentLessonId;
  Map<String, bool> _viewedContentItems = {};
  Map<String, double> _videoPositions = {};
  Map<String, double> _quizScores = {};
  final Set<int> _completedLessonIds = {};
  final Set<int> _syncedCompletedLessonIds = {};
  Timer? _autoSyncTimer;
  bool _isSyncingFromBackend = false;

  static const Duration _autoSyncInterval = Duration(seconds: 12);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _load();
    _startAutoSync();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _autoSyncTimer?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _syncFromBackendSilently();
    }
  }

  void _startAutoSync() {
    _autoSyncTimer?.cancel();
    _autoSyncTimer = Timer.periodic(_autoSyncInterval, (_) {
      _syncFromBackendSilently();
    });
  }

  Future<void> _syncFromBackendSilently() async {
    if (!mounted || _isSyncingFromBackend || _loading || _lessonLoading) {
      return;
    }

    _isSyncingFromBackend = true;
    try {
      final progress = await _repo.getCourseProgress(widget.courseId);
      if (!mounted) return;

      _completedLessonIds
        ..clear()
        ..addAll(progress.completedLessonIds);

      setState(() {
        _courseProgress = progress;
      });

      final resumeLessonId = progress.resumeLessonId > 0
          ? progress.resumeLessonId
          : null;
      final selectedLessonId = _currentLessonId;

      // If backend has a different resume lesson than currently selected,
      // switch to it so cross-device resume is automatic.
      if (resumeLessonId != null && resumeLessonId != selectedLessonId) {
        await _selectLesson(resumeLessonId);
        return;
      }

      final targetLessonId = selectedLessonId ?? resumeLessonId;

      if (targetLessonId == null) return;

      if (selectedLessonId == null) {
        await _selectLesson(targetLessonId);
        return;
      }

      final lesson = _currentLesson;
      if (lesson != null && lesson.id == selectedLessonId) {
        await _loadStudyStateForLesson(
          lesson,
          pushToBackend: false,
          silent: true,
        );
      }
    } catch (_) {
      // Keep UX smooth; next cycle will retry automatically.
    } finally {
      _isSyncingFromBackend = false;
    }
  }

  String _contentKey(LessonSegmentModel segment, int itemIndex) {
    return '${segment.id}-$itemIndex';
  }

  String _contentProgressKey(
    LessonSegmentModel segment,
    ContentItemModel item,
    int itemIndex,
  ) {
    final originalIndex = item.originalIndex >= 0
        ? item.originalIndex
        : itemIndex;
    return _contentKey(segment, originalIndex);
  }

  bool _isStudyContentItem(ContentItemModel item) {
    return item.type.trim().toLowerCase() != 'question';
  }

  Future<String> _studyStateKey(int lessonId) async {
    final user = _currentUser ?? await _session.getLocalUser();
    final userKey = user == null
        ? 'guest'
        : user.id != 0
        ? '${user.id}'
        : user.email;
    return 'lms-study-state:$userKey:${widget.courseId}:$lessonId';
  }

  Future<Map<String, dynamic>> _readStudyState(int lessonId) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(await _studyStateKey(lessonId));
    if (raw == null || raw.trim().isEmpty) return {};

    try {
      final decoded = jsonDecode(raw);
      return decoded is Map<String, dynamic> ? decoded : {};
    } catch (_) {
      return {};
    }
  }

  Future<void> _writeStudyState(
    int lessonId,
    Map<String, dynamic> nextState,
  ) async {
    final prefs = await SharedPreferences.getInstance();
    final key = await _studyStateKey(lessonId);
    final previous = await _readStudyState(lessonId);
    final merged = <String, dynamic>{
      ...previous,
      ...nextState,
      'updatedAt': DateTime.now().toIso8601String(),
    };

    if (nextState['viewedContentItems'] is Map) {
      merged['viewedContentItems'] = {
        ...(previous['viewedContentItems'] is Map
            ? previous['viewedContentItems'] as Map
            : {}),
        ...(nextState['viewedContentItems'] as Map),
      };
    }

    if (nextState['videoPositions'] is Map) {
      merged['videoPositions'] = {
        ...(previous['videoPositions'] is Map
            ? previous['videoPositions'] as Map
            : {}),
        ...(nextState['videoPositions'] as Map),
      };
    }

    if (nextState['quizCompletions'] is Map) {
      merged['quizCompletions'] = {
        ...(previous['quizCompletions'] is Map
            ? previous['quizCompletions'] as Map
            : {}),
        ...(nextState['quizCompletions'] as Map),
      };
    }

    await prefs.setString(key, jsonEncode(merged));

    try {
      await _repo.saveLessonWatchPosition(
        lessonId,
        positionSeconds: asDouble(merged['resumeSeconds']),
        studyState: Map<String, dynamic>.from(merged),
      );
    } catch (_) {
      // SharedPreferences is kept as an offline cache; the next successful
      // interaction will merge and push this state again.
    }
  }

  Map<String, dynamic> _mergeStudyState(
    Map<String, dynamic> localState,
    Map<String, dynamic> backendState,
  ) {
    final merged = <String, dynamic>{...localState, ...backendState};
    merged['viewedContentItems'] = {
      ...asMap(localState['viewedContentItems']),
      ...asMap(backendState['viewedContentItems']),
    };

    final localPositions = asMap(localState['videoPositions']);
    final backendPositions = asMap(backendState['videoPositions']);
    final videoPositions = <String, dynamic>{...localPositions};
    backendPositions.forEach((key, value) {
      final previous = asDouble(videoPositions[key]);
      final next = asDouble(value);
      videoPositions[key] = next > previous ? next : previous;
    });
    merged['videoPositions'] = videoPositions;

    final localQuizzes = asMap(localState['quizCompletions']);
    final backendQuizzes = asMap(backendState['quizCompletions']);
    final quizCompletions = <String, dynamic>{...localQuizzes};
    backendQuizzes.forEach((key, value) {
      final previous = quizCompletions[key];
      final previousScore = previous is Map
          ? asDouble(previous['score'])
          : asDouble(previous);
      final nextScore = value is Map
          ? asDouble(value['score'])
          : asDouble(value);
      if (!quizCompletions.containsKey(key) || nextScore >= previousScore) {
        quizCompletions[key] = value;
      }
    });
    merged['quizCompletions'] = quizCompletions;

    return merged;
  }

  Map<String, bool> _boolMap(dynamic value) {
    if (value is! Map) return {};
    return value.map((key, value) => MapEntry('$key', value == true));
  }

  bool _isViewedWithAliases(
    Map<String, bool> viewedItems,
    LessonSegmentModel segment,
    ContentItemModel item,
    int itemIndex,
  ) {
    final keys = <String>{
      _contentProgressKey(segment, item, itemIndex),
      _contentKey(segment, itemIndex),
      if (item.originalIndex >= 0) _contentKey(segment, item.originalIndex),
    };

    return keys.any((key) => viewedItems[key] == true);
  }

  void _markViewedAliases(
    Map<String, bool> viewedItems,
    LessonSegmentModel segment,
    ContentItemModel item,
    int itemIndex,
  ) {
    viewedItems[_contentProgressKey(segment, item, itemIndex)] = true;
    viewedItems[_contentKey(segment, itemIndex)] = true;
    if (item.originalIndex >= 0) {
      viewedItems[_contentKey(segment, item.originalIndex)] = true;
    }
  }

  double _valueWithAliases(
    Map<String, double> values,
    LessonSegmentModel segment,
    ContentItemModel item,
    int itemIndex,
  ) {
    final keys = <String>[
      _contentProgressKey(segment, item, itemIndex),
      _contentKey(segment, itemIndex),
      if (item.originalIndex >= 0) _contentKey(segment, item.originalIndex),
    ];

    return keys
        .map((key) => values[key] ?? 0)
        .fold<double>(
          0,
          (previous, value) => value > previous ? value : previous,
        );
  }

  Map<String, double> _doubleMap(dynamic value) {
    if (value is! Map) return {};
    return value.map((key, value) {
      final score = value is Map ? asDouble(value['score']) : asDouble(value);
      return MapEntry('$key', score);
    });
  }

  bool _videoReachedHalf(double position, int? startTime, int? endTime) {
    final start = (startTime ?? 0).toDouble();
    final end = (endTime ?? 0).toDouble();
    if (end <= start) return false;
    return position >= start + ((end - start) * 0.5);
  }

  bool _isLessonCompletedByViewed(
    LessonModel lesson,
    Map<String, bool> viewedItems,
  ) {
    var totalItems = 0;
    var completedItems = 0;

    for (final segment in lesson.segments) {
      for (var index = 0; index < segment.contentItems.length; index++) {
        final item = segment.contentItems[index];
        if (!_isStudyContentItem(item)) {
          continue;
        }

        totalItems += 1;
        if (_isViewedWithAliases(viewedItems, segment, item, index)) {
          completedItems += 1;
        }
      }
    }

    return totalItems > 0 && completedItems >= totalItems;
  }

  Map<String, bool> _allStudyContentViewed(LessonModel lesson) {
    final viewedItems = <String, bool>{};

    for (final segment in lesson.segments) {
      for (var index = 0; index < segment.contentItems.length; index++) {
        final item = segment.contentItems[index];
        if (_isStudyContentItem(item)) {
          viewedItems[_contentProgressKey(segment, item, index)] = true;
          viewedItems[_contentKey(segment, index)] = true;
          if (item.originalIndex >= 0) {
            viewedItems[_contentKey(segment, item.originalIndex)] = true;
          }
        }
      }
    }

    return viewedItems;
  }

  Map<String, dynamic> _buildLessonStudyState(
    Map<String, bool> viewedItems, {
    double resumeSeconds = 0,
  }) {
    return {
      'viewedContentItems': viewedItems,
      'videoPositions': _videoPositions,
      'quizCompletions': _quizScores,
      'resumeSeconds': resumeSeconds,
    };
  }

  Future<void> _syncLessonCompletionIfNeeded(
    LessonModel lesson, {
    Map<String, bool>? viewedItems,
  }) async {
    if (_syncedCompletedLessonIds.contains(lesson.id)) {
      return;
    }

    if (!_isLessonCompletedByViewed(
      lesson,
      viewedItems ?? _viewedContentItems,
    )) {
      return;
    }

    _syncedCompletedLessonIds.add(lesson.id);
    _completedLessonIds.add(lesson.id);
    try {
      final nextViewedItems = viewedItems ?? _viewedContentItems;
      await _repo.markLessonCompleted(
        lesson.id,
        studyState: {
          ..._buildLessonStudyState(nextViewedItems),
          'lessonCompleted': true,
          'lessonCompletedAt': DateTime.now().toIso8601String(),
        },
      );
      if (mounted) {
        setState(() {
          final progress = _courseProgress;
          if (progress != null &&
              !progress.completedLessonIds.contains(lesson.id)) {
            final completedLessonIds = [
              ...progress.completedLessonIds,
              lesson.id,
            ];
            final completedLessons = completedLessonIds.length;
            _courseProgress = CourseProgressModel(
              courseId: progress.courseId,
              totalLessons: progress.totalLessons,
              completedLessons: completedLessons,
              completionPercent: progress.totalLessons > 0
                  ? (completedLessons * 100) / progress.totalLessons
                  : progress.completionPercent,
              completedLessonIds: completedLessonIds,
              resumeLessonId: progress.resumeLessonId,
              resumePositionSeconds: progress.resumePositionSeconds,
              resumeLastWatchedAt: progress.resumeLastWatchedAt,
              resumeStudyState: progress.resumeStudyState,
            );
          }
        });
      }
    } catch (_) {
      _syncedCompletedLessonIds.remove(lesson.id);
    }
  }

  void _markContentViewed(String key) {
    if (_viewedContentItems[key] == true) return;
    final nextViewedItems = {..._viewedContentItems, key: true};
    setState(() {
      _viewedContentItems = nextViewedItems;
    });
    final lessonId = _currentLessonId;
    if (lessonId != null) {
      _writeStudyState(lessonId, {
        'viewedContentItems': {key: true},
      });
    }
    final lesson = _currentLesson;
    if (lesson != null) {
      _syncLessonCompletionIfNeeded(lesson, viewedItems: nextViewedItems);
    }
  }

  Future<void> _loadStudyStateForLesson(
    LessonModel lesson, {
    bool pushToBackend = true,
    bool silent = false,
  }) async {
    final localState = await _readStudyState(lesson.id);
    Map<String, dynamic> backendState = {};
    Object? watchPositionError;
    var hasBackendWatchPosition = false;

    try {
      final watchPosition = await _repo.getLessonWatchPosition(lesson.id);
      backendState = asMap(watchPosition['studyState']);
      final backendResumeSeconds = asDouble(watchPosition['positionSeconds']);
      if (backendResumeSeconds > 0) {
        backendState['resumeSeconds'] = backendResumeSeconds;
      }
      hasBackendWatchPosition = true;
    } catch (error) {
      watchPositionError = error;
      backendState = {};
    }

    final stored = hasBackendWatchPosition
        ? backendState
        : _mergeStudyState(localState, backendState);
    final storedViewed = _boolMap(stored['viewedContentItems']);
    final storedVideos = _doubleMap(stored['videoPositions']);
    final storedQuizzes = _doubleMap(stored['quizCompletions']);
    final resumeSeconds = hasBackendWatchPosition
        ? asDouble(backendState['resumeSeconds'] ?? stored['resumeSeconds'])
        : asDouble(stored['resumeSeconds']);
    final lessonCompletedInBackend =
        stored['lessonCompleted'] == true ||
        (_courseProgress?.completedLessonIds.contains(lesson.id) ?? false);
    final nextViewed = <String, bool>{};

    if (lessonCompletedInBackend) {
      _completedLessonIds.add(lesson.id);
      nextViewed.addAll(_allStudyContentViewed(lesson));
    }

    for (final segment in lesson.segments) {
      for (var index = 0; index < segment.contentItems.length; index++) {
        final item = segment.contentItems[index];
        if (!_isStudyContentItem(item)) {
          continue;
        }

        final key = _contentProgressKey(segment, item, index);
        final canonicalKey = _contentKey(segment, index);
        final originalKey = item.originalIndex >= 0
            ? _contentKey(segment, item.originalIndex)
            : canonicalKey;

        if (_isViewedWithAliases(nextViewed, segment, item, index)) {
          continue;
        }

        if (_isViewedWithAliases(storedViewed, segment, item, index)) {
          _markViewedAliases(nextViewed, segment, item, index);
          continue;
        }

        if (item.isVideo) {
          final start = (item.startTime ?? 0).toDouble();
          final end = (item.endTime ?? 0).toDouble();
          final canUseResumeSeconds =
              resumeSeconds > start && (end <= start || resumeSeconds <= end);
          final savedVideoPosition = _valueWithAliases(
            storedVideos,
            segment,
            item,
            index,
          );
          final videoPosition = savedVideoPosition > 0
              ? savedVideoPosition
              : (canUseResumeSeconds ? resumeSeconds : 0.0);
          if (videoPosition > 0) {
            storedVideos[key] = videoPosition;
            storedVideos[canonicalKey] = videoPosition;
            storedVideos[originalKey] = videoPosition;
          }

          if (_videoReachedHalf(videoPosition, item.startTime, item.endTime)) {
            _markViewedAliases(nextViewed, segment, item, index);
          }
        } else if (item.isQuiz) {
          var quizScore = _valueWithAliases(
            storedQuizzes,
            segment,
            item,
            index,
          );
          if (quizScore < 50 && item.quizId > 0) {
            try {
              final latestAttempt = await _repo.getLatestQuizAttempt(
                item.quizId,
              );
              quizScore = latestAttempt?.totalScore.toDouble() ?? quizScore;
              if (quizScore > 0) {
                storedQuizzes[key] = quizScore;
                storedQuizzes[canonicalKey] = quizScore;
                storedQuizzes[originalKey] = quizScore;
              }
            } catch (_) {}
          }

          if (quizScore >= 50) {
            _markViewedAliases(nextViewed, segment, item, index);
          }
        } else if (_isViewedWithAliases(storedViewed, segment, item, index)) {
          _markViewedAliases(nextViewed, segment, item, index);
        }
      }
    }

    if (!mounted) return;
    if (!silent && watchPositionError != null && localState.isEmpty) {
      showSnack(
        context,
        'ChÆ°a láº¥y Ä‘Æ°á»£c tiáº¿n Ä‘á»™ tá»« backend: ${safeError(watchPositionError)}',
      );
    }

    setState(() {
      _viewedContentItems = nextViewed;
      _videoPositions = storedVideos;
      _quizScores = storedQuizzes;
      if (lessonCompletedInBackend) {
        _completedLessonIds.add(lesson.id);
      }
    });

    final nextStudyState = {
      ...stored,
      'viewedContentItems': {...storedViewed, ...nextViewed},
      'videoPositions': storedVideos,
      'quizCompletions': storedQuizzes,
      'resumeSeconds': resumeSeconds,
      if (lessonCompletedInBackend ||
          _isLessonCompletedByViewed(lesson, {...storedViewed, ...nextViewed}))
        'lessonCompleted': true,
      'updatedAt': DateTime.now().toIso8601String(),
    };

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      await _studyStateKey(lesson.id),
      jsonEncode(nextStudyState),
    );

    if (pushToBackend) {
      try {
        await _repo.saveLessonWatchPosition(
          lesson.id,
          positionSeconds: resumeSeconds,
          studyState: Map<String, dynamic>.from(nextStudyState),
        );
      } catch (_) {}
    }

    await _syncLessonCompletionIfNeeded(lesson, viewedItems: nextViewed);
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = '';
      _currentLesson = null;
      _currentLessonId = null;
    });

    try {
      final user = await _repo.validateOrRefreshSession();
      if (user == null) {
        throw ApiException(
          'Phien dang nhap app khong hop le. Hay dang nhap lai dung tai khoan hoc vien da hoc tren web.',
        );
      }

      final detail = await _repo.getCourseDetail(widget.courseId);

      if (!mounted) return;

      setState(() {
        _detail = detail;
        _currentUser = user;
      });

      var initialLessonId = widget.initialLessonId;
      try {
        final progress = await _repo.getCourseProgress(widget.courseId);
        _courseProgress = progress;
        _completedLessonIds
          ..clear()
          ..addAll(progress.completedLessonIds);
        _syncedCompletedLessonIds
          ..clear()
          ..addAll(progress.completedLessonIds);
        if (initialLessonId == null) {
          final hasResumeLesson = detail.lessons.any(
            (lesson) => lesson.id == progress.resumeLessonId,
          );
          if (hasResumeLesson) {
            initialLessonId = progress.resumeLessonId;
          }
        }
      } catch (_) {}

      initialLessonId ??= detail.lessons.isNotEmpty
          ? detail.lessons.first.id
          : null;

      if (initialLessonId != null) {
        await _selectLesson(initialLessonId);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = safeError(e);
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _selectLesson(int lessonId) async {
    setState(() {
      _lessonLoading = true;
      _currentLessonId = lessonId;
      _currentLesson = null;
    });

    try {
      try {
        final progress = await _repo.getCourseProgress(widget.courseId);
        _courseProgress = progress;
        _completedLessonIds
          ..clear()
          ..addAll(progress.completedLessonIds);
        _syncedCompletedLessonIds
          ..clear()
          ..addAll(progress.completedLessonIds);
      } catch (_) {}

      final lesson = await _repo.getLessonDetail(lessonId);
      await _loadStudyStateForLesson(lesson);

      if (!mounted) return;

      setState(() {
        _currentLesson = lesson;
      });

      Future.delayed(const Duration(milliseconds: 250), () {
        if (_scrollController.hasClients) {
          _scrollController.animateTo(
            420,
            duration: const Duration(milliseconds: 450),
            curve: Curves.easeOut,
          );
        }
      });
    } catch (e) {
      if (mounted) {
        showSnack(context, safeError(e));
      }
    } finally {
      if (mounted) {
        setState(() {
          _lessonLoading = false;
        });
      }
    }
  }

  Future<void> _markCompleted() async {
    final lesson = _currentLesson;

    if (lesson == null || _marking) return;

    setState(() {
      _marking = true;
    });

    try {
      final viewedItems = _allStudyContentViewed(lesson);
      await _repo.markLessonCompleted(
        lesson.id,
        studyState: {
          ..._buildLessonStudyState(viewedItems),
          'lessonCompleted': true,
          'lessonCompletedAt': DateTime.now().toIso8601String(),
        },
      );
      await _writeStudyState(lesson.id, {
        'viewedContentItems': viewedItems,
        'lessonCompleted': true,
        'lessonCompletedAt': DateTime.now().toIso8601String(),
      });

      if (!mounted) return;

      setState(() {
        _viewedContentItems = {..._viewedContentItems, ...viewedItems};
        _completedLessonIds.add(lesson.id);
      });

      showSnack(context, 'Đã đánh dấu hoàn thành bài học');
    } catch (e) {
      if (mounted) {
        showSnack(context, safeError(e));
      }
    } finally {
      if (mounted) {
        setState(() {
          _marking = false;
        });
      }
    }
  }

  Future<void> _openDocumentUrl(String rawUrl) async {
    final url = AppConfig.fullFileUrl(rawUrl);
    final uri = Uri.tryParse(url);

    if (uri == null) {
      showSnack(context, 'Đường dẫn tài liệu không hợp lệ');
      return;
    }

    final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);

    if (!opened && mounted) {
      showSnack(context, 'Không mở được tài liệu');
    }
  }

  Future<void> _openVideoInApp({
    required String title,
    required String videoUrl,
    String description = '',
    String? progressKey,
    int? startTime,
    int? endTime,
  }) async {
    final finalUrl = AppConfig.fullFileUrl(videoUrl).trim();

    if (finalUrl.isEmpty) {
      showSnack(context, 'Phần video này chưa có đường dẫn video');
      return;
    }

    final savedPosition = progressKey == null
        ? 0.0
        : (_videoPositions[progressKey] ?? 0);
    final start = startTime?.toDouble() ?? 0;
    final end = endTime?.toDouble() ?? 0;
    final resumeAt =
        savedPosition > start && (end <= start || savedPosition <= end)
        ? savedPosition
        : start;

    final watchedSeconds = await Navigator.of(context).push<double>(
      MaterialPageRoute(
        builder: (_) => YoutubeLearningScreen(
          title: title,
          videoUrl: finalUrl,
          startSeconds: resumeAt,
          endSeconds: endTime?.toDouble(),
          onPositionChanged: progressKey == null
              ? null
              : (seconds) {
                  _persistVideoProgress(
                    progressKey: progressKey,
                    watchedSeconds: seconds,
                    startTime: startTime,
                    endTime: endTime,
                  );
                },
        ),
      ),
    );

    if (progressKey == null || watchedSeconds == null) return;

    final nextPosition = end > start
        ? watchedSeconds.clamp(start, end).toDouble()
        : watchedSeconds;
    final completed = _videoReachedHalf(nextPosition, startTime, endTime);

    setState(() {
      _videoPositions = {..._videoPositions, progressKey: nextPosition};
      if (completed) {
        _viewedContentItems = {..._viewedContentItems, progressKey: true};
      }
    });

    final lessonId = _currentLessonId;
    if (lessonId != null) {
      await _writeStudyState(lessonId, {
        'videoPositions': {progressKey: nextPosition},
        if (completed) 'viewedContentItems': {progressKey: true},
        'resumeSeconds': nextPosition,
      });
    }
    final lesson = _currentLesson;
    if (lesson != null && completed) {
      await _syncLessonCompletionIfNeeded(lesson);
    }
  }

  Future<void> _persistVideoProgress({
    required String progressKey,
    required double watchedSeconds,
    int? startTime,
    int? endTime,
  }) async {
    final start = startTime?.toDouble() ?? 0;
    final end = endTime?.toDouble() ?? 0;
    final nextPosition = end > start
        ? watchedSeconds.clamp(start, end).toDouble()
        : watchedSeconds;
    final previousPosition = _videoPositions[progressKey] ?? 0;

    if (nextPosition <= previousPosition) {
      return;
    }

    final completed = _videoReachedHalf(nextPosition, startTime, endTime);
    if (mounted) {
      setState(() {
        _videoPositions = {..._videoPositions, progressKey: nextPosition};
        if (completed) {
          _viewedContentItems = {..._viewedContentItems, progressKey: true};
        }
      });
    } else {
      _videoPositions = {..._videoPositions, progressKey: nextPosition};
      if (completed) {
        _viewedContentItems = {..._viewedContentItems, progressKey: true};
      }
    }

    final lessonId = _currentLessonId;
    if (lessonId != null) {
      await _writeStudyState(lessonId, {
        'videoPositions': {progressKey: nextPosition},
        if (completed) 'viewedContentItems': {progressKey: true},
        'resumeSeconds': nextPosition,
      });
    }

    final lesson = _currentLesson;
    if (lesson != null && completed) {
      await _syncLessonCompletionIfNeeded(lesson);
    }
  }

  void _openContentItem(
    LessonSegmentModel segment,
    int itemIndex,
    ContentItemModel item,
  ) {
    final lesson = _currentLesson;
    final progressKey = _contentProgressKey(segment, item, itemIndex);

    if (item.isQuiz && item.quizId > 0) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => QuizScreen(
            quizId: item.quizId,
            onSubmitted: (result) {
              final score = result.totalScore.toDouble();
              setState(() {
                _quizScores = {..._quizScores, progressKey: score};
                if (score >= 50) {
                  _viewedContentItems = {
                    ..._viewedContentItems,
                    progressKey: true,
                  };
                }
              });
              final lessonId = _currentLessonId;
              if (lessonId != null && score >= 50) {
                _writeStudyState(lessonId, {
                  'viewedContentItems': {progressKey: true},
                  'quizCompletions': {progressKey: score},
                });
                final lesson = _currentLesson;
                if (lesson != null) {
                  _syncLessonCompletionIfNeeded(lesson);
                }
              } else if (lessonId != null) {
                _writeStudyState(lessonId, {
                  'quizCompletions': {progressKey: score},
                });
              }
            },
          ),
        ),
      );
      return;
    }

    if (item.isVideo) {
      final videoUrl = item.url.trim().isNotEmpty
          ? item.url.trim()
          : lesson?.videoUrl.trim() ?? '';

      _openVideoInApp(
        title: item.title,
        description: item.text,
        videoUrl: videoUrl,
        progressKey: progressKey,
        startTime: item.startTime,
        endTime: item.endTime,
      );

      return;
    }

    if (item.isDocument && item.url.trim().isNotEmpty) {
      _markContentViewed(progressKey);
      _openDocumentUrl(item.url);
      return;
    }

    _markContentViewed(progressKey);
    _showContentDetail(item);
  }

  void _showContentDetail(ContentItemModel item) {
    final content = item.text.trim().isNotEmpty
        ? item.text.trim()
        : item.type == 'question'
        ? 'Phần câu hỏi ôn tập của bài học. Giáo viên chưa nhập nội dung chi tiết cho mục này.'
        : 'Nội dung này hiện chưa có dữ liệu chi tiết.';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.72,
          minChildSize: 0.36,
          maxChildSize: 0.92,
          builder: (context, scrollController) {
            return Container(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: ListView(
                controller: scrollController,
                children: [
                  Center(
                    child: Container(
                      width: 46,
                      height: 5,
                      decoration: BoxDecoration(
                        color: const Color(0xFFE2E8F0),
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      CourseThumb(size: 50, icon: _iconForItem(item)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.title,
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w900,
                                color: AppColors.ink,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _labelForType(item.type),
                              style: const TextStyle(
                                color: AppColors.muted,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppColors.line),
                    ),
                    child: Text(
                      content,
                      style: const TextStyle(
                        fontSize: 16,
                        height: 1.55,
                        color: Color(0xFF334155),
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.check_rounded),
                      label: const Text('Đã hiểu'),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: LoadingView());
    }

    if (_error.isNotEmpty) {
      return Scaffold(
        appBar: AppBar(),
        body: ErrorView(message: _error, onRetry: _load),
      );
    }

    final detail = _detail!;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          detail.course.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          controller: _scrollController,
          padding: const EdgeInsets.all(16),
          children: [
            _courseHeader(detail),
            const SizedBox(height: 18),

            const SectionTitle(
              'Danh sách bài học',
              subtitle: 'Học viên chọn bài học muốn học trước',
            ),
            const SizedBox(height: 10),
            _lessonList(detail),

            const SizedBox(height: 22),
            const SectionTitle(
              'Nội dung bài học',
              subtitle: 'Chỉ hiển thị sau khi học viên chọn bài học',
            ),
            const SizedBox(height: 10),
            _selectedLessonContent(),
          ],
        ),
      ),
    );
  }

  Widget _courseHeader(CourseDetailModel detail) {
    return AppCard(
      padding: const EdgeInsets.all(18),
      child: Row(
        children: [
          const CourseThumb(size: 58, icon: Icons.school_rounded),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  detail.course.title,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Chọn bài học bên dưới để bắt đầu học nội dung.',
                  style: const TextStyle(color: AppColors.muted, height: 1.35),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _lessonList(CourseDetailModel detail) {
    if (detail.lessons.isEmpty) {
      return const AppCard(
        child: EmptyView(
          message: 'Khóa học chưa có bài học.',
          icon: Icons.menu_book_outlined,
        ),
      );
    }

    if (detail.chapters.isEmpty) {
      return AppCard(
        padding: EdgeInsets.zero,
        child: Column(children: detail.lessons.map(_lessonTile).toList()),
      );
    }

    return Column(
      children: detail.chapters.map((chapter) {
        final lessons = detail.lessons
            .where((lesson) => lesson.chapterId == chapter.id)
            .toList();

        return AppCard(
          margin: const EdgeInsets.only(bottom: 12),
          padding: EdgeInsets.zero,
          child: ExpansionTile(
            initiallyExpanded: lessons.any(
              (lesson) => lesson.id == _currentLessonId,
            ),
            leading: const Icon(
              Icons.folder_open_rounded,
              color: AppColors.primary,
            ),
            title: Text(
              chapter.title,
              style: const TextStyle(fontWeight: FontWeight.w900),
            ),
            subtitle: Text('${lessons.length} bài học'),
            children: lessons.isEmpty
                ? [const ListTile(title: Text('Chưa có bài học'))]
                : lessons.map(_lessonTile).toList(),
          ),
        );
      }).toList(),
    );
  }

  Widget _lessonTile(LessonModel lesson) {
    final selected = lesson.id == _currentLessonId;
    final completed = _completedLessonIds.contains(lesson.id);

    return ListTile(
      selected: selected,
      selectedTileColor: const Color(0xFFEFF6FF),
      leading: CircleAvatar(
        backgroundColor: completed
            ? Colors.green
            : selected
            ? AppColors.primary
            : const Color(0xFFEFF6FF),
        child: Icon(
          completed
              ? Icons.check_rounded
              : selected
              ? Icons.play_arrow_rounded
              : Icons.play_circle_outline_rounded,
          color: completed || selected ? Colors.white : AppColors.primary,
        ),
      ),
      title: Text(
        lesson.title,
        style: TextStyle(
          fontWeight: selected ? FontWeight.w900 : FontWeight.w700,
          color: completed
              ? Colors.green
              : selected
              ? AppColors.primary
              : AppColors.ink,
        ),
      ),
      subtitle: Text(
        lesson.videoUrl.isNotEmpty
            ? 'Có video bài học'
            : 'Bấm để xem nội dung bài học',
      ),
      trailing: completed
          ? const Icon(Icons.check_circle_rounded, color: Colors.green)
          : selected
          ? const Icon(Icons.play_arrow_rounded, color: AppColors.primary)
          : const Icon(Icons.chevron_right_rounded),
      onTap: () => _selectLesson(lesson.id),
    );
  }

  Widget _selectedLessonContent() {
    if (_lessonLoading) {
      return const AppCard(
        child: LoadingView(message: 'Đang tải nội dung bài học...'),
      );
    }

    final lesson = _currentLesson;

    if (lesson == null) {
      return const AppCard(
        child: EmptyView(
          message:
              'Bạn chưa chọn bài học. Hãy chọn một bài học trong danh sách phía trên.',
          icon: Icons.touch_app_rounded,
        ),
      );
    }

    return AppCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const CourseThumb(
                size: 52,
                icon: Icons.play_circle_outline_rounded,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  lesson.title,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: AppColors.ink,
                  ),
                ),
              ),
            ],
          ),

          if (lesson.content.trim().isNotEmpty) ...[
            const SizedBox(height: 18),
            const Text(
              'Mô tả bài học',
              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 17),
            ),
            const SizedBox(height: 8),
            Text(
              lesson.content,
              style: const TextStyle(height: 1.48, color: AppColors.muted),
            ),
          ],

          if (lesson.videoUrl.isNotEmpty) ...[
            const SizedBox(height: 18),
            _VideoBox(
              onOpen: () {
                _openVideoInApp(
                  title: lesson.title,
                  description: lesson.content,
                  videoUrl: lesson.videoUrl,
                  progressKey: 'lesson-video',
                );
              },
            ),
          ],

          const SizedBox(height: 22),
          const Text(
            'Các phần học',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 10),

          if (lesson.segments.isEmpty)
            const EmptyView(
              message: 'Bài học này chưa có phần học.',
              icon: Icons.segment_rounded,
            )
          else
            ...lesson.segments.map((segment) => _segmentView(lesson, segment)),

          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: _marking ? null : _markCompleted,
              icon: _marking
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : const Icon(Icons.check_circle_outline),
              label: const Text('Đánh dấu đã học xong'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _segmentView(LessonModel lesson, LessonSegmentModel segment) {
    final visibleEntries = segment.contentItems
        .asMap()
        .entries
        .where((entry) => _isStudyContentItem(entry.value))
        .toList();
    final totalCount = visibleEntries.length;
    final completedCount = visibleEntries.where((entry) {
      return _isViewedWithAliases(
        _viewedContentItems,
        segment,
        entry.value,
        entry.key,
      );
    }).length;
    final isComplete = totalCount > 0 && completedCount >= totalCount;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.line),
        borderRadius: BorderRadius.circular(18),
        color: const Color(0xFFF8FAFC),
      ),
      child: ExpansionTile(
        initiallyExpanded: false,
        leading: const Icon(Icons.segment_rounded, color: AppColors.primary),
        title: Text(
          segment.title,
          style: const TextStyle(fontWeight: FontWeight.w900),
        ),
        subtitle: Text('$completedCount/$totalCount nội dung'),
        trailing: isComplete
            ? const Icon(Icons.check_circle_rounded, color: Colors.green)
            : null,
        children: visibleEntries.isEmpty
            ? [const ListTile(title: Text('Chưa có nội dung phần học'))]
            : visibleEntries.map((entry) {
                return _contentItemView(segment, entry.key, entry.value);
              }).toList(),
      ),
    );
  }

  Widget _contentItemView(
    LessonSegmentModel segment,
    int itemIndex,
    ContentItemModel item,
  ) {
    final hasUrl = item.url.trim().isNotEmpty;
    final completed = _isViewedWithAliases(
      _viewedContentItems,
      segment,
      item,
      itemIndex,
    );

    IconData trailingIcon;

    if (item.isQuiz && item.quizId > 0) {
      trailingIcon = completed
          ? Icons.check_circle_rounded
          : Icons.chevron_right_rounded;
    } else if (item.isVideo) {
      trailingIcon = completed
          ? Icons.check_circle_rounded
          : Icons.play_circle_fill_rounded;
    } else if (item.isDocument && hasUrl) {
      trailingIcon = completed
          ? Icons.check_circle_rounded
          : Icons.open_in_new_rounded;
    } else {
      trailingIcon = completed
          ? Icons.check_circle_rounded
          : Icons.visibility_rounded;
    }

    final subtitle = item.text.trim().isNotEmpty
        ? item.text.trim()
        : item.isVideo
        ? _formatVideoTime(item)
        : _labelForType(item.type);

    return ListTile(
      leading: Icon(
        _iconForItem(item),
        color: completed ? Colors.green : AppColors.primary,
      ),
      title: Text(
        item.title,
        style: const TextStyle(fontWeight: FontWeight.w800),
      ),
      subtitle: Text(subtitle, maxLines: 2, overflow: TextOverflow.ellipsis),
      trailing: Icon(
        trailingIcon,
        color: completed ? Colors.green : AppColors.primary,
      ),
      onTap: () => _openContentItem(segment, itemIndex, item),
    );
  }

  IconData _iconForItem(ContentItemModel item) {
    switch (item.type) {
      case 'document':
        return Icons.attach_file_rounded;
      case 'videoClip':
      case 'video':
        return Icons.movie_outlined;
      case 'quiz':
        return Icons.assignment_outlined;
      case 'question':
        return Icons.help_outline_rounded;
      default:
        return Icons.notes_outlined;
    }
  }

  String _labelForType(String type) {
    switch (type) {
      case 'text':
        return 'Nội dung văn bản';
      case 'videoClip':
      case 'video':
        return 'Video bài học';
      case 'document':
        return 'Tài liệu học tập';
      case 'quiz':
        return 'Bài kiểm tra';
      case 'question':
        return 'Câu hỏi ôn tập';
      default:
        return type;
    }
  }

  String _formatVideoTime(ContentItemModel item) {
    if (item.startTime == null && item.endTime == null) {
      return 'Video bài học';
    }

    final start = item.startTime == null
        ? '--:--'
        : _formatSeconds(item.startTime!);
    final end = item.endTime == null ? '--:--' : _formatSeconds(item.endTime!);

    return '$start - $end';
  }
}

class _VideoBox extends StatelessWidget {
  const _VideoBox({required this.onOpen});

  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onOpen,
      borderRadius: BorderRadius.circular(22),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
          ),
          borderRadius: BorderRadius.circular(22),
        ),
        child: Column(
          children: [
            const Icon(
              Icons.play_circle_fill_rounded,
              color: Colors.white,
              size: 76,
            ),
            const SizedBox(height: 8),
            const Text(
              'Video bài học',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Bấm để xem video ngay trong app, không chuyển sang YouTube.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70),
            ),
            const SizedBox(height: 14),
            FilledButton.icon(
              onPressed: onOpen,
              icon: const Icon(Icons.play_arrow_rounded),
              label: const Text('Xem video'),
            ),
          ],
        ),
      ),
    );
  }
}

String _formatSeconds(int seconds) {
  final safe = seconds < 0 ? 0 : seconds;

  final h = safe ~/ 3600;
  final m = (safe % 3600) ~/ 60;
  final s = safe % 60;

  if (h > 0) {
    return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
}
