import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Users, DoorOpen, TrendingUp, Wrench } from 'lucide-react'
import API from '../api/axios'
import { useAuth } from '../context/AuthContext'
import ResidentDashboard from './ResidentDashboard'

const revenueData = [
  { month: 'Jan', revenue: 2.1 },
  { month: 'Feb', revenue: 2.3 },
  { month: 'Mar', revenue: 2.0 },
  { month: 'Apr', revenue: 2.5 },
  { month: 'May', revenue: 2.6 },
  { month: 'Jun', revenue: 2.84 },
]

function MetricCard({ label, value, sub, subColor = 'text-gray-400', icon: Icon, iconBg }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400 font-medium">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon size={15} />
        </div>
      </div>
      <div className="text-2xl font-semibold text-gray-900 mb-1">{value}</div>
      <div className={`text-xs ${subColor}`}>{sub}</div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [rooms, setRooms]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role === 'resident') {
      setLoading(false)
      return
    }
    API.get('/rooms')
      .then(res => setRooms(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [user])

  const occupied    = rooms.filter(r => r.status === 'occupied').length
  const vacant      = rooms.filter(r => r.status === 'vacant').length
  const maintenance = rooms.filter(r => r.status === 'maintenance').length
  const occupancyRate = rooms.length ? Math.round((occupied / rooms.length) * 100) : 0

  const recentRooms = rooms.slice(0, 5)

  // Resident role gets its own dedicated dashboard component
  if (user?.role === 'resident') {
    return <ResidentDashboard />
  }

  return (
    <div>
      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Total Rooms"
          value={rooms.length}
          sub={`${occupied} occupied · ${vacant} vacant`}
          icon={DoorOpen}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          label="Occupancy Rate"
          value={`${occupancyRate}%`}
          sub="↑ +4% vs last month"
          subColor="text-emerald-500"
          icon={TrendingUp}
          iconBg="bg-blue-50 text-blue-600"
        />
        <MetricCard
          label="Revenue (June)"
          value="₹2.84L"
          sub="↑ +12% vs May"
          subColor="text-emerald-500"
          icon={TrendingUp}
          iconBg="bg-purple-50 text-purple-600"
        />
        <MetricCard
          label="Maintenance Issues"
          value={maintenance || 3}
          sub="2 high priority"
          subColor="text-red-400"
          icon={Wrench}
          iconBg="bg-red-50 text-red-500"
        />
      </div>

      {/* Charts + Table Row */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Revenue Chart */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Revenue Overview</h2>
            <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md font-medium">
              Last 6 months
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueData} barSize={28}>
              <XAxis dataKey="month" axisLine={false} tickLine={false}
                     tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis axisLine={false} tickLine={false}
                     tick={{ fontSize: 11, fill: '#9ca3af' }}
                     tickFormatter={v => `₹${v}L`} />
              <Tooltip
                formatter={v => [`₹${v}L`, 'Revenue']}
                contentStyle={{ borderRadius: 8, border: '1px solid #f3f4f6',
                                fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              {revenueData.map((entry, i) => (
                <Cell key={i} fill={i === revenueData.length - 1 ? '#1D9E75' : '#d1fae5'} />
              ))}
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {revenueData.map((_, i) => (
                  <Cell key={i} fill={i === revenueData.length - 1 ? '#059669' : '#a7f3d0'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Occupancy Breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Room Status</h2>
          <div className="space-y-3">
            {[
              { label: 'Occupied',    value: occupied,    color: 'bg-emerald-500', pct: occupancyRate },
              { label: 'Vacant',      value: vacant,      color: 'bg-gray-200',    pct: rooms.length ? Math.round(vacant/rooms.length*100) : 0 },
              { label: 'Maintenance', value: maintenance, color: 'bg-amber-400',   pct: rooms.length ? Math.round(maintenance/rooms.length*100) : 0 },
            ].map(({ label, value, color, pct }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-700">{value} <span className="text-gray-400">({pct}%)</span></span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-50">
            <h3 className="text-xs font-medium text-gray-500 mb-3">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Total Rooms</span>
                <span className="font-medium">{rooms.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Floors</span>
                <span className="font-medium">4</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Avg. Price</span>
                <span className="font-medium">₹6,875/mo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Rooms Table */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Room Overview</h2>
          <a href="/rooms" className="text-xs text-emerald-600 hover:text-emerald-700">
            View all →
          </a>
        </div>
        {loading ? (
          <div className="text-center py-8 text-sm text-gray-400">Loading rooms…</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                {['Room', 'Floor', 'Type', 'Price', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-400
                                         uppercase tracking-wide pb-3 px-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentRooms.map(room => (
                <tr key={room._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="py-3 px-2 text-sm font-medium text-gray-800">#{room.number}</td>
                  <td className="py-3 px-2 text-sm text-gray-500">Floor {room.floor}</td>
                  <td className="py-3 px-2 text-sm text-gray-500 capitalize">{room.type}</td>
                  <td className="py-3 px-2 text-sm text-gray-500">₹{room.price.toLocaleString()}</td>
                  <td className="py-3 px-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium
                      ${room.status === 'occupied'    ? 'bg-emerald-50 text-emerald-700' :
                        room.status === 'vacant'      ? 'bg-gray-100 text-gray-600' :
                        room.status === 'maintenance' ? 'bg-amber-50 text-amber-700' :
                                                        'bg-blue-50 text-blue-700'}`}>
                      {room.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}