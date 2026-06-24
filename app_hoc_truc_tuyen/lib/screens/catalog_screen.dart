import 'package:flutter/material.dart';

import '../core/helpers.dart';
import '../models/course_model.dart';
import '../services/lms_repository.dart';
import '../widgets/app_widgets.dart';
import 'course_detail_screen.dart';

class CatalogScreen extends StatefulWidget {
  const CatalogScreen({super.key});

  @override
  State<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen> {
  final _repo = LmsRepository();
  final _searchController = TextEditingController();

  bool _loading = true;
  String _error = '';
  List<CourseModel> _courses = [];

  String _category = 'Tất cả';
  String _priceFilter = 'Tất cả';

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() => setState(() {}));
    _load();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = '';
    });

    try {
      final data = await _repo.getCourses();
      if (mounted) setState(() => _courses = data);
    } catch (e) {
      if (mounted) setState(() => _error = safeError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<String> get _categories {
    final items = _courses.map((item) => item.category).where((item) => item.trim().isNotEmpty).toSet().toList()..sort();
    return ['Tất cả', ...items];
  }

  List<CourseModel> get _filteredCourses {
    final keyword = _searchController.text.trim().toLowerCase();
    return _courses.where((course) {
      final matchKeyword = keyword.isEmpty ||
          course.title.toLowerCase().contains(keyword) ||
          course.description.toLowerCase().contains(keyword) ||
          course.instructorName.toLowerCase().contains(keyword) ||
          course.category.toLowerCase().contains(keyword);

      final matchCategory = _category == 'Tất cả' || course.category == _category;

      final matchPrice = _priceFilter == 'Tất cả' ||
          (_priceFilter == 'Miễn phí' && course.price <= 0) ||
          (_priceFilter == 'Có phí' && course.price > 0);

      return matchKeyword && matchCategory && matchPrice;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const LoadingView();
    if (_error.isNotEmpty) return ErrorView(message: _error, onRetry: _load);

    final filtered = _filteredCourses;

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(18),
        children: [
          const HeroHeader(
            title: 'Đăng ký khóa học',
            subtitle: 'Tìm kiếm, lọc và xem thông tin khóa học trước khi đăng ký.',
            icon: Icons.travel_explore_rounded,
          ),
          const SizedBox(height: 18),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    labelText: 'Tìm khóa học, công nghệ hoặc giảng viên',
                    prefixIcon: const Icon(Icons.search_rounded),
                    suffixIcon: _searchController.text.trim().isEmpty
                        ? null
                        : IconButton(
                            onPressed: () => _searchController.clear(),
                            icon: const Icon(Icons.close_rounded),
                          ),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(18)),
                  ),
                ),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    _FilterChip(
                      label: 'Chuyên mục: $_category',
                      icon: Icons.category_outlined,
                      onTap: _pickCategory,
                    ),
                    _FilterChip(
                      label: 'Giá: $_priceFilter',
                      icon: Icons.payments_outlined,
                      onTap: _pickPrice,
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          SectionTitle(
            'Danh sách khóa học',
            subtitle: '${filtered.length} khóa học phù hợp',
          ),
          if (filtered.isEmpty)
            const EmptyView(message: 'Không tìm thấy khóa học phù hợp.', icon: Icons.search_off_rounded)
          else
            ...filtered.map(_courseCard),
        ],
      ),
    );
  }

  Future<void> _pickCategory() async {
    final result = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (context) => _OptionSheet(
        title: 'Lọc theo chuyên mục',
        options: _categories,
        selected: _category,
      ),
    );
    if (result != null) setState(() => _category = result);
  }

  Future<void> _pickPrice() async {
    final result = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (context) => _OptionSheet(
        title: 'Lọc theo giá',
        options: const ['Tất cả', 'Miễn phí', 'Có phí'],
        selected: _priceFilter,
      ),
    );
    if (result != null) setState(() => _priceFilter = result);
  }

  Widget _courseCard(CourseModel course) {
    return AppCard(
      margin: const EdgeInsets.only(bottom: 14),
      padding: EdgeInsets.zero,
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => CourseDetailScreen(courseId: course.id))),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const CourseThumb(size: 62, icon: Icons.school_outlined),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          course.title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.ink),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            const Icon(Icons.person_outline, size: 16, color: AppColors.muted),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                course.instructorName,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(color: AppColors.muted, fontWeight: FontWeight.w700),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                course.description.isEmpty ? 'Chưa có mô tả khóa học.' : course.description,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: AppColors.muted, height: 1.35),
              ),
              const SizedBox(height: 14),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  TagChip(text: course.category, icon: Icons.category_outlined),
                  TagChip(text: '${course.lessonsCount} bài học', icon: Icons.play_lesson_outlined),
                  TagChip(text: '${course.totalStudents} học viên', icon: Icons.groups_2_outlined),
                  TagChip(text: formatMoney(course.price), icon: Icons.payments_outlined),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({required this.label, required this.icon, required this.onTap});

  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ActionChip(
      avatar: Icon(icon, size: 18, color: AppColors.primary),
      label: Text(label),
      onPressed: onTap,
      side: const BorderSide(color: AppColors.line),
      backgroundColor: const Color(0xFFF8FAFC),
      labelStyle: const TextStyle(color: AppColors.ink, fontWeight: FontWeight.w800),
    );
  }
}

class _OptionSheet extends StatelessWidget {
  const _OptionSheet({required this.title, required this.options, required this.selected});

  final String title;
  final List<String> options;
  final String selected;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        shrinkWrap: true,
        padding: const EdgeInsets.fromLTRB(18, 8, 18, 18),
        children: [
          Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
          const SizedBox(height: 12),
          ...options.map((option) => ListTile(
                selected: option == selected,
                leading: Icon(option == selected ? Icons.check_circle_rounded : Icons.circle_outlined),
                title: Text(option),
                onTap: () => Navigator.pop(context, option),
              )),
        ],
      ),
    );
  }
}
