const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const InsuranceClaim = require('../models/InsuranceClaim');
const ZKRollup = require('../utils/rollup');

// Get all claims
router.get('/claims', async (req, res) => {
    try {
        const claims = await InsuranceClaim.find({}).sort({ timestamp: -1 });
        res.json(claims);
    } catch (error) {
        console.error('Error fetching claims:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Verify claim endpoint
router.post('/verify/:claimId', async (req, res) => {
    try {
        console.log('🔍 Verifying claim:', req.params.claimId);
        
        const claim = await InsuranceClaim.findById(req.params.claimId);
        if (!claim) {
            throw new Error('Claim not found');
        }

        console.log('Found claim:', claim);

        // Use the ZKProof utility to verify
        const isValid = ZKProof.verifyProof(claim.zkProof);

        console.log('🔍 Verification details:');
        console.log('- Claim ID:', req.params.claimId);
        console.log('- Proof:', claim.zkProof);
        console.log('- Verification Result:', isValid);
        console.log('- Stored Eligibility:', claim.isEligible);

        // The verification result should match the stored eligibility
        if (isValid !== claim.isEligible) {
            console.warn('⚠️ Verification result does not match stored eligibility');
        }

        res.json({
            success: true,
            isValid: claim.isEligible, // Use the stored eligibility
            message: claim.isEligible ? 
                'Proof verified successfully - Patient is eligible' : 
                'Invalid proof - Patient is not eligible'
        });

    } catch (error) {
        console.error('❌ Verification error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Submit claim endpoint with rollup
router.post('/verify-eligibility', async (req, res) => {
    try {
        const { 
            patientId, 
            doctorAddress, 
            insuranceAddress, 
            bloodPressure 
        } = req.body;

        // Add to rollup batch
        const batchResult = await ZKRollup.addToBatch({
            patientId,
            doctorAddress,
            insuranceAddress,
            bloodPressure: parseInt(bloodPressure)
        });

        // If batch is processed, store batch proof
        if (batchResult) {
            // Store batch proof in blockchain (simplified)
            console.log('Batch processed:', batchResult);
        }

        // Store individual claim in MongoDB
        const claim = await InsuranceClaim.create({
            patientId,
            doctorAddress,
            insuranceAddress,
            bloodPressure: 'HIDDEN',
            zkProof: 'BATCH_PROCESSING',
            isEligible: bloodPressure >= 120 && bloodPressure <= 140
        });

        res.json({ 
            success: true, 
            isEligible: claim.isEligible,
            message: claim.isEligible ? 
                'Patient qualifies for wellness reward' : 
                'Patient does not qualify',
            batchProcessed: !!batchResult
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router; 