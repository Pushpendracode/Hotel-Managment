const express     = require('express')
const router      = express.Router()
const Maintenance = require('../models/Maintenance')
const Resident    = require('../models/Resident')
const { verifyToken, checkRole } = require('../middleware/auth')

// GET — residents see only their own
router.get('/', verifyToken, async (req, res) => {
  try {
    const { status, priority } = req.query
    const filter = {}
    if (status)   filter.status   = status
    if (priority) filter.priority = priority

    if (req.user.role === 'resident') {
      const resident = await Resident.findOne({ email: req.user.email })
      if (!resident) return res.json([])
      filter.residentId = resident._id
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

// POST create — residents can only file for their own room
router.post('/', verifyToken, async (req, res) => {
  try {
    let residentId = req.body.residentId
    let roomId = req.body.roomId

    if (req.user.role === 'resident') {
      const resident = await Resident.findOne({ email: req.user.email })
      if (!resident) {
        return res.status(403).json({ message: 'No resident profile linked to this account' })
      }
      if (!resident.roomId) {
        return res.status(400).json({ message: 'You have no room assigned yet' })
      }
      // Force both values server-side — never trust the client for these
      residentId = resident._id
      roomId = resident.roomId
    }

    const request = await Maintenance.create({
      ...req.body,
      residentId,
      roomId,
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