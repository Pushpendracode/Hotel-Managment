  const express  = require('express')
const router   = express.Router()
const Invoice  = require('../models/Invoice')
const Resident = require('../models/Resident')
const Razorpay = require('razorpay')
const crypto   = require('crypto')
const { sendEmail } = require('../utils/email')
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

  

  // POST create Razorpay order
  router.post('/:id/create-order', verifyToken, async (req, res) => {
    try {
      const invoice = await Invoice.findById(req.params.id)
      if (!invoice) return res.status(404).json({ message: 'Invoice not found' })

      const razorpay = new Razorpay({
        key_id:     process.env.rzp_test_TERRqKUtN9PKZf,
        key_secret: process.env.Jgg9z38fk7wQaSeYXgMYRMXE,
      })

      const order = await razorpay.orders.create({
        amount:   invoice.total * 100, // paise
        currency: 'INR',
        receipt:  `invoice_${invoice._id}`,
      })

      res.json({ orderId: order.id, amount: order.amount, currency: order.currency })
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  })

  // POST verify Razorpay payment
  router.post('/:id/verify-payment', verifyToken, async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

      // Verify signature
      const body      = razorpay_order_id + '|' + razorpay_payment_id
      const expected  = crypto
        .createHmac('sha256', process.env.Jgg9z38fk7wQaSeYXgMYRMXE)
        .update(body)
        .digest('hex')

      if (expected !== razorpay_signature) {
        return res.status(400).json({ message: 'Payment verification failed' })
      }

      // Mark invoice as paid
      const invoice = await Invoice.findById(req.params.id)
      invoice.paymentHistory.push({
        amount:  invoice.total,
        method:  'razorpay',
        paidAt:  new Date(),
        paymentId: razorpay_payment_id
      })
      invoice.status = 'paid'
      await invoice.save()

      res.json({ message: 'Payment verified and recorded', invoice })
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  })

  // Send invoice email
  const mongoose = require('mongoose')
  const db = mongoose.connection.db
  const resident = await db.collection('residents').findOne({ 
    _id: new mongoose.Types.ObjectId(residentId) 
  })
  if (resident?.email) {
    await sendEmail({
      to:      resident.email,
      subject: 'New Invoice Generated — HostelPro',
      html: `
        <h2>Invoice Generated</h2>
        <p>A new invoice of <strong>₹${total.toLocaleString()}</strong> has been generated for you.</p>
        <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString('en-IN')}</p>
        <p>Log in to HostelPro to view and pay your invoice.</p>
      `
    })
  }


  module.exports = router