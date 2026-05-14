'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { api } from '@/lib/api'
import {
  Search, Receipt, CreditCard, Banknote, Building2, FileText,
  CheckCircle, Printer, X, User, RefreshCw, TrendingUp,
  Clock, DollarSign, AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'

/* ─── Types ───────────────────────────────────────────────────────────────── */
interface StudentHit {
  id: string
  role: string
  profile: { firstName: string; lastName: string; firstNameAr?: string; lastNameAr?: string; avatar?: string; studentId?: string }
  school?: { name: string; nameAr?: string }
}

interface InvoiceItem { id: string; description: string; amount: number; paid: number }
interface Invoice {
  id: string; invoiceNumber: string; status: string; totalAmount: number
  amountPaid: number; balance: number; dueDate: string; items: InvoiceItem[]
}

interface TodaySummary { totalCollected: number; transactionCount: number; cashAmount: number; cardAmount: number; bankAmount: number; chequeAmount: number }

import { Smartphone } from 'lucide-react'

const PAYMENT_METHODS = [
  { value: 'CASH',         label: 'Cash',          labelAr: 'نقدي',         icon: Banknote,   chequeField: false },
  { value: 'CARD',         label: 'Card',          labelAr: 'بطاقة',        icon: CreditCard, chequeField: false },
  { value: 'BANK',         label: 'Bank Transfer', labelAr: 'تحويل بنكي',   icon: Building2,  chequeField: false },
  { value: 'CHEQUE',       label: 'Cheque',        labelAr: 'شيك',          icon: FileText,   chequeField: true  },
  { value: 'APPLE_PAY',    label: 'Apple Pay',     labelAr: 'Apple Pay',    icon: Smartphone, chequeField: false },
  { value: 'GOOGLE_PAY',   label: 'Google Pay',    labelAr: 'Google Pay',   icon: Smartphone, chequeField: false },
  { value: 'POS_TERMINAL', label: 'POS Terminal',  labelAr: 'جهاز POS',     icon: CreditCard, chequeField: false },
]

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  OVERDUE: 'bg-red-100 text-red-700',
  PARTIAL: 'bg-blue-100 text-blue-700',
  PAID:    'bg-green-100 text-green-700',
}

