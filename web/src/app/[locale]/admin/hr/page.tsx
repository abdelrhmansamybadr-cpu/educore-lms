'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

type Tab = 'staff' | 'leaves' | 'contracts' | 'reviews'

export default function HRPage() {
  const [tab, setTab] = useState<Tab>('staff')
  const [search, setSearch] = useState('')
  const [leaveFilter, setLeaveFilter] = useState('')
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewData, setReviewData] = useState({
    staffId: '', period: '', score: 0, communication: 0, punctuality: 0,
    teamwork: 0, performance: 0, strengths: '', improvements: '', goals: '',
  })
  const queryClient = useQueryClient()

  const { data: stats } = useQuery({
    queryKey: ['hr-stats'],
    queryFn: () => apiClient.get('/hr/stats').then((r) => r.data),
  })

  const { data: staff, isLoading: staffLoading } = useQuery({
    queryKey: ['hr-staff', search],
    queryFn: () => apiClient.get(`/hr/staff${search ? `?search=${search}` : ''}`).then((r) => r.data),
    enabled: tab === 'staff',
  })

  const { data: leaves, isLoading: leavesLoading } = useQuery({
    queryKey: ['hr-leaves', leaveFilter],
    queryFn: () => apiClient.get(`/hr/leaves${leaveFilter ? `?status=${leaveFilter}` : ''}`).then((r) => r.data),
    enabled: tab === 'leaves',
  })

  const { data: contracts } = useQuery({
    queryKey: ['hr-contracts'],
    queryFn: () => apiClient.get('/hr/contracts').then((r) => r.data),
    enabled: tab === 'contracts',
  })

  const { data: reviews } = useQuery({
    queryKey: ['hr-reviews'],
    queryFn: () => apiClient.get('/hr/reviews').then((r) => r.data),
    enabled: tab === 'reviews',
  })

  const approveLeave = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/hr/leaves/${id}/approve`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hr-leaves'] }),
  })

  const rejectLeave = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/hr/leaves/${id}/reject`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hr-leaves'] }),
  })

  const submitReview = useMutation({
    mutationFn: (data: any) => apiClient.post('/hr/reviews', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-reviews'] })
      setShowReviewForm(false)
      setReviewData({ staffId: '', period: '', score: 0, communication: 0, punctuality: 0, teamwork: 0, performance: 0, strengths: '', improvements: '', goals: '' })
    },
  })

  const tabs: { key: Tab; label: string }[] = [
    { key: 'staff', label: 'Staff Directory' },
    { key: 'leaves', label: 'Leave Requests' },
    { key: 'contracts', label: 'Contracts' },
    { key: 'reviews', label: 'Performance Reviews' },
  ]

  const leaveStatusColor: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-600',
  }

  const contractStatusColor: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    EXPIRED: 'bg-gray-100 text-gray-600',
    TERMINATED: 'bg-red-100 text-red-800',
    SUSPENDED: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Human Resources</h1>
        <p className="text-gray-500 text-sm mt-1">Manage staff, leaves, contracts, and performance reviews</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Staff', value: stats?.totalStaff ?? '—', color: 'text-blue-600' },
          { label: 'Active Contracts', value: stats?.activeContracts ?? '—', color: 'text-green-600' },
          { label: 'Pending Leaves', value: stats?.pendingLeaves ?? '—', color: 'text-yellow-600' },
          { label: 'Reviews', value: stats?.totalReviews ?? '—', color: 'text-purple-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Staff Directory */}
      {tab === 'staff' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, job title..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {staffLoading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {(staff ?? []).length === 0 && (
                <div className="p-8 text-center text-gray-400">No staff profiles found</div>
              )}
              {(staff ?? []).map((s: any) => (
                <div key={s.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                    {s.user?.profile?.firstName?.[0] ?? s.user?.email?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">
                      {s.user?.profile ? `${s.user.profile.firstName} ${s.user.profile.lastName}` : s.user?.email}
                    </p>
                    <p className="text-xs text-gray-500">{s.jobTitle ?? 'No title'} · {s.department ?? 'No dept'}</p>
                  </div>
                  <div className="text-xs text-gray-500 hidden md:block">{s.user?.role}</div>
                  <div className="text-xs text-gray-500 hidden md:block">
                    ID: {s.employeeId ?? '—'}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${s.user?.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {s.user?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Leave Requests */}
      {tab === 'leaves' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b flex items-center gap-3">
            <select
              value={leaveFilter}
              onChange={(e) => setLeaveFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          {leavesLoading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {(leaves ?? []).length === 0 && (
                <div className="p-8 text-center text-gray-400">No leave requests found</div>
              )}
              {(leaves ?? []).map((l: any) => (
                <div key={l.id} className="p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">
                      {l.staff?.user?.profile ? `${l.staff.user.profile.firstName} ${l.staff.user.profile.lastName}` : l.staff?.user?.email}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {l.type} · {l.days} day{l.days !== 1 ? 's' : ''} · {new Date(l.startDate).toLocaleDateString()} – {new Date(l.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{l.reason}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${leaveStatusColor[l.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {l.status}
                  </span>
                  {l.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveLeave.mutate(l.id)}
                        className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectLeave.mutate(l.id)}
                        className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contracts */}
      {tab === 'contracts' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="divide-y divide-gray-100">
            {(contracts ?? []).length === 0 && (
              <div className="p-8 text-center text-gray-400">No contracts found</div>
            )}
            {(contracts ?? []).map((c: any) => (
              <div key={c.id} className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">
                    {c.staff?.user?.profile ? `${c.staff.user.profile.firstName} ${c.staff.user.profile.lastName}` : c.staff?.user?.email}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {c.position} · {c.type} · ${c.salary?.toLocaleString()}/mo
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(c.startDate).toLocaleDateString()} – {c.endDate ? new Date(c.endDate).toLocaleDateString() : 'Open-ended'}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${contractStatusColor[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Reviews */}
      {tab === 'reviews' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowReviewForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"
            >
              + New Review
            </button>
          </div>

          {showReviewForm && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Create Performance Review</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Staff Member</label>
                  <select
                    value={reviewData.staffId}
                    onChange={(e) => setReviewData({ ...reviewData, staffId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Select staff member...</option>
                    {(staff ?? []).map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.user?.profile ? `${s.user.profile.firstName} ${s.user.profile.lastName}` : s.user?.email}
                        {s.jobTitle ? ` — ${s.jobTitle}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Period (e.g. 2024-Q1)</label>
                  <input
                    value={reviewData.period}
                    onChange={(e) => setReviewData({ ...reviewData, period: e.target.value })}
                    placeholder="2024-Q1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                {(['score', 'communication', 'punctuality', 'teamwork', 'performance'] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-xs text-gray-500 mb-1 capitalize">{field} (0-100)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={reviewData[field]}
                      onChange={(e) => setReviewData({ ...reviewData, [field]: parseFloat(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Strengths</label>
                  <textarea
                    value={reviewData.strengths}
                    onChange={(e) => setReviewData({ ...reviewData, strengths: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Areas for Improvement</label>
                  <textarea
                    value={reviewData.improvements}
                    onChange={(e) => setReviewData({ ...reviewData, improvements: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Goals</label>
                  <textarea
                    value={reviewData.goals}
                    onChange={(e) => setReviewData({ ...reviewData, goals: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => submitReview.mutate(reviewData)}
                  disabled={submitReview.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {submitReview.isPending ? 'Saving...' : 'Save Review'}
                </button>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {(reviews ?? []).length === 0 && (
              <div className="p-8 text-center text-gray-400">No reviews yet</div>
            )}
            {(reviews ?? []).map((r: any) => (
              <div key={r.id} className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">
                    {r.staff?.user?.profile ? `${r.staff.user.profile.firstName} ${r.staff.user.profile.lastName}` : r.staff?.user?.email}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Period: {r.period}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">{r.score}%</p>
                  <p className="text-xs text-gray-400">Overall Score</p>
                </div>
                <div className="hidden md:grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500">
                  <span>Communication: {r.communication}%</span>
                  <span>Punctuality: {r.punctuality}%</span>
                  <span>Teamwork: {r.teamwork}%</span>
                  <span>Performance: {r.performance}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
