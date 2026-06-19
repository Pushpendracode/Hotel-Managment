const mongoose = require('mongoose')

const roomSchema = new mongoose.Schema({
  number:    { type: String, required: true, unique: true },
  floor:     { type: Number, required: true },
  type:      { type: String, enum: ['single', 'double', 'suite'], default: 'single' },
  status:    { type: String, enum: ['vacant', 'occupied', 'maintenance', 'reserved'], default: 'vacant' },
  price:     { type: Number, required: true },
  amenities: [{ type: String }],
  residentId:{ type: mongoose.Schema.Types.ObjectId, ref: 'Resident', default: null },
}, { timestamps: true })

module.exports = mongoose.model('Room', roomSchema)