import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../features/auth/providers/school_provider.dart';

const _curriculumColors = {
  'BRITISH':  Color(0xFF003087),
  'AMERICAN': Color(0xFFB22234),
  'IB':       Color(0xFF009B77),
  'EGYPTIAN': Color(0xFF006233),
  'SAUDI':    Color(0xFF006233),
  'CUSTOM':   Color(0xFF1E3A5F),
  'MIXED':    Color(0xFF6B21A8),
  'NATIONAL': Color(0xFF1E3A5F),
};

const _curriculumLabels = {
  'BRITISH':  'British Curriculum',
  'AMERICAN': 'American Curriculum',
  'IB':       'International Baccalaureate',
  'EGYPTIAN': 'Egyptian Curriculum',
  'SAUDI':    'Saudi Curriculum',
  'CUSTOM':   'Custom Curriculum',
  'MIXED':    'Mixed Curriculum',
  'NATIONAL': 'National Curriculum',
};

class CurriculumBadge extends StatelessWidget {
  const CurriculumBadge({super.key});

  @override
  Widget build(BuildContext context) {
    final school = context.watch<SchoolProvider>();
    final type = school.curriculumType;
    final color = _curriculumColors[type] ?? const Color(0xFF1E3A5F);
    final label = _curriculumLabels[type] ?? type;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8, height: 8,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color),
          ),
        ],
      ),
    );
  }
}
