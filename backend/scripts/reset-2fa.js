const mongoose = require("mongoose");
const User = require("../models/User");
const path = require("path");
const ethers = require("ethers");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function reset2FA(walletAddress, privateKey) {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // 1. Reset MongoDB state
    const user = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
    });

    if (user) {
      console.log("\nBefore reset:");
      console.log(JSON.stringify(user.toObject(), null, 2));

      // Clear all 2FA related fields
      user.is2FAEnabled = false;
      user.twoFactorSecret = undefined;
      await user.save();

      console.log("\nAfter reset:");
      console.log(JSON.stringify(user.toObject(), null, 2));
    }

    // 2. Reset blockchain state
    const provider = new ethers.providers.JsonRpcProvider(
      process.env.RPC_URL || "http://localhost:7545"
    );

    if (!privateKey) {
      throw new Error("DOCTOR_PRIVATE_KEY not found in environment variables");
    }

    const userWallet = new ethers.Wallet(privateKey, provider);
    console.log("\nUser address:", userWallet.address);

    const contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      [
        {
          inputs: [],
          name: "disable2FA",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            { internalType: "address", name: "_userAddress", type: "address" },
          ],
          name: "is2FAEnabled",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function",
        },
      ],
      userWallet
    );

    // Check if 2FA is enabled before trying to disable it
    const is2FAEnabled = await contract.is2FAEnabled(walletAddress);
    console.log("\n2FA currently enabled in blockchain:", is2FAEnabled);

    if (is2FAEnabled) {
      console.log("Disabling 2FA in blockchain...");
      const tx = await contract.disable2FA();
      await tx.wait();
      console.log("2FA disabled in blockchain");
    }

    console.log("\nReset complete!");
  } catch (error) {
    console.error("Reset error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\nDisconnected from MongoDB");
  }
}

// Doctor's wallet address and private key
const DOCTOR_ADDRESS = "0xcd786013c44a03bb21c6a9893db35800f05ec115";
const DOCTOR_PRIVATE_KEY = process.env.DOCTOR_PRIVATE_KEY;

if (!DOCTOR_PRIVATE_KEY) {
  console.error("Error: DOCTOR_PRIVATE_KEY not found in .env file");
  process.exit(1);
}

// Run the reset
reset2FA(DOCTOR_ADDRESS, DOCTOR_PRIVATE_KEY);
