import 'package:flutter/material.dart';

import '../services/lms_repository.dart';
import '../widgets/app_widgets.dart';
import 'home_screen.dart';
import 'login_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  final _repo = LmsRepository();

  @override
  void initState() {
    super.initState();
    _start();
  }

  Future<void> _start() async {
    await Future<void>.delayed(const Duration(milliseconds: 550));
    final loggedIn = await _repo.isLoggedIn();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => loggedIn ? const HomeScreen() : const LoginScreen()));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0xFFEFF6FF), Color(0xFFF8FAFC)]),
        ),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 104,
                height: 104,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [AppColors.primaryDark, AppColors.primary]),
                  borderRadius: BorderRadius.circular(34),
                  boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.28), blurRadius: 28, offset: const Offset(0, 16))],
                ),
                child: const Center(child: Text('LMS', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900))),
              ),
              const SizedBox(height: 20),
              const Text('App học trực tuyến', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.ink)),
              const SizedBox(height: 6),
              const Text('Học mọi lúc, theo dõi tiến độ dễ dàng', style: TextStyle(color: AppColors.muted, fontWeight: FontWeight.w600)),
              const SizedBox(height: 24),
              const CircularProgressIndicator(),
            ],
          ),
        ),
      ),
    );
  }
}
