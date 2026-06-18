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

// Load routes one by one safely
const routes = [
  ['auth',          './routes/auth'],
  ['rooms',         './routes/rooms'],
  ['residents',     './routes/residents'],
  ['maintenance',   './routes/maintenance'],
  ['invoices',      './routes/invoices'],
  ['reports',       './routes/reports'],
  ['notifications', './routes/notifications'],
]

routes.forEach(([name, file]) => {
  try {
    const route = require(file)
    if (typeof route === 'function') {
      app.use(`/api/${name}`, route)
      console.log(`✅ /api/${name}`)
    } else {
      console.error(`❌ /api/${name} — not a function`)
    }
  } catch (err) {
    console.error(`❌ /api/${name} — ${err.message}`)
  }
})

app.get('/', (req, res) => res.send('HostelPro API running'))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))