'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardBody, CardHeader, Skeleton } from '@/components/ui'
import { Plus, Bus, MapPin, Users, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminTransportPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<any>(null)
  const [assignForm, setAssignForm] = useState({ studentId: '', stopId: '' })
  const [routeForm, setRouteForm] = useState({ name: '', nameAr: '', busNumber: '', capacity: '', driverId: '' })

  const { data: routes, isLoading } = useQuery({
    queryKey: ['bus-routes'],
    queryFn: () => api.get('/transport/routes').then((r) => r.data?.data || []),
  })

  const { data: assignments } = useQuery({
    queryKey: ['bus-assignments', selectedRoute?.id],
    queryFn: () => api.get('/transport/assignments', { params: { routeId: selectedRoute?.id } }).then((r) => r.data?.data || []),
    enabled: !!selectedRoute,
  })

  const createRoute = useMutation({
    mutationFn: (data: any) => api.post('/transport/routes', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bus-routes'] })
      setShowCreate(false)
      setRouteForm({ name: '', nameAr: '', busNumber: '', capacity: '', driverId: '' })
      toast.success(isRtl ? 'تم إنشاء الخط' : 'Route created')
    },
  })

  const deleteRoute = useMutation({
    mutationFn: (id: string) => api.delete(`/transport/routes/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bus-routes'] })
      setSelectedRoute(null)
      toast.success(isRtl ? 'تم الحذف' : 'Deleted')
    },
  })

  const assignStudent = useMutation({
    mutationFn: (data: any) => api.post('/transport/assignments', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bus-assignments', selectedRoute?.id] })
      setAssignForm({ studentId: '', stopId: '' })
      toast.success(isRtl ? 'تم التعيين' : 'Student assigned')
    },
  })

  const removeAssignment = useMutation({
    mutationFn: (id: string) => api.delete(`/transport/assignments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bus-assignments', selectedRoute?.id] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'النقل المدرسي' : 'School Transport'}</h1>
          <p className="text-gray-500 text-sm mt-1">{isRtl ? 'إدارة خطوط الحافلات وتعيين الطلاب' : 'Manage bus routes and student assignments'}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-primary-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-800">
          <Plus size={16} />
          {isRtl ? 'خط جديد' : 'New Route'}
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader><h3 className="font-semibold">{isRtl ? 'خط حافلة جديد' : 'New Bus Route'}</h3></CardHeader>
            <CardBody>
              <div className="space-y-3">
                <input placeholder={isRtl ? 'اسم الخط *' : 'Route Name *'} value={routeForm.name}
                  onChange={(e) => setRouteForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
                <input placeholder="اسم الخط (عربي)" value={routeForm.nameAr} dir="rtl"
                  onChange={(e) => setRouteForm((f) => ({ ...f, nameAr: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder={isRtl ? 'رقم الحافلة' : 'Bus Number'} value={routeForm.busNumber}
                    onChange={(e) => setRouteForm((f) => ({ ...f, busNumber: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
                  <input type="number" placeholder={isRtl ? 'السعة' : 'Capacity'} value={routeForm.capacity}
                    onChange={(e) => setRouteForm((f) => ({ ...f, capacity: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowCreate(false)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button onClick={() => createRoute.mutate({ ...routeForm, capacity: routeForm.capacity ? Number(routeForm.capacity) : undefined })}
                    disabled={!routeForm.name || createRoute.isPending}
                    className="flex-1 bg-primary-900 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-60">
                    {isRtl ? 'إنشاء' : 'Create'}
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Routes list */}
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-900">{isRtl ? 'الخطوط' : 'Routes'}</h2>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)
          ) : (routes || []).map((route: any) => (
            <button key={route.id} onClick={() => setSelectedRoute(route)}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${selectedRoute?.id === route.id ? 'border-primary-300 bg-primary-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Bus size={16} className="text-primary-600" />
                  <div>
                    <p className="font-medium text-sm text-gray-900">{isRtl ? (route.nameAr || route.name) : route.name}</p>
                    {route.busNumber && <p className="text-xs text-gray-500">{isRtl ? 'رقم: ' : 'Bus: '}{route.busNumber}</p>}
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteRoute.mutate(route.id) }} className="p-1 text-red-400 hover:text-red-600 rounded-lg">
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="flex gap-3 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><MapPin size={11} />{route.stops?.length || 0} {isRtl ? 'محطة' : 'stops'}</span>
                <span className="flex items-center gap-1"><Users size={11} />{route._count?.assignments || 0} {isRtl ? 'طالب' : 'students'}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Route detail */}
        {selectedRoute ? (
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-gray-900">{isRtl ? 'طلاب الخط: ' : 'Students on route: '}{isRtl ? (selectedRoute.nameAr || selectedRoute.name) : selectedRoute.name}</h3>
              </CardHeader>
              <CardBody>
                {/* Assign form */}
                <div className="flex gap-2 mb-4">
                  <input placeholder={isRtl ? 'معرّف الطالب' : 'Student User ID'} value={assignForm.studentId}
                    onChange={(e) => setAssignForm((f) => ({ ...f, studentId: e.target.value }))}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500" />
                  <button onClick={() => assignStudent.mutate({ routeId: selectedRoute.id, studentId: assignForm.studentId })}
                    disabled={!assignForm.studentId || assignStudent.isPending}
                    className="px-4 py-2 bg-primary-900 text-white rounded-xl text-sm font-medium disabled:opacity-60">
                    {isRtl ? 'تعيين' : 'Assign'}
                  </button>
                </div>

                {(assignments || []).length === 0 ? (
                  <p className="text-center text-gray-400 py-6 text-sm">{isRtl ? 'لا يوجد طلاب مُعيّنون' : 'No students assigned'}</p>
                ) : (
                  <div className="space-y-2">
                    {(assignments || []).map((a: any) => (
                      <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{a.student?.profile?.firstName} {a.student?.profile?.lastName}</p>
                          <p className="text-xs text-gray-500">{a.student?.email}</p>
                        </div>
                        <button onClick={() => removeAssignment.mutate(a.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        ) : (
          <div className="lg:col-span-2 flex items-center justify-center text-gray-400 py-16">
            <div className="text-center">
              <Bus size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{isRtl ? 'اختر خطاً لعرض التفاصيل' : 'Select a route to view details'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
