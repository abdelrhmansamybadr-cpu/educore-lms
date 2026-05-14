'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { apiClient } from '@/lib/api'
import { useSchoolContext } from '@/stores/schoolContextStore'
import {
  Banknote, CheckCircle2, XCircle, Clock, AlertCircle,
  ChevronRight, ArrowLeft, Building2, Briefcase, FileDown,
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

// ── PDF Export ────────────────────────────────────────────────────────────────

function printSalaryBatch(batch: any, entityName: string, currency: string, monthName: string) {
  const lines = batch.lines ?? []
  const rows = lines.map((l: any) => {
    const name = [l.staff?.user?.profile?.firstName, l.staff?.user?.profile?.lastName].filter(Boolean).join(' ') || l.staff?.user?.email
    return `<tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${name}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${Number(l.baseSalary).toLocaleString()}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${Number(l.bonus).toLocaleString()}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${Number(l.deductions).toLocaleString()}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-weight:bold">${Number(l.netPay).toLocaleString()} ${currency}</td>
    </tr>`
  }).join('')

  const html = `<!DOCTYPE html><html><head><title>Salary Report — ${entityName} — ${monthName} ${batch.year}</title>
  <style>body{font-family:sans-serif;padding:40px;color:#333}h1{font-size:22px;margin-bottom:4px}p{color:#666;font-size:14px}table{width:100%;border-collapse:collapse;margin-top:24px}th{background:#f5f5f5;padding:10px 8px;text-align:left;font-size:13px;border-bottom:2px solid #ddd}td{font-size:13px}tfoot td{background:#f9f9f9;font-weight:bold;padding:10px 8px;border-top:2px solid #ddd}</style>
  </head><body>
  <h1>Salary Report</h1>
  <p>${entityName} &mdash; ${monthName} ${batch.year} &mdash; Status: ${batch.status}</p>
  <table>
    <thead><tr><th>Employee</th><th style="text-align:right">Base Salary</th><th style="text-align:right">Bonus</th><th style="text-align:right">Deductions</th><th style="text-align:right">Net Pay</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr>
      <td>Total (${lines.length} employees)</td>
      <td style="text-align:right">${Number(batch.totalBaseSalary).toLocaleString()}</td>
      <td style="text-align:right">+${Number(batch.totalBonus).toLocaleString()}</td>
      <td style="text-align:right">-${Number(batch.totalDeductions).toLocaleString()}</td>
      <td style="text-align:right">${Number(batch.totalNet).toLocaleString()} ${currency}</td>
    </tr></tfoot>
  </table>
  <script>window.onload=()=>window.print()</script>
  </body></html>`

  const w = window.open('', '_blank')
  if (w) { w.document.write(html); w.document.close() }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Entity { id: string | null; name: string; nameAr: string; curriculumType?: string; logo?: string | null }

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SalaryApprovalsPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const qc = useQueryClient()
  const { schools, setSelectedSchool } = useSchoolContext()
  const now = new Date()

  // 4-level drill-down state
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  // Reject modal state
  const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // Build entity list
  const entities: Entity[] = [
    { id: null, name: 'Company Staff', nameAr: 'موظفو الشركة', curriculumType: 'CUSTOM' },
    ...schools.map(s => ({ id: s.id, name: s.name, nameAr: s.nameAr, curriculumType: s.curriculumType, logo: s.logo })),
  ]

  const years = [now.getFullYear() + 1, now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2]
  const schoolHeader = selectedEntity?.id ?? '__company__'

  // Level 3: all batches for entity+year (filter client-side by entity)
  const { data: allBatches = [] } = useQuery<any[]>({
    queryKey: ['owner-salary-batches-list', schoolHeader, selectedYear],
    queryFn: () => apiClient.get('/salary/batches/for-owner', {
      params: { year: selectedYear },
    }).then((r: any) => {
      const all = r.data?.data ?? r.data ?? []
      return all.filter((b: any) =>
        selectedEntity?.id === null ? b.schoolId === null : b.schoolId === selectedEntity?.id
      )
    }),
    enabled: !!selectedEntity && selectedYear !== null && selectedMonth === null,
  })

  // Level 4: batch detail — filter by entity
  const { data: batchDetail, isLoading: batchLoading } = useQuery<any>({
    queryKey: ['owner-salary-batch-detail', schoolHeader, selectedMonth, selectedYear],
    queryFn: () => apiClient.get('/salary/batches/for-owner', {
      params: { year: selectedYear, month: selectedMonth },
    }).then((r: any) => {
      const all = r.data?.data ?? r.data ?? []
      const list = Array.isArray(all) ? all : [all]
      return list.find((b: any) =>
        selectedEntity?.id === null ? b.schoolId === null : b.schoolId === selectedEntity?.id
      ) ?? null
    }),
    enabled: !!selectedEntity && selectedMonth !== null && selectedYear !== null,
  })

  const batch = batchDetail
  const currency = batch?.orgCurrency ?? batch?.school?.currency ?? 'SAR'
  const entityName = isRtl ? (selectedEntity?.nameAr ?? '') : (selectedEntity?.name ?? '')
  const monthName = selectedMonth ? (isRtl ? MONTHS_AR[selectedMonth - 1] : MONTHS[selectedMonth - 1]) : ''

  // Mutations
  const approve = useMutation({
    mutationFn: (id: string) => apiClient.post(`/salary/batches/${id}/owner-approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-salary-batches-list'] })
      qc.invalidateQueries({ queryKey: ['owner-salary-batch-detail'] })
    },
  })

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.post(`/salary/batches/${id}/owner-reject`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-salary-batches-list'] })
      qc.invalidateQueries({ queryKey: ['owner-salary-batch-detail'] })
      setRejectModal(null)
      setRejectReason('')
    },
  })

  const selectEntity = (e: Entity) => {
    setSelectedEntity(e)
    setSelectedYear(null)
    setSelectedMonth(null)
    setSelectedSchool(e.id ?? '__company__')
  }

  const goBack = () => {
    if (selectedMonth !== null) setSelectedMonth(null)
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
            <Banknote size={24} className="text-indigo-600" />
            {isRtl ? 'اعتماد الرواتب' : 'Salary Approvals'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isRtl ? 'راجع واعتمد دفعات الرواتب' : 'Review and approve salary batches'}
          </p>
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
            <button key={y} onClick={() => setSelectedYear(y)}
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
              <button key={mNum} onClick={() => setSelectedMonth(mNum)}
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
                      {Number(existingBatch.totalNet).toLocaleString()} {existingBatch.school?.currency ?? 'SAR'}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">{isRtl ? 'لا بيانات' : 'No data'}</p>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Level 4: Batch Detail (read-only) ─────────────────────────────────────────
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
            {isRtl ? 'مراجعة الرواتب' : 'Salary Review'}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {statusCfg && (
            <span className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full ${statusCfg.color}`}>
              {isRtl ? statusCfg.labelAr : statusCfg.label}
            </span>
          )}
          {batch && (
            <button onClick={() => printSalaryBatch(batch, entityName, currency, monthName)}
              className="flex items-center gap-1.5 border border-gray-200 px-3 py-2 rounded-xl text-sm hover:bg-gray-50">
              <FileDown size={14} /> {isRtl ? 'تصدير PDF' : 'Export PDF'}
            </button>
          )}
          {batch?.status === 'OWNER_PENDING' && (
            <>
              <button onClick={() => approve.mutate(batch.id)} disabled={approve.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-60">
                <CheckCircle2 size={15} /> {isRtl ? 'اعتماد' : 'Approve'}
              </button>
              <button onClick={() => setRejectModal({ id: batch.id })}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100">
                <XCircle size={15} /> {isRtl ? 'رفض' : 'Reject'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Rejection reason */}
      {batch?.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{batch.rejectionReason}</p>
        </div>
      )}

      {/* Summary cards */}
      {batchLoading ? (
        <div className="animate-pulse grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
        </div>
      ) : batch ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: isRtl ? 'الراتب الأساسي' : 'Base Salary', value: Number(batch.totalBaseSalary), color: 'text-gray-800' },
              { label: isRtl ? 'المكافآت' : 'Bonuses',           value: Number(batch.totalBonus),      color: 'text-emerald-600' },
              { label: isRtl ? 'الخصومات' : 'Deductions',        value: Number(batch.totalDeductions), color: 'text-red-500' },
              { label: isRtl ? 'صافي الرواتب' : 'Net Payroll',   value: Number(batch.totalNet),        color: 'text-indigo-700' },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-xs text-gray-500 font-medium">{c.label}</p>
                <p className={`text-xl font-bold mt-1 ${c.color}`}>
                  {c.value.toLocaleString()} <span className="text-xs font-normal text-gray-400">{currency}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Read-only salary table */}
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
                  ].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(batch.lines ?? []).length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-14 text-gray-400 text-sm">{isRtl ? 'لا يوجد موظفون' : 'No staff'}</td></tr>
                ) : (batch.lines ?? []).map((line: any) => {
                  const name = [line.staff?.user?.profile?.firstName, line.staff?.user?.profile?.lastName].filter(Boolean).join(' ') || line.staff?.user?.email
                  return (
                    <tr key={line.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{name}</p>
                        <p className="text-xs text-gray-400">{line.staff?.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{Number(line.baseSalary).toLocaleString()}</td>
                      <td className="px-4 py-3 text-emerald-600">+{Number(line.bonus).toLocaleString()}</td>
                      <td className="px-4 py-3 text-red-500">-{Number(line.deductions).toLocaleString()}</td>
                      <td className="px-4 py-3 font-bold text-indigo-700">{Number(line.netPay).toLocaleString()} {currency}</td>
                    </tr>
                  )
                })}
              </tbody>
              {(batch.lines ?? []).length > 0 && (
                <tfoot>
                  <tr className="border-t border-gray-100 bg-indigo-50/50">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-700">
                      {isRtl ? `الإجمالي (${batch.lines.length} موظف)` : `Total (${batch.lines.length} employees)`}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-800">{Number(batch.totalBaseSalary).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-bold text-emerald-600">+{Number(batch.totalBonus).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-bold text-red-500">-{Number(batch.totalDeductions).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-bold text-indigo-700">{Number(batch.totalNet).toLocaleString()} {currency}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Approval chain */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-4">{isRtl ? 'مسار الاعتماد' : 'Approval Chain'}</p>
            <div className="flex gap-6 text-xs flex-wrap">
              <div className="flex items-center gap-1.5 text-green-600">
                <CheckCircle2 size={14} />
                <span>{isRtl ? 'HR أعدّ' : 'HR Prepared'}</span>
              </div>
              <div className={`flex items-center gap-1.5 ${['OWNER_PENDING','OWNER_APPROVED','OWNER_REJECTED','IN_PAYMENT','PAID','CLOSED'].includes(batch.status) ? 'text-green-600' : 'text-gray-400'}`}>
                {['OWNER_PENDING','OWNER_APPROVED','OWNER_REJECTED','IN_PAYMENT','PAID','CLOSED'].includes(batch.status)
                  ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                <span>{isRtl ? 'اعتماد المالية' : 'Finance Approved'}</span>
              </div>
              <div className={`flex items-center gap-1.5 ${['OWNER_APPROVED','IN_PAYMENT','PAID','CLOSED'].includes(batch.status) ? 'text-green-600' : batch.status === 'OWNER_REJECTED' ? 'text-red-600' : batch.status === 'OWNER_PENDING' ? 'text-yellow-600' : 'text-gray-400'}`}>
                {['OWNER_APPROVED','IN_PAYMENT','PAID','CLOSED'].includes(batch.status) ? <CheckCircle2 size={14} /> :
                 batch.status === 'OWNER_REJECTED' ? <XCircle size={14} /> : <Clock size={14} />}
                <span>{isRtl ? 'موافقة المالك' : 'Owner Approval'}</span>
              </div>
              <div className={`flex items-center gap-1.5 ${['PAID','CLOSED'].includes(batch.status) ? 'text-green-600' : 'text-gray-400'}`}>
                {['PAID','CLOSED'].includes(batch.status) ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                <span>{isRtl ? 'صُرفت الرواتب' : 'Salaries Paid'}</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <Banknote size={48} className="opacity-20" />
          <p>{isRtl ? 'لا توجد دفعة رواتب لهذا الشهر' : 'No salary batch found for this month'}</p>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <h2 className="font-bold text-red-700">{isRtl ? 'رفض دفعة الرواتب' : 'Reject Salary Batch'}</h2>
            <p className="text-sm text-gray-500">
              {isRtl ? 'ستُعاد الدفعة إلى المالية مع السبب' : 'Batch will be returned to Finance with reason'}
            </p>
            <div>
              <label className="text-xs text-gray-500 font-medium">{isRtl ? 'سبب الرفض *' : 'Rejection Reason *'}</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
                placeholder={isRtl ? 'اذكر سبب الرفض بوضوح...' : 'State the rejection reason clearly...'} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => reject.mutate({ id: rejectModal.id, reason: rejectReason })}
                disabled={!rejectReason.trim() || reject.isPending}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">
                {reject.isPending ? '...' : (isRtl ? 'رفض' : 'Reject')}
              </button>
              <button onClick={() => { setRejectModal(null); setRejectReason('') }}
                className="px-4 border border-gray-200 rounded-xl text-sm">{isRtl ? 'إلغاء' : 'Cancel'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
