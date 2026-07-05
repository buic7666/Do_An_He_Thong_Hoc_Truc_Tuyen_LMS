import 'package:flutter/material.dart';

import '../core/helpers.dart';
import '../models/quiz_model.dart';
import '../services/lms_repository.dart';
import '../widgets/app_widgets.dart';

class QuizScreen extends StatefulWidget {
  const QuizScreen({super.key, required this.quizId, this.onSubmitted});

  final int quizId;
  final ValueChanged<QuizAttemptResult>? onSubmitted;

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  final _repo = LmsRepository();
  bool _loading = true;
  bool _submitting = false;
  String _error = '';
  QuizModel? _quiz;
  QuizAttemptResult? _result;
  QuizAttemptResult? _latestAttempt;
  final Map<int, dynamic> _rawAnswers = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = '';
      _result = null;
      _rawAnswers.clear();
    });

    try {
      try {
        _latestAttempt = await _repo.getLatestQuizAttempt(widget.quizId);
      } catch (_) {}
      try {
        await _repo.startQuiz(widget.quizId);
      } catch (_) {
        // Nếu đã hết lượt hoặc còn attempt cũ, vẫn tải đề để học viên xem.
      }
      final quiz = await _repo.getQuizDetail(widget.quizId);
      if (mounted) setState(() => _quiz = quiz);
    } catch (e) {
      if (mounted) setState(() => _error = safeError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _submit() async {
    final quiz = _quiz;
    if (quiz == null) return;
    if (quiz.questions.isNotEmpty &&
        _rawAnswers.length < quiz.questions.length) {
      showSnack(context, 'Bạn chưa trả lời hết câu hỏi');
      return;
    }

    final answers = <String, dynamic>{};
    for (final question in quiz.questions) {
      final value = _rawAnswers[question.id];
      answers['${question.id}'] = {
        'type': question.type,
        'value': _toBackendAnswer(question, value),
      };
    }

    setState(() => _submitting = true);
    try {
      final result = await _repo.submitQuiz(quiz.id, answers);
      if (!mounted) return;
      setState(() {
        _result = result;
        _latestAttempt = result;
      });
      widget.onSubmitted?.call(result);
      showSnack(context, 'Nộp bài thành công. Điểm: ${result.totalScore}');
    } catch (e) {
      if (mounted) showSnack(context, safeError(e));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  dynamic _toBackendAnswer(QuestionModel question, dynamic value) {
    final type = question.type;
    if (type == 'MULTIPLE_CHOICE' || type == 'MULTICHOICE') {
      return {
        'indices': [asInt(value)],
      };
    }
    if (type == 'TRUE_FALSE') {
      return {'value': value == true};
    }
    if (type == 'SHORT_ANSWER' || type == 'ESSAY') {
      return {'text': asString(value)};
    }
    if (type == 'CLOZE') {
      return value is Map<String, dynamic> ? value : <String, dynamic>{};
    }
    return {'text': asString(value)};
  }

  @override
  Widget build(BuildContext context) {
    if (_loading)
      return const Scaffold(
        body: LoadingView(message: 'Đang tải bài kiểm tra...'),
      );
    if (_error.isNotEmpty)
      return Scaffold(
        appBar: AppBar(),
        body: ErrorView(message: _error, onRetry: _load),
      );

    final quiz = _quiz!;

    return Scaffold(
      appBar: AppBar(
        title: Text(quiz.title, maxLines: 1, overflow: TextOverflow.ellipsis),
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: AppColors.line)),
          ),
          child: FilledButton.icon(
            onPressed: _submitting || _result != null || quiz.questions.isEmpty
                ? null
                : _submit,
            icon: _submitting
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Icon(Icons.send_outlined),
            label: Text(_result == null ? 'Nộp bài' : 'Đã nộp bài'),
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          HeroHeader(
            title: quiz.title,
            subtitle:
                'Điểm đạt: ${quiz.passScore} • Thời gian: ${quiz.duration} phút • ${quiz.questions.length} câu hỏi',
            icon: Icons.assignment_rounded,
          ),
          if (quiz.description.isNotEmpty) ...[
            const SizedBox(height: 14),
            AppCard(
              child: Text(
                quiz.description,
                style: const TextStyle(color: AppColors.muted, height: 1.4),
              ),
            ),
          ],
          if (_latestAttempt != null && _latestAttempt!.isSubmitted) ...[
            const SizedBox(height: 14),
            AppCard(
              child: ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CourseThumb(
                  size: 54,
                  icon: _latestAttempt!.isPassed
                      ? Icons.check_circle_rounded
                      : Icons.cancel_rounded,
                ),
                title: Text(
                  'Kết quả gần nhất: ${_latestAttempt!.totalScore} điểm',
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 18,
                  ),
                ),
                subtitle: Text(
                  _latestAttempt!.isPassed ? 'Đạt yêu cầu' : 'Chưa đạt yêu cầu',
                ),
              ),
            ),
          ],
          if (_result != null) ...[
            const SizedBox(height: 14),
            AppCard(
              child: ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CourseThumb(
                  size: 54,
                  icon: _result!.isPassed
                      ? Icons.check_circle_rounded
                      : Icons.cancel_rounded,
                ),
                title: Text(
                  'Điểm của bạn: ${_result!.totalScore}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 18,
                  ),
                ),
                subtitle: Text(
                  _result!.isPassed ? 'Đạt yêu cầu' : 'Chưa đạt yêu cầu',
                ),
              ),
            ),
          ],
          const SizedBox(height: 16),
          if (quiz.questions.isEmpty)
            const EmptyView(message: 'Bài kiểm tra chưa có câu hỏi.')
          else
            ...quiz.questions.asMap().entries.map(
              (entry) => _questionView(entry.key + 1, entry.value),
            ),
          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _questionView(int index, QuestionModel question) {
    return AppCard(
      margin: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TagChip(text: question.type, icon: Icons.quiz_outlined),
          const SizedBox(height: 10),
          Text(
            'Câu $index: ${question.content}',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w900,
              color: AppColors.ink,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 12),
          _answerWidget(question),
        ],
      ),
    );
  }

  Widget _answerWidget(QuestionModel question) {
    final type = question.type;
    if (type == 'TRUE_FALSE') {
      return Column(
        children: [
          RadioListTile<bool>(
            value: true,
            groupValue: _rawAnswers[question.id] as bool?,
            onChanged: _result == null
                ? (value) => setState(() => _rawAnswers[question.id] = value)
                : null,
            title: const Text('Đúng'),
          ),
          RadioListTile<bool>(
            value: false,
            groupValue: _rawAnswers[question.id] as bool?,
            onChanged: _result == null
                ? (value) => setState(() => _rawAnswers[question.id] = value)
                : null,
            title: const Text('Sai'),
          ),
        ],
      );
    }

    if (type == 'MULTIPLE_CHOICE' || type == 'MULTICHOICE') {
      final options = question.options;
      if (options.isEmpty)
        return const Text('Câu hỏi này chưa có đáp án lựa chọn.');
      return Column(
        children: List.generate(options.length, (optionIndex) {
          final option = options[optionIndex];
          final optionMap = asMap(option);
          final text = optionMap.isEmpty
              ? asString(option)
              : stripHtml(
                  asString(
                    optionMap['text'] ??
                        optionMap['label'] ??
                        optionMap['content'] ??
                        optionMap['value'],
                  ),
                );
          return RadioListTile<int>(
            value: optionIndex,
            groupValue: _rawAnswers[question.id] as int?,
            onChanged: _result == null
                ? (value) => setState(() => _rawAnswers[question.id] = value)
                : null,
            title: Text(text.isEmpty ? 'Đáp án ${optionIndex + 1}' : text),
          );
        }),
      );
    }

    if (type == 'CLOZE') {
      final inner = asMap(
        question.metadata['inner_questions'] ?? question.metadata['children'],
      );
      if (inner.isEmpty)
        return const Text('Dạng bài đọc này chưa có câu hỏi con.');
      return Column(
        children: inner.entries.map((entry) {
          final child = asMap(entry.value);
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: TextField(
              enabled: _result == null,
              decoration: InputDecoration(
                labelText: stripHtml(
                  asString(child['content'], fallback: 'Câu ${entry.key}'),
                ),
              ),
              onChanged: (value) {
                final current = asMap(_rawAnswers[question.id]);
                current[entry.key] = value;
                _rawAnswers[question.id] = current;
              },
            ),
          );
        }).toList(),
      );
    }

    return TextField(
      enabled: _result == null,
      minLines: type == 'ESSAY' ? 5 : 1,
      maxLines: type == 'ESSAY' ? 8 : 3,
      decoration: InputDecoration(
        hintText: type == 'ESSAY'
            ? 'Nhập bài tự luận...'
            : 'Nhập câu trả lời...',
      ),
      onChanged: (value) => _rawAnswers[question.id] = value,
    );
  }
}
