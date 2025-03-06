const { runPythonScript } = require("../utils/pythonRunner");

/**
 * Middleware to detect XSS attacks in requests
 */
const xssDetector = async (req, res, next) => {
  try {
    // Skip for certain paths
    const skipPaths = ["/ml/xss/analyze", "/health", "/api/packets"];
    if (skipPaths.some((path) => req.path.includes(path))) {
      return next();
    }

    // Collect all input vectors from the request
    const vectors = [];

    // Check URL parameters
    if (Object.keys(req.query).length > 0) {
      Object.entries(req.query).forEach(([key, value]) => {
        if (typeof value === "string") {
          vectors.push({ type: "query", key, value });
        }
      });
    }

    // Check request body
    if (req.body && Object.keys(req.body).length > 0) {
      const checkValue = (key, value, path = "") => {
        if (typeof value === "string") {
          vectors.push({
            type: "body",
            key: path ? `${path}.${key}` : key,
            value,
          });
        } else if (typeof value === "object" && value !== null) {
          // Recursively check nested objects
          Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            const newPath = path ? `${path}.${key}` : key;
            checkValue(nestedKey, nestedValue, newPath);
          });
        }
      };

      Object.entries(req.body).forEach(([key, value]) => {
        checkValue(key, value);
      });
    }

    // Check headers (excluding cookies and authorization)
    Object.entries(req.headers).forEach(([key, value]) => {
      if (
        !["cookie", "authorization"].includes(key.toLowerCase()) &&
        typeof value === "string"
      ) {
        vectors.push({ type: "header", key, value });
      }
    });

    // Check path segments
    req.path.split("/").forEach((segment, index) => {
      if (segment) {
        vectors.push({ type: "path", key: `segment_${index}`, value: segment });
      }
    });

    // Analyze all vectors with ML model
    for (const vector of vectors) {
      try {
        // Skip very short values as they're unlikely to be XSS attacks
        // But we're not pre-filtering based on content, just length
        if (vector.value.length < 3) continue;

        const result = await runPythonScript("xss_analyze.py", [vector.value]);

        if (result.is_attack) {
          console.log(
            `XSS attack detected in ${vector.type}.${
              vector.key
            }: ${vector.value.substring(0, 50)}${
              vector.value.length > 50 ? "..." : ""
            }`
          );

          // Get the securityAlerts array from the ml.js module
          const mlModule = require("../routes/ml");
          const securityAlerts = mlModule.securityAlerts;

          // Add security alert
          if (securityAlerts) {
            securityAlerts.push({
              id: Date.now(),
              type: "danger",
              message: `XSS attack detected in ${vector.type}.${
                vector.key
              }: ${vector.value.substring(0, 50)}${
                vector.value.length > 50 ? "..." : ""
              }`,
              timestamp: new Date().toISOString(),
              severity: "high",
              details: {
                ...result,
                request_path: req.path,
                request_method: req.method,
                vector_type: vector.type,
                vector_key: vector.key,
              },
            });
          }

          // Save detection for statistics
          try {
            await runPythonScript("xss_save_detection.py", [
              JSON.stringify({
                ...result,
                timestamp: new Date().toISOString(),
                request_path: req.path,
                request_method: req.method,
                vector_type: vector.type,
                vector_key: vector.key,
              }),
            ]);

            // Force refresh of the XSS stats cache
            if (mlModule.xssCache) {
              mlModule.xssCache.lastUpdated = null;
            }
          } catch (saveError) {
            console.error("Error saving XSS detection:", saveError);
          }
        } else {
          // Log low confidence results for debugging
          if (result.confidence > 0.3) {
            console.log(
              `Potential XSS (confidence: ${result.confidence}) in ${
                vector.type
              }.${vector.key}: ${vector.value.substring(0, 30)}...`
            );
          }
        }
      } catch (error) {
        console.error("Error analyzing for XSS:", error);
      }
    }
  } catch (error) {
    console.error("Error in XSS detection middleware:", error);
  }

  // Always continue to the next middleware
  next();
};

module.exports = xssDetector;
