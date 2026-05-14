'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import {
  Package, Warehouse, AlertTriangle, DollarSign, TrendingUp, ArrowRight,
  Plus, ClipboardList, RefreshCw,
} from 'lucide-react'
import { apiClient } from '@/lib/api'

interface DashboardStats {
  totalItems: number
  lowStockItems: number
  outOfStock: number
  pendingRequests: number
  totalMovementsThisMonth: number
  totalInventoryValue: number
  byCategory: Record<string, number>
  recentAlerts: { id: string; name: string; quantity: number; minQuantity: number; unit: string }[]
}

interface Movement {
  id: string
  type: 'IN' | 'OUT' | 'ADJUSTMENT'
  quantity: number
  reason?: string
  createdAt: string
  item: { name: string; unit: string }
}

interface Request {
  id: string
  itemName: string
  quantity: number
  status: string
  createdAt: string
  requestedBy: { profile?: { firstName?: string; lastName?: string } }
}

const TYPE_COLORS: Record<string, string> = {
  IN: 'bg-emerald-100 text-emerald-700',
  OUT: 'bg-red-100 text-red-700',
  ADJUSTMENT: 'bg-amber-100 text-amber-700',
}

function KpiCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4 shadow-sm">
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

export default function StoreDashboardPage() {
  const locale = useLocale()
  const router = useRouter()
  const isRtl = locale === 'ar'
  const basePath = `/${locale}/admin`

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [movements, setMovements] = useState<Movement[]>([])
  const [pending, setPending] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, m, r] = await Promise.all([
        apiClient.get('/store/dashboard-stats').then((d: any) => d.data?.data ?? d.data),
        apiClient.get('/store/movements?limit=8').then((d: any) => d.data?.data ?? d.data),
        apiClient.get('/store/requests').then((d: any) => d.data?.data ?? d.data),
      ])
      setStats(s)
      setMovements(Array.isArray(m) ? m : [])
      setPending(Array.isArray(r) ? r.filter((x: Request) => x.status === 'PENDING').slice(0, 5) : [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-gray-100 rounded-2xl" />)}
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'لوحة المخزن' : 'Store Dashboard'}</h1>
          <p className="text-sm text-gray-500 mt-1">{isRtl ? 'نظرة عامة على المخزون والطلبات' : 'Inventory overview and activity'}</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
          <RefreshCw size={14} /> {isRtl ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Package size={20} className="text-indigo-600" />}
          label={isRtl ? 'إجمالي الأصناف' : 'Total Items'}
          value={stats?.totalItems ?? 0}
          sub={isRtl ? 'في المخزون' : 'in inventory'}
          color="bg-indigo-50"
        />
        <KpiCard
          icon={<ClipboardList size={20} className="text-amber-600" />}
          label={isRtl ? 'طلبات معلقة' : 'Pending Requests'}
          value={stats?.pendingRequests ?? 0}
          sub={isRtl ? 'تحتاج موافقة' : 'awaiting approval'}
          color="bg-amber-50"
        />
        <KpiCard
          icon={<AlertTriangle size={20} className="text-red-500" />}
          label={isRtl ? 'تنبيهات المخزون' : 'Low Stock Alerts'}
          value={stats?.lowStockItems ?? 0}
          sub={`${stats?.outOfStock ?? 0} ${isRtl ? 'نفد تماماً' : 'out of stock'}`}
          color="bg-red-50"
        />
        <KpiCard
          icon={<DollarSign size={20} className="text-emerald-600" />}
          label={isRtl ? 'قيمة المخزون' : 'Inventory Value'}
          value={`$${(stats?.totalInventoryValue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          sub={isRtl ? 'التكلفة الإجمالية' : 'total cost'}
          color="bg-emerald-50"
        />
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              {isRtl ? 'تنبيهات المخزون المنخفض' : 'Low Stock Alerts'}
            </h2>
            <button onClick={() => router.push(`${basePath}/store/inventory`)}
              className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              {isRtl ? 'عرض الكل' : 'View all'} <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {(stats?.recentAlerts ?? []).length === 0
              ? <p className="text-sm text-gray-400 text-center py-8">{isRtl ? 'لا توجد تنبيهات' : 'No alerts'}</p>
              : stats!.recentAlerts.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm font-medium text-gray-800">{a.name}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${a.quantity === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                      {a.quantity} / {a.minQuantity} {a.unit}
                    </span>
                    <button onClick={() => router.push(`${basePath}/store/inventory`)}
                      className="text-xs bg-indigo-600 text-white px-2.5 py-1 rounded-full hover:bg-indigo-700 transition-colors">
                      {isRtl ? 'تعديل' : 'Adjust'}
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Package size={16} className="text-indigo-600" />
              {isRtl ? 'الطلبات المعلقة' : 'Pending Requests'}
            </h2>
            <button onClick={() => router.push(`${basePath}/store/requests`)}
              className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              {isRtl ? 'إدارة الطلبات' : 'Manage all'} <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {pending.length === 0
              ? <p className="text-sm text-gray-400 text-center py-8">{isRtl ? 'لا توجد طلبات معلقة' : 'No pending requests'}</p>
              : pending.map((req) => (
                <div key={req.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{req.itemName}</p>
                    <p className="text-xs text-gray-400">
                      {req.requestedBy?.profile?.firstName} {req.requestedBy?.profile?.lastName}
                      {' · '}{req.quantity} {isRtl ? 'وحدة' : 'units'}
                    </p>
                  </div>
                  <button onClick={() => router.push(`${basePath}/store/requests`)}
                    className="text-xs bg-indigo-600 text-white px-2.5 py-1 rounded-full hover:bg-indigo-700 transition-colors">
                    {isRtl ? 'تنفيذ' : 'Fulfill'}
                  </button>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Movements */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-600" />
              {isRtl ? 'آخر الحركات' : 'Recent Movements'}
            </h2>
            <button onClick={() => router.push(`${basePath}/store/movements`)}
              className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              {isRtl ? 'عرض الكل' : 'View all'} <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {movements.length === 0
              ? <p className="text-sm text-gray-400 text-center py-8">{isRtl ? 'لا توجد حركات' : 'No movements yet'}</p>
              : movements.slice(0, 8).map((m) => (
                <div key={m.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${TYPE_COLORS[m.type] ?? 'bg-gray-100 text-gray-700'}`}>{m.type}</span>
                    <span className="text-sm text-gray-800">{m.item?.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">{m.quantity} {m.item?.unit}</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">{isRtl ? 'إجراءات سريعة' : 'Quick Actions'}</h2>
          <div className="grid grid-cols-1 gap-3">
            {[
              { label: isRtl ? 'إضافة صنف جديد' : 'Add Inventory Item', icon: <Plus size={16} />, href: `${basePath}/store/inventory`, color: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
              { label: isRtl ? 'إنشاء أمر شراء' : 'New Purchase Order', icon: <ClipboardList size={16} />, href: `${basePath}/store/purchase-orders`, color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
              { label: isRtl ? 'مراجعة الطلبات' : 'Review All Requests', icon: <Package size={16} />, href: `${basePath}/store/requests`, color: 'bg-amber-500 hover:bg-amber-600 text-white' },
              { label: isRtl ? 'عرض التقارير' : 'View Reports', icon: <TrendingUp size={16} />, href: `${basePath}/store/reports`, color: 'bg-purple-600 hover:bg-purple-700 text-white' },
              { label: isRtl ? 'إدارة الموردين' : 'Manage Suppliers', icon: <Warehouse size={16} />, href: `${basePath}/store/suppliers`, color: 'border border-gray-200 hover:bg-gray-50 text-gray-700' },
            ].map((a) => (
              <button key={a.href} onClick={() => router.push(a.href)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${a.color}`}>
                {a.icon} {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
