import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../prisma/prisma.service'
import { EmailService } from '../email/email.service'
import { ConflictException, UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'

const mockPrisma = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn().mockResolvedValue({}),
  },
  refreshToken: {
    create: jest.fn().mockResolvedValue({ token: 'refresh_token_mock' }),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
    delete: jest.fn(),
  },
}

const mockJwt = {
  signAsync: jest.fn().mockResolvedValue('mock_token'),
  verifyAsync: jest.fn(),
}

const mockConfig = {
  get: jest.fn((key: string) => {
    const values: Record<string, string> = {
      JWT_SECRET: 'test_secret',
      JWT_REFRESH_SECRET: 'test_refresh_secret',
      JWT_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
    }
    return values[key]
  }),
}

const mockEmail = {
  sendWelcomeEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: EmailService, useValue: mockEmail },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  describe('register', () => {
    it('throws ConflictException if email already registered', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'existing' })
      await expect(
        service.register({
          email: 'test@school.com',
          password: 'Pass123!',
          schoolId: 'school1',
          firstName: 'John',
          lastName: 'Doe',
        } as any),
      ).rejects.toThrow(ConflictException)
    })

    it('creates user and returns tokens when email is new', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null)
      mockPrisma.user.create.mockResolvedValue({
        id: 'user1',
        email: 'new@school.com',
        role: 'STUDENT',
        schoolId: 'school1',
        profile: { firstName: 'John', lastName: 'Doe' },
      })
      mockPrisma.refreshToken.create.mockResolvedValue({ token: 'refresh' })

      const result = await service.register({
        email: 'new@school.com',
        password: 'Pass123!',
        schoolId: 'school1',
        firstName: 'John',
        lastName: 'Doe',
      } as any)

      expect(result).toHaveProperty('accessToken')
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1)
    })
  })

  describe('login', () => {
    it('throws UnauthorizedException for unknown email', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null)
      await expect(
        service.login({ email: 'nobody@school.com', password: 'wrong', schoolId: 'school1' } as any),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('throws UnauthorizedException for wrong password', async () => {
      const hashed = await bcrypt.hash('correctPass', 10)
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user1', email: 'user@school.com', password: hashed,
        role: 'STUDENT', schoolId: 'school1', isActive: true,
        profile: null,
      })
      await expect(
        service.login({ email: 'user@school.com', password: 'wrongPass', schoolId: 'school1' } as any),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('returns tokens for valid credentials', async () => {
      const hashed = await bcrypt.hash('correctPass', 10)
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user1', email: 'user@school.com', password: hashed,
        role: 'STUDENT', schoolId: 'school1', isActive: true,
        profile: { firstName: 'John', lastName: 'Doe', avatar: null },
      })
      mockPrisma.refreshToken.create.mockResolvedValue({ token: 'refresh' })

      const result = await service.login({
        email: 'user@school.com', password: 'correctPass', schoolId: 'school1',
      } as any)

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('user')
    })
  })
})
