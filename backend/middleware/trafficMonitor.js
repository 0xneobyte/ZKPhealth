const path = require("path");
const { spawn } = require("child_process");
const { runPythonScript } = require("../utils/pythonRunner");
const { execFile } = require("child_process");
// Import security alerts from ML module
let mlSecurityAlerts;
try {
  const mlModule = require("../routes/ml");
  mlSecurityAlerts = mlModule.securityAlerts;
} catch (error) {
  console.error("Error importing ml module:", error);
  mlSecurityAlerts = [];
}

// Initialize global packet logs
global.packetLogs = global.packetLogs || [];

// Set up a simple interval to log traffic stats
setInterval(() => {
  const now = Date.now();
  const last30Seconds = now - 30000;

  // Get packets from last 30 seconds
  const recentPackets = global.packetLogs.filter(
    (p) => new Date(p.timestamp).getTime() > last30Seconds
  );

  if (recentPackets.length > 0) {
    const uniqueIPs = new Set(recentPackets.map((p) => p.src_ip)).size;
    console.log(
      `Traffic stats last 30s: ${recentPackets.length} requests, ${uniqueIPs} unique IPs`
    );

    // Simple rule-based detection
    const requestRate = recentPackets.length / 30;
    const avgRequestsPerIP = recentPackets.length / Math.max(1, uniqueIPs);

    // Alert if traffic exceeds thresholds - lowered to match current traffic
    if (requestRate > 0.5 && avgRequestsPerIP > 10) {
      console.log(
        "\x1b[31m%s\x1b[0m",
        "🚨 ALERT: Possible DDoS Attack Detected! 🚨"
      );
      console.log(
        "\x1b[31m%s\x1b[0m",
        `High traffic rate: ${requestRate.toFixed(
          2
        )} req/s from ${uniqueIPs} IPs`
      );
      console.log(
        "\x1b[31m%s\x1b[0m",
        `Average ${avgRequestsPerIP.toFixed(2)} requests per IP`
      );

      // Count occurrences of each IP
      const ipCounts = {};
      recentPackets.forEach((packet) => {
        const ip = packet.src_ip || "unknown";
        ipCounts[ip] = (ipCounts[ip] || 0) + 1;
      });

      // Sort IPs by count in descending order
      const topIPs = Object.entries(ipCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      console.log("Top attacking IPs:");
      topIPs.forEach(([ip, count]) => {
        console.log(`  ${ip}: ${count} requests`);
      });

      // Save rule-based alert to global alerts array
      if (!global.ddosAlerts) {
        global.ddosAlerts = [];
      }

      const alertData = {
        timestamp: new Date().toISOString(),
        type: "rule-based",
        requestRate,
        avgRequestsPerIP,
        uniqueIPs,
        totalRequests: recentPackets.length,
        topIPs: topIPs.map(([ip, count]) => ({ ip, count })),
        source: "Rule-based detection",
      };

      global.ddosAlerts.push(alertData);

      // Keep only the last 100 alerts
      if (global.ddosAlerts.length > 100) {
        global.ddosAlerts = global.ddosAlerts.slice(-100);
      }

      // Add to ML security alerts array for admin dashboard
      if (mlSecurityAlerts) {
        mlSecurityAlerts.push({
          timestamp: new Date().toISOString(),
          type: "ddos",
          severity: "medium",
          message: `DDoS attack detected - ${requestRate.toFixed(
            2
          )} req/s, ${avgRequestsPerIP.toFixed(2)} req/IP`,
          details: {
            requestRate,
            avgRequestsPerIP,
            uniqueIPs,
            totalRequests: recentPackets.length,
            source: "Rule-based detection",
            topAttackers: topIPs
              .slice(0, 3)
              .map(([ip, count]) => `${ip} (${count} requests)`),
          },
        });
      }
    }

    // Call ML model if significant traffic
    if (recentPackets.length > 10) {
      analyzeDDoSTraffic(extractFeaturesForML(recentPackets)).catch((err) =>
        console.error("Error in DDoS analysis:", err)
      );
    }
  }
}, 5000); // Check every 5 seconds

/**
 * Middleware to monitor traffic and detect potential attacks
 */
const trafficMonitor = (req, res, next) => {
  // Skip monitoring for certain paths
  const skipPaths = ["/ml/traffic", "/static"];
  if (skipPaths.some((p) => req.path.includes(p))) {
    return next();
  }

  // Log request
  console.log(`${req.method} ${req.path}`);

  // Create a packet object with request data
  const packet = {
    timestamp: new Date().toISOString(),
    src_ip:
      req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress,
    path: req.path,
    method: req.method,
    headers: req.headers,
    query: req.query,
    content_length: parseInt(req.headers["content-length"] || "0"),
  };

  // Store the packet
  global.packetLogs.push(packet);

  // Limit packet log size to prevent memory leaks
  if (global.packetLogs.length > 1000) {
    global.packetLogs = global.packetLogs.slice(-1000);
  }

  // Capture response
  const originalSend = res.send;
  const startTime = Date.now();

  res.send = function (body) {
    // Augment packet with response data
    const responseTime = Date.now() - startTime;
    packet.status_code = res.statusCode;
    packet.response_time = responseTime;
    packet.response_size = body ? body.length : 0;

    // Call original send
    return originalSend.call(this, body);
  };

  next();
};

/**
 * Extract features for ML model from recent packets
 */
const extractFeaturesForML = (packets) => {
  const now = Date.now();
  const windowStart = now - 30000; // 30 second window

  // Basic stats
  const requestCount = packets.length;
  const sourceIPs = packets.map(
    (p) => p.src_ip || p.headers["x-forwarded-for"] || "unknown"
  );
  const uniqueIPs = new Set(sourceIPs);
  const paths = packets.map((p) => p.path);

  // Content length stats
  const contentLengths = packets.map((p) => p.content_length || 0);
  const avgContentLength =
    contentLengths.reduce((a, b) => a + b, 0) /
    Math.max(1, contentLengths.length);

  // Method distribution
  const methodCounts = {};
  packets.forEach((p) => {
    methodCounts[p.method] = (methodCounts[p.method] || 0) + 1;
  });

  // Most targeted paths
  const pathCounts = {};
  paths.forEach((p) => {
    pathCounts[p] = (pathCounts[p] || 0) + 1;
  });
  const mostTargetedPath =
    Object.entries(pathCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "/";

  // Top source IPs
  const ipCounts = {};
  sourceIPs.forEach((ip) => {
    ipCounts[ip] = (ipCounts[ip] || 0) + 1;
  });
  const topIPs = Object.entries(ipCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }));

  // Simplified TCP stats (HTTP-based estimation)
  const tcpStats = {
    syn_count: packets.filter((p) => p.method === "GET").length,
    ack_count: packets.length,
    psh_count: packets.filter((p) => p.method === "POST" || p.method === "PUT")
      .length,
    rst_count: 0,
    fin_count: packets.length, // Each HTTP request should complete
    total_window_size: packets.length * 65535,
    total_urgent_ptr: 0,
    total_header_len: packets.length * 20,
  };

  return {
    timestamp: now,
    request_count: requestCount,
    source_ips: Array.from(uniqueIPs),
    top_ips: topIPs,
    most_targeted_path: mostTargetedPath,
    method_distribution: methodCounts,
    content_length_stats: {
      avg: avgContentLength,
    },
    tcp_stats: tcpStats,
    raw_packets: packets,
  };
};

