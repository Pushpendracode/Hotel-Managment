require('dotenv').config({ path: '../.env' })  
const mongoose = require('mongoose')
const User     = require('../models/User')
const connectDB = require('../config/db')

const MONGO_URI = 'mongodb://localhost:27017/Hotel Managment'
const JWT_SECRET = 'hostel_super_secret_key'

const users = [
  { name: 'Admin User',     email: 'admin@hostelpro.com',    password: 'admin123', role: 'admin' },
  { name: 'Staff Member',   email: 'staff@hostelpro.com',    password: 'staff123', role: 'staff' },
  { name: 'Resident User',  email: 'resident@hostelpro.com', password: 'res123',   role: 'resident' },
]

const seed = async () => {
  await connectDB()
  await User.deleteMany({})
  await User.insertMany(users)
  console.log('✅ Seeded 3 users successfully')
  console.log('   admin@hostelpro.com    / admin123')
  console.log('   staff@hostelpro.com    / staff123')
  console.log('   resident@hostelpro.com / res123')
  process.exit()
}

seed()