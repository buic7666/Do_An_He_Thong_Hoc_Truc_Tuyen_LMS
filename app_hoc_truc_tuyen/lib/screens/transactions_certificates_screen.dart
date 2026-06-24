import 'package:flutter/material.dart';

import '../core/helpers.dart';
import '../models/course_model.dart';
import '../services/lms_repository.dart';
import '../widgets/app_widgets.dart';
import 'learning_screen.dart';

class TransactionsCertificatesScreen extends StatefulWidget {
  const TransactionsCertificatesScreen({super.key});

  @override
  State<TransactionsCertificatesScreen> createState() => _TransactionsCertificatesScreenState();
}

class _TransactionsCertificatesScreenState extends State<TransactionsCertificatesScreen> with SingleTickerProviderStateMixin {
  final _repo = LmsRepository();
  late final TabController _tabController;

  bool _loading = true;
  String _error = '';
  List<EnrollmentModel> _enrollments = [];
  final Map<int, CourseProgressModel> _progress = {};

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = '';
    });

    try {
      final enrollments = await _repo.getMyEnrollments();
      final progressMap = <int, CourseProgressModel>{};
      for (final item in enrollments) {
        try {
          progressMap[item.courseId] = await _repo.getCourseProgress(item.courseId);
        } catch (_) {
          progressMap[item.courseId] = CourseProgressModel.empty(item.courseId);
        }
      }

      if (!mounted) return;
      setState(() {
        _enrollments = enrollments;
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

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(18, 18, 18, 10),
          child: HeroHeader(
            title: 'Giao dịch & chứng chỉ',
            subtitle: 'Theo dõi lịch sử đăng ký khóa học và chứng chỉ hoàn thành.',
            icon: Icons.workspace_premium_rounded,
          ),
        ),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 18),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18)),
          child: TabBar(
            controller: _tabController,
            labelColor: AppColors.primary,
            unselectedLabelColor: AppColors.muted,
            indicatorColor: AppColors.primary,
            tabs: const [
              Tab(icon: Icon(Icons.receipt_long_outlined), text: 'Giao dịch'),
              Tab(icon: Icon(Icons.workspace_premium_outlined), text: 'Chứng chỉ'),
            ],
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _load,
            child: TabBarView(
              controller: _tabController,
              children: [
                _transactionsTab(),
                _certificatesTab(),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _transactionsTab() {
    if (_enrollments.isEmpty) {
      return  ListView(
        padding: EdgeInsets.all(18),
        children: [EmptyView(message: 'Chưa có giao dịch đăng ký khóa học.', icon: Icons.receipt_long_outlined)],
      );
    }
    

    return ListView(
      padding: const EdgeInsets.all(18),
      children: _enrollments.map((item) {
        final course = item.course;
        if (course == null) return const SizedBox.shrink();
        return AppCard(
          margin: const EdgeInsets.only(bottom: 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const CourseThumb(size: 52, icon: Icons.receipt_long_outlined),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(course.title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: AppColors.ink)),
                        const SizedBox(height: 4),
                        Text(item.createdAt.isEmpty ? 'Đăng ký khóa học' : 'Ngày đăng ký: ${item.createdAt}', style: const TextStyle(color: AppColors.muted)),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(child: TagChip(text: formatMoney(course.price), icon: Icons.payments_outlined)),
                  const SizedBox(width: 8),
                  SoftBadge(text: item.status == 'active' ? 'Đã thanh toán' : item.status, color: Colors.green, icon: Icons.check_circle_outline),
                ],
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _certificatesTab() {
    if (_enrollments.isEmpty) {
      return  ListView(
        padding: EdgeInsets.all(18),
        children: [EmptyView(message: 'Chưa có khóa học để xét chứng chỉ.', icon: Icons.workspace_premium_outlined)],
      );
    }

    return ListView(
      padding: const EdgeInsets.all(18),
      children: _enrollments.map((item) {
        final course = item.course;
        if (course == null) return const SizedBox.shrink();
        final progress = _progress[item.courseId] ?? CourseProgressModel.empty(item.courseId);
        final eligible = progress.isCompleted;

        return AppCard(
          margin: const EdgeInsets.only(bottom: 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CourseThumb(size: 54, icon: eligible ? Icons.workspace_premium_rounded : Icons.lock_outline_rounded),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(course.title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: AppColors.ink)),
                        const SizedBox(height: 4),
                        Text(
                          eligible ? 'Đủ điều kiện nhận chứng chỉ' : 'Hoàn thành toàn bộ bài học để nhận chứng chỉ',
                          style: const TextStyle(color: AppColors.muted),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              AppProgressBar(percent: progress.completionPercent, label: '${progress.completedLessons}/${progress.totalLessons} bài học hoàn thành'),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: eligible
                      ? () => _showCertificate(course)
                      : () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => LearningScreen(courseId: course.id))),
                  icon: Icon(eligible ? Icons.workspace_premium_rounded : Icons.play_arrow_rounded),
                  label: Text(eligible ? 'Xem chứng chỉ' : 'Tiếp tục học'),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  void _showCertificate(CourseModel course) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        insetPadding: const EdgeInsets.all(22),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppColors.primary.withOpacity(0.25), width: 2),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.workspace_premium_rounded, size: 74, color: AppColors.primary),
              const SizedBox(height: 12),
              const Text('CHỨNG CHỈ HOÀN THÀNH', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 22, color: AppColors.ink)),
              const SizedBox(height: 10),
              const Text('Học viên đã hoàn thành khóa học', textAlign: TextAlign.center, style: TextStyle(color: AppColors.muted)),
              const SizedBox(height: 14),
              Text(course.title, textAlign: TextAlign.center, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.primary)),
              const SizedBox(height: 20),
              FilledButton.icon(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.check_rounded), label: const Text('Đóng')),
            ],
          ),
        ),
      ),
    );
  }
}
