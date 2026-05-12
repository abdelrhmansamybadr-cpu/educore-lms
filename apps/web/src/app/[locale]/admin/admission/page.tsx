'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

const STATUS_OPTIONS = ['SUBMITTED', 'UNDER_REVIEW', 'INTERVIEW_SCHEDULED', 'ACCEPTED', 'REJECTED', 'ENROLLED', 'WAITLISTED']

const statusColor: Record<string, string> = {
  SUBMITTED: 'bg-gray-100 text-gray-700',
  UNDER_REVIEW: 'bg-blue-100 text-blue-700',
  INTERVIEW_SCHEDULED: 'bg-purple-100 text-purple-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  ENROLLED: 'bg-emerald-100 text-emerald-700',
  WAITLISTED: 'bg-yellow-100 text-yellow-700',
}

export default function AdmissionPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedApp, setSelectedApp] = useState<any>(null)
  const [formData, setFormData] = useState({
    studentFirstName: '', studentLastName: '', studentFirstNameAr: '', studentLastNameAr: '',
    dateOfBirth: '', applyingForGrade: '', parentName: '', parentEmail: '', parentPhone: '', notes: '',
  })
  const queryClient = useQueryClient()

  const { data: stats } = useQuery({
    queryKey: ['admission-stats'],
    queryFn: () => apiClient.get('/admission/stats').then((r) => r.data),
  })

  const { data: applications, isLoading } = useQuery({
    queryKey: ['admission-apps', statusFilter, search],
    queryFn: () =>
      apiClient.get(`/admission/applications?${new URLSearchParams({
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(search ? { search } : {}),
      })}`).then((r) => r.data),
  })

  const createApp = useMutation({
    mutationFn: (data: any) => apiClient.post('/admission/applications', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admission-apps'] })
      queryClient.invalidateQueries({ queryKey: ['admission-stats'] })
      setShowForm(false)
      setFormData({ studentFirstName: '', studentLastName: '', studentFirstNameAr: '', studentLastNameAr: '', dateOfBirth: '', applyingForGrade: '', parentName: '', parentEmail: '', parentPhone: '', notes: '' })
    },
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/admission/applications/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admission-apps'] })
      queryClient.invalidateQueries({ queryKey: ['admission-stats'] })
      setSelectedApp(null)
    },
  })

  const statCards = [
    { label: 'Total', value: stats?.total, color: 'text-gray-700' },
    { label: 'Submitted', value: stats?.submitted, color: 'text-gray-600' },
    { label: 'Under Review', value: stats?.underReview, color: 'text-blue-600' },
    { label: 'Accepted', value: stats?.accepted, color: 'text-green-600' },
    { label: 'Enrolled', value: stats?.enrolled, color: 'text-emerald-600' },
    { label: 'Rejected', value: stats?.rejected, color: 'text-red-600' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admission Management</h1>
        <p className="text-gray-500 text-sm mt-1">Review and process student admission applications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* By Grade */}
      {stats?.byGrade && stats.byGrade.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-sm text-gray-700 mb-3">Applications by Grade</h3>
          <div className="flex flex-wrap gap-2">
            {stats.byGrade.map((g: any) => (
              <span key={g.grade} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full">
                Grade {g.grade}: {g.count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <div className="ml-auto">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"
          >
            + New Application
          </button>
        </div>
      </div>

      {/* New Application Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">New Admission Application</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Student First Name (EN) *</label>
              <input value={formData.studentFirstName} onChange={(e) => setFormData({ ...formData, studentFirstName: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Student Last Name (EN) *</label>
              <input value={formData.studentLastName} onChange={(e) => setFormData({ ...formData, studentLastName: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">الاسم الأول (AR)</label>
              <input value={formData.studentFirstNameAr} onChange={(e) => setFormData({ ...formData, studentFirstNameAr: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" dir="rtl" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">اسم العائلة (AR)</label>
              <input value={formData.studentLastNameAr} onChange={(e) => setFormData({ ...formData, studentLastNameAr: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" dir="rtl" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date of Birth *</label>
              <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Applying for Grade *</label>
              <input value={formData.applyingForGrade} onChange={(e) => setFormData({ ...formData, applyingForGrade: e.target.value })} placeholder="e.g. Grade 5" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Parent/Guardian Name *</label>
              <input value={formData.parentName} onChange={(e) => setFormData({ ...formData, parentName: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Parent Email *</label>
              <input type="email" value={formData.parentEmail} onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Parent Phone *</label>
              <input value={formData.parentPhone} onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Notes</label>
              <input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => createApp.mutate(formData)}
              disabled={createApp.isPending || !formData.studentFirstName || !formData.studentLastName || !formData.dateOfBirth || !formData.parentEmail}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {createApp.isPending ? 'Submitting...' : 'Submit Application'}
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Application Detail */}
      {selectedApp && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">{selectedApp.studentFirstName} {selectedApp.studentLastName}</h3>
              <p className="text-sm text-gray-500 mt-0.5">Applying for {selectedApp.applyingForGrade}</p>
            </div>
            <button onClick={() => setSelectedApp(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div><span className="text-gray-500">Parent:</span> {selectedApp.parentName}</div>
            <div><span className="text-gray-500">Email:</span> {selectedApp.parentEmail}</div>
            <div><span className="text-gray-500">Phone:</span> {selectedApp.parentPhone}</div>
            <div><span className="text-gray-500">DoB:</span> {new Date(selectedApp.dateOfBirth).toLocaleDateString()}</div>
            {selectedApp.notes && <div className="col-span-2"><span className="text-gray-500">Notes:</span> {selectedApp.notes}</div>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">Update status:</span>
            {STATUS_OPTIONS.filter((s) => s !== selectedApp.status).map((s) => (
              <button
                key={s}
                onClick={() => updateStatus.mutate({ id: selectedApp.id, status: s })}
                disabled={updateStatus.isPending}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${statusColor[s] ?? 'bg-gray-100 text-gray-600'} hover:opacity-80 disabled:opacity-50`}
              >
                → {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Applications List */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {isLoading && <div className="p-8 text-center text-gray-400">Loading...</div>}
        {!isLoading && (applications ?? []).length === 0 && (
          <div className="p-8 text-center text-gray-400">No applications found</div>
        )}
        {(applications ?? []).map((app: any) => (
          <div
            key={app.id}
            className="p-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => setSelectedApp(app)}
          >
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-900">{app.studentFirstName} {app.studentLastName}</p>
              <p className="text-xs text-gray-500 mt-0.5">Grade {app.applyingForGrade} · {app.parentName} · {app.parentEmail}</p>
            </div>
            <p className="text-xs text-gray-400">{new Date(app.submittedAt).toLocaleDateString()}</p>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[app.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {app.status.replace(/_/g, ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
