const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticator } = require('otplib');
const { encrypt, decrypt } = require('../utils/encryption');

router.post('/enable2fa', async (req, res) => {
    try {
        const { walletAddress, totpSecret, backupCode } = req.body;
        console.log('Enabling 2FA for wallet:', walletAddress);
        
        const user = await User.findOneAndUpdate(
            { walletAddress: new RegExp(`^${walletAddress}$`, 'i') },
            { 
                $set: {
                    is2FAEnabled: true,
                    totpSecret: totpSecret,
                    backupCode: backupCode  // Store backup code
                }
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Enable 2FA error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/verify2fa', async (req, res) => {
    try {
        const { walletAddress, code } = req.body;
        console.log('Verifying 2FA for wallet:', walletAddress);
        console.log('Received code:', code);
        
        const user = await User.findOne({
            walletAddress: walletAddress.toLowerCase()
        });
        console.log('Found user:', user);
        
        if (!user) {
            console.log('User not found');
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.totpSecret) {
            console.log('No TOTP secret found in database');
            return res.status(400).json({ error: 'No 2FA secret found' });
        }

        // Use plaintext secret directly
        const secret = user.totpSecret;
        console.log('Using TOTP secret:', secret);

        // Verify the TOTP code
        const isValid = authenticator.verify({
            token: code,
            secret: secret
        });
        console.log('Code verification result:', isValid);

        if (!isValid) {
            console.log('Invalid code');
            return res.status(400).json({ error: 'Invalid code' });
        }

        console.log('Verification successful');
        res.json({ success: true });
    } catch (error) {
        console.error('Verify 2FA error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/users/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        await User.deleteOne({ walletAddress });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add this route to create users
router.post('/users', async (req, res) => {
    try {
        const { walletAddress, role, is2FAEnabled } = req.body;
        console.log('Creating user with address:', walletAddress);
        
        const user = new User({
            walletAddress: walletAddress.toLowerCase(),
            role,
            is2FAEnabled
        });
        
        await user.save();
        console.log('Created user:', user);
        res.json({ success: true, user });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add this route to check users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add this route to get user by wallet address
router.get('/users/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        console.log('Looking for wallet (original):', walletAddress);
        console.log('Looking for wallet (lowercase):', walletAddress.toLowerCase());
        
        // First try exact match
        let user = await User.findOne({ walletAddress });
        console.log('Exact match result:', user);
        
        // If no exact match, try case-insensitive
        if (!user) {
            user = await User.findOne({
                walletAddress: new RegExp('^' + walletAddress + '$', 'i')
            });
            console.log('Case-insensitive match result:', user);
        }
        
        if (!user) {
            // Log all users in DB for debugging
            const allUsers = await User.find({});
            console.log('All users in DB:', allUsers);
            
            return res.status(404).json({
                error: 'User not found',
                message: `No user found with address ${walletAddress}`,
                searchedAddress: walletAddress,
                availableAddresses: allUsers.map(u => u.walletAddress)
            });
        }
        
        console.log('Found user:', user);
        res.json(user);
    } catch (error) {
        console.error('Error in /users/:walletAddress:', error);
        res.status(500).json({
            error: 'Server error',
            message: error.message,
            stack: error.stack
        });
    }
});

// Add this route to delete all users
router.delete('/users/all', async (req, res) => {
    try {
        await User.deleteMany({});
        res.json({ success: true, message: 'All users deleted' });
    } catch (error) {
        console.error('Error deleting all users:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add PATCH route to update user
router.patch('/users/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const updates = req.body;
        
        const user = await User.findOneAndUpdate(
            { walletAddress: new RegExp(`^${walletAddress}$`, 'i') },
            { $set: updates },
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add this route to get decrypted TOTP secret
router.get('/users/:walletAddress/totp-secret', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        console.log('Getting TOTP secret for:', walletAddress);
        
        const user = await User.findOne({
            walletAddress: new RegExp(`^${walletAddress}$`, 'i')
        });
        console.log('Found user:', user);
        
        if (!user || !user.totpSecret) {
            return res.status(404).json({ error: 'TOTP secret not found' });
        }
        
        const decryptedSecret = decrypt(user.totpSecret);
        console.log('Decrypted secret:', !!decryptedSecret);
        
        if (!decryptedSecret) {
            return res.status(500).json({ error: 'Failed to decrypt secret' });
        }
        
        res.json({ secret: decryptedSecret });
    } catch (error) {
        console.error('Error getting TOTP secret:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add route to verify backup code
router.post('/verify2fa/backup', async (req, res) => {
    try {
        const { walletAddress, backupCode } = req.body;
        
        const user = await User.findOne({
            walletAddress: walletAddress.toLowerCase()
        });
        
        if (!user || !user.backupCode) {
            return res.status(404).json({ error: 'User or backup code not found' });
        }

        if (user.backupCode !== backupCode) {
            return res.status(400).json({ error: 'Invalid backup code' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Backup code verification error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 