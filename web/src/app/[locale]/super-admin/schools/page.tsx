'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardHeader, CardBody, Badge, Skeleton, Button, Input, Select } from '@/components/ui'
import { Building2, Plus, Search, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react'
import toast from 'react-hot-toast'

const CURRICULUM_OPTIONS = [
  { value: '', label: 'All Curricula' },
  { value: 'EGYPTIAN', label: 'Egyptian' },
  { value: 'SAUDI', label: 'Saudi' },
  { value: 'AMERICAN', label: 'American' },
  { value: 'BRITISH', label: 'British' },
  { value: 'IB', label: 'IB' },
  { value: 'CUSTOM', label: 'Custom' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
]

export default function SuperAdminSchoolsPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [curriculum, setCurriculum] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    name: '', nameAr: '', country: 'Egypt', currency: 'EGP',
    curriculumType: 'EGYPTIAN', email: '', phone: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-schools', search, curriculum, status, page],
    queryFn: () =>
      api.get('/super-admin/schools', {
        params: { search, curriculumType: curriculum || undefined, isActive: status || undefined, page, limit: 20 },
      }).then((r) => r.data?.data),
  })

  const schools = data?.data || []
  const meta = data?.meta || { total: 0, totalPages: 1 }

  const createSchool = useMutation({
    mutationFn: (body: typeof form) => api.post('/super-admin/schools', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-schools'] })
      setShowCreate(false)
      setForm({ name: '', nameAr: '', country: 'Egypt', currency: 'EGP', curriculumType: 'EGYPTIAN', email: '', phone: '' })
      toast.success(isRtl ? 'تم إنشاء المدرسة بنجاح' : 'School created successfully')
    },
    onError: () => toast.error(isRtl ? 'فشل إنشاء المدرسة' : 'Failed to create school'),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/super-admin/schools/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-schools'] })
      toast.success(isRtl ? 'تم تحديث الحالة' : 'Status updated')
    },
  })

  const deleteSchool = useMutation({
    mutationFn: (id: string) => api.delete(`/super-admin/schools/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-schools'] })
      toast.success(isRtl ? 'تم حذف المدرسة' : 'School deleted')
    },
    onError: () => toast.error(isRtl ? 'فشل الحذف' : 'Failed to delete'),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className={`text-2xl font-bold text-gray-900 ${isRtl ? 'font-arabic' : ''}`}>
            {isRtl ? 'إدارة المدارس' : 'Schools Management'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isRtl ? `${meta.total} مدرسة مسجلة` : `${meta.total} schools registered`}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          {isRtl ? 'إضافة مدرسة' : 'Add School'}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder={isRtl ? 'ابحث بالاسم...' : 'Search by name...'}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                leftIcon={<Search size={16} />}
              />
            </div>
            <Select
              options={CURRICULUM_OPTIONS}
              value={curriculum}
              onChange={(e) => { setCurriculum(e.target.value); setPage(1) }}
              className="w-40"
            />
            <Select
              options={STATUS_OPTIONS}
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1) }}
              className="w-36"
            />
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {[
                  isRtl ? 'المدرسة' : 'School',
                  isRtl ? 'الدولة' : 'Country',
                  isRtl ? 'المنهج' : 'Curriculum',
                  isRtl ? 'العملة' : 'Currency',
                  isRtl ? 'الحالة' : 'Status',
                  isRtl ? 'الإجراءات' : 'Actions',
                ].map((h) => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase ${isRtl ? 'text-right' : 'text-left'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4" /></td>
                    ))}
                  </tr>
                ))
              ) : schools.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    {isRtl ? 'لا توجد مدارس' : 'No schools found'}
                  </td>
                </tr>
              ) : (
                schools.map((school: any) => (
                  <tr key={school.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                          {school.logo ? (
                            <img src={school.logo} alt="" className="w-8 h-8 rounded-lg object-contain" />
                          ) : (
                            <Building2 size={16} className="text-primary-900" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {isRtl ? school.nameAr || school.name : school.name}
                          </p>
                          <p className="text-xs text-gray-400">{school.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{school.country}</td>
                    <td className="px-4 py-3">
                      <Badge variant="primary">{school.curriculumType}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{school.currency}</td>
                    <td className="px-4 py-3">
                      <Badge variant={school.isActive ? 'success' : 'danger'}>
                        {school.isActive ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'غير نشط' : 'Inactive')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleActive.mutate({ id: school.id, isActive: !school.isActive })}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary-900 transition-colors"
                          title={school.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {school.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(isRtl ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) {
                              deleteSchool.mutate(school.id)
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {isRtl ? `صفحة ${page} من ${meta.totalPages}` : `Page ${page} of ${meta.totalPages}`}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                {isRtl ? 'السابق' : 'Previous'}
              </Button>
              <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>
                {isRtl ? 'التالي' : 'Next'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create School Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className={`font-semibold text-gray-900 ${isRtl ? 'font-arabic' : ''}`}>
                  {isRtl ? 'إضافة مدرسة جديدة' : 'Add New School'}
                </h2>
                <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={isRtl ? 'الاسم (English)' : 'Name (English)'}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Cairo International School"
                />
                <Input
                  label={isRtl ? 'الاسم (عربي)' : 'Name (Arabic)'}
                  value={form.nameAr}
                  onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                  placeholder="مدرسة القاهرة الدولية"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={isRtl ? 'البريد الإلكتروني' : 'Email'}
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <Input
                  label={isRtl ? 'الهاتف' : 'Phone'}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {isRtl ? 'الدولة' : 'Country'}
                  </label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                  >
                    {['Egypt', 'Saudi Arabia', 'UAE', 'Kuwait', 'Jordan', 'Qatar', 'Bahrain', 'UK', 'USA'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {isRtl ? 'المنهج' : 'Curriculum'}
                  </label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={form.curriculumType}
                    onChange={(e) => setForm({ ...form, curriculumType: e.target.value })}
                  >
                    {['EGYPTIAN', 'SAUDI', 'AMERICAN', 'BRITISH', 'IB', 'CUSTOM', 'MIXED'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {isRtl ? 'العملة' : 'Currency'}
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                >
                  {['EGP', 'SAR', 'AED', 'USD', 'GBP', 'EUR', 'KWD', 'BHD', 'QAR', 'JOD'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1"
                  onClick={() => createSchool.mutate(form)}
                  loading={createSchool.isPending}
                  disabled={!form.name}
                >
                  {isRtl ? 'إنشاء' : 'Create School'}
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  )
}
