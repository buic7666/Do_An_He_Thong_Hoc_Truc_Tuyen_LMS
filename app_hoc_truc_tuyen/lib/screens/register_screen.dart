import 'package:flutter/material.dart';

import '../core/helpers.dart';
import '../services/lms_repository.dart';
import '../widgets/app_widgets.dart';
import 'home_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _repo = LmsRepository();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (_nameController.text.trim().isEmpty || _emailController.text.trim().isEmpty || _passwordController.text.isEmpty) {
      showSnack(context, 'Vui lòng nhập đầy đủ thông tin');
      return;
    }
    setState(() => _loading = true);
    try {
      await _repo.register(name: _nameController.text, email: _emailController.text, password: _passwordController.text);
      if (!mounted) return;
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
      appBar: AppBar(title: const Text('Đăng ký học sinh')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(22),
          children: [
            const HeroHeader(title: 'Tạo tài khoản LMS', subtitle: 'Tài khoản tạo từ app sẽ có vai trò học sinh.', icon: Icons.person_add_alt_1_rounded),
            const SizedBox(height: 22),
            AppCard(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  TextField(controller: _nameController, decoration: const InputDecoration(labelText: 'Họ tên', prefixIcon: Icon(Icons.person_outline))),
                  const SizedBox(height: 14),
                  TextField(controller: _emailController, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined))),
                  const SizedBox(height: 14),
                  TextField(controller: _passwordController, obscureText: true, decoration: const InputDecoration(labelText: 'Mật khẩu', prefixIcon: Icon(Icons.lock_outline))),
                  const SizedBox(height: 22),
                  FilledButton(
                    onPressed: _loading ? null : _register,
                    child: _loading ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text('Đăng ký'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
