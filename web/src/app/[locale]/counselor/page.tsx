'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export default function CounselorDashboard() {
  const { data: atRisk } = useQuery({
    queryKey: ['counselor-at-risk'],
    queryFn: () => apiClient.get('/analytics/at-risk').then((r) => r.data?.data ?? r.data ?? []),
  })

  const { data: mentalHealth } = useQuery({
    queryKey: ['counselor-mental-health'],
    queryFn: () => apiClient.get('/health/mental-health?flagged=true').then((r) => r.data?.data ?? r.data ?? []).catch(() => []),
  })

  const riskColor: Record<string, string> = {
    HIGH: 'bg-red-100 text-red-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    LOW: 'bg-green-100 text-green-700',
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Counselor Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Monitor student wellbeing, mental health flags, and at-risk cases</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">At-Risk Students</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{atRisk?.length ?? '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Flagged Check-ins</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{Array.isArray(mentalHealth) ? mentalHealth.length : '—'}</p>
        </div>
      </div>

      {/* At-risk students */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-4 py-3 border-b">
          <h2 className="font-semibold text-gray-800 text-sm">At-Risk Students</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {!atRisk && <div className="p-6 text-center text-gray-400">Loading...</div>}
          {atRisk?.length === 0 && <div className="p-6 text-center text-gray-400">No at-risk students detected</div>}
          {(atRisk ?? []).map((student: any, i: number) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900">{student.name ?? student.email}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Attendance: {student.attendanceRate?.toFixed(0)}% · Avg Grade: {student.avgGrade?.toFixed(0)}%
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${riskColor[student.riskLevel] ?? 'bg-gray-100 text-gray-600'}`}>
                {student.riskLevel} RISK
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Flagged Mental Health Check-ins */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-4 py-3 border-b">
          <h2 className="font-semibold text-gray-800 text-sm">Flagged Mental Health Check-ins</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {!mentalHealth && <div className="p-6 text-center text-gray-400">Loading...</div>}
          {Array.isArray(mentalHealth) && mentalHealth.length === 0 && (
            <div className="p-6 text-center text-gray-400">No flagged check-ins</div>
          )}
          {(Array.isArray(mentalHealth) ? mentalHealth : []).map((entry: any) => (
            <div key={entry.id} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-sm shrink-0">
                {entry.moodScore}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900">
                  {entry.student?.profile ? `${entry.student.profile.firstName} ${entry.student.profile.lastName}` : entry.student?.email}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Mood score: {entry.moodScore}/10 · {entry.notes ?? 'No notes'}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(entry.checkedAt).toLocaleString()}</p>
              </div>
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">Flagged</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
