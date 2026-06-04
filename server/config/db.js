const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    // Fallback hardcoded in case .env fails
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hostel-pro'
    const conn = await mongoose.connect(uri)
    console.log(`MongoDB connected: ${conn.connection.host}`)
  } catch (err) {
    console.error('DB connection failed:', err.message)
    process.exit(1)
  }
}

module.exports = connectDB