import { useState, useEffect } from 'react'
import { DoorOpen, Receipt, Wrench, Plus, X } from 'lucide-react'
import API from '../api/axios'
import { useAuth } from '../context/AuthContext'

function StatusBadge({ status }) {
  const styles = {
    paid: 'bg-emerald-50 text-emerald-700',
    pending: 'bg-amber-50 text-amber-700',
    overdue: 'bg-red-50 text-red-600',
    partial: 'bg-blue-50 text-blue-700',
    open: 'bg-amber-50 text-amber-700',
    inprogress: 'bg-blue-50 text-blue-700',
    completed: 'bg-emerald-50 text-emerald-700',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium capitalize ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

function NewRequestModal({ onClose, onCreated }) {
  const [issue, setIssue] = useState('')
  const [priority, setPriority] = useState('medium')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!issue.trim()) { setError('Please describe the issue'); return }
    setSaving(true)
    setError('')
    try {
      // roomId & residentId are set server-side from the logged-in user — never sent from here
      await API.post('/maintenance', { issue: issue.trim(), priority, status: 'open' })
      onCreated()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">New Maintenance Request</h3>
          <button onClick={onClose}><X size={16} className="text-gray-400" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Issue</label>
            <textarea
              value={issue}
              onChange={e => setIssue(e.target.value)}
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-emerald-400"
              placeholder="e.g. AC not cooling properly"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Priority</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-emerald-400"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-emerald-600 text-white text-sm font-medium rounded-lg py-2 hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Submitting…' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResidentDashboard() {
  const { user } = useAuth()
  const [resident, setResident] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const loadRequests = () => {
    API.get('/maintenance').then(res => setRequests(res.data)).catch(() => setRequests([]))
  }

  useEffect(() => {
    Promise.all([
      API.get('/residents/me').then(res => setResident(res.data)).catch(() => setResident(null)),
      API.get('/invoices').then(res => setInvoices(res.data)).catch(() => setInvoices([])),
      API.get('/maintenance').then(res => setRequests(res.data)).catch(() => setRequests([])),
    ]).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-center py-10 text-sm text-gray-400">Loading your dashboard…</div>
  }

  const room = resident?.roomId
  const pendingInvoices = invoices.filter(i => i.status !== 'paid')

  return (
    <div>
      {showModal && (
        <NewRequestModal onClose={() => setShowModal(false)} onCreated={loadRequests} />
      )}

      {/* Welcome + Room Info */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
        <h2 className="text-base font-semibold text-gray-900 mb-1">
          Welcome, {user?.name}
        </h2>
        {room ? (
          <div className="flex items-center gap-4 mt-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DoorOpen size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Room #{room.number} · Floor {room.floor}</p>
              <p className="text-xs text-gray-400 capitalize">{room.type} · ₹{room.price?.toLocaleString()}/mo</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No room assigned yet — contact the front desk.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Invoices */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Receipt size={15} className="text-purple-500" /> Your Invoices
            </h2>
            {pendingInvoices.length > 0 && (
              <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-md font-medium">
                {pendingInvoices.length} due
              </span>
            )}
          </div>
          {invoices.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No invoices yet.</p>
          ) : (
            <div className="space-y-2">
              {invoices.slice(0, 5).map(inv => (
                <div key={inv._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm text-gray-800">
                      {new Date(inv.dueDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-400">₹{inv.total?.toLocaleString()}</p>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Maintenance Requests */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Wrench size={15} className="text-amber-500" /> Maintenance Requests
            </h2>
            <button
              onClick={() => setShowModal(true)}
              disabled={!room}
              className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 disabled:text-gray-300"
            >
              <Plus size={12} /> New
            </button>
          </div>
          {requests.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No requests submitted.</p>
          ) : (
            <div className="space-y-2">
              {requests.slice(0, 5).map(req => (
                <div key={req._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm text-gray-800">{req.issue}</p>
                    <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}