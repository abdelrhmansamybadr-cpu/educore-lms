'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardBody, Badge, Avatar, Skeleton } from '@/components/ui'
import { Search, Plus, UserCheck, UserX, Trash2, Edit, Download } from 'lucide-react'

const ROLE_LABELS: Record<string, { en: string; ar: string; color: 'default' | 'success' | 'warning' | 'danger' | 'primary' }> = {
  SUPER_ADMIN: { en: 'Super Admin', ar: 'مدير عام', color: 'danger' },
  SCHOOL_ADMIN: { en: 'School Admin', ar: 'مدير المدرسة', color: 'danger' },
  PRINCIPAL: { en: 'Principal', ar: 'ناظر', color: 'warning' },
  VICE_PRINCIPAL: { en: 'Vice Principal', ar: 'وكيل', color: 'warning' },
  TEACHER: { en: 'Teacher', ar: 'معلم', color: 'primary' },
  STUDENT: { en: 'Student', ar: 'طالب', color: 'success' },
  PARENT: { en: 'Parent', ar: 'ولي أمر', color: 'default' },
  ACCOUNTANT: { en: 'Accountant', ar: 'محاسب', color: 'warning' },
  HR_MANAGER: { en: 'HR Manager', ar: 'مدير الموارد البشرية', color: 'warning' },
  SUPPORT_STAFF: { en: 'Support', ar: 'دعم', color: 'default' },
}

const ROLES = Object.keys(ROLE_LABELS)

