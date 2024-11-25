const mongoose = require('mongoose');

const insuranceClaimSchema = new mongoose.Schema({
    patientId: {
        type: String,
        required: true
    },
    doctorAddress: {
        type: String,
        required: true
    },
    insuranceAddress: {
        type: String,
        required: true
    },
    // The actual value is encrypted/hidden
    bloodPressure: {
        type: String,
        required: true
    },
    // Only stores proof that BP is in valid range
    zkProof: {
        type: String,
        required: true
    },
    isEligible: {
        type: Boolean,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Export the model
const InsuranceClaim = mongoose.model('InsuranceClaim', insuranceClaimSchema);
module.exports = InsuranceClaim; 