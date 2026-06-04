import { useState, useEffect } from 'react'
import { Search, Plus, X, Phone, Mail, Home } from 'lucide-react'
import API from '../api/axios'
import toast from 'react-hot-toast'

function AddResidentModal({ onClose, onAdd, vacantRooms }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    roomId: '', checkIn: '', checkOut: '',
    emergencyContact: { name: '', phone: '' }
  })
  const [saving, setSaving] = useState(false)

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.roomId || !form.checkIn) {
      return toast.error('Fill in all required fields')
    }
    setSaving(true)
    try {
      await API.post('/residents', form)
      toast.success('Resident added!')
      onAdd()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add resident')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Add New Resident</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Full Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Rajesh Kumar"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Email *</label>
              <input value={form.email} onChange={e => set('email', e.target.value)}
                type="email" placeholder="rajesh@email.com"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Assign Room *</label>
              <select value={form.roomId} onChange={e => set('roomId', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">Select a room</option>
                {vacantRooms.map(r => (
                  <option key={r._id} value={r._id}>
                    Room {r.number} — {r.type} — ₹{r.price.toLocaleString()}/mo
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Check-in Date *</label>
              <input value={form.checkIn} onChange={e => set('checkIn', e.target.value)}
                type="date"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Check-out Date</label>
              <input value={form.checkOut} onChange={e => set('checkOut', e.target.value)}
                type="date"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">Emergency Contact</p>
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Contact name"
                value={form.emergencyContact.name}
                onChange={e => setForm(f => ({
                  ...f, emergencyContact: { ...f.emergencyContact, name: e.target.value }
                }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                placeholder="Contact phone"
                value={form.emergencyContact.phone}
                onChange={e => setForm(f => ({
                  ...f, emergencyContact: { ...f.emergencyContact, phone: e.target.value }
                }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
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
            {saving ? 'Adding…' : 'Add Resident'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Residents() {
  const [residents, setResidents] = useState([])
  const [rooms, setRooms]         = useState([])
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState('all')
  const [showAdd, setShowAdd]     = useState(false)
  const [loading, setLoading]     = useState(true)

  const fetchAll = () => {
    Promise.all([API.get('/residents'), API.get('/rooms')])
      .then(([r, rm]) => {
        setResidents(r.data)
        setRooms(rm.data)
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [])

  const vacantRooms = rooms.filter(r => r.status === 'vacant')

  const handleCheckout = async (id) => {
    if (!window.confirm('Confirm checkout?')) return
    try {
      await API.put(`/residents/${id}/checkout`)
      toast.success('Checked out successfully')
      fetchAll()
    } catch {
      toast.error('Checkout failed')
    }
  }

  const filtered = residents.filter(r => {
    const matchSearch = r.name?.toLowerCase().includes(search.toLowerCase()) ||
                        r.email?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || r.status === filter
    return matchSearch && matchFilter
  })

  const avatar = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const avatarColors = [
    'bg-emerald-100 text-emerald-700',
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-amber-100 text-amber-700',
    'bg-red-100 text-red-700',
  ]

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Residents', value: residents.length, color: 'text-gray-800' },
          { label: 'Active',  value: residents.filter(r => r.status === 'active').length,  color: 'text-emerald-600' },
          { label: 'Pending', value: residents.filter(r => r.status === 'pending').length, color: 'text-amber-600' },
          { label: 'Checked Out', value: residents.filter(r => r.status === 'checkedout').length, color: 'text-gray-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className={`text-2xl font-semibold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-1">
            {['all', 'active', 'pending', 'checkedout'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition
                  ${filter === f
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100'}`}>
                {f === 'all' ? 'All' : f === 'checkedout' ? 'Checked Out' : f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search residents…"
                className="pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm w-52
                           focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white
                         rounded-lg text-sm font-medium hover:bg-emerald-700 transition">
              <Plus size={14} />Add Resident
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-sm text-gray-400">Loading residents…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-400">No residents found</div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-50">
              <tr>
                {['Resident', 'Room', 'Phone', 'Check-in', 'Check-out', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-400
                                         uppercase tracking-wide py-3 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center
                                      text-xs font-semibold flex-shrink-0
                                      ${avatarColors[i % avatarColors.length]}`}>
                        {avatar(r.name)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{r.name}</div>
                        <div className="text-xs text-gray-400">{r.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {r.roomId ? `#${r.roomId.number || r.roomId}` : '—'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{r.phone || '—'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {r.checkIn ? new Date(r.checkIn).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {r.checkOut ? new Date(r.checkOut).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium capitalize
                      ${r.status === 'active'     ? 'bg-emerald-50 text-emerald-700' :
                        r.status === 'pending'    ? 'bg-amber-50 text-amber-700' :
                        r.status === 'checkedout' ? 'bg-gray-100 text-gray-500' :
                                                    'bg-red-50 text-red-700'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {r.status !== 'checkedout' && (
                      <button onClick={() => handleCheckout(r._id)}
                        className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50
                                   px-2 py-1 rounded-lg transition">
                        Checkout
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <AddResidentModal
          onClose={() => setShowAdd(false)}
          onAdd={fetchAll}
          vacantRooms={vacantRooms}
        />
      )}
    </div>
  )
}