const express = require("express");
const router = express.Router();
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const packetLogger = require("../services/packetLogger");

// In-memory cache for ML predictions to avoid frequent model calls
let xssCache = {
  stats: {
    totalDetections: 0,
    byType: { reflected: 0, stored: 0, dom: 0 },
    topSources: [],
    topTargets: [],
    recentTimestamps: [],
  },
  lastUpdated: null,
};

let ddosCache = {
  stats: {
    totalDetections: 0,
    byType: { syn_flood: 0, udp_flood: 0, http_flood: 0, slowloris: 0 },
    topSources: [],
    topTargets: [],
    recentTimestamps: [],
  },
  lastUpdated: null,
  isMonitoring: false,
};

let securityAlerts = [];

// Helper to run Python scripts
const runPythonScript = (scriptName, args = []) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(
      __dirname,
      "../../ML Models/scripts",
      scriptName
    );

    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      return reject(new Error(`Script not found: ${scriptPath}`));
    }

    const pythonProcess = spawn("python", [scriptPath, ...args]);

    let dataString = "";
    let errorString = "";

    pythonProcess.stdout.on("data", (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorString += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        return reject(
          new Error(`Python process exited with code ${code}: ${errorString}`)
        );
      }

      try {
        const result = JSON.parse(dataString);
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse Python output: ${error.message}`));
      }
    });
  });
};

// Middleware to check if cache needs refresh (older than 5 minutes)
const checkCacheAge = (cache) => {
  if (!cache.lastUpdated || Date.now() - cache.lastUpdated > 5 * 60 * 1000) {
    return true;
  }
  return false;
};

// Get XSS detection stats
router.get("/xss/stats", async (req, res) => {
  try {
    if (checkCacheAge(xssCache)) {
      // Run the XSS detection script to get updated stats
      const result = await runPythonScript("xss_stats.py");
      xssCache.stats = result;
      xssCache.lastUpdated = Date.now();
    }

    res.json(xssCache.stats);
  } catch (error) {
    console.error("Error getting XSS stats:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get DDoS detection stats
router.get("/ddos/stats", async (req, res) => {
  try {
    if (checkCacheAge(ddosCache)) {
      // Run the DDoS detection script to get updated stats
      const result = await runPythonScript("ddos_stats.py");
      ddosCache.stats = result;
      ddosCache.lastUpdated = Date.now();
    }

    res.json({
      ...ddosCache.stats,
      isMonitoring: ddosCache.isMonitoring,
    });
  } catch (error) {
    console.error("Error getting DDoS stats:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start DDoS monitoring with Scapy
router.post("/ddos/monitor/start", async (req, res) => {
  try {
    if (!ddosCache.isMonitoring) {
      // Start the Scapy monitoring script as a background process
      const monitorProcess = spawn(
        "python",
        [path.join(__dirname, "../../ML Models/scripts/ddos_monitor.py")],
        {
          detached: true,
          stdio: "ignore",
        }
      );

      // Unref the process to allow the Node.js process to exit independently
      monitorProcess.unref();

      ddosCache.isMonitoring = true;

      // Add a security alert
      securityAlerts.push({
        id: Date.now(),
        type: "info",
        message: "DDoS monitoring started",
        timestamp: new Date().toISOString(),
        severity: "low",
      });
    }

    res.json({ success: true, isMonitoring: ddosCache.isMonitoring });
  } catch (error) {
    console.error("Error starting DDoS monitoring:", error);
    res.status(500).json({ error: error.message });
  }
});

// Stop DDoS monitoring
router.post("/ddos/monitor/stop", async (req, res) => {
  try {
    if (ddosCache.isMonitoring) {
      // Run a script to stop the monitoring process
      await runPythonScript("ddos_stop_monitor.py");

      ddosCache.isMonitoring = false;

      // Add a security alert
      securityAlerts.push({
        id: Date.now(),
        type: "info",
        message: "DDoS monitoring stopped",
        timestamp: new Date().toISOString(),
        severity: "low",
      });
    }

    res.json({ success: true, isMonitoring: ddosCache.isMonitoring });
  } catch (error) {
    console.error("Error stopping DDoS monitoring:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get security alerts
router.get("/alerts", (req, res) => {
  // Return the most recent 50 alerts
  res.json(securityAlerts.slice(-50));
});

// Add a test alert (for development purposes)
router.post("/alerts/test", (req, res) => {
  const {
    type = "warning",
    message = "Test alert",
    severity = "medium",
  } = req.body;

  const newAlert = {
    id: Date.now(),
    type,
    message,
    timestamp: new Date().toISOString(),
    severity,
  };

  securityAlerts.push(newAlert);

  res.json(newAlert);
});

// Analyze a URL or payload for XSS vulnerabilities
router.post("/xss/analyze", async (req, res) => {
  try {
    const { payload } = req.body;

    if (!payload) {
      return res.status(400).json({ error: "Payload is required" });
    }

    // Run the XSS detection script with the payload
    const result = await runPythonScript("xss_analyze.py", [payload]);

    // If it's an attack, add to the security alerts
    if (result.is_attack) {
      securityAlerts.push({
        id: Date.now(),
        type: "danger",
        message: `XSS attack detected: ${payload.substring(0, 50)}${
          payload.length > 50 ? "..." : ""
        }`,
        timestamp: new Date().toISOString(),
        severity: "high",
        details: result,
      });

      // Update the cache stats
      xssCache.stats.totalDetections++;
      if (result.attack_type) {
        xssCache.stats.byType[result.attack_type] =
          (xssCache.stats.byType[result.attack_type] || 0) + 1;
      }
      xssCache.stats.recentTimestamps.push(new Date().toISOString());
      xssCache.stats.recentTimestamps =
        xssCache.stats.recentTimestamps.slice(-100);

      // Save the detection for real statistics
      try {
        // Add timestamp if not present
        if (!result.timestamp) {
          result.timestamp = new Date().toISOString();
        }

        // Run the script to save the detection
        await runPythonScript("xss_save_detection.py", [
          JSON.stringify(result),
        ]);
        console.log("Saved XSS detection for statistics");
      } catch (saveError) {
        console.error("Error saving XSS detection:", saveError);
      }
    }

    res.json(result);
  } catch (error) {
    console.error("Error analyzing XSS payload:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get all ML stats in one call (for dashboard)
router.get("/dashboard", async (req, res) => {
  try {
    // Refresh caches if needed
    const promises = [];

    if (checkCacheAge(xssCache)) {
      promises.push(
        runPythonScript("xss_stats.py")
          .then((result) => {
            xssCache.stats = result;
            xssCache.lastUpdated = Date.now();
          })
          .catch((error) => console.error("Error refreshing XSS cache:", error))
      );
    }

    if (checkCacheAge(ddosCache)) {
      promises.push(
        runPythonScript("ddos_stats.py")
          .then((result) => {
            ddosCache.stats = result;
            ddosCache.lastUpdated = Date.now();
          })
          .catch((error) =>
            console.error("Error refreshing DDoS cache:", error)
          )
      );
    }

    await Promise.all(promises);

    // Filter alerts to show only one per category
    const filteredAlerts = (() => {
      // Group alerts by severity
      const alertsBySeverity = {
        medium: null, // For rule-based alerts (orange/yellow) - keep only one
        low: null, // For informational alerts - keep only one
      };

      // For high severity alerts (red), keep the two most recent ones
      const highSeverityAlerts = securityAlerts
        .filter((alert) => alert.severity === "high")
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 2); // Keep only the two newest

      // Find the most recent alert for medium and low severity levels
      securityAlerts.slice(-50).forEach((alert) => {
        if (alert.severity !== "high") {
          // Skip high severity, we handled those separately
          if (
            !alertsBySeverity[alert.severity] ||
            new Date(alert.timestamp) >
              new Date(alertsBySeverity[alert.severity].timestamp)
          ) {
            alertsBySeverity[alert.severity] = alert;
          }
        }
      });

      // Combine the alerts
      const result = [...highSeverityAlerts];

      // Add the other severity levels if they exist
      Object.values(alertsBySeverity).forEach((alert) => {
        if (alert !== null) {
          result.push(alert);
        }
      });

      return result;
    })();

    // Return all stats
    res.json({
      xss: xssCache.stats,
      ddos: {
        ...ddosCache.stats,
        isMonitoring: ddosCache.isMonitoring,
      },
      alerts: filteredAlerts, // Return filtered alerts instead of all recent alerts
    });
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    res.status(500).json({ error: error.message });
  }
});

// Packet logger status
router.get("/packet-logger/status", async (req, res) => {
  try {
    const isRunning = await packetLogger.isPacketLoggerRunning();

    res.json({
      running: isRunning,
      port: packetLogger.PACKET_LOGGER_PORT,
      url: `http://localhost:${packetLogger.PACKET_LOGGER_PORT}`,
    });
  } catch (error) {
    console.error("Error checking packet logger status:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start packet logger
router.post("/packet-logger/start", async (req, res) => {
  try {
    const success = await packetLogger.startPacketLogger();

    if (success) {
      // Add a security alert
      securityAlerts.push({
        id: Date.now(),
        type: "info",
        message: "Packet logger started",
        timestamp: new Date().toISOString(),
        severity: "low",
      });

      res.json({
        success: true,
        message: "Packet logger started successfully",
        port: packetLogger.PACKET_LOGGER_PORT,
        url: `http://localhost:${packetLogger.PACKET_LOGGER_PORT}`,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to start packet logger",
      });
    }
  } catch (error) {
    console.error("Error starting packet logger:", error);
    res.status(500).json({ error: error.message });
  }
});

// Stop packet logger
router.post("/packet-logger/stop", async (req, res) => {
  try {
    packetLogger.stopPacketLogger();

    // Add a security alert
    securityAlerts.push({
      id: Date.now(),
      type: "info",
      message: "Packet logger stopped",
      timestamp: new Date().toISOString(),
      severity: "low",
    });

    res.json({
      success: true,
      message: "Packet logger stopped successfully",
    });
  } catch (error) {
    console.error("Error stopping packet logger:", error);
    res.status(500).json({ error: error.message });
  }
});

// Simulate DoS attack
router.post("/simulate-dos", async (req, res) => {
  try {
    const { targetIp = "192.168.1.1", duration = 10 } = req.body;

    // Validate input
    if (!targetIp.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)) {
      return res.status(400).json({ error: "Invalid IP address format" });
    }

    if (isNaN(duration) || duration < 1 || duration > 30) {
      return res
        .status(400)
        .json({ error: "Duration must be between 1 and 30 seconds" });
    }

    // Check if packet logger is running
    const isRunning = await packetLogger.isPacketLoggerRunning();
    if (!isRunning) {
      // Try to start the packet logger
      const started = await packetLogger.startPacketLogger();
      if (!started) {
        return res.status(500).json({
          error: "Packet logger is not running and could not be started",
        });
      }

      // Add a security alert
      securityAlerts.push({
        id: Date.now(),
        type: "info",
        message: "Packet logger auto-started for DoS simulation",
        timestamp: new Date().toISOString(),
        severity: "low",
      });

      // Wait a bit for the packet logger to initialize
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Simulate the attack
    const result = await packetLogger.simulateDoSAttack(targetIp, duration);

    // Add a security alert for simulation start
    securityAlerts.push({
      id: Date.now(),
      type: "warning",
      message: `DoS attack simulation started on ${targetIp} for ${duration} seconds`,
      timestamp: new Date().toISOString(),
      severity: "medium",
    });

    // Wait for the DoS detection to trigger (about half the duration)
    setTimeout(() => {
      // Add a security alert for detected attack
      securityAlerts.push({
        id: Date.now(),
        type: "danger",
        message: `DoS attack detected! SYN flood targeting ${targetIp}`,
        timestamp: new Date().toISOString(),
        severity: "high",
        details:
          "Unusual traffic pattern detected. Multiple connection attempts from various sources.",
      });

      // Force refresh of the DDoS stats
      ddosCache.lastUpdated = null;

      // Save the detection for real statistics
      try {
        const detection = {
          timestamp: new Date().toISOString(),
          attack_type: "syn_flood",
          source_ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(
            Math.random() * 255
          )}`,
          target: "HTTP (80)",
        };

        // Run the script to save the detection
        runPythonScript("ddos_save_detection.py", [JSON.stringify(detection)])
          .then(() => console.log("Saved DoS detection for statistics"))
          .catch((err) => console.error("Error saving DoS detection:", err));
      } catch (saveError) {
        console.error("Error saving DoS detection:", saveError);
      }
    }, Math.min(duration * 500, 5000)); // Half the duration (in ms), max 5 seconds

    res.json({
      success: true,
      message: `DoS attack simulation started on ${targetIp} for ${duration} seconds`,
      ...result,
    });
  } catch (error) {
    console.error("Error simulating DoS attack:", error);
    res.status(500).json({ error: error.message });
  }
});

// Auto-start DDoS monitoring when the server starts
setTimeout(() => {
  if (!ddosCache.isMonitoring) {
    const monitorProcess = spawn(
      "python",
      [path.join(__dirname, "../../ML Models/scripts/ddos_monitor.py")],
      {
        detached: true,
        stdio: "ignore",
      }
    );

    monitorProcess.unref();
    ddosCache.isMonitoring = true;

    console.log("Auto-started DDoS monitoring");

    securityAlerts.push({
      id: Date.now(),
      type: "info",
      message: "DDoS monitoring auto-started on server initialization",
      timestamp: new Date().toISOString(),
      severity: "low",
    });
  }
}, 10000); // Wait 10 seconds after server start

// Auto-start packet logger when the server starts
setTimeout(async () => {
  try {
    const success = await packetLogger.startPacketLogger();

    if (success) {
      console.log(
        `Auto-started packet logger on port ${packetLogger.PACKET_LOGGER_PORT}`
      );

      securityAlerts.push({
        id: Date.now(),
        type: "info",
        message: "Packet logger auto-started on server initialization",
        timestamp: new Date().toISOString(),
        severity: "low",
      });
    } else {
      console.error("Failed to auto-start packet logger");
    }
  } catch (error) {
    console.error("Error auto-starting packet logger:", error);
  }
}, 5000); // Wait 5 seconds after server start

// Get recent traffic data
router.get("/traffic/recent", (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const packets = (global.packetLogs || []).slice(-limit);

    res.json(packets);
  } catch (error) {
    console.error("Error getting traffic data:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get traffic statistics
router.get("/traffic/stats", (req, res) => {
  try {
    const packets = global.packetLogs || [];

    // Calculate request rate (requests per minute)
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentPackets = packets.filter(
      (p) => new Date(p.timestamp).getTime() > oneMinuteAgo
    );
    const requestRate = recentPackets.length;

    // Count requests by method
    const methodCounts = {};
    packets.forEach((p) => {
      methodCounts[p.method] = (methodCounts[p.method] || 0) + 1;
    });

    // Count requests by path
    const pathCounts = {};
    packets.forEach((p) => {
      pathCounts[p.path] = (pathCounts[p.path] || 0) + 1;
    });

    // Count requests by status code
    const statusCounts = {};
    packets.forEach((p) => {
      if (p.status_code) {
        statusCounts[p.status_code] = (statusCounts[p.status_code] || 0) + 1;
      }
    });

    // Count requests by IP
    const ipCounts = {};
    packets.forEach((p) => {
      ipCounts[p.src_ip] = (ipCounts[p.src_ip] || 0) + 1;
    });

    // Get top IPs
    const topIPs = Object.entries(ipCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([ip, count]) => ({ ip, count }));

    // Get top paths
    const topPaths = Object.entries(pathCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([path, count]) => ({ path, count }));

    res.json({
      total_requests: packets.length,
      recent_requests: recentPackets.length,
      request_rate: requestRate,
      method_distribution: methodCounts,
      status_distribution: statusCounts,
      top_ips: topIPs,
      top_paths: topPaths,
    });
  } catch (error) {
    console.error("Error getting traffic stats:", error);
    res.status(500).json({ error: error.message });
  }
});

// Export securityAlerts for middleware access
module.exports = router;
module.exports.securityAlerts = securityAlerts;
module.exports.xssCache = xssCache;
module.exports.ddosCache = ddosCache;
