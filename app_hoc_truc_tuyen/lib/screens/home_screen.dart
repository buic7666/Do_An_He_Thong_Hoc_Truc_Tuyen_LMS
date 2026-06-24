import 'package:flutter/material.dart';

import '../models/user_model.dart';
import '../services/lms_repository.dart';
import 'catalog_screen.dart';
import 'dashboard_screen.dart';
import 'login_screen.dart';
import 'my_courses_screen.dart';
import 'profile_screen.dart';
import 'transactions_certificates_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _repo = LmsRepository();
  int _currentIndex = 0;
  UserModel? _user;

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final user = await _repo.getLocalUser();
    if (mounted) setState(() => _user = user);
  }

  Future<void> _logout() async {
    await _repo.logout();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(MaterialPageRoute(builder: (_) => const LoginScreen()), (_) => false);
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      DashboardScreen(
        user: _user,
        onOpenCatalog: () => setState(() => _currentIndex = 1),
        onOpenMyCourses: () => setState(() => _currentIndex = 2),
        onOpenHistory: () => setState(() => _currentIndex = 3),
      ),
      const CatalogScreen(),
      const MyCoursesScreen(),
      const TransactionsCertificatesScreen(),
      ProfileScreen(user: _user, onLogout: _logout),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(_titleByIndex(_currentIndex)),
        actions: [
          IconButton(tooltip: 'Đăng xuất', onPressed: _logout, icon: const Icon(Icons.logout_outlined)),
        ],
      ),
      body: IndexedStack(index: _currentIndex, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (value) => setState(() => _currentIndex = value),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home_rounded), label: 'Trang chủ'),
          NavigationDestination(icon: Icon(Icons.search_outlined), selectedIcon: Icon(Icons.search_rounded), label: 'Đăng ký'),
          NavigationDestination(icon: Icon(Icons.menu_book_outlined), selectedIcon: Icon(Icons.menu_book_rounded), label: 'Của tôi'),
          NavigationDestination(icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.workspace_premium_rounded), label: 'Lịch sử'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person_rounded), label: 'Hồ sơ'),
        ],
      ),
    );
  }

  String _titleByIndex(int index) {
    switch (index) {
      case 1:
        return 'Đăng ký khóa học';
      case 2:
        return 'Khóa học của tôi';
      case 3:
        return 'Giao dịch & chứng chỉ';
      case 4:
        return 'Hồ sơ cá nhân';
      default:
        return 'LMS Học Viên';
    }
  }
}
