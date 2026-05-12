'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export default function BoardingPage() {
  const [tab, setTab] = useState<'rooms' | 'health' | 'incidents'>('rooms')
  const [showRoomForm, setShowRoomForm] = useState(false)
  const [roomForm, setRoomForm] = useState({ roomNumber: '', floor: '', capacity: 4, type: 'dormitory' })
  const queryClient = useQueryClient()

  const { data: stats } = useQuery({
    queryKey: ['boarding-stats'],
    queryFn: () => apiClient.get('/boarding/stats').then((r) => r.data),
  })

  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ['boarding-rooms'],
    queryFn: () => apiClient.get('/boarding/rooms').then((r) => r.data),
    enabled: tab === 'rooms',
  })

  const { data: healthVisits } = useQuery({
    queryKey: ['boarding-health'],
    queryFn: () => apiClient.get('/health/visits?limit=20').then((r) => r.data).catch(() => []),
    enabled: tab === 'health',
  })

  const createRoom = useMutation({
    mutationFn: (data: any) => apiClient.post('/boarding/rooms', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boarding-rooms'] })
      queryClient.invalidateQueries({ queryKey: ['boarding-stats'] })
      setShowRoomForm(false)
      setRoomForm({ roomNumber: '', floor: '', capacity: 4, type: 'dormitory' })
    },
  })

  const roomsList = Array.isArray(rooms) ? rooms : []
  const totalCapacity = stats?.totalCapacity ?? 0
  const totalOccupied = stats?.totalOccupied ?? 0
  const fullRooms = stats?.fullRooms ?? 0
  const vacantRooms = stats?.vacantRooms ?? 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Boarding House</h1>
        <p className="text-gray-500 text-sm mt-1">Room management, boarder health, and incident tracking</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Boarders', value: totalOccupied, color: 'text-blue-600' },
          { label: 'Capacity', value: totalCapacity, color: 'text-gray-700' },
          { label: 'Full Rooms', value: fullRooms, color: 'text-red-600' },
          { label: 'Vacant Rooms', value: vacantRooms, color: 'text-green-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Occupancy bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Occupancy</span>
          <span className="text-sm font-bold text-blue-600">{stats?.occupancyRate ?? 0}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all"
            style={{ width: `${stats?.occupancyRate ?? 0}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">{totalOccupied} / {totalCapacity} beds occupied</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[{ key: 'rooms', label: 'Room Overview' }, { key: 'health', label: 'Health Visits' }, { key: 'incidents', label: 'Incidents' }].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'rooms' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowRoomForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
              + Add Room
            </button>
          </div>

          {showRoomForm && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">New Boarding Room</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'roomNumber', label: 'Room Number *', type: 'text' },
                  { key: 'floor', label: 'Floor', type: 'text' },
                  { key: 'capacity', label: 'Capacity', type: 'number' },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 mb-1">{label}</label>
                    <input
                      type={type}
                      value={(roomForm as any)[key]}
                      onChange={(e) => setRoomForm({ ...roomForm, [key]: type === 'number' ? parseInt(e.target.value) : e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Type</label>
                  <select
                    value={roomForm.type}
                    onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="dormitory">Dormitory</option>
                    <option value="private">Private</option>
                    <option value="shared">Shared</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => createRoom.mutate(roomForm)}
                  disabled={!roomForm.roomNumber || createRoom.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {createRoom.isPending ? 'Creating...' : 'Create Room'}
                </button>
                <button onClick={() => setShowRoomForm(false)} className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          )}

          {roomsLoading ? (
            <div className="text-center text-gray-400 py-8">Loading rooms...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roomsList.length === 0 && (
                <div className="col-span-full bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                  No rooms yet. Add your first boarding room.
                </div>
              )}
              {roomsList.map((room: any) => {
                const pct = room.capacity > 0 ? Math.round((room.occupied / room.capacity) * 100) : 0
                const isFull = room.occupied >= room.capacity
                const isEmpty = room.occupied === 0
                return (
                  <div key={room.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">Room {room.roomNumber}</h3>
                        <p className="text-xs text-gray-500">{room.floor ? `${room.floor} Floor` : ''} · {room.type}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${isFull ? 'bg-red-100 text-red-700' : isEmpty ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                        {isFull ? 'Full' : isEmpty ? 'Vacant' : 'Available'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full ${isFull ? 'bg-red-500' : 'bg-blue-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">{room.occupied} / {room.capacity} beds</p>
                    {room.occupants?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {room.occupants.map((o: any) => (
                          <span key={o.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                            {o.user?.profile ? `${o.user.profile.firstName} ${o.user.profile.lastName}` : o.user?.email}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'health' && (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {!healthVisits && <div className="p-6 text-center text-gray-400">Loading...</div>}
          {Array.isArray(healthVisits) && healthVisits.length === 0 && (
            <div className="p-6 text-center text-gray-400">No recent health visits</div>
          )}
          {(Array.isArray(healthVisits) ? healthVisits : []).map((v: any) => (
            <div key={v.id} className="p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm text-gray-900">
                  {v.student?.profile ? `${v.student.profile.firstName} ${v.student.profile.lastName}` : v.student?.email}
                </p>
                <p className="text-xs text-gray-400">{new Date(v.visitedAt ?? v.visitDate).toLocaleDateString()}</p>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Complaint: {v.complaint}</p>
              {v.treatment && <p className="text-xs text-gray-400 mt-0.5">Treatment: {v.treatment}</p>}
              {v.sentHome && <span className="inline-block mt-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">Sent Home</span>}
            </div>
          ))}
        </div>
      )}

      {tab === 'incidents' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          <p>Incident reporting coming soon.</p>
          <p className="text-xs mt-1">This will track disciplinary issues, rule violations, and maintenance requests.</p>
        </div>
      )}
    </div>
  )
}
