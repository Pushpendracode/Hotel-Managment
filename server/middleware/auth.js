const jwt      = require('jsonwebtoken')
const mongoose = require('mongoose')

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, access denied' })
  }
  try {
    const token   = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hostel_super_secret_key')
    const db      = mongoose.connection.db
    const user    = await db.collection('users').findOne({
      _id: new mongoose.Types.ObjectId(decoded.id)
    })
    if (!user) return res.status(401).json({ message: 'User not found' })
    req.user = user
    next()
  } catch (err) {
    res.status(401).json({ message: 'Token invalid or expired' })
  }
}

const checkRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied: insufficient permissions' })
  }
  next()
}

module.exports = { verifyToken, checkRole }