const express  = require('express')
const router   = express.Router()
const Invoice  = require('../models/Invoice')
const Resident = require('../models/Resident')
const { verifyToken, checkRole } = require('../middleware/auth')

// GET all invoices
router.get('/', verifyToken, async (req, res) => {
  try {
    const { status, residentId } = req.query
    const filter = {}
    if (status)     filter.status     = status
    if (residentId) filter.residentId = residentId
    const invoices = await Invoice.find(filter)
      .populate('residentId', 'name email roomId')
      .sort({ createdAt: -1 })
    res.json(invoices)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST generate invoice
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

// POST pay invoice
router.post('/:id/pay', verifyToken, async (req, res) => {
  try {
    const { amount, method } = req.body
    const invoice = await Invoice.findById(req.params.id)
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' })

    invoice.paymentHistory.push({ amount, method, paidAt: new Date() })
    const totalPaid = invoice.paymentHistory.reduce((s, p) => s + p.amount, 0)
    invoice.status  = totalPaid >= invoice.total ? 'paid' : 'partial'
    await invoice.save()
    res.json(invoice)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT mark overdue
router.put('/:id/overdue', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id, { status: 'overdue' }, { new: true }
    )
    res.json(invoice)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// DELETE
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id)
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router