const User = require("../models/User");
const mongoose = require("mongoose");
require("dotenv").config();

async function troubleshoot2FA(walletAddress) {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI not found in environment variables");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully");

    const user = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
    });

    if (!user) {
      console.log("\nUser not found!");
      console.log("Wallet address:", walletAddress);
      return;
    }

    console.log("\nUser 2FA Status:");
    console.log("----------------");
    console.log("Wallet:", user.walletAddress);
    console.log("2FA Enabled:", user.is2FAEnabled);
    console.log("Has Secret:", !!user.twoFactorSecret);
    console.log("Updated At:", user.updatedAt);
    console.log("\nFull user document:");
    console.log(JSON.stringify(user.toObject(), null, 2));
  } catch (error) {
    console.error("\nTroubleshooting error:");
    console.error(error.message);

    if (error.message.includes("MONGODB_URI")) {
      console.log(
        "\nMake sure you have a .env file in the backend directory with:"
      );
      console.log("MONGODB_URI=mongodb://localhost:27017/healthcare-zkp");
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log("\nClosed MongoDB connection");
    }
  }
}

// Usage:
troubleshoot2FA("0xcd786013c44a03bb21c6a9893db35800f05ec115");
