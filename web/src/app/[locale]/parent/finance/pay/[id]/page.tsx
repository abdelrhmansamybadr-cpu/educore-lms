'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { api, getApiError } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardHeader, CardBody, Badge, Skeleton } from '@/components/ui'
import {
  DollarSign, CheckCircle, CreditCard, Building2, Banknote,
  ArrowLeft, Smartphone, AlertCircle, Clock,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

const GATEWAY_OPTIONS = [
  { value: 'CASH',         label: 'Cash',          labelAr: 'نقداً',              icon: Banknote,    note: 'Pay at the school cashier' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer',  labelAr: 'تحويل بنكي',        icon: Building2,   note: 'Transfer to school account and upload proof' },
  { value: 'CARD',         label: 'Card',           labelAr: 'بطاقة بنكية',        icon: CreditCard,  note: 'Credit or debit card payment' },
  { value: 'APPLE_PAY',    label: 'Apple Pay',      labelAr: 'Apple Pay',          icon: Smartphone,  note: 'Pay with Apple Pay' },
  { value: 'GOOGLE_PAY',   label: 'Google Pay',     labelAr: 'Google Pay',         icon: Smartphone,  note: 'Pay with Google Pay' },
]

const STATUS_COLORS: Record<string, any> = {
  PAID: 'success', UNPAID: 'danger', PARTIAL: 'warning', OVERDUE: 'danger', CANCELLED: 'default',
}

function QRCode({ value, size = 140 }: { value: string; size?: number }) {
  const encoded = encodeURIComponent(value)
  return (
    <img
      src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&color=1a1a2e&bgcolor=ffffff`}
      alt="QR Code"
      width={size}
      height={size}
      className="rounded-xl"
    />
  )
}

export default function PayInvoicePage() {
  const params = useParams()
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const invoiceId = params.id as string

  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [reference, setReference] = useState('')
  const [paid, setPaid] = useState<any>(null)

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['parent-invoice', invoiceId],
    queryFn: () => api.get(`/finance/invoices/${invoiceId}/statement`).then(r => r.data?.data ?? r.data),
  })

  const payMutation = useMutation({
    mutationFn: (body: any) => api.post(`/finance/invoices/${invoiceId}/payments`, body).then(r => r.data?.data ?? r.data),
    onSuccess: (data) => {
      setPaid(data)
      toast.success(isRtl ? 'تم تسجيل الدفع بنجاح' : 'Payment recorded successfully')
    },
    onError: (e: any) => toast.error(getApiError(e, isRtl ? 'فشل الدفع' : 'Payment failed')),
  })

  const handlePay = () => {
    if (!selectedMethod) { toast.error(isRtl ? 'اختر طريقة الدفع' : 'Choose a payment method'); return }
    const amountDue = (invoice?.total || 0) - (invoice?.payments?.filter((p: any) => p.status === 'SUCCESS').reduce((s: number, p: any) => s + p.amount, 0) || 0)
    payMutation.mutate({ method: selectedMethod, amount: amountDue, currency: invoice?.currency || 'SAR', reference })
  }

  if (isLoading) return (
    <div className="max-w-lg mx-auto space-y-4 p-4">
      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
    </div>
  )

  if (!invoice) return (
    <div className="max-w-lg mx-auto p-8 text-center text-gray-400">
      <AlertCircle size={40} className="mx-auto mb-3 opacity-40" />
      <p>{isRtl ? 'الفاتورة غير موجودة' : 'Invoice not found'}</p>
    </div>
  )

  const totalPaid = invoice.payments?.filter((p: any) => p.status === 'SUCCESS').reduce((s: number, p: any) => s + p.amount, 0) || 0
  const amountDue = Math.max(0, (invoice.total || 0) - totalPaid)
  const currency = invoice.currency || 'SAR'

  // ── Success state ────────────────────────────────────────────────────────────
  if (paid || invoice.status === 'PAID') {
    const receiptId = paid?.payment?.id || invoice.id
    return (
      <div className="max-w-md mx-auto p-6 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'تم الدفع بنجاح!' : 'Payment Successful!'}</h1>
          <p className="text-gray-500 text-sm mt-1">{isRtl ? 'شكراً لك، تم تسجيل دفعتك.' : 'Thank you, your payment has been recorded.'}</p>
        </div>

        {/* Receipt card */}
        <Card>
          <CardHeader>
            <h3 className="font-bold text-gray-900">{isRtl ? 'إيصال الدفع' : 'Payment Receipt'}</h3>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="flex justify-center mb-2">
              <QRCode value={`${window.location.origin}/receipts/${receiptId}`} />
            </div>
            <div className="text-center text-xs text-gray-400">{isRtl ? 'امسح الرمز للتحقق من الإيصال' : 'Scan to verify receipt'}</div>
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <Row label={isRtl ? 'رقم الفاتورة' : 'Invoice #'} value={`#${invoice.invoiceNumber || invoice.id?.slice(0, 8).toUpperCase()}`} />
              <Row label={isRtl ? 'الوصف' : 'Description'} value={invoice.description || (isRtl ? 'رسوم دراسية' : 'School Fees')} />
              <Row label={isRtl ? 'المبلغ المدفوع' : 'Amount Paid'} value={`${(paid?.payment?.amount || amountDue).toLocaleString()} ${currency}`} bold />
              <Row label={isRtl ? 'طريقة الدفع' : 'Method'} value={selectedMethod || GATEWAY_OPTIONS.find(g => g.value === invoice.payments?.slice(-1)[0]?.gateway)?.label || '—'} />
              <Row label={isRtl ? 'التاريخ' : 'Date'} value={new Date().toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
              <Row label={isRtl ? 'رقم المرجع' : 'Reference'} value={paid?.payment?.gatewayTransactionId || '—'} />
            </div>
          </CardBody>
        </Card>

        <div className="flex gap-3">
          <button onClick={() => window.print()}
            className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">
            {isRtl ? 'طباعة الإيصال' : 'Print Receipt'}
          </button>
          <Link href={`/${locale}/parent/finance`}
            className="flex-1 bg-primary-900 text-white py-2.5 rounded-xl text-sm font-medium text-center hover:bg-primary-800">
            {isRtl ? 'العودة للفواتير' : 'Back to Invoices'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      {/* Back */}
      <Link href={`/${locale}/parent/finance`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft size={14} /> {isRtl ? 'الفواتير' : 'Back to Invoices'}
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'دفع الفاتورة' : 'Pay Invoice'}</h1>
        <p className="text-gray-500 text-sm">{isRtl ? 'اختر طريقة الدفع المناسبة' : 'Choose your preferred payment method'}</p>
      </div>

      {/* Invoice summary */}
      <Card>
        <CardBody>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">{invoice.description || (isRtl ? 'رسوم دراسية' : 'School Fees')}</p>
              <p className="text-xs text-gray-400 mt-0.5">#{invoice.invoiceNumber || invoice.id?.slice(0, 8).toUpperCase()}</p>
              {invoice.dueDate && (
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  <Clock size={11} />
                  {isRtl ? 'الاستحقاق:' : 'Due:'} {new Date(invoice.dueDate).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')}
                </p>
              )}
            </div>
            <div className="text-end">
              <p className="text-2xl font-bold text-gray-900">{amountDue.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{currency} {isRtl ? 'مستحق' : 'due'}</p>
              <Badge variant={STATUS_COLORS[invoice.status] || 'default'} className="text-xs mt-1">
                {invoice.status}
              </Badge>
            </div>
          </div>

          {/* Installments */}
          {invoice.paymentPlan?.installments?.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold text-gray-500 mb-2">{isRtl ? 'جدول الأقساط' : 'Payment Schedule'}</p>
              <div className="space-y-1.5">
                {invoice.paymentPlan.installments.map((inst: any, i: number) => (
                  <div key={inst.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{isRtl ? `قسط ${i + 1}` : `Installment ${i + 1}`} — {new Date(inst.dueDate).toLocaleDateString()}</span>
                    <span className={`font-semibold ${inst.status === 'PAID' ? 'text-green-600' : 'text-gray-800'}`}>
                      {inst.amount.toLocaleString()} {currency} {inst.status === 'PAID' ? '✓' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Previous payments */}
          {invoice.payments?.filter((p: any) => p.status === 'SUCCESS').length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold text-gray-500 mb-2">{isRtl ? 'المدفوعات السابقة' : 'Previous Payments'}</p>
              {invoice.payments.filter((p: any) => p.status === 'SUCCESS').map((p: any) => (
                <div key={p.id} className="flex justify-between text-xs text-gray-600 py-1">
                  <span>{new Date(p.paidAt || p.createdAt).toLocaleDateString()} — {p.gateway?.replace(/_/g, ' ')}</span>
                  <span className="font-semibold text-green-700">+{p.amount.toLocaleString()} {currency}</span>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Payment methods */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">{isRtl ? 'طريقة الدفع' : 'Payment Method'}</h2>
        {GATEWAY_OPTIONS.map((opt) => {
          const Icon = opt.icon
          const selected = selectedMethod === opt.value
          return (
            <button key={opt.value} onClick={() => setSelectedMethod(opt.value)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-start transition-all ${selected ? 'border-primary-700 bg-primary-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selected ? 'bg-primary-900' : 'bg-gray-100'}`}>
                <Icon size={18} className={selected ? 'text-white' : 'text-gray-500'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900">{isRtl ? opt.labelAr : opt.label}</p>
                <p className="text-xs text-gray-400">{opt.note}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? 'border-primary-700 bg-primary-700' : 'border-gray-300'}`}>
                {selected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          )
        })}
      </div>

      {/* Reference input (for bank transfer or cheque) */}
      {(selectedMethod === 'BANK_TRANSFER' || selectedMethod === 'CHEQUE') && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            {selectedMethod === 'CHEQUE'
              ? (isRtl ? 'رقم الشيك' : 'Cheque Number')
              : (isRtl ? 'رقم مرجع التحويل' : 'Transfer Reference Number')}
          </label>
          <input value={reference} onChange={(e) => setReference(e.target.value)}
            placeholder={selectedMethod === 'CHEQUE' ? 'CHQ-001234' : 'TXN-...'}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500" />
        </div>
      )}

      {/* Pay button */}
      <button onClick={handlePay} disabled={payMutation.isPending || !selectedMethod}
        className="w-full bg-primary-900 text-white py-3.5 rounded-2xl font-semibold text-sm hover:bg-primary-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
        <DollarSign size={16} />
        {payMutation.isPending
          ? (isRtl ? 'جارٍ المعالجة...' : 'Processing...')
          : `${isRtl ? 'ادفع' : 'Pay'} ${amountDue.toLocaleString()} ${currency}`}
      </button>

      <p className="text-center text-xs text-gray-400">
        {isRtl ? 'بالضغط على "ادفع" فأنت توافق على شروط الدفع المدرسية' : 'By clicking "Pay" you agree to the school payment terms'}
      </p>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={bold ? 'font-bold text-gray-900' : 'text-gray-700'}>{value}</span>
    </div>
  )
}
