const express = require('express')
const router = express.Router()

const Maintenance = require('../models/Maintenance')
const Resident = require('../models/Resident')
const Room = require('../models/Room')
const User = require('../models/User')      
const Team = require('../models/Team')      

const { verifyToken, checkRole } = require('../middleware/auth')
const { sendEmail } = require('../utils/email')
const { notify } = require('../utils/notify')

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
    let residentDoc

    if (req.user.role === 'resident') {
      residentDoc = await Resident.findOne({ email: req.user.email })
      if (!residentDoc) return res.status(400).json({ message: 'No resident profile linked to this account' })
      roomId = residentDoc.roomId
    } else {
      // Admin/staff filing on behalf of a resident — derive the resident
      // from whoever currently occupies the selected room.
      if (!roomId) return res.status(400).json({ message: 'roomId is required' })
      const room = await Room.findById(roomId)
      if (!room) return res.status(404).json({ message: 'Room not found' })
      if (!room.residentId) return res.status(400).json({ message: 'This room has no resident assigned' })
      residentDoc = await Resident.findById(room.residentId)
      if (!residentDoc) return res.status(404).json({ message: 'Resident not found for this room' })
    }

    const request = await Maintenance.create({
      ...req.body,
      roomId,
      residentId: residentDoc._id, // was incorrectly req.user._id before — didn't match the ref('Resident') schema
    })

    // Send confirmation email to the resident (not necessarily req.user, if staff filed it)
    await sendEmail({
      to:      residentDoc.email,
      subject: 'Maintenance Request Submitted — HostelPro',
      html: `
        <h2>Your maintenance request has been submitted</h2>
        <p><strong>Issue:</strong> ${request.issue}</p>
        <p><strong>Priority:</strong> ${request.priority}</p>
        <p><strong>Status:</strong> Open</p>
        <p>We will assign a staff member shortly.</p>
      `
    })

    // Notify admin/staff that a new request needs attention
    await notify({
      title: 'New maintenance request',
      message: `${residentDoc.name} reported: ${request.issue} (${request.priority} priority)`,
      type: 'maintenance',
      roles: ['admin', 'staff'],
      relatedId: request._id,
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
      { path: 'residentId', select: 'name email' },
      { path: 'assignedTo' }
    ])

    // Notify the resident their request is now in progress
    const linkedUser = await User.findOne({ email: request.residentId?.email })
    await notify({
      title: 'Maintenance request in progress',
      message: `Your request "${request.issue}" has been assigned and is now in progress.`,
      type: 'maintenance',
      userId: linkedUser?._id,
      relatedId: request._id,
    })

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
        { path: "residentId", select: "name email" },
        { path: "assignedTo" },
      ]);

      // Notify the resident of the status change
      const linkedUser = await User.findOne({ email: request.residentId?.email });
      await notify({
        title: "Maintenance request updated",
        message: `Your request "${request.issue}" is now marked as ${status}.`,
        type: "maintenance",
        userId: linkedUser?._id,
        relatedId: request._id,
      });

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