/**
 * Analyze traffic for DDoS using ML model
 */
const analyzeDDoSTraffic = async (features) => {
  try {
    const requestRate = features.request_count / 30; // requests per second
    const uniqueIPs = new Set(features.source_ips).size;
    const avgRequestsPerIP = features.request_count / Math.max(1, uniqueIPs);

    console.log("Traffic Analysis:", {
      requestCount: features.request_count,
      uniqueIPs: uniqueIPs,
      requestRate: requestRate,
      avgRequestsPerIP: avgRequestsPerIP,
    });

    // Skip ML analysis if no traffic
    if (features.request_count === 0) {
      console.log("No traffic to analyze");
      return { is_attack: false, confidence: 0, prediction: 0 };
    }

    // Convert features to the format expected by the ML model
    const mlFeatures = {
      dt: features.timestamp,
      pktcount: features.request_count,
      bytecount: features.content_length_stats.avg * features.request_count,
      dur: 30,
      flows: uniqueIPs,
      packetins: features.request_count,
      pktperflow: avgRequestsPerIP,
      byteperflow:
        (features.content_length_stats.avg * features.request_count) /
        Math.max(1, uniqueIPs),
      pktrate: requestRate,
      Protocol: features.method_distribution.POST ? "TCP" : "UDP",
      port_no: 80,
      tx_bytes: features.content_length_stats.avg * features.request_count,
      rx_bytes: features.content_length_stats.avg * features.request_count,
      // Add TCP flags and header information with safe division
      syn_flag:
        features.tcp_stats.syn_count / Math.max(1, features.request_count),
      ack_flag:
        features.tcp_stats.ack_count / Math.max(1, features.request_count),
      psh_flag:
        features.tcp_stats.psh_count / Math.max(1, features.request_count),
      rst_flag:
        features.tcp_stats.rst_count / Math.max(1, features.request_count),
      fin_flag:
        features.tcp_stats.fin_count / Math.max(1, features.request_count),
      window_size:
        features.tcp_stats.total_window_size /
        Math.max(1, features.request_count),
      urgent_ptr:
        features.tcp_stats.total_urgent_ptr /
        Math.max(1, features.request_count),
      header_len:
        features.tcp_stats.total_header_len /
        Math.max(1, features.request_count),
    };

    console.log("Sending features to ML model:", mlFeatures);

    // Call Python script with features using promise instead of execFile
    return new Promise((resolve, reject) => {
      try {
        // Use the correct path - going up one directory from backend
        const mlScriptPath = path.join(
          __dirname,
          "../../ML Models/scripts/ddos_analyze.py"
        );
        console.log("Using ML script path:", mlScriptPath);

        // Use the virtual environment's Python interpreter
        const pythonPath = path.join(__dirname, "../../venv/bin/python");
        console.log("Using Python interpreter:", pythonPath);

        const pythonProcess = spawn(pythonPath, [
          mlScriptPath,
          JSON.stringify(mlFeatures),
        ]);

        let stdout = "";
        let stderr = "";

        // Collect stdout data
        pythonProcess.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        // Collect stderr data
        pythonProcess.stderr.on("data", (data) => {
          stderr += data.toString();
          console.log(`ML model stderr: ${data.toString()}`);
        });

        // Handle process completion
        pythonProcess.on("close", (code) => {
          console.log(`ML process exited with code ${code}`);

          if (code !== 0) {
            console.error(`ML model error: ${stderr}`);
            resolve({
              is_attack: false,
              error: `Process exited with code ${code}`,
              confidence: 0,
            });
            return;
          }

          try {
            // Parse the JSON response
            const mlResponse = JSON.parse(stdout.trim());
            console.log("ML model response:", mlResponse);

            // If ML model detects an attack or confidence is high, save to alerts
            if (mlResponse.is_attack === true || mlResponse.confidence > 0.7) {
              // Initialize global alerts array if not exists
              if (!global.ddosAlerts) {
                global.ddosAlerts = [];
              }

              // Save ML-based alert
              const mlAlertData = {
                timestamp: new Date().toISOString(),
                type: "ml-based",
                requestRate,
                avgRequestsPerIP,
                uniqueIPs,
                totalRequests: features.request_count,
                confidence: mlResponse.confidence,
                attack_type: mlResponse.attack_type || "Unknown",
                source: "ML model detection",
              };

              global.ddosAlerts.push(mlAlertData);

              // Keep only the last 100 alerts
              if (global.ddosAlerts.length > 100) {
                global.ddosAlerts = global.ddosAlerts.slice(-100);
              }

              // Add to ML security alerts array for admin dashboard
              if (mlSecurityAlerts) {
                // Map attack type to categories used in the dashboard
                let attackType = "http_flood"; // Default
                if (mlResponse.attack_type) {
                  if (mlResponse.attack_type.includes("syn"))
                    attackType = "syn_flood";
                  else if (mlResponse.attack_type.includes("udp"))
                    attackType = "udp_flood";
                  else if (mlResponse.attack_type.includes("slow"))
                    attackType = "slowloris";
                }

                mlSecurityAlerts.push({
                  timestamp: new Date().toISOString(),
                  type: "ddos",
                  severity: "high",
                  message: `ML model detected DDoS attack - ${attackType} with ${(
                    mlResponse.confidence * 100
                  ).toFixed(0)}% confidence`,
                  details: {
                    requestRate,
                    avgRequestsPerIP,
                    uniqueIPs,
                    totalRequests: features.request_count,
                    confidence: mlResponse.confidence,
                    attack_type: mlResponse.attack_type || "Unknown",
                    source: "ML model detection",
                  },
                });
              }
            }

            // Simple threshold-based detection as backup
            const isHighTraffic = requestRate > 100; // More than 100 req/sec
            const isHighRequestsPerIP = avgRequestsPerIP > 20; // More than 20 req/user

            if (isHighTraffic && isHighRequestsPerIP) {
              console.log("ALERT: High traffic detected - possible DDoS!");
            }

            resolve(mlResponse);
          } catch (parseError) {
            console.error("Error parsing ML model response:", parseError);
            console.error("Raw stdout:", stdout);
            resolve({
              is_attack: false,
              error: `JSON parse error: ${parseError.message}`,
              confidence: 0,
            });
          }
        });

        // Handle process error
        pythonProcess.on("error", (error) => {
          console.error(`Error spawning ML process: ${error}`);
          resolve({ is_attack: false, error: error.message, confidence: 0 });
        });
      } catch (error) {
        console.error("Error in ML model execution:", error);
        resolve({ is_attack: false, error: error.message, confidence: 0 });
      }
    });
  } catch (error) {
    console.error("Error in DDoS detection:", error);
    return { error: error.message, is_attack: false };
  }
};

// Log handler for detections
const logDetection = async (detection) => {
  console.log("DDoS Detection:", detection);
};

// Clean up on process exit
process.on("SIGINT", () => {
  console.log("Packet Logger: Shutting down packet logger");
  process.exit();
});

module.exports = trafficMonitor;
