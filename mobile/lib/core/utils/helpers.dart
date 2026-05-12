import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class Helpers {
  Helpers._();

  static String formatDate(DateTime date, {String format = 'MMM dd, yyyy'}) {
    return DateFormat(format).format(date);
  }

  static String formatDateAr(DateTime date) {
    return DateFormat('dd/MM/yyyy').format(date);
  }

  static String formatDateTime(DateTime date) {
    return DateFormat('MMM dd, yyyy • hh:mm a').format(date);
  }

  static String getGreeting(bool isAr) {
    final hour = DateTime.now().hour;
    if (isAr) {
      if (hour < 12) return 'صباح الخير';
      if (hour < 17) return 'مساء الخير';
      return 'مساء النور';
    }
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  static String getLetterGrade(double score) {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'C+';
    if (score >= 65) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  static Color getGradeColor(double score) {
    if (score >= 85) return const Color(0xFF10B981);
    if (score >= 70) return const Color(0xFF3B82F6);
    if (score >= 60) return const Color(0xFFF59E0B);
    return const Color(0xFFEF4444);
  }

  static String formatScore(double score, double maxScore) {
    return '${score.toStringAsFixed(0)}/${maxScore.toStringAsFixed(0)}';
  }

  static String formatPercentage(double value) {
    return '${value.toStringAsFixed(1)}%';
  }

  static String getDaysUntilDue(DateTime dueDate, bool isAr) {
    final now = DateTime.now();
    final diff = dueDate.difference(now);
    if (diff.isNegative) {
      return isAr ? 'منتهي' : 'Overdue';
    }
    if (diff.inDays == 0) {
      return isAr ? 'اليوم' : 'Today';
    }
    if (diff.inDays == 1) {
      return isAr ? 'غداً' : 'Tomorrow';
    }
    return isAr ? 'خلال ${diff.inDays} أيام' : 'In ${diff.inDays} days';
  }

  static bool isDueSoon(DateTime dueDate) {
    final now = DateTime.now();
    final diff = dueDate.difference(now);
    return diff.inDays <= 2 && !diff.isNegative;
  }

  static String getInitials(String firstName, String lastName) {
    final f = firstName.isNotEmpty ? firstName[0].toUpperCase() : '';
    final l = lastName.isNotEmpty ? lastName[0].toUpperCase() : '';
    return '$f$l';
  }

  static void showSnackBar(BuildContext context, String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? const Color(0xFFEF4444) : const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }
}
