import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, LogOut } from "lucide-react";
import API from "../api/axios";
import AddResidentModal from "../components/AddResidentModal";

export default function Residents() {
  const [residents, setResidents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null); // null = add mode, object = edit mode

  const loadResidents = async () => {
    try {
      setLoading(true);
      const res = await API.get("/residents");
      setResidents(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResidents();
  }, []);

  const filteredResidents = residents.filter((resident) =>
    resident.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (resident) => {
    setEditData(resident);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this resident? This cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      await API.delete(`/residents/${id}`);
      await loadResidents();
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Failed to delete resident.");
    }
  };

  const handleCheckout = async (id) => {
    const confirmCheckout = window.confirm(
      "Check out this resident? This will free their room and disable their login."
    );
    if (!confirmCheckout) return;

    try {
      await API.put(`/residents/${id}/checkout`);
      await loadResidents();
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Failed to check out resident.");
    }
  };

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Resident Management
          </h1>

          <p className="text-gray-500 text-sm">
            Manage all hostel residents
          </p>
        </div>

        <button
          onClick={() => {
            setEditData(null);
            setShowModal(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} />
          Add Resident
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-3 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search resident..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg py-2 pl-10 pr-4"
          />
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
              <th className="text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-8">
                  Loading...
                </td>
              </tr>
            ) : filteredResidents.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8">
                  No Residents Found
                </td>
              </tr>
            ) : (
              filteredResidents.map((resident) => (
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

                  <td>
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => handleEdit(resident)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>

                      <button
                        onClick={() => handleDelete(resident._id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>

                      <button
                        onClick={() => handleCheckout(resident._id)}
                        className="text-orange-600 hover:text-orange-800"
                        title="Checkout"
                      >
                        <LogOut size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Resident Modal */}
      {showModal && (
        <AddResidentModal
          editData={editData}
          onClose={() => {
            setShowModal(false);
            setEditData(null);
          }}
          onSuccess={loadResidents}
        />
      )}
    </div>
  );
}