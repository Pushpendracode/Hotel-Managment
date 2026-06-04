const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    console.log('Login attempt:', email, password) // debug

    const db = mongoose.connection.db
    const user = await db.collection('users').findOne({ email: email })
    
    console.log('User found:', user ? 'YES' : 'NO') // debug
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    console.log('Stored password:', user.password) // debug
    console.log('Entered password:', password) // debug

    const isMatch = await bcrypt.compare(password, user.password)
    console.log('Password match:', isMatch) // debug

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'hostel_super_secret_key',
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: err.message })
  }
})

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body
    const db = mongoose.connection.db

    const exists = await db.collection('users').findOne({ email })
    if (exists) return res.status(400).json({ message: 'Email already registered' })

    const hashed = await bcrypt.hash(password, 10)
    const result = await db.collection('users').insertOne({
      name, email,
      password: hashed,
      role: role || 'resident',
      phone: phone || '',
      isActive: true,
      createdAt: new Date()
    })

    const token = jwt.sign(
      { id: result.insertedId },
      process.env.JWT_SECRET || 'hostel_super_secret_key',
      { expiresIn: '7d' }
    )

    res.status(201).json({
      token,
      user: { id: result.insertedId, name, email, role: role || 'resident' }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) return res.status(401).json({ message: 'No token' })
    
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hostel_super_secret_key')
    const db = mongoose.connection.db
    const user = await db.collection('users').findOne(
      { _id: new mongoose.Types.ObjectId(decoded.id) }
    )
    res.json({ user })
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' })
  }
})



module.exports = router