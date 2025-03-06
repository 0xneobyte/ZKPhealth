const path = require("path");
const { spawn } = require("child_process");
const { runPythonScript } = require("../utils/pythonRunner");

// Initialize global packet logs
global.packetLogs = global.packetLogs || [];

/**
 * Middleware to monitor traffic and detect potential attacks
 */
const trafficMonitor = (req, res, next) => {
  // Skip monitoring for certain paths
  const skipPaths = ["/ml/traffic", "/health", "/api/packets"];
  if (skipPaths.some((path) => req.path.includes(path))) {
    return next();
  }

  // Capture request start time
  const startTime = Date.now();

  // Create a packet object with request data
  const packet = {
    timestamp: new Date().toISOString(),
    src_ip:
      req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress,
    dst_ip: req.hostname || "localhost",
    protocol: "HTTP",
    method: req.method,
    path: req.path,
    user_agent: req.get("User-Agent"),
    content_length: parseInt(req.get("Content-Length") || "0"),
    headers: Object.keys(req.headers).reduce((obj, key) => {
      // Filter out sensitive headers
      if (!["cookie", "authorization"].includes(key.toLowerCase())) {
        obj[key] = req.headers[key];
      }
      return obj;
    }, {}),
  };

  // Store original end method
  const originalEnd = res.end;

  // Override end method to capture response data
  res.end = function (chunk, encoding) {
    // Calculate request duration
    const duration = Date.now() - startTime;

    // Add response data to packet
    packet.status_code = res.statusCode;
    packet.response_time = duration;
    packet.response_size = res._contentLength || 0;

    // Send packet to ML analysis
    analyzeTraffic(packet);

    // Call original end method
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Function to analyze traffic and detect potential attacks
 * @param {Object} packet - The packet object with request/response data
 */
const analyzeTraffic = async (packet) => {
  try {
    // Store packet in memory
    global.packetLogs.push(packet);

    // Keep only the last 1000 packets
    if (global.packetLogs.length > 1000) {
      global.packetLogs.shift();
    }

    // Periodically analyze all traffic with ML model
    // We don't want to call the ML model for every single request as that would be too resource-intensive
    // Instead, we'll analyze in batches every few seconds
    const now = Date.now();
    if (!global.lastMLAnalysisTime || now - global.lastMLAnalysisTime > 5000) {
      // Every 5 seconds
      global.lastMLAnalysisTime = now;
      analyzeAllTraffic();
    }
  } catch (error) {
    console.error("Error analyzing traffic:", error);
  }
};

/**
 * Function to analyze all recent traffic with the ML model
 */
const analyzeAllTraffic = () => {
  try {
    // Get recent packets (last 30 seconds)
    const now = Date.now();
    const recentPackets = global.packetLogs.filter(
      (p) => new Date(p.timestamp).getTime() > now - 30000
    );

    // If we have enough packets to analyze
    if (recentPackets.length > 10) {
      // Extract features for ML model from all traffic
      const features = extractFeaturesForML(recentPackets);

      // Use ML model to analyze all traffic
      useDDoSModel(features);
    }
  } catch (error) {
    console.error("Error analyzing all traffic:", error);
  }
};

/**
 * Extract features for ML model from recent packets
 * @param {Array} packets - Recent packets
 * @returns {Object} Features for ML model
 */
const extractFeaturesForML = (packets) => {
  // Calculate request rate
  const requestRate = packets.length / 30; // requests per second over 30 seconds

  // Calculate average response time
  const avgResponseTime =
    packets.reduce((sum, p) => sum + (p.response_time || 0), 0) /
    packets.length;

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

  // Find most targeted path
  let mostTargetedPath = "";
  let maxPathCount = 0;
  Object.entries(pathCounts).forEach(([path, count]) => {
    if (count > maxPathCount) {
      mostTargetedPath = path;
      maxPathCount = count;
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
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }));

  // Calculate standard deviation of requests per IP
  const ipCountValues = Object.values(ipCounts);
  const avgRequestsPerIP =
    ipCountValues.reduce((sum, count) => sum + count, 0) / ipCountValues.length;
  const variance =
    ipCountValues.reduce(
      (sum, count) => sum + Math.pow(count - avgRequestsPerIP, 2),
      0
    ) / ipCountValues.length;
  const stdDevRequestsPerIP = Math.sqrt(variance);

  return {
    timestamp: new Date().toISOString(),
    request_count: packets.length,
    request_rate: requestRate,
    avg_response_time: avgResponseTime,
    unique_ips: Object.keys(ipCounts).length,
    top_ips: topIPs,
    method_distribution: methodCounts,
    most_targeted_path: mostTargetedPath,
    path_count: maxPathCount,
    avg_requests_per_ip: avgRequestsPerIP,
    std_dev_requests_per_ip: stdDevRequestsPerIP,
    // Additional features that might be useful for ML
    status_code_distribution: getStatusCodeDistribution(packets),
    content_length_stats: getContentLengthStats(packets),
    time_distribution: getTimeDistribution(packets),
  };
};

/**
 * Get distribution of status codes
 * @param {Array} packets - Packets to analyze
 * @returns {Object} Distribution of status codes
 */
const getStatusCodeDistribution = (packets) => {
  const distribution = {};
  packets.forEach((p) => {
    if (p.status_code) {
      const category = Math.floor(p.status_code / 100) * 100;
      distribution[category] = (distribution[category] || 0) + 1;
    }
  });
  return distribution;
};

/**
 * Get statistics about content length
 * @param {Array} packets - Packets to analyze
 * @returns {Object} Content length statistics
 */
const getContentLengthStats = (packets) => {
  const lengths = packets
    .map((p) => p.content_length || 0)
    .filter((l) => l > 0);
  if (lengths.length === 0) return { avg: 0, max: 0, min: 0 };

  return {
    avg: lengths.reduce((sum, l) => sum + l, 0) / lengths.length,
    max: Math.max(...lengths),
    min: Math.min(...lengths),
  };
};

/**
 * Get distribution of requests over time
 * @param {Array} packets - Packets to analyze
 * @returns {Object} Distribution of requests over time
 */
const getTimeDistribution = (packets) => {
  const distribution = {};
  const now = Date.now();

  // Group by 5-second intervals
  packets.forEach((p) => {
    const timestamp = new Date(p.timestamp).getTime();
    const secondsAgo = Math.floor((now - timestamp) / 5000) * 5;
    distribution[secondsAgo] = (distribution[secondsAgo] || 0) + 1;
  });

  return distribution;
};

/**
 * Use ML model to analyze traffic and detect DDoS attacks
 * @param {Object} features - Features extracted from traffic
 */
const useDDoSModel = async (features) => {
  try {
    // In a production environment, we would use the actual ML model here
    // For now, we'll use a simplified approach based on traffic patterns

    // These thresholds would ideally come from the ML model
    const highRequestRate = 20; // More than 20 requests per second
    const highStdDev = 5; // High standard deviation indicates uneven distribution
    const highRatio = 3; // High ratio of requests to unique IPs

    let isAttack = false;
    let attackType = "";
    let confidence = 0;

    // Check for high request rate
    if (features.request_rate > highRequestRate) {
      isAttack = true;
      attackType = "http_flood";
      confidence = Math.min(
        0.5 + (features.request_rate / highRequestRate) * 0.1,
        0.95
      );
    }

    // Check for distributed attack (many IPs, each with few requests)
    if (features.unique_ips > 10 && features.avg_requests_per_ip < 3) {
      isAttack = true;
      attackType = "distributed_http_flood";
      confidence = Math.min(0.6 + (features.unique_ips / 20) * 0.1, 0.9);
    }

    // Check for targeted attack (few IPs, each with many requests)
    if (features.std_dev_requests_per_ip > highStdDev) {
      isAttack = true;
      attackType = "targeted_http_flood";
      confidence = Math.min(
        0.7 + (features.std_dev_requests_per_ip / highStdDev) * 0.05,
        0.95
      );
    }

    // Check for API abuse (high ratio of requests to unique IPs)
    const requestToIPRatio =
      features.request_count / Math.max(1, features.unique_ips);
    if (requestToIPRatio > highRatio) {
      isAttack = true;
      attackType = "api_abuse";
      confidence = Math.min(0.6 + (requestToIPRatio / highRatio) * 0.1, 0.9);
    }

    // If we detect an attack, save it
    if (isAttack) {
      // Create detection object
      const detection = {
        timestamp: features.timestamp,
        attack_type: attackType,
        source_ips: features.top_ips.map((s) => s.ip),
        target: features.most_targeted_path || "HTTP Server",
        request_count: features.request_count,
        request_rate: features.request_rate,
        confidence: confidence,
        features: features, // Include all features for analysis
      };

      // Save detection
      saveDDoSDetection(detection);

      console.log(
        `ML model detected DoS attack: ${attackType} with confidence ${confidence.toFixed(
          2
        )}`
      );
    }

    // In a real implementation, we would use the actual ML model:
    /*
    try {
      // Convert features to the format expected by the ML model
      const mlFeatures = convertFeaturesToMLFormat(features);
      
      // Call the ML model
      const result = await runPythonScript('ddos_analyze.py', [JSON.stringify(mlFeatures)]);
      
      // If the model predicts an attack, save it
      if (result.is_attack) {
        saveDDoSDetection({
          timestamp: features.timestamp,
          attack_type: result.attack_type,
          source_ips: features.top_ips.map(s => s.ip),
          target: features.most_targeted_path || 'HTTP Server',
          confidence: result.confidence,
          features: features
        });
      }
    } catch (error) {
      console.error('Error calling ML model:', error);
    }
    */
  } catch (error) {
    console.error("Error using DDoS ML model:", error);
  }
};

/**
 * Save DDoS detection to persistent storage
 * @param {Object} detection - Detection data
 */
const saveDDoSDetection = async (detection) => {
  try {
    // Get the securityAlerts array from the ml.js module
    const mlModule = require("../routes/ml");
    const securityAlerts = mlModule.securityAlerts;

    // Add to security alerts
    if (securityAlerts) {
      securityAlerts.push({
        id: Date.now(),
        type: "danger",
        message: `DDoS attack detected! ${detection.attack_type} targeting ${detection.target}`,
        timestamp: detection.timestamp,
        severity: "high",
        details: `Request rate: ${detection.request_rate}/s from ${detection.source_ips.length} IPs`,
      });
    }

    // Run the Python script to save the detection
    const scriptPath = path.join(
      __dirname,
      "../../ML Models/scripts/ddos_save_detection.py"
    );

    const pythonProcess = spawn("python", [
      scriptPath,
      JSON.stringify(detection),
    ]);

    pythonProcess.stderr.on("data", (data) => {
      console.error(`Error saving DDoS detection: ${data}`);
    });

    // Force refresh of the DDoS stats cache
    if (mlModule.ddosCache) {
      mlModule.ddosCache.lastUpdated = null;
    }
  } catch (error) {
    console.error("Error saving DDoS detection:", error);
  }
};

module.exports = trafficMonitor;
