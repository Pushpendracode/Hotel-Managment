import { X, Mail, Phone, MapPin, Shield, Calendar, DoorOpen, Wallet, UserCircle } from "lucide-react";

function Field({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={15} className="text-gray-400" />
      </div>
      <div>
        <div className="text-xs text-gray-400 mb-0.5">{label}</div>
        <div className="text-sm text-gray-800 font-medium">{value || "-"}</div>
      </div>
    </div>
  );
}

export default function ResidentProfileModal({ resident, onClose }) {
  if (!resident) return null;

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "-");

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <UserCircle size={26} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{resident.name}</h2>
              <span
                className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium capitalize ${
                  resident.status === "active"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {resident.status}
              </span>
            </div>
          </div>

          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X />
          </button>
        </div>

        {/* Contact & Room Info */}
        <div className="grid grid-cols-2 gap-5 mb-6 pb-6 border-b border-gray-100">
          <Field icon={Mail} label="Email" value={resident.email} />
          <Field icon={Phone} label="Phone" value={resident.phone} />
          <Field
            icon={DoorOpen}
            label="Room"
            value={
              resident.roomId?.number
                ? `Room ${resident.roomId.number} · Floor ${resident.roomId.floor}`
                : "-"
            }
          />
          <Field icon={Wallet} label="Rent / Deposit" value={`₹${resident.rent || 0} / ₹${resident.deposit || 0}`} />
        </div>

        {/* Personal Details */}
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Personal Details</h3>
        <div className="grid grid-cols-2 gap-5 mb-6 pb-6 border-b border-gray-100">
          <Field icon={UserCircle} label="Gender" value={resident.gender} />
          <Field icon={Calendar} label="Date of Birth" value={formatDate(resident.dob)} />
          <Field icon={Shield} label="ID Proof" value={resident.idProof} />
          <Field icon={MapPin} label="Address" value={resident.address} />
        </div>

        {/* Emergency / Guardian */}
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Emergency & Guardian</h3>
        <div className="grid grid-cols-2 gap-5 mb-6 pb-6 border-b border-gray-100">
          <Field icon={Phone} label="Emergency Contact" value={resident.emergencyContact} />
          <Field icon={UserCircle} label="Guardian Name" value={resident.guardianName} />
          <Field icon={Phone} label="Guardian Phone" value={resident.guardianPhone} />
        </div>

        {/* Stay Info */}
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Stay Information</h3>
        <div className="grid grid-cols-2 gap-5">
          <Field icon={Calendar} label="Check-in" value={formatDate(resident.checkIn)} />
          <Field icon={Calendar} label="Check-out" value={formatDate(resident.checkOut)} />
        </div>

      </div>
    </div>
  );
}