import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';

class StudentBottomNav extends StatelessWidget {
  final int currentIndex;
  final bool isAr;

  const StudentBottomNav({
    super.key,
    required this.currentIndex,
    required this.isAr,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: NavigationBar(
        selectedIndex: currentIndex,
        onDestinationSelected: (index) {
          switch (index) {
            case 0:
              context.go('/student');
              break;
            case 1:
              context.go('/student/courses');
              break;
            case 2:
              context.go('/student/assignments');
              break;
            case 3:
              context.go('/student/messages');
              break;
            case 4:
              context.go('/student/profile');
              break;
          }
        },
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.home_outlined),
            selectedIcon: const Icon(Icons.home_rounded),
            label: isAr ? 'الرئيسية' : 'Home',
          ),
          NavigationDestination(
            icon: const Icon(Icons.menu_book_outlined),
            selectedIcon: const Icon(Icons.menu_book_rounded),
            label: isAr ? 'المواد' : 'Courses',
          ),
          NavigationDestination(
            icon: const Icon(Icons.assignment_outlined),
            selectedIcon: const Icon(Icons.assignment_rounded),
            label: isAr ? 'الواجبات' : 'Tasks',
          ),
          NavigationDestination(
            icon: const Icon(Icons.chat_bubble_outline_rounded),
            selectedIcon: const Icon(Icons.chat_bubble_rounded),
            label: isAr ? 'الرسائل' : 'Messages',
          ),
          NavigationDestination(
            icon: const Icon(Icons.person_outline_rounded),
            selectedIcon: const Icon(Icons.person_rounded),
            label: isAr ? 'الملف' : 'Profile',
          ),
        ],
      ),
    );
  }
}

class TeacherBottomNav extends StatelessWidget {
  final int currentIndex;
  final bool isAr;

  const TeacherBottomNav({
    super.key,
    required this.currentIndex,
    required this.isAr,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: NavigationBar(
        selectedIndex: currentIndex,
        onDestinationSelected: (index) {
          switch (index) {
            case 0:
              context.go('/teacher');
              break;
            case 1:
              context.go('/teacher/take-attendance');
              break;
            case 2:
              context.go('/teacher/submissions');
              break;
            case 3:
              context.go('/teacher/messages');
              break;
            case 4:
              context.go('/teacher/profile');
              break;
          }
        },
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.home_outlined),
            selectedIcon: const Icon(Icons.home_rounded),
            label: isAr ? 'الرئيسية' : 'Home',
          ),
          NavigationDestination(
            icon: const Icon(Icons.fact_check_outlined),
            selectedIcon: const Icon(Icons.fact_check_rounded),
            label: isAr ? 'الحضور' : 'Attendance',
          ),
          NavigationDestination(
            icon: const Icon(Icons.grading_outlined),
            selectedIcon: const Icon(Icons.grading_rounded),
            label: isAr ? 'التسليمات' : 'Grades',
          ),
          NavigationDestination(
            icon: const Icon(Icons.chat_bubble_outline_rounded),
            selectedIcon: const Icon(Icons.chat_bubble_rounded),
            label: isAr ? 'الرسائل' : 'Messages',
          ),
          NavigationDestination(
            icon: const Icon(Icons.person_outline_rounded),
            selectedIcon: const Icon(Icons.person_rounded),
            label: isAr ? 'الملف' : 'Profile',
          ),
        ],
      ),
    );
  }
}

class ParentBottomNav extends StatelessWidget {
  final int currentIndex;
  final bool isAr;

  const ParentBottomNav({
    super.key,
    required this.currentIndex,
    required this.isAr,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: NavigationBar(
        selectedIndex: currentIndex,
        onDestinationSelected: (index) {
          switch (index) {
            case 0:
              context.go('/parent');
              break;
            case 1:
              context.go('/parent/children');
              break;
            case 2:
              context.go('/parent/messages');
              break;
            case 3:
              context.go('/parent/profile');
              break;
          }
        },
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.home_outlined),
            selectedIcon: const Icon(Icons.home_rounded),
            label: isAr ? 'الرئيسية' : 'Home',
          ),
          NavigationDestination(
            icon: const Icon(Icons.child_care_outlined),
            selectedIcon: const Icon(Icons.child_care_rounded),
            label: isAr ? 'الأبناء' : 'Children',
          ),
          NavigationDestination(
            icon: const Icon(Icons.chat_bubble_outline_rounded),
            selectedIcon: const Icon(Icons.chat_bubble_rounded),
            label: isAr ? 'الرسائل' : 'Messages',
          ),
          NavigationDestination(
            icon: const Icon(Icons.person_outline_rounded),
            selectedIcon: const Icon(Icons.person_rounded),
            label: isAr ? 'الملف' : 'Profile',
          ),
        ],
      ),
    );
  }
}

class AdminBottomNav extends StatelessWidget {
  final int currentIndex;
  final bool isAr;

  const AdminBottomNav({
    super.key,
    required this.currentIndex,
    required this.isAr,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: NavigationBar(
        selectedIndex: currentIndex,
        onDestinationSelected: (index) {
          switch (index) {
            case 0:
              context.go('/admin');
              break;
            case 1:
              context.go('/admin/users');
              break;
            case 2:
              context.go('/admin/events');
              break;
            case 3:
              context.go('/admin/profile');
              break;
          }
        },
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.home_outlined),
            selectedIcon: const Icon(Icons.home_rounded),
            label: isAr ? 'الرئيسية' : 'Home',
          ),
          NavigationDestination(
            icon: const Icon(Icons.people_outline_rounded),
            selectedIcon: const Icon(Icons.people_rounded),
            label: isAr ? 'المستخدمون' : 'Users',
          ),
          NavigationDestination(
            icon: const Icon(Icons.event_outlined),
            selectedIcon: const Icon(Icons.event_rounded),
            label: isAr ? 'الفعاليات' : 'Events',
          ),
          NavigationDestination(
            icon: const Icon(Icons.person_outline_rounded),
            selectedIcon: const Icon(Icons.person_rounded),
            label: isAr ? 'الملف' : 'Profile',
          ),
        ],
      ),
    );
  }
}
