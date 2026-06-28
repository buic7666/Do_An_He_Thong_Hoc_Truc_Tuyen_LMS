import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/app_config.dart';
import '../core/helpers.dart';
import '../models/course_model.dart';
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

class _LearningScreenState extends State<LearningScreen> {
  final LmsRepository _repo = LmsRepository();
  final ScrollController _scrollController = ScrollController();

  bool _loading = true;
  bool _lessonLoading = false;
  bool _marking = false;

  String _error = '';

  CourseDetailModel? _detail;
  LessonModel? _currentLesson;
  int? _currentLessonId;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = '';
      _currentLesson = null;
      _currentLessonId = null;
    });

    try {
      final detail = await _repo.getCourseDetail(widget.courseId);

      if (!mounted) return;

      setState(() {
        _detail = detail;
      });

      if (widget.initialLessonId != null) {
        await _selectLesson(widget.initialLessonId!);
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
      final lesson = await _repo.getLessonDetail(lessonId);

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
      await _repo.markLessonCompleted(lesson.id);

      if (!mounted) return;

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

    final opened = await launchUrl(
      uri,
      mode: LaunchMode.externalApplication,
    );

    if (!opened && mounted) {
      showSnack(context, 'Không mở được tài liệu');
    }
  }

  void _openVideoInApp({
    required String title,
    required String videoUrl,
    String description = '',
    int? startTime,
    int? endTime,
  }) {
    final finalUrl = AppConfig.fullFileUrl(videoUrl).trim();

    if (finalUrl.isEmpty) {
      showSnack(context, 'Phần video này chưa có đường dẫn video');
      return;
    }

    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => YoutubeLearningScreen(
          title: title,
          videoUrl: finalUrl,
          startSeconds: startTime?.toDouble(),
          endSeconds: endTime?.toDouble(),
        ),  
      ),
    );
  }

  void _openContentItem(ContentItemModel item) {
    final lesson = _currentLesson;

    if (item.isQuiz && item.quizId > 0) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => QuizScreen(quizId: item.quizId),
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
        startTime: item.startTime,
        endTime: item.endTime,
      );

      return;
    }

    if (item.isDocument && item.url.trim().isNotEmpty) {
      _openDocumentUrl(item.url);
      return;
    }

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
                borderRadius: BorderRadius.vertical(
                  top: Radius.circular(28),
                ),
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
                      CourseThumb(
                        size: 50,
                        icon: _iconForItem(item),
                      ),
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
      return const Scaffold(
        body: LoadingView(),
      );
    }

    if (_error.isNotEmpty) {
      return Scaffold(
        appBar: AppBar(),
        body: ErrorView(
          message: _error,
          onRetry: _load,
        ),
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
          const CourseThumb(
            size: 58,
            icon: Icons.school_rounded,
          ),
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
                  style: const TextStyle(
                    color: AppColors.muted,
                    height: 1.35,
                  ),
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
        child: Column(
          children: detail.lessons.map(_lessonTile).toList(),
        ),
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
              style: const TextStyle(
                fontWeight: FontWeight.w900,
              ),
            ),
            subtitle: Text('${lessons.length} bài học'),
            children: lessons.isEmpty
                ? [
                    const ListTile(
                      title: Text('Chưa có bài học'),
                    ),
                  ]
                : lessons.map(_lessonTile).toList(),
          ),
        );
      }).toList(),
    );
  }

  Widget _lessonTile(LessonModel lesson) {
    final selected = lesson.id == _currentLessonId;

    return ListTile(
      selected: selected,
      selectedTileColor: const Color(0xFFEFF6FF),
      leading: CircleAvatar(
        backgroundColor:
            selected ? AppColors.primary : const Color(0xFFEFF6FF),
        child: Icon(
          selected
              ? Icons.play_arrow_rounded
              : Icons.play_circle_outline_rounded,
          color: selected ? Colors.white : AppColors.primary,
        ),
      ),
      title: Text(
        lesson.title,
        style: TextStyle(
          fontWeight: selected ? FontWeight.w900 : FontWeight.w700,
          color: selected ? AppColors.primary : AppColors.ink,
        ),
      ),
      subtitle: Text(
        lesson.videoUrl.isNotEmpty
            ? 'Có video bài học'
            : 'Bấm để xem nội dung bài học',
      ),
      trailing: selected
          ? const Icon(
              Icons.check_circle_rounded,
              color: AppColors.primary,
            )
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
          message: 'Bạn chưa chọn bài học. Hãy chọn một bài học trong danh sách phía trên.',
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
              style: TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 17,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              lesson.content,
              style: const TextStyle(
                height: 1.48,
                color: AppColors.muted,
              ),
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
                );
              },
            ),
          ],

          const SizedBox(height: 22),
          const Text(
            'Các phần học',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 10),

          if (lesson.segments.isEmpty)
            const EmptyView(
              message: 'Bài học này chưa có phần học.',
              icon: Icons.segment_rounded,
            )
          else
            ...lesson.segments.map(_segmentView),

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

  Widget _segmentView(LessonSegmentModel segment) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.line),
        borderRadius: BorderRadius.circular(18),
        color: const Color(0xFFF8FAFC),
      ),
      child: ExpansionTile(
        initiallyExpanded: false,
        leading: const Icon(
          Icons.segment_rounded,
          color: AppColors.primary,
        ),
        title: Text(
          segment.title,
          style: const TextStyle(
            fontWeight: FontWeight.w900,
          ),
        ),
        subtitle: Text('${segment.contentItems.length} nội dung'),
        children: segment.contentItems.isEmpty
            ? [
                const ListTile(
                  title: Text('Chưa có nội dung phần học'),
                ),
              ]
            : segment.contentItems.map(_contentItemView).toList(),
      ),
    );
  }

  Widget _contentItemView(ContentItemModel item) {
    final hasUrl = item.url.trim().isNotEmpty;

    IconData trailingIcon;

    if (item.isQuiz && item.quizId > 0) {
      trailingIcon = Icons.chevron_right_rounded;
    } else if (item.isVideo) {
      trailingIcon = Icons.play_circle_fill_rounded;
    } else if (item.isDocument && hasUrl) {
      trailingIcon = Icons.open_in_new_rounded;
    } else {
      trailingIcon = Icons.visibility_rounded;
    }

    final subtitle = item.text.trim().isNotEmpty
        ? item.text.trim()
        : item.isVideo
            ? _formatVideoTime(item)
            : _labelForType(item.type);

    return ListTile(
      leading: Icon(
        _iconForItem(item),
        color: AppColors.primary,
      ),
      title: Text(
        item.title,
        style: const TextStyle(
          fontWeight: FontWeight.w800,
        ),
      ),
      subtitle: Text(
        subtitle,
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
      ),
      trailing: Icon(
        trailingIcon,
        color: AppColors.primary,
      ),
      onTap: () => _openContentItem(item),
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

    final start =
        item.startTime == null ? '--:--' : _formatSeconds(item.startTime!);
    final end = item.endTime == null ? '--:--' : _formatSeconds(item.endTime!);

    return '$start - $end';
  }
}

class _VideoBox extends StatelessWidget {
  const _VideoBox({
    required this.onOpen,
  });

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
            colors: [
              Color(0xFF0F172A),
              Color(0xFF1E293B),
            ],
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