'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useSchoolContext } from '@/stores/schoolContextStore'
import { useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'
import { Building2, ChevronDown, School, Check, Layers, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'

// Pages that manage their own entity selection — hide the global switcher
const HIDDEN_ON_PATHS = ['/hr/salary', '/salary-approvals', '/finance']

const CURRICULUM_COLORS: Record<string, string> = {
  BRITISH: 'bg-blue-900',
  AMERICAN: 'bg-red-700',
  IB: 'bg-green-700',
  EGYPTIAN: 'bg-green-800',
  SAUDI: 'bg-green-800',
  NATIONAL: 'bg-indigo-700',
  MIXED: 'bg-purple-700',
  CUSTOM: 'bg-gray-600',
}

export function SchoolSwitcher() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const { selectedSchoolId, schools, setSelectedSchool, setSchools } = useSchoolContext()

  // Load schools list on mount
  const { data: schoolsData } = useQuery({
    queryKey: ['my-schools'],
    queryFn: () => api.get('/schools/my-list').then((r) => r.data?.data ?? r.data ?? []),
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (Array.isArray(schoolsData) && schoolsData.length > 0) {
      setSchools(schoolsData.map((s: any) => ({
        id: s.id,
        name: s.name,
        nameAr: s.nameAr || s.name,
        curriculumType: s.curriculumType || 'CUSTOM',
        logo: s.logo,
      })))
    }
  }, [schoolsData, setSchools])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Don't render on pages that have their own entity picker
  if (HIDDEN_ON_PATHS.some(p => pathname?.includes(p))) return null

  // Don't render if only one school (no need to switch)
  if (schools.length <= 1) return null

  const isCompany   = selectedSchoolId === '__company__'
  const currentSchool = schools.find((s) => s.id === selectedSchoolId) ?? null
  const displayName = isCompany
    ? (isRtl ? 'موظفو الشركة' : 'Company Staff')
    : isRtl
      ? (currentSchool?.nameAr || currentSchool?.name || 'جميع المدارس')
      : (currentSchool?.name || 'All Schools')

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 max-w-[220px]"
      >
        {isCompany ? (
          <span className="w-5 h-5 rounded bg-amber-600 flex items-center justify-center shrink-0">
            <Briefcase size={11} className="text-white" />
          </span>
        ) : currentSchool ? (
          <span className={cn('w-5 h-5 rounded flex items-center justify-center shrink-0', CURRICULUM_COLORS[currentSchool.curriculumType] ?? 'bg-gray-500')}>
            <School size={11} className="text-white" />
          </span>
        ) : (
          <span className="w-5 h-5 rounded bg-primary-900 flex items-center justify-center shrink-0">
            <Layers size={11} className="text-white" />
          </span>
        )}
        <span className="truncate">{displayName}</span>
        <ChevronDown size={14} className={cn('text-gray-400 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className={cn(
          'absolute top-full mt-1.5 w-64 bg-white rounded-xl border border-gray-100 shadow-lg py-1.5 z-50',
          isRtl ? 'right-0' : 'left-0',
        )}>
          {/* Org / All Schools option */}
          <button
            onClick={() => { setSelectedSchool(null); setOpen(false) }}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors"
          >
            <span className="w-8 h-8 rounded-lg bg-primary-900 flex items-center justify-center shrink-0">
              <Building2 size={15} className="text-white" />
            </span>
            <div className="flex-1 text-start">
              <p className="text-sm font-semibold text-gray-900">{isRtl ? 'جميع المدارس' : 'All Schools'}</p>
              <p className="text-xs text-gray-400">{isRtl ? 'عرض على مستوى المؤسسة' : 'Organization-level view'}</p>
            </div>
            {!selectedSchoolId && <Check size={14} className="text-primary-600 shrink-0" />}
          </button>

          {/* Company (org-level staff) */}
          <button
            onClick={() => { setSelectedSchool('__company__'); setOpen(false) }}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors"
          >
            <span className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center shrink-0">
              <Briefcase size={15} className="text-white" />
            </span>
            <div className="flex-1 text-start">
              <p className="text-sm font-semibold text-gray-900">{isRtl ? 'موظفو الشركة' : 'Company Staff'}</p>
              <p className="text-xs text-gray-400">{isRtl ? 'موظفون على مستوى المؤسسة' : 'Organization-level employees'}</p>
            </div>
            {selectedSchoolId === '__company__' && <Check size={14} className="text-primary-600 shrink-0" />}
          </button>

          <div className="border-t border-gray-100 my-1" />

          {/* Individual schools */}
          {schools.map((school) => (
            <button
              key={school.id}
              onClick={() => { setSelectedSchool(school.id); setOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors"
            >
              <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white text-[10px] font-bold', CURRICULUM_COLORS[school.curriculumType] ?? 'bg-gray-500')}>
                {(isRtl ? school.nameAr : school.name).slice(0, 2).toUpperCase()}
              </span>
              <div className="flex-1 text-start min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{isRtl ? school.nameAr : school.name}</p>
                <p className="text-xs text-gray-400">{school.curriculumType}</p>
              </div>
              {selectedSchoolId === school.id && <Check size={14} className="text-primary-600 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
