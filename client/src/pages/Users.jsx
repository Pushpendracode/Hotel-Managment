import { useState, useEffect } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";

const roleStyles = {
  admin: "bg-red-50 text-red-700",
  staff: "bg-blue-50 text-blue-700",
  resident: "bg-gray-100 text-gray-600",
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await API.get("/auth/users");
      setUsers(res.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Unable to fetch users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await API.put(`/auth/users/${id}/role`, { role });

      setUsers((prev) =>
        prev.map((user) =>
          user._id === id ? { ...user, role } : user
        )
      );

      toast.success("Role updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update role");
    }
  };

  const initials = (name = "") =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const adminCount = users.filter((u) => u.role === "admin").length;
  const staffCount = users.filter((u) => u.role === "staff").length;
  const residentCount = users.filter((u) => u.role === "resident").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs text-gray-400">Administrators</p>
          <h2 className="text-2xl font-bold text-red-600">{adminCount}</h2>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs text-gray-400">Staff Members</p>
          <h2 className="text-2xl font-bold text-blue-600">{staffCount}</h2>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs text-gray-400">Residents</p>
          <h2 className="text-2xl font-bold text-gray-600">
            {residentCount}
          </h2>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="text-lg font-semibold">
            User Accounts
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">
                    User
                  </th>

                  <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">
                    Email
                  </th>

                  <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">
                    Role
                  </th>

                  <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">
                    Change Role
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-10 text-gray-500"
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user._id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold">
                            {initials(user.name)}
                          </div>

                          <span className="font-medium">
                            {user.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {user.email}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-md text-xs font-medium capitalize ${roleStyles[user.role]}`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(
                              user._id,
                              e.target.value
                            )
                          }
                          className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                          <option value="admin">Admin</option>
                          <option value="staff">Staff</option>
                          <option value="resident">Resident</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}