'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { apiClient } from '@/lib/api'
import { useSchoolContext } from '@/stores/schoolContextStore'
import {
  Banknote, Send, Save, AlertCircle, CheckCircle2, Clock, XCircle,
  ChevronRight, ArrowLeft, Building2, Briefcase,
} from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']

const STATUS_CONFIG: Record<string, { label: string; labelAr: string; color: string }> = {
  DRAFT:           { label: 'Draft',                labelAr: 'مسودة',              color: 'bg-gray-100 text-gray-700' },
  SUBMITTED:       { label: 'Submitted to Finance', labelAr: 'أُرسل للمالية',      color: 'bg-blue-100 text-blue-700' },
  FINANCE_REJECTED:{ label: 'Finance Rejected',     labelAr: 'مرفوض من المالية',   color: 'bg-red-100 text-red-700' },
  OWNER_PENDING:   { label: 'Awaiting Owner',       labelAr: 'بانتظار المالك',     color: 'bg-yellow-100 text-yellow-700' },
  OWNER_APPROVED:  { label: 'Owner Approved',       labelAr: 'موافقة المالك',      color: 'bg-green-100 text-green-700' },
  OWNER_REJECTED:  { label: 'Owner Rejected',       labelAr: 'مرفوض من المالك',   color: 'bg-red-100 text-red-700' },
  IN_PAYMENT:      { label: 'In Transfer',          labelAr: 'قيد التحويل',        color: 'bg-purple-100 text-purple-700' },
  PAID:            { label: 'Paid',                 labelAr: 'تم الدفع',           color: 'bg-green-100 text-green-700' },
  CLOSED:          { label: 'Closed',               labelAr: 'مغلق',               color: 'bg-gray-100 text-gray-500' },
}

