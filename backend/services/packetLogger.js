const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");

// Path to the ML Models directory
const ML_DIR = path.join(__dirname, "../../ML Models");
const SCRIPTS_DIR = path.join(ML_DIR, "scripts");
const PACKET_LOGGER_SCRIPT = path.join(SCRIPTS_DIR, "packet_logger.py");

// Port for the packet logger
const PACKET_LOGGER_PORT = 8000;

// Check if the packet logger script exists
const scriptExists = fs.existsSync(PACKET_LOGGER_SCRIPT);

// Variable to store the packet logger process
let packetLoggerProcess = null;

/**
 * Check if the packet logger is already running
 * @returns {Promise<boolean>} True if the packet logger is running, false otherwise
 */
const isPacketLoggerRunning = async () => {
  try {
    // Try to make a request to the packet logger API
    return new Promise((resolve) => {
      const req = http.get(
        `http://localhost:${PACKET_LOGGER_PORT}/api/packets?limit=1`,
        (res) => {
          // If we get a 200 response, the packet logger is running
          resolve(res.statusCode === 200);

          // Consume the response data to free up memory
          res.resume();
        }
      );

      req.on("error", () => {
        // If we get an error, the packet logger is not running
        resolve(false);
      });

      // Set a timeout in case the request hangs
      req.setTimeout(1000, () => {
        req.abort();
        resolve(false);
      });
    });
  } catch (error) {
    return false;
  }
};

/**
 * Start the packet logger
 * @returns {Promise<boolean>} True if started successfully or already running, false otherwise
 */
const startPacketLogger = async () => {
  try {
    if (!scriptExists) {
      console.error(
        `Packet logger script not found at ${PACKET_LOGGER_SCRIPT}`
      );
      return false;
    }

    // First check if the packet logger is already running
    const isRunning = await isPacketLoggerRunning();
    if (isRunning) {
      console.log(
        `Packet logger is already running on port ${PACKET_LOGGER_PORT}`
      );
      return true;
    }

    // Check if the port is in use by something else
    const portInUse = await isPortInUse(PACKET_LOGGER_PORT);
    if (portInUse) {
      console.error(
        `Port ${PACKET_LOGGER_PORT} is already in use by another application`
      );
      return false;
    }

    // Start the packet logger
    console.log("Starting packet logger...");

    return new Promise((resolve) => {
      try {
        packetLoggerProcess = spawn("python3", [PACKET_LOGGER_SCRIPT], {
          cwd: SCRIPTS_DIR,
          detached: true,
          stdio: "pipe", // Capture output
        });

        // Log stdout
        packetLoggerProcess.stdout.on("data", (data) => {
          console.log(`Packet Logger: ${data.toString().trim()}`);
        });

        // Log stderr - these are often just HTTP request logs, not actual errors
        packetLoggerProcess.stderr.on("data", (data) => {
          const errorText = data.toString().trim();

          // Check if this is an "Address already in use" error
          if (errorText.includes("Address already in use")) {
            console.log(
              "Packet logger port is already in use, checking if it's the packet logger..."
            );

            // Check if it's our packet logger that's using the port
            isPacketLoggerRunning().then((isRunning) => {
              if (isRunning) {
                console.log("Packet logger is already running on this port");
                resolve(true);
              } else {
                console.error("Port is in use by another application");
                resolve(false);
              }
            });
          } else {
            // Just log as info, not as error
            console.log(`Packet Logger: ${errorText}`);
          }
        });

        // Handle process exit
        packetLoggerProcess.on("close", (code) => {
          if (code !== 0) {
            console.error(`Packet logger exited with code ${code}`);
            packetLoggerProcess = null;
            resolve(false);
          } else {
            console.log("Packet logger stopped");
            packetLoggerProcess = null;
          }
        });

        // Wait a bit to make sure it starts
        setTimeout(async () => {
          const running = await isPacketLoggerRunning();
          if (running) {
            console.log(
              `Packet logger started successfully on port ${PACKET_LOGGER_PORT}`
            );
            resolve(true);
          } else {
            console.error("Packet logger failed to start");
            resolve(false);
          }
        }, 2000);
      } catch (error) {
        console.error("Error starting packet logger:", error);
        resolve(false);
      }
    });
  } catch (error) {
    console.error("Error in startPacketLogger:", error);
    return false;
  }
};

/**
 * Stop the packet logger
 */
const stopPacketLogger = () => {
  if (packetLoggerProcess) {
    console.log("Stopping packet logger...");

    // Kill the process group
    try {
      process.kill(-packetLoggerProcess.pid, "SIGINT");
    } catch (error) {
      console.error("Error stopping packet logger:", error);
    }

    packetLoggerProcess = null;
  }
};

/**
 * Check if a port is in use
 * @param {number} port The port to check
 * @returns {Promise<boolean>} True if the port is in use, false otherwise
 */
const isPortInUse = (port) => {
  return new Promise((resolve) => {
    const server = http.createServer();

    server.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        resolve(true);
      } else {
        resolve(false);
      }
      server.close();
    });

    server.once("listening", () => {
      server.close();
      resolve(false);
    });

    server.listen(port);
  });
};

/**
 * Simulate a DoS attack
 * @param {string} targetIp The target IP address
 * @param {number} duration The duration of the attack in seconds
 * @returns {Promise<object>} The result of the simulation
 */
const simulateDoSAttack = async (targetIp, duration) => {
  try {
    // Check if the packet logger is running
    const isRunning = await isPacketLoggerRunning();
    if (!isRunning) {
      throw new Error("Packet logger is not running");
    }

    // Make a request to the packet logger API
    const url = `http://localhost:${PACKET_LOGGER_PORT}/api/simulate-dos?target=${targetIp}&duration=${duration}`;

    return new Promise((resolve, reject) => {
      http
        .get(url, (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            try {
              const result = JSON.parse(data);
              resolve(result);
            } catch (error) {
              reject(new Error(`Failed to parse response: ${error.message}`));
            }
          });
        })
        .on("error", (err) => {
          reject(new Error(`Failed to simulate DoS attack: ${err.message}`));
        });
    });
  } catch (error) {
    throw error;
  }
};

// Handle process exit
process.on("exit", () => {
  stopPacketLogger();
});

// Handle SIGINT (Ctrl+C)
process.on("SIGINT", () => {
  stopPacketLogger();
  process.exit(0);
});

// Handle SIGTERM
process.on("SIGTERM", () => {
  stopPacketLogger();
  process.exit(0);
});

module.exports = {
  startPacketLogger,
  stopPacketLogger,
  simulateDoSAttack,
  isPacketLoggerRunning,
  PACKET_LOGGER_PORT,
};
