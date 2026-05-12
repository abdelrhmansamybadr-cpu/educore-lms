import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../../core/constants/app_colors.dart';

class SkeletonLoader extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;

  const SkeletonLoader({
    super.key,
    this.width = double.infinity,
    this.height = 16,
    this.borderRadius = 8,
  });

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.shimmerBase,
      highlightColor: AppColors.shimmerHighlight,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: AppColors.shimmerBase,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }
}

class CardSkeletonLoader extends StatelessWidget {
  const CardSkeletonLoader({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SkeletonLoader(height: 120, borderRadius: 12),
          const SizedBox(height: 12),
          const SkeletonLoader(height: 16, width: 200),
          const SizedBox(height: 8),
          const SkeletonLoader(height: 12, width: 140),
          const SizedBox(height: 8),
          const SkeletonLoader(height: 8),
        ],
      ),
    );
  }
}

class ListSkeletonLoader extends StatelessWidget {
  final int itemCount;

  const ListSkeletonLoader({super.key, this.itemCount = 4});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: itemCount,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, __) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: const Row(
          children: [
            SkeletonLoader(width: 48, height: 48, borderRadius: 12),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SkeletonLoader(height: 14),
                  SizedBox(height: 8),
                  SkeletonLoader(height: 12, width: 120),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class DashboardSkeletonLoader extends StatelessWidget {
  const DashboardSkeletonLoader({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SkeletonLoader(height: 24, width: 200),
        const SizedBox(height: 8),
        const SkeletonLoader(height: 14, width: 140),
        const SizedBox(height: 24),
        Row(
          children: [
            Expanded(child: SkeletonLoader(height: 100, borderRadius: 16)),
            const SizedBox(width: 12),
            Expanded(child: SkeletonLoader(height: 100, borderRadius: 16)),
            const SizedBox(width: 12),
            Expanded(child: SkeletonLoader(height: 100, borderRadius: 16)),
          ],
        ),
        const SizedBox(height: 24),
        const SkeletonLoader(height: 18, width: 120),
        const SizedBox(height: 12),
        const ListSkeletonLoader(itemCount: 3),
      ],
    );
  }
}
