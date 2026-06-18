const express     = require('express')
const router      = express.Router()
const Maintenance = require('../models/Maintenance')
const { verifyToken, checkRole } = require('../middleware/auth')

// GET — residents see only their own
router.get('/', verifyToken, async (req, res) => {
  try {
    const { status, priority } = req.query
    const filter = {}
    if (status)   filter.status   = status
    if (priority) filter.priority = priority
    if (req.user.role === 'resident') {
      filter.residentId = req.user._id
    }
    const requests = await Maintenance.find(filter)
      .populate('roomId', 'number floor')
      .populate('residentId', 'name')
      .sort({ createdAt: -1 })
    res.json(requests)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST create
router.post('/', verifyToken, async (req, res) => {
  try {
    const request = await Maintenance.create({
      ...req.body,
      residentId: req.user._id
    })
    res.status(201).json(request)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT assign — admin/staff only
router.put('/:id/assign', verifyToken, checkRole(['admin','staff']), async (req, res) => {
  try {
    const request = await Maintenance.findByIdAndUpdate(
      req.params.id,
      { assignedTo: req.body.assignedTo, status: 'inprogress' },
      { new: true }
    )
    res.json(request)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT status — admin/staff only
router.put('/:id/status', verifyToken, checkRole(['admin','staff']), async (req, res) => {
  try {
    const request = await Maintenance.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    )
    res.json(request)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// DELETE — admin only
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    await Maintenance.findByIdAndDelete(req.params.id)
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router