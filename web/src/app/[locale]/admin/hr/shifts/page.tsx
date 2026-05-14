'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useLocale } from 'next-intl'
import { apiClient } from '@/lib/api'
import { Clock, Plus, Edit2, Trash2, X, Users, UserCheck, ChevronDown, Check } from 'lucide-react'

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const COLORS = ['#4F46E5', '#0891B2', '#059669', '#D97706', '#DC2626', '#7C3AED', '#DB2777', '#64748B']

interface Shift {
  id: string; name: string; startTime: string; endTime: string
  activeDays: string[]; color: string; description?: string
  assignments: { staffId: string; staff: { user: { email: string; profile?: { firstName: string; lastName: string } } } }[]
}
interface Employee {
  id: string               // staffProfileId if exists, userId otherwise
  _userId: string          // always the real userId
  hasStaffProfile: boolean
  jobTitle?: string | null; department?: string | null
  user: { id: string; email: string; role: string; isActive: boolean; profile?: { firstName: string; lastName: string } | null }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

function calcHours(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let diff = (eh * 60 + em) - (sh * 60 + sm)
  if (diff <= 0) diff += 24 * 60
  return Math.round(diff / 60)
}

function initials(name: string, email: string) {
  const n = name.trim()
  if (n) return n.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
  return email[0]?.toUpperCase() ?? '?'
}

const AVATAR_PALETTE = ['#4F46E5', '#0891B2', '#059669', '#D97706', '#7C3AED', '#DB2777', '#DC2626', '#64748B']
function avatarColor(str: string) {
  let h = 0; for (const c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length]
}

function EmpAvatar({ name, email, size = 32 }: { name: string; email: string; size?: number }) {
  const bg = avatarColor(email)
  return (
    <div style={{ width: size, height: size, background: bg, fontSize: size * 0.38, border: '2px solid white' }}
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0">
      {initials(name, email)}
    </div>
  )
}

// ── Add/Edit Shift Dialog ─────────────────────────────────────────────────────

function ShiftDialog({ shift, onClose, onSave }: { shift?: Shift; onClose: () => void; onSave: () => void }) {
  const isRtl = useLocale() === 'ar'
  const [form, setForm] = useState({
    name: shift?.name ?? '', startTime: shift?.startTime ?? '08:00',
    endTime: shift?.endTime ?? '17:00', description: shift?.description ?? '',
    activeDays: shift?.activeDays ?? ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    color: shift?.color ?? '#4F46E5',
  })
  const [saving, setSaving] = useState(false)
  const toggleDay = (d: string) => setForm(p => ({
    ...p, activeDays: p.activeDays.includes(d) ? p.activeDays.filter(x => x !== d) : [...p.activeDays, d],
  }))

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (shift) await apiClient.patch(`/hr/shifts/${shift.id}`, form)
      else await apiClient.post('/hr/shifts', form)
      onSave(); onClose()
    } catch {}
    setSaving(false)
  }

  const hours = calcHours(form.startTime, form.endTime)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <p className="font-bold text-gray-900">{shift ? (isRtl ? 'تعديل شيفت' : 'Edit Shift') : (isRtl ? 'إضافة شيفت جديد' : 'Add New Shift')}</p>
            {form.startTime && form.endTime && <p className="text-xs text-gray-400 mt-0.5">{formatTime(form.startTime)} – {formatTime(form.endTime)} ({hours}h)</p>}
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-gray-500 font-medium">{isRtl ? 'اسم الشيفت' : 'Shift Name'}</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder={isRtl ? 'مثال: الشيفت الصباحي' : 'e.g. Morning Shift'}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">{isRtl ? 'وصف' : 'Description'}</label>
            <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder={isRtl ? 'وصف اختياري' : 'Optional description'}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium">{isRtl ? 'من' : 'Start Time'}</label>
              <input type="time" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">{isRtl ? 'إلى' : 'End Time'}</label>
              <input type="time" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-2 block">{isRtl ? 'أيام العمل' : 'Working Days'}</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(d => (
                <button key={d} onClick={() => toggleDay(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${form.activeDays.includes(d) ? 'text-white border-transparent' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  style={form.activeDays.includes(d) ? { background: form.color, borderColor: form.color } : {}}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-2 block">{isRtl ? 'لون الشيفت' : 'Shift Color'}</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                  className="w-8 h-8 rounded-full border-2 transition-all relative"
                  style={{ background: c, borderColor: form.color === c ? '#111827' : 'transparent' }}>
                  {form.color === c && <Check size={13} className="text-white absolute inset-0 m-auto" />}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-2">
          <button onClick={save} disabled={saving}
            className="flex-1 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-opacity"
            style={{ background: form.color }}>
            {saving ? '...' : (isRtl ? 'حفظ' : 'Save Shift')}
          </button>
          <button onClick={onClose} className="px-5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">{isRtl ? 'إلغاء' : 'Cancel'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Manage Employees Dialog ───────────────────────────────────────────────────

function ManageDialog({ shift, allEmployees, onClose, onSave }: {
  shift: Shift; allEmployees: Employee[]; onClose: () => void; onSave: () => void
}) {
  const isRtl = useLocale() === 'ar'
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [removing, setRemoving] = useState('')

  // Match by email — employees.id = userId, assignments.staffId = StaffProfile.id (different spaces)
  const assignedEmails = new Set(shift.assignments.map(a => a.staff?.user?.email ?? '').filter(Boolean))
  const available = allEmployees.filter(e => !assignedEmails.has(e.user.email))

  const assign = async () => {
    if (!selectedId) return
    setSaving(true)
    try {
      await apiClient.post(`/hr/shifts/${shift.id}/assign`, { staffId: selectedId })
      onSave(); setSelectedId('')
    } catch {}
    setSaving(false)
  }

  const remove = async (staffId: string) => {
    setRemoving(staffId)
    try { await apiClient.delete(`/hr/shifts/assignment/${staffId}`); onSave() } catch {}
    setRemoving('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: shift.color }} />
              <p className="font-bold text-gray-900">{shift.name}</p>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{formatTime(shift.startTime)} – {formatTime(shift.endTime)}</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Add employee */}
          <div className="flex gap-2">
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
              <option value="">{isRtl ? 'اختر موظفاً للإضافة' : 'Select employee to add'}</option>
              {available.map(e => {
                const name = [e.user.profile?.firstName, e.user.profile?.lastName].filter(Boolean).join(' ') || e.user.email
                return <option key={e.id} value={e.id}>{name}</option>
              })}
            </select>
            <button onClick={assign} disabled={saving || !selectedId}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
              style={{ background: shift.color }}>
              {saving ? '...' : (isRtl ? 'إضافة' : 'Add')}
            </button>
          </div>

          {/* Current assignees */}
          {shift.assignments.length === 0
            ? <p className="text-sm text-gray-400 text-center py-4">{isRtl ? 'لا يوجد موظفون في هذا الشيفت' : 'No employees assigned yet'}</p>
            : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <p className="text-xs font-semibold text-gray-400 uppercase">{isRtl ? 'الموظفون الحاليون' : 'Currently Assigned'} ({shift.assignments.length})</p>
                {shift.assignments.map(a => {
                  const name = [a.staff?.user?.profile?.firstName, a.staff?.user?.profile?.lastName].filter(Boolean).join(' ') || a.staff?.user?.email || ''
                  return (
                    <div key={a.staffId} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <EmpAvatar name={name} email={a.staff?.user?.email ?? ''} size={30} />
                        <p className="text-sm font-medium text-gray-800">{name || a.staff?.user?.email}</p>
                      </div>
                      <button onClick={() => remove(a.staffId)} disabled={removing === a.staffId}
                        className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50">
                        {removing === a.staffId ? '...' : (isRtl ? 'إزالة' : 'Remove')}
                      </button>
                    </div>
                  )
                })}
              </div>
            )
          }
        </div>
        <div className="p-5 border-t border-gray-100">
          <button onClick={onClose} className="w-full border border-gray-200 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50">{isRtl ? 'إغلاق' : 'Close'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Assign Dropdown for unassigned employees ──────────────────────────────────

function AssignDropdown({ employee, shifts, onAssigned, isRtl }: {
  employee: Employee; shifts: Shift[]; onAssigned: () => void; isRtl: boolean
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const assign = async (shiftId: string) => {
    setLoading(true)
    setOpen(false)
    try {
      await apiClient.post(`/hr/shifts/${shiftId}/assign`, { staffId: employee.id })
      onAssigned()
    } catch {}
    setLoading(false)
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} disabled={loading}
        className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
        {loading ? '...' : (isRtl ? 'تعيين لشيفت' : 'Assign to Shift')}
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 bg-white rounded-xl border border-gray-100 shadow-lg z-20 min-w-44 overflow-hidden">
          {shifts.length === 0
            ? <p className="text-xs text-gray-400 px-3 py-2">{isRtl ? 'لا توجد شيفتات' : 'No shifts'}</p>
            : shifts.map(s => (
              <button key={s.id} onClick={() => assign(s.id)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm text-left transition-colors">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                <span className="font-medium text-gray-800">{s.name}</span>
                <span className="text-xs text-gray-400 ml-auto">{formatTime(s.startTime)}</span>
              </button>
            ))
          }
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ShiftsPage() {
  const locale = useLocale(); const isRtl = locale === 'ar'
  const [shifts, setShifts] = useState<Shift[]>([])
  const [allEmployees, setAllEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Shift | undefined>()
  const [managing, setManaging] = useState<Shift | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const sRes = await apiClient.get('/hr/shifts').then((r: any) => r.data?.data ?? r.data ?? [])
      setShifts(Array.isArray(sRes) ? sRes : [])
    } catch {}

    // Use GET /users (always works, no StaffProfile required) with a high limit
    try {
      const raw = await apiClient.get('/users?limit=500').then((r: any) => r.data?.data ?? r.data ?? [])
      const users = Array.isArray(raw) ? raw : []
      // Normalize to Employee shape — id = userId (backend assignShift now accepts userId)
      const normalized: Employee[] = users.map((u: any) => ({
        id: u.id,           // userId — backend will upsert StaffProfile automatically
        _userId: u.id,
        hasStaffProfile: false, // doesn't matter; backend handles it
        jobTitle: u.profile?.jobTitle ?? null,
        department: u.profile?.department ?? null,
        user: {
          id: u.id,
          email: u.email,
          role: u.role,
          isActive: u.isActive ?? true,
          profile: u.profile ? { firstName: u.profile.firstName, lastName: u.profile.lastName } : null,
        },
      }))
      setAllEmployees(normalized)
    } catch {
      // Fallback: /hr/all-users or /hr/staff
      try {
        const alt = await apiClient.get('/hr/staff').then((r: any) => r.data?.data ?? r.data ?? [])
        if (Array.isArray(alt)) {
          setAllEmployees(alt.map((s: any) => ({
            id: s.id, _userId: s.user?.id ?? s.id, hasStaffProfile: true,
            jobTitle: s.jobTitle ?? null, department: s.department ?? null,
            user: s.user,
          })))
        }
      } catch {}
    }

    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const del = async (id: string) => {
    if (!confirm(isRtl ? 'حذف هذا الشيفت؟' : 'Delete this shift?')) return
    await apiClient.delete(`/hr/shifts/${id}`); load()
  }

  // Stats — match by email since allEmployees uses userId but assignments use staffProfileId
  const assignedEmails = new Set(shifts.flatMap(s => s.assignments.map(a => a.staff?.user?.email ?? '')).filter(Boolean))
  const assignedCount = allEmployees.filter(e => assignedEmails.has(e.user.email)).length
  const unassigned = allEmployees.filter(e => !assignedEmails.has(e.user.email))

  if (loading) {
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-10 w-32 bg-gray-100 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-52 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'شيفتات العمل' : 'Work Shifts'}</h1>
          <p className="text-sm text-gray-500 mt-1">{isRtl ? 'إدارة جداول العمل وتعيينات الشيفتات.' : 'Manage employee work schedules and shift assignments.'}</p>
        </div>
        <button
          onClick={() => { setEditing(undefined); setShowAdd(true) }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
          <Plus size={16} />{isRtl ? 'إضافة شيفت' : '+ Add Shift'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-sm text-gray-500">{isRtl ? 'إجمالي الشيفتات' : 'Total Shifts'}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{shifts.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-sm text-gray-500">{isRtl ? 'الموظفون المعيّنون' : 'Assigned Employees'}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{assignedCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-sm text-gray-500">{isRtl ? 'الموظفون غير المعيّنون' : 'Unassigned Employees'}</p>
          <p className="text-3xl font-bold text-amber-500 mt-1">{unassigned.length}</p>
        </div>
      </div>

      {/* Shift Cards */}
      {shifts.length === 0
        ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100">
            <Clock size={48} className="text-gray-200 mb-4" />
            <p className="text-gray-400 font-medium">{isRtl ? 'لا توجد شيفتات بعد' : 'No shifts yet'}</p>
            <button onClick={() => { setEditing(undefined); setShowAdd(true) }}
              className="mt-4 bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700">
              {isRtl ? 'إضافة أول شيفت' : 'Add First Shift'}
            </button>
          </div>
        )
        : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shifts.map(s => {
              const hours = calcHours(s.startTime, s.endTime)
              const topAssignees = s.assignments.slice(0, 5)
              const extra = s.assignments.length - topAssignees.length

              return (
                <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Colored top bar */}
                  <div className="h-1" style={{ background: s.color }} />

                  <div className="p-5">
                    {/* Title row */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.color + '18' }}>
                          <Clock size={17} style={{ color: s.color }} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 leading-tight">{s.name}</p>
                          {s.description && <p className="text-xs text-gray-400 mt-0.5 leading-tight">{s.description}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0 ml-2">
                        <button onClick={() => { setEditing(s); setShowAdd(true) }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => del(s.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="mt-3 flex items-center gap-1.5">
                      <span className="text-sm font-semibold px-2.5 py-1 rounded-lg" style={{ background: s.color + '15', color: s.color }}>
                        {formatTime(s.startTime)}
                      </span>
                      <span className="text-gray-400 text-sm">–</span>
                      <span className="text-sm font-semibold px-2.5 py-1 rounded-lg" style={{ background: s.color + '15', color: s.color }}>
                        {formatTime(s.endTime)}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">({hours}h)</span>
                    </div>

                    {/* Days */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {DAYS.map(d => {
                        const active = s.activeDays.includes(d)
                        return (
                          <span key={d}
                            className="text-xs px-2 py-1 rounded-md font-semibold transition-colors"
                            style={active
                              ? { background: s.color, color: '#fff' }
                              : { background: '#F3F4F6', color: '#9CA3AF' }}>
                            {d.charAt(0) + d.slice(1).toLowerCase()}
                          </span>
                        )
                      })}
                    </div>

                    {/* Employees row */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                      <div className="flex items-center gap-1">
                        {/* Overlapping avatars */}
                        <div className="flex -space-x-2">
                          {topAssignees.map((a) => {
                            const name = [a.staff?.user?.profile?.firstName, a.staff?.user?.profile?.lastName].filter(Boolean).join(' ') || ''
                            return <EmpAvatar key={a.staffId} name={name} email={a.staff?.user?.email ?? ''} size={28} />
                          })}
                          {extra > 0 && (
                            <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-500">
                              +{extra}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 ml-1">
                          {s.assignments.length} {isRtl ? 'موظف' : s.assignments.length === 1 ? 'employee' : 'employees'}
                        </span>
                      </div>
                      <button
                        onClick={() => setManaging(s)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        style={{ color: s.color, background: s.color + '12' }}>
                        <Users size={12} />
                        {isRtl ? 'إدارة الموظفين' : 'Manage Employees'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      }

      {/* Unassigned Employees */}
      {unassigned.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <UserCheck size={16} className="text-amber-600" />
            </div>
            <p className="font-semibold text-gray-800">
              {isRtl ? `الموظفون غير المعيّنون (${unassigned.length})` : `Unassigned Employees (${unassigned.length})`}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {unassigned.map(emp => {
              const name = [emp.user.profile?.firstName, emp.user.profile?.lastName].filter(Boolean).join(' ') || ''
              return (
                <div key={emp._userId} className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 border border-amber-100 shadow-sm">
                  <EmpAvatar name={name} email={emp.user.email} size={34} />
                  <div className="mr-1">
                    <p className="text-sm font-semibold text-gray-800">{name || emp.user.email}</p>
                    <p className="text-xs text-gray-400">{emp.jobTitle || emp.user.role.replace(/_/g, ' ')}</p>
                  </div>
                  <AssignDropdown employee={emp} shifts={shifts} onAssigned={load} isRtl={isRtl} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Dialogs */}
      {showAdd && (
        <ShiftDialog
          shift={editing}
          onClose={() => { setShowAdd(false); setEditing(undefined) }}
          onSave={load}
        />
      )}
      {managing && (() => {
        // Always use the live shift from state so assignments stay fresh after add/remove
        const liveShift = shifts.find(s => s.id === managing.id) ?? managing
        return (
          <ManageDialog
            shift={liveShift}
            allEmployees={allEmployees}
            onClose={() => setManaging(null)}
            onSave={load}
          />
        )
      })()}
    </div>
  )
}
