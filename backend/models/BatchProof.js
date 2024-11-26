const mongoose = require('mongoose');

const batchProofSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now
    },
    claimsCount: {
        type: Number,
        required: true
    },
    aggregateProof: {
        type: String,
        required: true
    },
    claims: [{
        patientId: String,
        isEligible: Boolean
    }]
});

module.exports = mongoose.model('BatchProof', batchProofSchema); 