'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardHeader, CardBody, Badge, Skeleton, Avatar } from '@/components/ui'
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function ParentAttendancePage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'

  const { data: children, isLoading: childrenLoading } = useQuery({
    queryKey: ['my-children'],
    queryFn: () => api.get('/parent/children').then(r => r.data?.data || []),
  })

  const statusLabel: Record<string, string> = {
    PRESENT: isRtl ? 'حاضر' : 'Present',
    ABSENT: isRtl ? 'غائب' : 'Absent',
    LATE: isRtl ? 'متأخر' : 'Late',
    EXCUSED: isRtl ? 'معذور' : 'Excused',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'حضور الأبناء' : "Children's Attendance"}</h1>
        <p className="text-gray-500 text-sm">{isRtl ? 'متابعة سجل حضور أبنائك' : "Monitor your children's attendance"}</p>
      </div>

      {childrenLoading ? (
        <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48" />)}</div>
      ) : children?.length === 0 ? (
        <Card><CardBody><div className="text-center py-16 text-gray-400"><Calendar size={48} className="mx-auto mb-3 opacity-30" /><p>{isRtl ? 'لا يوجد أبناء مرتبطون' : 'No children linked'}</p></div></CardBody></Card>
      ) : (
        children?.map((link: any) => (
          <ChildAttendanceCard key={link.id} link={link} isRtl={isRtl} statusLabel={statusLabel} />
        ))
      )}
    </div>
  )
}

function ChildAttendanceCard({ link, isRtl, statusLabel }: any) {
  const student = link.student
  const profile = student?.profile

  const { data: records } = useQuery({
    queryKey: ['child-attendance', student?.id],
    queryFn: () => api.get(`/attendance/student/${student.id}`).then(r => {
      const d = r.data?.data
      return Array.isArray(d) ? d : (d?.records || d?.data || [])
    }),
    enabled: !!student?.id,
  })

  const recs = records || []
  const total = recs.length
  const present = recs.filter((r: any) => r.status === 'PRESENT' || r.status === 'LATE').length
  const absent = recs.filter((r: any) => r.status === 'ABSENT').length
  const pct = total > 0 ? Math.round((present / total) * 100) : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={`${profile?.firstName} ${profile?.lastName}`} src={profile?.avatar} size="sm" />
            <div>
              <h3 className="font-semibold text-gray-900">
                {isRtl && profile?.firstNameAr
                  ? `${profile.firstNameAr} ${profile.lastNameAr || ''}`
                  : `${profile?.firstName || ''} ${profile?.lastName || ''}`}
              </h3>
              <p className="text-xs text-gray-500">{student?.grade || '—'}</p>
            </div>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <p className={`text-xl font-bold ${pct >= 75 ? 'text-green-600' : 'text-red-500'}`}>{pct}%</p>
              <p className="text-xs text-gray-400">{isRtl ? 'نسبة الحضور' : 'Rate'}</p>
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">{present}</p>
              <p className="text-xs text-gray-400">{isRtl ? 'حضور' : 'Present'}</p>
            </div>
            <div>
              <p className="text-xl font-bold text-red-500">{absent}</p>
              <p className="text-xs text-gray-400">{isRtl ? 'غياب' : 'Absent'}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="mb-4">
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className={`h-2 rounded-full ${pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
        {recs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">{isRtl ? 'لا يوجد سجل حضور' : 'No records yet'}</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recs.slice(0, 10).map((r: any) => {
              const Icon = r.status === 'PRESENT' ? CheckCircle : r.status === 'ABSENT' ? XCircle : Clock
              return (
                <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <Icon size={14} className={r.status === 'PRESENT' ? 'text-green-500' : r.status === 'ABSENT' ? 'text-red-400' : 'text-yellow-500'} />
                    <span className="text-sm text-gray-700">{r.date ? new Date(r.date).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US') : '—'}</span>
                  </div>
                  <Badge variant={r.status === 'PRESENT' ? 'success' : r.status === 'ABSENT' ? 'danger' : 'warning'} className="text-xs">
                    {statusLabel[r.status] || r.status}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
