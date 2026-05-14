'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/authStore'
import { ShoppingCart, Plus, Minus, X, ChefHat } from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Role check ───────────────────────────────────────────────────────────────
const CANTEEN_ADMIN_ROLES = new Set(['CANTEEN_MANAGER', 'SCHOOL_ADMIN', 'VICE_PRINCIPAL', 'ACADEMIC_DIRECTOR', 'DEVELOPER', 'SUPER_ADMIN'])

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']

const statusColor: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-orange-100 text-orange-800',
  READY: 'bg-green-100 text-green-700',
  DELIVERED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-700',
}

const CATEGORY_EMOJI: Record<string, string> = {
  Main: '🍽️', Snacks: '🥨', Drinks: '🥤', Desserts: '🍰',
  Breakfast: '🍳', Salads: '🥗',
}

// ─── Consumer View ─────────────────────────────────────────────────────────────
function CanteenConsumerView() {
  const qc = useQueryClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = (searchParams.get('tab') as 'menu' | 'myorders') ?? 'menu'
  const [cart, setCart] = useState<Record<string, number>>({})
  const [note, setNote] = useState('')
  const [showCart, setShowCart] = useState(false)

  const { data: items, isLoading } = useQuery({
    queryKey: ['canteen-items'],
    queryFn: () => apiClient.get('/canteen/items').then((r) => r.data?.data ?? r.data ?? []),
    enabled: tab === 'menu',
  })

  const { data: myOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['canteen-my-orders'],
    queryFn: () => apiClient.get('/canteen/orders/my').then((r) => r.data?.data ?? r.data ?? []),
    enabled: tab === 'myorders',
  })

  const placeOrder = useMutation({
    mutationFn: (data: any) => apiClient.post('/canteen/orders', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['canteen-my-orders'] })
      setCart({})
      setNote('')
      setShowCart(false)
      toast.success('Order placed successfully!')
      router.push('?tab=myorders')
    },
    onError: () => toast.error('Failed to place order'),
  })

  const itemList: any[] = Array.isArray(items) ? items.filter((i: any) => i.isAvailable) : []
  const categories = itemList.length > 0
    ? [...new Set(itemList.map((i: any) => i.category))]
    : []

  const cartCount = Object.values(cart).reduce((s, v) => s + v, 0)
  const cartTotal = Object.entries(cart).reduce((s, [id, qty]) => {
    const item = itemList.find((i) => i.id === id)
    return s + (item?.price ?? 0) * qty
  }, 0)

  const addToCart = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }))
  const removeFromCart = (id: string) => setCart((c) => {
    const next = { ...c, [id]: (c[id] ?? 1) - 1 }
    if (next[id] <= 0) delete next[id]
    return next
  })

  const handleOrder = () => {
    const orderItems = Object.entries(cart).map(([itemId, quantity]) => ({ itemId, quantity }))
    if (orderItems.length === 0) return
    placeOrder.mutate({ items: orderItems, note })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ChefHat size={24} className="text-orange-500" /> Canteen
          </h1>
          <p className="text-gray-500 text-sm mt-1">Browse the menu and order your meal</p>
        </div>
        <button
          onClick={() => setShowCart(true)}
          className="relative flex items-center gap-2 bg-orange-500 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-orange-600 transition-colors"
        >
          <ShoppingCart size={18} />
          My Cart
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Menu Tab */}
      {tab === 'menu' && (
        isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-52 animate-pulse" />
            ))}
          </div>
        ) : itemList.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ChefHat size={48} className="mx-auto mb-3 opacity-30" />
            <p>No menu items available right now</p>
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map((cat) => {
              const catItems = itemList.filter((i) => i.category === cat)
              if (!catItems.length) return null
              return (
                <div key={cat}>
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span>{CATEGORY_EMOJI[cat] ?? '🍴'}</span> {cat}
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {catItems.map((item: any) => (
                      <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                        {/* Image */}
                        <div className="h-32 bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center text-5xl">
                          {item.imageUrl
                            ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            : <span>{CATEGORY_EMOJI[item.category] ?? '🍴'}</span>}
                        </div>
                        {/* Info */}
                        <div className="p-3">
                          <p className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</p>
                          {item.nameAr && <p className="text-xs text-gray-400 mt-0.5 font-arabic" dir="rtl">{item.nameAr}</p>}
                          {item.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.description}</p>}
                          <div className="flex items-center justify-between mt-3">
                            <span className="font-bold text-green-600">${item.price?.toFixed(2)}</span>
                            {/* Cart controls */}
                            {cart[item.id] ? (
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => removeFromCart(item.id)}
                                  className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-200">
                                  <Minus size={12} />
                                </button>
                                <span className="text-sm font-bold text-gray-900 w-4 text-center">{cart[item.id]}</span>
                                <button onClick={() => addToCart(item.id)}
                                  className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600">
                                  <Plus size={12} />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => addToCart(item.id)}
                                className="flex items-center gap-1 bg-orange-500 text-white text-xs px-2.5 py-1.5 rounded-lg hover:bg-orange-600 transition-colors">
                                <Plus size={12} /> Add
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* My Orders Tab */}
      {tab === 'myorders' && (
        ordersLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-gray-100 rounded-xl h-20 animate-pulse" />)}</div>
        ) : (Array.isArray(myOrders) ? myOrders : []).length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
            <p>No orders yet — browse the menu and place your first order!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(Array.isArray(myOrders) ? myOrders : []).map((order: any) => (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-xl shrink-0">
                  {order.status === 'DELIVERED' ? '✅' : order.status === 'CANCELLED' ? '❌' : order.status === 'READY' ? '🔔' : '⏳'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 truncate">
                    {order.items?.map((i: any) => `${i.item?.name} ×${i.quantity}`).join(' · ')}
                  </p>
                  {order.note && <p className="text-xs text-gray-400 italic mt-0.5">"{order.note}"</p>}
                  <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {order.status}
                  </span>
                  <span className="font-bold text-green-600 text-sm">${order.total?.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setShowCart(false)} />
          <div className="w-full max-w-sm bg-white flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-lg text-gray-900">🛒 My Cart</h2>
              <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cartCount === 0 ? (
                <p className="text-center text-gray-400 py-8">Your cart is empty</p>
              ) : (
                Object.entries(cart).map(([id, qty]) => {
                  const item = itemList.find((i) => i.id === id)
                  if (!item) return null
                  return (
                    <div key={id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-xl">
                        {CATEGORY_EMOJI[item.category] ?? '🍴'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-green-600">${(item.price * qty).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => removeFromCart(id)} className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"><Minus size={10} /></button>
                        <span className="text-sm font-bold w-4 text-center">{qty}</span>
                        <button onClick={() => addToCart(id)} className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600"><Plus size={10} /></button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {cartCount > 0 && (
              <div className="p-4 border-t space-y-3">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Special instructions (optional)..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none h-16 outline-none focus:border-orange-400"
                />
                <div className="flex items-center justify-between text-sm font-bold">
                  <span className="text-gray-600">Total</span>
                  <span className="text-green-600 text-lg">${cartTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={handleOrder}
                  disabled={placeOrder.isPending}
                  className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  {placeOrder.isPending ? 'Placing Order...' : `Place Order · $${cartTotal.toFixed(2)}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Admin Management View ────────────────────────────────────────────────────
type AdminTab = 'menu' | 'orders'

function CanteenAdminView() {
  const searchParams = useSearchParams()
  const tab = (searchParams.get('tab') as AdminTab) ?? 'menu'
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
    queryFn: () => apiClient.get('/canteen/items').then((r) => r.data?.data ?? r.data ?? []),
    enabled: tab === 'menu',
  })

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['canteen-orders', orderStatusFilter],
    queryFn: () => apiClient.get(`/canteen/orders${orderStatusFilter ? `?status=${orderStatusFilter}` : ''}`).then((r) => r.data?.data ?? r.data ?? []),
    enabled: tab === 'orders',
  })

  const createItem = useMutation({
    mutationFn: (data: any) => apiClient.post('/canteen/items', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canteen-items', 'canteen-stats'] })
      setShowAddItem(false)
      setNewItem({ name: '', nameAr: '', description: '', price: '', category: 'Main' })
    },
  })

  const toggleItem = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/canteen/items/${id}/toggle`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['canteen-items'] }),
  })

  const updateOrderStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiClient.patch(`/canteen/orders/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['canteen-orders'] }),
  })

  const itemList: any[] = Array.isArray(items) ? items : []
  const categories = itemList.length > 0
    ? [...new Set(itemList.map((i: any) => i.category))]
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

      {/* Menu Tab */}
      {tab === 'menu' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAddItem(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">+ Add Item</button>
          </div>
          {showAddItem && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">New Menu Item</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs text-gray-500 mb-1">Name (EN) *</label>
                  <input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Name (AR)</label>
                  <input value={newItem.nameAr} onChange={(e) => setNewItem({ ...newItem, nameAr: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" dir="rtl" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Price ($) *</label>
                  <input type="number" min={0} step={0.5} value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Category</label>
                  <select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {['Main', 'Snacks', 'Drinks', 'Desserts', 'Breakfast', 'Salads'].map((c) => <option key={c}>{c}</option>)}
                  </select></div>
                <div className="md:col-span-2"><label className="block text-xs text-gray-500 mb-1">Description</label>
                  <input value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => createItem.mutate({ ...newItem, price: parseFloat(newItem.price) })} disabled={createItem.isPending || !newItem.name || !newItem.price}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">
                  {createItem.isPending ? 'Saving...' : 'Save Item'}
                </button>
                <button onClick={() => setShowAddItem(false)} className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          )}
          {itemsLoading ? <div className="p-8 text-center text-gray-400">Loading menu...</div> : (
            <div className="space-y-4">
              {categories.map((cat) => {
                const catItems = itemList.filter((i: any) => i.category === cat)
                if (!catItems.length) return null
                return (
                  <div key={cat} className="bg-white rounded-xl border border-gray-200">
                    <div className="px-4 py-3 border-b bg-gray-50 rounded-t-xl">
                      <h3 className="font-semibold text-gray-700 text-sm">{CATEGORY_EMOJI[cat] ?? '🍴'} {cat}</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {catItems.map((item: any) => (
                        <div key={item.id} className="p-4 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-2xl shrink-0">
                            {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-xl" /> : CATEGORY_EMOJI[item.category] ?? '🍴'}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900">{item.name}</p>
                            {item.nameAr && <p className="text-xs text-gray-400" dir="rtl">{item.nameAr}</p>}
                            {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                          </div>
                          <p className="font-bold text-green-600">${item.price?.toFixed(2)}</p>
                          <button onClick={() => toggleItem.mutate(item.id)}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium ${item.isAvailable ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                            {item.isAvailable ? 'Available' : 'Unavailable'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              {itemList.length === 0 && <div className="p-8 text-center text-gray-400">No menu items yet</div>}
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b flex items-center gap-3">
            <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">All Statuses</option>
              {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          {ordersLoading ? <div className="p-8 text-center text-gray-400">Loading orders...</div> : (
            <div className="divide-y divide-gray-100">
              {(Array.isArray(orders) ? orders : []).length === 0 && <div className="p-8 text-center text-gray-400">No orders found</div>}
              {(Array.isArray(orders) ? orders : []).map((order: any) => (
                <div key={order.id} className="p-4 flex items-start gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">{order.user?.profile ? `${order.user.profile.firstName} ${order.user.profile.lastName}` : order.user?.email}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{order.items?.map((i: any) => `${i.item?.name} ×${i.quantity}`).join(', ')}</p>
                    {order.note && <p className="text-xs text-gray-400 italic">"{order.note}"</p>}
                    <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="font-bold text-green-600 text-sm">${order.total?.toFixed(2)}</p>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[order.status] ?? 'bg-gray-100 text-gray-600'}`}>{order.status}</span>
                    {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                      <select onChange={(e) => updateOrderStatus.mutate({ id: order.id, status: e.target.value })} defaultValue=""
                        className="text-xs border border-gray-300 rounded-lg px-2 py-1">
                        <option value="" disabled>Update →</option>
                        {ORDER_STATUSES.filter((s) => s !== order.status).map((s) => <option key={s} value={s}>{s}</option>)}
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

// ─── Root export — picks view based on role ────────────────────────────────────
function CanteenPageInner() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = CANTEEN_ADMIN_ROLES.has(user?.role ?? '')
  return isAdmin ? <CanteenAdminView /> : <CanteenConsumerView />
}

export default function CanteenPage() {
  return (
    <Suspense>
      <CanteenPageInner />
    </Suspense>
  )
}
