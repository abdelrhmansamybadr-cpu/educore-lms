import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../prisma/prisma.service'
import { EmailService } from '../email/email.service'
import * as bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'
import { Role } from '@prisma/client'
import type { LoginDto } from './dto/login.dto'
import type { RegisterDto } from './dto/register.dto'
import type { ForgotPasswordDto, ResetPasswordDto } from './dto/reset-password.dto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private email: EmailService,
  ) {}

  // ── Register ────────────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    // Check email not already used in the same school
    const exists = await this.prisma.user.findFirst({
      where: { email: dto.email, schoolId: dto.schoolId ?? null },
    })
    if (exists) throw new ConflictException('Email already registered')

    const hashed = await bcrypt.hash(dto.password, 12)

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        role: dto.role ?? Role.STUDENT,
        schoolId: dto.schoolId,
        profile: {
          create: {
            firstName: dto.firstName,
            firstNameAr: dto.firstNameAr,
            lastName: dto.lastName,
            lastNameAr: dto.lastNameAr,
          },
        },
      },
      include: { profile: true },
    })

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.schoolId)

    // Send welcome email (non-blocking)
    this.email
      .sendWelcome({
        to: user.email,
        name: `${user.profile?.firstName} ${user.profile?.lastName}`,
        role: user.role,
      })
      .catch(() => null)

    return { user: this.sanitize(user), ...tokens }
  }

  // ── Login ───────────────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
      include: { profile: true },
    })

    if (!user || !user.password) throw new UnauthorizedException('Invalid credentials')
    if (!user.isActive) throw new UnauthorizedException('Account is deactivated')

    const valid = await bcrypt.compare(dto.password, user.password)
    if (!valid) throw new UnauthorizedException('Invalid credentials')

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.schoolId)
    return { user: this.sanitize(user), ...tokens }
  }

  // ── OAuth (Google / Microsoft) ───────────────────────────────────────────────

  async oauthLogin(oauthUser: {
    email: string
    firstName: string
    lastName: string
    avatar?: string
    provider: string
  }) {
    let user = await this.prisma.user.findFirst({
      where: { email: oauthUser.email },
      include: { profile: true },
    })

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: oauthUser.email,
          role: Role.STUDENT,
          profile: {
            create: {
              firstName: oauthUser.firstName,
              lastName: oauthUser.lastName,
              avatar: oauthUser.avatar,
            },
          },
        },
        include: { profile: true },
      })
    }

    if (!user.isActive) throw new UnauthorizedException('Account is deactivated')

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.schoolId)
    return { user: this.sanitize(user), ...tokens }
  }

  // ── Refresh Token ────────────────────────────────────────────────────────────

  async refreshToken(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { token } })
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token')
    }

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } })
    if (!user || !user.isActive) throw new UnauthorizedException()

    // Rotate: delete old, issue new
    await this.prisma.refreshToken.delete({ where: { token } })
    const tokens = await this.generateTokens(user.id, user.email, user.role, user.schoolId)
    return tokens
  }

  // ── Logout ───────────────────────────────────────────────────────────────────

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
    return { message: 'Logged out successfully' }
  }

  // ── Forgot Password ──────────────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findFirst({ where: { email: dto.email } })
    // Always return success to prevent email enumeration
    if (!user) return { message: 'If this email exists, a reset link was sent.' }

    const token = uuid()
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60) // 1 hour

    await this.prisma.refreshToken.create({
      data: {
        token: `reset_${token}`,
        userId: user.id,
        expiresAt,
      },
    })

    const resetUrl = `${this.config.get('WEB_URL')}/auth/reset-password?token=${token}`
    await this.email.sendPasswordReset({ to: user.email, resetUrl })
    return { message: 'If this email exists, a reset link was sent.' }
  }

  // ── Reset Password ───────────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.prisma.refreshToken.findUnique({
      where: { token: `reset_${dto.token}` },
    })
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token')
    }

    const hashed = await bcrypt.hash(dto.newPassword, 12)
    await this.prisma.user.update({
      where: { id: record.userId },
      data: { password: hashed },
    })
    await this.prisma.refreshToken.delete({ where: { token: `reset_${dto.token}` } })
    return { message: 'Password reset successfully' }
  }

  // ── Change Password ──────────────────────────────────────────────────────────

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.password) throw new UnauthorizedException('Invalid credentials')

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) throw new UnauthorizedException('Current password is incorrect')

    const hashed = await bcrypt.hash(newPassword, 12)
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } })
    return { message: 'Password changed successfully' }
  }

  // ── Get Current User ─────────────────────────────────────────────────────────

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, school: { select: { id: true, name: true, logo: true } } },
    })
    if (!user) throw new NotFoundException('User not found')
    return this.sanitize(user)
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    schoolId: string | null,
  ) {
    const payload = { sub: userId, email, role, schoolId }

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN') || '15m',
    })

    const refreshTokenValue = uuid()
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 days

    await this.prisma.refreshToken.create({
      data: { token: refreshTokenValue, userId, expiresAt },
    })

    return { accessToken, refreshToken: refreshTokenValue }
  }

  private sanitize(user: any) {
    const { password, ...safe } = user
    return safe
  }
}
