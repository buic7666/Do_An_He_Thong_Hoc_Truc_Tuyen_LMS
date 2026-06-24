import 'package:flutter/material.dart';

import '../core/helpers.dart';
import '../services/lms_repository.dart';
import '../widgets/app_widgets.dart';
import 'home_screen.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _repo = LmsRepository();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;
  bool _hidePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    if (email.isEmpty || password.isEmpty) {
      showSnack(context, 'Vui lòng nhập email và mật khẩu');
      return;
    }

    setState(() => _loading = true);
    try {
      final user = await _repo.login(email, password);
      if (!mounted) return;
      if (user.role != 'student') {
        showSnack(context, 'App này ưu tiên tài khoản học sinh. Vai trò hiện tại: ${user.role}');
      }
      Navigator.of(context).pushAndRemoveUntil(MaterialPageRoute(builder: (_) => const HomeScreen()), (_) => false);
    } catch (e) {
      if (mounted) showSnack(context, safeError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0xFFDBEAFE), Color(0xFFF8FAFC)],
                ),
              ),
            ),
          ),
          Positioned(
            top: -60,
            right: -60,
            child: Container(width: 180, height: 180, decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.18), shape: BoxShape.circle)),
          ),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 470),
                  child: AppCard(
                    padding: const EdgeInsets.all(26),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Center(
                          child: Container(
                            width: 96,
                            height: 96,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(colors: [AppColors.primaryDark, AppColors.primary]),
                              borderRadius: BorderRadius.circular(32),
                              boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.3), blurRadius: 24, offset: const Offset(0, 12))],
                            ),
                            child: const Center(child: Text('LMS', style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900))),
                          ),
                        ),
                        const SizedBox(height: 28),
                        const Text('Đăng nhập học sinh', style: TextStyle(fontSize: 29, fontWeight: FontWeight.w900, color: AppColors.ink)),
                        const SizedBox(height: 8),
                        const Text('Tiếp tục học, làm bài kiểm tra và theo dõi tiến độ khóa học.', style: TextStyle(color: AppColors.muted, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 28),
                        TextField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined)),
                        ),
                        const SizedBox(height: 15),
                        TextField(
                          controller: _passwordController,
                          obscureText: _hidePassword,
                          decoration: InputDecoration(
                            labelText: 'Mật khẩu',
                            prefixIcon: const Icon(Icons.lock_outline),
                            suffixIcon: IconButton(
                              onPressed: () => setState(() => _hidePassword = !_hidePassword),
                              icon: Icon(_hidePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
                        FilledButton(
                          onPressed: _loading ? null : _login,
                          child: _loading
                              ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                              : const Text('Đăng nhập'),
                        ),
                        const SizedBox(height: 16),
                        Center(
                          child: TextButton(
                            onPressed: _loading ? null : () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const RegisterScreen())),
                            child: const Text('Chưa có tài khoản? Đăng ký học sinh'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
