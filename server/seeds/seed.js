require('dotenv').config({ path: '../.env' })
const mongoose  = require('mongoose')
const User      = require('../models/User')
const Team      = require('../models/Team')
const Room      = require('../models/Room')
const Resident  = require('../models/Resident')
const Maintenance = require('../models/Maintenance')
const Invoice   = require('../models/Invoice')
const connectDB = require('../config/db')

const seed = async () => {
  await connectDB()

  // ---- Users (use .create / .save so passwords get hashed by the pre-save hook) ----
  await User.deleteMany({})

  const admin = await User.create({
    name: 'Admin User', email: 'admin@hostelpro.com', password: 'admin123', role: 'admin',
  })
  const staffGeneric = await User.create({
    name: 'Staff Member', email: 'staff@hostelpro.com', password: 'staff123', role: 'staff',
  })
  const suresha = await User.create({
    name: 'Suresha T.', email: 'suresha@hostelpro.com', password: 'suresha123',
    role: 'staff', department: 'Housekeeping',
  })
  const ravi = await User.create({
    name: 'Ravi M.', email: 'ravi@hostelpro.com', password: 'ravi123',
    role: 'staff', department: 'IT',
  })
  const residentUser = await User.create({
    name: 'Resident User', email: 'resident@hostelpro.com', password: 'res123', role: 'resident',
  })

  console.log('✅ Users seeded')
  console.log('   admin@hostelpro.com    / admin123')
  console.log('   staff@hostelpro.com    / staff123')
  console.log('   suresha@hostelpro.com  / suresha123  (Housekeeping)')
  console.log('   ravi@hostelpro.com     / ravi123     (IT)')
  console.log('   resident@hostelpro.com / res123')

  // ---- Teams ----
  await Team.deleteMany({})
  const housekeeping = await Team.create({ name: 'Housekeeping', description: 'Room cleaning & upkeep' })
  const it = await Team.create({ name: 'IT', description: 'Network & device support' })
  console.log('✅ Teams seeded')

  // ---- Rooms ----
  await Room.deleteMany({})
  const types    = ['single','single','double','single','single','double','single','suite']
  const prices   = [5000,5000,8000,5000,5000,8000,5000,12000]
  const statuses = ['occupied','occupied','vacant','occupied','vacant','occupied','occupied','occupied']
  const roomDocs = []
  for (let floor = 1; floor <= 4; floor++) {
    for (let i = 0; i < 8; i++) {
      roomDocs.push({
        number: String(floor * 100 + i + 1),
        floor, type: types[i], status: statuses[i],
        price: prices[i], amenities: ['WiFi', 'AC'],
        residentId: null,
      })
    }
  }
  const rooms = await Room.insertMany(roomDocs)
  console.log('✅ Rooms seeded')

  // ---- Residents (first one links to the login user above) ----
  await Resident.deleteMany({})
  const residentData = [
    { name: 'Resident User', email: 'resident@hostelpro.com', phone: '+91 90000 00000' }, // has login
    { name: 'Rajesh Kumar',  email: 'rajesh@email.com',       phone: '+91 98765 43210' }, // no login yet
    { name: 'Priya Sharma',  email: 'priya@email.com',        phone: '+91 87654 32109' },
    { name: 'Amit Mehta',    email: 'amit@email.com',         phone: '+91 76543 21098' },
    { name: 'Vikram Nair',   email: 'vikram@email.com',       phone: '+91 65432 10987' },
    { name: 'Sneha Verma',   email: 'sneha@email.com',        phone: '+91 54321 09876' },
  ]
  const residentDocs = residentData.map((r, i) => ({
    ...r,
    roomId: rooms[i]._id,
    checkIn: new Date(2026, 4, i + 1),
    checkOut: new Date(2026, 10, i + 1),
    status: 'active',
    emergencyContact: { name: 'Emergency', phone: '+91 99999 00000' },
  }))
  const residents = await Resident.insertMany(residentDocs)

  // Link rooms back to residents
  for (let i = 0; i < residents.length; i++) {
    await Room.findByIdAndUpdate(rooms[i]._id, { residentId: residents[i]._id })
  }
  console.log('✅ Residents seeded (first one has portal login)')

  // ---- Maintenance (assignedTo now references real Users/Teams) ----
  await Maintenance.deleteMany({})
  await Maintenance.insertMany([
    { issue: 'AC not cooling properly',    priority: 'high',   status: 'open',
      assignedToType: 'User', assignedTo: suresha._id, roomId: rooms[0]._id, residentId: residents[0]._id },
    { issue: 'Bathroom light not working', priority: 'medium', status: 'inprogress',
      assignedToType: 'User', assignedTo: ravi._id, roomId: rooms[1]._id, residentId: residents[1]._id },
    { issue: 'Leaking tap in washroom',    priority: 'medium', status: 'inprogress',
      assignedToType: 'Team', assignedTo: housekeeping._id, roomId: rooms[2]._id, residentId: residents[2]._id },
    { issue: 'WiFi connectivity issue',    priority: 'low',    status: 'open',
      assignedToType: 'Team', assignedTo: it._id, roomId: rooms[3]._id, residentId: residents[3]._id },
    { issue: 'Door lock broken',           priority: 'high',   status: 'completed',
      assignedToType: 'User', assignedTo: suresha._id, roomId: rooms[4]._id, residentId: residents[4]._id },
  ])
  console.log('✅ Maintenance requests seeded')

  // ---- Invoices ----
  await Invoice.deleteMany({})
  await Invoice.insertMany([
    { residentId: residents[0]._id,
      lineItems: [{ description: 'Room Rent', amount: 5000 }, { description: 'Electricity', amount: 1200 }, { description: 'Water', amount: 300 }],
      discount: 0, lateFee: 0, total: 6500, dueDate: new Date(2026, 5, 5), status: 'paid',
      paymentHistory: [{ amount: 6500, method: 'upi', paidAt: new Date() }] },
    { residentId: residents[1]._id,
      lineItems: [{ description: 'Room Rent', amount: 5000 }, { description: 'Electricity', amount: 900 }],
      discount: 0, lateFee: 500, total: 6400, dueDate: new Date(2026, 4, 31), status: 'overdue', paymentHistory: [] },
    { residentId: residents[2]._id,
      lineItems: [{ description: 'Room Rent', amount: 8000 }, { description: 'AC', amount: 800 }],
      discount: 0, lateFee: 0, total: 8800, dueDate: new Date(2026, 5, 10), status: 'pending', paymentHistory: [] },
  ])
  console.log('✅ Invoices seeded')

  console.log('🎉 Full seed complete')
  process.exit()
}

seed().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})