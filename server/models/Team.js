const mongoose = require('mongoose')

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g. 'Housekeeping', 'IT'
  description: { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('Team', teamSchema)