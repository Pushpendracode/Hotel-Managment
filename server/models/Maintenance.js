const mongoose = require('mongoose')

const maintenanceSchema = new mongoose.Schema({
  roomId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident' },
  issue:      { type: String, required: true },
  priority:   { type: String, enum: ['low','medium','high'], default: 'medium' },
  status:     { type: String, enum: ['open','inprogress','completed'], default: 'open' },
  assignedTo: { type: String, default: '' },
  notes:      { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('Maintenance', maintenanceSchema)