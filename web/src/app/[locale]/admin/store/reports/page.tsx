'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { BarChart2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { apiClient } from '@/lib/api'

interface UsageReport {
  topItems: { id: string; name: string; unit: string; in: number; out: number; total: number }[]
  trend: { date: string; in: number; out: number }[]
  totalIn: number
  totalOut: number
}
interface SpendingReport {
  bySupplier: { name: string; total: number; count: number }[]
  totalSpend: number
  orderCount: number
}
interface RequestsReport {
  byStatus: Record<string, number>
  trend: { date: string; count: number }[]
  total: number
}

const DAYS_OPTIONS = [7, 30, 90]

function SimpleBarChart({ data, max, colorClass }: { data: { label: string; value: number }[]; max: number; colorClass: string }) {
  return (
    <div className="space-y-2">
      {data.map(d => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-28 shrink-0 truncate">{d.label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
            <div className={`h-full rounded-full ${colorClass} transition-all flex items-center justify-end pr-2`}
              style={{ width: `${max > 0 ? (d.value / max) * 100 : 0}%`, minWidth: d.value > 0 ? '20px' : 0 }}>
              <span className="text-xs text-white font-medium">{d.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function TrendLine({ data, labelKey, valueKey, color }: { data: Record<string, any>[]; labelKey: string; valueKey: string; color: string }) {
  if (!data.length) return <p className="text-sm text-gray-400 text-center py-4">No data</p>
  const values = data.map(d => Number(d[valueKey]))
  const max = Math.max(...values, 1)
  const h = 60
  const w = 100 / (data.length - 1 || 1)
  const points = data.map((d, i) => `${i * w},${h - (Number(d[valueKey]) / max) * h}`).join(' ')

  return (
    <div className="relative">
      <svg className={`w-full h-16 ${color}`} viewBox={`0 0 100 60`} preserveAspectRatio="none">
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="flex justify-between mt-1">
        {data.filter((_, i) => i === 0 || i === data.length - 1).map((d, i) => (
          <span key={i} className="text-xs text-gray-400">{String(d[labelKey]).slice(5)}</span>
        ))}
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [days, setDays] = useState(30)
  const [usage, setUsage] = useState<UsageReport | null>(null)
  const [spending, setSpending] = useState<SpendingReport | null>(null)
  const [requests, setRequests] = useState<RequestsReport | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [u, s, r] = await Promise.all([
        apiClient.get(`/store/reports/usage?days=${days}`).then((d: any) => d.data?.data ?? d.data),
        apiClient.get(`/store/reports/spending?days=${days}`).then((d: any) => d.data?.data ?? d.data),
        apiClient.get(`/store/reports/requests?days=${days}`).then((d: any) => d.data?.data ?? d.data),
      ])
      setUsage(u)
      setSpending(s)
      setRequests(r)
    } catch {}
    setLoading(false)
  }, [days])

  useEffect(() => { load() }, [load])

  const usageMax = Math.max(...(usage?.topItems ?? []).map(i => i.total), 1)
  const spendMax = Math.max(...(spending?.bySupplier ?? []).map(s => s.total), 1)

  return (
    <div className="p-6 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'التقارير والتحليلات' : 'Reports & Analytics'}</h1>
          <p className="text-sm text-gray-500 mt-1">{isRtl ? 'نظرة تحليلية على أداء المخزن' : 'Data-driven insights into store performance'}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {DAYS_OPTIONS.map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${days === d ? 'bg-white shadow text-indigo-700' : 'text-gray-600'}`}>
                {d}d
              </button>
            ))}
          </div>
          <button onClick={load} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <RefreshCw size={14} className="text-gray-500" />
          </button>
        </div>
      </div>

      {loading
        ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-pulse">{[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-gray-100 rounded-2xl" />)}</div>
        : (
          <>
            {/* Row 1: KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: isRtl ? 'إجمالي الإدخال' : 'Total IN', val: usage?.totalIn ?? 0, icon: <TrendingUp size={18} className="text-emerald-600" />, bg: 'bg-emerald-50' },
                { label: isRtl ? 'إجمالي الإخراج' : 'Total OUT', val: usage?.totalOut ?? 0, icon: <TrendingDown size={18} className="text-red-500" />, bg: 'bg-red-50' },
                { label: isRtl ? 'إجمالي الطلبات' : 'Total Requests', val: requests?.total ?? 0, icon: <BarChart2 size={18} className="text-indigo-600" />, bg: 'bg-indigo-50' },
                { label: isRtl ? 'إجمالي الإنفاق' : 'Total Spend', val: `$${(spending?.totalSpend ?? 0).toFixed(0)}`, icon: <BarChart2 size={18} className="text-purple-600" />, bg: 'bg-purple-50' },
              ].map(k => (
                <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl ${k.bg}`}>{k.icon}</div>
                  <div>
                    <p className="text-sm text-gray-500">{k.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{k.val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Row 2: Top usage + Movement trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 mb-4">{isRtl ? 'أكثر الأصناف استخداماً' : 'Top 10 Items by Activity'}</h3>
                {(usage?.topItems ?? []).length === 0
                  ? <p className="text-sm text-gray-400 text-center py-8">{isRtl ? 'لا بيانات' : 'No data'}</p>
                  : <SimpleBarChart
                      data={usage!.topItems.map(i => ({ label: i.name, value: i.total }))}
                      max={usageMax}
                      colorClass="bg-indigo-500"
                    />
                }
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 mb-4">{isRtl ? 'حركة المخزون عبر الزمن' : 'Movement Trend'}</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-emerald-600 mb-1">IN</p>
                    <TrendLine data={usage?.trend ?? []} labelKey="date" valueKey="in" color="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-500 mb-1">OUT</p>
                    <TrendLine data={usage?.trend ?? []} labelKey="date" valueKey="out" color="text-red-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Spending by supplier + Requests by status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 mb-4">{isRtl ? 'الإنفاق حسب المورد' : 'Spending by Supplier'}</h3>
                {(spending?.bySupplier ?? []).length === 0
                  ? <p className="text-sm text-gray-400 text-center py-8">{isRtl ? 'لا بيانات' : 'No data'}</p>
                  : <SimpleBarChart
                      data={spending!.bySupplier.map(s => ({ label: s.name, value: Math.round(s.total) }))}
                      max={spendMax}
                      colorClass="bg-purple-500"
                    />
                }
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 mb-4">{isRtl ? 'الطلبات حسب الحالة' : 'Requests by Status'}</h3>
                {!requests?.byStatus
                  ? <p className="text-sm text-gray-400 text-center py-8">{isRtl ? 'لا بيانات' : 'No data'}</p>
                  : (
                    <div className="space-y-3">
                      {Object.entries(requests.byStatus).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{status}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 bg-gray-100 rounded-full h-2">
                              <div className="bg-indigo-500 h-2 rounded-full"
                                style={{ width: `${requests.total > 0 ? (count / requests.total) * 100 : 0}%` }} />
                            </div>
                            <span className="text-sm font-semibold text-gray-900 w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>
            </div>

            {/* Row 4: Top items table */}
            {(usage?.topItems ?? []).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                  <h3 className="font-semibold text-gray-900">{isRtl ? 'تفاصيل الأصناف الأكثر نشاطاً' : 'Top Items Breakdown'}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-50 bg-gray-50/50">
                        <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{isRtl ? 'الصنف' : 'Item'}</th>
                        <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{isRtl ? 'إدخال' : 'IN'}</th>
                        <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{isRtl ? 'إخراج' : 'OUT'}</th>
                        <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{isRtl ? 'الإجمالي' : 'Total'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {usage!.topItems.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.name}</td>
                          <td className="px-4 py-3 text-sm text-emerald-600 font-semibold">{item.in} {item.unit}</td>
                          <td className="px-4 py-3 text-sm text-red-500 font-semibold">{item.out} {item.unit}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-bold">{item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )
      }
    </div>
  )
}
