const express  = require('express')
const router   = express.Router()
const Invoice  = require('../models/Invoice')
const Room     = require('../models/Room')
const Resident = require('../models/Resident')
const Maintenance = require('../models/Maintenance')
const { verifyToken, checkRole } = require('../middleware/auth')

router.get('/summary', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const [rooms, residents, invoices, maintenance] = await Promise.all([
      Room.find(),
      Resident.find(),
      Invoice.find(),
      Maintenance.find(),
    ])

    const occupied     = rooms.filter(r => r.status === 'occupied').length
    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0)
    const outstanding  = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + i.total, 0)
    const openIssues   = maintenance.filter(m => m.status !== 'completed').length

    // Monthly revenue for last 6 months
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d     = new Date()
      d.setMonth(d.getMonth() - i)
      const month = d.toLocaleString('default', { month: 'short' })
      const year  = d.getFullYear()
      const mIdx  = d.getMonth()
      const rev   = invoices
        .filter(inv => {
          const pd = new Date(inv.createdAt)
          return pd.getMonth() === mIdx && pd.getFullYear() === year
        })
        .reduce((s, inv) => s + inv.total, 0)
      months.push({ month, revenue: rev, expenses: Math.round(rev * 0.08) })
    }

    // Revenue by category
    const categoryTotals = {}
    invoices.forEach(inv => {
      inv.lineItems?.forEach(item => {
        categoryTotals[item.description] = (categoryTotals[item.description] || 0) + item.amount
      })
    })
    const categories = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }))

    res.json({
      summary: {
        totalRooms: rooms.length,
        occupied,
        occupancyRate: rooms.length ? Math.round((occupied / rooms.length) * 100) : 0,
        totalResidents: residents.length,
        totalRevenue,
        outstanding,
        openIssues,
      },
      monthlyData: months,
      categories,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})
// GET all users (admin only)
router.get('/users', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const db    = mongoose.connection.db
    const users = await db.collection('users').find({}).toArray()
    const safe  = users.map(u => ({ _id: u._id, name: u.name, email: u.email, role: u.role, isActive: u.isActive }))
    res.json(safe)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT update user role (admin only)
router.put('/users/:id/role', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const db = mongoose.connection.db
    await db.collection('users').updateOne(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { $set: { role: req.body.role } }
    )
    res.json({ message: 'Role updated' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})
module.exports = router