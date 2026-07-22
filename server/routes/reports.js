const express     = require('express')
const router      = express.Router()
const Invoice     = require('../models/Invoice')
const Room        = require('../models/Room')
const Resident    = require('../models/Resident')
const Maintenance = require('../models/Maintenance')
const { verifyToken, checkRole } = require('../middleware/auth')

router.get('/summary', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const [rooms, residents, invoices, maintenance] = await Promise.all([
      Room.find(), Resident.find(), Invoice.find(), Maintenance.find(),
    ])
    const occupied     = rooms.filter(r => r.status === 'occupied').length
    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0)
    const outstanding  = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + i.total, 0)
    const openIssues   = maintenance.filter(m => m.status !== 'completed').length

    const months = []
    for (let i = 5; i >= 0; i--) {
      const d    = new Date()
      d.setMonth(d.getMonth() - i)
      const month = d.toLocaleString('default', { month: 'short' })
      const mIdx  = d.getMonth()
      const year  = d.getFullYear()
      const rev   = invoices
        .filter(inv => {
          const pd = new Date(inv.createdAt)
          return pd.getMonth() === mIdx && pd.getFullYear() === year
        })
        .reduce((s, inv) => s + inv.total, 0)
      months.push({ month, revenue: rev, expenses: Math.round(rev * 0.08) })
    }

    const categoryTotals = {}
    invoices.forEach(inv => {
      inv.lineItems?.forEach(item => {
        categoryTotals[item.description] = (categoryTotals[item.description] || 0) + item.amount
      })
    })
    const categories = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }))

    res.json({
      summary: {
        totalRooms: rooms.length, occupied,
        occupancyRate: rooms.length ? Math.round((occupied / rooms.length) * 100) : 0,
        totalResidents: residents.length,
        totalRevenue, outstanding, openIssues,
      },
      monthlyData: months,
      categories,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/payments', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('residentId', 'name email roomId')
      .sort({ createdAt: -1 })

    const paymentReport = invoices.map(inv => ({
      resident:    inv.residentId?.name || 'Unknown',
      email:       inv.residentId?.email || '',
      month:       new Date(inv.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' }),
      total:       inv.total,
      status:      inv.status,
      paidAmount:  inv.paymentHistory?.reduce((s, p) => s + p.amount, 0) || 0,
      dueDate:     inv.dueDate,
      lineItems:   inv.lineItems,
    }))

    res.json(paymentReport)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})
module.exports = router