export default function CashierPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const qc = useQueryClient()

  /* search state */
  const [query, setQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentHit | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  /* payment modal state */
  const [showPayModal, setShowPayModal] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('CASH')
  const [payNote, setPayNote] = useState('')
  const [chequeNumber, setChequeNumber] = useState('')
  const [payCurrency, setPayCurrency] = useState('SAR')
  const [lastReceipt, setLastReceipt] = useState<any>(null)
  const [showReceipt, setShowReceipt] = useState(false)

  /* ── Queries ────────────────────────────────────────────────────────────── */
  const { data: searchResults = [], isFetching: searching } = useQuery<StudentHit[]>({
    queryKey: ['cashier-search', query],
    queryFn: () => api.get(`/users/search?q=${encodeURIComponent(query)}&role=STUDENT&limit=8`).then(r => r.data.data),
    enabled: query.trim().length >= 2,
    staleTime: 15_000,
  })

  const { data: invoices = [], isFetching: loadingInvoices } = useQuery<Invoice[]>({
    queryKey: ['cashier-invoices', selectedStudent?.profile.studentId ?? selectedStudent?.id],
    queryFn: () => api.get(`/finance/invoices?studentId=${selectedStudent!.profile.studentId ?? selectedStudent!.id}&status=PENDING,OVERDUE,PARTIAL&include=items`).then(r => r.data.data),
    enabled: !!selectedStudent,
    staleTime: 10_000,
  })

  const { data: summary } = useQuery<TodaySummary>({
    queryKey: ['cashier-today-summary'],
    queryFn: () => api.get('/finance/cashier/today-summary').then(r => r.data.data),
    refetchInterval: 30_000,
    staleTime: 20_000,
  })

  /* ── Mutations ──────────────────────────────────────────────────────────── */
  const recordPayment = useMutation({
    mutationFn: (payload: any) => api.post(`/finance/invoices/${selectedInvoice!.id}/payments`, payload),
    onSuccess: (res) => {
      const data = res.data.data
      setLastReceipt({ ...data.payment, method: payMethod, amount: data.payment?.amount ?? parseFloat(payAmount), note: payNote, currency: payCurrency, chequeNumber })
      setShowPayModal(false)
      setShowReceipt(true)
      setPayAmount('')
      setPayNote('')
      setChequeNumber('')
      qc.invalidateQueries({ queryKey: ['cashier-invoices', selectedStudent?.profile.studentId ?? selectedStudent?.id] })
      qc.invalidateQueries({ queryKey: ['cashier-today-summary'] })
      toast.success(isRtl ? 'تم تسجيل الدفعة بنجاح' : 'Payment recorded successfully')
    },
    onError: (e: any) => toast.error(e.response?.data?.message || (isRtl ? 'فشل تسجيل الدفعة' : 'Payment failed')),
  })

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(payAmount)
    if (!amount || amount <= 0) return
    recordPayment.mutate({ amount, method: payMethod, currency: payCurrency, note: payNote, chequeNumber: chequeNumber || undefined })
  }

  const handlePrintReceipt = useCallback(() => {
    window.print()
  }, [])

  const openPayModal = (inv: Invoice) => {
    setSelectedInvoice(inv)
    setPayAmount(inv.balance.toFixed(2))
    setShowPayModal(true)
  }

  const clearStudent = () => {
    setSelectedStudent(null)
    setSelectedInvoice(null)
    setQuery('')
  }

  const totalOutstanding = invoices.reduce((s, i) => s + i.balance, 0)

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Receipt size={22} className="text-primary-600" />
              {isRtl ? 'نقطة التحصيل — أمين الصندوق' : 'Cashier — Collection Point'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date().toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Today Summary */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-500">{isRtl ? 'تحصيلات اليوم' : "Today's Collections"}</p>
              <p className="text-lg font-bold text-green-600">
                {summary ? `${summary.totalCollected.toLocaleString()} SAR` : '—'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">{isRtl ? 'عدد المعاملات' : 'Transactions'}</p>
              <p className="text-lg font-bold text-gray-800">{summary?.transactionCount ?? '—'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Student Search ── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Search Box */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <User size={15} />
              {isRtl ? 'البحث عن طالب' : 'Search Student'}
            </h2>
            <div className="relative">
              <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={isRtl ? 'اسم الطالب أو الرقم المدرسي...' : 'Student name or ID...'}
                className="w-full ps-9 pe-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 transition"
              />
              {searching && <RefreshCw size={14} className="absolute top-1/2 -translate-y-1/2 end-3 text-gray-400 animate-spin" />}
            </div>

            {/* Search Results Dropdown */}
            {query.length >= 2 && !selectedStudent && (
              <div className="mt-2 border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                {searchResults.length === 0 && !searching ? (
                  <div className="p-3 text-center text-sm text-gray-400">
                    {isRtl ? 'لا توجد نتائج' : 'No results found'}
                  </div>
                ) : (
                  searchResults.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedStudent(s); setQuery('') }}
                      className="w-full text-start px-3 py-2.5 hover:bg-primary-50 border-b border-gray-50 last:border-0 transition-colors"
                    >
                      <div className="font-medium text-sm text-gray-800">
                        {isRtl && s.profile.firstNameAr
                          ? `${s.profile.firstNameAr} ${s.profile.lastNameAr ?? ''}`
                          : `${s.profile.firstName} ${s.profile.lastName}`}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                        <span>{s.profile.studentId ?? s.id.slice(-6)}</span>
                        {s.school && <span>· {isRtl && s.school.nameAr ? s.school.nameAr : s.school.name}</span>}
                        {(s as any).grade && <span>· {(s as any).grade}</span>}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected Student Card */}
          {selectedStudent && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                    {selectedStudent.profile.firstName.charAt(0)}{selectedStudent.profile.lastName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {isRtl && selectedStudent.profile.firstNameAr
                        ? `${selectedStudent.profile.firstNameAr} ${selectedStudent.profile.lastNameAr ?? ''}`
                        : `${selectedStudent.profile.firstName} ${selectedStudent.profile.lastName}`}
                    </p>
                    <p className="text-xs text-gray-400">{selectedStudent.profile.studentId ?? selectedStudent.id.slice(-8).toUpperCase()}</p>
                    {selectedStudent.school && (
                      <p className="text-xs text-gray-400">
                        {isRtl && selectedStudent.school.nameAr ? selectedStudent.school.nameAr : selectedStudent.school.name}
                        {(selectedStudent as any).grade && ` · ${(selectedStudent as any).grade}`}
                      </p>
                    )}
                  </div>
                </div>
                <button onClick={clearStudent} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                  <X size={15} />
                </button>
              </div>

              {/* Outstanding Summary */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{isRtl ? 'إجمالي المستحق' : 'Total Outstanding'}</span>
                  <span className={`font-bold text-sm ${totalOutstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {totalOutstanding.toLocaleString()} SAR
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">{isRtl ? 'عدد الفواتير' : 'Unpaid Invoices'}</span>
                  <span className="text-xs font-medium text-gray-700">{loadingInvoices ? '...' : invoices.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* Today's Breakdown */}
          {summary && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <TrendingUp size={14} className="text-green-500" />
                {isRtl ? 'ملخص اليوم' : "Today's Breakdown"}
              </h3>
              <div className="space-y-2">
                {PAYMENT_METHODS.map(m => {
                  const val = (summary as any)[`${m.value.toLowerCase()}Amount`] ?? 0
                  return (
                    <div key={m.value} className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <m.icon size={13} />
                        {isRtl ? m.labelAr : m.label}
                      </span>
                      <span className="font-medium text-gray-800">{val.toLocaleString()} SAR</span>
                    </div>
                  )
                })}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between font-bold text-sm">
                  <span className="text-gray-700">{isRtl ? 'الإجمالي' : 'Total'}</span>
                  <span className="text-green-600">{summary.totalCollected.toLocaleString()} SAR</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Invoices ── */}
        <div className="lg:col-span-2">
          {!selectedStudent ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 h-80 flex flex-col items-center justify-center text-gray-400 gap-3">
              <Search size={40} className="text-gray-200" />
              <p className="text-sm">{isRtl ? 'ابحث عن طالب لعرض فواتيره' : 'Search for a student to view their invoices'}</p>
            </div>
          ) : loadingInvoices ? (
            <div className="bg-white rounded-2xl border border-gray-200 h-80 flex items-center justify-center">
              <RefreshCw size={24} className="animate-spin text-primary-400" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 h-80 flex flex-col items-center justify-center gap-3">
              <CheckCircle size={40} className="text-green-300" />
              <p className="text-sm text-gray-500">{isRtl ? 'لا توجد فواتير مستحقة' : 'No outstanding invoices'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map(inv => (
                <div key={inv.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Invoice Header */}
                  <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                        <FileText size={16} className="text-primary-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{inv.invoiceNumber}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock size={11} />
                          {isRtl ? 'تاريخ الاستحقاق:' : 'Due:'} {new Date(inv.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[inv.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {inv.status.replace('_', ' ')}
                      </span>
                      {inv.status === 'OVERDUE' && (
                        <AlertCircle size={16} className="text-red-500" />
                      )}
                    </div>
                  </div>

                  {/* Invoice Items */}
                  <div className="px-5 py-3 space-y-1.5">
                    {inv.items?.slice(0, 4).map(item => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{item.description}</span>
                        <span className="font-medium text-gray-800">{item.amount.toLocaleString()} SAR</span>
                      </div>
                    ))}
                    {inv.items?.length > 4 && (
                      <p className="text-xs text-gray-400">+ {inv.items.length - 4} {isRtl ? 'بنود أخرى' : 'more items'}</p>
                    )}
                  </div>

                  {/* Invoice Footer */}
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-gray-500 text-xs">{isRtl ? 'الإجمالي' : 'Total'}</span>
                        <p className="font-semibold text-gray-800">{inv.totalAmount.toLocaleString()} SAR</p>
                      </div>
                      {inv.amountPaid > 0 && (
                        <div>
                          <span className="text-gray-500 text-xs">{isRtl ? 'المدفوع' : 'Paid'}</span>
                          <p className="font-semibold text-green-600">{inv.amountPaid.toLocaleString()} SAR</p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500 text-xs">{isRtl ? 'الرصيد المستحق' : 'Balance Due'}</span>
                        <p className="font-bold text-red-600 text-base">{inv.balance.toLocaleString()} SAR</p>
                      </div>
                    </div>
                    <button
                      onClick={() => openPayModal(inv)}
                      className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-sm"
                    >
                      <DollarSign size={15} />
                      {isRtl ? 'تسجيل دفعة' : 'Record Payment'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Payment Modal ── */}
      {showPayModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">
                {isRtl ? 'تسجيل دفعة' : 'Record Payment'}
              </h3>
              <button onClick={() => setShowPayModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="p-6 space-y-5">
              {/* Invoice Info */}
              <div className="bg-gray-50 rounded-xl p-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>{isRtl ? 'الفاتورة' : 'Invoice'}</span>
                  <span className="font-medium">{selectedInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-gray-600 mt-1">
                  <span>{isRtl ? 'الرصيد المستحق' : 'Balance Due'}</span>
                  <span className="font-bold text-red-600">{selectedInvoice.balance.toLocaleString()} SAR</span>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  {isRtl ? 'المبلغ المدفوع (SAR)' : 'Amount to Pay (SAR)'} *
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedInvoice.balance}
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 font-mono text-lg font-bold"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  {isRtl ? 'طريقة الدفع' : 'Payment Method'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPayMethod(m.value)}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                        payMethod === m.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <m.icon size={16} />
                      {isRtl ? m.labelAr : m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cheque number — shown only for CHEQUE method */}
              {payMethod === 'CHEQUE' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    {isRtl ? 'رقم الشيك *' : 'Cheque Number *'}
                  </label>
                  <input type="text" value={chequeNumber} onChange={e => setChequeNumber(e.target.value)}
                    placeholder="CHQ-001234"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400" />
                </div>
              )}

              {/* Currency */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{isRtl ? 'العملة' : 'Currency'}</label>
                <select value={payCurrency} onChange={e => setPayCurrency(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400">
                  {['SAR','USD','EGP','AED','GBP','EUR','KWD'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  {isRtl ? 'ملاحظة (اختياري)' : 'Note (optional)'}
                </label>
                <input
                  type="text"
                  value={payNote}
                  onChange={e => setPayNote(e.target.value)}
                  placeholder={isRtl ? 'رقم العملية...' : 'Reference number...'}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition text-sm"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={recordPayment.isPending}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {recordPayment.isPending ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle size={14} />
                  )}
                  {isRtl ? 'تأكيد الدفعة' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Receipt Modal ── */}
      {showReceipt && lastReceipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="p-6 text-center border-b border-dashed border-gray-200">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">{isRtl ? 'تم الدفع بنجاح' : 'Payment Successful'}</h3>
              <p className="text-xs text-gray-400 mt-1">#{lastReceipt.id?.slice(-8).toUpperCase()}</p>
            </div>

            <div className="p-6 space-y-3 text-sm">
              {/* QR Code */}
              <div className="flex justify-center mb-1">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`PAYMENT:${lastReceipt.id || 'ref'}&AMOUNT:${lastReceipt.amount}&DATE:${new Date().toISOString()}`)}&color=1a1a2e&bgcolor=ffffff`}
                  alt="QR Receipt"
                  width={120} height={120}
                  className="rounded-xl border border-gray-100"
                />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{isRtl ? 'الطالب' : 'Student'}</span>
                <span className="font-medium text-gray-800">
                  {selectedStudent
                    ? (isRtl && selectedStudent.profile.firstNameAr
                        ? `${selectedStudent.profile.firstNameAr} ${selectedStudent.profile.lastNameAr ?? ''}`
                        : `${selectedStudent.profile.firstName} ${selectedStudent.profile.lastName}`)
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{isRtl ? 'المبلغ' : 'Amount'}</span>
                <span className="font-bold text-green-600 text-base">{lastReceipt.amount?.toLocaleString()} {lastReceipt.currency || 'SAR'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{isRtl ? 'طريقة الدفع' : 'Method'}</span>
                <span className="font-medium">{PAYMENT_METHODS.find(m => m.value === lastReceipt.method)?.label || lastReceipt.method}</span>
              </div>
              {lastReceipt.chequeNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{isRtl ? 'رقم الشيك' : 'Cheque #'}</span>
                  <span className="text-gray-700">{lastReceipt.chequeNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">{isRtl ? 'التاريخ' : 'Date'}</span>
                <span className="text-gray-700">{new Date().toLocaleString(isRtl ? 'ar-SA' : 'en-US')}</span>
              </div>
              {lastReceipt.note && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{isRtl ? 'ملاحظة' : 'Note'}</span>
                  <span className="text-gray-700">{lastReceipt.note}</span>
                </div>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={handlePrintReceipt}
                className="flex-1 border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition text-sm flex items-center justify-center gap-2"
              >
                <Printer size={14} />
                {isRtl ? 'طباعة' : 'Print'}
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 bg-primary-600 text-white font-medium py-2.5 rounded-xl hover:bg-primary-700 transition text-sm"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
