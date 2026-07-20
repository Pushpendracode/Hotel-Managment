import { useEffect, useState } from 'react'
import API from '../api/axios'

export default function ResidentDashboard() {
  const [resident, setResident] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setResident(null)
        setError('')
        const res = await API.get('/residents/me')
        setResident(res.data)
      } catch (err) {
        console.log(err)
        setError(err.response?.data?.message || 'Failed to load your record.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Resident Management
          </h1>

          <p className="text-gray-500 text-sm">
            Your resident record
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-4">Name</th>
              <th className="text-left">Room</th>
              <th className="text-left">Phone</th>
              <th className="text-left">Email</th>
              <th className="text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-8">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-red-500">
                  {error}
                </td>
              </tr>
            ) : !resident ? (
              <tr>
                <td colSpan="5" className="text-center py-8">
                  No Record Found
                </td>
              </tr>
            ) : (
              <tr
                key={resident._id}
                className="border-b hover:bg-gray-50"
              >
                <td className="p-4 font-medium">
                  {resident.name}
                </td>

                <td>
                  {resident.roomId?.number || "-"}
                </td>

                <td>
                  {resident.phone}
                </td>

                <td>
                  {resident.email}
                </td>

                <td>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      resident.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {resident.status}
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}