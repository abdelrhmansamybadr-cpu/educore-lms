'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

type Tab = 'inventory' | 'movements'

const movementTypeColor: Record<string, string> = {
  IN: 'bg-green-100 text-green-700',
  OUT: 'bg-red-100 text-red-700',
  ADJUSTMENT: 'bg-blue-100 text-blue-700',
}

export default function StorePage() {
  const [tab, setTab] = useState<Tab>('inventory')
  const [search, setSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showAdjust, setShowAdjust] = useState<string | null>(null)
  const [newItem, setNewItem] = useState({ name: '', category: 'General', unit: 'pcs', quantity: '0', minQuantity: '5', unitCost: '', location: '' })
  const [adjustData, setAdjustData] = useState({ type: 'IN', quantity: '1', reason: '' })
  const queryClient = useQueryClient()

  const { data: stats } = useQuery({
    queryKey: ['store-stats'],
    queryFn: () => apiClient.get('/store/stats').then((r) => r.data),
  })

  const { data: items, isLoading } = useQuery({
    queryKey: ['store-items', search, lowStockOnly],
    queryFn: () =>
      apiClient.get(`/store/items?${new URLSearchParams({
        ...(search ? { search } : {}),
        ...(lowStockOnly ? { lowStock: 'true' } : {}),
      })}`).then((r) => r.data),
    enabled: tab === 'inventory',
  })

  const { data: movements, isLoading: movementsLoading } = useQuery({
    queryKey: ['store-movements'],
    queryFn: () => apiClient.get('/store/movements').then((r) => r.data),
    enabled: tab === 'movements',
  })

  const createItem = useMutation({
    mutationFn: (data: any) => apiClient.post('/store/items', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-items'] })
      queryClient.invalidateQueries({ queryKey: ['store-stats'] })
      setShowAddItem(false)
      setNewItem({ name: '', category: 'General', unit: 'pcs', quantity: '0', minQuantity: '5', unitCost: '', location: '' })
    },
  })

  const adjustStock = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.post(`/store/items/${id}/adjust`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-items'] })
      queryClient.invalidateQueries({ queryKey: ['store-movements'] })
      queryClient.invalidateQueries({ queryKey: ['store-stats'] })
      setShowAdjust(null)
      setAdjustData({ type: 'IN', quantity: '1', reason: '' })
    },
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Store & Inventory</h1>
        <p className="text-gray-500 text-sm mt-1">Track supplies, equipment, and stock movements</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: stats?.totalItems ?? '—', color: 'text-blue-600' },
          { label: 'Low Stock', value: stats?.lowStockItems ?? '—', color: 'text-yellow-600' },
          { label: 'Out of Stock', value: stats?.outOfStock ?? '—', color: 'text-red-600' },
          { label: 'Inventory Value', value: stats ? `$${stats.totalValue?.toFixed(0)}` : '—', color: 'text-emerald-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[{ key: 'inventory', label: 'Inventory' }, { key: 'movements', label: 'Stock Movements' }].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as Tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Inventory Tab */}
      {tab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64"
            />
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="rounded"
              />
              Low stock only
            </label>
            <div className="ml-auto">
              <button
                onClick={() => setShowAddItem(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"
              >
                + Add Item
              </button>
            </div>
          </div>

          {showAddItem && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">New Inventory Item</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { key: 'name', label: 'Name *', placeholder: 'e.g. A4 Paper Ream' },
                  { key: 'category', label: 'Category', placeholder: 'General' },
                  { key: 'unit', label: 'Unit', placeholder: 'pcs / boxes / kg' },
                  { key: 'quantity', label: 'Initial Qty', type: 'number' },
                  { key: 'minQuantity', label: 'Min Qty (alert)', type: 'number' },
                  { key: 'unitCost', label: 'Unit Cost ($)', type: 'number' },
                  { key: 'location', label: 'Storage Location', placeholder: 'Room 101' },
                ].map(({ key, label, placeholder, type }) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 mb-1">{label}</label>
                    <input
                      type={type ?? 'text'}
                      value={(newItem as any)[key]}
                      onChange={(e) => setNewItem({ ...newItem, [key]: e.target.value })}
                      placeholder={placeholder}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => createItem.mutate({
                    ...newItem,
                    quantity: parseInt(newItem.quantity) || 0,
                    minQuantity: parseInt(newItem.minQuantity) || 5,
                    unitCost: newItem.unitCost ? parseFloat(newItem.unitCost) : undefined,
                  })}
                  disabled={createItem.isPending || !newItem.name}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {createItem.isPending ? 'Saving...' : 'Save Item'}
                </button>
                <button onClick={() => setShowAddItem(false)} className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {showAdjust && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Adjust Stock</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Type</label>
                  <select
                    value={adjustData.type}
                    onChange={(e) => setAdjustData({ ...adjustData, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="IN">Stock In</option>
                    <option value="OUT">Stock Out</option>
                    <option value="ADJUSTMENT">Adjustment (set absolute)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                  <input
                    type="number"
                    min={0}
                    value={adjustData.quantity}
                    onChange={(e) => setAdjustData({ ...adjustData, quantity: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Reason</label>
                  <input
                    value={adjustData.reason}
                    onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                    placeholder="Optional"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => adjustStock.mutate({ id: showAdjust, data: { ...adjustData, quantity: parseInt(adjustData.quantity) } })}
                  disabled={adjustStock.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {adjustStock.isPending ? 'Saving...' : 'Apply'}
                </button>
                <button onClick={() => setShowAdjust(null)} className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Loading inventory...</div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {(items ?? []).length === 0 && (
                <div className="p-8 text-center text-gray-400">No items found</div>
              )}
              {(items ?? []).map((item: any) => (
                <div key={item.id} className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.category} · {item.unit} · {item.location ?? 'No location'}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${item.quantity <= item.minQuantity ? 'text-red-600' : 'text-gray-900'}`}>
                      {item.quantity}
                    </p>
                    <p className="text-xs text-gray-400">Min: {item.minQuantity}</p>
                  </div>
                  {item.unitCost && (
                    <p className="text-sm text-gray-500">${item.unitCost}</p>
                  )}
                  {item.quantity <= item.minQuantity && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">Low Stock</span>
                  )}
                  <button
                    onClick={() => setShowAdjust(item.id)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg"
                  >
                    Adjust
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Movements Tab */}
      {tab === 'movements' && (
        <div className="bg-white rounded-xl border border-gray-200">
          {movementsLoading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {(movements ?? []).length === 0 && (
                <div className="p-8 text-center text-gray-400">No movements yet</div>
              )}
              {(movements ?? []).map((m: any) => (
                <div key={m.id} className="p-4 flex items-center gap-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${movementTypeColor[m.type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {m.type}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{m.item?.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{m.reason ?? 'No reason'} · {new Date(m.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="font-bold text-gray-700">
                    {m.type === 'IN' ? '+' : m.type === 'OUT' ? '-' : '='}{m.quantity} {m.item?.unit}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
