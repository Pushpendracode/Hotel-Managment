import { useState, useEffect } from 'react'
import { Plus, X, Wrench } from 'lucide-react'
import API from '../api/axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const priorityStyles = {
  high:   'bg-red-50 text-red-700',
  medium: 'bg-amber-50 text-amber-700',
  low:    'bg-gray-100 text-gray-600',
}

const statusStyles = {
  open:       'bg-red-50 text-red-700',
  inprogress: 'bg-amber-50 text-amber-700',
  completed:  'bg-emerald-50 text-emerald-700',
}

const statusLabel = {
  open: 'Open',
  inprogress: 'In Progress',
  completed: 'Completed',
}

function NewRequestModal({ onClose, onAdd, rooms }) {
  const [form, setForm] = useState({ issue: '', priority: 'medium', roomId: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.issue) return toast.error('Describe the issue')
    setSaving(true)
    try {
      await API.post('/maintenance', form)
      toast.success('Request submitted!')
      onAdd()
      onClose()
    } catch {
      toast.error('Failed to submit')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">New Maintenance Request</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Room</label>
            <select value={form.roomId} onChange={e => setForm(f => ({ ...f, roomId: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm
                         focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">Select room (optional)</option>
              {rooms.map(r => (
                <option key={r._id} value={r._id}>Room {r.number} — Floor {r.floor}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Issue Description *</label>
            <textarea value={form.issue} onChange={e => setForm(f => ({ ...f, issue: e.target.value }))}
              rows={3} placeholder="Describe the issue in detail…"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Priority</label>
            <div className="flex gap-2">
              {['low', 'medium', 'high'].map(p => (
                <button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition
                    border ${form.priority === p
                      ? p === 'high'   ? 'bg-red-500 text-white border-red-500'
                      : p === 'medium' ? 'bg-amber-500 text-white border-amber-500'
                      :                  'bg-gray-500 text-white border-gray-500'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-sm
                       font-medium hover:bg-emerald-700 disabled:bg-emerald-300">
            {saving ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Maintenance() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [rooms, setRooms]       = useState([])
  const [filter, setFilter]     = useState('all')
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)

  const fetchAll = () => {
    Promise.all([API.get('/maintenance'), API.get('/rooms')])
      .then(([m, r]) => { setRequests(m.data); setRooms(r.data) })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [])

  const handleStatusUpdate = async (id, status) => {
    try {
      await API.put(`/maintenance/${id}/status`, { status })
      toast.success('Status updated!')
      fetchAll()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const filtered = filter === 'all'
    ? requests
    : requests.filter(r => r.status === filter || r.priority === filter)

  const stats = {
    open:       requests.filter(r => r.status === 'open').length,
    inprogress: requests.filter(r => r.status === 'inprogress').length,
    completed:  requests.filter(r => r.status === 'completed').length,
    high:       requests.filter(r => r.priority === 'high').length,
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Open',        value: stats.open,       color: 'text-red-600' },
          { label: 'In Progress', value: stats.inprogress, color: 'text-amber-600' },
          { label: 'Completed',   value: stats.completed,  color: 'text-emerald-600' },
          { label: 'High Priority', value: stats.high,     color: 'text-red-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className={`text-2xl font-semibold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters + Add */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-1 flex-wrap">
            {['all','open','inprogress','completed','high','medium','low'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition
                  ${filter === f
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100'}`}>
                {f === 'inprogress' ? 'In Progress' : f}
              </button>
            ))}
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white
                       rounded-lg text-sm font-medium hover:bg-emerald-700 transition">
            <Plus size={14} />New Request
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-sm text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Wrench size={32} className="mx-auto text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">No maintenance requests</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-50">
              <tr>
                {['#', 'Room', 'Issue', 'Priority', 'Assigned To', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-400
                                         uppercase tracking-wide py-3 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((req, i) => (
                <tr key={req._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="py-3 px-4 text-xs text-gray-400 font-mono">
                    #MR-{String(i + 1).padStart(3, '0')}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {req.roomId ? `Room ${req.roomId.number}` : '—'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-800 max-w-xs truncate">
                    {req.issue}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium capitalize
                                     ${priorityStyles[req.priority]}`}>
                      {req.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {req.assignedTo || <span className="text-gray-300">Unassigned</span>}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {new Date(req.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium
                                     ${statusStyles[req.status]}`}>
                      {statusLabel[req.status]}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {user?.role !== 'resident' && req.status !== 'completed' && (
                      <div className="flex gap-1">
                        {req.status === 'open' && (
                          <button onClick={() => handleStatusUpdate(req._id, 'inprogress')}
                            className="text-xs px-2 py-1 bg-amber-50 text-amber-700
                                       rounded-lg hover:bg-amber-100 transition">
                            Start
                          </button>
                        )}
                        {req.status === 'inprogress' && (
                          <button onClick={() => handleStatusUpdate(req._id, 'completed')}
                            className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700
                                       rounded-lg hover:bg-emerald-100 transition">
                            Complete
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <NewRequestModal
          onClose={() => setShowAdd(false)}
          onAdd={fetchAll}
          rooms={rooms}
        />
      )}
    </div>
  )
}