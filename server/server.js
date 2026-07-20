require('dotenv').config()

const express     = require('express')
const cors        = require('cors')
const helmet      = require('helmet')
const mongoose    = require('mongoose')
const rateLimit   = require('express-rate-limit')

const app = express()

app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// CORS — only allow known frontend origins instead of '*'.
// Set FRONTEND_URL in your Render env vars to your live Netlify URL.
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL, // e.g. https://hotelmanagmen.netlify.app
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser tools (curl/Postman send no origin header)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error('Not allowed by CORS'))
  },
  credentials: false,
}))

// Basic rate limiting on all API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,                 // requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
})
app.use('/api', apiLimiter)

// Tighter limit on login to slow down brute-force / credential stuffing
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try again later.' },
})
app.use('/api/auth/login', loginLimiter)

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