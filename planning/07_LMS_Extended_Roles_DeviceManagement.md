# EduCore LMS — Extended Roles, Device Management, Ticket System & Dynamic Modules
# Additions to the original plan

---

## COMPLETE USER ROLES LIST (Updated)

### PLATFORM LEVEL
| Role | Arabic | Access |
|------|--------|--------|
| **Super Admin** | سوبر أدمن | Full platform control, all schools |
| **Developer** | مطور النظام | Add/remove modules per school, custom fields, system config |

### SCHOOL LEADERSHIP
| Role | Arabic | Access |
|------|--------|--------|
| **School Admin / Principal** | مدير المدرسة | Full school control |
| **Vice Principal** | ناظر / وكيل المدرسة | Academic oversight, reports |
| **Academic Director** | المدير الأكاديمي | Curriculum, standards, teacher performance |
| **Department Head** | رئيس القسم / رئيس المادة | Manages all teachers in their department, reviews their courses, approves content |

### ACADEMIC STAFF
| Role | Arabic | Access |
|------|--------|--------|
| **Teacher** | مدرس | Full course management, grades, attendance |
| **Sub-Teacher / Teaching Assistant** | مدرس مساعد | Can enter grades if teacher grants, view course, assist in class, limited edit |
| **Counselor** | مرشد أكاديمي / مستشار | Student academic & personal counseling, mental health module, view student records |
| **Activities Coordinator** | منسق الأنشطة | Clubs, events, sports teams management |

### ADMINISTRATIVE STAFF
| Role | Arabic | Access |
|------|--------|--------|
| **Receptionist** | موظف الاستقبال | Visitor log, parent walk-in registration, phone call log, basic student info |
| **Admission Officer** | مسؤول القبول والتسجيل | New student applications, enrollment pipeline, document collection, parent interviews |
| **HR Manager** | مدير الموارد البشرية | Staff contracts, leave management, salary info (read), documents, evaluations |
| **Finance Officer** | المسؤول المالي | Fees, invoices, payments, reports, scholarships |
| **Store Manager** | مسؤول المخزن | School supplies inventory, equipment tracking, purchase requests |
| **Canteen Manager** | مسؤول الكافيتيريا | Menu management, meal orders, dietary restrictions, canteen sales, stock |
| **IT Administrator** | مسؤول تقنية المعلومات | Device management, MDM controls, help desk tickets, network access |
| **Matron / House Parent** | المشرفة / المربية | Boarding school welfare, student check-in/out, dormitory management, behavioral notes |
| **Transport Manager** | مسؤول النقل | Bus routes, driver assignments, GPS tracking, student assignments |
| **Librarian** | أمين المكتبة | Book catalog, loans, returns, fines |
| **Nurse / Health Officer** | الممرضة / مسؤول الصحة | Health records, visits, medication, incidents |
| **Event Coordinator** | منسق الفعاليات | School events, field trips, ticketing, permissions |
| **Support Agent** | موظف دعم فني | Handle and respond to tickets from students, parents, teachers |

### STUDENTS & PARENTS
| Role | Arabic | Access |
|------|--------|--------|
| **Student** | طالب | Courses, assignments, quizzes, grades, messages, AI tutor |
| **Parent / Guardian** | ولي الأمر | Child overview, grades, attendance, fees, messages, bus tracking |

---

## DEPARTMENT HEAD — Detailed Permissions

The Department Head role sits between teacher and admin:

```
Department Head can:
✅ View all courses in their department
✅ Review and approve course content before publishing
✅ See all teachers' gradebooks in their department
✅ Assign teachers to courses/classes
✅ Create department-level announcements
✅ View department performance analytics
✅ Request resources for their department
✅ Conduct teacher peer review (fill evaluation form)
✅ Schedule department meetings
❌ Cannot edit other teachers' courses directly
❌ Cannot access financial data
❌ Cannot access other departments
```

---

## SUB-TEACHER / TEACHING ASSISTANT — Permissions

