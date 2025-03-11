const express = require("express");
const app = express();
const insuranceRoutes = require("./routes/insurance");
const trafficMonitor = require("./middleware/trafficMonitor");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply traffic monitoring to all routes
app.use(trafficMonitor);

// Basic endpoints for DDOS testing
app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

app.get("/api/status", (req, res) => {
  res.json({ status: "running" });
});

// Add endpoint to view DDoS alerts
app.get("/api/alerts", (req, res) => {
  const alerts = global.ddosAlerts || [];
  res.json({
    total: alerts.length,
    alerts: alerts.slice(-20), // Return the most recent 20 alerts
  });
});

// Insurance routes
app.use("/insurance", insuranceRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API endpoints:`);
  console.log(`- GET /: Basic homepage`);
  console.log(`- GET /health: Health check endpoint`);
  console.log(`- GET /api/status: API status endpoint`);
  console.log(`- GET /api/alerts: DDoS alerts endpoint`);
  console.log(`- Various insurance endpoints under /insurance/...`);
});

// Only export for testing
if (process.env.NODE_ENV === "test") {
  module.exports = app;
}
