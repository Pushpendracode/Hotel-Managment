const mongoose = require("mongoose");

const residentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Male",
    },

    dob: {
      type: Date,
    },

    address: {
      type: String,
      default: "",
    },

    emergencyContact: {
      type: String,
      default: "",
    },

    guardianName: {
      type: String,
      default: "",
    },

    guardianPhone: {
      type: String,
      default: "",
    },

    idProof: {
      type: String,
      default: "",
    },

    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    rent: {
      type: Number,
      default: 0,
    },

    deposit: {
      type: Number,
      default: 0,
    },

    checkIn: {
      type: Date,
      default: Date.now,
    },

    checkOut: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["active", "checkedout"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Resident", residentSchema);