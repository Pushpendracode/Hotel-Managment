import { useEffect, useState } from "react";
import { X } from "lucide-react";
import API from "../api/axios";

export default function AddResidentModal({
  onClose,
  onSuccess,
}) {
  const [rooms, setRooms] = useState([]);

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
      await API.post("/residents", form);

      alert("Resident Added Successfully");

      onSuccess();

      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

      <div className="bg-white rounded-xl w-full max-w-2xl p-6">

        <div className="flex justify-between items-center mb-5">

          <h2 className="text-xl font-bold">
            Add Resident
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
            onChange={changeHandler}
            required
          />

          <input
            name="email"
            placeholder="Email"
            className="border p-2 rounded"
            onChange={changeHandler}
            required
          />

          <input
            name="phone"
            placeholder="Phone"
            className="border p-2 rounded"
            onChange={changeHandler}
            required
          />

          <input
            name="password"
            placeholder="Password"
            className="border p-2 rounded"
            onChange={changeHandler}
            required
          />

          <select
            name="gender"
            className="border p-2 rounded"
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
            onChange={changeHandler}
          />

          <input
            name="emergencyContact"
            placeholder="Emergency Contact"
            className="border p-2 rounded"
            onChange={changeHandler}
          />

          <input
            name="idProof"
            placeholder="Aadhar / ID Number"
            className="border p-2 rounded"
            onChange={changeHandler}
          />

          <textarea
            name="address"
            placeholder="Address"
            className="border p-2 rounded col-span-2"
            rows="3"
            onChange={changeHandler}
          />

          <select
            name="roomId"
            className="border p-2 rounded col-span-2"
            onChange={changeHandler}
            required
          >
            <option value="">
              Select Vacant Room
            </option>

            {rooms.map((room) => (
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
            Save Resident
          </button>

        </form>

      </div>

    </div>
  );
}