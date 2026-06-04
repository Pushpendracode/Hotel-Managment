import { useState, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import API from '../api/axios'
import toast from 'react-hot-toast'

const statusColors = {
  occupied:    'bg-emerald-100 border-emerald-300 text-emerald-800',
  vacant:      'bg-gray-100 border-gray-200 text-gray-600',
  maintenance: 'bg-amber-100 border-amber-300 text-amber-800',
  reserved:    'bg-blue-100 border-blue-300 text-blue-800',
}

const statusDot = {
  occupied:    'bg-emerald-500',
  vacant:      'bg-gray-400',
  maintenance: 'bg-amber-500',
  reserved:    'bg-blue-500',
}

function RoomCell({ room, onClick }) {
  return (
    <div
      onClick={() => onClick(room)}
      className={`border rounded-xl p-3 cursor-pointer transition hover:shadow-md hover:scale-105
                  ${statusColors[room.status]}`}
    >
      <div className="text-sm font-semibold">#{room.number}</div>
      <div className="text-xs mt-0.5 capitalize opacity-75">{room.type}</div>
      <div className="text-xs mt-1 font-medium">₹{room.price.toLocaleString()}</div>
    </div>
  )
}

function Modal({ room, onClose, onUpdate }) {
  const [status, setStatus] = useState(room.status)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await API.put(`/rooms/${room._id}/status`, { status })
      toast.success('Room status updated!')
      onUpdate()
      onClose()
    } catch {
      toast.error('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Room #{room.number}</h2>
          <button onClick={onClose}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 mb-5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Floor</span>
            <span className="font-medium">Floor {room.floor}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Type</span>
            <span className="font-medium capitalize">{room.type}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Price</span>
            <span className="font-medium">₹{room.price.toLocaleString()}/mo</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Amenities</span>
            <span className="font-medium">{room.amenities?.join(', ') || 'None'}</span>
          </div>
          {room.residentId && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Resident</span>
              <span className="font-medium">{room.residentId.name}</span>
            </div>
          )}
        </div>

        <div className="mb-5">
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">
            Update Status
          </label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm
                       focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="vacant">Vacant</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
            <option value="reserved">Reserved</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose}
                  className="flex-1 py-2 rounded-lg border border-gray-200
                             text-sm text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2 rounded-lg bg-emerald-600 text-white
                             text-sm font-medium hover:bg-emerald-700 transition
                             disabled:bg-emerald-300">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Rooms() {
  const [rooms, setRooms]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)

  const fetchRooms = () => {
    API.get('/rooms')
      .then(res => setRooms(res.data))
      .catch(() => toast.error('Failed to load rooms'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchRooms() }, [])

  const floors = [...new Set(rooms.map(r => r.floor))].sort()

  const stats = {
    occupied:    rooms.filter(r => r.status === 'occupied').length,
    vacant:      rooms.filter(r => r.status === 'vacant').length,
    maintenance: rooms.filter(r => r.status === 'maintenance').length,
    reserved:    rooms.filter(r => r.status === 'reserved').length,
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Occupied',    value: stats.occupied,    color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Vacant',      value: stats.vacant,      color: 'text-gray-600',    bg: 'bg-gray-50' },
          { label: 'Maintenance', value: stats.maintenance, color: 'text-amber-600',   bg: 'bg-amber-50' },
          { label: 'Reserved',    value: stats.reserved,    color: 'text-blue-600',    bg: 'bg-blue-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-4`}>
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className={`text-2xl font-semibold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4">
        {Object.entries(statusDot).map(([key, dot]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-gray-500 capitalize">
            <div className={`w-2 h-2 rounded-full ${dot}`}></div>
            {key}
          </div>
        ))}
      </div>

      {/* Floor grids */}
      {loading ? (
        <div className="text-center py-16 text-sm text-gray-400">Loading rooms…</div>
      ) : (
        floors.map(floor => (
          <div key={floor} className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Floor {floor}</h2>
              <span className="text-xs text-gray-400">
                {rooms.filter(r => r.floor === floor && r.status === 'occupied').length}/
                {rooms.filter(r => r.floor === floor).length} occupied
              </span>
            </div>
            <div className="grid grid-cols-8 gap-2">
              {rooms
                .filter(r => r.floor === floor)
                .sort((a, b) => a.number.localeCompare(b.number))
                .map(room => (
                  <RoomCell key={room._id} room={room} onClick={setSelected} />
                ))}
            </div>
          </div>
        ))
      )}

      {/* Room detail modal */}
      {selected && (
        <Modal
          room={selected}
          onClose={() => setSelected(null)}
          onUpdate={fetchRooms}
        />
      )}
    </div>
  )
}