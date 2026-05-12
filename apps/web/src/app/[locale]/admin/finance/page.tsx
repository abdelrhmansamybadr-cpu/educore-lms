'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardHeader, CardBody, Badge, Skeleton } from '@/components/ui'
import { DollarSign, Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  PAID: 'success',
  UNPAID: 'warning',
  OVERDUE: 'danger',
  CANCELLED: 'default',
  PARTIAL: 'primary',
}

export default function AdminFinancePage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState<'invoices' | 'fees'>('invoices')

  const { data: invoiceData, isLoading } = useQuery({
    queryKey: ['admin-invoices', statusFilter, page],
    queryFn: () => api.get('/finance/invoices', { params: { status: statusFilter || undefined, page, limit: 20 } })
      .then((r) => ({ data: r.data?.data || [], total: r.data?.meta?.total || r.data?.data?.length || 0 })),
  })

  const { data: stats } = useQuery({
    queryKey: ['finance-stats'],
    queryFn: () => api.get('/finance/stats').then((r) => r.data?.data),
  })

  const { data: feeStructures } = useQuery({
    queryKey: ['fee-structures'],
    queryFn: () => api.get('/finance/fee-structures').then((r) => r.data?.data || []),
    enabled: tab === 'fees',
  })

  const invoices = invoiceData?.data || []
  const total = invoiceData?.total || 0
  const totalPages = Math.ceil(total / 20)

  const STAT_CARDS = [
    {
      label: isRtl ? 'إجمالي الفواتير' : 'Total Invoiced',
      value: `${(stats?.totalInvoiced || 0).toLocaleString()} ${isRtl ? 'ر.س' : 'SAR'}`,
      icon: <DollarSign size={18} />,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: isRtl ? 'المحصّل' : 'Collected',
      value: `${(stats?.totalCollected || 0).toLocaleString()} ${isRtl ? 'ر.س' : 'SAR'}`,
      icon: <CheckCircle size={18} />,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: isRtl ? 'المستحق' : 'Outstanding',
      value: `${(stats?.totalOutstanding || 0).toLocaleString()} ${isRtl ? 'ر.س' : 'SAR'}`,
      icon: <Clock size={18} />,
      color: 'text-yellow-600 bg-yellow-50',
    },
    {
      label: isRtl ? 'متأخرة' : 'Overdue',
      value: `${(stats?.overdueCount || 0)} ${isRtl ? 'فاتورة' : 'invoices'}`,
      icon: <AlertCircle size={18} />,
      color: 'text-red-600 bg-red-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'الإدارة المالية' : 'Finance Management'}</h1>
          <p className="text-gray-500 text-sm">{isRtl ? 'الفواتير والمصروفات' : 'Invoices and fee structures'}</p>
        </div>
        <button
          onClick={() => {}}
          className="flex items-center gap-2 bg-primary-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-800"
        >
          <Plus size={16} />
          {isRtl ? 'فاتورة جديدة' : 'New Invoice'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                {s.icon}
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-gray-900 truncate">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('invoices')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'invoices' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
        >
          {isRtl ? 'الفواتير' : 'Invoices'}
        </button>
        <button
          onClick={() => setTab('fees')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'fees' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
        >
          {isRtl ? 'هياكل الرسوم' : 'Fee Structures'}
        </button>
      </div>

      {tab === 'invoices' ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500"
              >
                <option value="">{isRtl ? 'كل الحالات' : 'All Status'}</option>
                <option value="UNPAID">{isRtl ? 'غير مدفوعة' : 'Unpaid'}</option>
                <option value="PAID">{isRtl ? 'مدفوعة' : 'Paid'}</option>
                <option value="OVERDUE">{isRtl ? 'متأخرة' : 'Overdue'}</option>
                <option value="PARTIAL">{isRtl ? 'جزئية' : 'Partial'}</option>
              </select>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">{isRtl ? 'الطالب' : 'Student'}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">{isRtl ? 'الوصف' : 'Description'}</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">{isRtl ? 'المبلغ' : 'Amount'}</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 hidden lg:table-cell">{isRtl ? 'الاستحقاق' : 'Due Date'}</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">{isRtl ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={6} className="p-4"><Skeleton className="h-10" /></td></tr>
                  ))
                ) : invoices.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">{isRtl ? 'لا توجد فواتير' : 'No invoices'}</td></tr>
                ) : invoices.map((inv: any) => {
                  const profile = inv.student?.profile
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {isRtl && profile?.firstNameAr
                            ? `${profile.firstNameAr} ${profile.lastNameAr || ''}`
                            : `${profile?.firstName || '—'} ${profile?.lastName || ''}`}
                        </p>
                        <p className="text-xs text-gray-400">{inv.student?.email}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-600 text-sm">{inv.description || '—'}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {inv.total?.toLocaleString()} {isRtl ? 'ر.س' : 'SAR'}
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell text-sm text-gray-500">
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US') : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={STATUS_COLORS[inv.status] as any}>
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {inv.status === 'UNPAID' || inv.status === 'OVERDUE' ? (
                          <button className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg transition-colors">
                            {isRtl ? 'تسجيل دفعة' : 'Record Payment'}
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center">
              <p className="text-sm text-gray-500">{total} {isRtl ? 'فاتورة' : 'invoices'}</p>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40">
                  {isRtl ? 'السابق' : 'Prev'}
                </button>
                <span className="px-3 py-1.5 text-sm">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40">
                  {isRtl ? 'التالي' : 'Next'}
                </button>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {feeStructures?.map((fee: any) => (
            <Card key={fee.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{isRtl ? (fee.nameAr || fee.name) : fee.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{fee.description}</p>
                  <div className="flex gap-3 mt-2">
                    <Badge variant="primary">{fee.type}</Badge>
                    <Badge variant="default">{fee.frequency}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{fee.amount?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{isRtl ? 'ريال سعودي' : 'SAR'}</p>
                </div>
              </div>
            </Card>
          ))}
          {(!feeStructures || feeStructures.length === 0) && (
            <Card><CardBody><div className="text-center py-10 text-gray-400">{isRtl ? 'لا توجد هياكل رسوم' : 'No fee structures'}</div></CardBody></Card>
          )}
        </div>
      )}
    </div>
  )
}
