const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticator } = require('otplib');

router.post('/enable2fa', async (req, res) => {
    try {
        const { walletAddress, totpSecret } = req.body;
        
        // Update user in database
        await User.findOneAndUpdate(
            { walletAddress },
            { 
                is2FAEnabled: true,
                totpSecret: encryptSecret(totpSecret) // Encrypt before storing
            }
        );

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/verify2fa', async (req, res) => {
    try {
        const { walletAddress, code } = req.body;
        
        // Get user with TOTP secret
        const user = await User.findOne({ walletAddress })
            .select('+totpSecret');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const decryptedSecret = decryptSecret(user.totpSecret);
        const isValid = authenticator.verify({
            token: code,
            secret: decryptedSecret
        });

        if (!isValid) {
            return res.status(400).json({ error: 'Invalid code' });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}); 