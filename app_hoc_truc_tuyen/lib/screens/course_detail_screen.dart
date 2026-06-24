import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/helpers.dart';
import '../models/course_model.dart';
import '../models/quiz_model.dart';
import '../services/lms_repository.dart';
import '../widgets/app_widgets.dart';
import 'learning_screen.dart';
import 'quiz_screen.dart';

class CourseDetailScreen extends StatefulWidget {
  const CourseDetailScreen({super.key, required this.courseId});

  final int courseId;

  @override
  State<CourseDetailScreen> createState() => _CourseDetailScreenState();
}

class _CourseDetailScreenState extends State<CourseDetailScreen> {
  final _repo = LmsRepository();
  bool _loading = true;
  bool _enrolling = false;
  String _error = '';
  CourseDetailModel? _detail;
  List<EnrollmentModel> _enrollments = [];
  List<QuizModel> _quizzes = [];

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
      final detail = await _repo.getCourseDetail(widget.courseId);
      List<EnrollmentModel> enrollments = [];
      List<QuizModel> quizzes = [];
      try {
        enrollments = await _repo.getMyEnrollments();
      } catch (_) {}
      try {
        quizzes = await _repo.getQuizzesByCourse(widget.courseId);
      } catch (_) {}

      if (!mounted) return;
      setState(() {
        _detail = detail;
        _enrollments = enrollments;
        _quizzes = quizzes;
      });
    } catch (e) {
      if (mounted) setState(() => _error = safeError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  bool get _isEnrolled => _enrollments.any((item) => item.courseId == widget.courseId);

  Future<void> _showPaymentConfirm() async {
    final course = _detail!.course;
    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Xác nhận đăng ký khóa học', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
                const SizedBox(height: 10),
                Text(course.title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: AppColors.ink)),
                const SizedBox(height: 16),
                AppCard(
                  child: Column(
                    children: [
                      _payRow('Tên khóa học', course.title),
                      const Divider(),
                      _payRow('Giảng viên', course.instructorName),
                      const Divider(),
                      _payRow('Số tiền thanh toán', formatMoney(course.price), strong: true),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Với backend hiện tại, thao tác này sẽ ghi nhận đăng ký khóa học và cấp quyền truy cập ngay sau khi xác nhận.',
                  style: TextStyle(color: AppColors.muted, height: 1.4),
                ),
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: () => Navigator.pop(context, true),
                    icon: const Icon(Icons.payments_outlined),
                    label: Text(course.price <= 0 ? 'Đăng ký miễn phí' : 'Xác nhận thanh toán'),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );

    if (confirmed == true) {
      await _enroll();
    }
  }

  Widget _payRow(String label, String value, {bool strong = false}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: Text(label, style: const TextStyle(color: AppColors.muted, fontWeight: FontWeight.w700))),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: TextStyle(
              color: strong ? AppColors.primary : AppColors.ink,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _enroll() async {
    setState(() => _enrolling = true);
    try {
      await _repo.enrollCourse(widget.courseId);
      if (!mounted) return;
      showSnack(context, 'Đăng ký khóa học thành công');
      await _load();
    } on ApiException catch (e) {
      if (!mounted) return;
      if (e.statusCode == 409 || e.message.toLowerCase().contains('already')) {
        showSnack(context, 'Bạn đã đăng ký khóa học này rồi');
        await _load();
      } else {
        showSnack(context, e.message);
      }
    } catch (e) {
      if (mounted) showSnack(context, safeError(e));
    } finally {
      if (mounted) setState(() => _enrolling = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: LoadingView());
    if (_error.isNotEmpty) return Scaffold(appBar: AppBar(), body: ErrorView(message: _error, onRetry: _load));

    final detail = _detail!;
    final course = detail.course;

    return Scaffold(
      appBar: AppBar(title: const Text('Chi tiết khóa học')),
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
          decoration: const BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: AppColors.line))),
          child: FilledButton.icon(
            onPressed: _enrolling
                ? null
                : _isEnrolled
                    ? () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => LearningScreen(courseId: course.id)))
                    : _showPaymentConfirm,
            icon: _enrolling
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : Icon(_isEnrolled ? Icons.play_arrow_rounded : Icons.add_circle_outline),
            label: Text(_isEnrolled ? 'Vào học ngay' : 'Đăng ký và thanh toán'),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(18),
          children: [
            HeroHeader(title: course.title, subtitle: 'Giảng viên: ${course.instructorName}', icon: Icons.school_rounded),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                TagChip(text: formatMoney(course.price), icon: Icons.payments_outlined),
                TagChip(text: '${detail.lessons.length} bài học', icon: Icons.play_lesson_outlined),
                TagChip(text: '${detail.chapters.length} chương', icon: Icons.account_tree_outlined),
                TagChip(text: course.category, icon: Icons.category_outlined),
                TagChip(text: _isEnrolled ? 'Đã đăng ký' : 'Chưa đăng ký', icon: _isEnrolled ? Icons.verified_outlined : Icons.lock_open_outlined),
              ],
            ),
            const SizedBox(height: 22),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionTitle('Mô tả khóa học'),
                  Text(course.description.isEmpty ? 'Chưa có mô tả.' : course.description, style: const TextStyle(height: 1.45, color: AppColors.muted)),
                ],
              ),
            ),
            const SizedBox(height: 22),
            const SectionTitle('Nội dung khóa học', subtitle: 'Chương, bài học và phần học'),
            if (detail.lessons.isEmpty)
              const EmptyView(message: 'Khóa học chưa có bài học.')
            else if (detail.chapters.isEmpty)
              ...detail.lessons.map((lesson) => _lessonTile(course.id, lesson))
            else
              ...detail.chapters.map((chapter) {
                final lessons = detail.lessons.where((lesson) => lesson.chapterId == chapter.id).toList();
                return AppCard(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: EdgeInsets.zero,
                  child: ExpansionTile(
                    initiallyExpanded: true,
                    leading: const Icon(Icons.folder_open_rounded, color: AppColors.primary),
                    title: Text(chapter.title, style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.ink)),
                    subtitle: Text('${lessons.length} bài học'),
                    children: lessons.isEmpty
                        ? [const ListTile(title: Text('Chưa có bài học trong chương này'))]
                        : lessons.map((lesson) => _lessonTile(course.id, lesson)).toList(),
                  ),
                );
              }),
            const SizedBox(height: 22),
            const SectionTitle('Bài kiểm tra', subtitle: 'Làm bài sau khi đăng ký khóa học'),
            if (_quizzes.isEmpty)
              const AppCard(child: Text('Chưa có bài kiểm tra.', style: TextStyle(color: AppColors.muted)))
            else
              ..._quizzes.map((quiz) => AppCard(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: EdgeInsets.zero,
                    child: ListTile(
                      leading: const CourseThumb(size: 48, icon: Icons.assignment_outlined),
                      title: Text(quiz.title, style: const TextStyle(fontWeight: FontWeight.w900)),
                      subtitle: Text('Điểm đạt: ${quiz.passScore} - Thời gian: ${quiz.duration} phút'),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: _isEnrolled
                          ? () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => QuizScreen(quizId: quiz.id)))
                          : () => showSnack(context, 'Bạn cần đăng ký khóa học trước khi làm bài kiểm tra'),
                    ),
                  )),
            const SizedBox(height: 80),
          ],
        ),
      ),
    );
  }

  Widget _lessonTile(int courseId, LessonModel lesson) {
    return ListTile(
      leading: Icon(_isEnrolled ? Icons.play_circle_outline_rounded : Icons.lock_outline_rounded, color: _isEnrolled ? AppColors.primary : AppColors.muted),
      title: Text(lesson.title, style: const TextStyle(fontWeight: FontWeight.w800)),
      subtitle: Text('Bài ${lesson.orderIndex <= 0 ? '' : lesson.orderIndex}'.trim()),
      trailing: const Icon(Icons.chevron_right_rounded),
      onTap: _isEnrolled
          ? () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => LearningScreen(courseId: courseId, initialLessonId: lesson.id)))
          : () => showSnack(context, 'Bạn cần đăng ký khóa học trước khi học bài'),
    );
  }
}
