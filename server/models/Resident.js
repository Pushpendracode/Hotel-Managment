const mongoose = require('mongoose')

const residentSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  email:   { type: String, required: true },
  phone:   { type: String },
  roomId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  checkIn:  { type: Date },
  checkOut: { type: Date },
  status:   { type: String, enum: ['active','pending','checkedout'], default: 'active' },
  emergencyContact: {
    name:  { type: String },
    phone: { type: String },
  }
}, { timestamps: true })

module.exports = mongoose.model('Resident', residentSchema)