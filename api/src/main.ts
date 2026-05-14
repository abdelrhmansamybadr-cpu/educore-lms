import 'reflect-metadata'
import { NestFactory, Reflector } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/http-exception.filter'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser')

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Global prefix
  app.setGlobalPrefix('api')

  // Cookie parser (for refresh token)
  app.use(cookieParser())

  // CORS
  app.enableCors({
    origin: [
      process.env.WEB_URL || 'http://localhost:3000',
      'http://localhost:4001',   // Next.js dev port
      'http://localhost:3001',   // desktop / alternate
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-school-id', 'x-school-slug'],
  })

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter())

  // Global response transform
  app.useGlobalInterceptors(new TransformInterceptor())

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // strip unknown fields
      forbidNonWhitelisted: true,
      transform: true,           // auto-transform types
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  // Swagger API docs
  const config = new DocumentBuilder()
    .setTitle('EduCore LMS API')
    .setDescription('EduCore Learning Management System — Full API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication & Authorization')
    .addTag('Schools', 'School Management')
    .addTag('Users', 'User Management')
    .addTag('Courses', 'Course & Lesson Management')
    .addTag('Assignments', 'Assignment & Submission')
    .addTag('Quizzes', 'Quiz Engine')
    .addTag('Gradebook', 'Grades & Report Cards')
    .addTag('Attendance', 'Attendance Management')
    .addTag('Messaging', 'Chat & Notifications')
    .addTag('Finance', 'Financial Management')
    .addTag('Devices', 'Device Management')
    .addTag('Tickets', 'Support Ticket System')
    .addTag('AI', 'AI Features')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  const port = process.env.PORT || 4000
  await app.listen(port)

  console.warn(`🚀 EduCore API running on: http://localhost:${port}/api`)
  console.warn(`📚 Swagger docs: http://localhost:${port}/api/docs`)
}

bootstrap()
