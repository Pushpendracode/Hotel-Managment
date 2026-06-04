require('dotenv').config()
const express  = require('express')
const cors     = require('cors')
const mongoose = require('mongoose')

const app = express()

// CRITICAL: middleware before everything
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: false
}))

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hostel-pro')
  .then(() => console.log('MongoDB connected!'))
  .catch(err => console.error('DB Error:', err.message))

const routeFiles = [
  ['auth',          './routes/auth'],
  ['rooms',         './routes/rooms'],
  ['residents',     './routes/residents'],
  ['maintenance',   './routes/maintenance'],
  ['invoices',      './routes/invoices'],
  ['reports',       './routes/reports'],
  ['notifications', './routes/notifications'],
]

routeFiles.forEach(([name, path]) => {
  try {
    const route = require(path)
    if (typeof route === 'function') {
      app.use(`/api/${name}`, route)
      console.log(`✅ Route loaded: /api/${name}`)
    }
  } catch (err) {
    console.error(`❌ Failed to load ${path}:`, err.message)
  }
})

app.get('/', (req, res) => res.send('HostelPro API running'))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))