const express = require('express')
const router = express.Router()

const Maintenance = require('../models/Maintenance')
const Resident = require('../models/Resident')
const User = require('../models/User')      
const Team = require('../models/Team')      

const { verifyToken, checkRole } = require('../middleware/auth')
const { sendEmail } = require('../utils/email')

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
      .populate('assignedTo') // resolves to User or Team, thanks to refPath
      .sort({ createdAt: -1 })
    res.json(requests)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST create — residents can only file for their own room
router.post('/', verifyToken, async (req, res) => {
  try {
    let roomId = req.body.roomId

    if (req.user.role === 'resident') {
      const Resident = require('../models/Resident')
      const resident = await Resident.findOne({ email: req.user.email })
      if (!resident) return res.status(400).json({ message: 'No resident profile linked to this account' })
      roomId = resident.roomId
    }

    const request = await Maintenance.create({
      ...req.body,
      roomId,
      residentId: req.user._id
    })

    // Send confirmation email to resident
    await sendEmail({
      to:      req.user.email,
      subject: 'Maintenance Request Submitted — HostelPro',
      html: `
        <h2>Your maintenance request has been submitted</h2>
        <p><strong>Issue:</strong> ${request.issue}</p>
        <p><strong>Priority:</strong> ${request.priority}</p>
        <p><strong>Status:</strong> Open</p>
        <p>We will assign a staff member shortly.</p>
      `
    })

    res.status(201).json(request)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET assignable options — staff users + teams, for the Assign dropdown
router.get('/assignable', verifyToken, checkRole(['admin','staff']), async (req, res) => {
  try {
    
    const staff = await User.find({ role: 'staff', isActive: true }).select('name department')
    const teams = await Team.find().select('name')
    res.json({
      staff: staff.map(s => ({ id: s._id, label: s.name, type: 'User', department: s.department })),
      teams: teams.map(t => ({ id: t._id, label: t.name, type: 'Team' })),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT assign — admin/staff only
router.put('/:id/assign', verifyToken, checkRole(['admin', 'staff']), async (req, res) => {
  try {
    const { assignedTo, assignedToType } = req.body

    if (!assignedTo || !assignedToType) {
      return res.status(400).json({
        message: 'assignedTo and assignedToType are required'
      })
    }

    if (!['User', 'Team'].includes(assignedToType)) {
      return res.status(400).json({
        message: 'Invalid assignedToType'
      })
    }

    const request = await Maintenance.findById(req.params.id)

    if (!request) {
      return res.status(404).json({
        message: 'Maintenance request not found'
      })
    }

    request.assignedTo = assignedTo
    request.assignedToType = assignedToType
    request.status = 'inprogress'

    await request.save()

    await request.populate([
      { path: 'roomId', select: 'number floor' },
      { path: 'residentId', select: 'name' },
      { path: 'assignedTo' }
    ])

    res.json(request)

  } catch (err) {
    console.error(err)
    res.status(500).json({
      message: err.message
    })
  }
})

// UPDATE STATUS
router.put(
  "/:id/status",
  verifyToken,
  checkRole(["admin", "staff"]),
  async (req, res) => {
    try {
      const { status } = req.body;

      if (!["open", "inprogress", "completed"].includes(status)) {
        return res.status(400).json({
          message: "Invalid status",
        });
      }

      const request = await Maintenance.findById(req.params.id);

      if (!request) {
        return res.status(404).json({
          message: "Maintenance request not found",
        });
      }

      request.status = status;

      await request.save();

      await request.populate([
        { path: "roomId", select: "number floor" },
        { path: "residentId", select: "name" },
        { path: "assignedTo" },
      ]);

      res.json(request);
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

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