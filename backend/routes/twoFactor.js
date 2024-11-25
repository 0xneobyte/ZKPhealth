const express = require('express');
const router = express.Router();
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');

// Generate 2FA secret and QR code
router.post('/setup', async (req, res) => {
  try {
    const { walletAddress } = req.body;

    // Generate new secret
    const secret = speakeasy.generateSecret({
      name: `Healthcare ZKP (${walletAddress})`
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Save secret temporarily (you might want to use Redis or session for this)
    // For now, we'll save it in the user document
    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (!user) {
      throw new Error('User not found');
    }

    user.tempSecret = secret.base32;
    await user.save();

    res.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCode
    });
  } catch (error) {
    console.error('2FA Setup error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify and enable 2FA
router.post('/verify', async (req, res) => {
  try {
    const { walletAddress, token } = req.body;

    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (!user || !user.tempSecret) {
      throw new Error('Invalid setup');
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.tempSecret,
      encoding: 'base32',
      token: token
    });

    if (verified) {
      user.is2FAEnabled = true;
      user.twoFactorSecret = user.tempSecret;
      user.tempSecret = undefined;
      await user.save();

      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, message: 'Invalid token' });
    }
  } catch (error) {
    console.error('2FA Verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router; 