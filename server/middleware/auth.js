const jwt  = require('jsonwebtoken')
const User = require('../models/User')

// Verify JWT token
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, access denied' })
  }
  try {
    const token   = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user      = await User.findById(decoded.id).select('-password')
    if (!req.user) return res.status(401).json({ message: 'User not found' })
    next()
  } catch (err) {
    res.status(401).json({ message: 'Token invalid or expired' })
  }
}

// Check role — usage: checkRole(['admin', 'staff'])
const checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied: insufficient permissions' })
  }
  next()
}

module.exports = { verifyToken, checkRole }