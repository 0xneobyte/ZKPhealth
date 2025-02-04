const mongoose = require("mongoose");
const User = require("../models/User");
const path = require("path");
const ethers = require("ethers");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function completeReset() {
  try {
    // 1. Reset MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const DOCTOR_ADDRESS = "0xcd786013c44a03bb21c6a9893db35800f05ec115";

    // Find and update user
    const user = await User.findOne({
      walletAddress: DOCTOR_ADDRESS.toLowerCase(),
    });

    if (user) {
      // Reset 2FA fields
      user.is2FAEnabled = false;
      user.twoFactorSecret = undefined;
      await user.save();
      console.log("MongoDB user reset");
    }

    // 2. Reset blockchain state
    const provider = new ethers.providers.JsonRpcProvider(
      process.env.RPC_URL || "http://localhost:7545"
    );

    const adminWallet = new ethers.Wallet(
      process.env.ADMIN_PRIVATE_KEY,
      provider
    );

    const CONTRACT_ABI = [
      {
        inputs: [],
        name: "disable2FA",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "_userAddress",
            type: "address",
          },
        ],
        name: "is2FAEnabled",
        outputs: [
          {
            internalType: "bool",
            name: "",
            type: "bool",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ];

    const contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      CONTRACT_ABI,
      adminWallet
    );

    // Check current state
    const is2FAEnabled = await contract.is2FAEnabled(DOCTOR_ADDRESS);
    console.log("\nCurrent state:");
    console.log("2FA enabled in blockchain:", is2FAEnabled);
    console.log("2FA enabled in MongoDB:", user?.is2FAEnabled);

    console.log("\nReset complete!");
  } catch (error) {
    console.error("Reset error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\nDisconnected from MongoDB");
  }
}

completeReset();
