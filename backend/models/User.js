const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        required: true
    },
    is2FAEnabled: {
        type: Boolean,
        default: false
    },
    totpSecret: String,
    backupCode: String  // Add this field
});

module.exports = mongoose.model('User', userSchema); 