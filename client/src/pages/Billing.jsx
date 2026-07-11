import { useState, useEffect } from 'react'
import { Plus, X, CreditCard, Banknote } from 'lucide-react'
import API from '../api/axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const statusStyles = {
  paid:    'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  overdue: 'bg-red-50 text-red-700',
  partial: 'bg-blue-50 text-blue-700',
}

function GenerateModal({ onClose, onGenerate, residents }) {
  const [residentId, setResidentId] = useState('')
  const [lineItems, setLineItems]   = useState([
    { description: 'Room Rent', amount: 0 },
    { description: 'Electricity', amount: 0 },
    { description: 'Water', amount: 0 },
  ])
  const [discount, setDiscount] = useState(0)
  const [lateFee, setLateFee]   = useState(0)
  const [dueDate, setDueDate]   = useState('')
  const [saving, setSaving]     = useState(false)

  // Auto-populate Room Rent when resident is selected
  useEffect(() => {
    if (!residentId) return
    const selected = residents.find(r => r._id === residentId)
    if (selected?.roomId?.price) {
      setLineItems(items => items.map(item =>
        item.description === 'Room Rent'
          ? { ...item, amount: selected.roomId.price }
          : item
      ))
    }
  }, [residentId])

  const updateItem = (i, field, val) => {
    setLineItems(items => items.map((item, idx) =>
      idx === i ? { ...item, [field]: field === 'amount' ? Number(val) : val } : item
    ))
  }

  const addItem    = () => setLineItems(i => [...i, { description: '', amount: 0 }])
  const removeItem = (i) => setLineItems(items => items.filter((_, idx) => idx !== i))

  const subtotal = lineItems.reduce((s, i) => s + i.amount, 0)
  const total    = subtotal - Number(discount) + Number(lateFee)

  const handleSubmit = async () => {
    if (!residentId)               return toast.error('Select a resident')
    if (!dueDate)                  return toast.error('Set a due date')
    if (lineItems.some(i => !i.description.trim())) return toast.error('All line items need a description')
    setSaving(true)
    try {
      await API.post('/invoices/generate', {
        residentId, lineItems, discount: Number(discount),
        lateFee: Number(lateFee), dueDate, total
      })
      toast.success('Invoice generated!')
      onGenerate()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const selectedResident = residents.find(r => r._id === residentId)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold">Generate Invoice</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X size={16}/>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Resident <span className="text-red-400">*</span>
            </label>
            <select value={residentId} onChange={e => setResidentId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm
                         focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">Select resident</option>
              {residents.filter(r => r.status === 'active').map(r => (
                <option key={r._id} value={r._id}>
                  {r.name} — Room {r.roomId?.number || '?'} (₹{r.roomId?.price?.toLocaleString()}/mo)
                </option>
              ))}
            </select>
            {selectedResident?.roomId && (
              <p className="text-xs text-emerald-600 mt-1">
                Room rent of ₹{selectedResident.roomId.price?.toLocaleString()} auto-filled below.
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500">Line Items</label>
              <button onClick={addItem}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                + Add item
              </button>
            </div>
            <div className="space-y-2">
              {lineItems.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={item.description}
                    onChange={e => updateItem(i, 'description', e.target.value)}
                    placeholder="Description"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm
                               focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">₹</span>
                    <input type="number" value={item.amount}
                      onChange={e => updateItem(i, 'amount', e.target.value)}
                      className="w-28 pl-5 pr-2 py-2 rounded-lg border border-gray-200 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  {lineItems.length > 1 && (
                    <button onClick={() => removeItem(i)}
                      className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded">
                      <X size={14}/>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Discount (₹)</label>
              <input type="number" value={discount} onChange={e => setDiscount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Late Fee (₹)</label>
              <input type="number" value={lateFee} onChange={e => setLateFee(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Due Date <span className="text-red-400">*</span>
            </label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm
                         focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Discount</span>
              <span className="text-emerald-600">-₹{Number(discount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Late Fee</span>
              <span className="text-red-500">+₹{Number(lateFee).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>₹{total.toLocaleString()}</span>
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
            {saving ? 'Generating…' : 'Generate Invoice'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PayModal({ invoice, onClose, onPay }) {
  const [amount, setAmount] = useState(invoice.total)
  const [method, setMethod] = useState('cash')
  const [saving, setSaving] = useState(false)

  const handlePay = async () => {
    if (!amount || Number(amount) <= 0) return toast.error('Enter a valid amount')
    setSaving(true)
    try {
      await API.post(`/invoices/${invoice._id}/pay`, { amount: Number(amount), method })
      toast.success('Payment recorded!')
      onPay()
      onClose()
    } catch {
      toast.error('Payment failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold">Record Payment</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X size={16}/>
          </button>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="text-xs text-gray-400 mb-1">Invoice Total</div>
          <div className="text-2xl font-semibold text-gray-900">
            ₹{invoice.total.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400 mt-1">{invoice.residentId?.name}</div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Amount (₹)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm
                         focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'cash', icon: Banknote,    label: 'Cash' },
                { id: 'upi',  icon: CreditCard,  label: 'UPI' },
                { id: 'bank', icon: CreditCard,  label: 'Bank Transfer' },
                { id: 'card', icon: CreditCard,  label: 'Card' },
              ].map(({ id, icon: Icon, label }) => (
                <button key={id} onClick={() => setMethod(id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition
                    ${method === id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  <Icon size={14}/>{label}
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
          <button onClick={handlePay} disabled={saving}
            className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-sm
                       font-medium hover:bg-emerald-700 disabled:bg-emerald-300">
            {saving ? 'Processing…' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Billing() {
  const { user } = useAuth()
  const [invoices, setInvoices]         = useState([])
  const [residents, setResidents]       = useState([])
  const [filter, setFilter]             = useState('all')
  const [loading, setLoading]           = useState(true)
  const [showGenerate, setShowGenerate] = useState(false)
  const [payInvoice, setPayInvoice]     = useState(null)

  const fetchAll = () => {
    API.get('/invoices')
      .then(res => setInvoices(res.data))
      .catch(() => toast.error('Failed to load invoices'))
      .finally(() => setLoading(false))

    if (user?.role !== 'resident') {
      API.get('/residents')
        .then(res => setResidents(res.data))
        .catch(() => setResidents([]))
    }
  }

  useEffect(() => { fetchAll() }, [])

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter)

  const stats = {
    total:       invoices.reduce((s, i) => s + i.total, 0),
    collected:   invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0),
    outstanding: invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + i.total, 0),
    overdue:     invoices.filter(i => i.status === 'overdue').length,
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Total Billed',     value: `₹${stats.total.toLocaleString()}`,       color: 'text-gray-800' },
          { label: 'Collected',        value: `₹${stats.collected.toLocaleString()}`,    color: 'text-emerald-600' },
          { label: 'Outstanding',      value: `₹${stats.outstanding.toLocaleString()}`,  color: 'text-amber-600' },
          { label: 'Overdue Accounts', value: stats.overdue,                             color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className={`text-2xl font-semibold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters + Actions */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex gap-1 flex-wrap">
            {['all','pending','paid','overdue','partial'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition
                  ${filter === f ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                {f}
              </button>
            ))}
          </div>
          {user?.role !== 'resident' && (
            <button onClick={() => setShowGenerate(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white
                         rounded-lg text-sm font-medium hover:bg-emerald-700 transition">
              <Plus size={14} />Generate Invoice
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="text-center py-16 text-sm text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-400">No invoices found</div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-50">
              <tr>
                {['Invoice','Resident','Items','Total','Due Date','Status','Action'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-400
                                         uppercase tracking-wide py-3 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, i) => (
                <tr key={inv._id}
                  className={`border-b border-gray-50 hover:bg-gray-50 transition
                    ${inv.status === 'overdue' ? 'bg-red-50/30' : ''}`}>
                  <td className="py-3 px-4 text-xs text-gray-400 font-mono">
                    INV-{String(i + 1).padStart(4, '0')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm font-medium text-gray-800">
                      {inv.residentId?.name || '—'}
                    </div>
                    <div className="text-xs text-gray-400">{inv.residentId?.email}</div>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">
                    {inv.lineItems?.map(li => li.description).join(', ')}
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-gray-800">
                    ₹{inv.total.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium capitalize
                                     ${statusStyles[inv.status]}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {inv.status !== 'paid' && (
                      <button onClick={() => setPayInvoice(inv)}
                        className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700
                                   rounded-lg hover:bg-emerald-100 transition font-medium">
                        Pay
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showGenerate && (
        <GenerateModal
          onClose={() => setShowGenerate(false)}
          onGenerate={fetchAll}
          residents={residents}
        />
      )}

      {payInvoice && (
        <PayModal
          invoice={payInvoice}
          onClose={() => setPayInvoice(null)}
          onPay={fetchAll}
        />
      )}
    </div>
  )
}