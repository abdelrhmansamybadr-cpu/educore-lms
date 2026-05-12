import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── School ────────────────────────────────────────────────────────────────────
  const school = await prisma.school.upsert({
    where: { slug: 'demo-educore' },
    update: {},
    create: {
      name: 'EduCore Demo School',
      nameAr: 'مدرسة إيدوكور التجريبية',
      slug: 'demo-educore',
      email: 'admin@demo.educore.app',
      countryCode: 'SA',
      isActive: true,
    },
  })
  console.log(`✅ School: ${school.name}`)

  // ── Academic Year ─────────────────────────────────────────────────────────────
  const academicYear = await prisma.academicYear.upsert({
    where: { schoolId_name: { name: '2024-2025', schoolId: school.id } },
    update: {},
    create: {
      name: '2024-2025',
      nameAr: '2024-2025',
      schoolId: school.id,
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-30'),
      isCurrent: true,
    },
  })
  console.log(`✅ Academic year: ${academicYear.name}`)

  // ── Password ──────────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash('Demo@1234', 10)

  // ── Users ─────────────────────────────────────────────────────────────────────
  const usersData = [
    { email: 'admin@demo.educore.app',   role: 'SCHOOL_ADMIN', firstName: 'Admin',    firstNameAr: 'المدير',  lastName: 'User',        lastNameAr: 'المستخدم' },
    { email: 'teacher@demo.educore.app', role: 'TEACHER',      firstName: 'Ahmed',    firstNameAr: 'أحمد',    lastName: 'Al-Rashid',   lastNameAr: 'الراشد'   },
    { email: 'teacher2@demo.educore.app',role: 'TEACHER',      firstName: 'Sara',     firstNameAr: 'سارة',    lastName: 'Al-Mansouri', lastNameAr: 'المنصوري' },
    { email: 'student@demo.educore.app', role: 'STUDENT',      firstName: 'Mohammed', firstNameAr: 'محمد',    lastName: 'Al-Fahad',    lastNameAr: 'الفهد'    },
    { email: 'student2@demo.educore.app',role: 'STUDENT',      firstName: 'Fatima',   firstNameAr: 'فاطمة',   lastName: 'Al-Zahra',    lastNameAr: 'الزهرة'   },
    { email: 'parent@demo.educore.app',  role: 'PARENT',       firstName: 'Ali',      firstNameAr: 'علي',     lastName: 'Al-Fahad',    lastNameAr: 'الفهد'    },
  ]

  const users: Record<string, any> = {}
  for (const u of usersData) {
    // Unique key in schema is [email, schoolId]
    let user = await prisma.user.findFirst({ where: { email: u.email, schoolId: school.id } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: u.email,
          password: hash,
          role: u.role as any,
          schoolId: school.id,
          isActive: true,
          profile: {
            create: {
              firstName: u.firstName,
              firstNameAr: u.firstNameAr,
              lastName: u.lastName,
              lastNameAr: u.lastNameAr,
              language: 'ar',
            },
          },
        },
      })
    }
    // Use email prefix as key for uniqueness
    const key = u.email.split('@')[0].replace(/[^a-z0-9]/g, '')
    users[key] = user
    console.log(`✅ User: ${u.email}`)
  }

  // ── Subjects ──────────────────────────────────────────────────────────────────
  const subjectsData = [
    { name: 'Mathematics',     nameAr: 'رياضيات',          code: 'MATH' },
    { name: 'Science',         nameAr: 'علوم',              code: 'SCI'  },
    { name: 'Arabic Language', nameAr: 'لغة عربية',         code: 'ARB'  },
    { name: 'English Language',nameAr: 'لغة إنجليزية',      code: 'ENG'  },
  ]
  const subjects: Record<string, any> = {}
  for (const s of subjectsData) {
    let subj = await prisma.subject.findFirst({ where: { code: s.code, schoolId: school.id } })
    if (!subj) subj = await prisma.subject.create({ data: { ...s, schoolId: school.id } })
    subjects[s.code] = subj
  }
  console.log(`✅ ${subjectsData.length} subjects`)

  // ── Courses ───────────────────────────────────────────────────────────────────
  const teacher = users['teacher']
  const teacher2 = users['teacher2']

  let course1 = await prisma.course.findFirst({ where: { title: 'Mathematics - Grade 9', schoolId: school.id } })
  if (!course1) {
    course1 = await prisma.course.create({
      data: {
        title: 'Mathematics - Grade 9',
        titleAr: 'رياضيات - الصف التاسع',
        description: 'Comprehensive Grade 9 Mathematics.',
        descAr: 'رياضيات شاملة للصف التاسع.',
        schoolId: school.id,
        teacherId: teacher.id,
        subjectId: subjects['MATH'].id,
        isPublished: true,
      },
    })
  }

  let course2 = await prisma.course.findFirst({ where: { title: 'English Language - Grade 9', schoolId: school.id } })
  if (!course2) {
    course2 = await prisma.course.create({
      data: {
        title: 'English Language - Grade 9',
        titleAr: 'اللغة الإنجليزية - الصف التاسع',
        description: 'English language skills for Grade 9.',
        descAr: 'مهارات اللغة الإنجليزية للصف التاسع.',
        schoolId: school.id,
        teacherId: teacher2.id,
        subjectId: subjects['ENG'].id,
        isPublished: true,
      },
    })
  }
  console.log(`✅ 2 courses`)

  // ── Sections & Lessons ────────────────────────────────────────────────────────
  let section1 = await prisma.courseSection.findFirst({ where: { courseId: course1.id, order: 1 } })
  if (!section1) {
    section1 = await prisma.courseSection.create({
      data: { title: 'Algebra Fundamentals', titleAr: 'أساسيات الجبر', courseId: course1.id, order: 1 },
    })
    await prisma.lesson.createMany({
      data: [
        { title: 'Introduction to Algebra', titleAr: 'مقدمة في الجبر', sectionId: section1.id, contentType: 'VIDEO', content: {}, order: 1, estimatedMinutes: 20 },
        { title: 'Linear Equations',        titleAr: 'المعادلات الخطية', sectionId: section1.id, contentType: 'VIDEO', content: {}, order: 2, estimatedMinutes: 25 },
        { title: 'Chapter Practice',        titleAr: 'تدريب الفصل',      sectionId: section1.id, contentType: 'TEXT', content: {}, order: 3, estimatedMinutes: 30 },
      ],
    })
  }
  console.log(`✅ Course content`)

  // ── Enrollments ───────────────────────────────────────────────────────────────
  const student = users['student']
  const student2 = users['student2']
  await prisma.enrollment.createMany({
    data: [
      { studentId: student.id,  courseId: course1.id, progress: 45 },
      { studentId: student.id,  courseId: course2.id, progress: 20 },
      { studentId: student2.id, courseId: course1.id, progress: 80 },
    ],
    skipDuplicates: true,
  })
  console.log(`✅ Enrollments`)

  // ── Parent-Student Link ───────────────────────────────────────────────────────
  const parent = users['parent']
  await prisma.parentStudentLink.upsert({
    where: { parentId_studentId: { parentId: parent.id, studentId: student.id } },
    update: {},
    create: { parentId: parent.id, studentId: student.id, relationship: 'PARENT' },
  })
  console.log(`✅ Parent-student link`)

  // ── Assignment ────────────────────────────────────────────────────────────────
  let assignment = await prisma.assignment.findFirst({ where: { courseId: course1.id } })
  if (!assignment) {
    assignment = await prisma.assignment.create({
      data: {
        title: 'Linear Equations Practice',
        titleAr: 'تدريب على المعادلات الخطية',
        instructions: 'Solve the 10 linear equations. Show all working.',
        instructionsAr: 'حل المعادلات الخطية العشر. اظهر جميع الخطوات.',
        courseId: course1.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxPoints: 100,
        allowLate: true,
        isPublished: true,
      },
    })
  }
  console.log(`✅ Assignment`)

  // ── Grade ─────────────────────────────────────────────────────────────────────
  const existingGrade = await prisma.grade.findFirst({ where: { studentId: student2.id, courseId: course1.id } })
  if (!existingGrade) {
    await prisma.grade.create({
      data: {
        studentId: student2.id,
        courseId: course1.id,
        points: 85,
        maxPoints: 100,
        percentage: 85,
        letterGrade: 'B+',
        feedback: 'Good work! Keep it up.',
        gradedById: teacher.id,
      },
    })
  }
  console.log(`✅ Sample grade`)

  // ── Announcement ─────────────────────────────────────────────────────────────
  const existingAnn = await prisma.announcement.findFirst({ where: { schoolId: school.id } })
  if (!existingAnn) {
    await prisma.announcement.create({
      data: {
        title: 'Welcome to Academic Year 2024-2025',
        titleAr: 'مرحباً بالعام الدراسي 2024-2025',
        content: 'We are excited to welcome all students and teachers to the new academic year.',
        contentAr: 'يسعدنا الترحيب بجميع الطلاب والمعلمين في العام الدراسي الجديد.',
        schoolId: school.id,
        authorId: users['admin']?.id || teacher.id,
        audience: 'ALL',
      },
    })
  }
  console.log(`✅ Announcement`)

  // ── Badges ────────────────────────────────────────────────────────────────────
  const badgesData = [
    { name: 'First Steps',    nameAr: 'الخطوات الأولى',   description: 'Complete your first lesson',          icon: '🎯', pointsRequired: 10  },
    { name: 'Quick Learner',  nameAr: 'متعلم سريع',       description: 'Complete 5 lessons',                  icon: '⚡', pointsRequired: 50  },
    { name: 'Course Star',    nameAr: 'نجم المقرر',       description: 'Complete 20 lessons',                 icon: '⭐', pointsRequired: 200 },
    { name: 'Quiz Taker',     nameAr: 'خاض الاختبارات',  description: 'Submit your first quiz',              icon: '📝', pointsRequired: 20  },
    { name: 'Quiz Master',    nameAr: 'سيد الاختبارات',  description: 'Pass 5 quizzes',                      icon: '🏆', pointsRequired: 150 },
    { name: 'Perfect Score',  nameAr: 'درجة كاملة',      description: 'Pass a quiz on the first attempt',   icon: '💯', pointsRequired: 30  },
    { name: 'Dedicated',      nameAr: 'مثابر',            description: 'Submit your first assignment',       icon: '📚', pointsRequired: 15  },
    { name: 'High Achiever',  nameAr: 'متفوق',            description: 'Earn 500 XP points',                 icon: '🚀', pointsRequired: 500 },
    { name: 'Legend',         nameAr: 'أسطورة',           description: 'Earn 1000 XP points',                icon: '👑', pointsRequired: 1000},
  ]
  for (const b of badgesData) {
    const existing = await prisma.badge.findFirst({ where: { name: b.name, schoolId: school.id } })
    if (!existing) {
      await prisma.badge.create({ data: { ...b, schoolId: school.id } })
    }
  }
  console.log(`✅ ${badgesData.length} badges`)

  console.log('\n🎉 Seeding complete!')
  console.log('\n📋 Login credentials:')
  console.log('  Admin:   admin@demo.educore.app   / Demo@1234')
  console.log('  Teacher: teacher@demo.educore.app / Demo@1234')
  console.log('  Student: student@demo.educore.app / Demo@1234')
  console.log('  Parent:  parent@demo.educore.app  / Demo@1234')
}

main().catch(console.error).finally(() => prisma.$disconnect())
