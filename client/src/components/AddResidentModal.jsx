import { useEffect, useState } from "react";
import { X } from "lucide-react";
import API from "../api/axios";

export default function AddResidentModal({
  onClose,
  onSuccess,
  editData, // null/undefined = add mode, object = edit mode
}) {
  const [rooms, setRooms] = useState([]);
  const isEditMode = Boolean(editData);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    gender: "",
    address: "",
    emergencyContact: "",
    idProof: "",
    roomId: "",
    checkIn: "",
  });

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (editData) {
      setForm({
        name: editData.name || "",
        email: editData.email || "",
        phone: editData.phone || "",
        password: "", // never prefill password
        gender: editData.gender || "",
        address: editData.address || "",
        emergencyContact: editData.emergencyContact || "",
        idProof: editData.idProof || "",
        roomId: editData.roomId?._id || editData.roomId || "",
        checkIn: editData.checkIn
          ? editData.checkIn.substring(0, 10) // format for <input type="date">
          : "",
      });
    }
  }, [editData]);

  const loadRooms = async () => {
    try {
      const res = await API.get("/rooms");

      const vacant = res.data.filter(
        (room) => room.status === "vacant"
      );

      setRooms(vacant);
    } catch (err) {
      console.log(err);
    }
  };

  const changeHandler = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const submit = async (e) => {
    e.preventDefault();

    try {
      if (isEditMode) {
        // Don't send an empty password on update
        const payload = { ...form };
        if (!payload.password) delete payload.password;

        await API.put(`/residents/${editData._id}`, payload);
        alert("Resident Updated Successfully");
      } else {
        await API.post("/residents", form);
        alert("Resident Added Successfully");
      }

      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  // Merge in the resident's current room (it's occupied, so it won't be
  // in the vacant list) so the select doesn't show blank on edit.
  const roomOptions =
    isEditMode && editData.roomId
      ? [
          typeof editData.roomId === "object"
            ? editData.roomId
            : { _id: editData.roomId, number: "(current)", floor: "-" },
          ...rooms,
        ]
      : rooms;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

      <div className="bg-white rounded-xl w-full max-w-2xl p-6">

        <div className="flex justify-between items-center mb-5">

          <h2 className="text-xl font-bold">
            {isEditMode ? "Edit Resident" : "Add Resident"}
          </h2>

          <button onClick={onClose}>
            <X />
          </button>

        </div>

        <form
          onSubmit={submit}
          className="grid grid-cols-2 gap-4"
        >

          <input
            name="name"
            placeholder="Resident Name"
            className="border p-2 rounded"
            value={form.name}
            onChange={changeHandler}
            required
          />

          <input
            name="email"
            placeholder="Email"
            className="border p-2 rounded"
            value={form.email}
            onChange={changeHandler}
            required
          />

          <input
            name="phone"
            placeholder="Phone"
            className="border p-2 rounded"
            value={form.phone}
            onChange={changeHandler}
            required
          />

          <input
            name="password"
            placeholder={isEditMode ? "New Password (optional)" : "Password"}
            className="border p-2 rounded"
            value={form.password}
            onChange={changeHandler}
            required={!isEditMode}
          />

          <select
            name="gender"
            className="border p-2 rounded"
            value={form.gender}
            onChange={changeHandler}
          >
            <option value="">Gender</option>
            <option>Male</option>
            <option>Female</option>
          </select>

          <input
            type="date"
            name="checkIn"
            className="border p-2 rounded"
            value={form.checkIn}
            onChange={changeHandler}
          />

          <input
            name="emergencyContact"
            placeholder="Emergency Contact"
            className="border p-2 rounded"
            value={form.emergencyContact}
            onChange={changeHandler}
          />

          <input
            name="idProof"
            placeholder="Aadhar / ID Number"
            className="border p-2 rounded"
            value={form.idProof}
            onChange={changeHandler}
          />

          <textarea
            name="address"
            placeholder="Address"
            className="border p-2 rounded col-span-2"
            rows="3"
            value={form.address}
            onChange={changeHandler}
          />

          <select
            name="roomId"
            className="border p-2 rounded col-span-2"
            value={form.roomId}
            onChange={changeHandler}
            required
          >
            <option value="">
              Select Vacant Room
            </option>

            {roomOptions.map((room) => (
              <option
                key={room._id}
                value={room._id}
              >
                Room {room.number} | Floor {room.floor}
              </option>
            ))}

          </select>

          <button
            className="col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg"
          >
            {isEditMode ? "Update Resident" : "Save Resident"}
          </button>

        </form>

      </div>

    </div>
  );
}