import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class GamificationService {
  constructor(private prisma: PrismaService) {}

  // ── Badges ────────────────────────────────────────────────────────────────

  async getBadges(schoolId: string) {
    return this.prisma.badge.findMany({ where: { schoolId }, orderBy: { pointsRequired: 'asc' } })
  }

  async createBadge(schoolId: string, data: any) {
    return this.prisma.badge.create({ data: { ...data, schoolId } })
  }

  async awardBadge(userId: string, badgeId: string) {
    return this.prisma.userBadge.upsert({
      where: { userId_badgeId: { userId, badgeId } },
      create: { userId, badgeId },
      update: {},
      include: { badge: true },
    })
  }

  async getUserBadges(userId: string) {
    return this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { awardedAt: 'desc' },
    })
  }

  // ── Points ────────────────────────────────────────────────────────────────

  async addPoints(userId: string, amount: number, reason: string) {
    let userPoints = await this.prisma.userPoints.findUnique({ where: { userId } })

    if (!userPoints) {
      userPoints = await this.prisma.userPoints.create({ data: { userId, total: 0 } })
    }

    const now = new Date()
    const lastDate = userPoints.lastEarnedAt ? new Date(userPoints.lastEarnedAt) : null
    const isNewDay = !lastDate || lastDate.toDateString() !== now.toDateString()
    const streak = isNewDay ? userPoints.streak + 1 : userPoints.streak

    const updated = await this.prisma.userPoints.update({
      where: { userId },
      data: {
        total: { increment: amount },
        streak,
        lastEarnedAt: now,
        history: { create: { userId, amount, reason } },
      },
      include: { history: { orderBy: { createdAt: 'desc' }, take: 10 } },
    })

    // Auto-award badges based on total points
    await this.checkAndAwardBadges(userId, updated.total)

    return updated
  }

  async getUserPoints(userId: string) {
    return this.prisma.userPoints.findUnique({
      where: { userId },
      include: { history: { orderBy: { createdAt: 'desc' }, take: 20 } },
    })
  }

  async getLeaderboard(schoolId: string, limit = 20) {
    const users = await this.prisma.user.findMany({
      where: { schoolId, role: 'STUDENT' },
      include: {
        points: true,
        profile: { select: { firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, avatar: true } },
        badges: { include: { badge: true } },
      },
    })

    return users
      .filter((u) => u.points)
      .sort((a, b) => (b.points?.total ?? 0) - (a.points?.total ?? 0))
      .slice(0, limit)
      .map((u, idx) => ({
        rank: idx + 1,
        userId: u.id,
        name: `${u.profile?.firstName} ${u.profile?.lastName}`,
        nameAr: `${u.profile?.firstNameAr || u.profile?.firstName} ${u.profile?.lastNameAr || u.profile?.lastName}`,
        avatar: u.profile?.avatar,
        totalPoints: u.points?.total ?? 0,
        streak: u.points?.streak ?? 0,
        badgeCount: u.badges.length,
      }))
  }

  private async checkAndAwardBadges(userId: string, totalPoints: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { schoolId: true } })
    if (!user?.schoolId) return

    const eligibleBadges = await this.prisma.badge.findMany({
      where: { schoolId: user.schoolId, pointsRequired: { lte: totalPoints } },
    })

    for (const badge of eligibleBadges) {
      await this.prisma.userBadge.upsert({
        where: { userId_badgeId: { userId, badgeId: badge.id } },
        create: { userId, badgeId: badge.id },
        update: {},
      }).catch(() => null)
    }
  }
}
