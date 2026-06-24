import 'package:flutter/material.dart';

import '../core/helpers.dart';
import '../models/course_model.dart';
import '../models/user_model.dart';
import '../services/lms_repository.dart';
import '../widgets/app_widgets.dart';
import 'course_detail_screen.dart';
import 'learning_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key, required this.user, required this.onOpenCatalog, required this.onOpenMyCourses, required this.onOpenHistory});

  final UserModel? user;
  final VoidCallback onOpenCatalog;
  final VoidCallback onOpenMyCourses;
  final VoidCallback onOpenHistory;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _repo = LmsRepository();
  bool _loading = true;
  String _error = '';
  List<EnrollmentModel> _enrollments = [];
  List<CourseModel> _courses = [];

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
      final result = await Future.wait([_repo.getMyEnrollments(), _repo.getCourses()]);
      if (!mounted) return;
      setState(() {
        _enrollments = result[0] as List<EnrollmentModel>;
        _courses = (result[1] as List<CourseModel>).take(6).toList();
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

    final name = widget.user?.name ?? 'Học viên';

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(18),
        children: [
          HeroHeader(
            title: 'Xin chào, $name',
            subtitle: 'Sẵn sàng tiếp tục bài học hôm nay chưa?',
            icon: Icons.auto_stories_rounded,
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              StatPill(icon: Icons.menu_book_rounded, value: '${_enrollments.length}', label: 'Đang học'),
              const SizedBox(width: 12),
              StatPill(icon: Icons.school_rounded, value: '${_courses.length}', label: 'Khóa nổi bật'),
              const SizedBox(width: 12),
              const StatPill(icon: Icons.workspace_premium_rounded, value: 'LMS', label: 'Học tập'),
            ],
          ),
          const SizedBox(height: 16),
          AppCard(
            padding: EdgeInsets.zero,
            child: ListTile(
              leading: const CourseThumb(size: 48, icon: Icons.receipt_long_outlined),
              title: const Text('Lịch sử giao dịch & chứng chỉ', style: TextStyle(fontWeight: FontWeight.w900)),
              subtitle: const Text('Xem trạng thái thanh toán và chứng chỉ hoàn thành khóa học'),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: widget.onOpenHistory,
            ),
          ),
          const SizedBox(height: 24),
          SectionTitle('Tiếp tục học', subtitle: 'Các khóa học bạn đã đăng ký', actionText: 'Xem tất cả', onAction: widget.onOpenMyCourses),
          if (_enrollments.isEmpty)
            AppCard(
              child: Column(
                children: [
                  const EmptyView(message: 'Bạn chưa đăng ký khóa học nào.', icon: Icons.menu_book_outlined),
                  FilledButton.icon(onPressed: widget.onOpenCatalog, icon: const Icon(Icons.search), label: const Text('Khám phá khóa học')),
                ],
              ),
            )
          else
            ..._enrollments.take(3).map((item) {
              final course = item.course;
              if (course == null) return const SizedBox.shrink();
              return _CourseMiniTile(
                course: course,
                badge: 'Tiếp tục học',
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => LearningScreen(courseId: course.id))),
              );
            }),
          const SizedBox(height: 24),
          SectionTitle('Khóa học nổi bật', subtitle: 'Khám phá và đăng ký học', actionText: 'Tìm kiếm', onAction: widget.onOpenCatalog),
          ..._courses.map((course) => _CourseMiniTile(
                course: course,
                badge: formatMoney(course.price),
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => CourseDetailScreen(courseId: course.id))),
              )),
        ],
      ),
    );
  }
}

class _CourseMiniTile extends StatelessWidget {
  const _CourseMiniTile({required this.course, required this.badge, required this.onTap});

  final CourseModel course;
  final String badge;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      margin: const EdgeInsets.only(bottom: 12),
      padding: EdgeInsets.zero,
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              const CourseThumb(),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(course.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppColors.ink)),
                    const SizedBox(height: 4),
                    Text(course.description.isEmpty ? 'Bấm để xem chi tiết khóa học' : course.description, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.muted, fontSize: 13)),
                    const SizedBox(height: 8),
                    TagChip(text: badge, icon: Icons.bookmark_rounded),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
            ],
          ),
        ),
      ),
    );
  }
}
