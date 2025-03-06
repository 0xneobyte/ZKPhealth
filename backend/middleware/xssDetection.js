const { spawn } = require("child_process");
const path = require("path");
const http = require("http");

// In-memory cache for security alerts
let securityAlerts = [];

// Function to run the XSS detection script
const analyzeForXSS = async (payload) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(
      __dirname,
      "../../ML Models/scripts/xss_analyze.py"
    );

    const pythonProcess = spawn("python", [scriptPath, payload]);

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

// Function to forward XSS detection to the ML service
const forwardToMlService = (payload) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      payload: payload,
    });

    const options = {
      hostname: "localhost",
      port: process.env.PORT || 3001,
      path: "/ml/xss/analyze",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
      },
    };

    const req = http.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsedData = JSON.parse(responseData);
            resolve(parsedData);
          } catch (e) {
            resolve({ success: true });
          }
        } else {
          reject(
            new Error(`Request failed with status code ${res.statusCode}`)
          );
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
};

// Middleware to detect XSS in requests
const xssDetectionMiddleware = async (req, res, next) => {
  try {
    // Skip for certain paths
    const skipPaths = ["/ml/xss/analyze", "/health", "/api/packets"];
    if (skipPaths.some((path) => req.path.includes(path))) {
      return next();
    }

    // Get all potential XSS vectors from the request
    const vectors = [];

    // Check URL parameters (focus on these for the demo)
    if (Object.keys(req.query).length > 0) {
      Object.entries(req.query).forEach(([key, value]) => {
        if (typeof value === "string") {
          console.log(`Checking URL parameter: ${key}=${value}`);
          vectors.push(value);
        }
      });
    }

    // Check request body
    if (req.body && Object.keys(req.body).length > 0) {
      Object.values(req.body).forEach((value) => {
        if (typeof value === "string") {
          vectors.push(value);
        }
      });
    }

    // Check URL path segments
    req.path.split("/").forEach((segment) => {
      if (segment && segment.length > 5) {
        // Only check non-trivial segments
        vectors.push(segment);
      }
    });

    // Analyze each vector for XSS
    for (const vector of vectors) {
      if (vector.length > 5) {
        // Only check vectors of reasonable length
        try {
          const result = await analyzeForXSS(vector);

          if (result.is_attack) {
            console.log(
              `XSS attack detected in request to ${req.path}:`,
              vector
            );

            // Forward the detection to the ML service
            try {
              await forwardToMlService(vector);
              console.log("Successfully forwarded XSS detection to ML service");
            } catch (error) {
              console.error("Error forwarding XSS detection:", error.message);
            }
          }
        } catch (error) {
          console.error("Error analyzing for XSS:", error.message);
        }
      }
    }

    next();
  } catch (error) {
    console.error("Error in XSS detection middleware:", error);
    next(); // Continue processing even if there's an error in the middleware
  }
};

module.exports = xssDetectionMiddleware;
