const express  = require('express')
const router   = express.Router()
const bcrypt   = require('bcryptjs')
const jwt      = require('jsonwebtoken')
const mongoose = require('mongoose')

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const db   = mongoose.connection.db
    const user = await db.collection('users').findOne({ email })
    if (!user) return res.status(401).json({ message: 'Invalid email or password' })
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' })
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'hostel_super_secret_key', { expiresIn: '7d' })
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
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
      name, email, password: hashed,
      role: role || 'resident', phone: phone || '',
      isActive: true, createdAt: new Date()
    })
    const token = jwt.sign({ id: result.insertedId }, process.env.JWT_SECRET || 'hostel_super_secret_key', { expiresIn: '7d' })
    res.status(201).json({ token, user: { id: result.insertedId, name, email, role: role || 'resident' } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) return res.status(401).json({ message: 'No token' })
    const token   = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hostel_super_secret_key')
    const db      = mongoose.connection.db
    const user    = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(decoded.id) })
    res.json({ user })
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' })
  }
})

// GET all users
router.get('/users', async (req, res) => {
  try {
    const db    = mongoose.connection.db
    const users = await db.collection('users').find({}).toArray()
    const safe  = users.map(u => ({ _id: u._id, name: u.name, email: u.email, role: u.role, isActive: u.isActive }))
    res.json(safe)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT update user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const db = mongoose.connection.db
    await db.collection('users').updateOne(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { $set: { role: req.body.role } }
    )
    res.json({ message: 'Role updated' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET check env
router.get('/check-env', (req, res) => {
  res.json({
    mongo_uri_set: !!process.env.MONGO_URI,
    mongo_uri_preview: process.env.MONGO_URI?.substring(0, 30) + '...'
  })
})

// GET seed all data
router.get('/seed-all', async (req, res) => {
  try {
    const uri = process.env.MONGO_URI
    if (!uri) return res.status(500).json({ message: 'MONGO_URI not set' })
    const conn = await mongoose.createConnection(uri).asPromise()
    const db   = conn.db

    // Users
    await db.collection('users').deleteMany({})
    await db.collection('users').insertMany([
      { name:'Admin User',    email:'admin@hostelpro.com',    password: await bcrypt.hash('admin123',10), role:'admin',    isActive:true, createdAt:new Date() },
      { name:'Staff Member',  email:'staff@hostelpro.com',    password: await bcrypt.hash('staff123',10), role:'staff',    isActive:true, createdAt:new Date() },
      { name:'Resident User', email:'resident@hostelpro.com', password: await bcrypt.hash('res123',10),   role:'resident', isActive:true, createdAt:new Date() },
    ])

    // Rooms
    await db.collection('rooms').deleteMany({})
    const types    = ['single','single','double','single','single','double','single','suite']
    const prices   = [5000,5000,8000,5000,5000,8000,5000,12000]
    const roomDocs = []
    for (let floor = 1; floor <= 4; floor++) {
      for (let i = 0; i < 8; i++) {
        roomDocs.push({
          number: String(floor * 100 + i + 1),
          floor, type: types[i],
          status: 'vacant',
          price: prices[i],
          amenities: ['WiFi','AC'],
          residentId: null,
          createdAt: new Date()
        })
      }
    }
    const insertedRooms = await db.collection('rooms').insertMany(roomDocs)
    const roomIds = Object.values(insertedRooms.insertedIds)

    // Residents — resident@hostelpro.com is FIRST so test account always has a profile
    await db.collection('residents').deleteMany({})
    const residentData = [
      { name:'Resident User', email:'resident@hostelpro.com', phone:'res123' },
      { name:'Rajesh Kumar',  email:'rajesh@email.com',       phone:'+91 98765 43210' },
      { name:'Priya Sharma',  email:'priya@email.com',        phone:'+91 87654 32109' },
      { name:'Amit Mehta',    email:'amit@email.com',         phone:'+91 76543 21098' },
      { name:'Vikram Nair',   email:'vikram@email.com',       phone:'+91 65432 10987' },
      { name:'Sneha Verma',   email:'sneha@email.com',        phone:'+91 54321 09876' },
    ]
    const residentDocs = residentData.map((r, i) => ({
      ...r,
      roomId:   roomIds[i],
      checkIn:  new Date(2026, 4, i + 1),
      checkOut: new Date(2026, 10, i + 1),
      status:   'active',
      emergencyContact: { name:'Emergency', phone:'+91 99999 00000' },
      createdAt: new Date()
    }))
    const insertedResidents = await db.collection('residents').insertMany(residentDocs)
    const residentIds = Object.values(insertedResidents.insertedIds)

    // Mark rooms as occupied for each resident
    for (let i = 0; i < residentData.length; i++) {
      await db.collection('rooms').updateOne(
        { _id: roomIds[i] },
        { $set: { status: 'occupied', residentId: residentIds[i] } }
      )
    }

    // Maintenance
    await db.collection('maintenances').deleteMany({})
    await db.collection('maintenances').insertMany([
      { issue:'AC not cooling properly',    priority:'high',   status:'open',       assignedTo:'Staff Member', roomId:roomIds[0], residentId:residentIds[0], createdAt:new Date() },
      { issue:'Bathroom light not working', priority:'medium', status:'inprogress', assignedTo:'Staff Member', roomId:roomIds[1], residentId:residentIds[1], createdAt:new Date() },
      { issue:'Leaking tap in washroom',    priority:'medium', status:'inprogress', assignedTo:'Staff Member', roomId:roomIds[2], residentId:residentIds[2], createdAt:new Date() },
      { issue:'WiFi connectivity issue',    priority:'low',    status:'open',       assignedTo:'',             roomId:roomIds[3], residentId:residentIds[3], createdAt:new Date() },
      { issue:'Door lock broken',           priority:'high',   status:'completed',  assignedTo:'Staff Member', roomId:roomIds[4], residentId:residentIds[4], createdAt:new Date() },
    ])

    // Invoices
    await db.collection('invoices').deleteMany({})
    await db.collection('invoices').insertMany([
      { residentId:residentIds[0], lineItems:[{description:'Room Rent',amount:5000},{description:'Electricity',amount:1200},{description:'Water',amount:300}],   discount:0,   lateFee:0,   total:6500,  dueDate:new Date(2026,5,5),  status:'pending', paymentHistory:[], createdAt:new Date() },
      { residentId:residentIds[1], lineItems:[{description:'Room Rent',amount:5000},{description:'Electricity',amount:900}],                                      discount:0,   lateFee:0,   total:5900,  dueDate:new Date(2026,5,5),  status:'paid',    paymentHistory:[{amount:5900,method:'cash',paidAt:new Date()}], createdAt:new Date() },
      { residentId:residentIds[2], lineItems:[{description:'Room Rent',amount:8000},{description:'AC',amount:800},{description:'Laundry',amount:400}],            discount:0,   lateFee:500, total:9700,  dueDate:new Date(2026,4,31), status:'overdue', paymentHistory:[], createdAt:new Date() },
      { residentId:residentIds[3], lineItems:[{description:'Room Rent',amount:5000},{description:'Electricity',amount:1100},{description:'Water',amount:300}],    discount:200, lateFee:0,   total:6200,  dueDate:new Date(2026,5,10), status:'pending', paymentHistory:[], createdAt:new Date() },
      { residentId:residentIds[4], lineItems:[{description:'Room Rent',amount:5000},{description:'Electricity',amount:1100}],                                     discount:0,   lateFee:0,   total:6100,  dueDate:new Date(2026,5,10), status:'partial', paymentHistory:[{amount:3000,method:'upi',paidAt:new Date()}], createdAt:new Date() },
    ])

    await conn.close()
    res.json({ message:'✅ All data seeded! resident@hostelpro.com now has a resident profile linked to Room 101.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET seed test resident only
router.get('/seed-test-resident', async (req, res) => {
  try {
    const db   = mongoose.connection.db
    const room = await db.collection('rooms').findOne({ status: 'vacant' })
    if (!room) return res.status(400).json({ message: 'No vacant rooms available — run seed-all first' })

    await db.collection('residents').deleteOne({ email: 'resident@hostelpro.com' })
    const result = await db.collection('residents').insertOne({
      name:     'Resident User',
      email:    'resident@hostelpro.com',
      phone:    'res123',
      roomId:   room._id,
      checkIn:  new Date(),
      checkOut: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      status:   'active',
      emergencyContact: { name:'Emergency', phone:'+91 99999 00000' },
      createdAt: new Date()
    })

    await db.collection('rooms').updateOne(
      { _id: room._id },
      { $set: { status: 'occupied', residentId: result.insertedId } }
    )

    res.json({ message: `✅ Resident profile created for resident@hostelpro.com — assigned to Room ${room.number}` })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router