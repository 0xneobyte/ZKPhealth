const express = require("express");
const app = express();
const insuranceRoutes = require("./routes/insurance");

// ... other middleware
app.use("/insurance", insuranceRoutes);

// ... other imports

// ... other middleware

module.exports = app;
