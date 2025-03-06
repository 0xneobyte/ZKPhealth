const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");

// Path to the ML Models directory
const ML_DIR = path.join(__dirname, "../../ML Models");
const SCRIPTS_DIR = path.join(ML_DIR, "scripts");
const PACKET_LOGGER_SCRIPT = path.join(SCRIPTS_DIR, "packet_logger.py");

// Default port for the packet logger
let PACKET_LOGGER_PORT = 8000;

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
    const url = `http://localhost:${PACKET_LOGGER_PORT}/api/packets?limit=1`;

    return new Promise((resolve) => {
      const req = http.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          resolve(false);
        }
      });

      req.on("error", () => {
        resolve(false);
      });

      req.setTimeout(1000, () => {
        req.abort();
        resolve(false);
      });
    });
  } catch (error) {
    console.error("Error checking if packet logger is running:", error);
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
      console.log("Packet logger is already running");
      return true;
    }

    console.log("Starting packet logger...");

    // Start the packet logger process
    const pythonProcess = spawn("python", [PACKET_LOGGER_SCRIPT]);

    return new Promise((resolve, reject) => {
      let dataString = "";
      let errorString = "";
      let portFound = false;

      pythonProcess.stdout.on("data", (data) => {
        const output = data.toString().trim();
        dataString += output;

        // Check if the output is a port number
        const port = parseInt(output);
        if (!isNaN(port) && port > 0) {
          PACKET_LOGGER_PORT = port;
          console.log(`Packet logger using port ${port}`);
          portFound = true;
        }
      });

      pythonProcess.stderr.on("data", (data) => {
        console.log(`Packet Logger: ${data.toString()}`);
        errorString += data.toString();
      });

      pythonProcess.on("close", (code) => {
        console.log(`Packet logger exited with code ${code}`);

        if (code !== 0) {
          if (errorString.includes("port is already in use")) {
            console.log(
              "Packet logger port is already in use, checking if it's the packet logger..."
            );

            // Check if the packet logger is running on the default port
            isPacketLoggerRunning()
              .then((isRunning) => {
                if (isRunning) {
                  console.log(
                    "Packet logger is already running on the default port"
                  );
                  resolve(true);
                } else {
                  console.log("Port is in use by another application");
                  resolve(false);
                }
              })
              .catch(() => {
                console.log("Failed to check if packet logger is running");
                resolve(false);
              });
          } else {
            console.log("Packet logger failed to start");
            resolve(false);
          }
        } else if (portFound) {
          // Wait a bit for the server to start
          setTimeout(async () => {
            const isRunning = await isPacketLoggerRunning();
            if (isRunning) {
              console.log(
                `Packet logger started successfully on port ${PACKET_LOGGER_PORT}`
              );
              resolve(true);
            } else {
              console.log("Packet logger started but is not responding");
              resolve(false);
            }
          }, 1000);
        } else {
          console.log("Packet logger started but no port was found");
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error("Error starting packet logger:", error);
    return false;
  }
};

/**
 * Stop the packet logger
 */
const stopPacketLogger = () => {
  return new Promise((resolve, reject) => {
    // Find the packet logger process
    const findProcess = spawn("ps", ["aux"]);

    let output = "";

    findProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    findProcess.on("close", (code) => {
      if (code !== 0) {
        console.error("Failed to find packet logger process");
        resolve(false);
        return;
      }

      // Find the Python process running the packet logger
      const lines = output.split("\n");
      const packetLoggerProcesses = lines.filter(
        (line) => line.includes("python") && line.includes("packet_logger.py")
      );

      if (packetLoggerProcesses.length === 0) {
        console.log("No packet logger process found");
        resolve(true);
        return;
      }

      // Kill each packet logger process
      let processesKilled = 0;

      packetLoggerProcesses.forEach((processLine) => {
        const pid = processLine.trim().split(/\s+/)[1];

        if (pid) {
          const killProcess = spawn("kill", [pid]);

          killProcess.on("close", (killCode) => {
            processesKilled++;

            if (processesKilled === packetLoggerProcesses.length) {
              console.log("Packet logger stopped");
              resolve(true);
            }
          });
        }
      });
    });
  });
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
  get PACKET_LOGGER_PORT() {
    return PACKET_LOGGER_PORT;
  },
};
