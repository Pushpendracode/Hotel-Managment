require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");

const app = express();

// ✅ Trust Render / Railway / Heroku proxy
app.set("trust proxy", 1);

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL, // e.g. https://hotelmanagmen.netlify.app
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow Postman/curl (no Origin header)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: false,
  })
);

// ----------------------------
// Rate Limiter (All API)
// ----------------------------
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests, please try again later.",
  },
});

app.use("/api", apiLimiter);

// ----------------------------
// Login Limiter
// ----------------------------
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many login attempts, please try again later.",
  },
});

app.use("/api/auth/login", loginLimiter);

// ----------------------------
// MongoDB
// ----------------------------
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/hostel-pro";

console.log(
  "MONGO_URI starts with:",
  MONGO_URI.substring(0, 20)
);

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected!"))
  .catch((err) => console.error("DB Error:", err.message));

// ----------------------------
// Routes
// ----------------------------
const routes = [
  ["auth", "./routes/auth"],
  ["rooms", "./routes/rooms"],
  ["residents", "./routes/residents"],
  ["maintenance", "./routes/maintenance"],
  ["invoices", "./routes/invoices"],
  ["reports", "./routes/reports"],
  ["notifications", "./routes/notifications"],
];

routes.forEach(([name, file]) => {
  try {
    const route = require(file);

    if (typeof route === "function") {
      app.use(`/api/${name}`, route);
      console.log(`✅ /api/${name}`);
    } else {
      console.error(`❌ /api/${name} - not a function`);
    }
  } catch (err) {
    console.error(`❌ /api/${name} - ${err.message}`);
  }
});

// ----------------------------
// Home Route
// ----------------------------
app.get("/", (req, res) => {
  res.send("HostelPro API running 🚀");
});

// ----------------------------
// 404 Handler
// ----------------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ----------------------------
// Global Error Handler
// ----------------------------
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ----------------------------
// Start Server
// ----------------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});