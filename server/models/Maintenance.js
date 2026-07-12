const mongoose = require('mongoose')

const maintenanceSchema = new mongoose.Schema({
  roomId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident' },
  issue:      { type: String, required: true },
  priority:   { type: String, enum: ['low','medium','high'], default: 'medium' },
  status:     { type: String, enum: ['open','inprogress','completed'], default: 'open' },

  // assignedTo can point to either a User (specific staff) or a Team (department)
  assignedToType: { type: String, enum: ['User', 'Team', null], default: null },
  assignedTo:     { type: mongoose.Schema.Types.ObjectId, refPath: 'assignedToType', default: null },

  notes:      { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('Maintenance', maintenanceSchema)