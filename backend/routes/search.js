const express = require("express");
const router = express.Router();

// Simple search endpoint for demonstration purposes
router.get("/", (req, res) => {
  const query = req.query.q || "";

  console.log(`Search query received: ${query}`);

  // For demo purposes, just return a simple response
  // In a real application, this would query a database
  res.json({
    query,
    results: [
      {
        id: 1,
        title: "Search results for: " + query,
        description: "This is a demo search result.",
      },
    ],
    timestamp: new Date().toISOString(),
  });
});

// Vulnerable endpoint for XSS demonstration
// WARNING: This is intentionally vulnerable for educational purposes only!
router.get("/echo", (req, res) => {
  const message = req.query.message || "";

  console.log(`Echo message received: ${message}`);

  // Intentionally vulnerable - directly echoing user input without sanitization
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Echo Message</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.6;
          }
          .message-box {
            border: 1px solid #ddd;
            padding: 20px;
            border-radius: 5px;
            background-color: #f9f9f9;
            margin-top: 20px;
          }
          h1 {
            color: #333;
          }
        </style>
      </head>
      <body>
        <h1>Message Echo Service</h1>
        <p>This page echoes back the message you provided.</p>
        <div class="message-box">
          <h2>Your Message:</h2>
          <div>${message}</div>
        </div>
        <p><a href="/">Back to Home</a></p>
      </body>
    </html>
  `);
});

module.exports = router;
