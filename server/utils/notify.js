const Notification = require('../models/Notification')

/**
 * Create a notification.
 * Pass `roles` for a broadcast (e.g. ['admin','staff']) or `userId` for a
 * direct target (e.g. a specific resident's User _id). You can pass both.
 *
 * Never throws — a failed notification should never break the calling route.
 */
const notify = async ({ title, message, type = 'general', roles = [], userId = null, relatedId = null }) => {
  try {
    await Notification.create({ title, message, type, roles, userId, relatedId })
  } catch (err) {
    console.error('Notification error:', err.message)
  }
}

module.exports = { notify }