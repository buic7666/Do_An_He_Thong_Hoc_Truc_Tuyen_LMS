import 'package:flutter/material.dart';

import '../models/user_model.dart';
import '../widgets/app_widgets.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key, required this.user, required this.onLogout});

  final UserModel? user;
  final Future<void> Function() onLogout;

  @override
  Widget build(BuildContext context) {
    final name = user?.name ?? 'Học viên';
    final email = user?.email ?? '';
    final role = user?.role ?? 'student';

    return ListView(
      padding: const EdgeInsets.all(18),
      children: [
        HeroHeader(title: name, subtitle: email.isEmpty ? 'Tài khoản học sinh LMS' : email, icon: Icons.person_rounded),
        const SizedBox(height: 18),
        AppCard(
          child: Column(
            children: [
              _InfoTile(icon: Icons.verified_user_outlined, title: 'Vai trò', subtitle: role),
              const Divider(height: 1),
              const _InfoTile(icon: Icons.menu_book_outlined, title: 'Khóa học của tôi', subtitle: 'Theo dõi các khóa học đã đăng ký'),
              const Divider(height: 1),
              const _InfoTile(icon: Icons.assignment_outlined, title: 'Bài kiểm tra', subtitle: 'Làm bài và xem điểm sau khi nộp'),
              const Divider(height: 1),
              const _InfoTile(icon: Icons.workspace_premium_outlined, title: 'Chứng chỉ', subtitle: 'Có thể mở rộng khi backend có API chứng chỉ'),
            ],
          ),
        ),
        const SizedBox(height: 18),
        FilledButton.icon(onPressed: onLogout, icon: const Icon(Icons.logout), label: const Text('Đăng xuất')),
      ],
    );
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({required this.icon, required this.title, required this.subtitle});

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon, color: AppColors.primary),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w900)),
      subtitle: Text(subtitle),
    );
  }
}
