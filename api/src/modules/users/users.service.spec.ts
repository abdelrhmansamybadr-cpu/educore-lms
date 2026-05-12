import { Test, TestingModule } from '@nestjs/testing'
import { UsersService } from './users.service'
import { PrismaService } from '../../prisma/prisma.service'
import { NotFoundException, ConflictException } from '@nestjs/common'

const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
}

describe('UsersService', () => {
  let service: UsersService

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
  })

  describe('findAll', () => {
    it('returns paginated users for a school', async () => {
      const mockUsers = [
        { id: 'u1', email: 'a@school.com', role: 'STUDENT', profile: null, isActive: true },
        { id: 'u2', email: 'b@school.com', role: 'TEACHER', profile: null, isActive: true },
      ]
      mockPrisma.user.findMany.mockResolvedValue(mockUsers)
      mockPrisma.user.count.mockResolvedValue(2)

      const result = await service.findAll('school1', {} as any)
      expect(result.data).toHaveLength(2)
      expect(result.meta.total).toBe(2)
    })

    it('applies role filter when provided', async () => {
      mockPrisma.user.findMany.mockResolvedValue([])
      mockPrisma.user.count.mockResolvedValue(0)

      await service.findAll('school1', { role: 'TEACHER' } as any)
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: 'school1', role: 'TEACHER' }),
        }),
      )
    })
  })

  describe('findOne', () => {
    it('returns user when found', async () => {
      const mockUser = { id: 'u1', email: 'a@school.com', schoolId: 'school1', profile: null }
      mockPrisma.user.findFirst.mockResolvedValue(mockUser)

      const result = await service.findOne('school1', 'u1')
      expect(result.id).toBe('u1')
    })

    it('throws NotFoundException when user not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null)
      await expect(service.findOne('school1', 'missing')).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('throws ConflictException if email already in use', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'existing' })
      await expect(
        service.create('school1', {
          email: 'existing@school.com',
          password: 'Pass123!',
          role: 'STUDENT' as any,
          firstName: 'John',
          lastName: 'Doe',
        } as any),
      ).rejects.toThrow(ConflictException)
    })

    it('creates and returns new user', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null)
      mockPrisma.user.create.mockResolvedValue({
        id: 'u_new',
        email: 'new@school.com',
        role: 'STUDENT',
        schoolId: 'school1',
        profile: { firstName: 'Jane', lastName: 'Doe' },
      })

      const result = await service.create('school1', {
        email: 'new@school.com',
        password: 'Pass123!',
        role: 'STUDENT' as any,
        firstName: 'Jane',
        lastName: 'Doe',
      } as any)

      expect(result.email).toBe('new@school.com')
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1)
    })
  })

  describe('setActive', () => {
    it('deactivates a user', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'u1', isActive: true, schoolId: 'school1' })
      mockPrisma.user.update.mockResolvedValue({ id: 'u1', isActive: false })

      await service.setActive('school1', 'u1', false)
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: false } }),
      )
    })

    it('activates a user', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'u1', isActive: false, schoolId: 'school1' })
      mockPrisma.user.update.mockResolvedValue({ id: 'u1', isActive: true })

      await service.setActive('school1', 'u1', true)
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: true } }),
      )
    })
  })
})
