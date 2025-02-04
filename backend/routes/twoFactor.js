const express = require("express");
const router = express.Router();
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const User = require("../models/User");
const { encrypt, decrypt } = require("../utils/encryption");

// Generate 2FA secret and QR code
router.post("/setup", async (req, res) => {
  try {
    const { walletAddress } = req.body;
    console.log("Setting up 2FA for:", walletAddress);

    // Generate new secret
    const secret = speakeasy.generateSecret();
    console.log("Generated secret");

    // Create QR code
    const otpauthUrl = `otpauth://totp/Healthcare_ZKP:${walletAddress}?secret=${secret.base32}&issuer=Healthcare_ZKP`;
    const qrCode = await QRCode.toDataURL(otpauthUrl);
    console.log("Generated QR code");

    // Store secret temporarily (encrypted, but is2FAEnabled still false)
    const user = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
    });
    user.twoFactorSecret = encrypt(secret.base32);
    await user.save();
    console.log("Stored temporary secret");

    res.json({
      success: true,
      qrCode,
      secret: secret.base32,
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify 2FA code
router.post("/verify", async (req, res) => {
  try {
    const { walletAddress, token } = req.body;
    console.log("Verifying 2FA for:", walletAddress, "token:", token);

    const user = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
    });

    if (!user || !user.twoFactorSecret) {
      throw new Error("Invalid setup");
    }

    const decryptedSecret = decrypt(user.twoFactorSecret);

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: "base32",
      token: token,
      window: 1, // Allow 30 seconds window
    });

    console.log("Verification result:", verified);

    if (verified) {
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, message: "Invalid token" });
    }
  } catch (error) {
    console.error("2FA Verification error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reset 2FA
router.post("/reset", async (req, res) => {
  try {
    const { walletAddress } = req.body;

    const user = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
    });
    if (!user) {
      throw new Error("User not found");
    }

    // Reset 2FA fields
    user.is2FAEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    res.json({
      success: true,
      message: "2FA has been reset successfully",
    });
  } catch (error) {
    console.error("2FA Reset error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Enable 2FA after verification
router.post("/enable", async (req, res) => {
  try {
    const { walletAddress } = req.body;
    console.log("Enabling 2FA for:", walletAddress);

    const user = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
    });
    user.is2FAEnabled = true;
    await user.save();
    console.log("2FA enabled in MongoDB");

    res.json({ success: true });
  } catch (error) {
    console.error("2FA enable error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add this new route
router.get("/status/:address", async (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    const user = await User.findOne({ walletAddress: address });

    res.json({
      success: true,
      is2FAEnabled: user ? user.is2FAEnabled : false,
    });
  } catch (error) {
    console.error("Error checking 2FA status:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      is2FAEnabled: false,
    });
  }
});

module.exports = router;
