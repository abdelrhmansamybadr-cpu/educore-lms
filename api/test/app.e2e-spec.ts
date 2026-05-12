import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'

/**
 * E2E tests — require a running test database.
 * Set DATABASE_URL to a test DB before running: pnpm test:e2e
 *
 * These tests cover critical authentication and user flows.
 */
describe('EduCore API (e2e)', () => {
  let app: INestApplication
  let accessToken: string

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    app.setGlobalPrefix('api')
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  // ── Health Check ────────────────────────────────────────────────────────────

  it('GET /api/health → 200', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
  })

  // ── Auth Flows ──────────────────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    it('returns 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nobody@nowhere.com', password: 'wrong', schoolId: 'fake' })
        .expect(401)
    })
  })

  describe('GET /api/users/me', () => {
    it('returns 401 without token', () => {
      return request(app.getHttpServer())
        .get('/api/users/me')
        .expect(401)
    })
  })

  // ── Protected Routes ────────────────────────────────────────────────────────

  describe('GET /api/courses', () => {
    it('returns 401 without auth', () => {
      return request(app.getHttpServer())
        .get('/api/courses')
        .expect(401)
    })
  })

  describe('GET /api/gradebook/my-grades', () => {
    it('returns 401 without auth', () => {
      return request(app.getHttpServer())
        .get('/api/gradebook/my-grades')
        .expect(401)
    })
  })

  describe('GET /api/assignments', () => {
    it('returns 401 without auth', () => {
      return request(app.getHttpServer())
        .get('/api/assignments')
        .expect(401)
    })
  })

  describe('GET /api/attendance/my', () => {
    it('returns 401 without auth', () => {
      return request(app.getHttpServer())
        .get('/api/attendance/my')
        .expect(401)
    })
  })
})
