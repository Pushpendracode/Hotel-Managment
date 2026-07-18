const express = require('express')
const router  = express.Router()
const Room    = require('../models/Room')
const { verifyToken, checkRole } = require('../middleware/auth')

// GET all rooms — residents get limited fields, no resident names
router.get('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role === 'resident') {
      // Residents only see room number, floor, type, status — no resident info
      const rooms = await Room.find().select('number floor type status price')
      return res.json(rooms)
    }
    const rooms = await Room.find().populate('residentId', 'name email')
    res.json(rooms)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})
// GET single room
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('residentId', 'name email')
    if (!room) return res.status(404).json({ message: 'Room not found' })
    res.json(room)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST create room
router.post('/', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const room = await Room.create(req.body)
    res.status(201).json(room)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT update room
router.put('/:id', verifyToken, checkRole(['admin', 'staff']), async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!room) return res.status(404).json({ message: 'Room not found' })
    res.json(room)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})


// PUT update room status only
router.put('/:id/status', verifyToken, checkRole(['admin','staff']), async (req, res) => {
  try {
    const { status } = req.body
    const room = await Room.findById(req.params.id)
    if (!room) return res.status(404).json({ message: 'Room not found' })

    // Prevent marking occupied without a resident
    if (status === 'occupied' && !room.residentId) {
      return res.status(400).json({ 
        message: 'Cannot mark room as occupied without assigning a resident first. Add a resident through the Residents page.' 
      })
    }

    const updated = await Room.findByIdAndUpdate(req.params.id, { status }, { new: true })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})
// DELETE room
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    await Room.findByIdAndDelete(req.params.id)
    res.json({ message: 'Room deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router