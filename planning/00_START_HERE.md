# EduCore LMS — START HERE
# How to Read All Planning Documents

---

## READ IN THIS ORDER:

| # | File | What it covers | Language |
|---|------|---------------|----------|
| 1 | `01_LMS_Research_Features.md` | Deep analysis of all major LMS platforms (Moodle, Canvas, Blackboard, etc.) | English |
| 2 | `02_LMS_Tech_Stack.md` | Technology decisions: languages, frameworks, databases, services | English |
| 3 | `03_LMS_Master_Plan_EN.md` | Full master plan: all modules, all features, design principles | English |
| 4 | `04_LMS_Master_Plan_AR.md` | نفس الخطة الكاملة بالعربي المصري | Arabic |
| 5 | `05_LMS_Tasks.md` | Every task to be done, with priority and phase | English |
| 6 | `06_LMS_Project_Structure.md` | All folders and files (frontend, backend, mobile, desktop) | English |

---

## QUICK ANSWERS TO YOUR QUESTIONS:

### What coding language should we use?
**TypeScript** — everywhere. Frontend, backend, mobile, desktop. One language for all.

### What frameworks are best for this project?
| Part | Framework | Why |
|------|-----------|-----|
| Website | **Next.js 14** | Best for web apps, SEO, SSR |
| Backend | **NestJS** | TypeScript, modular, enterprise-ready |
| Mobile | **React Native (Expo)** | iOS + Android with shared code |
| Desktop | **Electron + Next.js** | Reuse the website code for desktop |
| Database | **PostgreSQL + Prisma** | Reliable, type-safe |

### What external tools are needed?
| Purpose | Tool | Monthly Cost |
|---------|------|-------------|
| Cloud hosting | AWS | $300–$2000+ |
| AI Tutor | Claude API | $100–500 |
| Video streaming | AWS S3 + CloudFront | Included |
| Live classes | LiveKit (self-hosted) | Server cost |
| Email | AWS SES | $10–50 |
| SMS | Infobip / SMS Misr | $50–300 |
| Push notifications | Firebase | Free–$50 |
| Error tracking | Sentry | $26–80 |
| Maps (bus) | Mapbox | $0–200 |
| Payment Egypt | Paymob + Fawry | % per transaction |
| Payment Global | Stripe | 2.9% + $0.30 |
| Payment Saudi | HyperPay / Moyasar | % per transaction |

### How much does everything cost per month?
- **Small (1 school, 1,000 students):** ~$400–600/month
- **Medium (10 schools, 10,000 students):** ~$1,500–3,000/month
- **Large (50 schools, 50,000 students):** ~$5,000–10,000/month

### What's the development timeline?
- **Phase 1 (Foundation):** 4 months — auth, school management, basic courses
- **Phase 2 (Core LMS):** 4 months — assignments, quizzes, gradebook, attendance
- **Phase 3 (Advanced):** 4 months — live classes, financial, AI, analytics
- **Phase 4 (Mobile + Desktop):** 4 months — iOS, Android, Windows, Mac, Linux
- **Phase 5 (Full Platform):** 4 months — transport, health, events, gamification

**Total: 12–18 months for the complete platform**

### What makes EduCore different from other LMS?
15 unique features no other LMS has all at once:
1. AI Tutor that speaks Arabic AND knows the curriculum
2. Multi-curriculum in ONE school (Egyptian + British at same time)
3. Full offline mode on mobile
4. Mental health daily check-in
5. Real-time bus GPS tracking for parents
6. Complete financial ERP (fees, payments, scholarships)
7. AI lesson plan generator for teachers
8. Digital permission slips (no paper needed)
9. Bilingual AI essay grading
10. School event ticketing with payment
11. At-risk student AI prediction (weeks before failing)
12. Game-map style learning journey
13. Per-school currency selection (EGP, SAR, AED, GBP, USD, etc.)
14. QR code attendance (no roll call)
15. Voice messages in all chats

---

## WHERE TO START DEVELOPMENT:

### Step 1: Design (Before any code)
Start with Figma. Design ALL screens first.
Priority screens:
1. Login page
2. School admin dashboard
3. Student dashboard
4. Course builder
5. Parent dashboard

### Step 2: Setup
Set up the monorepo with Turborepo + pnpm.
See `06_LMS_Project_Structure.md` for exact folder structure.

### Step 3: Backend First
- Set up NestJS
- Set up PostgreSQL with Prisma schema
- Build authentication API
- Build school management API

### Step 4: Frontend (Web)
- Set up Next.js with Arabic RTL support
- Build authentication screens
- Build admin dashboard
- Build course management

### Step 5: Mobile & Desktop (Parallel with Phase 3)
- React Native for mobile
- Electron wrapping the web for desktop

---

## LANGUAGE & CURRENCY SUPPORT:

### Languages:
- Arabic (RTL, Cairo font) — PRIMARY
- English (LTR, Inter font) — SECONDARY
- Any user can toggle their language preference
- All system emails, SMS, PDFs support both languages

### Currencies (Admin selects per school):
- 🇪🇬 EGP — Egyptian Pound
- 🇸🇦 SAR — Saudi Riyal
- 🇦🇪 AED — UAE Dirham
- 🇺🇸 USD — US Dollar
- 🇬🇧 GBP — British Pound
- 🇪🇺 EUR — Euro
- 🇰🇼 KWD — Kuwaiti Dinar
- 🇧🇭 BHD — Bahraini Dinar
- 🇶🇦 QAR — Qatari Riyal
- 🇯🇴 JOD — Jordanian Dinar

---

*EduCore LMS — Built to be the best LMS in the Arab world and beyond.*
