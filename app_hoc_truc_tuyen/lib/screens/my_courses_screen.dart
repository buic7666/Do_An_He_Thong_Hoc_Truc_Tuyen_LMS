import 'package:flutter/material.dart';

import '../core/helpers.dart';
import '../models/course_model.dart';
import '../services/lms_repository.dart';
import '../widgets/app_widgets.dart';
import 'learning_screen.dart';

class MyCoursesScreen extends StatefulWidget {
  const MyCoursesScreen({super.key});

  @override
  State<MyCoursesScreen> createState() => _MyCoursesScreenState();
}

class _MyCoursesScreenState extends State<MyCoursesScreen> {
  final _repo = LmsRepository();
  bool _loading = true;
  String _error = '';
  List<EnrollmentModel> _items = [];
  final Map<int, CourseProgressModel> _progress = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = '';
    });

    try {
      final data = await _repo.getMyEnrollments();
      final progressMap = <int, CourseProgressModel>{};
      for (final enrollment in data) {
        try {
          progressMap[enrollment.courseId] = await _repo.getCourseProgress(enrollment.courseId);
        } catch (_) {
          progressMap[enrollment.courseId] = CourseProgressModel.empty(enrollment.courseId);
        }
      }

      if (!mounted) return;
      setState(() {
        _items = data;
        _progress
          ..clear()
          ..addAll(progressMap);
      });
    } catch (e) {
      if (mounted) setState(() => _error = safeError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const LoadingView();
    if (_error.isNotEmpty) return ErrorView(message: _error, onRetry: _load);

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(18),
        children: [
          HeroHeader(
            title: 'Khóa học của tôi',
            subtitle: 'Bạn đang học ${_items.length} khóa học trên hệ thống.',
            icon: Icons.menu_book_rounded,
          ),
          const SizedBox(height: 18),
          if (_items.isEmpty)
            const EmptyView(message: 'Bạn chưa đăng ký khóa học nào.', icon: Icons.menu_book_outlined)
          else
            ..._items.map(_enrollmentCard),
        ],
      ),
    );
  }

  Widget _enrollmentCard(EnrollmentModel item) {
    final course = item.course;
    if (course == null) return const SizedBox.shrink();
    final progress = _progress[item.courseId] ?? CourseProgressModel.empty(item.courseId);

    return AppCard(
      margin: const EdgeInsets.only(bottom: 14),
      padding: EdgeInsets.zero,
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => LearningScreen(
              courseId: course.id,
              initialLessonId: progress.resumeLessonId > 0
                  ? progress.resumeLessonId
                  : null,
            ),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const CourseThumb(size: 62, icon: Icons.play_circle_outline_rounded),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      course.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: AppColors.ink),
                    ),
                    const SizedBox(height: 7),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        TagChip(text: item.status == 'active' ? 'Đang học' : item.status, icon: Icons.check_circle_outline),
                        TagChip(text: '${progress.completedLessons}/${progress.totalLessons} bài học', icon: Icons.done_all_rounded),
                      ],
                    ),
                    const SizedBox(height: 12),
                    AppProgressBar(
                      percent: progress.completionPercent,
                      label: 'Tiến độ học tập',
                    ),
                    const SizedBox(height: 12),
                    FilledButton.icon(
                      onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => LearningScreen(courseId: course.id))),
                      icon: const Icon(Icons.play_arrow_rounded),
                      label: const Text('Tiếp tục học'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
