require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

const app = express()

mongoose.connect('mongodb://127.0.0.1:27017/hostel-pro')
  .then(() => console.log('MongoDB connected!'))
  .catch(err => console.error('DB Error:', err.message))

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://hotel-managment.netlify.app',
    /\.netlify\.app$/  // allows any netlify subdomain
  ],
  credentials: true
}))
// Load routes safely
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
    } else {
      console.error(`❌ Bad export in ${path} — not a function`)
    }
  } catch (err) {
    console.error(`❌ Failed to load ${path}:`, err.message)
  }
})

app.get('/', (req, res) => res.send('HostelPro API running'))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))