'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, getApiError } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardBody, Skeleton } from '@/components/ui'
import {
  Users, AlertTriangle, Heart, FileText, Star, Search,
  Plus, ChevronRight, CheckCircle2, Clock,
  TrendingUp, TrendingDown, Shield,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { ar } from 'date-fns/locale'
import toast from 'react-hot-toast'

// ─── Constants ────────────────────────────────────────────────────────────────

const INCIDENT_TYPES = [
  { value: 'MISCONDUCT',             label: 'Misconduct',             labelAr: 'سوء التصرف' },
  { value: 'BULLYING',               label: 'Bullying',               labelAr: 'التنمر' },
  { value: 'LATE_ARRIVAL',           label: 'Late Arrival',           labelAr: 'التأخر' },
  { value: 'UNIFORM_VIOLATION',      label: 'Uniform Violation',      labelAr: 'مخالفة الزي' },
  { value: 'CHEATING',               label: 'Cheating',               labelAr: 'الغش' },
  { value: 'VANDALISM',              label: 'Vandalism',              labelAr: 'التخريب' },
  { value: 'FIGHTING',               label: 'Fighting',               labelAr: 'الشجار' },
  { value: 'DISRESPECT',             label: 'Disrespect',             labelAr: 'عدم الاحترام' },
  { value: 'ABSENCE_WITHOUT_EXCUSE', label: 'Unexcused Absence',      labelAr: 'غياب بدون عذر' },
  { value: 'PROPERTY_DAMAGE',        label: 'Property Damage',        labelAr: 'إتلاف الممتلكات' },
  { value: 'OTHER',                  label: 'Other',                  labelAr: 'أخرى' },
]

const SEVERITIES = [
  { value: 'LOW',      label: 'Low',      labelAr: 'منخفض',    color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'MEDIUM',   label: 'Medium',   labelAr: 'متوسط',    color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { value: 'HIGH',     label: 'High',     labelAr: 'مرتفع',    color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { value: 'CRITICAL', label: 'Critical', labelAr: 'حرج',      color: 'text-red-600 bg-red-50 border-red-200' },
]

const COUNSELING_TYPES = [
  { value: 'ACADEMIC',      label: 'Academic',       labelAr: 'أكاديمي' },
  { value: 'BEHAVIORAL',    label: 'Behavioral',     labelAr: 'سلوكي' },
  { value: 'PERSONAL',      label: 'Personal',       labelAr: 'شخصي' },
  { value: 'FAMILY',        label: 'Family',         labelAr: 'عائلي' },
  { value: 'CAREER',        label: 'Career',         labelAr: 'مهني' },
  { value: 'PEER_CONFLICT', label: 'Peer Conflict',  labelAr: 'نزاع مع الأقران' },
  { value: 'CRISIS',        label: 'Crisis',         labelAr: 'أزمة' },
]

const DOCUMENT_TYPES = [
  { value: 'ENROLLMENT_CERTIFICATE',  label: 'Enrollment Certificate',   labelAr: 'شهادة قيد' },
  { value: 'CONDUCT_CERTIFICATE',     label: 'Conduct Certificate',       labelAr: 'شهادة سلوك' },
  { value: 'TRANSFER_LETTER',         label: 'Transfer Letter',           labelAr: 'خطاب نقل' },
  { value: 'GRADE_TRANSCRIPT',        label: 'Grade Transcript',          labelAr: 'كشف درجات' },
  { value: 'ACHIEVEMENT_LETTER',      label: 'Achievement Letter',        labelAr: 'خطاب تفوق' },
  { value: 'DISCIPLINARY_LETTER',     label: 'Disciplinary Letter',       labelAr: 'خطاب إنذار' },
  { value: 'WITHDRAWAL_CERTIFICATE',  label: 'Withdrawal Certificate',    labelAr: 'شهادة انسحاب' },
  { value: 'OTHER',                   label: 'Other',                     labelAr: 'أخرى' },
]

const TABS = [
  { id: 'overview',   label: 'Overview',   labelAr: 'نظرة عامة',   icon: Shield },
  { id: 'students',   label: 'Students',   labelAr: 'الطلاب',       icon: Users },
  { id: 'discipline', label: 'Discipline', labelAr: 'الانضباط',     icon: AlertTriangle },
  { id: 'counseling', label: 'Counseling', labelAr: 'الإرشاد',      icon: Heart },
  { id: 'documents',  label: 'Documents',  labelAr: 'المستندات',    icon: FileText },
  { id: 'behavior',   label: 'Behavior',   labelAr: 'السلوك',       icon: Star },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function severityBadge(severity: string, isRtl: boolean) {
  const s = SEVERITIES.find((x) => x.value === severity)
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${s?.color ?? 'text-gray-500 bg-gray-50 border-gray-200'}`}>
      {isRtl ? s?.labelAr : s?.label}
    </span>
  )
}

function studentName(u: any, isRtl: boolean) {
  if (!u?.profile) return u?.email ?? '—'
  return isRtl
    ? `${u.profile.firstNameAr || u.profile.firstName} ${u.profile.lastNameAr || u.profile.lastName}`
    : `${u.profile.firstName} ${u.profile.lastName}`
}

function relativeTime(date: string, isRtl: boolean) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: isRtl ? ar : undefined })
}

function inputCls() {
  return 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 bg-white'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: any; sub?: string; color: string }) {
  return (
    <Card>
      <CardBody className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            <Icon size={20} />
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

function StudentSearchSelect({ value, onChange, isRtl, placeholder }: {
  value: string; onChange: (id: string, name: string) => void
  isRtl: boolean; placeholder?: string
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [selectedName, setSelectedName] = useState('')

  const { data } = useQuery({
    queryKey: ['sa-student-search', search],
    queryFn: () => api.get('/student-affairs/students', { params: { search, limit: 8 } }).then((r) => r.data?.data || []),
    enabled: open && search.length >= 2,
  })

  return (
    <div className="relative">
      <input
        value={value ? selectedName : search}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); if (!e.target.value) onChange('', '') }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? (isRtl ? 'ابحث عن طالب...' : 'Search student...')}
        className={inputCls()}
      />
      {open && (data || []).length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {(data || []).map((s: any) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                const name = studentName(s, isRtl)
                onChange(s.id, name)
                setSelectedName(name)
                setSearch('')
                setOpen(false)
              }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3"
            >
              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700 shrink-0">
                {(s.profile?.firstName?.[0] ?? '?').toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900">{studentName(s, isRtl)}</p>
                <p className="text-xs text-gray-400">{s.profile?.studentId ?? s.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab panels ───────────────────────────────────────────────────────────────

function OverviewTab({ isRtl }: { isRtl: boolean }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['sa-stats'],
    queryFn: () => api.get('/student-affairs/stats').then((r) => r.data?.data ?? r.data),
  })
  const { data: recentIncidents } = useQuery({
    queryKey: ['sa-discipline-recent'],
    queryFn: () => api.get('/student-affairs/discipline', { params: { limit: 5 } }).then((r) => r.data?.data || []),
  })
  const { data: recentSessions } = useQuery({
    queryKey: ['sa-counseling-recent'],
    queryFn: () => api.get('/student-affairs/counseling', { params: { limit: 5 } }).then((r) => r.data?.data || []),
  })

  if (isLoading) return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users}        label={isRtl ? 'إجمالي الطلاب' : 'Total Students'}    value={stats?.totalStudents}       color="bg-blue-50 text-blue-600" />
        <StatCard icon={Users}        label={isRtl ? 'طلاب نشطون' : 'Active Students'}       value={stats?.activeStudents}      color="bg-green-50 text-green-600" />
        <StatCard icon={AlertTriangle} label={isRtl ? 'حوادث هذا الشهر' : 'Incidents (Month)'} value={stats?.incidentsThisMonth} sub={isRtl ? `${stats?.openIncidents} مفتوحة` : `${stats?.openIncidents} open`} color="bg-red-50 text-red-600" />
        <StatCard icon={Heart}        label={isRtl ? 'جلسات هذا الشهر' : 'Sessions (Month)'}  value={stats?.sessionsThisMonth}   color="bg-purple-50 text-purple-600" />
        <StatCard icon={FileText}     label={isRtl ? 'مستندات صادرة' : 'Docs Issued (Month)'} value={stats?.docsIssuedThisMonth} color="bg-indigo-50 text-indigo-600" />
        <StatCard icon={TrendingUp}   label={isRtl ? 'ملاحظات إيجابية' : 'Positive Notes'}   value={stats?.positiveNotes}       color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={TrendingDown} label={isRtl ? 'ملاحظات سلبية' : 'Negative Notes'}     value={stats?.negativeNotes}       color="bg-orange-50 text-orange-600" />
        <StatCard icon={Shield}       label={isRtl ? 'حوادث مفتوحة' : 'Open Incidents'}       value={stats?.openIncidents}      color="bg-amber-50 text-amber-600" />
      </div>

      {/* Recent activity */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent incidents */}
        <Card>
          <CardBody>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              {isRtl ? 'آخر الحوادث' : 'Recent Incidents'}
            </h3>
            {(recentIncidents || []).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">{isRtl ? 'لا توجد حوادث' : 'No incidents'}</p>
            ) : (
              <div className="space-y-2">
                {(recentIncidents || []).map((r: any) => (
                  <div key={r.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${r.resolved ? 'bg-green-400' : 'bg-red-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{studentName(r.student, isRtl)}</p>
                      <p className="text-xs text-gray-500 truncate">{r.description}</p>
                    </div>
                    <div className="shrink-0 text-end">
                      {severityBadge(r.severity, isRtl)}
                      <p className="text-[10px] text-gray-400 mt-0.5">{relativeTime(r.createdAt, isRtl)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Recent counseling */}
        <Card>
          <CardBody>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Heart size={16} className="text-purple-500" />
              {isRtl ? 'آخر الجلسات الإرشادية' : 'Recent Counseling Sessions'}
            </h3>
            {(recentSessions || []).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">{isRtl ? 'لا توجد جلسات' : 'No sessions'}</p>
            ) : (
              <div className="space-y-2">
                {(recentSessions || []).map((s: any) => (
                  <div key={s.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700 shrink-0">
                      {(s.student?.profile?.firstName?.[0] ?? '?').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{studentName(s.student, isRtl)}</p>
                      <p className="text-xs text-gray-500 truncate">{s.summary}</p>
                    </div>
                    <p className="text-[10px] text-gray-400 shrink-0">{relativeTime(s.sessionDate, isRtl)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

function StudentsTab({ isRtl }: { isRtl: boolean }) {
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['sa-students', search],
    queryFn: () => api.get('/student-affairs/students', { params: { search, limit: 30 } }).then((r) => r.data),
  })

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['sa-student-detail', selectedStudent?.id],
    queryFn: () => api.get(`/student-affairs/students/${selectedStudent.id}`).then((r) => r.data?.data ?? r.data),
    enabled: !!selectedStudent?.id,
  })

  const students = data?.data || []

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Student list */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isRtl ? 'بحث عن طالب...' : 'Search students...'}
            className="flex-1 text-sm outline-none bg-transparent"
          />
        </div>

        <Card>
          <CardBody className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : students.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Users size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">{isRtl ? 'لا يوجد طلاب' : 'No students found'}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[60vh] overflow-y-auto">
                {students.map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${selectedStudent?.id === s.id ? 'bg-primary-50' : ''}`}
                  >
                    <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700 shrink-0">
                      {(s.profile?.firstName?.[0] ?? '?').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{studentName(s, isRtl)}</p>
                      <p className="text-xs text-gray-400">{s.profile?.studentId ?? s.email}</p>
                    </div>
                    <div className="text-end shrink-0 space-y-0.5">
                      {s._count?.disciplinaryRecords > 0 && (
                        <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full block">
                          {s._count.disciplinaryRecords} {isRtl ? 'حوادث' : 'incidents'}
                        </span>
                      )}
                      {s._count?.counselingAsStudent > 0 && (
                        <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full block">
                          {s._count.counselingAsStudent} {isRtl ? 'جلسات' : 'sessions'}
                        </span>
                      )}
                    </div>
                    <ChevronRight size={14} className="text-gray-300 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Student detail */}
      <div className="lg:col-span-3">
        {!selectedStudent ? (
          <Card>
            <CardBody className="py-20 text-center text-gray-400">
              <Shield size={48} className="mx-auto mb-3 opacity-20" />
              <p>{isRtl ? 'اختر طالباً لعرض ملفه الكامل' : 'Select a student to view their full profile'}</p>
            </CardBody>
          </Card>
        ) : detailLoading ? (
          <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
        ) : detail ? (
          <div className="space-y-4">
            {/* Header card */}
            <Card>
              <CardBody className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center text-xl font-bold text-primary-700">
                    {(detail.profile?.firstName?.[0] ?? '?').toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900">{studentName(detail, isRtl)}</h2>
                    <p className="text-sm text-gray-500">{detail.email}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {detail.profile?.studentId && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">ID: {detail.profile.studentId}</span>
                      )}
                      {detail.profile?.gender && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">{detail.profile.gender}</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${detail.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {detail.isActive ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'غير نشط' : 'Inactive')}
                      </span>
                    </div>
                  </div>
                  {/* Behavior score */}
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${detail.behaviorScore >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {detail.behaviorScore >= 0 ? '+' : ''}{detail.behaviorScore}
                    </div>
                    <p className="text-[10px] text-gray-400">{isRtl ? 'نقاط السلوك' : 'Behavior score'}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Disciplinary records */}
            {detail.disciplinaryRecords?.length > 0 && (
              <Card>
                <CardBody>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                    <AlertTriangle size={14} className="text-red-500" />
                    {isRtl ? 'السجل الانضباطي' : 'Disciplinary Records'}
                  </h3>
                  <div className="space-y-2">
                    {detail.disciplinaryRecords.slice(0, 5).map((r: any) => (
                      <div key={r.id} className="flex items-center gap-3 text-sm p-2 bg-gray-50 rounded-lg">
                        {r.resolved
                          ? <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                          : <Clock size={14} className="text-amber-500 shrink-0" />}
                        <p className="flex-1 text-gray-700 truncate">{r.description}</p>
                        {severityBadge(r.severity, isRtl)}
                        <p className="text-[10px] text-gray-400 shrink-0">{format(new Date(r.createdAt), 'dd/MM/yy')}</p>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Counseling sessions */}
            {detail.counselingAsStudent?.length > 0 && (
              <Card>
                <CardBody>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                    <Heart size={14} className="text-purple-500" />
                    {isRtl ? 'جلسات الإرشاد' : 'Counseling Sessions'}
                  </h3>
                  <div className="space-y-2">
                    {detail.counselingAsStudent.map((s: any) => (
                      <div key={s.id} className="p-2 bg-purple-50 rounded-lg text-sm">
                        <p className="font-medium text-gray-800">{s.summary}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{format(new Date(s.sessionDate), 'dd MMM yyyy')}</p>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Behavior notes */}
            {detail.behaviorNotes?.length > 0 && (
              <Card>
                <CardBody>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                    <Star size={14} className="text-amber-500" />
                    {isRtl ? 'ملاحظات السلوك' : 'Behavior Notes'}
                  </h3>
                  <div className="space-y-2">
                    {detail.behaviorNotes.slice(0, 8).map((n: any) => (
                      <div key={n.id} className={`flex items-center gap-3 p-2 rounded-lg text-sm ${n.isPositive ? 'bg-green-50' : 'bg-red-50'}`}>
                        {n.isPositive
                          ? <TrendingUp size={14} className="text-green-600 shrink-0" />
                          : <TrendingDown size={14} className="text-red-600 shrink-0" />}
                        <p className={`flex-1 ${n.isPositive ? 'text-green-800' : 'text-red-800'}`}>{n.description}</p>
                        <span className={`text-xs font-bold ${n.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {n.isPositive ? '+' : '-'}{n.points}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Parent contacts */}
            {detail.parentLinks?.length > 0 && (
              <Card>
                <CardBody>
                  <h3 className="font-semibold text-gray-800 mb-3 text-sm">{isRtl ? 'أولياء الأمور' : 'Parent Contacts'}</h3>
                  <div className="space-y-2">
                    {detail.parentLinks.map((l: any) => (
                      <div key={l.id} className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                          {(l.parent?.profile?.firstName?.[0] ?? '?').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{studentName(l.parent, isRtl)}</p>
                          <p className="text-xs text-gray-400">{l.parent?.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function DisciplineTab({ isRtl }: { isRtl: boolean }) {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState({ resolved: '', severity: '' })
  const [form, setForm] = useState({
    studentId: '', studentName: '', type: 'OTHER', severity: 'MEDIUM',
    description: '', actionTaken: '', parentNotified: false, notes: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['sa-discipline', filter],
    queryFn: () => api.get('/student-affairs/discipline', { params: filter }).then((r) => r.data),
  })

  const create = useMutation({
    mutationFn: (dto: any) => api.post('/student-affairs/discipline', dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-discipline'] })
      qc.invalidateQueries({ queryKey: ['sa-stats'] })
      setShowCreate(false)
      setForm({ studentId: '', studentName: '', type: 'OTHER', severity: 'MEDIUM', description: '', actionTaken: '', parentNotified: false, notes: '' })
      toast.success(isRtl ? 'تم تسجيل الحادثة' : 'Incident logged')
    },
    onError: (err: any) => toast.error(getApiError(err, isRtl ? 'فشل التسجيل' : 'Failed to log incident')),
  })

  const resolve = useMutation({
    mutationFn: ({ id, data }: any) => api.patch(`/student-affairs/discipline/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-discipline'] }); qc.invalidateQueries({ queryKey: ['sa-stats'] }) },
  })

  const records = data?.data || []

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filter.resolved} onChange={(e) => setFilter((f) => ({ ...f, resolved: e.target.value }))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-500 bg-white">
          <option value="">{isRtl ? 'الكل' : 'All Status'}</option>
          <option value="false">{isRtl ? 'مفتوحة' : 'Open'}</option>
          <option value="true">{isRtl ? 'محلولة' : 'Resolved'}</option>
        </select>
        <select value={filter.severity} onChange={(e) => setFilter((f) => ({ ...f, severity: e.target.value }))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-500 bg-white">
          <option value="">{isRtl ? 'كل الخطورة' : 'All Severity'}</option>
          {SEVERITIES.map((s) => <option key={s.value} value={s.value}>{isRtl ? s.labelAr : s.label}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-800">
          <Plus size={16} /> {isRtl ? 'تسجيل حادثة' : 'Log Incident'}
        </button>
      </div>

      {/* Records table */}
      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : records.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <AlertTriangle size={40} className="mx-auto mb-2 opacity-20" />
              <p>{isRtl ? 'لا توجد حوادث' : 'No incidents found'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {records.map((r: any) => (
                <div key={r.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">{studentName(r.student, isRtl)}</p>
                        {severityBadge(r.severity, isRtl)}
                        <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-100 rounded-full">
                          {isRtl ? INCIDENT_TYPES.find((t) => t.value === r.type)?.labelAr : INCIDENT_TYPES.find((t) => t.value === r.type)?.label}
                        </span>
                        {r.parentNotified && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{isRtl ? 'تم إبلاغ ولي الأمر' : 'Parent notified'}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{r.description}</p>
                      {r.actionTaken && <p className="text-xs text-gray-500 mt-0.5">{isRtl ? 'الإجراء: ' : 'Action: '}{r.actionTaken}</p>}
                      <p className="text-xs text-gray-400 mt-1">{isRtl ? 'بواسطة: ' : 'By: '}{studentName(r.reportedBy, isRtl)} · {relativeTime(r.createdAt, isRtl)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.resolved ? (
                        <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 size={13} />{isRtl ? 'محلولة' : 'Resolved'}</span>
                      ) : (
                        <button onClick={() => resolve.mutate({ id: r.id, data: { resolved: true } })}
                          className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                          <CheckCircle2 size={13} /> {isRtl ? 'حل' : 'Resolve'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{isRtl ? 'تسجيل حادثة انضباطية' : 'Log Disciplinary Incident'}</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'الطالب *' : 'Student *'}</label>
                <StudentSearchSelect value={form.studentId} onChange={(id, name) => setForm((f) => ({ ...f, studentId: id, studentName: name }))} isRtl={isRtl} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'نوع المخالفة *' : 'Incident Type *'}</label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className={inputCls()}>
                    {INCIDENT_TYPES.map((t) => <option key={t.value} value={t.value}>{isRtl ? t.labelAr : t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'درجة الخطورة *' : 'Severity *'}</label>
                  <select value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))} className={inputCls()}>
                    {SEVERITIES.map((s) => <option key={s.value} value={s.value}>{isRtl ? s.labelAr : s.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'وصف الحادثة *' : 'Description *'}</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={inputCls() + ' resize-none'} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'الإجراء المتخذ' : 'Action Taken'}</label>
                <input value={form.actionTaken} onChange={(e) => setForm((f) => ({ ...f, actionTaken: e.target.value }))} className={inputCls()} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'ملاحظات إضافية' : 'Additional Notes'}</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className={inputCls() + ' resize-none'} />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.parentNotified} onChange={(e) => setForm((f) => ({ ...f, parentNotified: e.target.checked }))} />
                {isRtl ? 'تم إبلاغ ولي الأمر' : 'Parent has been notified'}
              </label>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">{isRtl ? 'إلغاء' : 'Cancel'}</button>
              <button
                onClick={() => create.mutate({ studentId: form.studentId, type: form.type, severity: form.severity, description: form.description, actionTaken: form.actionTaken || undefined, parentNotified: form.parentNotified, notes: form.notes || undefined })}
                disabled={!form.studentId || !form.description || create.isPending}
                className="flex-1 bg-primary-900 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60">
                {create.isPending ? (isRtl ? 'جارٍ...' : 'Saving...') : (isRtl ? 'تسجيل' : 'Log Incident')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CounselingTab({ isRtl }: { isRtl: boolean }) {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    studentId: '', studentName: '', type: 'PERSONAL',
    summary: '', notes: '', isPrivate: true, followUpDate: '', sessionDate: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['sa-counseling'],
    queryFn: () => api.get('/student-affairs/counseling').then((r) => r.data),
  })

  const create = useMutation({
    mutationFn: (dto: any) => api.post('/student-affairs/counseling', dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-counseling'] })
      qc.invalidateQueries({ queryKey: ['sa-stats'] })
      setShowCreate(false)
      setForm({ studentId: '', studentName: '', type: 'PERSONAL', summary: '', notes: '', isPrivate: true, followUpDate: '', sessionDate: '' })
      toast.success(isRtl ? 'تم تسجيل الجلسة' : 'Session logged')
    },
    onError: (err: any) => toast.error(getApiError(err, isRtl ? 'فشل التسجيل' : 'Failed to log session')),
  })

  const sessions = data?.data || []

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-800">
          <Plus size={16} /> {isRtl ? 'تسجيل جلسة' : 'Log Session'}
        </button>
      </div>

      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : sessions.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Heart size={40} className="mx-auto mb-2 opacity-20" />
              <p>{isRtl ? 'لا توجد جلسات إرشادية' : 'No counseling sessions'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {sessions.map((s: any) => (
                <div key={s.id} className="px-5 py-4">
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-700 shrink-0">
                      {(s.student?.profile?.firstName?.[0] ?? '?').toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">{studentName(s.student, isRtl)}</p>
                        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                          {isRtl ? COUNSELING_TYPES.find((t) => t.value === s.type)?.labelAr : COUNSELING_TYPES.find((t) => t.value === s.type)?.label}
                        </span>
                        {s.isPrivate && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{isRtl ? 'سري' : 'Private'}</span>}
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{s.summary}</p>
                      {s.followUpDate && (
                        <p className="text-xs text-amber-600 mt-0.5">
                          {isRtl ? 'متابعة: ' : 'Follow-up: '}{format(new Date(s.followUpDate), 'dd MMM yyyy')}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {isRtl ? 'المرشد: ' : 'Counselor: '}{studentName(s.counselor, isRtl)} · {format(new Date(s.sessionDate), 'dd MMM yyyy')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{isRtl ? 'تسجيل جلسة إرشادية' : 'Log Counseling Session'}</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'الطالب *' : 'Student *'}</label>
                <StudentSearchSelect value={form.studentId} onChange={(id, name) => setForm((f) => ({ ...f, studentId: id, studentName: name }))} isRtl={isRtl} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'نوع الجلسة *' : 'Session Type *'}</label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className={inputCls()}>
                    {COUNSELING_TYPES.map((t) => <option key={t.value} value={t.value}>{isRtl ? t.labelAr : t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'تاريخ الجلسة' : 'Session Date'}</label>
                  <input type="date" value={form.sessionDate} onChange={(e) => setForm((f) => ({ ...f, sessionDate: e.target.value }))} className={inputCls()} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'ملخص الجلسة *' : 'Session Summary *'}</label>
                <textarea rows={3} value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} className={inputCls() + ' resize-none'} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'ملاحظات (سرية)' : 'Notes (private)'}</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className={inputCls() + ' resize-none'} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'تاريخ المتابعة' : 'Follow-up Date'}</label>
                <input type="date" value={form.followUpDate} onChange={(e) => setForm((f) => ({ ...f, followUpDate: e.target.value }))} className={inputCls()} />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isPrivate} onChange={(e) => setForm((f) => ({ ...f, isPrivate: e.target.checked }))} />
                {isRtl ? 'الجلسة سرية (لن تظهر في ملف الطالب العام)' : 'Mark session as private'}
              </label>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">{isRtl ? 'إلغاء' : 'Cancel'}</button>
              <button
                onClick={() => create.mutate({ studentId: form.studentId, type: form.type, summary: form.summary, notes: form.notes || undefined, isPrivate: form.isPrivate, followUpDate: form.followUpDate || undefined, sessionDate: form.sessionDate || undefined })}
                disabled={!form.studentId || !form.summary || create.isPending}
                className="flex-1 bg-primary-900 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60">
                {create.isPending ? (isRtl ? 'جارٍ...' : 'Saving...') : (isRtl ? 'تسجيل' : 'Log Session')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DocumentsTab({ isRtl }: { isRtl: boolean }) {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [form, setForm] = useState({ studentId: '', studentName: '', type: 'ENROLLMENT_CERTIFICATE', title: '', notes: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['sa-documents', filterType],
    queryFn: () => api.get('/student-affairs/documents', { params: { type: filterType || undefined } }).then((r) => r.data),
  })

  const create = useMutation({
    mutationFn: (dto: any) => api.post('/student-affairs/documents', dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-documents'] })
      qc.invalidateQueries({ queryKey: ['sa-stats'] })
      setShowCreate(false)
      setForm({ studentId: '', studentName: '', type: 'ENROLLMENT_CERTIFICATE', title: '', notes: '' })
      toast.success(isRtl ? 'تم إصدار المستند' : 'Document issued')
    },
    onError: (err: any) => toast.error(getApiError(err, isRtl ? 'فشل الإصدار' : 'Failed to issue document')),
  })

  const docs = data?.data || []

  const docTypeLabel = (type: string) => {
    const t = DOCUMENT_TYPES.find((x) => x.value === type)
    return isRtl ? t?.labelAr : t?.label
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-500 bg-white">
          <option value="">{isRtl ? 'كل الأنواع' : 'All Types'}</option>
          {DOCUMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{isRtl ? t.labelAr : t.label}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-800">
          <Plus size={16} /> {isRtl ? 'إصدار مستند' : 'Issue Document'}
        </button>
      </div>

      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : docs.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <FileText size={40} className="mx-auto mb-2 opacity-20" />
              <p>{isRtl ? 'لا توجد مستندات' : 'No documents'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {docs.map((d: any) => (
                <div key={d.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{d.title}</p>
                    <p className="text-xs text-gray-500">{studentName(d.student, isRtl)}</p>
                  </div>
                  <div className="text-end">
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{docTypeLabel(d.type)}</span>
                    <p className="text-xs text-gray-400 mt-0.5">{format(new Date(d.issuedAt), 'dd MMM yyyy')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{isRtl ? 'إصدار مستند للطالب' : 'Issue Student Document'}</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'الطالب *' : 'Student *'}</label>
                <StudentSearchSelect value={form.studentId} onChange={(id, name) => setForm((f) => ({ ...f, studentId: id, studentName: name }))} isRtl={isRtl} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'نوع المستند *' : 'Document Type *'}</label>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className={inputCls()}>
                  {DOCUMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{isRtl ? t.labelAr : t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'عنوان المستند *' : 'Document Title *'}</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={inputCls()} placeholder={isRtl ? 'مثال: شهادة قيد للعام 2025' : 'e.g. Enrollment Certificate 2025'} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'ملاحظات' : 'Notes'}</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className={inputCls() + ' resize-none'} />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">{isRtl ? 'إلغاء' : 'Cancel'}</button>
              <button
                onClick={() => create.mutate({ studentId: form.studentId, type: form.type, title: form.title, notes: form.notes || undefined })}
                disabled={!form.studentId || !form.title || create.isPending}
                className="flex-1 bg-primary-900 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60">
                {create.isPending ? (isRtl ? 'جارٍ...' : 'Issuing...') : (isRtl ? 'إصدار' : 'Issue')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BehaviorTab({ isRtl }: { isRtl: boolean }) {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState('')
  const [form, setForm] = useState({ studentId: '', studentName: '', isPositive: true, points: 1, description: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['sa-behavior', filter],
    queryFn: () => api.get('/student-affairs/behavior', { params: { isPositive: filter || undefined } }).then((r) => r.data),
  })

  const create = useMutation({
    mutationFn: (dto: any) => api.post('/student-affairs/behavior', dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-behavior'] })
      qc.invalidateQueries({ queryKey: ['sa-stats'] })
      setShowCreate(false)
      setForm({ studentId: '', studentName: '', isPositive: true, points: 1, description: '' })
      toast.success(isRtl ? 'تمت الإضافة' : 'Note added')
    },
    onError: (err: any) => toast.error(getApiError(err, isRtl ? 'فشل' : 'Failed to add note')),
  })

  const notes = data?.data || []

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[['', isRtl ? 'الكل' : 'All'], ['true', isRtl ? 'إيجابية' : 'Positive'], ['false', isRtl ? 'سلبية' : 'Negative']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === v ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-800">
          <Plus size={16} /> {isRtl ? 'إضافة ملاحظة' : 'Add Note'}
        </button>
      </div>

      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : notes.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Star size={40} className="mx-auto mb-2 opacity-20" />
              <p>{isRtl ? 'لا توجد ملاحظات' : 'No behavior notes'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notes.map((n: any) => (
                <div key={n.id} className={`px-5 py-3 flex items-center gap-4 ${n.isPositive ? 'border-s-2 border-green-400' : 'border-s-2 border-red-400'}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${n.isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
                    {n.isPositive ? <TrendingUp size={16} className="text-green-600" /> : <TrendingDown size={16} className="text-red-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{studentName(n.student, isRtl)}</p>
                    <p className="text-sm text-gray-600">{n.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{isRtl ? 'بواسطة: ' : 'By: '}{studentName(n.addedBy, isRtl)} · {relativeTime(n.createdAt, isRtl)}</p>
                  </div>
                  <div className={`text-lg font-bold shrink-0 ${n.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {n.isPositive ? '+' : '-'}{n.points}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{isRtl ? 'إضافة ملاحظة سلوكية' : 'Add Behavior Note'}</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'الطالب *' : 'Student *'}</label>
                <StudentSearchSelect value={form.studentId} onChange={(id, name) => setForm((f) => ({ ...f, studentId: id, studentName: name }))} isRtl={isRtl} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">{isRtl ? 'نوع الملاحظة *' : 'Note Type *'}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setForm((f) => ({ ...f, isPositive: true }))}
                    className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 text-sm font-medium transition-all ${form.isPositive ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'}`}>
                    <TrendingUp size={16} /> {isRtl ? 'إيجابية' : 'Positive'}
                  </button>
                  <button type="button" onClick={() => setForm((f) => ({ ...f, isPositive: false }))}
                    className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 text-sm font-medium transition-all ${!form.isPositive ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500'}`}>
                    <TrendingDown size={16} /> {isRtl ? 'سلبية' : 'Negative'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'النقاط *' : 'Points *'}</label>
                <input type="number" min={1} max={10} value={form.points} onChange={(e) => setForm((f) => ({ ...f, points: +e.target.value }))} className={inputCls()} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'وصف الملاحظة *' : 'Description *'}</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={inputCls() + ' resize-none'} />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">{isRtl ? 'إلغاء' : 'Cancel'}</button>
              <button
                onClick={() => create.mutate({ studentId: form.studentId, isPositive: form.isPositive, points: form.points, description: form.description })}
                disabled={!form.studentId || !form.description || create.isPending}
                className="flex-1 bg-primary-900 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60">
                {create.isPending ? (isRtl ? 'جارٍ...' : 'Saving...') : (isRtl ? 'إضافة' : 'Add Note')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StudentAffairsPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isRtl ? 'شئون الطلاب' : 'Student Affairs'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isRtl
              ? 'إدارة الانضباط والإرشاد والوثائق والسلوك لكل مدرسة'
              : 'Discipline, counseling, documents & behavior — per school'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
          <Shield size={14} className="text-blue-500" />
          {isRtl ? 'البيانات مقيدة بالمدرسة الحالية' : 'Data scoped to current school'}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={15} />
              {isRtl ? tab.labelAr : tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'overview'   && <OverviewTab   isRtl={isRtl} />}
      {activeTab === 'students'   && <StudentsTab   isRtl={isRtl} />}
      {activeTab === 'discipline' && <DisciplineTab isRtl={isRtl} />}
      {activeTab === 'counseling' && <CounselingTab isRtl={isRtl} />}
      {activeTab === 'documents'  && <DocumentsTab  isRtl={isRtl} />}
      {activeTab === 'behavior'   && <BehaviorTab   isRtl={isRtl} />}
    </div>
  )
}
