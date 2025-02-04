const axios = require("axios");
const speakeasy = require("speakeasy");

const API_URL = "http://localhost:3001"; // Adjust port if needed
const TEST_WALLET = "0xcd786013c44a03bb21c6a9893db35800f05ec115";

async function test2FA() {
  try {
    console.log("Testing 2FA Setup...");
    console.log("Using API URL:", API_URL);
    console.log("Testing wallet:", TEST_WALLET);

    // Step 1: Setup 2FA
    console.log("\nStep 1: Setting up 2FA...");
    const setupResponse = await axios.post(`${API_URL}/2fa/setup`, {
      walletAddress: TEST_WALLET,
    });

    if (!setupResponse.data.success) {
      throw new Error("Setup failed: " + JSON.stringify(setupResponse.data));
    }

    const secret = setupResponse.data.secret;
    console.log("\n2FA Setup successful");
    console.log("Secret:", secret);
    console.log("QR Code URL received:", !!setupResponse.data.qrCode);

    // Step 2: Generate a test token
    console.log("\nStep 2: Generating test token...");
    const token = speakeasy.totp({
      secret: secret,
      encoding: "base32",
    });

    console.log("Generated test token:", token);

    // Step 3: Verify the token
    console.log("\nStep 3: Verifying token...");
    const verifyResponse = await axios.post(`${API_URL}/2fa/verify`, {
      walletAddress: TEST_WALLET,
      token: token,
    });

    if (verifyResponse.data.success) {
      console.log("2FA Verification successful!");
    } else {
      console.log("2FA Verification failed");
      console.log("Response:", verifyResponse.data);
    }
  } catch (error) {
    console.error("\nTest failed:");
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Response data:", error.response.data);
      console.error("Status code:", error.response.status);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received from server");
      console.error("Is the server running?");
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error:", error.message);
    }
  }
}

// Make sure server is running before testing
console.log("Starting 2FA test...");
console.log("Make sure your backend server is running on", API_URL);
console.log("Make sure MongoDB is running and connected");
console.log("----------------------------------------");

test2FA();
