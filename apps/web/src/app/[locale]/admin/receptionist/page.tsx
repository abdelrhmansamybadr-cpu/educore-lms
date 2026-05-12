'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export default function ReceptionistPage() {
  const [tab, setTab] = useState<'visitors' | 'admission'>('visitors')
  const [showVisitorForm, setShowVisitorForm] = useState(false)
  const [visitorForm, setVisitorForm] = useState({ visitorName: '', visitorPhone: '', purpose: '', hostName: '', hostDept: '' })
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10))
  const queryClient = useQueryClient()

  const { data: stats } = useQuery({
    queryKey: ['receptionist-stats'],
    queryFn: () => apiClient.get('/receptionist/stats').then((r) => r.data),
  })

  const { data: visitors, isLoading: visitorsLoading } = useQuery({
    queryKey: ['receptionist-visitors', dateFilter],
    queryFn: () => apiClient.get(`/receptionist/visitors?date=${dateFilter}`).then((r) => r.data),
    enabled: tab === 'visitors',
  })

  const { data: apps } = useQuery({
    queryKey: ['admission-apps-receptionist'],
    queryFn: () => apiClient.get('/admission/applications?status=SUBMITTED').then((r) => r.data),
    enabled: tab === 'admission',
  })

  const { data: admissionStats } = useQuery({
    queryKey: ['admission-stats-receptionist'],
    queryFn: () => apiClient.get('/admission/stats').then((r) => r.data),
  })

  const checkIn = useMutation({
    mutationFn: (data: any) => apiClient.post('/receptionist/visitors', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist-visitors'] })
      queryClient.invalidateQueries({ queryKey: ['receptionist-stats'] })
      setVisitorForm({ visitorName: '', visitorPhone: '', purpose: '', hostName: '', hostDept: '' })
      setShowVisitorForm(false)
    },
  })

  const checkOut = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/receptionist/visitors/${id}/checkout`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist-visitors'] })
      queryClient.invalidateQueries({ queryKey: ['receptionist-stats'] })
    },
  })

  const visitorsList = Array.isArray(visitors) ? visitors : []

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reception Desk</h1>
        <p className="text-gray-500 text-sm mt-1">Manage visitors, walk-in inquiries, and new applications</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Visitors Today</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats?.todayTotal ?? '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Currently In</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats?.currentlyIn ?? '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">New Applications</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{admissionStats?.submitted ?? '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total Applications</p>
          <p className="text-2xl font-bold text-gray-700 mt-1">{admissionStats?.total ?? '—'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[{ key: 'visitors', label: 'Visitor Log' }, { key: 'admission', label: 'Walk-in Applications' }].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'visitors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Date:</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
              />
            </div>
            <button onClick={() => setShowVisitorForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
              + Check In Visitor
            </button>
          </div>

          {showVisitorForm && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">New Visitor</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'visitorName', label: 'Full Name *' },
                  { key: 'visitorPhone', label: 'Phone' },
                  { key: 'purpose', label: 'Purpose of Visit' },
                  { key: 'hostName', label: 'Person to Visit' },
                  { key: 'hostDept', label: 'Department' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 mb-1">{label}</label>
                    <input
                      value={(visitorForm as any)[key]}
                      onChange={(e) => setVisitorForm({ ...visitorForm, [key]: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => checkIn.mutate(visitorForm)}
                  disabled={!visitorForm.visitorName || checkIn.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {checkIn.isPending ? 'Checking in...' : 'Check In'}
                </button>
                <button onClick={() => setShowVisitorForm(false)} className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {visitorsLoading && <div className="p-8 text-center text-gray-400">Loading...</div>}
            {!visitorsLoading && visitorsList.length === 0 && <div className="p-8 text-center text-gray-400">No visitors for this date</div>}
            {visitorsList.map((v: any) => (
              <div key={v.id} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                  {v.visitorName?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">{v.visitorName}</p>
                  <p className="text-xs text-gray-500">{v.purpose ?? 'Visit'}{v.hostName ? ` · Visiting ${v.hostName}` : ''}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    In: {new Date(v.checkIn).toLocaleTimeString()}
                    {v.checkOut ? ` · Out: ${new Date(v.checkOut).toLocaleTimeString()}` : ''}
                  </p>
                </div>
                {!v.checkOut ? (
                  <button
                    onClick={() => checkOut.mutate(v.id)}
                    disabled={checkOut.isPending}
                    className="text-xs bg-orange-100 text-orange-700 hover:bg-orange-200 px-3 py-1.5 rounded-lg"
                  >
                    Check Out
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">Departed</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'admission' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Recent walk-in admission applications awaiting review:</p>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {(apps ?? []).length === 0 && <div className="p-8 text-center text-gray-400">No pending applications</div>}
            {(apps ?? []).map((app: any) => (
              <div key={app.id} className="p-4">
                <p className="font-medium text-sm text-gray-900">{app.studentFirstName} {app.studentLastName}</p>
                <p className="text-xs text-gray-500 mt-0.5">Grade {app.applyingForGrade} · {app.parentName} · {app.parentPhone}</p>
                <p className="text-xs text-gray-400 mt-0.5">Submitted {new Date(app.submittedAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
