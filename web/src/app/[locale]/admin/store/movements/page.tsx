'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { ArrowLeftRight, Download, Search, User } from 'lucide-react'
import { apiClient } from '@/lib/api'

interface ChainPerson {
  profile?: { firstName: string; lastName: string } | null
  email?: string
}

interface Chain {
  takenBy?: ChainPerson | null
  approvedBySM?: ChainPerson | null
  reqManager?: ChainPerson | null
  ownerApproval?: ChainPerson | null
}

interface Movement {
  id: string; type: 'IN' | 'OUT' | 'ADJUSTMENT'; quantity: number
  reason?: string; createdAt: string
  item: { name: string; unit: string; sku?: string }
  user?: ChainPerson | null
  chain?: Chain
}

const TYPE_COLORS: Record<string, string> = {
  IN: 'bg-emerald-100 text-emerald-700',
  OUT: 'bg-red-100 text-red-700',
  ADJUSTMENT: 'bg-amber-100 text-amber-700',
}

function personName(p?: ChainPerson | null) {
  if (!p) return null
  if (p.profile?.firstName) return `${p.profile.firstName} ${p.profile.lastName ?? ''}`.trim()
  return p.email ?? null
}

function ChainBadge({ label, person, color }: { label: string; person?: ChainPerson | null; color: string }) {
  const name = personName(person)
  if (!name) return null
  return (
    <span className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 ${color} font-medium`}>
      <User size={10} /> {label}: {name}
    </span>
  )
}

export default function MovementsPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Try the enriched chain endpoint first; fall back to basic endpoint if unavailable
      let d: any
      try {
        d = await apiClient.get('/store/movements/chain?limit=500').then((x: any) => x.data?.data ?? x.data)
      } catch {
        d = await apiClient.get('/store/movements?limit=500').then((x: any) => x.data?.data ?? x.data)
      }
      setMovements(Array.isArray(d) ? d : [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = movements.filter(m => {
    const matchSearch = !search || m.item?.name?.toLowerCase().includes(search.toLowerCase()) ||
      personName(m.chain?.takenBy)?.toLowerCase().includes(search.toLowerCase()) ||
      personName(m.user)?.toLowerCase().includes(search.toLowerCase())
    const matchType = !typeFilter || m.type === typeFilter
    return matchSearch && matchType
  })

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  const totalIn = filtered.filter(m => m.type === 'IN').reduce((s, m) => s + m.quantity, 0)
  const totalOut = filtered.filter(m => m.type === 'OUT').reduce((s, m) => s + m.quantity, 0)
  const net = totalIn - totalOut

  const exportCsv = () => {
    const rows = [['Date', 'Item', 'Type', 'Qty', 'Performed By', 'Taken By', 'SM Approver', 'Req Manager', 'Owner', 'Reason']]
    filtered.forEach(m => rows.push([
      new Date(m.createdAt).toLocaleDateString(),
      m.item?.name ?? '',
      m.type,
      String(m.quantity),
      personName(m.user) ?? '',
      personName(m.chain?.takenBy) ?? '',
      personName(m.chain?.approvedBySM) ?? '',
      personName(m.chain?.reqManager) ?? '',
      personName(m.chain?.ownerApproval) ?? '',
      (m.reason ?? '').replace(/\|.*$/, '').trim(),
    ]))
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'movements.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'حركة المخزون' : 'Stock Movements'}</h1>
          <p className="text-sm text-gray-500 mt-1">{isRtl ? 'سجل جميع حركات الإدخال والإخراج مع سلسلة الموافقات' : 'Complete log of all stock movements with full approval chain'}</p>
        </div>
        <button onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors">
          <Download size={14} /> {isRtl ? 'تصدير CSV' : 'Export CSV'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-emerald-700">{totalIn.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-0.5">{isRtl ? 'إجمالي الإدخال' : 'Total IN'}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-red-700">{totalOut.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-0.5">{isRtl ? 'إجمالي الإخراج' : 'Total OUT'}</p>
        </div>
        <div className={`${net >= 0 ? 'bg-blue-50' : 'bg-orange-50'} rounded-xl p-4`}>
          <p className={`text-2xl font-bold ${net >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{net >= 0 ? '+' : ''}{net.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-0.5">{isRtl ? 'الصافي' : 'Net Change'}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder={isRtl ? 'بحث بالصنف أو الشخص...' : 'Search by item or person...'}
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
          <option value="">{isRtl ? 'كل الأنواع' : 'All types'}</option>
          <option value="IN">IN</option>
          <option value="OUT">OUT</option>
          <option value="ADJUSTMENT">ADJUSTMENT</option>
        </select>
      </div>

      {/* Table */}
      {loading
        ? <div className="animate-pulse space-y-2">{[...Array(10)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}</div>
        : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/50">
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{isRtl ? 'التاريخ' : 'Date'}</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{isRtl ? 'الصنف' : 'Item'}</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{isRtl ? 'النوع' : 'Type'}</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{isRtl ? 'الكمية' : 'Qty'}</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{isRtl ? 'بواسطة' : 'Performed By'}</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{isRtl ? 'سلسلة الموافقات' : 'Approval Chain'}</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{isRtl ? 'السبب' : 'Reason'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.length === 0
                    ? <tr><td colSpan={7} className="text-center py-12 text-gray-400">
                        <ArrowLeftRight size={32} className="mx-auto mb-2 opacity-20" />
                        {isRtl ? 'لا توجد حركات' : 'No movements'}
                      </td></tr>
                    : paginated.map(m => {
                        const chain = m.chain
                        const hasChain = chain && (chain.takenBy || chain.approvedBySM || chain.reqManager || chain.ownerApproval)
                        const displayReason = (m.reason ?? '').replace(/\|.*$/, '').trim()
                        return (
                          <tr key={m.id} className="hover:bg-gray-50/50 transition-colors align-top">
                            <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                              {new Date(m.createdAt).toLocaleDateString()}<br />
                              <span className="text-xs">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-800">{m.item?.name}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${TYPE_COLORS[m.type] ?? 'bg-gray-100 text-gray-700'}`}>{m.type}</span>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">{m.quantity} {m.item?.unit}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {personName(m.user) ?? <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-4 py-3">
                              {hasChain ? (
                                <div className="flex flex-col gap-1">
                                  <ChainBadge label={isRtl ? 'طلب' : 'Requested'} person={chain?.takenBy} color="bg-violet-100 text-violet-700" />
                                  <ChainBadge label={isRtl ? 'وافق SM' : 'SM'} person={chain?.approvedBySM} color="bg-indigo-100 text-indigo-700" />
                                  <ChainBadge label={isRtl ? 'مدير المشتريات' : 'Req Mgr'} person={chain?.reqManager} color="bg-blue-100 text-blue-700" />
                                  <ChainBadge label={isRtl ? 'المالك' : 'Owner'} person={chain?.ownerApproval} color="bg-amber-100 text-amber-700" />
                                </div>
                              ) : <span className="text-gray-300 text-sm">—</span>}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-400 max-w-[180px] truncate">{displayReason || '—'}</td>
                          </tr>
                        )
                      })
                  }
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
                <p className="text-sm text-gray-500">{isRtl ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}</p>
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
