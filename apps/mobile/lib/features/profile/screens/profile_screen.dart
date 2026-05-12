import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/utils/helpers.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/app_bar_widget.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/widgets/bottom_nav_widget.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _isEditing = false;
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user;
    if (user != null) {
      _firstNameController.text = user.firstName;
      _lastNameController.text = user.lastName;
      _phoneController.text = user.phone ?? '';
    }
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    setState(() => _isSaving = true);
    final auth = context.read<AuthProvider>();
    final success = await auth.updateProfile({
      'firstName': _firstNameController.text,
      'lastName': _lastNameController.text,
      'phone': _phoneController.text,
    });
    setState(() {
      _isSaving = false;
      if (success) _isEditing = false;
    });
    if (mounted) {
      Helpers.showSnackBar(
        context,
        success ? 'Profile updated!' : 'Failed to update profile',
        isError: !success,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isAr = auth.isAr;
    final user = auth.user;
    final isTeacher = user?.isTeacher ?? false;

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBarWidget(
          title: S.profile(isAr),
          showBack: false,
          actions: [
            TextButton(
              onPressed: () => setState(() => _isEditing = !_isEditing),
              child: Text(
                _isEditing ? S.cancel(isAr) : S.edit(isAr),
                style: const TextStyle(color: AppColors.primary),
              ),
            ),
          ],
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              // Avatar section
              _buildAvatarSection(user, isAr),
              const SizedBox(height: 24),
              // Profile info
              if (!_isEditing)
                _buildInfoCard(user, isAr)
              else
                _buildEditForm(isAr),
              const SizedBox(height: 16),
              // Settings
              _buildSettingsCard(isAr, auth),
              const SizedBox(height: 80),
            ],
          ),
        ),
        bottomNavigationBar: isTeacher
            ? TeacherBottomNav(currentIndex: 4, isAr: isAr)
            : StudentBottomNav(currentIndex: 4, isAr: isAr),
      ),
    );
  }

  Widget _buildAvatarSection(user, bool isAr) {
    return Column(
      children: [
        Stack(
          children: [
            CircleAvatar(
              radius: 50,
              backgroundColor: AppColors.primary.withOpacity(0.1),
              child: Text(
                Helpers.getInitials(
                  user?.firstName ?? '',
                  user?.lastName ?? '',
                ),
                style: const TextStyle(
                  fontSize: 36,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
            ),
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(6),
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.camera_alt_rounded,
                  color: Colors.white,
                  size: 14,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Text(
          user?.displayName(isAr) ?? '',
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            _getRoleLabel(user?.role ?? '', isAr),
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.primary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  String _getRoleLabel(String role, bool isAr) {
    switch (role) {
      case 'student':
        return S.student(isAr);
      case 'teacher':
        return S.teacherRole(isAr);
      case 'parent':
        return S.parent(isAr);
      case 'admin':
        return S.admin(isAr);
      default:
        return role;
    }
  }

  Widget _buildInfoCard(user, bool isAr) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          _buildInfoRow(
            icon: Icons.person_outline_rounded,
            label: S.firstName(isAr),
            value: user?.firstName ?? '',
          ),
          const Divider(height: 24),
          _buildInfoRow(
            icon: Icons.person_outline_rounded,
            label: S.lastName(isAr),
            value: user?.lastName ?? '',
          ),
          const Divider(height: 24),
          _buildInfoRow(
            icon: Icons.email_outlined,
            label: S.email(isAr),
            value: user?.email ?? '',
          ),
          if (user?.phone != null && user!.phone!.isNotEmpty) ...[
            const Divider(height: 24),
            _buildInfoRow(
              icon: Icons.phone_outlined,
              label: S.phone(isAr),
              value: user.phone!,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.08),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: AppColors.primary, size: 18),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.textSecondary,
                ),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildEditForm(bool isAr) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          AppTextField(
            label: S.firstName(isAr),
            controller: _firstNameController,
            prefixIcon: Icons.person_outline_rounded,
          ),
          const SizedBox(height: 16),
          AppTextField(
            label: S.lastName(isAr),
            controller: _lastNameController,
            prefixIcon: Icons.person_outline_rounded,
          ),
          const SizedBox(height: 16),
          AppTextField(
            label: S.phone(isAr),
            controller: _phoneController,
            prefixIcon: Icons.phone_outlined,
            keyboardType: TextInputType.phone,
          ),
          const SizedBox(height: 20),
          AppButton(
            label: S.save(isAr),
            onPressed: _saveProfile,
            isLoading: _isSaving,
            width: double.infinity,
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsCard(bool isAr, AuthProvider auth) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          _buildSettingTile(
            icon: Icons.language_rounded,
            label: isAr ? 'التغيير إلى الإنجليزية' : 'Switch to Arabic',
            color: AppColors.info,
            onTap: auth.toggleLocale,
          ),
          const Divider(height: 1),
          _buildSettingTile(
            icon: Icons.notifications_outlined,
            label: S.notifications(isAr),
            color: AppColors.warning,
            onTap: () {},
          ),
          const Divider(height: 1),
          _buildSettingTile(
            icon: Icons.lock_outline_rounded,
            label: S.changePassword(isAr),
            color: AppColors.primary,
            onTap: () {},
          ),
          const Divider(height: 1),
          _buildSettingTile(
            icon: Icons.logout_rounded,
            label: S.logout(isAr),
            color: AppColors.error,
            onTap: () async {
              await auth.logout();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
    );
  }

  Widget _buildSettingTile({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return ListTile(
      onTap: onTap,
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: color, size: 18),
      ),
      title: Text(
        label,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: color == AppColors.error ? AppColors.error : AppColors.textPrimary,
        ),
      ),
      trailing: const Icon(Icons.chevron_right_rounded,
          color: AppColors.textSecondary, size: 20),
    );
  }
}
