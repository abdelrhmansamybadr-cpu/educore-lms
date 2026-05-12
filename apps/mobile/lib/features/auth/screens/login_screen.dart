import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_text_field.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _slugController = TextEditingController(text: 'demo');

  late AnimationController _animController;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _animController, curve: Curves.easeOut));
    _animController.forward();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _slugController.dispose();
    _animController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    final success = await auth.login(
      _emailController.text,
      _passwordController.text,
      _slugController.text,
    );
    if (success && mounted) {
      final user = auth.user;
      if (user == null) return;
      switch (user.role.toUpperCase()) {
        case 'STUDENT':
          context.go('/student');
          break;
        case 'TEACHER':
        case 'SUB_TEACHER':
        case 'DEPARTMENT_HEAD':
          context.go('/teacher');
          break;
        case 'PARENT':
          context.go('/parent');
          break;
        case 'SCHOOL_ADMIN':
        case 'SUPER_ADMIN':
        case 'VICE_PRINCIPAL':
        case 'ACADEMIC_DIRECTOR':
          context.go('/admin');
          break;
        default:
          context.go('/student');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isAr = auth.isAr;

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        body: Stack(
          children: [
            // Gradient background
            Container(
              height: MediaQuery.of(context).size.height * 0.45,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [AppColors.primary, AppColors.primaryLight],
                ),
              ),
            ),
            SafeArea(
              child: Column(
                children: [
                  // Header
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const SizedBox(width: 48),
                        // Language toggle
                        GestureDetector(
                          onTap: auth.toggleLocale,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: Colors.white.withOpacity(0.4),
                              ),
                            ),
                            child: Text(
                              isAr ? 'English' : 'العربية',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Logo + Title
                  const SizedBox(height: 8),
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(22),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.2),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: const Center(
                      child: Text('🎓', style: TextStyle(fontSize: 40)),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    S.loginWelcome(isAr),
                    style: const TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    S.loginSubtitle(isAr),
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.white.withOpacity(0.75),
                    ),
                  ),
                  const SizedBox(height: 32),
                  // Form card
                  Expanded(
                    child: SlideTransition(
                      position: _slideAnimation,
                      child: Container(
                        decoration: const BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.only(
                            topLeft: Radius.circular(30),
                            topRight: Radius.circular(30),
                          ),
                        ),
                        child: SingleChildScrollView(
                          padding: const EdgeInsets.all(24),
                          child: Form(
                            key: _formKey,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                const SizedBox(height: 8),
                                AppTextField(
                                  label: S.schoolSlug(isAr),
                                  hint: S.schoolSlugHint(isAr),
                                  controller: _slugController,
                                  prefixIcon: Icons.school_outlined,
                                  textInputAction: TextInputAction.next,
                                  validator: (v) =>
                                      v == null || v.isEmpty ? 'Required' : null,
                                ),
                                const SizedBox(height: 16),
                                AppTextField(
                                  label: S.email(isAr),
                                  hint: S.emailHint(isAr),
                                  controller: _emailController,
                                  prefixIcon: Icons.email_outlined,
                                  keyboardType: TextInputType.emailAddress,
                                  textInputAction: TextInputAction.next,
                                  validator: (v) {
                                    if (v == null || v.isEmpty) return 'Required';
                                    if (!v.contains('@')) return 'Invalid email';
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 16),
                                AppTextField(
                                  label: S.password(isAr),
                                  hint: S.passwordHint(isAr),
                                  controller: _passwordController,
                                  isPassword: true,
                                  prefixIcon: Icons.lock_outline_rounded,
                                  textInputAction: TextInputAction.done,
                                  onSubmitted: (_) => _handleLogin(),
                                  validator: (v) {
                                    if (v == null || v.isEmpty) return 'Required';
                                    if (v.length < 6) return 'Min 6 characters';
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 24),
                                // Error message
                                if (auth.error != null) ...[
                                  Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: AppColors.error.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(
                                        color: AppColors.error.withOpacity(0.3),
                                      ),
                                    ),
                                    child: Row(
                                      children: [
                                        const Icon(
                                          Icons.error_outline_rounded,
                                          color: AppColors.error,
                                          size: 18,
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            auth.error!,
                                            style: const TextStyle(
                                              color: AppColors.error,
                                              fontSize: 13,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                ],
                                AppButton(
                                  label: S.loginButton(isAr),
                                  onPressed: _handleLogin,
                                  isLoading: auth.isLoading,
                                  width: double.infinity,
                                ),
                                const SizedBox(height: 24),
                                // Demo hint
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: AppColors.info.withOpacity(0.08),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(
                                      color: AppColors.info.withOpacity(0.2),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(
                                        Icons.info_outline_rounded,
                                        color: AppColors.info,
                                        size: 16,
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        isAr
                                            ? 'استخدم رمز المدرسة: demo'
                                            : 'Use school code: demo',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: AppColors.info,
                                        ),
                                      ),
                                    ],
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
            ),
          ],
        ),
      ),
    );
  }
}
