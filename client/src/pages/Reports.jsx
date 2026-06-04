import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, PieChart, Pie,
  Cell, Legend
} from 'recharts'
import API from '../api/axios'
import toast from 'react-hot-toast'

const COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function MetricCard({ label, value, sub, subColor = 'text-gray-400' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="text-xs text-gray-400 mb-2">{label}</div>
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
      {sub && <div className={`text-xs mt-1 ${subColor}`}>{sub}</div>}
    </div>
  )
}

export default function Reports() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange]   = useState('6months')

  useEffect(() => {
    API.get('/reports/summary')
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-sm text-gray-400">
      Loading reports…
    </div>
  )

  if (!data) return null

  const { summary, monthlyData, categories } = data

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Financial Reports</h2>
          <p className="text-xs text-gray-400 mt-0.5">Overview of hostel performance</p>
        </div>
        <select value={range} onChange={e => setRange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm
                     focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="6months">Last 6 Months</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Total Revenue"
          value={`₹${summary.totalRevenue.toLocaleString()}`}
          sub="↑ From paid invoices"
          subColor="text-emerald-500"
        />
        <MetricCard
          label="Occupancy Rate"
          value={`${summary.occupancyRate}%`}
          sub={`${summary.occupied} / ${summary.totalRooms} rooms`}
          subColor="text-blue-500"
        />
        <MetricCard
          label="Outstanding"
          value={`₹${summary.outstanding.toLocaleString()}`}
          sub="Pending + overdue"
          subColor="text-amber-500"
        />
        <MetricCard
          label="Open Issues"
          value={summary.openIssues}
          sub="Maintenance requests"
          subColor="text-red-400"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-3 gap-4 mb-4">

        {/* Revenue vs Expenses */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData}>
              <XAxis dataKey="month" axisLine={false} tickLine={false}
                     tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis axisLine={false} tickLine={false}
                     tick={{ fontSize: 11, fill: '#9ca3af' }}
                     tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v, name) => [`₹${v.toLocaleString()}`, name]}
                contentStyle={{ borderRadius: 8, border: '1px solid #f3f4f6', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="revenue" name="Revenue"
                    stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="expenses" name="Expenses"
                    stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Category */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue by Category</h3>
          {categories.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-gray-300">
              No invoice data yet
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={categories} dataKey="value" nameKey="name"
                       cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                    {categories.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={v => `₹${v.toLocaleString()}`}
                           contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {categories.map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full"
                           style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-500 truncate max-w-[100px]">{cat.name}</span>
                    </div>
                    <span className="font-medium text-gray-700">₹{cat.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Monthly Revenue Bar Chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Monthly Revenue Breakdown</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlyData} barSize={32}>
            <XAxis dataKey="month" axisLine={false} tickLine={false}
                   tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis axisLine={false} tickLine={false}
                   tick={{ fontSize: 11, fill: '#9ca3af' }}
                   tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={v => `₹${v.toLocaleString()}`}
                     contentStyle={{ borderRadius: 8, border: '1px solid #f3f4f6', fontSize: 12 }} />
            <Bar dataKey="revenue" name="Revenue" radius={[4,4,0,0]}>
              {monthlyData.map((_, i) => (
                <Cell key={i}
                      fill={i === monthlyData.length - 1 ? '#059669' : '#a7f3d0'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Occupancy + Residents Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Occupancy Summary</h3>
          <div className="space-y-3">
            {[
              { label: 'Total Rooms',    value: summary.totalRooms },
              { label: 'Occupied',       value: summary.occupied },
              { label: 'Vacant',         value: summary.totalRooms - summary.occupied },
              { label: 'Occupancy Rate', value: `${summary.occupancyRate}%` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center
                                          py-2 border-b border-gray-50 text-sm">
                <span className="text-gray-400">{label}</span>
                <span className="font-medium text-gray-800">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Financial Summary</h3>
          <div className="space-y-3">
            {[
              { label: 'Total Invoiced',  value: `₹${(summary.totalRevenue + summary.outstanding).toLocaleString()}` },
              { label: 'Total Collected', value: `₹${summary.totalRevenue.toLocaleString()}`, color: 'text-emerald-600' },
              { label: 'Outstanding',     value: `₹${summary.outstanding.toLocaleString()}`,  color: 'text-amber-600' },
              { label: 'Collection Rate', value: summary.totalRevenue + summary.outstanding > 0
                ? `${Math.round(summary.totalRevenue / (summary.totalRevenue + summary.outstanding) * 100)}%`
                : '0%', color: 'text-blue-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center
                                          py-2 border-b border-gray-50 text-sm">
                <span className="text-gray-400">{label}</span>
                <span className={`font-medium ${color || 'text-gray-800'}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}