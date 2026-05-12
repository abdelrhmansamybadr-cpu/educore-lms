'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

type Tab = 'menu' | 'orders'

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']

const statusColor: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-orange-100 text-orange-800',
  READY: 'bg-green-100 text-green-700',
  DELIVERED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-700',
}

export default function CanteenPage() {
  const [tab, setTab] = useState<Tab>('menu')
  const [orderStatusFilter, setOrderStatusFilter] = useState('')
  const [showAddItem, setShowAddItem] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', nameAr: '', description: '', price: '', category: 'Main' })
  const queryClient = useQueryClient()

  const { data: stats } = useQuery({
    queryKey: ['canteen-stats'],
    queryFn: () => apiClient.get('/canteen/stats').then((r) => r.data),
  })

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['canteen-items'],
    queryFn: () => apiClient.get('/canteen/items').then((r) => r.data),
    enabled: tab === 'menu',
  })

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['canteen-orders', orderStatusFilter],
    queryFn: () => apiClient.get(`/canteen/orders${orderStatusFilter ? `?status=${orderStatusFilter}` : ''}`).then((r) => r.data),
    enabled: tab === 'orders',
  })

  const createItem = useMutation({
    mutationFn: (data: any) => apiClient.post('/canteen/items', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canteen-items'] })
      queryClient.invalidateQueries({ queryKey: ['canteen-stats'] })
      setShowAddItem(false)
      setNewItem({ name: '', nameAr: '', description: '', price: '', category: 'Main' })
    },
  })

  const toggleItem = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/canteen/items/${id}/toggle`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['canteen-items'] }),
  })

  const updateOrderStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/canteen/orders/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['canteen-orders'] }),
  })

  const categories = items
    ? [...new Set((items as any[]).map((i: any) => i.category))]
    : ['Main', 'Snacks', 'Drinks', 'Desserts']

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Canteen Management</h1>
        <p className="text-gray-500 text-sm mt-1">Manage menu items, orders, and daily revenue</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Menu Items', value: stats?.totalItems ?? '—', color: 'text-blue-600' },
          { label: 'Available', value: stats?.availableItems ?? '—', color: 'text-green-600' },
          { label: "Today's Orders", value: stats?.todayOrders ?? '—', color: 'text-purple-600' },
          { label: 'Pending', value: stats?.pendingOrders ?? '—', color: 'text-yellow-600' },
          { label: "Today's Revenue", value: stats ? `$${stats.todayRevenue?.toFixed(2)}` : '—', color: 'text-emerald-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(['menu', 'orders'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t === 'menu' ? 'Menu Items' : 'Orders'}
          </button>
        ))}
      </div>

      {/* Menu Tab */}
      {tab === 'menu' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddItem(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"
            >
              + Add Item
            </button>
          </div>

          {showAddItem && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">New Menu Item</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Name (EN) *</label>
                  <input
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="e.g. Grilled Chicken"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Name (AR)</label>
                  <input
                    value={newItem.nameAr}
                    onChange={(e) => setNewItem({ ...newItem, nameAr: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="دجاج مشوي"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Price ($) *</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    {['Main', 'Snacks', 'Drinks', 'Desserts', 'Breakfast', 'Salads'].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Description</label>
                  <input
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => createItem.mutate({ ...newItem, price: parseFloat(newItem.price) })}
                  disabled={createItem.isPending || !newItem.name || !newItem.price}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {createItem.isPending ? 'Saving...' : 'Save Item'}
                </button>
                <button
                  onClick={() => setShowAddItem(false)}
                  className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {itemsLoading ? (
            <div className="p-8 text-center text-gray-400">Loading menu...</div>
          ) : (
            <div className="space-y-4">
              {categories.map((cat) => {
                const catItems = (items as any[]).filter((i: any) => i.category === cat)
                if (catItems.length === 0) return null
                return (
                  <div key={cat} className="bg-white rounded-xl border border-gray-200">
                    <div className="px-4 py-3 border-b bg-gray-50 rounded-t-xl">
                      <h3 className="font-semibold text-gray-700 text-sm">{cat}</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {catItems.map((item: any) => (
                        <div key={item.id} className="p-4 flex items-center gap-4">
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900">{item.name}</p>
                            {item.nameAr && <p className="text-xs text-gray-400 mt-0.5" dir="rtl">{item.nameAr}</p>}
                            {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                          </div>
                          <p className="font-bold text-green-600">${item.price.toFixed(2)}</p>
                          <button
                            onClick={() => toggleItem.mutate(item.id)}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                              item.isAvailable
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {item.isAvailable ? 'Available' : 'Unavailable'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              {(items as any[])?.length === 0 && (
                <div className="p-8 text-center text-gray-400">No menu items yet</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b flex items-center gap-3">
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Statuses</option>
              {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          {ordersLoading ? (
            <div className="p-8 text-center text-gray-400">Loading orders...</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {(orders ?? []).length === 0 && (
                <div className="p-8 text-center text-gray-400">No orders found</div>
              )}
              {(orders ?? []).map((order: any) => (
                <div key={order.id} className="p-4 flex items-start gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">
                      {order.user?.profile
                        ? `${order.user.profile.firstName} ${order.user.profile.lastName}`
                        : order.user?.email}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {order.items?.map((i: any) => `${i.item?.name} ×${i.quantity}`).join(', ')}
                    </p>
                    {order.note && <p className="text-xs text-gray-400 mt-0.5 italic">"{order.note}"</p>}
                    <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="font-bold text-green-600 text-sm">${order.total?.toFixed(2)}</p>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                    {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                      <select
                        onChange={(e) => updateOrderStatus.mutate({ id: order.id, status: e.target.value })}
                        defaultValue=""
                        className="text-xs border border-gray-300 rounded-lg px-2 py-1"
                      >
                        <option value="" disabled>Update →</option>
                        {ORDER_STATUSES.filter((s) => s !== order.status).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
