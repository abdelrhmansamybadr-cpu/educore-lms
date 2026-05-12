'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardHeader, CardBody, Badge, Skeleton } from '@/components/ui'
import { Monitor, Plus, ShieldOff, ShieldCheck, Trash2 } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  LAPTOP: 'Laptop', TABLET: 'Tablet', DESKTOP: 'Desktop', PHONE: 'Phone', OTHER: 'Other',
}

export default function AdminDevicesPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', serialNumber: '', type: 'LAPTOP', brand: '', model: '' })
  const [selectedDevice, setSelectedDevice] = useState<any>(null)
  const [detailTab, setDetailTab] = useState<'info' | 'maintenance' | 'checkouts'>('info')
  const [maintenanceForm, setMaintenanceForm] = useState({ description: '', cost: '', performedBy: '', nextService: '' })
  const [checkoutUserId, setCheckoutUserId] = useState('')

  const { data: stats } = useQuery({
    queryKey: ['device-stats'],
    queryFn: () => api.get('/devices/stats').then(r => r.data?.data),
  })

  const { data: devices, isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: () => api.get('/devices').then(r => r.data?.data || []),
  })

  const createDevice = useMutation({
    mutationFn: (data: any) => api.post('/devices', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['devices'] }); setShowCreate(false); setForm({ name: '', serialNumber: '', type: 'LAPTOP', brand: '', model: '' }) },
  })

  const blockDevice = useMutation({
    mutationFn: ({ id, blocked }: { id: string; blocked: boolean }) =>
      blocked ? api.patch(`/devices/${id}/unblock`) : api.patch(`/devices/${id}/block`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['devices'] }),
  })

  const deleteDevice = useMutation({
    mutationFn: (id: string) => api.delete(`/devices/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['devices'] }),
  })

  const { data: maintenanceLogs } = useQuery({
    queryKey: ['device-maintenance', selectedDevice?.id],
    queryFn: () => api.get(`/devices/${selectedDevice.id}/maintenance`).then((r) => r.data?.data || []),
    enabled: !!selectedDevice && detailTab === 'maintenance',
  })

  const { data: checkoutHistory } = useQuery({
    queryKey: ['device-checkouts', selectedDevice?.id],
    queryFn: () => api.get(`/devices/${selectedDevice.id}/checkouts`).then((r) => r.data?.data || []),
    enabled: !!selectedDevice && detailTab === 'checkouts',
  })

  const { data: currentCheckout } = useQuery({
    queryKey: ['device-current-checkout', selectedDevice?.id],
    queryFn: () => api.get(`/devices/${selectedDevice.id}/current-checkout`).then((r) => r.data?.data),
    enabled: !!selectedDevice,
  })

  const addMaintenance = useMutation({
    mutationFn: (data: any) => api.post(`/devices/${selectedDevice.id}/maintenance`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-maintenance', selectedDevice?.id] })
      setMaintenanceForm({ description: '', cost: '', performedBy: '', nextService: '' })
    },
  })

  const checkoutDevice = useMutation({
    mutationFn: (userId: string) => api.post(`/devices/${selectedDevice.id}/checkout`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-current-checkout', selectedDevice?.id] })
      queryClient.invalidateQueries({ queryKey: ['device-checkouts', selectedDevice?.id] })
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      setCheckoutUserId('')
    },
  })

  const checkinDevice = useMutation({
    mutationFn: () => api.post(`/devices/${selectedDevice.id}/checkin`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-current-checkout', selectedDevice?.id] })
      queryClient.invalidateQueries({ queryKey: ['device-checkouts', selectedDevice?.id] })
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })

  const STAT_CARDS = [
    { label: isRtl ? 'إجمالي الأجهزة' : 'Total Devices', value: stats?.total || 0, color: 'text-primary-900' },
    { label: isRtl ? 'متاحة' : 'Available', value: stats?.available || 0, color: 'text-green-600' },
    { label: isRtl ? 'مُعيَّنة' : 'Assigned', value: stats?.assigned || 0, color: 'text-blue-600' },
    { label: isRtl ? 'محظورة' : 'Blocked', value: stats?.blocked || 0, color: 'text-red-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'إدارة الأجهزة' : 'Device Management'}</h1>
          <p className="text-gray-500 text-sm">{isRtl ? 'تتبع وإدارة أجهزة المدرسة' : 'Track and manage school devices'}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-primary-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-800">
          <Plus size={16} />{isRtl ? 'إضافة جهاز' : 'Add Device'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">{isRtl ? 'إضافة جهاز جديد' : 'Add New Device'}</h3>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={isRtl ? 'اسم الجهاز' : 'Device name'} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500" />
            <input value={form.serialNumber} onChange={e => setForm(f => ({ ...f, serialNumber: e.target.value }))} placeholder={isRtl ? 'الرقم التسلسلي' : 'Serial number'} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500" />
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500">
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder={isRtl ? 'الماركة' : 'Brand'} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500" />
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50">{isRtl ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={() => createDevice.mutate(form)} disabled={!form.name || !form.serialNumber || createDevice.isPending} className="flex-1 py-2.5 bg-primary-900 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                {createDevice.isPending ? '...' : (isRtl ? 'إضافة' : 'Add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Devices Table */}
      <Card>
        <CardHeader><h3 className="font-semibold text-gray-900">{isRtl ? 'قائمة الأجهزة' : 'Device List'}</h3></CardHeader>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : devices?.length === 0 ? (
            <CardBody>
              <div className="text-center py-12 text-gray-400">
                <Monitor size={40} className="mx-auto mb-2 opacity-30" />
                <p>{isRtl ? 'لا توجد أجهزة مسجلة' : 'No devices registered'}</p>
              </div>
            </CardBody>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-start font-semibold text-gray-600">{isRtl ? 'الجهاز' : 'Device'}</th>
                  <th className="px-4 py-3 text-start font-semibold text-gray-600 hidden md:table-cell">{isRtl ? 'النوع' : 'Type'}</th>
                  <th className="px-4 py-3 text-start font-semibold text-gray-600 hidden md:table-cell">{isRtl ? 'الرقم التسلسلي' : 'Serial'}</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {devices?.map((device: any) => (
                  <tr key={device.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{device.name}</p>
                      <p className="text-xs text-gray-400">{device.brand} {device.model}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-600">{TYPE_LABELS[device.type] || device.type}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-500 font-mono text-xs">{device.serialNumber}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={device.isBlocked ? 'danger' : device.assignedTo ? 'primary' : 'success'} className="text-xs">
                        {device.isBlocked ? (isRtl ? 'محظور' : 'Blocked') : device.assignedTo ? (isRtl ? 'مُعيَّن' : 'Assigned') : (isRtl ? 'متاح' : 'Available')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => { setSelectedDevice(device); setDetailTab('info') }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-medium">
                          {isRtl ? 'تفاصيل' : 'Details'}
                        </button>
                        <button onClick={() => blockDevice.mutate({ id: device.id, blocked: device.isBlocked })} className={`p-1.5 rounded-lg ${device.isBlocked ? 'text-green-600 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`}>
                          {device.isBlocked ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                        </button>
                        <button onClick={() => { if (confirm(isRtl ? 'حذف الجهاز؟' : 'Delete device?')) deleteDevice.mutate(device.id) }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Device Detail Panel */}
      {selectedDevice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end" onClick={() => setSelectedDevice(null)}>
          <div className="bg-white h-full w-full max-w-lg overflow-y-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{selectedDevice.name}</h3>
              <button onClick={() => setSelectedDevice(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            {/* Current checkout status */}
            <div className={`rounded-xl p-3 text-sm ${currentCheckout ? 'bg-blue-50 text-blue-800' : 'bg-green-50 text-green-800'}`}>
              {currentCheckout
                ? `Checked out to: ${currentCheckout.user?.profile?.firstName} ${currentCheckout.user?.profile?.lastName} (since ${new Date(currentCheckout.checkedOut).toLocaleDateString()})`
                : 'Available — not currently checked out'}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {[{ key: 'info', label: 'Info' }, { key: 'maintenance', label: 'Maintenance' }, { key: 'checkouts', label: 'Checkouts' }].map((t) => (
                <button key={t.key} onClick={() => setDetailTab(t.key as any)}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${detailTab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {detailTab === 'info' && (
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Type', value: selectedDevice.deviceType },
                    { label: 'Serial', value: selectedDevice.serialNumber || '—' },
                    { label: 'OS', value: selectedDevice.os || '—' },
                    { label: 'Ownership', value: selectedDevice.ownership },
                  ].map((f) => (
                    <div key={f.label} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">{f.label}</p>
                      <p className="font-medium text-gray-900 mt-0.5">{f.value}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-2 space-y-2">
                  <p className="text-xs font-medium text-gray-500">Checkout Device</p>
                  <div className="flex gap-2">
                    <input
                      value={checkoutUserId}
                      onChange={(e) => setCheckoutUserId(e.target.value)}
                      placeholder="User ID to check out to"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <button onClick={() => checkoutDevice.mutate(checkoutUserId)} disabled={!checkoutUserId || checkoutDevice.isPending}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50">
                      {isRtl ? 'استعارة' : 'Check Out'}
                    </button>
                  </div>
                  {currentCheckout && (
                    <button onClick={() => checkinDevice.mutate()} disabled={checkinDevice.isPending}
                      className="w-full bg-green-600 text-white py-2 rounded-lg text-sm disabled:opacity-50">
                      {isRtl ? 'إرجاع الجهاز' : 'Check In (Return)'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {detailTab === 'maintenance' && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-medium text-gray-700">Add Maintenance Log</p>
                  <input
                    value={maintenanceForm.description}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                    placeholder="Description *"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={maintenanceForm.cost} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: e.target.value })} placeholder="Cost" type="number" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    <input value={maintenanceForm.performedBy} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, performedBy: e.target.value })} placeholder="Performed by" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <input value={maintenanceForm.nextService} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, nextService: e.target.value })} type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  <button onClick={() => addMaintenance.mutate({ ...maintenanceForm, cost: maintenanceForm.cost ? parseFloat(maintenanceForm.cost) : undefined, nextService: maintenanceForm.nextService || undefined })} disabled={!maintenanceForm.description || addMaintenance.isPending} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm disabled:opacity-50">
                    {addMaintenance.isPending ? 'Saving...' : 'Add Log'}
                  </button>
                </div>
                <div className="divide-y divide-gray-100">
                  {(maintenanceLogs ?? []).length === 0 && <p className="text-center text-gray-400 py-4 text-sm">No maintenance logs</p>}
                  {(maintenanceLogs ?? []).map((log: any) => (
                    <div key={log.id} className="py-3">
                      <p className="font-medium text-sm text-gray-900">{log.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{new Date(log.date).toLocaleDateString()}{log.performedBy ? ` · ${log.performedBy}` : ''}{log.cost ? ` · $${log.cost}` : ''}</p>
                      {log.nextService && <p className="text-xs text-blue-600 mt-0.5">Next service: {new Date(log.nextService).toLocaleDateString()}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailTab === 'checkouts' && (
              <div className="divide-y divide-gray-100">
                {(checkoutHistory ?? []).length === 0 && <p className="text-center text-gray-400 py-4 text-sm">No checkout history</p>}
                {(checkoutHistory ?? []).map((co: any) => (
                  <div key={co.id} className="py-3">
                    <p className="font-medium text-sm text-gray-900">
                      {co.user?.profile ? `${co.user.profile.firstName} ${co.user.profile.lastName}` : co.user?.email}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Out: {new Date(co.checkedOut).toLocaleDateString()}
                      {co.checkedIn ? ` · In: ${new Date(co.checkedIn).toLocaleDateString()}` : ' · Currently out'}
                    </p>
                    {co.notes && <p className="text-xs text-gray-400 mt-0.5">{co.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