```
Sub-Teacher can (with teacher's grant):
✅ View assigned course content
✅ Grade assignments IF teacher enables this
✅ Take attendance (if teacher grants)
✅ Post announcements in class
✅ Message students in the course
✅ View student submissions
❌ Cannot create/edit course structure
❌ Cannot publish/unpublish content
❌ Cannot modify quiz settings
❌ Cannot access gradebook without teacher grant
```

The main teacher controls exactly which permissions the sub-teacher has — per course.

---

## TICKET SYSTEM (Internal Help Desk)

### Who Can Submit Tickets
- Students → IT issues, account problems, missing grades (report to teacher)
- Parents → Billing issues, access problems, complaints
- Teachers → IT requests, maintenance, resource requests
- Any staff → Any department

### Ticket Categories
| Category | Goes To | Examples |
|---------|---------|---------|
| IT Support | IT Admin | Login problem, device issue, app crash |
| Billing / Finance | Finance Officer | Wrong invoice, payment not reflected |
| Academic | Academic Director | Grade dispute, course access |
| Facilities | Admin | Classroom issue, maintenance |
| Admission | Admission Officer | Enrollment status, document |
| General | Reception | General school inquiry |
| Behavior / Conduct | Vice Principal | Behavioral incident report |

### Ticket Features
- Priority: Low / Medium / High / Urgent
- Status: Open → In Progress → Waiting on User → Resolved → Closed
- SLA (response time target per priority)
- Auto-assign to relevant department
- Internal notes (staff only, not visible to submitter)
- File attachments
- Email + push notification on status change
- Satisfaction rating after close
- Ticket history per user
- Reports: average resolution time, volume by category, open tickets

### Ticket Permissions
- Students/Parents: Submit, view own tickets, reply
- Support Agent: View assigned tickets, update status, reply, add internal notes
- Department Head / Admin: View all tickets in their department, reassign, escalate
- School Admin: View ALL tickets, full management
- Super Admin: Platform-wide ticket oversight

---

## DEVICE MANAGEMENT MODULE (MDM — Mobile Device Management)

### Student Device Categories (Admin configures per student)

| Category | Arabic | Description |
|---------|--------|-------------|
| **BYOD** (Bring Your Own Device) | جهاز الطالب الخاص | Student uses their own device |
| **School Device** | جهاز المدرسة | School-issued device assigned to student |
| **Shared Device** | جهاز مشترك | Lab computers, shared classroom devices |
| **No Device** | بدون جهاز | Student has no device (offline support: printed materials) |

### Device Types Supported
- Laptop (Windows 10/11, macOS, Linux)
- Tablet (iPad, Android tablet)
- Smartphone (iPhone, Android)
- Chromebook
- Desktop PC (school lab)

### What IT Admin Can Do Per Device

```
Device Management Dashboard (IT Admin):
├── Register Device
│   ├── Enter device ID / serial number
│   ├── Assign to student (or mark as shared)
│   ├── Set device type (laptop / tablet / phone)
│   └── Set ownership (school / student)
│
├── Per-Device Controls
│   ├── View active sessions (who is logged in right now)
│   ├── Remote logout (sign out from specific device)
│   ├── Block device access (device is banned from platform)
│   ├── Restrict to specific modules (e.g., student can only access courses, not chat)
│   ├── Enable exam lockdown mode (no other tabs, no copy-paste)
│   ├── Wipe school data from device
│   ├── View last login time and location
│   └── Push policy updates
│
├── School Device Management
│   ├── Device inventory list
│   ├── Assign / unassign to students
│   ├── Maintenance status (working / in repair / retired)
│   ├── Purchase date, warranty info
│   └── Device return tracking
│
├── Policies (Apply to groups of devices)
│   ├── Exam Policy: lock browser, disable right-click, disable downloads
│   ├── Class Hours Policy: block social/games during school hours
│   ├── Home Policy: full access but usage reports to parents
│   └── Custom Policy: IT admin builds custom rules
│
└── Reports
    ├── Devices per student
    ├── Active sessions right now (live)
    ├── Devices with no recent activity
    └── Device health / issue log
```

