const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },

    type: {
      type: String,
      enum: ['maintenance', 'billing', 'room', 'general'],
      default: 'general',
    },

    // Broadcast target — e.g. ['admin', 'staff']. Leave empty if userId is set.
    roles: [{ type: String, enum: ['admin', 'staff', 'resident'] }],

    // Direct target — e.g. a specific resident's User _id. Leave null for broadcasts.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Who has read this notification (works for both broadcast and direct targets)
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Optional link back to the record that triggered this (invoice, request, etc.)
    relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Notification', notificationSchema)