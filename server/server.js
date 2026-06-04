const express  = require('express')
const cors     = require('cors')
const mongoose = require('mongoose')

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({ origin: '*', credentials: false }))

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hostel-pro'
console.log('MONGO_URI starts with:', MONGO_URI.substring(0, 20))

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected!'))
  .catch(err => console.error('DB Error:', err.message))