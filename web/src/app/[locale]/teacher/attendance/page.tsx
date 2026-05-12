'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardHeader, CardBody, Avatar, Skeleton } from '@/components/ui'
import { QrCode, CheckSquare, RefreshCw } from 'lucide-react'

const STATUS_OPTIONS = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const
type AttendanceStatus = typeof STATUS_OPTIONS[number]

const STATUS_CONFIG: Record<AttendanceStatus, { color: string; bgColor: string; label: { en: string; ar: string } }> = {
  PRESENT: { color: 'text-green-700', bgColor: 'bg-green-100', label: { en: 'Present', ar: 'حاضر' } },
  ABSENT: { color: 'text-red-700', bgColor: 'bg-red-100', label: { en: 'Absent', ar: 'غائب' } },
  LATE: { color: 'text-yellow-700', bgColor: 'bg-yellow-100', label: { en: 'Late', ar: 'متأخر' } },
  EXCUSED: { color: 'text-blue-700', bgColor: 'bg-blue-100', label: { en: 'Excused', ar: 'بعذر' } },
}

export default function AttendancePage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const queryClient = useQueryClient()

  const [selectedCourse, setSelectedCourse] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({})
  const [qrSession, setQrSession] = useState<{ token: string; qrCode: string } | null>(null)
  const [tab, setTab] = useState<'manual' | 'qr'>('manual')

  const { data: courses } = useQuery({
    queryKey: ['teacher-courses-attendance'],
    queryFn: () => api.get('/courses?limit=100').then((r) => r.data?.data || []),
  })

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['course-students', selectedCourse],
    queryFn: () => api.get(`/attendance/course/${selectedCourse}/students`).then((r) => r.data?.data || []),
    enabled: !!selectedCourse,
  })

  useQuery({
    queryKey: ['attendance-existing', selectedCourse, date],
    queryFn: () => api.get(`/attendance/course/${selectedCourse}`, { params: { date } }).then((r) => r.data?.data || []),
    enabled: !!selectedCourse,
    onSuccess: (data: any[]) => {
      const map: Record<string, AttendanceStatus> = {}
      data.forEach((a: any) => { map[a.studentId] = a.status })
      setAttendanceMap(map)
    },
  } as any)

  const saveAttendance = useMutation({
    mutationFn: () =>
      api.post('/attendance/bulk', {
        courseId: selectedCourse,
        date,
        records: Object.entries(attendanceMap).map(([studentId, status]) => ({ studentId, status })),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance-existing', selectedCourse, date] }),
  })

  const generateQr = useMutation({
    mutationFn: () => api.post('/attendance/qr/generate', { courseId: selectedCourse }),
    onSuccess: (data) => setQrSession(data.data?.data),
  })

  const markAll = (status: AttendanceStatus) => {
    const map: Record<string, AttendanceStatus> = {}
    students?.forEach((s: any) => { map[s.id] = status })
    setAttendanceMap(map)
  }

  const presentCount = Object.values(attendanceMap).filter(s => s === 'PRESENT').length
  const absentCount = Object.values(attendanceMap).filter(s => s === 'ABSENT').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'سجل الحضور والغياب' : 'Attendance Register'}</h1>
        <p className="text-gray-500 text-sm mt-0.5">{isRtl ? 'تسجيل حضور الطلاب يومياً' : 'Daily student attendance tracking'}</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'المقرر' : 'Course'}</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500"
          >
            <option value="">{isRtl ? '-- اختر المقرر --' : '-- Select Course --'}</option>
            {courses?.map((c: any) => (
              <option key={c.id} value={c.id}>{isRtl ? (c.titleAr || c.title) : c.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'التاريخ' : 'Date'}</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {selectedCourse && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            <button
              onClick={() => setTab('manual')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              <CheckSquare size={14} className="inline mr-1.5" />
              {isRtl ? 'تسجيل يدوي' : 'Manual Entry'}
            </button>
            <button
              onClick={() => setTab('qr')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'qr' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              <QrCode size={14} className="inline mr-1.5" />
              {isRtl ? 'رمز QR' : 'QR Code'}
            </button>
          </div>

          {tab === 'manual' ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-green-700 font-medium bg-green-50 px-3 py-1 rounded-full">
                      {presentCount} {isRtl ? 'حاضر' : 'present'}
                    </span>
                    <span className="text-sm text-red-700 font-medium bg-red-50 px-3 py-1 rounded-full">
                      {absentCount} {isRtl ? 'غائب' : 'absent'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => markAll('PRESENT')}
                      className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {isRtl ? 'تحضير الكل' : 'All Present'}
                    </button>
                    <button
                      onClick={() => markAll('ABSENT')}
                      className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {isRtl ? 'تغيب الكل' : 'All Absent'}
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                {studentsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
                  </div>
                ) : students?.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">{isRtl ? 'لا يوجد طلاب في هذا المقرر' : 'No students in this course'}</div>
                ) : (
                  <div className="space-y-2">
                    {students?.map((student: any, idx: number) => {
                      const profile = student.profile
                      const status = attendanceMap[student.id]
                      return (
                        <div key={student.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:bg-gray-50">
                          <span className="text-xs text-gray-400 w-6 text-center">{idx + 1}</span>
                          <Avatar
                            name={`${profile?.firstName} ${profile?.lastName}`}
                            src={profile?.avatar}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {isRtl && profile?.firstNameAr
                                ? `${profile.firstNameAr} ${profile.lastNameAr || ''}`
                                : `${profile?.firstName || ''} ${profile?.lastName || ''}`
                              }
                            </p>
                          </div>
                          <div className="flex gap-1">
                            {STATUS_OPTIONS.map((s) => (
                              <button
                                key={s}
                                onClick={() => setAttendanceMap((prev) => ({ ...prev, [student.id]: s }))}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                  status === s
                                    ? `${STATUS_CONFIG[s].bgColor} ${STATUS_CONFIG[s].color} ring-2 ring-offset-1 ring-current`
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                              >
                                {isRtl ? STATUS_CONFIG[s].label.ar : STATUS_CONFIG[s].label.en}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardBody>
              {students?.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-100">
                  <button
                    onClick={() => saveAttendance.mutate()}
                    disabled={saveAttendance.isPending || Object.keys(attendanceMap).length === 0}
                    className="w-full bg-primary-900 text-white py-3 rounded-xl font-medium hover:bg-primary-800 disabled:opacity-50 transition-colors"
                  >
                    {saveAttendance.isPending
                      ? (isRtl ? 'جارٍ الحفظ...' : 'Saving...')
                      : (isRtl ? 'حفظ سجل الحضور' : 'Save Attendance Record')
                    }
                  </button>
                  {saveAttendance.isSuccess && (
                    <p className="text-center text-sm text-green-600 mt-2">
                      {isRtl ? 'تم الحفظ بنجاح ✓' : 'Saved successfully ✓'}
                    </p>
                  )}
                </div>
              )}
            </Card>
          ) : (
            <Card>
              <CardBody>
                <div className="text-center py-8">
                  {qrSession ? (
                    <div className="space-y-4">
                      <div className="inline-block p-4 border-4 border-primary-900 rounded-2xl">
                        <img
                          src={qrSession.qrCode}
                          alt="QR Code"
                          className="w-56 h-56"
                        />
                      </div>
                      <p className="text-sm text-gray-500">
                        {isRtl
                          ? 'يمكن للطلاب مسح الرمز للتسجيل تلقائياً (صالح 15 دقيقة)'
                          : 'Students can scan this QR to mark attendance (valid 15 min)'
                        }
                      </p>
                      <button
                        onClick={() => generateQr.mutate()}
                        className="flex items-center gap-2 mx-auto text-sm text-primary-700 hover:underline"
                      >
                        <RefreshCw size={14} />
                        {isRtl ? 'تجديد الرمز' : 'Refresh QR'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
                        <QrCode size={48} className="text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm">
                        {isRtl
                          ? 'أنشئ رمز QR ليتمكن الطلاب من تسجيل حضورهم بأنفسهم'
                          : 'Generate a QR code for students to self-register attendance'
                        }
                      </p>
                      <button
                        onClick={() => generateQr.mutate()}
                        disabled={generateQr.isPending}
                        className="bg-primary-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-800 disabled:opacity-60"
                      >
                        <QrCode size={16} className="inline mr-2" />
                        {generateQr.isPending
                          ? (isRtl ? 'جارٍ الإنشاء...' : 'Generating...')
                          : (isRtl ? 'إنشاء رمز QR' : 'Generate QR Code')
                        }
                      </button>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
