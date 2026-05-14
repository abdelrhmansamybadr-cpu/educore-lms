'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { UserCheck, Download, Search, Package } from 'lucide-react'
import { apiClient } from '@/lib/api'

interface Profile { firstName: string; lastName: string; avatar?: string | null }
interface Person { id: string; email?: string; profile?: Profile | null }
interface FulfillmentItem { itemId?: string; itemName: string; quantity: number; unit: string }

interface Collection {
  id: string
  itemName: string
  quantity: number
  reason?: string
  collectedAt?: string
  createdAt: string
  requestedBy?: Person | null
  approvedBy?: Person | null
  item?: { id: string; name: string; unit: string } | null
  fulfillmentItems?: FulfillmentItem[]
  isLoan?: boolean
}

function personName(p?: Person | null) {
  if (!p) return '—'
  if (p.profile?.firstName) return `${p.profile.firstName} ${p.profile.lastName ?? ''}`.trim()
  return p.email ?? '—'
}

function Avatar({ person }: { person?: Person | null }) {
  const name = personName(person)
  const initials = name === '—' ? '?' : name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const src = person?.profile?.avatar
  if (src) return <img src={src} className="w-8 h-8 rounded-full object-cover" alt={name} />
  return (
    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
      {initials}
    </div>
  )
}

export default function CollectionsPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 25

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await apiClient.get('/store/collections').then((x: any) => x.data?.data ?? x.data)
      setCollections(Array.isArray(d) ? d : [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = collections.filter(c => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      personName(c.requestedBy).toLowerCase().includes(s) ||
      c.itemName?.toLowerCase().includes(s) ||
      c.item?.name?.toLowerCase().includes(s)
    )
  })

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  // Aggregate: unique people + total items taken
  const uniquePeople = new Set(collections.map(c => c.requestedBy?.id)).size
  const totalItems = collections.reduce((s, c) => {
    const fi = (c.fulfillmentItems ?? []) as FulfillmentItem[]
    return s + (fi.length > 0 ? fi.reduce((a, f) => a + f.quantity, 0) : c.quantity)
  }, 0)

  const exportCsv = () => {
    const rows = [['Date', 'Employee', 'Item', 'Qty', 'Approved By', 'Loan?']]
    filtered.forEach(c => {
      const fi = (c.fulfillmentItems ?? []) as FulfillmentItem[]
      if (fi.length > 0) {
        fi.forEach(f => rows.push([
          new Date(c.collectedAt ?? c.createdAt).toLocaleDateString(),
          personName(c.requestedBy),
          f.itemName,
          String(f.quantity),
          personName(c.approvedBy),
          c.isLoan ? 'Yes' : 'No',
        ]))
      } else {
        rows.push([
          new Date(c.collectedAt ?? c.createdAt).toLocaleDateString(),
          personName(c.requestedBy),
          c.item?.name ?? c.itemName,
          String(c.quantity),
          personName(c.approvedBy),
          c.isLoan ? 'Yes' : 'No',
        ])
      }
    })
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'who-took-what.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCheck size={24} className="text-indigo-600" />
            {isRtl ? 'من أخذ ماذا' : 'Who Took What'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isRtl ? 'سجل كامل لكل ما أخذه الموظفون من المخزن عبر الزمن' : 'Complete history of all items collected by employees from the store'}
          </p>
        </div>
        <button onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors">
          <Download size={14} /> {isRtl ? 'تصدير CSV' : 'Export CSV'}
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-indigo-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-indigo-700">{collections.length}</p>
          <p className="text-sm text-gray-500 mt-0.5">{isRtl ? 'إجمالي الطلبات المُجمَّعة' : 'Total Collected Requests'}</p>
        </div>
        <div className="bg-violet-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-violet-700">{uniquePeople}</p>
          <p className="text-sm text-gray-500 mt-0.5">{isRtl ? 'موظفون مختلفون' : 'Unique Employees'}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-emerald-700">{totalItems.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-0.5">{isRtl ? 'إجمالي الوحدات المأخوذة' : 'Total Units Taken'}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder={isRtl ? 'بحث بالاسم أو الصنف...' : 'Search by employee or item...'}
          className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
      </div>

      {/* Table */}
      {loading
        ? <div className="animate-pulse space-y-2">{[...Array(10)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}</div>
        : filtered.length === 0
          ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package size={48} className="text-gray-200 mb-4" />
              <p className="text-gray-400 font-medium">{isRtl ? 'لا توجد عمليات جمع بعد' : 'No collections yet'}</p>
              <p className="text-gray-300 text-sm mt-1">{isRtl ? 'ستظهر هنا عندما يجمع الموظفون الأصناف' : 'Items will appear here when employees collect them'}</p>
            </div>
          )
          : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50/50">
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{isRtl ? 'الموظف' : 'Employee'}</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{isRtl ? 'الأصناف المأخوذة' : 'Items Taken'}</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{isRtl ? 'وافق عليه' : 'Approved By'}</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{isRtl ? 'النوع' : 'Type'}</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{isRtl ? 'تاريخ الجمع' : 'Collected At'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginated.map(c => {
                      const fi = (c.fulfillmentItems ?? []) as FulfillmentItem[]
                      const itemsToShow = fi.length > 0 ? fi : [{ itemName: c.item?.name ?? c.itemName, quantity: c.quantity, unit: c.item?.unit ?? '' }]
                      const collectedDate = c.collectedAt ?? c.createdAt
                      return (
                        <tr key={c.id} className="hover:bg-gray-50/50 transition-colors align-top">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Avatar person={c.requestedBy} />
                              <div>
                                <p className="text-sm font-medium text-gray-800">{personName(c.requestedBy)}</p>
                                <p className="text-xs text-gray-400">{c.requestedBy?.email ?? ''}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              {itemsToShow.map((f, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                                  <span className="text-sm text-gray-700">{f.itemName}</span>
                                  <span className="text-xs text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">{f.quantity} {f.unit}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {c.approvedBy ? (
                              <div className="flex items-center gap-2">
                                <Avatar person={c.approvedBy} />
                                <span className="text-sm text-gray-700">{personName(c.approvedBy)}</span>
                              </div>
                            ) : <span className="text-gray-300 text-sm">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {c.isLoan
                              ? <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2.5 py-0.5 font-semibold">{isRtl ? 'عارية' : 'Loan'}</span>
                              : <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2.5 py-0.5 font-semibold">{isRtl ? 'دائم' : 'Permanent'}</span>
                            }
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(collectedDate).toLocaleDateString()}<br />
                            <span className="text-xs">{new Date(collectedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
                  <p className="text-sm text-gray-500">
                    {isRtl ? `إجمالي ${filtered.length} عملية جمع` : `${filtered.length} total collections`} — {isRtl ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
                  </p>
                  <div className="flex gap-2">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">
                      {isRtl ? 'السابق' : 'Previous'}
                    </button>
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">
                      {isRtl ? 'التالي' : 'Next'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
      }
    </div>
  )
}
