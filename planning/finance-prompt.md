You are continuing development of the School Management System (SMS/ERP) project.  
Now you must design and implement a COMPLETE, ENTERPRISE-GRADE FINANCE & ACCOUNTS DEPARTMENT MODULE for a multi-school environment.

IMPORTANT:
This system is NOT for one school only.  
The platform supports a company/group that owns MULTIPLE schools and branches.

The finance system must therefore support:
- Multi-school architecture
- Separate accounting per school
- Consolidated financial reports for all schools together
- Different curriculums:
  - National
  - International
  - American
  - British
  - IG
- Different fee structures per curriculum and grade
- Multi-academic-year support
- Branch-level permissions
- Central finance administration

====================================================
CORE GOAL
====================================================

Build a FULL PROFESSIONAL FINANCE DEPARTMENT similar to enterprise ERP systems used in:
- International Schools
- Universities
- Educational Groups
- School Chains

The finance module must be deeply connected with ALL departments in the system.

This is NOT only “student fees”.
It is a COMPLETE financial ecosystem.

====================================================
PART 1 — MAIN FINANCE MODULES
====================================================

Implement ALL of the following modules professionally:

----------------------------------------------------
1. STUDENT BILLING & FEES
----------------------------------------------------

Create advanced fee management including:

- Tuition fees
- Registration fees
- Admission fees
- Bus fees
- Books fees
- Uniform fees
- Exam fees
- Activity fees
- Lab fees
- Hostel fees
- Cafeteria fees
- Insurance fees
- Re-enrollment fees
- Graduation fees
- Custom fees

Features:
- Fee categories
- Fee groups
- Fee templates
- Grade-based fees
- Curriculum-based fees
- Student-specific fee overrides
- Installment plans
- Auto installment generation
- Due dates
- Late fines
- Penalty rules
- Discounts
- Scholarships
- Sibling discounts
- Employee children discounts
- VAT/Tax support
- Credit notes
- Debit notes
- Refund management

----------------------------------------------------
2. PAYMENT MANAGEMENT
----------------------------------------------------

Support:

- Cash payments
- Bank transfer
- Credit cards
- Online payment gateways
- Apple Pay
- Google Pay
- POS terminals
- Mobile wallets
- Cheques

Features:
- Payment receipts
- Receipt printing
- QR receipts
- Partial payments
- Advance payments
- Overpayments
- Auto reconciliation
- Failed payments
- Pending payments
- Refund processing
- Multi-currency support
- Payment history
- Parent portal payment tracking

----------------------------------------------------
3. ACCOUNTING SYSTEM
----------------------------------------------------

Create FULL accounting system:

- Chart of accounts
- General ledger
- Journal entries
- Double-entry accounting
- Trial balance
- Balance sheet
- Profit & loss
- Cash flow
- Opening balances
- Fiscal years
- Accounting periods
- Bank reconciliation
- Cost centers
- School-wise accounting
- Department-wise accounting
- Budgeting
- Financial forecasting

----------------------------------------------------
4. PAYROLL SYSTEM
----------------------------------------------------

Create complete HR finance integration:

- Employee salaries
- Contracts
- Payroll generation
- Overtime
- Bonuses
- Deductions
- Loans
- Advances
- Attendance deductions
- Tax calculations
- Insurance deductions
- End-of-service calculations
- Payslips
- Bank transfer export
- Payroll approvals

----------------------------------------------------
5. PROCUREMENT & PURCHASES
----------------------------------------------------

Build procurement system:

- Purchase requests
- Purchase approvals
- Vendor quotations
- Purchase orders
- Goods receipt
- Vendor invoices
- Payment approvals
- Expense tracking

----------------------------------------------------
6. INVENTORY & ASSET FINANCE
----------------------------------------------------

Include:

- School inventory valuation
- Asset depreciation
- Asset purchasing
- Asset transfer between schools
- Asset maintenance costs
- Disposal tracking

----------------------------------------------------
7. TRANSPORT FINANCE
----------------------------------------------------

Features:
- Bus fee assignment
- Route pricing
- Driver payroll linkage
- Fuel expenses
- Maintenance expenses

----------------------------------------------------
8. CAFETERIA / STORE FINANCE
----------------------------------------------------

Features:
- Student wallet
- POS integration
- Product sales
- Daily revenue
- Supplier costs
- Stock finance tracking

----------------------------------------------------
9. FINANCIAL REPORTING & ANALYTICS
----------------------------------------------------

Create advanced dashboards and reports:

- Revenue reports
- Expense reports
- Collection reports
- Outstanding balances
- Student debt reports
- School profitability
- Branch profitability
- Parent aging reports
- Forecasting reports
- Budget variance reports
- Fee collection analytics
- Real-time dashboards

====================================================
PART 2 — CONNECTIONS WITH OTHER DEPARTMENTS
====================================================

You MUST implement FULL integration between Finance and every department below.

For EACH department explain:
1. What data flows between them
2. Why the connection exists
3. What triggers financial actions
4. What automation should happen
5. What reports should be shared
6. Permissions and approval flow

====================================================
A. FINANCE ↔ ADMISSIONS DEPARTMENT
====================================================

Connection Purpose:
Handle all financial operations during student admission.

Integration Includes:
- Admission fee generation
- Registration invoices
- Seat reservation payments
- Application payment tracking
- Auto invoice after acceptance
- Student activation only after payment
- Refunds for rejected applications
- Scholarship approval workflow

Automation:
- Generate financial profile when student is admitted
- Auto create fee plan based on:
  - curriculum
  - grade
  - branch
  - academic year

====================================================
B. FINANCE ↔ STUDENT AFFAIRS
====================================================

Connection Purpose:
Track student financial status.

