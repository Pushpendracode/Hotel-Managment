const express  = require('express')
const router   = express.Router()
const Resident = require('../models/Resident')
const Room     = require('../models/Room')
const mongoose = require('mongoose')
const { verifyToken, checkRole } = require('../middleware/auth')

// GET all residents — admin/staff only
router.get('/', verifyToken, checkRole(['admin','staff']), async (req, res) => {
  try {
    const residents = await Resident.find().populate('roomId', 'number floor type price')
    res.json(residents)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET own profile — resident
router.get('/me', verifyToken, async (req, res) => {
  try {
    const resident = await Resident.findOne({ email: req.user.email })
      .populate('roomId', 'number floor type price')
    res.json(resident)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST add resident — admin/staff only
router.post('/', verifyToken, checkRole(['admin','staff']), async (req, res) => {
  try {
    const { roomId, email, name, phone } = req.body

    const room = await Room.findById(roomId)
    if (!room) return res.status(404).json({ message: 'Room not found' })
    if (room.status !== 'vacant') return res.status(400).json({ message: 'Room is not vacant' })

    const resident = await Resident.create(req.body)
    await Room.findByIdAndUpdate(roomId, { status: 'occupied', residentId: resident._id })

    // Auto-create a user login for this resident
    const bcrypt = require('bcryptjs')
    const db = mongoose.connection.db
    const existing = await db.collection('users').findOne({ email })
    if (!existing) {
      const defaultPassword = phone || 'resident123'
      const hashed = await bcrypt.hash(defaultPassword, 10)
      await db.collection('users').insertOne({
        name, email,
        password: hashed,
        role: 'resident',
        isActive: true,
        createdAt: new Date()
      })
    }

    res.status(201).json({
      resident,
      loginCredentials: {
        email,
        defaultPassword: phone || 'resident123',
        message: 'A login account has been created for this resident'
      }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT checkout — admin/staff only
router.put('/:id/checkout', verifyToken, checkRole(['admin','staff']), async (req, res) => {
  try {
    const resident = await Resident.findByIdAndUpdate(
      req.params.id,
      { status: 'checkedout', checkOut: new Date() },
      { new: true }
    )
    if (resident.roomId) {
      await Room.findByIdAndUpdate(resident.roomId, { status: 'vacant', residentId: null })
    }
    res.json(resident)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// DELETE — admin only
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const resident = await Resident.findByIdAndDelete(req.params.id)
    if (resident?.roomId) {
      await Room.findByIdAndUpdate(resident.roomId, { status: 'vacant', residentId: null })
    }
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router