const express  = require('express')
const router   = express.Router()
const Invoice  = require('../models/Invoice')
const Resident = require('../models/Resident')
const { verifyToken, checkRole } = require('../middleware/auth')

// GET invoices — residents see only their own
router.get('/', verifyToken, async (req, res) => {
  try {
    let filter = {}
    if (req.user.role === 'resident') {
      const resident = await Resident.findOne({ email: req.user.email })
      if (!resident) return res.json([])
      filter.residentId = resident._id
    }
    const { status } = req.query
    if (status) filter.status = status
    const invoices = await Invoice.find(filter)
      .populate('residentId', 'name email roomId')
      .sort({ createdAt: -1 })
    res.json(invoices)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST generate — admin/staff only
router.post('/generate', verifyToken, checkRole(['admin','staff']), async (req, res) => {
  try {
    const { residentId, lineItems, discount, lateFee, dueDate } = req.body
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)
    const total    = subtotal - (discount || 0) + (lateFee || 0)
    const invoice  = await Invoice.create({
      residentId, lineItems, discount, lateFee, total, dueDate, status: 'pending'
    })
    const populated = await invoice.populate('residentId', 'name email')
    res.status(201).json(populated)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST pay — residents can only pay their own invoices
router.post('/:id/pay', verifyToken, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' })

    // Residents can only pay their own invoices
    if (req.user.role === 'resident') {
      const resident = await Resident.findOne({ email: req.user.email })
      if (!resident || invoice.residentId.toString() !== resident._id.toString()) {
        return res.status(403).json({ message: 'Access denied' })
      }
    }

    const { amount, method } = req.body
    invoice.paymentHistory.push({ amount, method, paidAt: new Date() })
    const totalPaid = invoice.paymentHistory.reduce((s, p) => s + p.amount, 0)
    invoice.status  = totalPaid >= invoice.total ? 'paid' : 'partial'
    await invoice.save()
    res.json(invoice)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// DELETE — admin only
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id)
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router