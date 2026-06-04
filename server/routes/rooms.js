const express = require('express')
const router  = express.Router()
const Room    = require('../models/Room')
const { verifyToken, checkRole } = require('../middleware/auth')

// GET all rooms
router.get('/', verifyToken, async (req, res) => {
  try {
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
router.put('/:id/status', verifyToken, checkRole(['admin', 'staff']), async (req, res) => {
  try {
    const { status } = req.body
    const room = await Room.findByIdAndUpdate(req.params.id, { status }, { new: true })
    res.json(room)
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