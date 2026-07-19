const express  = require('express')
const router   = express.Router()
const Resident = require('../models/Resident')
const Room     = require('../models/Room')
const mongoose = require('mongoose')
const { verifyToken, checkRole } = require('../middleware/auth')

const User = require('../models/User')
const { sendEmail } = require('../utils/email')

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
// POST add resident — admin/staff only
router.post('/', verifyToken, checkRole(['admin', 'staff']), async (req, res) => {
  try {
    const {
      roomId,
      name,
      email,
      phone,
      gender,
      address,
      emergencyContact,
      checkIn,
      idProof
    } = req.body

    // Check room
    const room = await Room.findById(roomId)

    if (!room) {
      return res.status(404).json({
        message: 'Room not found'
      })
    }

    if (room.status !== 'vacant') {
      return res.status(400).json({
        message: 'Room is already occupied'
      })
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email })

    if (existingUser) {
      return res.status(400).json({
        message: 'Email already exists'
      })
    }

    // Default password
    const defaultPassword = phone || 'resident123'

    // Create User Account
    const user = new User({
      name,
      email,
      password: defaultPassword,
      role: 'resident',
      phone
    })

    await user.save()

    // Create Resident Profile
    const resident = await Resident.create({
      userId: user._id,
      roomId,
      name,
      email,
      phone,
      gender,
      address,
      emergencyContact,
      checkIn,
      idProof,
      status: 'active'
    })

    // Update Room
    room.status = 'occupied'
    room.residentId = resident._id
    await room.save()

    // Send Welcome Email
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to HostelPro',
        html: `
          <h2>Hello ${name},</h2>

          <p>Your HostelPro account has been created successfully.</p>

          <table border="1" cellpadding="8" cellspacing="0">
            <tr>
              <td><strong>Name</strong></td>
              <td>${name}</td>
            </tr>
            <tr>
              <td><strong>Email</strong></td>
              <td>${email}</td>
            </tr>
            <tr>
              <td><strong>Password</strong></td>
              <td>${defaultPassword}</td>
            </tr>
            <tr>
              <td><strong>Room No</strong></td>
              <td>${room.number}</td>
            </tr>
          </table>

          <br>

          <p>Please login and change your password after your first login.</p>

          <br>

          <p>Regards,<br><b>HostelPro Team</b></p>
        `
      })

      console.log("Welcome email sent.")
    } catch (emailErr) {
      console.log("Email Error:", emailErr.message)
    }

    res.status(201).json({
      success: true,
      message: 'Resident added successfully',
      resident,
      credentials: {
        email,
        password: defaultPassword
      }
    })

  } catch (err) {
    console.error(err)

    res.status(500).json({
      success: false,
      message: err.message
    })
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