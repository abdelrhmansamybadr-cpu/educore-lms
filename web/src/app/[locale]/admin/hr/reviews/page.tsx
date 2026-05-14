'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { apiClient } from '@/lib/api'
import { Star, Plus, X, Edit2, Trash2, Search } from 'lucide-react'

interface Review { id: string; rating: number; comment: string; reviewType: string; reviewPeriod?: string; createdAt: string; staff: { user: { email: string; profile?: { firstName: string; lastName: string } } }; reviewer?: { profile?: { firstName: string; lastName: string } } }

const REVIEW_TYPES = ['ANNUAL', 'QUARTERLY', 'PROBATION', 'PROJECT', 'PEER']

function ReviewDialog({ review, staffList, onClose, onSave }: { review?: Review; staffList: any[]; onClose: () => void; onSave: () => void }) {
  const isRtl = useLocale() === 'ar'
  const [form, setForm] = useState({
    staffId: '', rating: review?.rating ?? 3, comment: review?.comment ?? '',
    reviewType: review?.reviewType ?? 'ANNUAL', reviewPeriod: review?.reviewPeriod ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [hovered, setHovered] = useState(0)

  const save = async () => {
    setSaving(true)
    try {
      if (review) await apiClient.patch(`/hr/reviews/${review.id}`, { rating: form.rating, comment: form.comment, reviewType: form.reviewType, reviewPeriod: form.reviewPeriod })
      else await apiClient.post('/hr/reviews', form)
      onSave(); onClose()
    } catch {}
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <p className="font-bold text-gray-900">{review ? (isRtl ? 'تعديل التقييم' : 'Edit Review') : (isRtl ? 'إضافة تقييم' : 'Add Review')}</p>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          {!review && (
            <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'الموظف' : 'Employee'}</label>
              <select value={form.staffId} onChange={e => setForm(p => ({ ...p, staffId: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                <option value="">{isRtl ? 'اختر موظفاً' : 'Select employee'}</option>
                {staffList.map((s: any) => <option key={s.id} value={s.id}>{[s.user?.profile?.firstName, s.user?.profile?.lastName].filter(Boolean).join(' ') || s.user?.email}</option>)}
              </select></div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'نوع التقييم' : 'Review Type'}</label>
              <select value={form.reviewType} onChange={e => setForm(p => ({ ...p, reviewType: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                {REVIEW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select></div>
            <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'الفترة' : 'Period'}</label>
              <input value={form.reviewPeriod} onChange={e => setForm(p => ({ ...p, reviewPeriod: e.target.value }))}
                placeholder="e.g. Q1 2025"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-2 block">{isRtl ? 'التقييم' : 'Rating'}</label>
            <div className="flex gap-2 items-center">
              {[1,2,3,4,5].map(n => (
                <button key={n}
                  onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)}
                  onClick={() => setForm(p => ({ ...p, rating: n }))}
                  className="transition-transform hover:scale-110">
                  <Star size={32} fill={(hovered || form.rating) >= n ? '#F59E0B' : 'transparent'} className={(hovered || form.rating) >= n ? 'text-amber-400' : 'text-gray-200'} />
                </button>
              ))}
              <span className="text-sm font-bold text-gray-600 ml-2">{form.rating}/5</span>
            </div>
          </div>
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'التعليق' : 'Comments'}</label>
            <textarea value={form.comment} onChange={e => setForm(p => ({ ...p, comment: e.target.value }))} rows={4}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder={isRtl ? 'اكتب تقييمك هنا...' : 'Write your feedback here...'} /></div>
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-2">
          <button onClick={save} disabled={saving} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">{saving ? '...' : (isRtl ? 'حفظ' : 'Save')}</button>
          <button onClick={onClose} className="px-4 border border-gray-200 rounded-xl text-sm">{isRtl ? 'إلغاء' : 'Cancel'}</button>
        </div>
      </div>
    </div>
  )
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={13} fill={n <= rating ? '#F59E0B' : 'transparent'} className={n <= rating ? 'text-amber-400' : 'text-gray-200'} />
      ))}
    </div>
  )
}

export default function ReviewsPage() {
  const locale = useLocale(); const isRtl = locale === 'ar'
  const [reviews, setReviews] = useState<Review[]>([])
  const [staffList, setStaffList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<Review | undefined>()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rRes, sRes] = await Promise.all([
        apiClient.get('/hr/reviews').then((r: any) => r.data?.data ?? r.data ?? []),
        apiClient.get('/hr/all-users').then((r: any) => r.data?.data ?? r.data ?? []),
      ])
      setReviews(Array.isArray(rRes) ? rRes : [])
      setStaffList(Array.isArray(sRes) ? sRes : [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const del = async (id: string) => {
    if (!confirm(isRtl ? 'حذف هذا التقييم؟' : 'Delete this review?')) return
    await apiClient.delete(`/hr/reviews/${id}`); load()
  }

  const filtered = reviews.filter(r => {
    const name = `${r.staff?.user?.profile?.firstName ?? ''} ${r.staff?.user?.profile?.lastName ?? ''}`
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'ALL' || r.reviewType === typeFilter
    return matchSearch && matchType
  })

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—'

  return (
    <div className="p-6 space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Star size={22} className="text-indigo-600" />{isRtl ? 'تقييمات الأداء' : 'Performance Reviews'}</h1>
          <p className="text-sm text-gray-500 mt-1">{reviews.length} {isRtl ? 'تقييم' : 'reviews'} · {isRtl ? 'متوسط:' : 'Avg:'} {avgRating}/5</p>
        </div>
        <button onClick={() => { setEditing(undefined); setShowDialog(true) }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700">
          <Plus size={14} />{isRtl ? 'إضافة تقييم' : 'Add Review'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={isRtl ? 'بحث بالاسم...' : 'Search by name...'}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
          <option value="ALL">{isRtl ? 'كل الأنواع' : 'All Types'}</option>
          {REVIEW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading
        ? <div className="animate-pulse space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}</div>
        : filtered.length === 0
          ? <div className="flex flex-col items-center justify-center py-24"><Star size={48} className="text-gray-200 mb-4" /><p className="text-gray-400">{isRtl ? 'لا توجد تقييمات' : 'No reviews yet'}</p></div>
          : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(r => {
                const name = `${r.staff?.user?.profile?.firstName ?? ''} ${r.staff?.user?.profile?.lastName ?? ''}`.trim()
                const reviewerName = r.reviewer ? `${r.reviewer.profile?.firstName ?? ''} ${r.reviewer.profile?.lastName ?? ''}`.trim() : ''
                return (
                  <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-gray-800">{name || r.staff?.user?.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <StarDisplay rating={r.rating} />
                          <span className="text-xs text-gray-500">{r.rating}/5</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditing(r); setShowDialog(true) }} className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-600"><Edit2 size={13} /></button>
                        <button onClick={() => del(r.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className="text-xs bg-indigo-50 text-indigo-700 rounded-full px-2.5 py-0.5 font-medium">{r.reviewType}</span>
                      {r.reviewPeriod && <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5">{r.reviewPeriod}</span>}
                    </div>
                    {r.comment && <p className="text-sm text-gray-600 mt-3 line-clamp-3 italic">"{r.comment}"</p>}
                    <p className="text-xs text-gray-400 mt-3">
                      {reviewerName && <span>{isRtl ? 'بواسطة:' : 'By:'} {reviewerName} · </span>}
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )
              })}
            </div>
          )
      }

      {showDialog && <ReviewDialog review={editing} staffList={staffList} onClose={() => { setShowDialog(false); setEditing(undefined) }} onSave={load} />}
    </div>
  )
}
