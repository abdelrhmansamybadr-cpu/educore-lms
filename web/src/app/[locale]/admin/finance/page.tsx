'use client'

import { useState, useEffect, Suspense } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { api, setFinanceSchoolScope } from '@/lib/api'
import { useSchoolContext } from '@/stores/schoolContextStore'
import { apiClient, getApiError } from '@/lib/api-client'
import { useLocale } from 'next-intl'
import { Card, CardHeader, CardBody, Badge, Skeleton } from '@/components/ui'
import { DollarSign, Plus, Clock, CheckCircle, AlertCircle, Package, Truck, XCircle, ArrowUpRight, Eye, BookOpen, Banknote, BarChart2, TrendingUp, Briefcase, ChevronDown, ChevronUp, X, Calendar, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_COLORS: Record<string, string> = {
  PAID: 'success',
  UNPAID: 'warning',
  OVERDUE: 'danger',
  CANCELLED: 'default',
  PARTIAL: 'primary',
}

type FinanceTab = 'invoices' | 'fees' | 'procurement' | 'accounts' | 'journal' | 'payroll' | 'loans' | 'expenses' | 'bank' | 'budget' | 'reports' | 'payments' | 'fiscal-years' | 'cost-centers'
const VALID_TABS: FinanceTab[] = ['invoices', 'fees', 'procurement', 'accounts', 'journal', 'payroll', 'loans', 'expenses', 'bank', 'budget', 'reports', 'payments', 'fiscal-years', 'cost-centers']

// ── Quick Reports Component ───────────────────────────────────────────────────
function QuickReports({ isRtl }: { isRtl: boolean }) {
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const REPORTS = [
    { label: isRtl ? 'ميزان المراجعة' : 'Trial Balance', key: 'trial-balance' },
    { label: isRtl ? 'قائمة الدخل' : 'Income Statement', key: 'income-statement' },
    { label: isRtl ? 'تقرير التقادم' : 'Aging Report', key: 'aging' },
    { label: isRtl ? 'الميزانية العمومية' : 'Balance Sheet', key: 'balance-sheet' },
    { label: isRtl ? 'التدفق النقدي' : 'Cash Flow', key: 'cash-flow' },
    { label: isRtl ? 'التوقعات المالية' : 'Financial Forecast', key: 'forecast' },
    { label: isRtl ? 'تحليل الأقسام' : 'Department-wise', key: 'department-wise' },
  ]

  const REPORT_ENDPOINTS: Record<string, string> = {
    'trial-balance': `/finance/reports/trial-balance?year=${new Date().getFullYear()}`,
    'income-statement': `/finance/reports/income-statement?year=${new Date().getFullYear()}`,
    'aging': `/finance/reports/aging?year=${new Date().getFullYear()}`,
    'balance-sheet': `/finance/reports/balance-sheet?asOfDate=${new Date().toISOString().slice(0, 10)}`,
    'cash-flow': `/finance/reports/cash-flow?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`,
    'forecast': `/finance/reports/forecast?months=6`,
    'department-wise': `/finance/reports/department-wise?year=${new Date().getFullYear()}`,
  }

  const runReport = async (key: string) => {
    if (activeKey === key) { setActiveKey(null); setReportData(null); return }
    setLoading(true)
    setActiveKey(key)
    setReportData(null)
    try {
      const endpoint = REPORT_ENDPOINTS[key] ?? `/finance/reports/${key}?year=${new Date().getFullYear()}`
      const res = await api.get(endpoint)
      setReportData(res.data?.data ?? res.data)
    } catch {
      toast.error(isRtl ? 'فشل تحميل التقرير' : 'Failed to load report')
      setActiveKey(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {REPORTS.map((r) => (
          <button key={r.key} onClick={() => runReport(r.key)}
            className={`p-4 border rounded-2xl shadow-sm text-left transition-all ${activeKey === r.key ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100 hover:shadow'}`}>
            <BarChart2 size={20} className={activeKey === r.key ? 'text-indigo-600 mb-2' : 'text-indigo-400 mb-2'} />
            <p className="text-sm font-semibold text-gray-800">{r.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{isRtl ? 'انقر للتشغيل' : 'Click to run'}</p>
          </button>
        ))}
      </div>

      {/* Inline report results */}
      {activeKey && (
        <Card>
          <CardHeader>
            <h3 className="font-bold text-gray-900">{REPORTS.find(r => r.key === activeKey)?.label}</h3>
          </CardHeader>
          <CardBody>
            {loading
              ? <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
              : !reportData
                ? null
                : activeKey === 'balance-sheet'
                  ? (
                    <div className="space-y-6">
                      {[
                        { label: isRtl ? 'الأصول' : 'Assets', items: reportData.assets, total: reportData.totalAssets, color: 'text-blue-700' },
                        { label: isRtl ? 'الالتزامات' : 'Liabilities', items: reportData.liabilities, total: reportData.totalLiabilities, color: 'text-red-600' },
                        { label: isRtl ? 'حقوق الملكية' : 'Equity', items: reportData.equity, total: reportData.totalEquity, color: 'text-purple-700' },
                      ].map(section => (
                        <div key={section.label}>
                          <h4 className="font-bold text-gray-700 mb-2 border-b pb-1">{section.label}</h4>
                          <div className="space-y-1">
                            {(section.items ?? []).map((item: any, i: number) => (
                              <div key={i} className="flex justify-between text-sm py-1">
                                <span className="text-gray-600">{item.code} — {item.name}</span>
                                <span className="font-medium">{Number(item.balance ?? 0).toLocaleString()}</span>
                              </div>
                            ))}
                            <div className="flex justify-between text-sm font-bold border-t pt-1 mt-1">
                              <span>{isRtl ? 'الإجمالي' : 'Total'}</span>
                              <span className={section.color}>{Number(section.total ?? 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <p className={`text-xs font-semibold mt-2 ${reportData.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                        {reportData.isBalanced ? (isRtl ? 'الميزانية متوازنة ✓' : 'Balance sheet is balanced ✓') : (isRtl ? 'تحذير: الميزانية غير متوازنة' : 'Warning: Balance sheet does not balance')}
                      </p>
                    </div>
                  )
                  : activeKey === 'cash-flow'
                    ? (
                      <div className="space-y-4">
                        {[
                          { label: isRtl ? 'الأنشطة التشغيلية' : 'Operating Activities', items: reportData.operatingActivities, net: reportData.netOperating },
                          { label: isRtl ? 'أنشطة التمويل' : 'Financing Activities', items: reportData.financingActivities, net: reportData.netFinancing },
                        ].map(section => (
                          <div key={section.label}>
                            <h4 className="font-semibold text-gray-700 mb-1">{section.label}</h4>
                            {(section.items ?? []).map((item: any, i: number) => (
                              <div key={i} className="flex justify-between text-sm py-0.5">
                                <span className="text-gray-500">{item.description || item.label}</span>
                                <span className={`font-medium ${Number(item.amount) >= 0 ? 'text-green-700' : 'text-red-600'}`}>{Number(item.amount ?? 0).toLocaleString()}</span>
                              </div>
                            ))}
                            <div className="flex justify-between text-sm font-bold border-t mt-1 pt-1">
                              <span>{isRtl ? 'صافي' : 'Net'}</span>
                              <span className={Number(section.net) >= 0 ? 'text-green-700' : 'text-red-600'}>{Number(section.net ?? 0).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm font-bold border-t-2 pt-2">
                          <span>{isRtl ? 'صافي التغيير النقدي' : 'Net Cash Change'}</span>
                          <span className={Number(reportData.netCashChange) >= 0 ? 'text-green-700 font-bold' : 'text-red-600 font-bold'}>{Number(reportData.netCashChange ?? 0).toLocaleString()}</span>
                        </div>
                      </div>
                    )
                    : activeKey === 'forecast'
                      ? (
                        <div className="overflow-x-auto">
                          <div className="flex justify-between text-sm text-gray-600 mb-3">
                            <span>{isRtl ? 'متوسط الإيراد الشهري' : 'Avg Monthly Revenue'}</span>
                            <span className="font-bold">{Number(reportData.avgMonthlyRevenue ?? 0).toLocaleString()}</span>
                          </div>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-gray-50">
                                <th className="px-3 py-2 text-start font-semibold text-gray-600">{isRtl ? 'الشهر' : 'Month'}</th>
                                <th className="px-3 py-2 text-end font-semibold text-gray-600">{isRtl ? 'الإيراد المتوقع' : 'Projected Revenue'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {(reportData.forecast ?? []).map((row: any, i: number) => (
                                <tr key={i} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 text-gray-700">{row.label || `${row.month}/${row.year}`}</td>
                                  <td className="px-3 py-2 text-end font-medium text-gray-900">{Number(row.projectedRevenue ?? 0).toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                      : activeKey === 'department-wise'
                        ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b bg-gray-50">
                                  <th className="px-3 py-2 text-start font-semibold text-gray-600">{isRtl ? 'مركز التكلفة' : 'Cost Center'}</th>
                                  <th className="px-3 py-2 text-start font-semibold text-gray-600">{isRtl ? 'الاسم' : 'Name'}</th>
                                  <th className="px-3 py-2 text-end font-semibold text-gray-600">{isRtl ? 'إجمالي المصروفات' : 'Total Expenses'}</th>
                                  <th className="px-3 py-2 text-end font-semibold text-gray-600">{isRtl ? 'العدد' : 'Count'}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {(Array.isArray(reportData) ? reportData : []).map((row: any, i: number) => (
                                  <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 font-mono text-xs text-gray-500">{row.costCenter}</td>
                                    <td className="px-3 py-2 text-gray-800">{isRtl ? (row.nameAr || row.name) : row.name}</td>
                                    <td className="px-3 py-2 text-end font-semibold text-gray-900">{Number(row.totalExpenses ?? 0).toLocaleString()}</td>
                                    <td className="px-3 py-2 text-end text-gray-600">{row.claimCount ?? 0}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                        : Array.isArray(reportData)
                          ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-gray-100 bg-gray-50">
                                    {Object.keys(reportData[0] || {}).map((k) => (
                                      <th key={k} className="px-3 py-2 text-left font-semibold text-gray-600 capitalize">{k.replace(/([A-Z])/g, ' $1')}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                  {reportData.map((row: any, i: number) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                      {Object.values(row).map((v: any, j) => (
                                        <td key={j} className="px-3 py-2 text-gray-700">
                                          {typeof v === 'number' ? Number(v).toLocaleString() : String(v ?? '—')}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )
                          : (
                            <div className="space-y-2">
                              {Object.entries(reportData).map(([k, v]: any) => (
                                <div key={k} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                                  <span className="text-gray-600 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                                  <span className="font-semibold text-gray-900">
                                    {typeof v === 'number' ? Number(v).toLocaleString() : typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )
            }
          </CardBody>
        </Card>
      )}
    </div>
  )
}

// ── Shared UI helpers — defined OUTSIDE any component to prevent focus loss ───

function Modal({ title, onClose, children, onSubmit, loading }: {
  title: string; onClose: () => void; children: React.ReactNode; onSubmit: () => void; loading?: boolean
}) {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
        <div className="p-5 border-t border-gray-100 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
            {isRtl ? 'إلغاء' : 'Cancel'}
          </button>
          <button onClick={onSubmit} disabled={loading}
            className="px-4 py-2 bg-primary-900 text-white rounded-xl text-sm font-medium hover:bg-primary-800 disabled:opacity-50">
            {loading ? (isRtl ? 'جارٍ الحفظ...' : 'Saving...') : (isRtl ? 'حفظ' : 'Save')}
          </button>
        </div>
      </div>
    </div>
  )
}

function InputField({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
    </div>
  )
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function SchoolRequired({ isRtl, label }: { isRtl: boolean; label: string }) {
  return (
    <Card>
      <CardBody>
        <div className="text-center py-14">
          <div className="text-4xl mb-3">🏫</div>
          <p className="font-semibold text-gray-700">{isRtl ? 'اختر مدرسة أولاً' : 'Select a School First'}</p>
          <p className="text-sm text-gray-400 mt-1">{isRtl ? `اختر مدرسة من الأعلى لعرض ${label}` : `Choose a school above to manage ${label}`}</p>
        </div>
      </CardBody>
    </Card>
  )
}

function AdminFinancePageInner() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const searchParams = useSearchParams()
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  // Sync tab with ?tab= query param from sidebar links
  const urlTab = searchParams.get('tab') as FinanceTab | null
  const [tab, setTab] = useState<FinanceTab>(
    urlTab && VALID_TABS.includes(urlTab) ? urlTab : 'invoices'
  )

  useEffect(() => {
    if (urlTab && VALID_TABS.includes(urlTab) && urlTab !== tab) {
      setTab(urlTab)
    }
  }, [urlTab])
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const qc = useQueryClient()

  // ── School Scope — synced with global SchoolSwitcher ─────────────────────
  const { selectedSchoolId, setSelectedSchool: setSelectedSchoolId, schools: mySchools } = useSchoolContext()

  // Auto-select when user belongs to exactly one school
  useEffect(() => {
    if (mySchools.length === 1 && selectedSchoolId === null) setSelectedSchoolId(mySchools[0].id)
  }, [mySchools.length])

  // Sync the Finance school scope into the Axios interceptor
  useEffect(() => {
    setFinanceSchoolScope(selectedSchoolId)
    return () => setFinanceSchoolScope(null)
  }, [selectedSchoolId])

  const { data: invoiceData, isLoading } = useQuery({
    queryKey: ['admin-invoices', selectedSchoolId, statusFilter, page],
    queryFn: () => api.get('/finance/invoices', { params: { status: statusFilter || undefined, page, limit: 20 } })
      .then((r) => ({ data: r.data?.data || [], total: r.data?.meta?.total || r.data?.data?.length || 0 })),
    enabled: !!selectedSchoolId,
  })

  const { data: stats } = useQuery({
    queryKey: ['finance-stats', selectedSchoolId],
    queryFn: () => api.get('/finance/stats').then((r) => r.data?.data),
    enabled: !!selectedSchoolId,
  })

  const { data: feeStructures } = useQuery({
    queryKey: ['fee-structures', selectedSchoolId],
    queryFn: () => api.get('/finance/fee-structures').then((r) => r.data?.data || []),
    enabled: tab === 'fees' && !!selectedSchoolId,
  })

  const { data: academicYears = [] } = useQuery<any[]>({
    queryKey: ['academic-years', selectedSchoolId],
    queryFn: () => api.get('/finance/academic-years').then((r) => r.data?.data || []),
    enabled: tab === 'fees' && !!selectedSchoolId,
  })

  const { data: procurementReqs = [], isLoading: procLoading } = useQuery<any[]>({
    queryKey: ['finance-requisitions'],
    queryFn: async () => {
      const res = await apiClient.get('/requisitions?limit=200')
      const p = res.data
      return Array.isArray(p) ? p : p?.data ?? []
    },
    enabled: tab === 'procurement',
  })

  // ── New Module Queries ────────────────────────────────────────────────────────

  const { data: journalEntries = [], isLoading: jeLoading } = useQuery<any[]>({
    queryKey: ['journal-entries'],
    queryFn: () => api.get('/finance/journal-entries').then((r) => r.data?.data?.data || r.data?.data || []),
    enabled: tab === 'journal',
  })

  const { data: accounts = [] } = useQuery<any[]>({
    queryKey: ['chart-of-accounts'],
    queryFn: () => api.get('/finance/accounts').then((r) => r.data?.data || []),
    enabled: tab === 'accounts' || tab === 'journal',
  })

  const { data: payrollRuns = [], isLoading: payrollLoading } = useQuery<any[]>({
    queryKey: ['payroll-runs'],
    queryFn: () => api.get('/finance/payroll-runs').then((r) => r.data?.data || []),
    enabled: tab === 'payroll',
  })

  const { data: loans = [] } = useQuery<any[]>({
    queryKey: ['staff-loans'],
    queryFn: () => api.get('/finance/loans').then((r) => r.data?.data || []),
    enabled: tab === 'loans',
  })

  const { data: expenses = [], isLoading: expLoading } = useQuery<any[]>({
    queryKey: ['expenses', tab],
    queryFn: () => api.get('/finance/expenses').then((r) => r.data?.data || []),
    enabled: tab === 'expenses',
  })

  const { data: budgets = [], isLoading: budgetLoading } = useQuery<any[]>({
    queryKey: ['budgets'],
    queryFn: () => api.get('/finance/budgets').then((r) => r.data?.data || []),
    enabled: tab === 'budget',
  })

  const { data: outstandingReport } = useQuery<any>({
    queryKey: ['outstanding-report', selectedSchoolId],
    queryFn: () => api.get('/finance/reports/outstanding').then((r) => r.data?.data),
    enabled: tab === 'reports' && !!selectedSchoolId,
  })

  const { data: collectionReport } = useQuery<any>({
    queryKey: ['collection-report', selectedSchoolId],
    queryFn: () => api.get(`/finance/reports/collection?year=${new Date().getFullYear()}`).then((r) => r.data?.data),
    enabled: tab === 'reports' && !!selectedSchoolId,
  })

  // ── Fiscal Years ──────────────────────────────────────────────────────────────
  const { data: fiscalYears, isLoading: fyLoading } = useQuery({
    queryKey: ['fiscal-years'],
    queryFn: () => api.get('/finance/fiscal-years').then(r => r.data?.data ?? r.data ?? []),
    enabled: tab === 'fiscal-years',
  })

  // ── Cost Centers ──────────────────────────────────────────────────────────────
  const { data: costCenters, isLoading: ccLoading } = useQuery({
    queryKey: ['cost-centers'],
    queryFn: () => api.get('/finance/cost-centers').then(r => r.data?.data ?? r.data ?? []),
    enabled: tab === 'cost-centers',
  })

  // ── General Ledger (triggered by glAccountId) ─────────────────────────────────
  const [glAccountId, setGlAccountId] = useState<string | null>(null)

  const { data: generalLedger, isLoading: glLoading } = useQuery({
    queryKey: ['general-ledger', glAccountId],
    queryFn: () => api.get(`/finance/reports/general-ledger/${glAccountId}`).then(r => r.data?.data ?? r.data),
    enabled: !!glAccountId && tab === 'accounts',
  })

  // ── Payment History ───────────────────────────────────────────────────────────
  const [payHistoryFilter, setPayHistoryFilter] = useState({ gateway: '', status: '', from: '', to: '' })
  const [payPage, setPayPage] = useState(1)

  const { data: paymentHistory, isLoading: payHistoryLoading, refetch: refetchPayHistory } = useQuery<any>({
    queryKey: ['payment-history', selectedSchoolId, payHistoryFilter, payPage],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(payPage), limit: '25' })
      if (payHistoryFilter.gateway) params.set('gateway', payHistoryFilter.gateway)
      if (payHistoryFilter.status) params.set('status', payHistoryFilter.status)
      if (payHistoryFilter.from) params.set('from', payHistoryFilter.from)
      if (payHistoryFilter.to) params.set('to', payHistoryFilter.to)
      return api.get(`/finance/payments/history?${params}`).then(r => r.data)
    },
    enabled: tab === 'payments',
  })

  const { data: advancePayments = [] } = useQuery<any[]>({
    queryKey: ['advance-payments', selectedSchoolId],
    queryFn: () => api.get('/finance/advance-payments').then(r => r.data?.data || []),
    enabled: tab === 'payments',
  })

  const reversePaymentMutation = useMutation({
    mutationFn: (id: string) => api.post(`/finance/payments/${id}/reverse`),
    onSuccess: () => { toast.success(isRtl ? 'تم عكس الدفعة' : 'Payment reversed'); refetchPayHistory() },
    onError: (e: any) => toast.error(getApiError(e)),
  })

  // ── Fiscal Year & Cost Center Mutations ───────────────────────────────────────
  const createFiscalYearMutation = useMutation({
    mutationFn: (body: any) => api.post('/finance/fiscal-years', body).then(r => r.data?.data ?? r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fiscal-years'] }); toast.success(isRtl ? 'تم إنشاء السنة المالية' : 'Fiscal year created') },
    onError: (e: any) => toast.error(getApiError(e, isRtl ? 'فشل الإنشاء' : 'Failed to create')),
  })

  const closeFiscalYearMutation = useMutation({
    mutationFn: (id: string) => api.post(`/finance/fiscal-years/${id}/close`).then(r => r.data?.data ?? r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fiscal-years'] }); toast.success(isRtl ? 'تم إغلاق السنة المالية' : 'Fiscal year closed') },
    onError: (e: any) => toast.error(getApiError(e, isRtl ? 'فشل الإغلاق' : 'Failed to close')),
  })

  const createCostCenterMutation = useMutation({
    mutationFn: (body: any) => api.post('/finance/cost-centers', body).then(r => r.data?.data ?? r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cost-centers'] }); toast.success(isRtl ? 'تم إنشاء مركز التكلفة' : 'Cost center created') },
    onError: (e: any) => toast.error(getApiError(e, isRtl ? 'فشل الإنشاء' : 'Failed to create')),
  })

  // ── Fiscal Year & Cost Center State ──────────────────────────────────────────
  const [showFiscalYearModal, setShowFiscalYearModal] = useState(false)
  const [fyForm, setFyForm] = useState({ name: '', startDate: '', endDate: '' })
  const [showCostCenterModal, setShowCostCenterModal] = useState(false)
  const [ccForm, setCcForm] = useState({ code: '', name: '', nameAr: '', description: '' })
  const [selectedFyId, setSelectedFyId] = useState<string>('')

  const [showAdvanceModal, setShowAdvanceModal] = useState(false)
  const [advForm, setAdvForm] = useState({ studentId: '', amount: '', currency: 'SAR', gateway: 'CASH', notes: '' })
  const [advStudentSearch, setAdvStudentSearch] = useState('')
  const [advStudentResults, setAdvStudentResults] = useState<any[]>([])

  const searchAdvStudents = async (q: string) => {
    if (!q || q.length < 2) { setAdvStudentResults([]); return }
    try {
      const r = await api.get(`/users/search?q=${encodeURIComponent(q)}&role=STUDENT`)
      setAdvStudentResults(r.data?.data || r.data || [])
    } catch { setAdvStudentResults([]) }
  }

  const createAdvanceMutation = useMutation({
    mutationFn: (dto: any) => api.post('/finance/advance-payments', dto),
    onSuccess: () => {
      toast.success(isRtl ? 'تم تسجيل الدفعة المقدمة' : 'Advance payment recorded')
      setShowAdvanceModal(false)
      setAdvForm({ studentId: '', amount: '', currency: 'SAR', gateway: 'CASH', notes: '' })
      setAdvStudentSearch('')
      qc.invalidateQueries({ queryKey: ['advance-payments'] })
    },
    onError: (e: any) => toast.error(getApiError(e)),
  })

  // ── New Mutations ─────────────────────────────────────────────────────────────

  const [newJE, setNewJE] = useState({ description: '', date: '', lines: [{ accountId: '', debit: '', credit: '' }] })
  const [showJEForm, setShowJEForm] = useState(false)

  const postJE = useMutation({
    mutationFn: (id: string) => api.post(`/finance/journal-entries/${id}/post`),
    onSuccess: () => { toast.success('Entry posted'); qc.invalidateQueries({ queryKey: ['journal-entries'] }) },
    onError: (e) => toast.error(getApiError(e)),
  })

  const processPayroll = useMutation({
    mutationFn: (id: string) => api.post(`/finance/payroll-runs/${id}/process`),
    onSuccess: () => { toast.success('Payroll processed'); qc.invalidateQueries({ queryKey: ['payroll-runs'] }) },
    onError: (e) => toast.error(getApiError(e)),
  })

  const approvePayroll = useMutation({
    mutationFn: (id: string) => api.post(`/finance/payroll-runs/${id}/approve`),
    onSuccess: () => { toast.success('Payroll approved'); qc.invalidateQueries({ queryKey: ['payroll-runs'] }) },
    onError: (e) => toast.error(getApiError(e)),
  })

  const payPayroll = useMutation({
    mutationFn: (id: string) => api.post(`/finance/payroll-runs/${id}/pay`),
    onSuccess: () => { toast.success('Payroll marked as paid'); qc.invalidateQueries({ queryKey: ['payroll-runs'] }) },
    onError: (e) => toast.error(getApiError(e)),
  })

  const approveLoan = useMutation({
    mutationFn: (id: string) => api.post(`/finance/loans/${id}/approve`),
    onSuccess: () => { toast.success('Loan approved'); qc.invalidateQueries({ queryKey: ['staff-loans'] }) },
    onError: (e) => toast.error(getApiError(e)),
  })

  const approveExpense = useMutation({
    mutationFn: (id: string) => api.post(`/finance/expenses/${id}/approve`),
    onSuccess: () => { toast.success('Expense approved'); qc.invalidateQueries({ queryKey: ['expenses', tab] }) },
    onError: (e) => toast.error(getApiError(e)),
  })

  const reimburseExpense = useMutation({
    mutationFn: (id: string) => api.post(`/finance/expenses/${id}/reimburse`),
    onSuccess: () => { toast.success('Marked as reimbursed'); qc.invalidateQueries({ queryKey: ['expenses', tab] }) },
    onError: (e) => toast.error(getApiError(e)),
  })

  const approveBudget = useMutation({
    mutationFn: (id: string) => api.post(`/finance/budgets/${id}/approve`),
    onSuccess: () => { toast.success('Budget approved'); qc.invalidateQueries({ queryKey: ['budgets'] }) },
    onError: (e) => toast.error(getApiError(e)),
  })

  const seedAccounts = useMutation({
    mutationFn: () => api.post('/finance/accounts/seed-defaults'),
    onSuccess: () => { toast.success('Default chart of accounts seeded'); qc.invalidateQueries({ queryKey: ['chart-of-accounts'] }) },
    onError: (e) => toast.error(getApiError(e)),
  })

  const createPayrollRun = useMutation({
    mutationFn: (dto: { month: number; year: number }) => api.post('/finance/payroll-runs', dto),
    onSuccess: () => { toast.success('Payroll run created'); qc.invalidateQueries({ queryKey: ['payroll-runs'] }) },
    onError: (e) => toast.error(getApiError(e)),
  })

  const [newRunMonth, setNewRunMonth] = useState(new Date().getMonth() + 1)
  const [newRunYear, setNewRunYear] = useState(new Date().getFullYear())
  const [showRunForm, setShowRunForm] = useState(false)

  // ── Bank Accounts Query ───────────────────────────────────────────────────────
  const { data: bankAccounts = [], isLoading: bankLoading } = useQuery<any[]>({
    queryKey: ['bank-accounts'],
    queryFn: () => api.get('/finance/bank-accounts').then((r) => r.data?.data || []),
    enabled: tab === 'bank',
  })

  // ── Fees Sub-Tab ──────────────────────────────────────────────────────────────
  const [feesSubTab, setFeesSubTab] = useState<'structures' | 'templates' | 'discounts' | 'fines' | 'credits'>('structures')

  const { data: feeTemplates = [], isLoading: templatesLoading } = useQuery<any[]>({
    queryKey: ['fee-templates', selectedSchoolId],
    queryFn: () => api.get('/finance/fee-templates').then((r) => r.data?.data || []),
    enabled: tab === 'fees' && !!selectedSchoolId,
  })

  const { data: discountRules = [], isLoading: discountsLoading } = useQuery<any[]>({
    queryKey: ['discount-rules', selectedSchoolId],
    queryFn: () => api.get('/finance/discount-rules').then((r) => r.data?.data || []),
    enabled: tab === 'fees' && !!selectedSchoolId,
  })

  const { data: fineRules = [], isLoading: finesLoading } = useQuery<any[]>({
    queryKey: ['fine-rules', selectedSchoolId],
    queryFn: () => api.get('/finance/fine-rules').then((r) => r.data?.data || []),
    enabled: tab === 'fees' && !!selectedSchoolId,
  })

  const { data: creditNotes = [], isLoading: creditNotesLoading } = useQuery<any[]>({
    queryKey: ['credit-notes', selectedSchoolId],
    queryFn: () => api.get('/finance/credit-notes').then((r) => r.data?.data || []),
    enabled: tab === 'fees' && !!selectedSchoolId,
  })

  // ── Academic Year Quick-Create ────────────────────────────────────────────────
  const [showAcYearForm, setShowAcYearForm] = useState(false)
  const [acYearForm, setAcYearForm] = useState({ name: '', startDate: '', endDate: '', isCurrent: true })

  const createAcademicYear = useMutation({
    mutationFn: (dto: any) => api.post('/finance/academic-years', dto),
    onSuccess: (res: any) => {
      const created = res.data?.data
      toast.success(isRtl ? 'تم إنشاء السنة الدراسية' : 'Academic year created')
      qc.invalidateQueries({ queryKey: ['academic-years'] })
      if (created?.id) setFeeForm(f => ({ ...f, academicYearId: created.id }))
      setShowAcYearForm(false)
      setAcYearForm({ name: '', startDate: '', endDate: '', isCurrent: true })
    },
    onError: (e) => toast.error(getApiError(e)),
  })

  // ── Fee Structure Modal ───────────────────────────────────────────────────────
  const FEE_TYPES = ['TUITION','REGISTRATION','EXAM','TRANSPORT','BOOKS','UNIFORM','CANTEEN','ACTIVITIES','OTHER']
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [editingFee, setEditingFee] = useState<any>(null)
  const [feeForm, setFeeForm] = useState({ name: '', nameAr: '', amount: '', currency: 'SAR', feeType: 'TUITION', academicYearId: '', dueDate: '', installmentsAllowed: false })

  const createFeeStructure = useMutation({
    mutationFn: (dto: any) => api.post('/finance/fee-structures', dto),
    onSuccess: () => { toast.success(isRtl ? 'تم إنشاء هيكل الرسوم' : 'Fee structure created'); qc.invalidateQueries({ queryKey: ['fee-structures'] }); setShowFeeModal(false) },
    onError: (e) => toast.error(getApiError(e)),
  })

  const updateFeeStructure = useMutation({
    mutationFn: ({ id, ...dto }: any) => api.patch(`/finance/fee-structures/${id}`, dto),
    onSuccess: () => { toast.success(isRtl ? 'تم التحديث' : 'Updated'); qc.invalidateQueries({ queryKey: ['fee-structures'] }); setShowFeeModal(false); setEditingFee(null) },
    onError: (e) => toast.error(getApiError(e)),
  })

  const deleteFeeStructure = useMutation({
    mutationFn: (id: string) => api.delete(`/finance/fee-structures/${id}`),
    onSuccess: () => { toast.success(isRtl ? 'تم الحذف' : 'Deleted'); qc.invalidateQueries({ queryKey: ['fee-structures'] }) },
    onError: (e) => toast.error(getApiError(e)),
  })

  // ── Fee Template Modal ────────────────────────────────────────────────────────
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templateForm, setTemplateForm] = useState({
    name: '', academicYear: '', curriculum: '', gradeLevel: '',
    items: [{ feeType: 'TUITION', label: '', amount: '', currency: 'SAR', isMandatory: true, dueDate: '' }],
  })

  const createFeeTemplate = useMutation({
    mutationFn: (dto: any) => api.post('/finance/fee-templates', dto),
    onSuccess: () => {
      toast.success(isRtl ? 'تم إنشاء القالب' : 'Template created')
      qc.invalidateQueries({ queryKey: ['fee-templates'] })
      setShowTemplateModal(false)
      setTemplateForm({ name: '', academicYear: '', curriculum: '', gradeLevel: '', items: [{ feeType: 'TUITION', label: '', amount: '', currency: 'SAR', isMandatory: true, dueDate: '' }] })
    },
    onError: (e) => toast.error(getApiError(e)),
  })

  const applyTemplate = useMutation({
    mutationFn: (id: string) => api.post(`/finance/fee-templates/${id}/apply`, {}),
    onSuccess: (res: any) => toast.success(`Template applied to ${res.data?.data?.count ?? 0} students`),
    onError: (e) => toast.error(getApiError(e)),
  })

  const deleteTemplate = useMutation({
    mutationFn: (id: string) => api.delete(`/finance/fee-templates/${id}`),
    onSuccess: () => { toast.success(isRtl ? 'تم حذف القالب' : 'Template deleted'); qc.invalidateQueries({ queryKey: ['fee-templates'] }) },
    onError: (e) => toast.error(getApiError(e)),
  })

  // ── Discount Rule Modal ───────────────────────────────────────────────────────
  const DISCOUNT_TYPES = ['PERCENTAGE','FIXED','SIBLING','EMPLOYEE_CHILD','SCHOLARSHIP','EARLY_PAYMENT']
  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const [discountForm, setDiscountForm] = useState({ name: '', nameAr: '', type: 'PERCENTAGE', value: '', feeTypes: [] as string[] })

  const createDiscountRule = useMutation({
    mutationFn: (dto: any) => api.post('/finance/discount-rules', dto),
    onSuccess: () => {
      toast.success(isRtl ? 'تم إنشاء قاعدة الخصم' : 'Discount rule created')
      qc.invalidateQueries({ queryKey: ['discount-rules'] })
      setShowDiscountModal(false)
      setDiscountForm({ name: '', nameAr: '', type: 'PERCENTAGE', value: '', feeTypes: [] })
    },
    onError: (e) => toast.error(getApiError(e)),
  })

  const deleteDiscountRule = useMutation({
    mutationFn: (id: string) => api.delete(`/finance/discount-rules/${id}`),
    onSuccess: () => { toast.success(isRtl ? 'تم الحذف' : 'Deleted'); qc.invalidateQueries({ queryKey: ['discount-rules'] }) },
    onError: (e) => toast.error(getApiError(e)),
  })

  // ── Fine Rule Modal ───────────────────────────────────────────────────────────
  const [showFineModal, setShowFineModal] = useState(false)
  const [fineForm, setFineForm] = useState({ name: '', feeType: '', graceDays: '0', fineType: 'FIXED_AMOUNT', fineValue: '', maxFine: '' })

  const createFineRule = useMutation({
    mutationFn: (dto: any) => api.post('/finance/fine-rules', dto),
    onSuccess: () => {
      toast.success(isRtl ? 'تم إنشاء قاعدة الغرامة' : 'Fine rule created')
      qc.invalidateQueries({ queryKey: ['fine-rules'] })
      setShowFineModal(false)
      setFineForm({ name: '', feeType: '', graceDays: '0', fineType: 'FIXED_AMOUNT', fineValue: '', maxFine: '' })
    },
    onError: (e) => toast.error(getApiError(e)),
  })

  const applyFines = useMutation({
    mutationFn: () => api.post('/finance/apply-fines'),
    onSuccess: (res: any) => toast.success(`Fines applied to ${res.data?.data?.affected ?? 0} invoices`),
    onError: (e) => toast.error(getApiError(e)),
  })

  // ── Credit Note Modal ─────────────────────────────────────────────────────────
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [creditForm, setCreditForm] = useState({ studentId: '', invoiceId: '', amount: '', reason: '' })

  const createCreditNote = useMutation({
    mutationFn: (dto: any) => api.post('/finance/credit-notes', dto),
    onSuccess: () => {
      toast.success(isRtl ? 'تم إنشاء الإشعار الدائن' : 'Credit note created')
      qc.invalidateQueries({ queryKey: ['credit-notes'] })
      setShowCreditModal(false)
      setCreditForm({ studentId: '', invoiceId: '', amount: '', reason: '' })
    },
    onError: (e) => toast.error(getApiError(e)),
  })

  const approveCreditNote = useMutation({
    mutationFn: (id: string) => api.post(`/finance/credit-notes/${id}/approve`),
    onSuccess: () => { toast.success(isRtl ? 'تمت الموافقة' : 'Approved'); qc.invalidateQueries({ queryKey: ['credit-notes'] }) },
    onError: (e) => toast.error(getApiError(e)),
  })

  const applyCreditNote = useMutation({
    mutationFn: (id: string) => api.post(`/finance/credit-notes/${id}/apply`),
    onSuccess: () => { toast.success(isRtl ? 'تم التطبيق على الفاتورة' : 'Applied to invoice'); qc.invalidateQueries({ queryKey: ['credit-notes'] }) },
    onError: (e) => toast.error(getApiError(e)),
  })

  // ── Modal state — Invoice ─────────────────────────────────────────────────────
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invStudentSearch, setInvStudentSearch] = useState('')
  const [invStudentResults, setInvStudentResults] = useState<any[]>([])
  const [invForm, setInvForm] = useState({ studentId: '', studentName: '', description: '', dueDate: '' })

  const createInvoiceMutation = useMutation({
    mutationFn: (dto: any) => api.post('/finance/invoices', dto),
    onSuccess: () => {
      toast.success(isRtl ? 'تم إنشاء الفاتورة' : 'Invoice created')
      qc.invalidateQueries({ queryKey: ['admin-invoices'] })
      qc.invalidateQueries({ queryKey: ['finance-stats'] })
      setShowInvoiceModal(false)
      setInvForm({ studentId: '', studentName: '', description: '', dueDate: '' })
      setInvStudentSearch('')
    },
    onError: (e) => toast.error(getApiError(e)),
  })

  const searchInvStudents = async (q: string) => {
    if (q.length < 2) { setInvStudentResults([]); return }
    try {
      const res = await api.get('/users/search', { params: { q, role: 'STUDENT', limit: 8 } })
      setInvStudentResults(res.data?.data || [])
    } catch {}
  }

  // ── Modal state — Journal Entry ───────────────────────────────────────────────
  const createJE = useMutation({
    mutationFn: (dto: any) => api.post('/finance/journal-entries', dto),
    onSuccess: () => {
      toast.success(isRtl ? 'تم إنشاء القيد' : 'Journal entry created')
      qc.invalidateQueries({ queryKey: ['journal-entries'] })
      setShowJEForm(false)
      setNewJE({ description: '', date: '', lines: [{ accountId: '', debit: '', credit: '' }] })
    },
    onError: (e) => toast.error(getApiError(e)),
  })

  // ── Modal state — Budget ──────────────────────────────────────────────────────
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [budgetForm, setBudgetForm] = useState({ name: '', fiscalYear: String(new Date().getFullYear()), totalAmount: '' })

  const createBudgetMutation = useMutation({
    mutationFn: (dto: any) => api.post('/finance/budgets', dto),
    onSuccess: () => {
      toast.success(isRtl ? 'تم إنشاء الميزانية' : 'Budget created')
      qc.invalidateQueries({ queryKey: ['budgets'] })
      setShowBudgetModal(false)
      setBudgetForm({ name: '', fiscalYear: String(new Date().getFullYear()), totalAmount: '' })
    },
    onError: (e) => toast.error(getApiError(e)),
  })

  // ── Modal state — Loan ────────────────────────────────────────────────────────
  const [showLoanModal, setShowLoanModal] = useState(false)
  const [loanForm, setLoanForm] = useState({ staffId: '', amount: '', reason: '', totalInstallments: '1' })

  const createLoanMutation = useMutation({
    mutationFn: (dto: any) => api.post('/finance/loans', dto),
    onSuccess: () => {
      toast.success(isRtl ? 'تم تسجيل طلب السلفة' : 'Loan request created')
      qc.invalidateQueries({ queryKey: ['staff-loans'] })
      setShowLoanModal(false)
      setLoanForm({ staffId: '', amount: '', reason: '', totalInstallments: '1' })
    },
    onError: (e) => toast.error(getApiError(e)),
  })

  // ── Modal state — Expense ─────────────────────────────────────────────────────
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    title: '', category: 'SUPPLIES', amount: '', currency: 'SAR', date: new Date().toISOString().slice(0, 10), description: '',
  })

  const submitExpenseMutation = useMutation({
    mutationFn: (dto: any) => api.post('/finance/expenses', dto),
    onSuccess: () => {
      toast.success(isRtl ? 'تم تقديم طلب المصروف' : 'Expense claim submitted')
      qc.invalidateQueries({ queryKey: ['expenses', tab] })
      setShowExpenseModal(false)
      setExpenseForm({ title: '', category: 'SUPPLIES', amount: '', currency: 'SAR', date: new Date().toISOString().slice(0, 10), description: '' })
    },
    onError: (e) => toast.error(getApiError(e)),
  })

  // ── Modal state — Bank Account ────────────────────────────────────────────────
  const [showBankModal, setShowBankModal] = useState(false)
  const [bankForm, setBankForm] = useState({ name: '', accountNumber: '', bankName: '', iban: '', currency: 'SAR' })

  const createBankMutation = useMutation({
    mutationFn: (dto: any) => api.post('/finance/bank-accounts', dto),
    onSuccess: () => {
      toast.success(isRtl ? 'تم إضافة الحساب البنكي' : 'Bank account added')
      qc.invalidateQueries({ queryKey: ['bank-accounts'] })
      setShowBankModal(false)
      setBankForm({ name: '', accountNumber: '', bankName: '', iban: '', currency: 'SAR' })
    },
    onError: (e) => toast.error(getApiError(e)),
  })

  // ── Modal state — New COA Account ─────────────────────────────────────────────
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [accountForm, setAccountForm] = useState({ code: '', name: '', type: 'ASSET', parentId: '' })

  const createAccountMutation = useMutation({
    mutationFn: (dto: any) => api.post('/finance/accounts', dto),
    onSuccess: () => {
      toast.success(isRtl ? 'تم إنشاء الحساب' : 'Account created')
      qc.invalidateQueries({ queryKey: ['chart-of-accounts'] })
      setShowAccountModal(false)
      setAccountForm({ code: '', name: '', type: 'ASSET', parentId: '' })
    },
    onError: (e) => toast.error(getApiError(e)),
  })

  // ── Modal state — Record Payment ──────────────────────────────────────────────
  const [paymentModal, setPaymentModal] = useState<{ invoiceId: string; amount: string; method: string } | null>(null)

  const recordPaymentMutation = useMutation({
    mutationFn: ({ invoiceId, amount, method }: { invoiceId: string; amount: string; method: string }) =>
      api.post(`/finance/invoices/${invoiceId}/payments`, { amount: +amount, method, currency: 'SAR' }),
    onSuccess: () => {
      toast.success(isRtl ? 'تم تسجيل الدفعة' : 'Payment recorded')
      qc.invalidateQueries({ queryKey: ['admin-invoices'] })
      qc.invalidateQueries({ queryKey: ['finance-stats'] })
      setPaymentModal(null)
    },
    onError: (e) => toast.error(getApiError(e)),
  })

  // ── Mutations ────────────────────────────────────────────────────────────────

  const escalateMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/owner/requisitions/${id}/finance-approve`),
    onSuccess: () => { toast.success('Escalated to owner for final approval'); qc.invalidateQueries({ queryKey: ['finance-requisitions'] }) },
    onError: () => toast.error('Failed'),
  })

  const directApproveMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/owner/requisitions/${id}/finance-direct-approve`),
    onSuccess: () => { toast.success('Approved — ready to release money to RM'); qc.invalidateQueries({ queryKey: ['finance-requisitions'] }) },
    onError: () => toast.error('Failed'),
  })

  const releaseMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/owner/requisitions/${id}/release-money`),
    onSuccess: () => { toast.success('Money released to Requisitions Manager'); qc.invalidateQueries({ queryKey: ['finance-requisitions'] }) },
    onError: () => toast.error('Failed to release money'),
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/owner/requisitions/${id}/complete`),
    onSuccess: () => { toast.success('Requisition closed and marked completed'); qc.invalidateQueries({ queryKey: ['finance-requisitions'] }) },
    onError: () => toast.error('Failed to close'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.patch(`/owner/requisitions/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success('Rejected')
      qc.invalidateQueries({ queryKey: ['finance-requisitions'] })
      setRejectId(null); setRejectReason('')
    },
    onError: () => toast.error('Failed to reject'),
  })

  // ── Derived queues ────────────────────────────────────────────────────────────

  const pricedReqs        = procurementReqs.filter((r) => r.status === 'PRICED')
  const approvedReqs      = procurementReqs.filter((r) => r.status === 'APPROVED')
  const moneyOutReqs      = procurementReqs.filter((r) => ['MONEY_RELEASED', 'MONEY_RECEIVED'].includes(r.status))
  const purchasedReqs     = procurementReqs.filter((r) => r.status === 'PURCHASED')
  const storeReqs         = procurementReqs.filter((r) => ['STORE_CONFIRMED', 'STORE_ISSUE'].includes(r.status))
  const escalatedReqs     = procurementReqs.filter((r) => r.status === 'FINANCE_APPROVED')

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

  // Tab-contextual title
  const tabTitles: Record<FinanceTab, { en: string; ar: string }> = {
    invoices:      { en: 'Invoices & Billing',   ar: 'الفواتير والرسوم' },
    fees:          { en: 'Fee Structures',       ar: 'هياكل الرسوم' },
    procurement:   { en: 'Procurement',          ar: 'المستلزمات' },
    accounts:      { en: 'Chart of Accounts',    ar: 'دليل الحسابات' },
    journal:       { en: 'Journal Entries',      ar: 'القيود اليومية' },
    payroll:       { en: 'Payroll Runs',         ar: 'دورات الرواتب' },
    loans:         { en: 'Staff Loans',          ar: 'سلف الموظفين' },
    expenses:      { en: 'Expense Claims',       ar: 'مطالبات المصروفات' },
    bank:          { en: 'Bank Accounts',        ar: 'الحسابات البنكية' },
    budget:        { en: 'Budgets',              ar: 'الميزانيات' },
    reports:       { en: 'Financial Reports',    ar: 'التقارير المالية' },
    payments:      { en: 'Payment History',      ar: 'سجل المدفوعات' },
    'fiscal-years':  { en: 'Fiscal Years',       ar: 'السنوات المالية' },
    'cost-centers':  { en: 'Cost Centers',       ar: 'مراكز التكلفة' },
  }

  // Modal, InputField, SelectField defined outside this component (above AdminFinancePageInner) to prevent focus-loss on re-render

  return (
    <>
    {/* ── Modal: New Invoice ─────────────────────────────────────────────────── */}
    {showInvoiceModal && (
      <Modal title={isRtl ? 'فاتورة جديدة' : 'New Invoice'} onClose={() => setShowInvoiceModal(false)}
        loading={createInvoiceMutation.isPending}
        onSubmit={() => {
          if (!invForm.studentId) { toast.error(isRtl ? 'اختر طالباً' : 'Select a student'); return }
          createInvoiceMutation.mutate({ studentId: invForm.studentId, description: invForm.description, dueDate: invForm.dueDate || undefined })
        }}>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{isRtl ? 'الطالب' : 'Student'}</label>
          <input value={invStudentSearch} placeholder={isRtl ? 'ابحث بالاسم أو الرقم...' : 'Search by name or ID...'}
            onChange={(e) => { setInvStudentSearch(e.target.value); searchInvStudents(e.target.value) }}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
          {invForm.studentName && <p className="mt-1 text-xs text-emerald-600 font-medium">✓ {invForm.studentName}</p>}
          {invStudentResults.length > 0 && !invForm.studentId && (
            <div className="mt-1 border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              {invStudentResults.map((s: any) => (
                <button key={s.id} onClick={() => {
                  setInvForm(f => ({ ...f, studentId: s.id, studentName: `${s.profile?.firstName || ''} ${s.profile?.lastName || ''}`.trim() }))
                  setInvStudentResults([])
                }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0">
                  {s.profile?.firstName} {s.profile?.lastName}
                  {s.profile?.studentId && <span className="text-gray-400 ml-2">#{s.profile.studentId}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <InputField label={isRtl ? 'الوصف' : 'Description'} value={invForm.description}
          onChange={(v) => setInvForm(f => ({ ...f, description: v }))} placeholder={isRtl ? 'مثل: رسوم الفصل الأول' : 'e.g. Term 1 Tuition'} />
        <InputField label={isRtl ? 'تاريخ الاستحقاق' : 'Due Date'} value={invForm.dueDate}
          onChange={(v) => setInvForm(f => ({ ...f, dueDate: v }))} type="date" />
      </Modal>
    )}

    {/* ── Modal: New Journal Entry ───────────────────────────────────────────── */}
    {showJEForm && (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">{isRtl ? 'قيد يومي جديد' : 'New Journal Entry'}</h2>
            <button onClick={() => setShowJEForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <InputField label={isRtl ? 'الوصف' : 'Description'} value={newJE.description}
              onChange={(v) => setNewJE(j => ({ ...j, description: v }))} />
            <InputField label={isRtl ? 'التاريخ' : 'Date'} value={newJE.date}
              onChange={(v) => setNewJE(j => ({ ...j, date: v }))} type="date" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-600">{isRtl ? 'السطور (مجموع المدين = مجموع الدائن)' : 'Lines (debit must equal credit)'}</label>
                <button onClick={() => setNewJE(j => ({ ...j, lines: [...j.lines, { accountId: '', debit: '', credit: '' }] }))}
                  className="text-xs text-primary-600 hover:underline">+ {isRtl ? 'إضافة سطر' : 'Add line'}</button>
              </div>
              {newJE.lines.map((line, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 mb-2">
                  <div className="col-span-5">
                    <select value={line.accountId} onChange={(e) => setNewJE(j => ({ ...j, lines: j.lines.map((l, idx) => idx === i ? { ...l, accountId: e.target.value } : l) }))}
                      className="w-full border border-gray-200 rounded-xl px-2 py-2 text-xs outline-none focus:border-primary-500">
                      <option value="">{isRtl ? 'اختر حساباً' : 'Select account'}</option>
                      {accounts.map((acc: any) => <option key={acc.id} value={acc.id}>{acc.code} — {acc.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input type="number" placeholder={isRtl ? 'مدين' : 'Debit'} value={line.debit}
                      onChange={(e) => setNewJE(j => ({ ...j, lines: j.lines.map((l, idx) => idx === i ? { ...l, debit: e.target.value, credit: e.target.value ? '' : l.credit } : l) }))}
                      className="w-full border border-gray-200 rounded-xl px-2 py-2 text-xs outline-none focus:border-primary-500" />
                  </div>
                  <div className="col-span-3">
                    <input type="number" placeholder={isRtl ? 'دائن' : 'Credit'} value={line.credit}
                      onChange={(e) => setNewJE(j => ({ ...j, lines: j.lines.map((l, idx) => idx === i ? { ...l, credit: e.target.value, debit: e.target.value ? '' : l.debit } : l) }))}
                      className="w-full border border-gray-200 rounded-xl px-2 py-2 text-xs outline-none focus:border-primary-500" />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    {newJE.lines.length > 2 && (
                      <button onClick={() => setNewJE(j => ({ ...j, lines: j.lines.filter((_, idx) => idx !== i) }))}
                        className="text-red-400 hover:text-red-600"><X size={14} /></button>
                    )}
                  </div>
                </div>
              ))}
              {(() => {
                const totalDebit = newJE.lines.reduce((s, l) => s + (+l.debit || 0), 0)
                const totalCredit = newJE.lines.reduce((s, l) => s + (+l.credit || 0), 0)
                const diff = totalDebit - totalCredit
                return (
                  <div className={`text-xs mt-2 font-medium ${diff === 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isRtl ? `المدين: ${totalDebit.toLocaleString()} | الدائن: ${totalCredit.toLocaleString()} | الفرق: ${diff}` : `Debit: ${totalDebit.toLocaleString()} | Credit: ${totalCredit.toLocaleString()} | Diff: ${diff}`}
                  </div>
                )
              })()}
            </div>
          </div>
          <div className="p-5 border-t border-gray-100 flex gap-3 justify-end">
            <button onClick={() => setShowJEForm(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">{isRtl ? 'إلغاء' : 'Cancel'}</button>
            <button disabled={createJE.isPending}
              onClick={() => {
                const totalDebit = newJE.lines.reduce((s, l) => s + (+l.debit || 0), 0)
                const totalCredit = newJE.lines.reduce((s, l) => s + (+l.credit || 0), 0)
                if (totalDebit !== totalCredit) { toast.error(isRtl ? 'المدين لا يساوي الدائن' : 'Debit must equal credit'); return }
                if (!newJE.description || !newJE.date) { toast.error(isRtl ? 'أدخل الوصف والتاريخ' : 'Enter description and date'); return }
                createJE.mutate({ description: newJE.description, date: newJE.date, lines: newJE.lines.map(l => ({ accountId: l.accountId, debit: +l.debit || 0, credit: +l.credit || 0 })) })
              }}
              className="px-4 py-2 bg-primary-900 text-white rounded-xl text-sm font-medium hover:bg-primary-800 disabled:opacity-50">
              {createJE.isPending ? '...' : (isRtl ? 'إنشاء القيد' : 'Create Entry')}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Modal: New Budget ──────────────────────────────────────────────────── */}
    {showBudgetModal && (
      <Modal title={isRtl ? 'ميزانية جديدة' : 'New Budget'} onClose={() => setShowBudgetModal(false)}
        loading={createBudgetMutation.isPending}
        onSubmit={() => {
          if (!budgetForm.name || !budgetForm.fiscalYear || !budgetForm.totalAmount) { toast.error(isRtl ? 'يرجى ملء جميع الحقول' : 'Fill all fields'); return }
          createBudgetMutation.mutate({ name: budgetForm.name, fiscalYear: +budgetForm.fiscalYear, totalAmount: +budgetForm.totalAmount })
        }}>
        <InputField label={isRtl ? 'اسم الميزانية' : 'Budget Name'} value={budgetForm.name} onChange={(v) => setBudgetForm(f => ({ ...f, name: v }))} />
        <InputField label={isRtl ? 'السنة المالية' : 'Fiscal Year'} value={budgetForm.fiscalYear} onChange={(v) => setBudgetForm(f => ({ ...f, fiscalYear: v }))} type="number" />
        <InputField label={isRtl ? 'إجمالي الميزانية' : 'Total Amount'} value={budgetForm.totalAmount} onChange={(v) => setBudgetForm(f => ({ ...f, totalAmount: v }))} type="number" placeholder="0.00" />
      </Modal>
    )}

    {/* ── Modal: Request Loan ────────────────────────────────────────────────── */}
    {showLoanModal && (
      <Modal title={isRtl ? 'طلب سلفة موظف' : 'Request Staff Loan'} onClose={() => setShowLoanModal(false)}
        loading={createLoanMutation.isPending}
        onSubmit={() => {
          if (!loanForm.staffId || !loanForm.amount) { toast.error(isRtl ? 'يرجى ملء الحقول المطلوبة' : 'Fill required fields'); return }
          createLoanMutation.mutate({ staffId: loanForm.staffId, amount: +loanForm.amount, reason: loanForm.reason, totalInstallments: +loanForm.totalInstallments })
        }}>
        <InputField label={isRtl ? 'معرّف الموظف (Staff ID)' : 'Staff ID (HR record ID)'} value={loanForm.staffId} onChange={(v) => setLoanForm(f => ({ ...f, staffId: v }))} placeholder="UUID..." />
        <InputField label={isRtl ? 'المبلغ' : 'Amount'} value={loanForm.amount} onChange={(v) => setLoanForm(f => ({ ...f, amount: v }))} type="number" placeholder="0.00" />
        <InputField label={isRtl ? 'عدد الأقساط' : 'Installments'} value={loanForm.totalInstallments} onChange={(v) => setLoanForm(f => ({ ...f, totalInstallments: v }))} type="number" />
        <InputField label={isRtl ? 'السبب' : 'Reason'} value={loanForm.reason} onChange={(v) => setLoanForm(f => ({ ...f, reason: v }))} placeholder={isRtl ? 'سبب السلفة...' : 'Reason for loan...'} />
      </Modal>
    )}

    {/* ── Modal: Submit Expense ──────────────────────────────────────────────── */}
    {showExpenseModal && (
      <Modal title={isRtl ? 'تقديم طلب مصروف' : 'Submit Expense Claim'} onClose={() => setShowExpenseModal(false)}
        loading={submitExpenseMutation.isPending}
        onSubmit={() => {
          if (!expenseForm.title || !expenseForm.amount) { toast.error(isRtl ? 'يرجى ملء الحقول المطلوبة' : 'Fill required fields'); return }
          submitExpenseMutation.mutate({ ...expenseForm, amount: +expenseForm.amount })
        }}>
        <InputField label={isRtl ? 'العنوان' : 'Title'} value={expenseForm.title} onChange={(v) => setExpenseForm(f => ({ ...f, title: v }))} />
        <SelectField label={isRtl ? 'الفئة' : 'Category'} value={expenseForm.category} onChange={(v) => setExpenseForm(f => ({ ...f, category: v }))}
          options={['TRAVEL','SUPPLIES','MAINTENANCE','UTILITIES','MARKETING','TRAINING','ENTERTAINMENT','OTHER'].map(c => ({ value: c, label: c }))} />
        <div className="grid grid-cols-2 gap-3">
          <InputField label={isRtl ? 'المبلغ' : 'Amount'} value={expenseForm.amount} onChange={(v) => setExpenseForm(f => ({ ...f, amount: v }))} type="number" placeholder="0.00" />
          <SelectField label={isRtl ? 'العملة' : 'Currency'} value={expenseForm.currency} onChange={(v) => setExpenseForm(f => ({ ...f, currency: v }))}
            options={[{ value: 'SAR', label: 'SAR' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]} />
        </div>
        <InputField label={isRtl ? 'التاريخ' : 'Date'} value={expenseForm.date} onChange={(v) => setExpenseForm(f => ({ ...f, date: v }))} type="date" />
        <InputField label={isRtl ? 'الوصف' : 'Description'} value={expenseForm.description} onChange={(v) => setExpenseForm(f => ({ ...f, description: v }))} placeholder={isRtl ? 'تفاصيل إضافية...' : 'Additional details...'} />
      </Modal>
    )}

    {/* ── Modal: New Bank Account ────────────────────────────────────────────── */}
    {showBankModal && (
      <Modal title={isRtl ? 'إضافة حساب بنكي' : 'Add Bank Account'} onClose={() => setShowBankModal(false)}
        loading={createBankMutation.isPending}
        onSubmit={() => {
          if (!bankForm.name || !bankForm.bankName) { toast.error(isRtl ? 'يرجى ملء الحقول المطلوبة' : 'Fill required fields'); return }
          createBankMutation.mutate(bankForm)
        }}>
        <InputField label={isRtl ? 'اسم الحساب' : 'Account Name'} value={bankForm.name} onChange={(v) => setBankForm(f => ({ ...f, name: v }))} placeholder={isRtl ? 'مثل: الحساب الجاري الرئيسي' : 'e.g. Main Current Account'} />
        <InputField label={isRtl ? 'اسم البنك' : 'Bank Name'} value={bankForm.bankName} onChange={(v) => setBankForm(f => ({ ...f, bankName: v }))} />
        <InputField label={isRtl ? 'رقم الحساب' : 'Account Number'} value={bankForm.accountNumber} onChange={(v) => setBankForm(f => ({ ...f, accountNumber: v }))} />
        <InputField label="IBAN" value={bankForm.iban} onChange={(v) => setBankForm(f => ({ ...f, iban: v }))} placeholder="SA..." />
        <SelectField label={isRtl ? 'العملة' : 'Currency'} value={bankForm.currency} onChange={(v) => setBankForm(f => ({ ...f, currency: v }))}
          options={[{ value: 'SAR', label: 'SAR' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]} />
      </Modal>
    )}

    {/* ── Modal: New COA Account ─────────────────────────────────────────────── */}
    {showAccountModal && (
      <Modal title={isRtl ? 'حساب جديد' : 'New Account'} onClose={() => setShowAccountModal(false)}
        loading={createAccountMutation.isPending}
        onSubmit={() => {
          if (!accountForm.code || !accountForm.name) { toast.error(isRtl ? 'أدخل الرمز والاسم' : 'Enter code and name'); return }
          createAccountMutation.mutate({ code: accountForm.code, name: accountForm.name, type: accountForm.type, parentId: accountForm.parentId || undefined })
        }}>
        <div className="grid grid-cols-2 gap-3">
          <InputField label={isRtl ? 'رمز الحساب' : 'Account Code'} value={accountForm.code} onChange={(v) => setAccountForm(f => ({ ...f, code: v }))} placeholder="1010" />
          <SelectField label={isRtl ? 'النوع' : 'Type'} value={accountForm.type} onChange={(v) => setAccountForm(f => ({ ...f, type: v }))}
            options={[
              { value: 'ASSET', label: 'Asset' }, { value: 'LIABILITY', label: 'Liability' },
              { value: 'EQUITY', label: 'Equity' }, { value: 'REVENUE', label: 'Revenue' }, { value: 'EXPENSE', label: 'Expense' },
            ]} />
        </div>
        <InputField label={isRtl ? 'اسم الحساب' : 'Account Name'} value={accountForm.name} onChange={(v) => setAccountForm(f => ({ ...f, name: v }))} placeholder={isRtl ? 'مثل: النقدية في الصندوق' : 'e.g. Cash on Hand'} />
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{isRtl ? 'الحساب الأب (اختياري)' : 'Parent Account (optional)'}</label>
          <select value={accountForm.parentId} onChange={(e) => setAccountForm(f => ({ ...f, parentId: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500">
            <option value="">{isRtl ? 'بدون حساب أب' : 'No parent'}</option>
            {accounts.filter((a: any) => !a.parentId).map((a: any) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
          </select>
        </div>
      </Modal>
    )}

    {/* ── Modal: Record Payment ──────────────────────────────────────────────── */}
    {paymentModal && (
      <Modal title={isRtl ? 'تسجيل دفعة' : 'Record Payment'} onClose={() => setPaymentModal(null)}
        loading={recordPaymentMutation.isPending}
        onSubmit={() => {
          if (!paymentModal.amount || +paymentModal.amount <= 0) { toast.error(isRtl ? 'أدخل مبلغاً صحيحاً' : 'Enter valid amount'); return }
          recordPaymentMutation.mutate({ invoiceId: paymentModal.invoiceId, amount: paymentModal.amount, method: paymentModal.method })
        }}>
        <InputField label={isRtl ? 'المبلغ' : 'Amount'} value={paymentModal.amount}
          onChange={(v) => setPaymentModal(m => m ? { ...m, amount: v } : null)} type="number" placeholder="0.00" />
        <SelectField label={isRtl ? 'طريقة الدفع' : 'Payment Method'} value={paymentModal.method}
          onChange={(v) => setPaymentModal(m => m ? { ...m, method: v } : null)}
          options={[{ value: 'CASH', label: 'Cash' }, { value: 'CARD', label: 'Card' }, { value: 'BANK', label: 'Bank Transfer' }, { value: 'CHEQUE', label: 'Cheque' }]} />
      </Modal>
    )}

    {/* ── Modal: New / Edit Fee Structure ──────────────────────────────────── */}
    {showFeeModal && (
      <Modal
        title={editingFee ? (isRtl ? 'تعديل هيكل الرسوم' : 'Edit Fee Structure') : (isRtl ? 'هيكل رسوم جديد' : 'New Fee Structure')}
        onClose={() => { setShowFeeModal(false); setEditingFee(null) }}
        loading={createFeeStructure.isPending || updateFeeStructure.isPending}
        onSubmit={() => {
          if (!feeForm.name || !feeForm.amount || !feeForm.academicYearId) { toast.error(isRtl ? 'يرجى ملء الحقول المطلوبة' : 'Fill required fields'); return }
          const dto = { ...feeForm, amount: +feeForm.amount, dueDate: feeForm.dueDate || undefined }
          if (editingFee) updateFeeStructure.mutate({ id: editingFee.id, ...dto })
          else createFeeStructure.mutate(dto)
        }}>
        <div className="grid grid-cols-2 gap-3">
          <InputField label={isRtl ? 'الاسم *' : 'Name *'} value={feeForm.name} onChange={(v) => setFeeForm(f => ({ ...f, name: v }))} />
          <InputField label={isRtl ? 'الاسم بالعربية' : 'Name (Arabic)'} value={feeForm.nameAr} onChange={(v) => setFeeForm(f => ({ ...f, nameAr: v }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectField label={isRtl ? 'نوع الرسوم *' : 'Fee Type *'} value={feeForm.feeType} onChange={(v) => setFeeForm(f => ({ ...f, feeType: v }))}
            options={FEE_TYPES.map(t => ({ value: t, label: t }))} />
          <SelectField label={isRtl ? 'العملة' : 'Currency'} value={feeForm.currency} onChange={(v) => setFeeForm(f => ({ ...f, currency: v }))}
            options={[{ value: 'SAR', label: 'SAR' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputField label={isRtl ? 'المبلغ *' : 'Amount *'} value={feeForm.amount} onChange={(v) => setFeeForm(f => ({ ...f, amount: v }))} type="number" placeholder="0.00" />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{isRtl ? 'السنة الدراسية *' : 'Academic Year *'}</label>
            {academicYears.length > 0 ? (
              <select value={feeForm.academicYearId} onChange={(e) => setFeeForm(f => ({ ...f, academicYearId: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500">
                <option value="">{isRtl ? '-- اختر السنة --' : '-- Select Year --'}</option>
                {academicYears.map((y: any) => (
                  <option key={y.id} value={y.id}>{y.name}{y.isCurrent ? (isRtl ? ' (الحالية)' : ' (Current)') : ''}</option>
                ))}
              </select>
            ) : (
              <div className="border border-amber-200 bg-amber-50 rounded-xl p-3 space-y-2">
                {!showAcYearForm ? (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-amber-700">{isRtl ? 'لا توجد سنوات دراسية. أنشئ واحدة أولاً.' : 'No academic years found.'}</p>
                    <button type="button" onClick={() => setShowAcYearForm(true)}
                      className="text-xs px-2 py-1 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
                      {isRtl ? '+ إنشاء سنة' : '+ Create Year'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-amber-800">{isRtl ? 'إنشاء سنة دراسية جديدة' : 'Create Academic Year'}</p>
                    <input placeholder={isRtl ? 'الاسم (مثل: 2025-2026)' : 'Name (e.g. 2025-2026)'} value={acYearForm.name}
                      onChange={(e) => setAcYearForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary-500" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" placeholder={isRtl ? 'تاريخ البدء' : 'Start'} value={acYearForm.startDate}
                        onChange={(e) => setAcYearForm(f => ({ ...f, startDate: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary-500" />
                      <input type="date" placeholder={isRtl ? 'تاريخ الانتهاء' : 'End'} value={acYearForm.endDate}
                        onChange={(e) => setAcYearForm(f => ({ ...f, endDate: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary-500" />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setShowAcYearForm(false)}
                        className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">
                        {isRtl ? 'إلغاء' : 'Cancel'}
                      </button>
                      <button type="button" disabled={createAcademicYear.isPending || !acYearForm.name || !acYearForm.startDate || !acYearForm.endDate}
                        onClick={() => createAcademicYear.mutate(acYearForm)}
                        className="flex-1 text-xs px-2 py-1 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50">
                        {createAcademicYear.isPending ? '...' : (isRtl ? 'إنشاء' : 'Create')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <InputField label={isRtl ? 'تاريخ الاستحقاق' : 'Due Date'} value={feeForm.dueDate} onChange={(v) => setFeeForm(f => ({ ...f, dueDate: v }))} type="date" />
        <div className="flex items-center gap-3">
          <input type="checkbox" id="installments" checked={feeForm.installmentsAllowed}
            onChange={(e) => setFeeForm(f => ({ ...f, installmentsAllowed: e.target.checked }))}
            className="w-4 h-4 accent-primary-600" />
          <label htmlFor="installments" className="text-sm text-gray-700">{isRtl ? 'السماح بالتقسيط' : 'Allow Installments'}</label>
        </div>
      </Modal>
    )}

    {/* ── Modal: New Fee Template ────────────────────────────────────────────── */}
    {showTemplateModal && (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">{isRtl ? 'قالب رسوم جديد' : 'New Fee Template'}</h2>
            <button onClick={() => setShowTemplateModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-3">
              <InputField label={isRtl ? 'اسم القالب *' : 'Template Name *'} value={templateForm.name} onChange={(v) => setTemplateForm(f => ({ ...f, name: v }))} />
              <InputField label={isRtl ? 'السنة الدراسية *' : 'Academic Year *'} value={templateForm.academicYear} onChange={(v) => setTemplateForm(f => ({ ...f, academicYear: v }))} placeholder="2024-2025" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputField label={isRtl ? 'المنهج (اختياري)' : 'Curriculum (optional)'} value={templateForm.curriculum} onChange={(v) => setTemplateForm(f => ({ ...f, curriculum: v }))} placeholder="e.g. IGCSE" />
              <InputField label={isRtl ? 'المرحلة (اختياري)' : 'Grade Level (optional)'} value={templateForm.gradeLevel} onChange={(v) => setTemplateForm(f => ({ ...f, gradeLevel: v }))} placeholder="e.g. Grade 1" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-600">{isRtl ? 'بنود الرسوم' : 'Fee Items'}</label>
                <button onClick={() => setTemplateForm(f => ({ ...f, items: [...f.items, { feeType: 'TUITION', label: '', amount: '', currency: 'SAR', isMandatory: true, dueDate: '' }] }))}
                  className="text-xs text-primary-600 hover:underline">+ {isRtl ? 'إضافة بند' : 'Add Item'}</button>
              </div>
              {templateForm.items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-end">
                  <div className="col-span-3">
                    <select value={item.feeType} onChange={(e) => setTemplateForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, feeType: e.target.value } : it) }))}
                      className="w-full border border-gray-200 rounded-xl px-2 py-2 text-xs outline-none focus:border-primary-500">
                      {FEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input placeholder={isRtl ? 'تسمية' : 'Label'} value={item.label}
                      onChange={(e) => setTemplateForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, label: e.target.value } : it) }))}
                      className="w-full border border-gray-200 rounded-xl px-2 py-2 text-xs outline-none focus:border-primary-500" />
                  </div>
                  <div className="col-span-3">
                    <input type="number" placeholder={isRtl ? 'المبلغ' : 'Amount'} value={item.amount}
                      onChange={(e) => setTemplateForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, amount: e.target.value } : it) }))}
                      className="w-full border border-gray-200 rounded-xl px-2 py-2 text-xs outline-none focus:border-primary-500" />
                  </div>
                  <div className="col-span-2">
                    <input type="date" value={item.dueDate}
                      onChange={(e) => setTemplateForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, dueDate: e.target.value } : it) }))}
                      className="w-full border border-gray-200 rounded-xl px-2 py-2 text-xs outline-none focus:border-primary-500" />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    {templateForm.items.length > 1 && (
                      <button onClick={() => setTemplateForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))}
                        className="text-red-400 hover:text-red-600"><X size={14} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-5 border-t border-gray-100 flex gap-3 justify-end">
            <button onClick={() => setShowTemplateModal(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">{isRtl ? 'إلغاء' : 'Cancel'}</button>
            <button disabled={createFeeTemplate.isPending}
              onClick={() => {
                if (!templateForm.name || !templateForm.academicYear) { toast.error(isRtl ? 'أدخل اسم القالب والسنة الدراسية' : 'Enter template name and academic year'); return }
                createFeeTemplate.mutate({ ...templateForm, items: templateForm.items.map(it => ({ ...it, amount: +it.amount, dueDate: it.dueDate || undefined })) })
              }}
              className="px-4 py-2 bg-primary-900 text-white rounded-xl text-sm font-medium hover:bg-primary-800 disabled:opacity-50">
              {createFeeTemplate.isPending ? '...' : (isRtl ? 'إنشاء القالب' : 'Create Template')}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Modal: New Discount Rule ───────────────────────────────────────────── */}
    {showDiscountModal && (
      <Modal title={isRtl ? 'قاعدة خصم جديدة' : 'New Discount Rule'} onClose={() => setShowDiscountModal(false)}
        loading={createDiscountRule.isPending}
        onSubmit={() => {
          if (!discountForm.name || !discountForm.value) { toast.error(isRtl ? 'يرجى ملء الحقول المطلوبة' : 'Fill required fields'); return }
          createDiscountRule.mutate({ ...discountForm, value: +discountForm.value })
        }}>
        <div className="grid grid-cols-2 gap-3">
          <InputField label={isRtl ? 'الاسم *' : 'Name *'} value={discountForm.name} onChange={(v) => setDiscountForm(f => ({ ...f, name: v }))} />
          <InputField label={isRtl ? 'الاسم بالعربية' : 'Name (Arabic)'} value={discountForm.nameAr} onChange={(v) => setDiscountForm(f => ({ ...f, nameAr: v }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectField label={isRtl ? 'نوع الخصم' : 'Discount Type'} value={discountForm.type} onChange={(v) => setDiscountForm(f => ({ ...f, type: v }))}
            options={DISCOUNT_TYPES.map(t => ({ value: t, label: t }))} />
          <InputField label={discountForm.type === 'PERCENTAGE' || discountForm.type === 'SCHOLARSHIP' ? (isRtl ? 'النسبة (%)' : 'Percentage (%)') : (isRtl ? 'المبلغ الثابت' : 'Fixed Amount')}
            value={discountForm.value} onChange={(v) => setDiscountForm(f => ({ ...f, value: v }))} type="number" placeholder="0" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{isRtl ? 'أنواع الرسوم المطبق عليها (اختياري — فارغ = الكل)' : 'Applicable Fee Types (empty = all)'}</label>
          <div className="flex flex-wrap gap-2">
            {FEE_TYPES.map(ft => (
              <button key={ft} type="button"
                onClick={() => setDiscountForm(f => ({ ...f, feeTypes: f.feeTypes.includes(ft) ? f.feeTypes.filter(x => x !== ft) : [...f.feeTypes, ft] }))}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${discountForm.feeTypes.includes(ft) ? 'bg-primary-900 text-white border-primary-900' : 'border-gray-200 text-gray-600 hover:border-primary-300'}`}>
                {ft}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    )}

    {/* ── Modal: New Fine Rule ───────────────────────────────────────────────── */}
    {showFineModal && (
      <Modal title={isRtl ? 'قاعدة غرامة جديدة' : 'New Fine Rule'} onClose={() => setShowFineModal(false)}
        loading={createFineRule.isPending}
        onSubmit={() => {
          if (!fineForm.name || !fineForm.fineValue) { toast.error(isRtl ? 'يرجى ملء الحقول المطلوبة' : 'Fill required fields'); return }
          createFineRule.mutate({ ...fineForm, graceDays: +fineForm.graceDays, fineValue: +fineForm.fineValue, maxFine: fineForm.maxFine ? +fineForm.maxFine : undefined, feeType: fineForm.feeType || undefined })
        }}>
        <InputField label={isRtl ? 'اسم القاعدة *' : 'Rule Name *'} value={fineForm.name} onChange={(v) => setFineForm(f => ({ ...f, name: v }))} />
        <div className="grid grid-cols-2 gap-3">
          <SelectField label={isRtl ? 'نوع الرسوم (اختياري)' : 'Fee Type (optional)'} value={fineForm.feeType}
            onChange={(v) => setFineForm(f => ({ ...f, feeType: v }))}
            options={[{ value: '', label: isRtl ? 'كل الرسوم' : 'All Fee Types' }, ...FEE_TYPES.map(t => ({ value: t, label: t }))]} />
          <InputField label={isRtl ? 'أيام السماحة' : 'Grace Days'} value={fineForm.graceDays} onChange={(v) => setFineForm(f => ({ ...f, graceDays: v }))} type="number" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectField label={isRtl ? 'نوع الغرامة' : 'Fine Calculation'} value={fineForm.fineType} onChange={(v) => setFineForm(f => ({ ...f, fineType: v }))}
            options={[
              { value: 'FIXED_AMOUNT', label: isRtl ? 'مبلغ ثابت' : 'Fixed Amount' },
              { value: 'FIXED_PER_DAY', label: isRtl ? 'ثابت يومياً' : 'Fixed Per Day' },
              { value: 'PERCENTAGE_PER_DAY', label: isRtl ? 'نسبة يومية' : 'Percentage Per Day' },
            ]} />
          <InputField label={isRtl ? 'قيمة الغرامة *' : 'Fine Value *'} value={fineForm.fineValue} onChange={(v) => setFineForm(f => ({ ...f, fineValue: v }))} type="number" placeholder="0" />
        </div>
        <InputField label={isRtl ? 'الحد الأقصى للغرامة (اختياري)' : 'Maximum Fine Cap (optional)'} value={fineForm.maxFine} onChange={(v) => setFineForm(f => ({ ...f, maxFine: v }))} type="number" placeholder="0" />
      </Modal>
    )}

    {/* ── Modal: New Credit Note ─────────────────────────────────────────────── */}
    {showCreditModal && (
      <Modal title={isRtl ? 'إشعار دائن جديد' : 'New Credit Note'} onClose={() => setShowCreditModal(false)}
        loading={createCreditNote.isPending}
        onSubmit={() => {
          if (!creditForm.studentId || !creditForm.amount || !creditForm.reason) { toast.error(isRtl ? 'يرجى ملء الحقول المطلوبة' : 'Fill required fields'); return }
          createCreditNote.mutate({ ...creditForm, amount: +creditForm.amount, invoiceId: creditForm.invoiceId || undefined })
        }}>
        <InputField label={isRtl ? 'معرّف الطالب *' : 'Student ID *'} value={creditForm.studentId} onChange={(v) => setCreditForm(f => ({ ...f, studentId: v }))} placeholder="Student UUID..." />
        <InputField label={isRtl ? 'معرّف الفاتورة (اختياري)' : 'Invoice ID (optional)'} value={creditForm.invoiceId} onChange={(v) => setCreditForm(f => ({ ...f, invoiceId: v }))} placeholder="Invoice UUID..." />
        <InputField label={isRtl ? 'المبلغ *' : 'Amount *'} value={creditForm.amount} onChange={(v) => setCreditForm(f => ({ ...f, amount: v }))} type="number" placeholder="0.00" />
        <InputField label={isRtl ? 'السبب *' : 'Reason *'} value={creditForm.reason} onChange={(v) => setCreditForm(f => ({ ...f, reason: v }))} placeholder={isRtl ? 'سبب الإشعار الدائن...' : 'Reason for credit note...'} />
      </Modal>
    )}

    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'الإدارة المالية' : 'Finance Management'}</h1>
          <p className="text-gray-500 text-sm">{isRtl ? tabTitles[tab].ar : tabTitles[tab].en}</p>
        </div>
        {tab === 'invoices' && (
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="flex items-center gap-2 bg-primary-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-800"
          >
            <Plus size={16} />
            {isRtl ? 'فاتورة جديدة' : 'New Invoice'}
          </button>
        )}
      </div>

      {/* Stats — only on invoices tab */}
      {tab === 'invoices' && (
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
      )}

      {/* ── School Scope Selector ───────────────────────────────────────────── */}
      {mySchools.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide shrink-0">
            {isRtl ? 'النطاق:' : 'Scope:'}
          </span>
          {mySchools.length > 1 && (
            <button
              onClick={() => setSelectedSchoolId(null)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedSchoolId === null
                  ? 'bg-primary-900 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              🏢 {isRtl ? 'الشركة' : 'Company'}
            </button>
          )}
          {mySchools.map((s: any) => (
            <button
              key={s.id}
              onClick={() => setSelectedSchoolId(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedSchoolId === s.id
                  ? 'bg-primary-900 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              🏫 {isRtl ? (s.nameAr || s.name) : s.name}
            </button>
          ))}
        </div>
      )}


      {/* ── Invoices Tab ─────────────────────────────────────────────────────── */}
      {tab === 'invoices' && !selectedSchoolId && <SchoolRequired isRtl={isRtl} label={isRtl ? 'فواتير الطلاب' : 'student invoices'} />}
      {tab === 'invoices' && selectedSchoolId && (
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
                        {inv.status === 'UNPAID' || inv.status === 'OVERDUE' || inv.status === 'PARTIAL' ? (
                          <button
                            onClick={() => setPaymentModal({ invoiceId: inv.id, amount: String(Math.max(0, (inv.total || 0) - (inv.paidAmount || 0))), method: 'CASH' })}
                            className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg transition-colors">
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
      )}

      {/* ── Fees Tab ─────────────────────────────────────────────────────────── */}
      {tab === 'fees' && !selectedSchoolId && <SchoolRequired isRtl={isRtl} label={isRtl ? 'رسوم الطلاب' : 'student fees'} />}
      {tab === 'fees' && selectedSchoolId && (
        <div className="space-y-4">
          {/* Fees Sub-tabs */}
          <div className="flex flex-wrap gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {([
              { key: 'structures', label: isRtl ? 'هياكل الرسوم' : 'Fee Structures' },
              { key: 'templates',  label: isRtl ? 'القوالب'      : 'Templates' },
              { key: 'discounts',  label: isRtl ? 'الخصومات'     : 'Discounts' },
              { key: 'fines',      label: isRtl ? 'الغرامات'     : 'Fine Rules' },
              { key: 'credits',    label: isRtl ? 'إشعارات دائنة': 'Credit Notes' },
            ] as any[]).map((st) => (
              <button key={st.key} onClick={() => setFeesSubTab(st.key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${feesSubTab === st.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {st.label}
              </button>
            ))}
          </div>

          {/* ── Fee Structures ── */}
          {feesSubTab === 'structures' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-900">{isRtl ? 'هياكل الرسوم' : 'Fee Structures'}</h2>
                  <button onClick={() => { setEditingFee(null); setFeeForm({ name: '', nameAr: '', amount: '', currency: 'SAR', feeType: 'TUITION', academicYearId: '', dueDate: '', installmentsAllowed: false }); setShowFeeModal(true) }}
                    className="flex items-center gap-1.5 text-sm px-3 py-2 bg-primary-900 text-white rounded-xl hover:bg-primary-800">
                    <Plus size={14} /> {isRtl ? 'هيكل جديد' : 'New Fee Structure'}
                  </button>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">{isRtl ? 'الاسم' : 'Name'}</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'النوع' : 'Type'}</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">{isRtl ? 'المبلغ' : 'Amount'}</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'تقسيط' : 'Installments'}</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600 hidden md:table-cell">{isRtl ? 'الاستحقاق' : 'Due Date'}</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">{isRtl ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {!feeStructures || feeStructures.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">{isRtl ? 'لا توجد هياكل رسوم' : 'No fee structures yet'}</td></tr>
                    ) : feeStructures.map((fee: any) => (
                      <tr key={fee.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{isRtl ? (fee.nameAr || fee.name) : fee.name}</p>
                          {fee.gradeLevel && <p className="text-xs text-gray-400">{fee.gradeLevel.name}</p>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{fee.feeType}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {Number(fee.amount).toLocaleString()} <span className="text-xs font-normal text-gray-400">{fee.currency}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${fee.installmentsAllowed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                            {fee.installmentsAllowed ? (isRtl ? 'مسموح' : 'Yes') : (isRtl ? 'لا' : 'No')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-500 hidden md:table-cell">
                          {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => {
                              setEditingFee(fee)
                              setFeeForm({ name: fee.name, nameAr: fee.nameAr || '', amount: String(fee.amount), currency: fee.currency || 'SAR', feeType: fee.feeType, academicYearId: fee.academicYearId || '', dueDate: fee.dueDate ? fee.dueDate.slice(0, 10) : '', installmentsAllowed: fee.installmentsAllowed })
                              setShowFeeModal(true)
                            }} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                              {isRtl ? 'تعديل' : 'Edit'}
                            </button>
                            <button onClick={() => { if (confirm(isRtl ? 'هل أنت متأكد من الحذف؟' : 'Delete this fee structure?')) deleteFeeStructure.mutate(fee.id) }}
                              className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                              {isRtl ? 'حذف' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ── Fee Templates ── */}
          {feesSubTab === 'templates' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-900">{isRtl ? 'قوالب الرسوم' : 'Fee Templates'}</h2>
                  <button onClick={() => setShowTemplateModal(true)}
                    className="flex items-center gap-1.5 text-sm px-3 py-2 bg-primary-900 text-white rounded-xl hover:bg-primary-800">
                    <Plus size={14} /> {isRtl ? 'قالب جديد' : 'New Template'}
                  </button>
                </div>
              </CardHeader>
              <CardBody>
                {templatesLoading
                  ? <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
                  : feeTemplates.length === 0
                    ? <p className="text-center py-10 text-gray-400 text-sm">{isRtl ? 'لا توجد قوالب' : 'No templates yet'}</p>
                    : <div className="space-y-3">
                        {feeTemplates.map((tmpl: any) => (
                          <div key={tmpl.id} className="border border-gray-100 rounded-xl p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-gray-900">{tmpl.name}</p>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${tmpl.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                    {tmpl.isActive ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'غير نشط' : 'Inactive')}
                                  </span>
                                </div>
                                <div className="flex gap-3 mt-1 flex-wrap text-xs text-gray-500">
                                  <span>{isRtl ? 'السنة:' : 'Year:'} {tmpl.academicYear}</span>
                                  {tmpl.gradeLevel && <span>{isRtl ? 'المرحلة:' : 'Grade:'} {tmpl.gradeLevel}</span>}
                                  {tmpl.curriculum && <span>{isRtl ? 'المنهج:' : 'Curriculum:'} {tmpl.curriculum}</span>}
                                </div>
                                {tmpl.items?.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {tmpl.items.map((item: any, i: number) => (
                                      <span key={i} className="text-xs bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                                        {item.feeType}{item.label ? ` (${item.label})` : ''}: {Number(item.amount).toLocaleString()} {item.currency}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <button onClick={() => applyTemplate.mutate(tmpl.id)} disabled={applyTemplate.isPending}
                                  className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 disabled:opacity-50">
                                  {isRtl ? 'تطبيق' : 'Apply'}
                                </button>
                                <button onClick={() => { if (confirm(isRtl ? 'حذف القالب؟' : 'Delete template?')) deleteTemplate.mutate(tmpl.id) }}
                                  className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                                  {isRtl ? 'حذف' : 'Delete'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                }
              </CardBody>
            </Card>
          )}

          {/* ── Discount Rules ── */}
          {feesSubTab === 'discounts' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-900">{isRtl ? 'قواعد الخصم والمنح' : 'Discounts & Scholarships'}</h2>
                  <button onClick={() => setShowDiscountModal(true)}
                    className="flex items-center gap-1.5 text-sm px-3 py-2 bg-primary-900 text-white rounded-xl hover:bg-primary-800">
                    <Plus size={14} /> {isRtl ? 'قاعدة جديدة' : 'New Rule'}
                  </button>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">{isRtl ? 'الاسم' : 'Name'}</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'النوع' : 'Type'}</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">{isRtl ? 'القيمة' : 'Value'}</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">{isRtl ? 'الرسوم المطبق عليها' : 'Applies To'}</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'الحالة' : 'Status'}</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">{isRtl ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {discountsLoading ? (
                      Array.from({ length: 3 }).map((_, i) => <tr key={i}><td colSpan={6} className="p-3"><Skeleton className="h-8" /></td></tr>)
                    ) : discountRules.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">{isRtl ? 'لا توجد قواعد خصم' : 'No discount rules'}</td></tr>
                    ) : discountRules.map((rule: any) => (
                      <tr key={rule.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{isRtl ? (rule.nameAr || rule.name) : rule.name}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            rule.type === 'SIBLING'        ? 'bg-purple-100 text-purple-700' :
                            rule.type === 'EMPLOYEE_CHILD' ? 'bg-blue-100 text-blue-700' :
                            rule.type === 'SCHOLARSHIP'    ? 'bg-emerald-100 text-emerald-700' :
                            rule.type === 'EARLY_PAYMENT'  ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-600'}`}>{rule.type}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-700">
                          {Number(rule.value).toLocaleString()}{rule.type === 'PERCENTAGE' || rule.type === 'SCHOLARSHIP' ? '%' : ''}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                          {rule.feeTypes?.length > 0 ? rule.feeTypes.join(', ') : (isRtl ? 'جميع الرسوم' : 'All fees')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${rule.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                            {rule.isActive ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'غير نشط' : 'Inactive')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => { if (confirm(isRtl ? 'حذف قاعدة الخصم؟' : 'Delete this rule?')) deleteDiscountRule.mutate(rule.id) }}
                            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                            {isRtl ? 'حذف' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ── Fine Rules ── */}
          {feesSubTab === 'fines' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-900">{isRtl ? 'قواعد الغرامات والعقوبات' : 'Fine & Penalty Rules'}</h2>
                  <div className="flex gap-2">
                    <button onClick={() => applyFines.mutate()} disabled={applyFines.isPending}
                      className="flex items-center gap-1.5 text-sm px-3 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50">
                      {applyFines.isPending ? '...' : (isRtl ? 'تطبيق الغرامات الآن' : 'Apply Fines Now')}
                    </button>
                    <button onClick={() => setShowFineModal(true)}
                      className="flex items-center gap-1.5 text-sm px-3 py-2 bg-primary-900 text-white rounded-xl hover:bg-primary-800">
                      <Plus size={14} /> {isRtl ? 'قاعدة جديدة' : 'New Rule'}
                    </button>
                  </div>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">{isRtl ? 'الاسم' : 'Name'}</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'نوع الرسوم' : 'Fee Type'}</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'أيام السماحة' : 'Grace Days'}</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'نوع الاحتساب' : 'Calc Type'}</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">{isRtl ? 'القيمة' : 'Value'}</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">{isRtl ? 'الحد الأقصى' : 'Max'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {finesLoading ? (
                      Array.from({ length: 3 }).map((_, i) => <tr key={i}><td colSpan={6} className="p-3"><Skeleton className="h-8" /></td></tr>)
                    ) : fineRules.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">{isRtl ? 'لا توجد قواعد غرامات' : 'No fine rules yet'}</td></tr>
                    ) : fineRules.map((rule: any) => (
                      <tr key={rule.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{rule.name}</td>
                        <td className="px-4 py-3 text-center text-gray-500 text-xs">{rule.feeType || (isRtl ? 'الكل' : 'All')}</td>
                        <td className="px-4 py-3 text-center text-gray-500">{rule.graceDays} {isRtl ? 'يوم' : 'd'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600">{rule.fineType}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-red-600">{Number(rule.fineValue).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-gray-400 text-xs">{rule.maxFine ? Number(rule.maxFine).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ── Credit Notes ── */}
          {feesSubTab === 'credits' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-900">{isRtl ? 'الإشعارات الدائنة' : 'Credit Notes'}</h2>
                  <button onClick={() => setShowCreditModal(true)}
                    className="flex items-center gap-1.5 text-sm px-3 py-2 bg-primary-900 text-white rounded-xl hover:bg-primary-800">
                    <Plus size={14} /> {isRtl ? 'إشعار جديد' : 'New Credit Note'}
                  </button>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">{isRtl ? 'المبلغ' : 'Amount'}</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">{isRtl ? 'السبب' : 'Reason'}</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'الحالة' : 'Status'}</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600 hidden md:table-cell">{isRtl ? 'التاريخ' : 'Date'}</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">{isRtl ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {creditNotesLoading ? (
                      Array.from({ length: 3 }).map((_, i) => <tr key={i}><td colSpan={5} className="p-3"><Skeleton className="h-8" /></td></tr>)
                    ) : creditNotes.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-12 text-gray-400 text-sm">{isRtl ? 'لا توجد إشعارات دائنة' : 'No credit notes'}</td></tr>
                    ) : creditNotes.map((cn: any) => (
                      <tr key={cn.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{Number(cn.amount).toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-600">{cn.reason}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            cn.status === 'APPLIED'  ? 'bg-green-100 text-green-700' :
                            cn.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                            cn.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'}`}>{cn.status}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-400 hidden md:table-cell">
                          {new Date(cn.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            {cn.status === 'PENDING' && (
                              <button onClick={() => approveCreditNote.mutate(cn.id)} disabled={approveCreditNote.isPending}
                                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50">
                                {isRtl ? 'موافقة' : 'Approve'}
                              </button>
                            )}
                            {cn.status === 'APPROVED' && (
                              <button onClick={() => applyCreditNote.mutate(cn.id)} disabled={applyCreditNote.isPending}
                                className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 disabled:opacity-50">
                                {isRtl ? 'تطبيق' : 'Apply'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Chart of Accounts Tab ────────────────────────────────────────────── */}
      {tab === 'accounts' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">{isRtl ? 'دليل الحسابات' : 'Chart of Accounts'}</h2>
              <div className="flex gap-2">
                <button onClick={() => setShowAccountModal(true)}
                  className="text-xs px-3 py-1.5 bg-primary-900 text-white rounded-lg hover:bg-primary-800">
                  <Plus size={12} className="inline mr-1" />{isRtl ? 'حساب جديد' : 'New Account'}
                </button>
                <button onClick={() => seedAccounts.mutate()} disabled={seedAccounts.isPending}
                  className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                  {seedAccounts.isPending ? '...' : isRtl ? 'إنشاء حسابات افتراضية' : 'Seed Defaults'}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            {accounts.length === 0
              ? <p className="text-sm text-gray-400 text-center py-8">{isRtl ? 'لا توجد حسابات. انقر على "إنشاء حسابات افتراضية" للبدء.' : 'No accounts. Click "Seed Defaults" to get started.'}</p>
              : <div className="space-y-1">
                  {accounts.map((acc: any) => (
                    <div key={acc.id} onClick={() => setGlAccountId(acc.id)}
                      className={`flex items-center justify-between py-1.5 px-3 rounded-lg cursor-pointer hover:bg-gray-50 ${glAccountId === acc.id ? 'bg-primary-50 border border-primary-100' : ''} ${acc.parentId ? 'ml-4 pl-6 border-l-2 border-gray-100' : 'font-semibold'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-gray-400 w-14">{acc.code}</span>
                        <span className="text-sm text-gray-800">{acc.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          acc.type === 'ASSET' ? 'bg-blue-50 text-blue-600' :
                          acc.type === 'LIABILITY' ? 'bg-red-50 text-red-600' :
                          acc.type === 'EQUITY' ? 'bg-purple-50 text-purple-600' :
                          acc.type === 'REVENUE' ? 'bg-green-50 text-green-600' :
                          'bg-orange-50 text-orange-600'}`}>{acc.type}</span>
                        <span className="text-xs text-primary-500 opacity-0 group-hover:opacity-100">{isRtl ? 'دفتر الأستاذ' : 'Ledger'}</span>
                      </div>
                    </div>
                  ))}
                </div>
            }

            {/* General Ledger Drill-down */}
            {glAccountId && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <BookOpen size={16} className="text-primary-600" />
                    {isRtl ? 'دفتر الأستاذ العام' : 'General Ledger'}
                    {generalLedger?.account && (
                      <span className="text-sm font-normal text-gray-500">— {generalLedger.account.code} {generalLedger.account.name}</span>
                    )}
                  </h3>
                  <button onClick={() => setGlAccountId(null)} className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1">
                    <X size={12} /> {isRtl ? 'إغلاق' : 'Close'}
                  </button>
                </div>
                {glLoading ? (
                  <div className="space-y-1">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {[isRtl ? 'التاريخ' : 'Date', isRtl ? 'رقم القيد' : 'Entry #', isRtl ? 'البيان' : 'Description', isRtl ? 'مدين' : 'Debit', isRtl ? 'دائن' : 'Credit', isRtl ? 'الرصيد' : 'Balance'].map(h => (
                            <th key={h} className="text-start font-semibold text-gray-500 px-3 py-2">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {(generalLedger?.lines ?? []).map((line: any, i: number) => (
                          <tr key={i} className="hover:bg-gray-50/50">
                            <td className="px-3 py-2 text-gray-600">{new Date(line.date).toLocaleDateString()}</td>
                            <td className="px-3 py-2 font-mono text-gray-600">{line.entryNumber}</td>
                            <td className="px-3 py-2 text-gray-800">{line.description}</td>
                            <td className="px-3 py-2 text-right text-blue-700 font-medium">{line.debit > 0 ? line.debit.toLocaleString() : '—'}</td>
                            <td className="px-3 py-2 text-right text-red-600 font-medium">{line.credit > 0 ? line.credit.toLocaleString() : '—'}</td>
                            <td className={`px-3 py-2 text-right font-bold ${line.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>{line.balance.toLocaleString()}</td>
                          </tr>
                        ))}
                        {(generalLedger?.lines ?? []).length === 0 && (
                          <tr><td colSpan={6} className="text-center py-8 text-gray-400">{isRtl ? 'لا توجد حركات' : 'No transactions'}</td></tr>
                        )}
                      </tbody>
                      {generalLedger?.lines?.length > 0 && (
                        <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                          <tr>
                            <td colSpan={3} className="px-3 py-2 font-bold text-gray-700">{isRtl ? 'الإجمالي' : 'Total'}</td>
                            <td className="px-3 py-2 text-right font-bold text-blue-700">{generalLedger.totalDebit?.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right font-bold text-red-600">{generalLedger.totalCredit?.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right font-bold text-gray-900">{generalLedger.closingBalance?.toLocaleString()}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ── Journal Entries Tab ──────────────────────────────────────────────── */}
      {tab === 'journal' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">{isRtl ? 'القيود اليومية' : 'Journal Entries'}</h2>
              <button onClick={() => setShowJEForm(true)}
                className="flex items-center gap-1.5 text-sm px-3 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700">
                <Plus size={14} /> {isRtl ? 'قيد جديد' : 'New Entry'}
              </button>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            {jeLoading
              ? <div className="p-4 space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
              : journalEntries.length === 0
                ? <p className="text-center py-8 text-gray-400 text-sm">{isRtl ? 'لا توجد قيود' : 'No journal entries'}</p>
                : <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">{isRtl ? 'رقم القيد' : 'Entry #'}</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">{isRtl ? 'التاريخ' : 'Date'}</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">{isRtl ? 'الوصف' : 'Description'}</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'الحالة' : 'Status'}</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-600">{isRtl ? 'إجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {journalEntries.map((je: any) => (
                        <tr key={je.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">{je.entryNumber}</td>
                          <td className="px-4 py-3 text-gray-600">{new Date(je.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-gray-800">{je.description}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              je.status === 'POSTED' ? 'bg-green-100 text-green-700' :
                              je.status === 'REVERSED' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'}`}>{je.status}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {je.status === 'DRAFT' && (
                              <button onClick={() => postJE.mutate(je.id)} disabled={postJE.isPending}
                                className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 disabled:opacity-50">
                                {isRtl ? 'ترحيل' : 'Post'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
            }
          </div>
        </Card>
      )}

      {/* ── Payroll Tab ───────────────────────────────────────────────────────── */}
      {tab === 'payroll' && (
        <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900">{isRtl ? 'دورات الرواتب' : 'Payroll Runs'}</h2>
                <button onClick={() => setShowRunForm(!showRunForm)}
                  className="flex items-center gap-1.5 text-sm px-3 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700">
                  <Plus size={14} /> {isRtl ? 'دورة جديدة' : 'New Run'}
                </button>
              </div>
              {showRunForm && (
                <div className="mt-4 flex items-end gap-3 flex-wrap">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">{isRtl ? 'الشهر' : 'Month'}</label>
                    <select value={newRunMonth} onChange={e => setNewRunMonth(+e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
                      {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('en', { month: 'long' })}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">{isRtl ? 'السنة' : 'Year'}</label>
                    <input type="number" value={newRunYear} onChange={e => setNewRunYear(+e.target.value)} min={2020} max={2030}
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-24" />
                  </div>
                  <button onClick={() => { createPayrollRun.mutate({ month: newRunMonth, year: newRunYear }); setShowRunForm(false) }}
                    disabled={createPayrollRun.isPending}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700 disabled:opacity-50">
                    {isRtl ? 'إنشاء' : 'Create'}
                  </button>
                  <button onClick={() => setShowRunForm(false)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              )}
            </CardHeader>
            <div className="overflow-x-auto">
              {payrollLoading
                ? <div className="p-4 space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
                : payrollRuns.length === 0
                  ? <p className="text-center py-8 text-gray-400 text-sm">{isRtl ? 'لا توجد دورات رواتب' : 'No payroll runs yet'}</p>
                  : <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">{isRtl ? 'الفترة' : 'Period'}</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-600">{isRtl ? 'إجمالي الرواتب' : 'Gross'}</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-600">{isRtl ? 'الخصومات' : 'Deductions'}</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-600">{isRtl ? 'الصافي' : 'Net Pay'}</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'الحالة' : 'Status'}</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-600">{isRtl ? 'إجراءات' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {payrollRuns.map((run: any) => (
                          <tr key={run.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">{run.month}/{run.year}</td>
                            <td className="px-4 py-3 text-right text-gray-700">{Number(run.totalGross).toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-red-600">({Number(run.totalDeductions).toLocaleString()})</td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-700">{Number(run.totalNet).toLocaleString()}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                run.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                                run.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                                run.status === 'PROCESSING' ? 'bg-amber-100 text-amber-700' :
                                'bg-gray-100 text-gray-600'}`}>{run.status}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-1">
                                {run.status === 'DRAFT' && (
                                  <button onClick={() => processPayroll.mutate(run.id)} disabled={processPayroll.isPending}
                                    className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 disabled:opacity-50">
                                    {isRtl ? 'معالجة' : 'Process'}
                                  </button>
                                )}
                                {run.status === 'PROCESSING' && (
                                  <button onClick={() => approvePayroll.mutate(run.id)} disabled={approvePayroll.isPending}
                                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50">
                                    {isRtl ? 'موافقة' : 'Approve'}
                                  </button>
                                )}
                                {run.status === 'APPROVED' && (
                                  <button onClick={() => payPayroll.mutate(run.id)} disabled={payPayroll.isPending}
                                    className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 disabled:opacity-50">
                                    {isRtl ? 'صرف' : 'Pay'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
              }
            </div>
          </Card>
      )}

      {/* ── Staff Loans Tab ───────────────────────────────────────────────────── */}
      {tab === 'loans' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">{isRtl ? 'سلف الموظفين' : 'Staff Loans'}</h2>
              <button onClick={() => setShowLoanModal(true)}
                className="flex items-center gap-1.5 text-sm px-3 py-2 bg-primary-900 text-white rounded-xl hover:bg-primary-800">
                <Plus size={14} /> {isRtl ? 'طلب سلفة' : 'Request Loan'}
              </button>
            </div>
          </CardHeader>
          <CardBody>
            {loans.length === 0
              ? <p className="text-center py-6 text-gray-400 text-sm">{isRtl ? 'لا توجد سلف' : 'No loans'}</p>
              : <div className="space-y-2">
                  {loans.map((loan: any) => (
                    <div key={loan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium text-sm text-gray-800">{loan.staff?.user?.profile?.firstName} {loan.staff?.user?.profile?.lastName}</p>
                        <p className="text-xs text-gray-500">{Number(loan.amount).toLocaleString()} · {loan.totalInstallments} {isRtl ? 'قسط' : 'installments'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          loan.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                          loan.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          loan.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'}`}>{loan.status}</span>
                        {loan.status === 'PENDING' && (
                          <button onClick={() => approveLoan.mutate(loan.id)} disabled={approveLoan.isPending}
                            className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200">
                            {isRtl ? 'موافقة' : 'Approve'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
            }
          </CardBody>
        </Card>
      )}

      {/* ── Expenses Tab ──────────────────────────────────────────────────────── */}
      {tab === 'expenses' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">{isRtl ? 'مطالبات المصروفات' : 'Expense Claims'}</h2>
              <button onClick={() => setShowExpenseModal(true)}
                className="flex items-center gap-1.5 text-sm px-3 py-2 bg-primary-900 text-white rounded-xl hover:bg-primary-800">
                <Plus size={14} /> {isRtl ? 'تقديم مصروف' : 'Submit Expense'}
              </button>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            {expLoading
              ? <div className="p-4 space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
              : expenses.length === 0
                ? <p className="text-center py-8 text-gray-400 text-sm">{isRtl ? 'لا توجد مطالبات' : 'No expense claims'}</p>
                : <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">{isRtl ? 'العنوان' : 'Title'}</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">{isRtl ? 'الفئة' : 'Category'}</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-600">{isRtl ? 'المبلغ' : 'Amount'}</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'الحالة' : 'Status'}</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-600">{isRtl ? 'إجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {expenses.map((exp: any) => (
                        <tr key={exp.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800">{exp.title}</p>
                            <p className="text-xs text-gray-400">{new Date(exp.date).toLocaleDateString()}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{exp.category}</td>
                          <td className="px-4 py-3 text-right font-bold">{Number(exp.amount).toLocaleString()} {exp.currency}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              exp.status === 'REIMBURSED' ? 'bg-emerald-100 text-emerald-700' :
                              exp.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                              exp.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'}`}>{exp.status}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              {exp.status === 'PENDING' && (
                                <button onClick={() => approveExpense.mutate(exp.id)} disabled={approveExpense.isPending}
                                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                                  {isRtl ? 'موافقة' : 'Approve'}
                                </button>
                              )}
                              {exp.status === 'APPROVED' && (
                                <button onClick={() => reimburseExpense.mutate(exp.id)} disabled={reimburseExpense.isPending}
                                  className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200">
                                  {isRtl ? 'صرف' : 'Reimburse'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
            }
          </div>
        </Card>
      )}

      {/* ── Bank Accounts Tab ────────────────────────────────────────────────── */}
      {tab === 'bank' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">{isRtl ? 'الحسابات البنكية' : 'Bank Accounts'}</h2>
              <button onClick={() => setShowBankModal(true)}
                className="flex items-center gap-1.5 text-sm px-3 py-2 bg-primary-900 text-white rounded-xl hover:bg-primary-800">
                <Plus size={14} /> {isRtl ? 'إضافة حساب' : 'New Bank Account'}
              </button>
            </div>
          </CardHeader>
          <CardBody>
            {bankLoading
              ? <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
              : bankAccounts.length === 0
                ? <p className="text-center py-10 text-gray-400 text-sm">{isRtl ? 'لا توجد حسابات بنكية مضافة' : 'No bank accounts configured'}</p>
                : <div className="space-y-3">
                    {bankAccounts.map((ba: any) => (
                      <div key={ba.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-semibold text-gray-900">{ba.name}</p>
                          <p className="text-sm text-gray-500">{ba.bankName} · {ba.accountNumber ? `****${ba.accountNumber.slice(-4)}` : '—'}</p>
                          {ba.iban && <p className="text-xs text-gray-400 font-mono mt-0.5">{ba.iban}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{Number(ba.currentBalance || 0).toLocaleString()}</p>
                          <p className="text-xs text-gray-400">{ba.currency}</p>
                        </div>
                      </div>
                    ))}
                  </div>
            }
          </CardBody>
        </Card>
      )}

      {/* ── Budget Tab ────────────────────────────────────────────────────────── */}
      {tab === 'budget' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowBudgetModal(true)}
              className="flex items-center gap-1.5 text-sm px-3 py-2 bg-primary-900 text-white rounded-xl hover:bg-primary-800">
              <Plus size={14} /> {isRtl ? 'ميزانية جديدة' : 'New Budget'}
            </button>
          </div>
          {budgetLoading
            ? <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
            : budgets.length === 0
              ? <Card><CardBody><p className="text-center py-8 text-gray-400 text-sm">{isRtl ? 'لا توجد ميزانيات' : 'No budgets created'}</p></CardBody></Card>
              : budgets.map((b: any) => (
                  <Card key={b.id} className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-gray-900">{b.name}</p>
                        <p className="text-sm text-gray-500">{isRtl ? 'السنة المالية' : 'Fiscal Year'}: {b.fiscalYear}</p>
                        <div className="flex gap-2 mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            b.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                            b.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'}`}>{b.status}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">{Number(b.totalAmount).toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{isRtl ? 'إجمالي الميزانية' : 'Total Budget'}</p>
                        {b.status === 'DRAFT' && (
                          <button onClick={() => approveBudget.mutate(b.id)} disabled={approveBudget.isPending}
                            className="mt-2 text-xs px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                            {isRtl ? 'اعتماد' : 'Approve'}
                          </button>
                        )}
                      </div>
                    </div>
                    {b.items?.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {b.items.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <p className="text-sm text-gray-600 flex-1">{item.category}</p>
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                              <div className="bg-emerald-500 h-1.5 rounded-full"
                                style={{ width: `${Math.min(100, (Number(item.actualSpent) / Number(item.amount)) * 100)}%` }} />
                            </div>
                            <p className="text-xs text-gray-500 w-28 text-right">
                              {Number(item.actualSpent).toLocaleString()} / {Number(item.amount).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))
          }
        </div>
      )}

      {/* ── Reports Tab ───────────────────────────────────────────────────────── */}
      {tab === 'reports' && !selectedSchoolId && <SchoolRequired isRtl={isRtl} label={isRtl ? 'التقارير المالية' : 'financial reports'} />}
      {tab === 'reports' && selectedSchoolId && (
        <div className="space-y-6">
          {/* Outstanding Fees */}
          <Card>
            <CardHeader>
              <h2 className="font-bold text-gray-900">{isRtl ? 'تقرير المستحقات المتأخرة' : 'Outstanding Fees Report'}</h2>
            </CardHeader>
            <CardBody>
              {!outstandingReport
                ? <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
                : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-3">
                      {Object.entries(outstandingReport.buckets || {}).map(([k, v]: any) => (
                        <div key={k} className="bg-gray-50 rounded-xl p-3 text-center">
                          <p className="text-lg font-bold text-gray-800">{Number(v).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{isRtl ? 'أيام' : 'days'}: {k}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center py-2 border-t">
                      <p className="text-sm font-semibold text-gray-700">{isRtl ? 'إجمالي المستحقات' : 'Total Outstanding'}</p>
                      <p className="text-lg font-bold text-red-600">{Number(outstandingReport.totalOutstanding || 0).toLocaleString()}</p>
                    </div>
                  </div>
                )
              }
            </CardBody>
          </Card>

          {/* Collection Report */}
          <Card>
            <CardHeader>
              <h2 className="font-bold text-gray-900">{isRtl ? 'تقرير التحصيل' : 'Collection Report'} — {new Date().getFullYear()}</h2>
            </CardHeader>
            <CardBody>
              {!collectionReport
                ? <div className="space-y-2">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
                : (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <p className="text-gray-600">{isRtl ? 'إجمالي المحصّل' : 'Total Collected'}</p>
                      <p className="font-bold text-emerald-600">{Number(collectionReport.totalCollected || 0).toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-gray-600">{isRtl ? 'عدد المعاملات' : 'Transaction Count'}</p>
                      <p className="font-bold">{collectionReport.transactionCount || 0}</p>
                    </div>
                    {collectionReport.byGateway && Object.entries(collectionReport.byGateway).map(([gw, amt]: any) => (
                      <div key={gw} className="flex justify-between text-sm">
                        <p className="text-gray-500">{gw}</p>
                        <p className="font-medium">{Number(amt).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )
              }
            </CardBody>
          </Card>

          {/* Quick reports — inline display */}
          <QuickReports isRtl={isRtl} />
        </div>
      )}

      {/* ── Payments Tab ─────────────────────────────────────────────────────── */}
      {tab === 'payments' && (
        <div className="space-y-6">
          {/* Header + actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold text-gray-900 text-lg">{isRtl ? 'سجل المدفوعات' : 'Payment History'}</h2>
            <button onClick={() => setShowAdvanceModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-900 text-white rounded-xl text-sm font-medium hover:bg-primary-800">
              <Plus size={14} /> {isRtl ? 'دفعة مقدمة' : 'Advance Payment'}
            </button>
          </div>

          {/* Filters */}
          <Card>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <select value={payHistoryFilter.gateway} onChange={e => { setPayHistoryFilter(f => ({ ...f, gateway: e.target.value })); setPayPage(1) }}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500">
                  <option value="">{isRtl ? 'كل الطرق' : 'All Gateways'}</option>
                  {['CASH','CARD','BANK_TRANSFER','CHEQUE','STRIPE','APPLE_PAY','GOOGLE_PAY','POS_TERMINAL','TAP','PAYMOB','MOYASAR'].map(g => (
                    <option key={g} value={g}>{g.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                <select value={payHistoryFilter.status} onChange={e => { setPayHistoryFilter(f => ({ ...f, status: e.target.value })); setPayPage(1) }}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500">
                  <option value="">{isRtl ? 'كل الحالات' : 'All Statuses'}</option>
                  <option value="SUCCESS">{isRtl ? 'ناجح' : 'Success'}</option>
                  <option value="PENDING">{isRtl ? 'معلق' : 'Pending'}</option>
                  <option value="REVERSED">{isRtl ? 'معكوس' : 'Reversed'}</option>
                  <option value="FAILED">{isRtl ? 'فاشل' : 'Failed'}</option>
                </select>
                <input type="date" value={payHistoryFilter.from} onChange={e => { setPayHistoryFilter(f => ({ ...f, from: e.target.value })); setPayPage(1) }}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500" />
                <input type="date" value={payHistoryFilter.to} onChange={e => { setPayHistoryFilter(f => ({ ...f, to: e.target.value })); setPayPage(1) }}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500" />
              </div>
            </CardBody>
          </Card>

          {/* Payment history table */}
          <Card>
            <div className="overflow-x-auto">
              {payHistoryLoading ? (
                <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
              ) : !paymentHistory?.data?.length ? (
                <div className="text-center py-14 text-gray-400">
                  <DollarSign size={36} className="mx-auto mb-2 opacity-30" />
                  <p>{isRtl ? 'لا توجد مدفوعات' : 'No payments found'}</p>
                </div>
              ) : (
                <>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="px-4 py-3 text-start font-semibold text-gray-600">{isRtl ? 'الطالب' : 'Student'}</th>
                        <th className="px-4 py-3 text-start font-semibold text-gray-600 hidden md:table-cell">{isRtl ? 'الفاتورة' : 'Invoice'}</th>
                        <th className="px-4 py-3 text-end font-semibold text-gray-600">{isRtl ? 'المبلغ' : 'Amount'}</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-600 hidden md:table-cell">{isRtl ? 'الطريقة' : 'Gateway'}</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'الحالة' : 'Status'}</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-600 hidden md:table-cell">{isRtl ? 'التاريخ' : 'Date'}</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'إجراء' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paymentHistory.data.map((pay: any) => {
                        const student = pay.invoice?.student?.profile
                        const statusColor: Record<string, string> = {
                          SUCCESS: 'text-green-700 bg-green-50', PENDING: 'text-yellow-700 bg-yellow-50',
                          REVERSED: 'text-red-700 bg-red-50', FAILED: 'text-red-700 bg-red-50',
                        }
                        return (
                          <tr key={pay.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900 text-sm">
                                {student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : '—'}
                              </p>
                              {student?.studentId && <p className="text-xs text-gray-400">#{student.studentId}</p>}
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell text-gray-500 text-xs">
                              {pay.invoice?.description || '—'}<br />
                              <span className="text-gray-400">#{pay.invoice?.invoiceNumber || pay.invoiceId?.slice(0, 8)}</span>
                            </td>
                            <td className="px-4 py-3 text-end font-semibold text-gray-900">
                              {pay.amount?.toLocaleString()} <span className="text-xs text-gray-400">{pay.currency}</span>
                            </td>
                            <td className="px-4 py-3 text-center hidden md:table-cell">
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{pay.gateway?.replace(/_/g, ' ')}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-xs px-2 py-1 rounded-lg font-medium ${statusColor[pay.status] || 'text-gray-600 bg-gray-100'}`}>
                                {pay.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-xs text-gray-500 hidden md:table-cell">
                              {pay.paidAt ? new Date(pay.paidAt).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US') : '—'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {pay.status === 'SUCCESS' && (
                                <button onClick={() => { if (confirm(isRtl ? 'هل تريد عكس هذه الدفعة؟' : 'Reverse this payment?')) reversePaymentMutation.mutate(pay.id) }}
                                  disabled={reversePaymentMutation.isPending}
                                  className="text-xs text-red-600 hover:underline disabled:opacity-50">
                                  {isRtl ? 'عكس' : 'Reverse'}
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {/* Pagination */}
                  {paymentHistory.meta?.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                      <button onClick={() => setPayPage(p => Math.max(1, p - 1))} disabled={payPage === 1}
                        className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40">{isRtl ? 'السابق' : 'Previous'}</button>
                      <span className="text-xs text-gray-400">{payPage} / {paymentHistory.meta.totalPages}</span>
                      <button onClick={() => setPayPage(p => Math.min(paymentHistory.meta.totalPages, p + 1))} disabled={payPage === paymentHistory.meta.totalPages}
                        className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40">{isRtl ? 'التالي' : 'Next'}</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Advance Payments */}
          {advancePayments.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-gray-900">{isRtl ? 'الدفعات المقدمة (أرصدة العملاء)' : 'Advance Payments (Student Credits)'}</h3>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-4 py-3 text-start font-semibold text-gray-600">{isRtl ? 'الطالب' : 'Student'}</th>
                      <th className="px-4 py-3 text-end font-semibold text-gray-600">{isRtl ? 'المبلغ' : 'Amount'}</th>
                      <th className="px-4 py-3 text-end font-semibold text-gray-600">{isRtl ? 'الرصيد المتبقي' : 'Balance'}</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'التاريخ' : 'Date'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {advancePayments.map((ap: any) => (
                      <tr key={ap.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">
                            {ap.student?.profile ? `${ap.student.profile.firstName || ''} ${ap.student.profile.lastName || ''}`.trim() : ap.studentId.slice(0, 8)}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-end font-semibold">{ap.amount?.toLocaleString()} {ap.currency}</td>
                        <td className="px-4 py-3 text-end">
                          <span className="text-green-700 font-semibold">{ap.balance?.toLocaleString()} {ap.currency}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-gray-500">
                          {new Date(ap.createdAt).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Advance Payment Modal ──────────────────────────────────────────────── */}
      {showAdvanceModal && (
        <Modal title={isRtl ? 'تسجيل دفعة مقدمة' : 'Record Advance Payment'} onClose={() => setShowAdvanceModal(false)}
          loading={createAdvanceMutation.isPending}
          onSubmit={() => {
            if (!advForm.studentId || !advForm.amount) { toast.error(isRtl ? 'يرجى ملء الحقول المطلوبة' : 'Fill required fields'); return }
            createAdvanceMutation.mutate({ ...advForm, amount: +advForm.amount })
          }}>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{isRtl ? 'الطالب' : 'Student'}</label>
            <input value={advStudentSearch} placeholder={isRtl ? 'ابحث بالاسم...' : 'Search student...'}
              onChange={(e) => { setAdvStudentSearch(e.target.value); searchAdvStudents(e.target.value) }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
            {advStudentResults.length > 0 && !advForm.studentId && (
              <div className="mt-1 border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                {advStudentResults.map((s: any) => (
                  <button key={s.id} onClick={() => { setAdvForm(f => ({ ...f, studentId: s.id })); setAdvStudentSearch(`${s.profile?.firstName || ''} ${s.profile?.lastName || ''}`.trim()); setAdvStudentResults([]) }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0">
                    {s.profile?.firstName} {s.profile?.lastName}
                    {s.profile?.studentId && <span className="text-gray-400 ml-2">#{s.profile.studentId}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <InputField label={isRtl ? 'المبلغ' : 'Amount'} value={advForm.amount} onChange={v => setAdvForm(f => ({ ...f, amount: v }))} type="number" placeholder="0.00" />
          <SelectField label={isRtl ? 'العملة' : 'Currency'} value={advForm.currency} onChange={v => setAdvForm(f => ({ ...f, currency: v }))}
            options={[{ value: 'SAR', label: 'SAR' }, { value: 'USD', label: 'USD' }, { value: 'EGP', label: 'EGP' }, { value: 'AED', label: 'AED' }]} />
          <SelectField label={isRtl ? 'طريقة الدفع' : 'Payment Method'} value={advForm.gateway} onChange={v => setAdvForm(f => ({ ...f, gateway: v }))}
            options={[
              { value: 'CASH', label: 'Cash' }, { value: 'CARD', label: 'Card' },
              { value: 'BANK_TRANSFER', label: 'Bank Transfer' }, { value: 'CHEQUE', label: 'Cheque' },
            ]} />
          <InputField label={isRtl ? 'ملاحظات' : 'Notes'} value={advForm.notes} onChange={v => setAdvForm(f => ({ ...f, notes: v }))} placeholder={isRtl ? 'اختياري...' : 'Optional...'} />
        </Modal>
      )}

      {/* ── Procurement Tab ──────────────────────────────────────────────────── */}
      {tab === 'procurement' && (
        <div className="space-y-8">
          {procLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
          ) : (
            <>
              {/* ── 1. PRICED: Awaiting Finance Pre-Approval ── */}
              <ProcurementSection
                icon={<DollarSign size={16} className="text-purple-600" />}
                title="Awaiting Your Pre-Approval"
                subtitle="Review the pricing and decide: approve directly or escalate to owner"
                color="purple"
                count={pricedReqs.length}
                empty="No priced requisitions awaiting your approval."
              >
                {pricedReqs.map((r) => (
                  <ReqCard key={r.id} r={r} expandedId={expandedId} setExpandedId={setExpandedId}
                    rejectId={rejectId} setRejectId={setRejectId}
                    rejectReason={rejectReason} setRejectReason={setRejectReason}
                    rejectMutation={rejectMutation}
                    statusBadge={<span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 whitespace-nowrap">Awaiting Finance</span>}
                    actions={
                      <div className="flex gap-2">
                        <button
                          onClick={() => directApproveMutation.mutate(r.id)}
                          disabled={directApproveMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle size={14} /> Approve Directly
                        </button>
                        <button
                          onClick={() => escalateMutation.mutate(r.id)}
                          disabled={escalateMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
                        >
                          <ArrowUpRight size={14} /> Escalate to Owner
                        </button>
                        {rejectId !== r.id && (
                          <button
                            onClick={() => { setRejectId(r.id); setRejectReason('') }}
                            className="px-3 py-2 rounded-xl border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors"
                          >
                            <XCircle size={15} />
                          </button>
                        )}
                      </div>
                    }
                  />
                ))}
              </ProcurementSection>

              {/* ── 2. FINANCE_APPROVED: Escalated, Awaiting Owner ── */}
              {escalatedReqs.length > 0 && (
                <ProcurementSection
                  icon={<ArrowUpRight size={16} className="text-indigo-600" />}
                  title="Escalated — Awaiting Owner Decision"
                  subtitle="These have been sent to the owner for final approval"
                  color="indigo"
                  count={escalatedReqs.length}
                  empty=""
                >
                  {escalatedReqs.map((r) => (
                    <ReqCard key={r.id} r={r} expandedId={expandedId} setExpandedId={setExpandedId}
                      statusBadge={<span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 whitespace-nowrap">With Owner</span>}
                      infoOnly="Waiting for owner to approve or reject."
                    />
                  ))}
                </ProcurementSection>
              )}

              {/* ── 3. APPROVED: Release Money to RM ── */}
              <ProcurementSection
                icon={<DollarSign size={16} className="text-green-600" />}
                title="Approved — Release Money to Requisitions Manager"
                subtitle="Owner or Finance approved. Release the funds so RM can purchase."
                color="green"
                count={approvedReqs.length}
                empty="No approved requisitions awaiting money release."
              >
                {approvedReqs.map((r) => (
                  <ReqCard key={r.id} r={r} expandedId={expandedId} setExpandedId={setExpandedId}
                    statusBadge={<span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-800 whitespace-nowrap">Approved</span>}
                    actions={
                      <button
                        onClick={() => releaseMutation.mutate(r.id)}
                        disabled={releaseMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        <DollarSign size={14} /> Release Money to RM
                      </button>
                    }
                  />
                ))}
              </ProcurementSection>

              {/* ── 4. MONEY_RELEASED / MONEY_RECEIVED: RM has the money ── */}
              {moneyOutReqs.length > 0 && (
                <ProcurementSection
                  icon={<Truck size={16} className="text-amber-600" />}
                  title="RM Has the Money — Purchasing in Progress"
                  subtitle="Requisitions Manager received funds and is purchasing items"
                  color="amber"
                  count={moneyOutReqs.length}
                  empty=""
                >
                  {moneyOutReqs.map((r) => (
                    <ReqCard key={r.id} r={r} expandedId={expandedId} setExpandedId={setExpandedId}
                      statusBadge={
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${r.status === 'MONEY_RECEIVED' ? 'bg-amber-100 text-amber-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {r.status === 'MONEY_RECEIVED' ? 'Money Confirmed by RM' : 'Money Released'}
                        </span>
                      }
                      infoOnly={r.status === 'MONEY_RECEIVED' ? 'RM confirmed receipt of funds. Purchasing in progress.' : 'Money released. Awaiting RM confirmation.'}
                    />
                  ))}
                </ProcurementSection>
              )}

              {/* ── 5. PURCHASED: RM Bought Items — Invoice Available ── */}
              {purchasedReqs.length > 0 && (
                <ProcurementSection
                  icon={<Package size={16} className="text-blue-600" />}
                  title="RM Purchased Items — Awaiting Store Confirmation"
                  subtitle="RM uploaded invoice. Store will confirm items received."
                  color="blue"
                  count={purchasedReqs.length}
                  empty=""
                >
                  {purchasedReqs.map((r) => (
                    <ReqCard key={r.id} r={r} expandedId={expandedId} setExpandedId={setExpandedId}
                      statusBadge={<span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 whitespace-nowrap">Purchased</span>}
                      invoices={r.purchaseInvoiceUrls ?? []}
                      infoOnly="Waiting for Store Manager to confirm receipt of all items."
                    />
                  ))}
                </ProcurementSection>
              )}

              {/* ── 6. STORE_CONFIRMED / STORE_ISSUE: Close Requisition ── */}
              <ProcurementSection
                icon={<CheckCircle size={16} className="text-teal-600" />}
                title="Store Confirmed — Close Requisition"
                subtitle="Store received items. Review any issues and close."
                color="teal"
                count={storeReqs.length}
                empty="No requisitions awaiting final close."
              >
                {storeReqs.map((r) => (
                  <ReqCard key={r.id} r={r} expandedId={expandedId} setExpandedId={setExpandedId}
                    statusBadge={
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${r.storeHasIssue ? 'bg-red-100 text-red-800' : 'bg-teal-100 text-teal-800'}`}>
                        {r.storeHasIssue ? 'Store Issue' : 'Store Confirmed'}
                      </span>
                    }
                    storeReceivedItems={r.storeReceivedItems}
                    storeNotes={r.storeNotes}
                    invoices={r.purchaseInvoiceUrls ?? []}
                    actions={
                      <button
                        onClick={() => completeMutation.mutate(r.id)}
                        disabled={completeMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors"
                      >
                        <CheckCircle size={14} /> Close & Mark Completed
                      </button>
                    }
                  />
                ))}
              </ProcurementSection>
            </>
          )}
        </div>
      )}

      {/* ── Fiscal Years Tab ──────────────────────────────────────────────────── */}
      {tab === 'fiscal-years' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">{isRtl ? 'السنوات المالية' : 'Fiscal Years'}</h2>
            <button onClick={() => setShowFiscalYearModal(true)}
              className="flex items-center gap-1.5 text-sm px-4 py-2 bg-primary-900 text-white rounded-xl hover:bg-primary-800">
              <Plus size={14} /> {isRtl ? 'سنة مالية جديدة' : 'New Fiscal Year'}
            </button>
          </div>

          {fyLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : (fiscalYears ?? []).length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Calendar size={40} className="mx-auto mb-3 opacity-20" />
              <p>{isRtl ? 'لا توجد سنوات مالية' : 'No fiscal years yet'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(fiscalYears ?? []).map((fy: any) => (
                <Card key={fy.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900">{fy.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(fy.startDate).toLocaleDateString()} – {new Date(fy.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${fy.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {fy.status === 'OPEN' ? (isRtl ? 'مفتوحة' : 'Open') : (isRtl ? 'مغلقة' : 'Closed')}
                        </span>
                        {fy.status === 'OPEN' && (
                          <button onClick={() => closeFiscalYearMutation.mutate(fy.id)}
                            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700">
                            {isRtl ? 'إغلاق السنة' : 'Close Year'}
                          </button>
                        )}
                        <button onClick={() => setSelectedFyId(selectedFyId === fy.id ? '' : fy.id)}
                          className="text-xs px-3 py-1.5 border border-primary-200 rounded-lg hover:bg-primary-50 text-primary-700">
                          {selectedFyId === fy.id ? (isRtl ? 'إخفاء الفترات' : 'Hide Periods') : (isRtl ? 'الفترات المحاسبية' : 'Periods')}
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  {selectedFyId === fy.id && (
                    <CardBody className="pt-0">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {(fy.periods ?? []).map((p: any) => (
                          <div key={p.id} className={`rounded-xl p-3 text-xs ${p.status === 'OPEN' ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-gray-100'}`}>
                            <p className="font-semibold text-gray-800">{p.name}</p>
                            <p className={`mt-1 font-medium ${p.status === 'OPEN' ? 'text-green-600' : 'text-gray-500'}`}>
                              {p.status === 'OPEN' ? (isRtl ? 'مفتوحة' : 'Open') : (isRtl ? 'مغلقة' : 'Closed')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* New Fiscal Year Modal */}
          {showFiscalYearModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md">
                <CardHeader><h3 className="font-bold text-gray-900">{isRtl ? 'سنة مالية جديدة' : 'New Fiscal Year'}</h3></CardHeader>
                <CardBody className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{isRtl ? 'الاسم' : 'Name'}</label>
                    <input value={fyForm.name} onChange={e => setFyForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="FY 2025-2026"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{isRtl ? 'تاريخ البداية' : 'Start Date'}</label>
                      <input type="date" value={fyForm.startDate} onChange={e => setFyForm(p => ({ ...p, startDate: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{isRtl ? 'تاريخ النهاية' : 'End Date'}</label>
                      <input type="date" value={fyForm.endDate} onChange={e => setFyForm(p => ({ ...p, endDate: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => { createFiscalYearMutation.mutate(fyForm); setShowFiscalYearModal(false) }}
                      disabled={!fyForm.name || !fyForm.startDate || !fyForm.endDate}
                      className="flex-1 bg-primary-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary-800 disabled:opacity-50">
                      {isRtl ? 'إنشاء' : 'Create'}
                    </button>
                    <button onClick={() => setShowFiscalYearModal(false)}
                      className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">
                      {isRtl ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ── Cost Centers Tab ──────────────────────────────────────────────────── */}
      {tab === 'cost-centers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{isRtl ? 'مراكز التكلفة' : 'Cost Centers'}</h2>
              <p className="text-sm text-gray-500">{isRtl ? 'تنظيم المصروفات حسب القسم أو المشروع' : 'Organize expenses by department or project'}</p>
            </div>
            <button onClick={() => setShowCostCenterModal(true)}
              className="flex items-center gap-1.5 text-sm px-4 py-2 bg-primary-900 text-white rounded-xl hover:bg-primary-800">
              <Plus size={14} /> {isRtl ? 'مركز جديد' : 'New Cost Center'}
            </button>
          </div>

          {ccLoading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : (costCenters ?? []).length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Building2 size={40} className="mx-auto mb-3 opacity-20" />
              <p>{isRtl ? 'لا توجد مراكز تكلفة' : 'No cost centers yet'}</p>
            </div>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-start text-xs font-semibold text-gray-500 px-4 py-3">{isRtl ? 'الكود' : 'Code'}</th>
                      <th className="text-start text-xs font-semibold text-gray-500 px-4 py-3">{isRtl ? 'الاسم' : 'Name'}</th>
                      <th className="text-start text-xs font-semibold text-gray-500 px-4 py-3">{isRtl ? 'الوصف' : 'Description'}</th>
                      <th className="text-start text-xs font-semibold text-gray-500 px-4 py-3">{isRtl ? 'الحالة' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(costCenters ?? []).map((cc: any) => (
                      <tr key={cc.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{cc.code}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{isRtl ? (cc.nameAr || cc.name) : cc.name}</p>
                          {cc.nameAr && !isRtl && <p className="text-xs text-gray-400">{cc.nameAr}</p>}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{cc.description || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cc.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {cc.isActive ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'غير نشط' : 'Inactive')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* New Cost Center Modal */}
          {showCostCenterModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md">
                <CardHeader><h3 className="font-bold text-gray-900">{isRtl ? 'مركز تكلفة جديد' : 'New Cost Center'}</h3></CardHeader>
                <CardBody className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{isRtl ? 'الكود' : 'Code'} *</label>
                      <input value={ccForm.code} onChange={e => setCcForm(p => ({ ...p, code: e.target.value }))}
                        placeholder="CC-001"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{isRtl ? 'الاسم' : 'Name'} *</label>
                      <input value={ccForm.name} onChange={e => setCcForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Administration"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{isRtl ? 'الاسم بالعربية' : 'Arabic Name'}</label>
                    <input value={ccForm.nameAr} onChange={e => setCcForm(p => ({ ...p, nameAr: e.target.value }))}
                      placeholder="الإدارة" dir="rtl"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{isRtl ? 'الوصف' : 'Description'}</label>
                    <textarea value={ccForm.description} onChange={e => setCcForm(p => ({ ...p, description: e.target.value }))}
                      rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => { createCostCenterMutation.mutate(ccForm); setShowCostCenterModal(false); setCcForm({ code: '', name: '', nameAr: '', description: '' }) }}
                      disabled={!ccForm.code || !ccForm.name}
                      className="flex-1 bg-primary-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary-800 disabled:opacity-50">
                      {isRtl ? 'إنشاء' : 'Create'}
                    </button>
                    <button onClick={() => setShowCostCenterModal(false)}
                      className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">
                      {isRtl ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  </>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ProcurementSection({
  icon, title, subtitle, color, count, empty, children,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  color: string
  count: number
  empty: string
  children?: React.ReactNode
}) {
  const badgeMap: Record<string, string> = {
    purple: 'bg-purple-100 text-purple-700', green: 'bg-green-100 text-green-700',
    teal: 'bg-teal-100 text-teal-700', amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-blue-100 text-blue-700', indigo: 'bg-indigo-100 text-indigo-700',
  }
  return (
    <div>
      <div className="flex items-start gap-2 mb-3">
        {icon}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-gray-900">{title}</h2>
            {count > 0 && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeMap[color] || badgeMap.blue}`}>{count}</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {count === 0 ? (
        <p className="text-sm text-gray-400 py-4 pl-6">{empty}</p>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </div>
  )
}

function ReqCard({
  r, expandedId, setExpandedId, statusBadge,
  rejectId, setRejectId, rejectReason, setRejectReason, rejectMutation,
  actions, infoOnly, invoices, storeReceivedItems, storeNotes,
}: any) {
  const isExpanded = expandedId === r.id
  const hasIssues = r.storeHasIssue && storeReceivedItems

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{r.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {r.school?.name} · {r.category} · {new Date(r.createdAt).toLocaleDateString()}
          </p>
          {r.requestedBy && (
            <p className="text-xs text-gray-400 mt-0.5">
              By: {r.requestedBy?.profile?.firstName} {r.requestedBy?.profile?.lastName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {statusBadge}
          {r.pricedItems && r.pricedItems.length > 0 && (
            <button onClick={() => setExpandedId(isExpanded ? null : r.id)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <Eye size={14} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Priced items breakdown (expandable) */}
      {isExpanded && r.pricedItems && r.pricedItems.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-3 mb-3 space-y-1">
          {r.pricedItems.map((it: any, i: number) => (
            <div key={i} className="flex justify-between text-sm">
              <span>{it.name} × {it.qty} {it.unit} @ {it.pricePerUnit?.toFixed(2)}/unit</span>
              <span className="font-medium">{it.total?.toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t pt-1 flex justify-between text-sm font-bold">
            <span>Total Cost</span>
            <span className="text-purple-700">{(r.totalPriced ?? 0).toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Store issue comparison */}
      {hasIssues && (
        <div className="bg-red-50 rounded-xl p-3 mb-3">
          <p className="text-xs font-semibold text-red-700 mb-2">Store Issue — Before vs After</p>
          {(storeReceivedItems as any[]).map((item: any, i: number) => {
            const diff = item.receivedQty < item.orderedQty
            return (
              <div key={i} className={`text-xs mb-1 flex justify-between ${diff ? 'text-red-700' : 'text-gray-600'}`}>
                <span>{item.name}</span>
                <span>Ordered: {item.orderedQty} → Received: {item.receivedQty} {item.unit} {diff ? '⚠️' : '✓'}</span>
              </div>
            )
          })}
          {storeNotes && <p className="text-xs text-red-600 mt-2 italic">"{storeNotes}"</p>}
        </div>
      )}

      {/* Invoice links */}
      {invoices && invoices.length > 0 && (
        <div className="mb-3 space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase">Invoices</p>
          {invoices.map((url: string, i: number) => (
            <a key={i} href={url} target="_blank" rel="noreferrer"
              className="block text-xs text-blue-600 hover:underline truncate">{url}</a>
          ))}
        </div>
      )}

      {/* Inline reject form */}
      {rejectId === r.id && (
        <div className="mb-3 space-y-2">
          <input value={rejectReason} onChange={(e: any) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection (required)"
            className="w-full border border-red-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400" />
          <div className="flex gap-2">
            <button onClick={() => rejectMutation.mutate({ id: r.id, reason: rejectReason })}
              disabled={!rejectReason || rejectMutation.isPending}
              className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50">
              Confirm Reject
            </button>
            <button onClick={() => { setRejectId(null); setRejectReason('') }}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Info-only message */}
      {infoOnly && !actions && (
        <p className="text-xs text-gray-400 italic mt-1">{infoOnly}</p>
      )}

      {/* Action buttons */}
      {actions}
    </div>
  )
}

export default function AdminFinancePage() {
  return (
    <Suspense>
      <AdminFinancePageInner />
    </Suspense>
  )
}
