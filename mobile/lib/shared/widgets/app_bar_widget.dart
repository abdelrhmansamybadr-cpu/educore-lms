import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

class AppBarWidget extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final bool showBack;
  final List<Widget>? actions;
  final Widget? leading;
  final bool centerTitle;
  final Color? backgroundColor;
  final Color? titleColor;
  final PreferredSizeWidget? bottom;

  const AppBarWidget({
    super.key,
    required this.title,
    this.showBack = true,
    this.actions,
    this.leading,
    this.centerTitle = true,
    this.backgroundColor,
    this.titleColor,
    this.bottom,
  });

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: Text(
        title,
        style: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: titleColor ?? AppColors.primary,
        ),
      ),
      centerTitle: centerTitle,
      backgroundColor: backgroundColor ?? AppColors.surface,
      elevation: 0,
      surfaceTintColor: Colors.transparent,
      leading: showBack && Navigator.canPop(context)
          ? (leading ??
              IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded),
                color: AppColors.primary,
                onPressed: () => Navigator.pop(context),
              ))
          : leading,
      actions: actions,
      bottom: bottom ??
          const PreferredSize(
            preferredSize: Size.fromHeight(1),
            child: Divider(height: 1),
          ),
    );
  }

  @override
  Size get preferredSize => Size.fromHeight(
        kToolbarHeight + (bottom != null ? bottom!.preferredSize.height : 1),
      );
}
