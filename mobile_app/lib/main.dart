import 'package:flutter/material.dart';

import 'core/themes/app_theme.dart';
import 'presentation/pages/login_page.dart';

void main() {
  runApp(const LMSMobileApp());
}

class LMSMobileApp extends StatelessWidget {
  const LMSMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LMS Mobile App',
      theme: AppTheme.lightTheme,
      home: const LoginPage(),
    );
  }
}