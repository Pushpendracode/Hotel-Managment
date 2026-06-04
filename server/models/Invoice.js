const mongoose = require('mongoose')

const invoiceSchema = new mongoose.Schema({
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
  lineItems: [{
    description: { type: String },
    amount:      { type: Number },
  }],
  discount:  { type: Number, default: 0 },
  lateFee:   { type: Number, default: 0 },
  total:     { type: Number, required: true },
  dueDate:   { type: Date },
  status:    { type: String, enum: ['pending','paid','overdue','partial'], default: 'pending' },
  paymentHistory: [{
    amount:  { type: Number },
    method:  { type: String },
    paidAt:  { type: Date, default: Date.now },
  }],
}, { timestamps: true })

module.exports = mongoose.model('Invoice', invoiceSchema)