const CURRICULUM_COLORS: Record<string, string> = {
  BRITISH: 'bg-blue-900', AMERICAN: 'bg-red-700', IB: 'bg-green-700',
  NATIONAL: 'bg-indigo-700', MIXED: 'bg-purple-700', CUSTOM: 'bg-gray-600',
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Entity { id: string | null; name: string; nameAr: string; curriculumType?: string; logo?: string | null }

// ── Sub-components ────────────────────────────────────────────────────────────

function TimelineStep({ done, pending, rejected, label, note }: {
  done?: boolean; pending?: boolean; rejected?: boolean; label: string; note?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
        done ? 'bg-green-500' : rejected ? 'bg-red-500' : pending ? 'bg-blue-400 animate-pulse' : 'bg-gray-200'
      }`}>
        {done && <CheckCircle2 size={12} className="text-white" />}
        {rejected && <XCircle size={12} className="text-white" />}
        {pending && <Clock size={10} className="text-white" />}
      </div>
      <div>
        <p className={`text-sm font-medium ${done ? 'text-gray-800' : rejected ? 'text-red-700' : pending ? 'text-blue-700' : 'text-gray-400'}`}>{label}</p>
        {note && <p className="text-xs text-gray-500 mt-0.5">{note}</p>}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SalaryPreparationPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const qc = useQueryClient()
  const { schools, setSelectedSchool } = useSchoolContext()
  const now = new Date()

  // 4-level drill-down state
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  // Batch detail state
  const [lines, setLines] = useState<Record<string, { baseSalary: string; bonus: string; deductions: string; notes: string }>>({})
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submitNote, setSubmitNote] = useState('')
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>()

  // Build entity list: Company + all schools
  const entities: Entity[] = [
    { id: null, name: 'Company Staff', nameAr: 'موظفو الشركة', curriculumType: 'CUSTOM' },
    ...schools.map(s => ({ id: s.id, name: s.name, nameAr: s.nameAr, curriculumType: s.curriculumType, logo: s.logo })),
  ]

  // Level 2: years to show (last 3 years + next year)
  const years = [now.getFullYear() + 1, now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2]

  // Level 3: fetch all batches for entity to show status per month card
  const schoolHeader = selectedEntity?.id ?? '__company__'

  const { data: allBatches = [] } = useQuery<any[]>({
    queryKey: ['hr-salary-batches', schoolHeader, selectedYear],
    queryFn: () => apiClient.get('/salary/batches', {
      headers: { 'x-school-id': schoolHeader },
      params: { year: selectedYear },
    }).then((r: any) => r.data?.data ?? r.data ?? []),
    enabled: !!selectedEntity && selectedYear !== null,
  })

  // Level 4: load/create batch
  const { data: batch, isLoading: batchLoading, refetch: refetchBatch } = useQuery<any>({
    queryKey: ['hr-salary-batch-detail', schoolHeader, selectedMonth, selectedYear],
    queryFn: async () => {
      const res = await apiClient.post('/salary/batches/prepare', { month: selectedMonth, year: selectedYear }, {
        headers: { 'x-school-id': schoolHeader },
      }).then((r: any) => r.data?.data ?? r.data)
      // Init local editable lines
      const init: Record<string, any> = {}
      for (const l of res.lines ?? []) {
        init[l.staffId] = {
          baseSalary: String(Number(l.baseSalary)),
          bonus:      String(Number(l.bonus)),
          deductions: String(Number(l.deductions)),
          notes:      l.notes ?? '',
        }
      }
      setLines(init)
      setDirty(false)
      return res
    },
    enabled: !!selectedEntity && selectedMonth !== null && selectedYear !== null,
  })

  const isEditable = !batch || ['DRAFT', 'FINANCE_REJECTED', 'OWNER_REJECTED'].includes(batch.status)
  const currency = batch?.orgCurrency ?? batch?.school?.currency ?? 'SAR'

  // Auto-save
  const handleChange = (staffId: string, field: string, value: string) => {
    setLines(prev => ({ ...prev, [staffId]: { ...prev[staffId], [field]: value } }))
    setDirty(true)
    clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => saveLines(), 2000)
  }

  const saveLines = useCallback(async () => {
    if (!batch) return
    setSaving(true)
    try {
      const payload = Object.entries(lines).map(([staffId, l]) => {
        const base  = parseFloat(l.baseSalary) || 0
        const bonus = parseFloat(l.bonus) || 0
        const ded   = parseFloat(l.deductions) || 0
        return { staffId, baseSalary: base, bonus, deductions: ded, notes: l.notes }
      })
      await apiClient.patch(`/salary/batches/${batch.id}/lines`, { lines: payload })
      await refetchBatch()
      setDirty(false)
    } catch {}
    setSaving(false)
  }, [batch, lines, refetchBatch])

  const submitToFinance = async () => {
    if (!batch) return
    await saveLines()
    setSubmitting(true)
    try {
      await apiClient.post(`/salary/batches/${batch.id}/submit`, { note: submitNote })
      await refetchBatch()
      qc.invalidateQueries({ queryKey: ['hr-salary-batches'] })
      setShowSubmitModal(false)
      setSubmitNote('')
    } catch {}
    setSubmitting(false)
  }

  const netOf = (staffId: string) => {
    const l = lines[staffId]
    if (!l) return 0
    return (parseFloat(l.baseSalary) || 0) + (parseFloat(l.bonus) || 0) - (parseFloat(l.deductions) || 0)
  }

  const totalBase  = Object.values(lines).reduce((s, l) => s + (parseFloat(l.baseSalary) || 0), 0)
  const totalBonus = Object.values(lines).reduce((s, l) => s + (parseFloat(l.bonus) || 0), 0)
  const totalDed   = Object.values(lines).reduce((s, l) => s + (parseFloat(l.deductions) || 0), 0)
  const totalNet   = totalBase + totalBonus - totalDed

  const selectEntity = (e: Entity) => {
    setSelectedEntity(e)
    setSelectedYear(null)
    setSelectedMonth(null)
    setSelectedSchool(e.id ?? '__company__')
  }

  const selectYear = (y: number) => {
    setSelectedYear(y)
    setSelectedMonth(null)
  }

  const selectMonth = (m: number) => {
    setSelectedMonth(m)
    setLines({})
    setDirty(false)
  }

  const goBack = () => {
    if (selectedMonth !== null) { setSelectedMonth(null); setLines({}); setDirty(false) }
    else if (selectedYear !== null) setSelectedYear(null)
    else setSelectedEntity(null)
  }

  // ── Breadcrumb ───────────────────────────────────────────────────────────────
  const Breadcrumb = () => (
    <div className="flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
      <button onClick={() => { setSelectedEntity(null); setSelectedYear(null); setSelectedMonth(null) }}
        className="hover:text-indigo-600 font-medium">
        {isRtl ? 'الكيانات' : 'Entities'}
      </button>
      {selectedEntity && (
        <>
          <ChevronRight size={14} />
          <button onClick={() => { setSelectedYear(null); setSelectedMonth(null) }} className="hover:text-indigo-600">
            {isRtl ? selectedEntity.nameAr : selectedEntity.name}
          </button>
        </>
      )}
      {selectedYear !== null && (
        <>
          <ChevronRight size={14} />
          <button onClick={() => setSelectedMonth(null)} className="hover:text-indigo-600">{selectedYear}</button>
        </>
      )}
      {selectedMonth !== null && (
        <>
          <ChevronRight size={14} />
          <span className="text-gray-800 font-semibold">{isRtl ? MONTHS_AR[selectedMonth - 1] : MONTHS[selectedMonth - 1]}</span>
        </>
      )}
    </div>
  )

  // ── Level 1: Entity Cards ────────────────────────────────────────────────────
  if (!selectedEntity) {
    return (
      <div className="p-6 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Banknote size={22} className="text-indigo-600" />
            {isRtl ? 'إعداد الرواتب' : 'Salary Preparation'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{isRtl ? 'اختر الكيان للبدء' : 'Select an entity to begin'}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {entities.map(e => {
            const bg = CURRICULUM_COLORS[e.curriculumType ?? 'CUSTOM'] ?? 'bg-gray-600'
            return (
              <button key={e.id ?? '__company__'} onClick={() => selectEntity(e)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow text-left">
                <div className={`h-2 ${bg}`} />
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2.5 rounded-xl">
                      {e.id === null ? <Briefcase size={20} className="text-indigo-600" /> : <Building2 size={20} className="text-indigo-600" />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{isRtl ? e.nameAr : e.name}</p>
                      {e.id === null && <p className="text-xs text-gray-500">{isRtl ? 'مستوى المؤسسة' : 'Organization Level'}</p>}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Level 2: Year List ────────────────────────────────────────────────────────
  if (selectedYear === null) {
    return (
      <div className="p-6 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="p-2 hover:bg-gray-100 rounded-xl"><ArrowLeft size={18} /></button>
          <div>
            <Breadcrumb />
            <h1 className="text-xl font-bold text-gray-900 mt-1">{isRtl ? 'اختر السنة' : 'Select Year'}</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {years.map(y => (
            <button key={y} onClick={() => selectYear(y)}
              className={`px-8 py-5 rounded-2xl border text-lg font-bold transition-colors ${
                y === now.getFullYear()
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-white text-gray-800 border-gray-200 hover:border-indigo-400'
              }`}>
              {y}
              {y === now.getFullYear() && <span className="block text-xs font-normal mt-0.5 opacity-80">★ {isRtl ? 'الحالية' : 'current'}</span>}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Level 3: Month Grid ───────────────────────────────────────────────────────
  if (selectedMonth === null) {
    return (
      <div className="p-6 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="p-2 hover:bg-gray-100 rounded-xl"><ArrowLeft size={18} /></button>
          <div>
            <Breadcrumb />
            <h1 className="text-xl font-bold text-gray-900 mt-1">{isRtl ? 'اختر الشهر' : 'Select Month'}</h1>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {MONTHS.map((m, i) => {
            const mNum = i + 1
            const existingBatch = allBatches.find((b: any) => b.month === mNum)
            const isCurrent = selectedYear === now.getFullYear() && mNum === now.getMonth() + 1
            const cfg = existingBatch ? STATUS_CONFIG[existingBatch.status] : null

            return (
              <button key={mNum} onClick={() => selectMonth(mNum)}
                className={`rounded-2xl border p-4 text-left transition-shadow hover:shadow-md ${
                  existingBatch ? 'bg-white border-gray-200' : 'bg-white border-dashed border-gray-300'
                } ${isCurrent ? 'ring-2 ring-indigo-400' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-800">{isRtl ? MONTHS_AR[i] : m}</span>
                  {isCurrent && <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
                </div>
                {cfg ? (
                  <>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                      {isRtl ? cfg.labelAr : cfg.label}
                    </span>
                    <p className="text-xs text-gray-500 mt-1.5">
                      {existingBatch.lines?.length ?? 0} {isRtl ? 'موظف' : 'employees'}
                    </p>
                    <p className="text-sm font-bold text-indigo-700 mt-0.5">
                      {Number(existingBatch.totalNet).toLocaleString()} {currency}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">{isRtl ? 'لا بيانات — انقر للإنشاء' : 'No data — click to create'}</p>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Level 4: Batch Detail ─────────────────────────────────────────────────────
  const statusCfg = batch ? STATUS_CONFIG[batch.status] : null

  return (
    <div className="p-6 space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={goBack} className="p-2 hover:bg-gray-100 rounded-xl shrink-0"><ArrowLeft size={18} /></button>
        <div className="flex-1 min-w-0">
          <Breadcrumb />
          <h1 className="text-xl font-bold text-gray-900 mt-1 flex items-center gap-2">
            <Banknote size={20} className="text-indigo-600" />
            {isRtl ? 'تفاصيل الرواتب' : 'Salary Batch'}
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {statusCfg && (
            <span className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full ${statusCfg.color}`}>
              {isRtl ? statusCfg.labelAr : statusCfg.label}
            </span>
          )}
          {isEditable && batch && (
            <>
              <button onClick={saveLines} disabled={saving || !dirty}
                className="flex items-center gap-1.5 border border-gray-200 px-3 py-2 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-40">
                <Save size={14} /> {saving ? '...' : (isRtl ? 'حفظ' : 'Save')}
                {dirty && <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />}
              </button>
              <button onClick={() => setShowSubmitModal(true)}
                className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700">
                <Send size={14} /> {isRtl ? 'إرسال للمالية' : 'Send to Finance'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Rejection alert */}
      {batch?.rejectionReason && ['FINANCE_REJECTED','OWNER_REJECTED'].includes(batch.status) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">
              {batch.status === 'FINANCE_REJECTED'
                ? (isRtl ? 'تم الرفض من قِبَل إدارة المالية' : 'Rejected by Finance')
                : (isRtl ? 'تم الرفض من قِبَل المالك' : 'Rejected by Owner')}
            </p>
            <p className="text-sm text-red-600 mt-0.5">{batch.rejectionReason}</p>
            <p className="text-xs text-red-500 mt-1">{isRtl ? 'يمكنك تعديل الرواتب وإعادة الإرسال' : 'You can edit salaries and resubmit'}</p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      {batch && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: isRtl ? 'الراتب الأساسي' : 'Base Salary', value: totalBase, color: 'text-gray-800' },
            { label: isRtl ? 'المكافآت' : 'Bonuses',           value: totalBonus, color: 'text-emerald-600' },
            { label: isRtl ? 'الخصومات' : 'Deductions',        value: totalDed,   color: 'text-red-500' },
            { label: isRtl ? 'صافي الرواتب' : 'Net Payroll',   value: totalNet,   color: 'text-indigo-700' },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 font-medium">{c.label}</p>
              <p className={`text-xl font-bold mt-1 ${c.color}`}>
                {c.value.toLocaleString()} <span className="text-xs font-normal text-gray-400">{currency}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Salary table */}
      {batchLoading ? (
        <div className="animate-pulse space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}</div>
      ) : batch ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/60">
                {[
                  isRtl ? 'الموظف' : 'Employee',
                  isRtl ? 'الراتب الأساسي' : 'Base Salary',
                  isRtl ? 'المكافأة' : 'Bonus',
                  isRtl ? 'الخصومات' : 'Deductions',
                  isRtl ? 'صافي الراتب' : 'Net Pay',
                  isRtl ? 'ملاحظات' : 'Notes',
                ].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {batch.lines.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-14 text-gray-400 text-sm">
                  {isRtl ? 'لا يوجد موظفون' : 'No staff found'}
                </td></tr>
              ) : batch.lines.map((line: any) => {
                const l = lines[line.staffId] ?? { baseSalary: '0', bonus: '0', deductions: '0', notes: '' }
                const net = netOf(line.staffId)
                const name = [line.staff?.user?.profile?.firstName, line.staff?.user?.profile?.lastName].filter(Boolean).join(' ') || line.staff?.user?.email

                return (
                  <tr key={line.staffId} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{name}</p>
                      <p className="text-xs text-gray-400">{line.staff?.user?.email}</p>
                    </td>
                    {(['baseSalary', 'bonus', 'deductions'] as const).map(field => (
                      <td key={field} className="px-4 py-2">
                        <input
                          type="number" min="0"
                          value={l[field]}
                          onChange={e => handleChange(line.staffId, field, e.target.value)}
                          disabled={!isEditable}
                          className="w-32 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-50 disabled:text-gray-400"
                        />
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${net < 0 ? 'text-red-600' : 'text-indigo-700'}`}>
                        {net.toLocaleString()} <span className="text-xs font-normal text-gray-400">{currency}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text" value={l.notes}
                        onChange={e => handleChange(line.staffId, 'notes', e.target.value)}
                        disabled={!isEditable}
                        placeholder={isRtl ? 'ملاحظة...' : 'Note...'}
                        className="w-32 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-50 disabled:text-gray-400"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {batch.lines.length > 0 && (
              <tfoot>
                <tr className="border-t border-gray-100 bg-indigo-50/50">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-700">
                    {isRtl ? `الإجمالي (${batch.lines.length} موظف)` : `Total (${batch.lines.length} employees)`}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-800">{totalBase.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-bold text-emerald-600">+{totalBonus.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-bold text-red-500">-{totalDed.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-bold text-indigo-700">{totalNet.toLocaleString()} {currency}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      ) : null}

      {/* Status timeline — shown when not DRAFT */}
      {batch && batch.status !== 'DRAFT' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-4">{isRtl ? 'مسار الموافقة' : 'Approval Timeline'}</p>
          <div className="space-y-3">
            <TimelineStep done label={isRtl ? 'أُعدّت من قِبَل HR' : 'Prepared by HR'} note={batch.submissionNote} />
            <TimelineStep
              done={['FINANCE_REJECTED','OWNER_PENDING','OWNER_APPROVED','OWNER_REJECTED','IN_PAYMENT','PAID','CLOSED'].includes(batch.status)}
              pending={batch.status === 'SUBMITTED'}
              rejected={batch.status === 'FINANCE_REJECTED'}
              label={isRtl ? 'مراجعة المالية' : 'Finance Review'}
              note={batch.financeNote ?? (batch.status === 'FINANCE_REJECTED' ? batch.rejectionReason : undefined)}
            />
            <TimelineStep
              done={['OWNER_APPROVED','IN_PAYMENT','PAID','CLOSED'].includes(batch.status)}
              pending={batch.status === 'OWNER_PENDING'}
              rejected={batch.status === 'OWNER_REJECTED'}
              label={isRtl ? 'موافقة المالك' : 'Owner Approval'}
              note={batch.status === 'OWNER_REJECTED' ? batch.rejectionReason : undefined}
            />
            <TimelineStep
              done={['PAID','CLOSED'].includes(batch.status)}
              pending={batch.status === 'IN_PAYMENT'}
              label={isRtl ? 'تحويل الرواتب' : 'Salary Transfer'}
            />
            <TimelineStep
              done={batch.status === 'CLOSED'}
              label={isRtl ? 'إغلاق الشهر' : 'Month Closed'}
            />
          </div>
        </div>
      )}

      {/* Submit modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <h2 className="font-bold text-gray-900">{isRtl ? 'إرسال الرواتب للمالية' : 'Send to Finance'}</h2>
            <p className="text-sm text-gray-500">
              {isRtl
                ? `إجمالي صافي الرواتب: ${totalNet.toLocaleString()} ${currency} لـ ${batch?.lines.length} موظف`
                : `Total net payroll: ${totalNet.toLocaleString()} ${currency} for ${batch?.lines.length} employees`}
            </p>
            <div>
              <label className="text-xs text-gray-500 font-medium">{isRtl ? 'ملاحظة للمالية (اختياري)' : 'Note to Finance (optional)'}</label>
              <textarea value={submitNote} onChange={e => setSubmitNote(e.target.value)} rows={3}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div className="flex gap-2">
              <button onClick={submitToFinance} disabled={submitting}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">
                {submitting ? '...' : (isRtl ? 'إرسال' : 'Send')}
              </button>
              <button onClick={() => setShowSubmitModal(false)}
                className="px-4 border border-gray-200 rounded-xl text-sm">{isRtl ? 'إلغاء' : 'Cancel'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