### "No Device" Student Support
Students with no device get:
- Printable lesson PDFs (teacher marks as "print required")
- Assignments can be submitted by teacher on their behalf (teacher enters paper submission)
- Parents can request a school device loan
- Homework can be submitted by paper and teacher uploads a photo
- They can use school lab or library computers

### What Admin / Department Head Sees
- Per-student: Which device type, how many devices registered, last active
- Per class: How many BYOD / School device / No device students
- IT Admin gets alert if school device hasn't been returned

---

## DYNAMIC SCHOOL MODULE SYSTEM

### How It Works

Each school gets a **module set** based on its type. The developer/super admin page allows enabling or disabling any module per school.

```
Developer Admin Panel → School: [Cairo British Academy]
├── Core Modules (always on, cannot disable)
│   ├── ✅ User Management
│   ├── ✅ Course Management
│   ├── ✅ Gradebook
│   ├── ✅ Attendance
│   └── ✅ Messaging
│
├── Academic Modules (toggle per school)
│   ├── ✅ Quiz Engine
│   ├── ✅ Assignment Module
│   ├── ✅ Live Classes
│   ├── ✅ Question Bank
│   └── ✅ AI Tutor
│
├── School Management Modules
│   ├── ✅ Financial Management
│   ├── ✅ Library
│   ├── ✅ Health / Nurse
│   ├── ✅ Transportation
│   ├── ✅ Canteen / Cafeteria
│   ├── ✅ Events & Activities
│   ├── ✅ Ticket System
│   ├── ✅ Device Management
│   ├── ✅ HR Management
│   ├── ✅ Admission & Enrollment
│   └── ✅ Store / Inventory
│
├── Curriculum-Specific Modules
│   ├── [If British] ✅ GCSE/A-Level Tracking
│   ├── [If British] ✅ Ofsted Report Format
│   ├── [If American] ✅ Common Core Alignment
│   ├── [If American] ✅ AP Course Management
│   ├── [If IB] ✅ ToK / EE / CAS Tracking
│   ├── [If Egyptian] ✅ Ministry of Education Reports
│   └── [If Saudi] ✅ Saudi MOE Standards
│
└── Custom Fields (developer adds per school)
    ├── + Add Custom Field to Student Profile
    ├── + Add Custom Field to Course
    ├── + Add Custom Module (blank page builder)
    └── - Remove Custom Field
```

### Preset Module Bundles (Based on School Type)

**National Egyptian School Bundle:**
- Core modules
- Ministry of Education reporting fields
- Arabic-first grading (percentage based)
- National exam schedule
- Arabic/Islamic Studies module
- Quran memorization tracker (optional)
- Government enrollment forms

**National Saudi School Bundle:**
- Core modules
- Saudi MOE standards alignment
- Hijri calendar integration
- Islamic Studies tracking
- Government exam formats
- Arabic-first UI forced

**American School Bundle:**
- Core modules
- Common Core / AP / SAT prep module
- GPA calculation (4.0 scale)
- College counseling module (Grade 9+)
- Sports programs management
- Homeroom system
- US-style report card format

**British School Bundle:**
- Core modules
- GCSE / A-Level tracking
- Year group system (Reception → Year 13)
- Ofsted documentation
- EYFS (Early Years) tracking (for Reception/KG)
- British-style report card
- Personal Statement guidance (Year 12+)

**IB School Bundle:**
- Core modules
- IB programme standards
- ToK essay tracker
- Extended Essay (EE) supervisor module
- CAS hours tracker
- IB grade scale (1-7)
- Predicted grades system
- IB reporting format

**International School Bundle:**
- All of the above can be mixed
- Multi-curriculum classes
- Bilingual report cards
- Multiple grading scale support per course

### Custom Field Builder (Developer Page)
The developer page allows:
- Add a text field / number field / date field / dropdown to any profile or form
- Set which roles can see/edit it
- Set if it's required or optional
- Add to: Student profile, Teacher profile, Course, Report card, Enrollment form
- Remove any custom field (with data archive, not hard delete)
- Add a completely custom page/module (empty canvas that school admin fills)

---

## HR MODULE (Staff Management)

