import { Test, TestingModule } from '@nestjs/testing'
import { GradebookService } from './gradebook.service'
import { PrismaService } from '../../prisma/prisma.service'

const mockPrisma = {
  grade: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    aggregate: jest.fn(),
  },
  enrollment: {
    findMany: jest.fn(),
  },
}

describe('GradebookService', () => {
  let service: GradebookService

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradebookService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()

    service = module.get<GradebookService>(GradebookService)
  })

  describe('getStudentGrades', () => {
    it('returns grades and average for a student', async () => {
      const mockGrades = [
        { id: 'g1', points: 85, maxPoints: 100, percentage: 85, studentId: 'student1' },
        { id: 'g2', points: 72, maxPoints: 100, percentage: 72, studentId: 'student1' },
      ]
      mockPrisma.grade.findMany.mockResolvedValue(mockGrades)

      const result = await service.getStudentGrades('student1')
      expect(result.grades).toHaveLength(2)
      expect(result.average).toBe(78.5)
      expect(mockPrisma.grade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { studentId: 'student1' } }),
      )
    })

    it('returns zero average when no grades', async () => {
      mockPrisma.grade.findMany.mockResolvedValue([])
      const result = await service.getStudentGrades('student1')
      expect(result.grades).toEqual([])
      expect(result.average).toBe(0)
    })

    it('filters by courseId when provided', async () => {
      mockPrisma.grade.findMany.mockResolvedValue([])
      await service.getStudentGrades('student1', 'course1')
      expect(mockPrisma.grade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { studentId: 'student1', courseId: 'course1' } }),
      )
    })
  })

  describe('setGrade', () => {
    it('creates a grade and computes percentage', async () => {
      const mockGrade = { id: 'g1', studentId: 's1', courseId: 'c1', points: 88, maxPoints: 100, percentage: 88, letterGrade: 'B+' }
      mockPrisma.grade.create.mockResolvedValue(mockGrade)

      const result = await service.setGrade({
        studentId: 's1',
        courseId: 'c1',
        points: 88,
        maxPoints: 100,
      })
      expect(result.points).toBe(88)
      expect(mockPrisma.grade.create).toHaveBeenCalledTimes(1)
    })

    it('assigns letter grade A for 90%+ score', async () => {
      mockPrisma.grade.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ ...data, id: 'g1' }),
      )
      const result = await service.setGrade({ studentId: 's1', courseId: 'c1', points: 95, maxPoints: 100 })
      expect(result.letterGrade).toMatch(/A/)
    })

    it('assigns letter grade F for below 60%', async () => {
      mockPrisma.grade.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ ...data, id: 'g2' }),
      )
      const result = await service.setGrade({ studentId: 's1', courseId: 'c1', points: 50, maxPoints: 100 })
      expect(result.letterGrade).toBe('F')
    })
  })

  describe('getCourseGradebook', () => {
    it('returns enrollment list for a course', async () => {
      const mockEnrollments = [
        {
          id: 'e1',
          student: {
            profile: { firstName: 'Alice', lastName: 'Smith', avatar: null, studentId: 'S001' },
            grades: [{ points: 90, maxPoints: 100, percentage: 90 }],
          },
        },
      ]
      mockPrisma.enrollment.findMany.mockResolvedValue(mockEnrollments)

      const result = await service.getCourseGradebook('course1')
      expect(result).toHaveLength(1)
      expect(mockPrisma.enrollment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { courseId: 'course1' } }),
      )
    })
  })
})
