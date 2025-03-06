const { spawn } = require("child_process");
const path = require("path");

/**
 * Run a Python script and return the result
 * @param {string} scriptName - Name of the script in the ML Models/scripts directory
 * @param {Array} args - Arguments to pass to the script
 * @returns {Promise<Object>} - The parsed JSON result from the script
 */
const runPythonScript = (scriptName, args = []) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(
      __dirname,
      "../../ML Models/scripts",
      scriptName
    );

    // Check if script exists
    const fs = require("fs");
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

module.exports = {
  runPythonScript,
};