### Features
- Staff directory (all employees)
- Contract management (type, start date, end date, status)
- Leave management:
  - Leave types: Annual, Sick, Emergency, Unpaid
  - Apply for leave (teacher submits)
  - Approval workflow (department head → HR → principal)
  - Leave balance tracker
  - Leave calendar (who is absent today)
- Staff evaluation forms (filled by department head / principal)
- Professional development tracking (training, courses attended)
- Documents vault (ID, certificates, contracts — secure upload)
- Payroll export (to CSV for external payroll system)
- Probation tracking (new employees)
- Staff onboarding checklist

---

## CANTEEN / CAFETERIA MODULE

### Features
- Daily menu builder (breakfast, lunch, snacks)
- Meal categories: main, vegetarian, allergy-free, etc.
- Allergen flagging (nut-free, gluten-free, halal label)
- Pre-order system (parent orders meal online the night before)
- Canteen wallet (parent tops up balance, student uses)
- Cashless payment in canteen (student scans QR or face/ID)
- Daily sales report
- Stock deduction (when item sold, stock reduces)
- Popular items report
- Out-of-stock alerts
- Dietary preference per student (nurse module links here)

---

## STORE / INVENTORY MODULE

### Features
- Item catalog (uniforms, books, stationery, equipment)
- Stock tracking (how many units in stock)
- Low stock alerts
- Issue to student (record which student got which item)
- Return tracking
- Purchase orders (request to buy more stock)
- Damage/loss reporting
- School device inventory (links to Device Management)
- Annual book set distribution tracking
- Invoice for purchased items (links to Finance module)

---

## ADMISSION & ENROLLMENT MODULE

### Features
**Online Application:**
- Public application form (no login needed to apply)
- Family information, student info, previous school, documents upload
- Application status: Submitted → Under Review → Accepted → Rejected → Enrolled
- Automated email/SMS at each stage

**Admission Officer Dashboard:**
- All applications pipeline (Kanban board: Applied / Reviewing / Interview / Accepted / Enrolled)
- Review documents inline
- Schedule admission test or interview
- Send acceptance/rejection letter (templated, school-branded)
- Waitlist management
- Capacity tracking per grade (how many spots left)

**Enrollment (After Acceptance):**
- Send enrollment link to parents
- Parent fills enrollment form (guardian info, medical, emergency contacts)
- Document checklist (birth certificate, vaccination, previous transcripts)
- Automatic account creation on completion
- Assign to class/section
- Generate welcome email with credentials

---

## RECEPTIONIST MODULE

### Features
- Visitor management (log who came, who they are visiting, purpose, time in/out)
- Visitor badge printing
- Walk-in parent registration (log the visit, notify relevant teacher/admin)
- Phone call log (who called, about what, forwarded to whom)
- Lost & found log
- Mail / package receiving log
- Daily visitor report
- Early student pickup authorization (parent shows ID, system verifies authorized person)

---

## COUNSELOR MODULE

### Features
- Private student session log (confidential, only counselor + admin can see)
- Referral from teacher (teacher flags student → counselor assigned)
- Mental health check-in data (from daily mood module — anonymous stats)
- Academic counseling (course selection, grade concerns)
- Behavioral case management
- Parent communication log
- External referral (to psychologist, special needs support)
- College/university guidance (Grade 10+):
  - University shortlist builder
  - Application tracker
  - Personal statement help
  - SAT/IELTS/TOEFL score tracker
  - Scholarship opportunities

---

## MATRON / HOUSE PARENT MODULE (Boarding Schools)

### Features
- Dormitory management (room assignments)
- Student check-in/out (leave and return to dorm)
- Overnight absence tracking
- Lights-out schedule monitoring
- Weekly welfare check log per student
- Behavioral notes
- Laundry schedule
- Parent notification for off-campus permissions
- Weekend leave approval workflow
- Emergency contact quick access
- Dorm maintenance requests

---

*Update these sections in: 03_LMS_Master_Plan_EN.md and 04_LMS_Master_Plan_AR.md*
*Update tasks in: 05_LMS_Tasks.md*
