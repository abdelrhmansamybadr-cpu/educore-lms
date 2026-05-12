'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardHeader, CardBody, Badge, Skeleton } from '@/components/ui'
import { DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

const STATUS_COLORS: Record<string, any> = {
  PAID: 'success', UNPAID: 'danger', PARTIAL: 'warning', OVERDUE: 'danger', CANCELLED: 'default',
}

const STATUS_ICONS: Record<string, any> = {
  PAID: CheckCircle, UNPAID: Clock, PARTIAL: Clock, OVERDUE: AlertCircle, CANCELLED: Clock,
}

export default function ParentFinancePage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['parent-invoices-all'],
    queryFn: () => api.get('/parent/invoices').then(r => r.data?.data || []),
  })

  const unpaidTotal = invoices?.filter((i: any) => i.status === 'UNPAID' || i.status === 'PARTIAL' || i.status === 'OVERDUE')
    .reduce((sum: number, i: any) => sum + (i.amountDue || i.total || 0), 0) || 0

  const paidTotal = invoices?.filter((i: any) => i.status === 'PAID')
    .reduce((sum: number, i: any) => sum + (i.total || 0), 0) || 0

  const statusLabel: Record<string, string> = {
    PAID: isRtl ? 'مدفوع' : 'Paid',
    UNPAID: isRtl ? 'غير مدفوع' : 'Unpaid',
    PARTIAL: isRtl ? 'مدفوع جزئيًا' : 'Partial',
    OVERDUE: isRtl ? 'متأخر' : 'Overdue',
    CANCELLED: isRtl ? 'ملغي' : 'Cancelled',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'الرسوم والفواتير' : 'Fees & Invoices'}</h1>
        <p className="text-gray-500 text-sm">{isRtl ? 'إدارة الرسوم الدراسية والمدفوعات' : 'Manage tuition fees and payments'}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{unpaidTotal.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{isRtl ? 'ريال مستحق' : 'SAR Due'}</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{paidTotal.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{isRtl ? 'ريال مدفوع' : 'SAR Paid'}</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center col-span-2 md:col-span-1">
          <p className="text-2xl font-bold text-blue-600">{invoices?.length || 0}</p>
          <p className="text-xs text-gray-500 mt-1">{isRtl ? 'إجمالي الفواتير' : 'Total Invoices'}</p>
        </div>
      </div>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign size={18} className="text-primary-700" />
            <h3 className="font-semibold text-gray-900">{isRtl ? 'جميع الفواتير' : 'All Invoices'}</h3>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : invoices?.length === 0 ? (
            <CardBody>
              <div className="text-center py-12 text-gray-400">
                <DollarSign size={40} className="mx-auto mb-2 opacity-30" />
                <p>{isRtl ? 'لا توجد فواتير' : 'No invoices'}</p>
              </div>
            </CardBody>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-start font-semibold text-gray-600">{isRtl ? 'الفاتورة' : 'Invoice'}</th>
                  <th className="px-4 py-3 text-start font-semibold text-gray-600 hidden md:table-cell">{isRtl ? 'الطالب' : 'Student'}</th>
                  <th className="px-4 py-3 text-start font-semibold text-gray-600 hidden md:table-cell">{isRtl ? 'تاريخ الاستحقاق' : 'Due Date'}</th>
                  <th className="px-4 py-3 text-end font-semibold text-gray-600">{isRtl ? 'المبلغ' : 'Amount'}</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'إجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices?.map((inv: any) => {
                  const StatusIcon = STATUS_ICONS[inv.status] || Clock
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 text-sm">{inv.description || (isRtl ? 'رسوم دراسية' : 'School Fees')}</p>
                        <p className="text-xs text-gray-400">#{inv.invoiceNumber || inv.id?.slice(0, 8)}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-600 text-sm">
                        {inv.student?.profile?.firstName} {inv.student?.profile?.lastName}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-500 text-sm">
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US') : '—'}
                      </td>
                      <td className="px-4 py-3 text-end font-semibold text-gray-900">
                        {(inv.total || 0).toLocaleString()} {isRtl ? 'ر.س' : 'SAR'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={STATUS_COLORS[inv.status] || 'default'} className="text-xs inline-flex items-center gap-1">
                          <StatusIcon size={10} />
                          {statusLabel[inv.status] || inv.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(inv.status === 'UNPAID' || inv.status === 'PARTIAL' || inv.status === 'OVERDUE') ? (
                          <Link
                            href={`/${locale === 'ar' ? 'ar' : 'en'}/parent/finance/pay/${inv.id}`}
                            className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 inline-block"
                          >
                            {isRtl ? 'ادفع' : 'Pay'}
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-400">{isRtl ? 'مكتمل' : 'Done'}</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