Integration Includes:
- Outstanding balances
- Student account statements
- Fee restrictions
- Exam blocking for unpaid fees
- Report card restrictions
- Graduation clearance
- Transfer clearance

Automation:
- Prevent schedule/exam access if dues exceed limit
- Auto notify parents for overdue balances

====================================================
C. FINANCE ↔ ACADEMIC DEPARTMENT
====================================================

Connection Purpose:
Link academics with financial eligibility.

Integration Includes:
- Exam eligibility
- Course enrollment fees
- Subject fees
- Lab fees
- Activity fees
- Summer school fees

Automation:
- Prevent enrollment if payment incomplete
- Auto billing for extra subjects

====================================================
D. FINANCE ↔ HR DEPARTMENT
====================================================

Connection Purpose:
Complete payroll and employee finance.

Integration Includes:
- Salary processing
- Attendance deductions
- Leave deductions
- Staff loans
- Staff reimbursements
- Employee benefits
- Teacher bonuses

Automation:
- Auto payroll generation monthly
- Attendance-linked deductions
- End-of-service calculations

====================================================
E. FINANCE ↔ TRANSPORT DEPARTMENT
====================================================

Connection Purpose:
Manage transport-related income and expenses.

Integration Includes:
- Bus fee assignment
- Route pricing
- Driver salaries
- Fuel expenses
- Bus maintenance
- Route profitability

Automation:
- Auto assign transport fee after route selection
- Auto monthly billing

====================================================
F. FINANCE ↔ INVENTORY / STORE
====================================================

Connection Purpose:
Track school assets and stock financially.

Integration Includes:
- Purchase costs
- Inventory valuation
- Asset depreciation
- Uniform sales
- Book sales

Automation:
- Reduce stock after sale
- Auto journal entries for purchases

====================================================
G. FINANCE ↔ PROCUREMENT
====================================================

Connection Purpose:
Control purchasing and vendor payments.

Integration Includes:
- Purchase requests
- Approval workflows
- Vendor invoices
- Payment scheduling
- Budget validation

Automation:
- Prevent purchases exceeding budget
- Auto create payable accounts

====================================================
H. FINANCE ↔ PARENT PORTAL
====================================================

Connection Purpose:
Allow parents to manage payments.

Integration Includes:
- Online payments
- Invoice viewing
- Receipts
- Payment plans
- Debt tracking
- Financial notifications

Automation:
- Auto reminders
- Instant payment confirmation

====================================================
I. FINANCE ↔ ADMINISTRATION
====================================================

Connection Purpose:
Executive financial oversight.

Integration Includes:
- Financial KPIs
- School profitability
- Budget approvals
- Revenue tracking
- Expense approvals

Automation:
- Real-time dashboards
- Executive summaries

====================================================
J. FINANCE ↔ LIBRARY
====================================================

Connection Purpose:
Handle library penalties and fines.

Integration Includes:
- Late return fines
- Lost book charges
- Clearance checks

Automation:
- Auto add fines to student account

====================================================
K. FINANCE ↔ HOSTEL
====================================================

Connection Purpose:
Manage hostel billing.

Integration Includes:
- Hostel fees
- Room charges
- Damage penalties
- Meal plans

Automation:
- Monthly hostel invoices

====================================================
L. FINANCE ↔ SECURITY & ACCESS CONTROL
====================================================

Connection Purpose:
Restrict services for unpaid accounts.

Integration Includes:
- Access restrictions
- Smart card blocking
- Transport access
- Cafeteria wallet freeze

Automation:
- Auto restrictions after overdue limits

====================================================
PART 3 — ROLES & PERMISSIONS
====================================================

Create detailed RBAC permissions for:

- CFO
- Finance Manager
- School Accountant
- Cashier
- Payroll Officer
- Procurement Officer
- Auditor
- Branch Finance Admin
- Parent
- Student

Include:
- Approval hierarchy
- Multi-level approvals
- Audit logs
- Activity history
- Financial action tracking

====================================================
PART 4 — ENTERPRISE FEATURES
====================================================

Implement:

- Audit trails
- Transaction rollback protection
- Financial locking after closing periods
- Multi-currency
- Tax/VAT support
- Data export
- Excel/PDF reports
- API integrations
- Payment gateway integrations
- SMS/email notifications
- Real-time dashboards
- Scheduled reports
- Backup and recovery support

====================================================
PART 5 — DATABASE & ARCHITECTURE
====================================================

Design:
- Full database schema
- ERD relationships
- Finance microservice architecture if needed
- Scalable APIs
- Secure transactions
- Queue jobs for invoices/payments
- Event-driven integrations
- Financial transaction consistency

Include:
- Tables
- Relationships
- Indexing strategy
- Security considerations
- Financial data isolation per school

====================================================
PART 6 — UI/UX REQUIREMENTS
====================================================

Create professional enterprise UI/UX:

- Modern ERP dashboards
- Finance analytics widgets
- Collection graphs
- Revenue charts
- Expense tracking charts
- Mobile responsive finance pages
- Dark/light mode
- Fast cashier interface
- Parent-friendly payment screens

====================================================
PART 7 — EXPECTED OUTPUT
====================================================

I want you to generate:

1. Complete architecture
2. Full feature breakdown
3. Database design
4. APIs
5. UI pages
6. Workflows
7. User journeys
8. Permission system
9. Finance automations
10. Department integrations
11. Reports list
12. Notifications system
13. Payment workflows
14. Accounting workflows
15. Deployment considerations

DO NOT build a basic school fee module.

Build a REAL ENTERPRISE-GRADE SCHOOL ERP FINANCIAL SYSTEM comparable to:
- SAP School ERP
- Oracle NetSuite Education
- PowerSchool Finance
- Blackbaud
- EduCore-like systems

The system must be scalable, modular, maintainable, and production-ready.