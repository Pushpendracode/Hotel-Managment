import { useState, useEffect } from "react"
import { Bell, CheckCheck, Wrench, Receipt, DoorOpen, AlertCircle } from "lucide-react"
import API from "../api/axios"
import toast from "react-hot-toast"

const typeConfig = {
  maintenance: { icon: Wrench,       bg: "bg-amber-50",   text: "text-amber-600",  dot: "bg-amber-500" },
  billing:     { icon: Receipt,      bg: "bg-blue-50",    text: "text-blue-600",   dot: "bg-blue-500" },
  room:        { icon: DoorOpen,     bg: "bg-emerald-50", text: "text-emerald-600",dot: "bg-emerald-500" },
  general:     { icon: AlertCircle,  bg: "bg-gray-100",   text: "text-gray-600",   dot: "bg-gray-400" },
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function Notifications() {
  const [notifs, setNotifs]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState("all")

  const load = async () => {
    try {
      setLoading(true)
      const res = await API.get("/notifications")
      setNotifs(res.data)
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const unread = notifs.filter(n => !n.read).length

  const markAllRead = async () => {
    setNotifs(n => n.map(notif => ({ ...notif, read: true }))) // optimistic
    try {
      await API.put("/notifications/read-all")
      toast.success("All notifications marked as read")
    } catch (err) {
      console.log(err)
      toast.error("Failed to update — refreshing")
      load()
    }
  }

  const markRead = async (id) => {
    setNotifs(n => n.map(notif => notif._id === id ? { ...notif, read: true } : notif)) // optimistic
    try {
      await API.put(`/notifications/${id}/read`)
    } catch (err) {
      console.log(err)
    }
  }

  const filtered = filter === "all"
    ? notifs
    : filter === "unread"
    ? notifs.filter(n => !n.read)
    : notifs.filter(n => n.type === filter)

  const stats = {
    total:       notifs.length,
    unread:      notifs.filter(n => !n.read).length,
    maintenance: notifs.filter(n => n.type === "maintenance").length,
    billing:     notifs.filter(n => n.type === "billing").length,
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total",       value: stats.total,       color: "text-gray-800" },
          { label: "Unread",      value: stats.unread,      color: "text-red-600" },
          { label: "Maintenance", value: stats.maintenance, color: "text-amber-600" },
          { label: "Billing",     value: stats.billing,     color: "text-blue-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className={`text-2xl font-semibold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Notifications List */}
        <div className="col-span-2">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {["all","unread","maintenance","billing","room"].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition
                      ${filter === f
                        ? "bg-emerald-600 text-white"
                        : "text-gray-500 hover:bg-gray-100"}`}>
                    {f}
                  </button>
                ))}
              </div>
              {unread > 0 && (
                <button onClick={markAllRead}
                  className="flex items-center gap-1.5 text-xs text-emerald-600
                             hover:text-emerald-700 font-medium">
                  <CheckCheck size={13} />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="text-center py-16 text-sm text-gray-400">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <Bell size={32} className="mx-auto text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No notifications</p>
              </div>
            ) : (
              <div>
                {filtered.map((notif) => {
                  const config = typeConfig[notif.type] || typeConfig.general
                  const Icon   = config.icon
                  return (
                    <div key={notif._id}
                      onClick={() => !notif.read && markRead(notif._id)}
                      className={`flex items-start gap-4 p-4 border-b border-gray-50
                                  cursor-pointer transition hover:bg-gray-50
                                  ${!notif.read ? "bg-blue-50/30" : ""}`}>
                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center
                                      flex-shrink-0 ${config.bg}`}>
                        <Icon size={15} className={config.text} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-medium text-gray-800 leading-snug">
                            {notif.title}
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {!notif.read && (
                              <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                            )}
                            <span className="text-xs text-gray-400">{timeAgo(notif.createdAt)}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-xs
                                         font-medium capitalize mt-1.5 ${config.bg} ${config.text}`}>
                          {notif.type}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Integration Status */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Integrations</h2>
            <div className="space-y-3">
              {[
                { name: "In-app Notifications", provider: "HostelPro",  status: "active" },
                { name: "Email",                provider: "Nodemailer (Brevo SMTP)", status: "active" },
                { name: "Payments",              provider: "Razorpay",  status: "active" },
                { name: "SMS",                   provider: "Not configured", status: "unavailable" },
              ].map(({ name, provider, status }) => (
                <div key={name} className="flex items-center justify-between py-2
                                            border-b border-gray-50">
                  <div>
                    <div className="text-xs font-medium text-gray-700">{name}</div>
                    <div className="text-xs text-gray-400">{provider}</div>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium
                    ${status === "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-gray-100 text-gray-500"}`}>
                    {status}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Notifications fire automatically on maintenance updates, new invoices, payments, check-ins and check-outs.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}