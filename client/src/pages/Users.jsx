import { useState, useEffect } from "react"
import API from "../api/axios"
import toast from "react-hot-toast"

const roleStyles = {
  admin:    "bg-red-50 text-red-700",
  staff:    "bg-blue-50 text-blue-700",
  resident: "bg-gray-100 text-gray-600",
}

export default function UsersPage() {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get("/auth/users")
      .then(res => setUsers(res.data))
      .catch(() => setUsers([
        { _id: "1", name: "Admin User",    email: "admin@hostelpro.com",    role: "admin" },
        { _id: "2", name: "Staff Member",  email: "staff@hostelpro.com",    role: "staff" },
        { _id: "3", name: "Resident User", email: "resident@hostelpro.com", role: "resident" },
      ]))
      .finally(() => setLoading(false))
  }, [])

  const handleRoleChange = async (id, role) => {
    try {
      await API.put(`/auth/users/${id}/role`, { role })
      setUsers(u => u.map(user => user._id === id ? { ...user, role } : user))
      toast.success("Role updated!")
    } catch {
      toast.error("Failed to update role")
    }
  }

  const initials = name => name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Administrators", value: users.filter(u => u.role === "admin").length,    color: "text-red-600" },
          { label: "Staff Members",  value: users.filter(u => u.role === "staff").length,    color: "text-blue-600" },
          { label: "Residents",      value: users.filter(u => u.role === "resident").length, color: "text-gray-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-xs text-gray-400 mb-2">{label}</div>
            <div className={`text-2xl font-semibold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">User Accounts</h2>
        </div>
        {loading ? (
          <div className="text-center py-16 text-sm text-gray-400">Loading...</div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-50">
              <tr>
                {["User", "Email", "Role", "Change Role"].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-400
                                         uppercase tracking-wide py-3 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700
                                      flex items-center justify-center text-xs font-semibold">
                        {initials(u.name)}
                      </div>
                      <span className="text-sm font-medium text-gray-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs
                                     font-medium capitalize ${roleStyles[u.role]}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <select value={u.role}
                      onChange={e => handleRoleChange(u._id, e.target.value)}
                      className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs
                                 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                      <option value="resident">Resident</option>
                    </select>
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