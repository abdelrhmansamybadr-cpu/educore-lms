import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../features/auth/providers/auth_provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _currentPwCtrl = TextEditingController();
  final _newPwCtrl = TextEditingController();
  final _confirmPwCtrl = TextEditingController();
  bool _changingPw = false;
  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  bool _notifyPush = true;
  bool _notifyEmail = true;

  @override
  void dispose() {
    _currentPwCtrl.dispose();
    _newPwCtrl.dispose();
    _confirmPwCtrl.dispose();
    super.dispose();
  }

  Future<void> _changePassword(bool isAr) async {
    final curr = _currentPwCtrl.text.trim();
    final newPw = _newPwCtrl.text.trim();
    final confirm = _confirmPwCtrl.text.trim();

    if (curr.isEmpty || newPw.isEmpty || confirm.isEmpty) {
      _showSnackBar(isAr ? 'يرجى ملء جميع الحقول' : 'Please fill all fields', isError: true);
      return;
    }
    if (newPw != confirm) {
      _showSnackBar(isAr ? 'كلمات المرور غير متطابقة' : 'Passwords do not match', isError: true);
      return;
    }
    if (newPw.length < 6) {
      _showSnackBar(isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters', isError: true);
      return;
    }

    setState(() => _changingPw = true);
    try {
      await ApiClient.instance.patch(ApiEndpoints.changePassword, data: {
        'currentPassword': curr,
        'newPassword': newPw,
      });
      _currentPwCtrl.clear();
      _newPwCtrl.clear();
      _confirmPwCtrl.clear();
      _showSnackBar(isAr ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully');
    } catch (e) {
      _showSnackBar(e.toString(), isError: true);
    } finally {
      setState(() => _changingPw = false);
    }
  }

  void _showSnackBar(String msg, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: isError ? AppColors.error : AppColors.success,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isAr = auth.isAr;

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: Text(isAr ? 'الإعدادات' : 'Settings',
              style: const TextStyle(fontWeight: FontWeight.bold)),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.primary,
          elevation: 0,
          bottom: const PreferredSize(
            preferredSize: Size.fromHeight(1),
            child: Divider(height: 1, color: AppColors.border),
          ),
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Language section
              _sectionHeader(isAr ? 'اللغة' : 'Language'),
              const SizedBox(height: 10),
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                ),
                child: ListTile(
                  leading: Container(
                    width: 36, height: 36,
                    decoration: BoxDecoration(
                      color: AppColors.info.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.language_rounded, color: AppColors.info, size: 20),
                  ),
                  title: Text(isAr ? 'اللغة الحالية' : 'Current Language',
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text(isAr ? 'العربية' : 'English',
                      style: const TextStyle(color: AppColors.textSecondary)),
                  trailing: GestureDetector(
                    onTap: auth.toggleLocale,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        isAr ? 'English' : 'العربية',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Notifications section
              _sectionHeader(isAr ? 'الإشعارات' : 'Notifications'),
              const SizedBox(height: 10),
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    _switchTile(
                      icon: Icons.notifications_rounded,
                      iconColor: AppColors.warning,
                      title: isAr ? 'إشعارات الجهاز' : 'Push Notifications',
                      subtitle: isAr ? 'تلقي إشعارات فورية' : 'Receive instant notifications',
                      value: _notifyPush,
                      onChanged: (v) => setState(() => _notifyPush = v),
                    ),
                    const Divider(height: 1, color: AppColors.border, indent: 16),
                    _switchTile(
                      icon: Icons.email_rounded,
                      iconColor: AppColors.info,
                      title: isAr ? 'إشعارات البريد' : 'Email Notifications',
                      subtitle: isAr ? 'تلقي إشعارات عبر البريد' : 'Receive email updates',
                      value: _notifyEmail,
                      onChanged: (v) => setState(() => _notifyEmail = v),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Change password section
              _sectionHeader(isAr ? 'تغيير كلمة المرور' : 'Change Password'),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    _pwField(
                      ctrl: _currentPwCtrl,
                      hint: isAr ? 'كلمة المرور الحالية' : 'Current Password',
                      obscure: _obscureCurrent,
                      toggle: () => setState(() => _obscureCurrent = !_obscureCurrent),
                    ),
                    const SizedBox(height: 12),
                    _pwField(
                      ctrl: _newPwCtrl,
                      hint: isAr ? 'كلمة المرور الجديدة' : 'New Password',
                      obscure: _obscureNew,
                      toggle: () => setState(() => _obscureNew = !_obscureNew),
                    ),
                    const SizedBox(height: 12),
                    _pwField(
                      ctrl: _confirmPwCtrl,
                      hint: isAr ? 'تأكيد كلمة المرور' : 'Confirm Password',
                      obscure: _obscureConfirm,
                      toggle: () => setState(() => _obscureConfirm = !_obscureConfirm),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _changingPw ? null : () => _changePassword(isAr),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: _changingPw
                            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : Text(isAr ? 'تغيير كلمة المرور' : 'Change Password',
                                style: const TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // About section
              _sectionHeader(isAr ? 'حول التطبيق' : 'About'),
              const SizedBox(height: 10),
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    _infoTile(
                      icon: Icons.info_rounded,
                      iconColor: AppColors.info,
                      title: isAr ? 'إصدار التطبيق' : 'App Version',
                      value: '1.0.0',
                    ),
                    const Divider(height: 1, color: AppColors.border, indent: 16),
                    _infoTile(
                      icon: Icons.school_rounded,
                      iconColor: AppColors.primary,
                      title: isAr ? 'اسم التطبيق' : 'App Name',
                      value: 'EduCore LMS',
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Logout
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () async => await auth.logout(),
                  icon: const Icon(Icons.logout_rounded, color: AppColors.error),
                  label: Text(
                    isAr ? 'تسجيل الخروج' : 'Logout',
                    style: const TextStyle(color: AppColors.error, fontWeight: FontWeight.bold),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.error),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _sectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.bold,
        color: AppColors.textSecondary,
        letterSpacing: 0.5,
      ),
    );
  }

  Widget _pwField({
    required TextEditingController ctrl,
    required String hint,
    required bool obscure,
    required VoidCallback toggle,
  }) {
    return TextField(
      controller: ctrl,
      obscureText: obscure,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: AppColors.textSecondary),
        prefixIcon: const Icon(Icons.lock_rounded, color: AppColors.textSecondary, size: 20),
        suffixIcon: IconButton(
          icon: Icon(obscure ? Icons.visibility_off_rounded : Icons.visibility_rounded,
              color: AppColors.textSecondary, size: 20),
          onPressed: toggle,
        ),
        filled: true,
        fillColor: AppColors.background,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
      ),
    );
  }

  Widget _switchTile({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return SwitchListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      secondary: Container(
        width: 36, height: 36,
        decoration: BoxDecoration(
          color: iconColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: iconColor, size: 20),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
      subtitle: Text(subtitle, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
      value: value,
      onChanged: onChanged,
      activeColor: AppColors.primary,
    );
  }

  Widget _infoTile({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String value,
  }) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: Container(
        width: 36, height: 36,
        decoration: BoxDecoration(
          color: iconColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: iconColor, size: 20),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
      trailing: Text(value, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
    );
  }
}
