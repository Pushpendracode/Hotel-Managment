const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
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

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["admin", "staff", "resident"],
      default: "resident",
    },

    phone: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Link User ↔ Resident
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      default: null,
    },

    // Only for Staff
    department: {
      type: String,
      enum: ["Housekeeping", "IT", "Maintenance", "Front Desk", null],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| Hash Password Before Save
|--------------------------------------------------------------------------
| Mongoose 8+ compatible
*/
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/*
|--------------------------------------------------------------------------
| Compare Password
|--------------------------------------------------------------------------
*/
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);