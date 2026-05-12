'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button, Badge, Input, Avatar, Spinner, EmptyState } from '@/components/ui'
import { Search, UserX, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react'

interface User {
  id: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  profile?: { firstName?: string; lastName?: string; firstNameAr?: string; lastNameAr?: string; avatar?: string }
  school?: { name?: string; nameAr?: string }
}

const ROLES = [
  'SUPER_ADMIN', 'DEVELOPER', 'SCHOOL_ADMIN', 'VICE_PRINCIPAL', 'ACADEMIC_DIRECTOR',
  'DEPARTMENT_HEAD', 'TEACHER', 'SUB_TEACHER', 'COUNSELOR', 'ACTIVITIES_COORDINATOR',
  'RECEPTIONIST', 'ADMISSION_OFFICER', 'HR_MANAGER', 'FINANCE_OFFICER', 'STORE_MANAGER',
  'CANTEEN_MANAGER', 'IT_ADMIN', 'MATRON', 'TRANSPORT_MANAGER', 'LIBRARIAN', 'NURSE',
  'EVENT_COORDINATOR', 'SUPPORT_AGENT', 'STUDENT', 'PARENT',
]

const roleBadgeVariant = (role: string) => {
  if (['SUPER_ADMIN', 'DEVELOPER'].includes(role)) return 'danger'
  if (['SCHOOL_ADMIN', 'VICE_PRINCIPAL', 'ACADEMIC_DIRECTOR'].includes(role)) return 'primary'
  if (['TEACHER', 'SUB_TEACHER', 'COUNSELOR'].includes(role)) return 'accent'
  if (role === 'STUDENT') return 'success'
  if (role === 'PARENT') return 'warning'
  return 'default'
}

export default function SuperAdminUsersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const limit = 25

  const { data, isLoading } = useQuery({
    queryKey: ['sa-users', search, role, page],
    queryFn: () =>
      api.get('/super-admin/users', { params: { search: search || undefined, role: role || undefined, page, limit } })
        .then((r) => r.data?.data ?? r.data ?? []),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/super-admin/users/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sa-users'] }),
  })

  const users: User[] = data?.data ?? []
  const meta = data?.meta ?? { total: 0, totalPages: 1 }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">All Users</h1>
        <p className="text-sm text-neutral-500 mt-1">All users across every school on the platform</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            leftIcon={<Search size={16} />}
          />
        </div>
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1) }}
          className="w-full sm:w-52 rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner />
          </div>
        ) : users.length === 0 ? (
          <EmptyState title="No users found" description="Try adjusting your search or filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="text-start px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">User</th>
                  <th className="text-start px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Role</th>
                  <th className="text-start px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">School</th>
                  <th className="text-start px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Status</th>
                  <th className="text-start px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Joined</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                {users.map((u) => {
                  const name = u.profile
                    ? `${u.profile.firstName ?? ''} ${u.profile.lastName ?? ''}`.trim() || u.email
                    : u.email
                  return (
                    <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar src={u.profile?.avatar} name={name} size="sm" />
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-neutral-100">{name}</p>
                            <p className="text-xs text-neutral-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={roleBadgeVariant(u.role)}>
                          {u.role.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                        {u.school?.name ?? <span className="text-neutral-400 italic">Platform</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.isActive ? 'success' : 'danger'}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-neutral-500 text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleMutation.mutate({ id: u.id, isActive: !u.isActive })}
                          disabled={toggleMutation.isPending}
                          title={u.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {u.isActive ? <UserX size={15} className="text-danger-500" /> : <UserCheck size={15} className="text-success-500" />}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-sm text-neutral-500">
              {meta.total} users · Page {page} of {meta.totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft size={14} />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}>
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
