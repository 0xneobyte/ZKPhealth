const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Web3 = require('web3');

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

    res.json({
      success: true,
      user: {
        address: user.walletAddress,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed. Make sure you are using a Ganache account and have the correct role.' 
    });
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

module.exports = router; 