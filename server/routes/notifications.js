const express = require('express')
const router = express.Router()

const Notification = require('../models/Notification')
const { verifyToken } = require('../middleware/auth')

// GET — everything targeted at my role (broadcast) or at me directly
router.get('/', verifyToken, async (req, res) => {
  try {
    const notifs = await Notification.find({
      $or: [{ roles: req.user.role }, { userId: req.user._id }],
    })
      .sort({ createdAt: -1 })
      .limit(100)

    const withReadFlag = notifs.map((n) => ({
      _id: n._id,
      title: n.title,
      message: n.message,
      type: n.type,
      relatedId: n.relatedId,
      createdAt: n.createdAt,
      read: n.readBy.some((id) => id.toString() === req.user._id.toString()),
    }))

    res.json(withReadFlag)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT /:id/read — mark one as read for the current user
router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    const notif = await Notification.findOne({
      _id: req.params.id,
      $or: [{ roles: req.user.role }, { userId: req.user._id }],
    })

    if (!notif) return res.status(404).json({ message: 'Notification not found' })

    await Notification.updateOne(
      { _id: notif._id },
      { $addToSet: { readBy: req.user._id } }
    )

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT /read-all — mark everything visible to me as read
router.put('/read-all', verifyToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { $or: [{ roles: req.user.role }, { userId: req.user._id }] },
      { $addToSet: { readBy: req.user._id } }
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router