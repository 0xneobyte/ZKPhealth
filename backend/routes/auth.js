const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Web3 = require('web3');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');

const web3 = new Web3('http://127.0.0.1:7545');

// Get all Ganache accounts and assign roles
async function getAccountRole(address) {
  try {
    const accounts = await web3.eth.getAccounts();
    address = address.toLowerCase();
    
    const accountIndex = accounts.findIndex(acc => acc.toLowerCase() === address);
    
    if (accountIndex === -1) {
      throw new Error('Address not found in Ganache accounts');
    }

    switch(accountIndex) {
      case 0:
        return 'admin';
      case 1:
        return 'doctor';
      case 2:
        return 'insurance';
      default:
        return 'patient';
    }
  } catch (error) {
    console.error('Error in getAccountRole:', error);
    throw error;
  }
}

// Add encryption functions
function encrypt(text) {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encrypted) {
  const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Login route
router.post('/login', async (req, res) => {
  try {
    const { address } = req.body;
    const role = await getAccountRole(address);
    
    let user = await User.findOne({ walletAddress: address.toLowerCase() });
    
    if (!user) {
      user = new User({
        walletAddress: address.toLowerCase(),
        role: role,
        is2FAEnabled: false
      });
      await user.save();
    }

    if (user.is2FAEnabled) {
      // Return flag indicating 2FA is required
      return res.json({ 
        success: true, 
        requires2FA: true,
        user: {
          address: user.walletAddress,
          role: user.role
        }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { address: user.walletAddress, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true, 
      requires2FA: false,
      token,
      user: {
        address: user.walletAddress,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify 2FA and complete login
router.post('/verify2fa', async (req, res) => {
  try {
    const { address, code } = req.body;
    const user = await User.findOne({ walletAddress: address.toLowerCase() });

    if (!user || !user.totpSecret) {
      throw new Error('Invalid user or 2FA not set up');
    }

    const decryptedSecret = decrypt(user.totpSecret);
    const verified = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: code
    });

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Invalid 2FA code' });
    }

    // Generate JWT token after successful 2FA
    const token = jwt.sign(
      { address: user.walletAddress, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true, 
      token,
      user: {
        address: user.walletAddress,
        role: user.role
      }
    });

  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create/Update user route
router.post('/users', async (req, res) => {
  try {
    const { walletAddress, role, is2FAEnabled } = req.body;
    
    // Check if user already exists
    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (user) {
      // Update existing user
      user.role = role;
      user.is2FAEnabled = is2FAEnabled;
      await user.save();
    } else {
      // Create new user
      user = new User({
        walletAddress: walletAddress.toLowerCase(),
        role: role,
        is2FAEnabled: is2FAEnabled
      });
      await user.save();
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error creating/updating user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add this route to handle user updates
router.patch('/users/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const updateData = req.body;
    
    const user = await User.findOneAndUpdate(
      { walletAddress: walletAddress.toLowerCase() },
      updateData,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add this route to get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router; 