export default function AdminUsersPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter, statusFilter, page],
    queryFn: () =>
      api.get('/users', {
        params: { search, role: roleFilter || undefined, isActive: statusFilter || undefined, page, limit: 20 },
      }).then((r) => ({ data: r.data?.data || [], total: r.data?.meta?.total || 0 })),
    placeholderData: (prev) => prev,
  })

  const users = data?.data || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / 20)

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/users/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const deleteUser = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setSelected((prev) => prev.filter((s) => s !== 'deleted'))
    },
  })

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])
  }

  const toggleAll = () => {
    if (selected.length === users.length) setSelected([])
    else setSelected(users.map((u: any) => u.id))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isRtl ? 'إدارة المستخدمين' : 'User Management'}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {isRtl ? `${total} مستخدم مسجل` : `${total} registered users`}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Download size={16} />
            {isRtl ? 'تصدير' : 'Export'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-primary-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-800 transition-colors"
          >
            <Plus size={16} />
            {isRtl ? 'إضافة مستخدم' : 'Add User'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="py-3">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-48 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder={isRtl ? 'بحث بالاسم أو البريد...' : 'Search by name or email...'}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500"
            >
              <option value="">{isRtl ? 'كل الأدوار' : 'All Roles'}</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{isRtl ? ROLE_LABELS[r]?.ar : ROLE_LABELS[r]?.en}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500"
            >
              <option value="">{isRtl ? 'كل الحالات' : 'All Status'}</option>
              <option value="true">{isRtl ? 'نشط' : 'Active'}</option>
              <option value="false">{isRtl ? 'معطل' : 'Inactive'}</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-primary-800 font-medium">
            {isRtl ? `تم تحديد ${selected.length} مستخدم` : `${selected.length} users selected`}
          </span>
          <div className="flex gap-2">
            <button className="text-sm bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg transition-colors">
              {isRtl ? 'تفعيل الكل' : 'Activate All'}
            </button>
            <button className="text-sm bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors">
              {isRtl ? 'تعطيل الكل' : 'Deactivate All'}
            </button>
            <button
              onClick={() => setSelected([])}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="p-4 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selected.length === users.length && users.length > 0}
                    onChange={toggleAll}
                    className="rounded"
                  />
                </th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {isRtl ? 'المستخدم' : 'User'}
                </th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                  {isRtl ? 'الدور' : 'Role'}
                </th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                  {isRtl ? 'تاريخ التسجيل' : 'Joined'}
                </th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {isRtl ? 'الحالة' : 'Status'}
                </th>
                <th className="p-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {isRtl ? 'إجراءات' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="p-4" colSpan={6}>
                      <Skeleton className="h-12" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400">
                    {isRtl ? 'لا توجد نتائج' : 'No users found'}
                  </td>
                </tr>
              ) : (
                users.map((user: any) => {
                  const profile = user.profile
                  const roleInfo = ROLE_LABELS[user.role]
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selected.includes(user.id)}
                          onChange={() => toggleSelect(user.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={`${profile?.firstName} ${profile?.lastName}`}
                            src={profile?.avatar}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">
                              {isRtl && profile?.firstNameAr
                                ? `${profile.firstNameAr} ${profile.lastNameAr || ''}`
                                : `${profile?.firstName || ''} ${profile?.lastName || ''}`
                              }
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <Badge variant={roleInfo?.color || 'default'} className="text-xs">
                          {isRtl ? roleInfo?.ar : roleInfo?.en}
                        </Badge>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <span className="text-sm text-gray-500">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')
                            : '—'
                          }
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge variant={user.isActive ? 'success' : 'default'} className="text-xs">
                          {user.isActive ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'معطل' : 'Inactive')}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => toggleActive.mutate({ id: user.id, isActive: !user.isActive })}
                            className={`p-1.5 rounded-lg transition-colors ${
                              user.isActive
                                ? 'text-red-500 hover:bg-red-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={user.isActive ? (isRtl ? 'تعطيل' : 'Deactivate') : (isRtl ? 'تفعيل' : 'Activate')}
                          >
                            {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                          </button>
                          <button
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                            title={isRtl ? 'تعديل' : 'Edit'}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(isRtl ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) {
                                deleteUser.mutate(user.id)
                              }
                            }}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title={isRtl ? 'حذف' : 'Delete'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {isRtl
                ? `عرض ${(page - 1) * 20 + 1}–${Math.min(page * 20, total)} من ${total}`
                : `Showing ${(page - 1) * 20 + 1}–${Math.min(page * 20, total)} of ${total}`
              }
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isRtl ? 'السابق' : 'Prev'}
              </button>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const p = page <= 3 ? i + 1 : page - 2 + i
                if (p < 1 || p > totalPages) return null
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      p === page
                        ? 'bg-primary-900 text-white border-primary-900'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isRtl ? 'التالي' : 'Next'}
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          isRtl={isRtl}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            queryClient.invalidateQueries({ queryKey: ['admin-users'] })
          }}
        />
      )}
    </div>
  )
}

function CreateUserModal({ isRtl, onClose, onSuccess }: { isRtl: boolean; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '',
    firstNameAr: '', lastNameAr: '', role: 'STUDENT', phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/users', form)
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.message || (isRtl ? 'حدث خطأ' : 'An error occurred'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {isRtl ? 'إضافة مستخدم جديد' : 'Create New User'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {isRtl ? 'الاسم الأول (إنجليزي)' : 'First Name (EN)'}
              </label>
              <input
                required
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {isRtl ? 'الاسم الأخير (إنجليزي)' : 'Last Name (EN)'}
              </label>
              <input
                required
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {isRtl ? 'الاسم الأول (عربي)' : 'First Name (AR)'}
              </label>
              <input
                value={form.firstNameAr}
                onChange={(e) => setForm((f) => ({ ...f, firstNameAr: e.target.value }))}
                dir="rtl"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {isRtl ? 'الاسم الأخير (عربي)' : 'Last Name (AR)'}
              </label>
              <input
                value={form.lastNameAr}
                onChange={(e) => setForm((f) => ({ ...f, lastNameAr: e.target.value }))}
                dir="rtl"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {isRtl ? 'البريد الإلكتروني' : 'Email'}
            </label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {isRtl ? 'كلمة المرور' : 'Password'}
            </label>
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {isRtl ? 'الدور' : 'Role'}
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500"
            >
              {Object.entries(ROLE_LABELS).map(([value, labels]) => (
                <option key={value} value={value}>{isRtl ? labels.ar : labels.en}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {isRtl ? 'رقم الهاتف' : 'Phone'}
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-primary-900 text-white rounded-xl text-sm font-medium hover:bg-primary-800 disabled:opacity-60 transition-colors"
            >
              {loading ? (isRtl ? 'جارٍ الإنشاء...' : 'Creating...') : (isRtl ? 'إنشاء المستخدم' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
