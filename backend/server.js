const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Add this line to remove the warning
mongoose.set("strictQuery", false);

// Import routes
const authRoutes = require("./routes/auth");
const patientRoutes = require("./routes/patients");
const twoFactorRoutes = require("./routes/twoFactor");
const insuranceRoutes = require("./routes/insurance");
// Import ML routes
const mlRoutes = require("./routes/ml");
// Import search routes
const searchRoutes = require("./routes/search");

// Import middleware
const xssDetectionMiddleware = require("./middleware/xssDetection");

// Import security middleware
const trafficMonitor = require("./middleware/trafficMonitor");
const xssDetector = require("./middleware/xssDetector");

dotenv.config();

const app = express();

// MongoDB Connection
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/healthcare-zkp",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  })
);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// XSS detection middleware
app.use(xssDetectionMiddleware);

// Add security middleware
app.use(trafficMonitor);
app.use(xssDetector);

// Add health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
app.use("/patients", patientRoutes);
app.use("/auth", authRoutes);
app.use("/2fa", twoFactorRoutes);
app.use("/insurance", insuranceRoutes);
// Mount ML routes
app.use("/ml", mlRoutes);
// Mount search routes
app.use("/search", searchRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
