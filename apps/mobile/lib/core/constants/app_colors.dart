import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const primary = Color(0xFF0F2A47);
  static const primaryLight = Color(0xFF1A3F6F);
  static const accent = Color(0xFFF5C518);
  static const background = Color(0xFFF5F7FA);
  static const surface = Color(0xFFFFFFFF);
  static const textPrimary = Color(0xFF1A1A2E);
  static const textSecondary = Color(0xFF6B7280);
  static const success = Color(0xFF10B981);
  static const warning = Color(0xFFF59E0B);
  static const error = Color(0xFFEF4444);
  static const info = Color(0xFF3B82F6);
  static const border = Color(0xFFE5E7EB);
  static const shimmerBase = Color(0xFFE0E0E0);
  static const shimmerHighlight = Color(0xFFF5F5F5);

  static const gradientPrimary = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, primaryLight],
  );
}
