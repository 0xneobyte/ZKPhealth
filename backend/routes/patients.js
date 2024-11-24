const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const generatePatientId = require('../utils/patientIdGenerator');
const { encrypt, decrypt } = require('../utils/encryption');

// Generate new patient ID
router.get('/generate-id', async (req, res) => {
    try {
        const patientId = await generatePatientId();
        res.json({ patientId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create patient record with encryption
router.post('/', async (req, res) => {
    try {
        // Validate incoming data
        console.log('Received patient data:', {
            ...req.body,
            patientName: '***', // Hide sensitive data in logs
        });

        if (!req.body.patientId || !req.body.patientName || !req.body.age || !req.body.gender) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const encryptedData = {
            patientId: req.body.patientId,  // Don't generate new ID, use the one provided
            patientName: encrypt(req.body.patientName),
            age: encrypt(req.body.age.toString()),
            gender: encrypt(req.body.gender),
            clinicalDescription: encrypt(req.body.clinicalDescription || ''),
            disease: encrypt(req.body.disease || ''),
            doctorAddress: req.body.doctorAddress // Don't encrypt for searchability
        };

        console.log('Attempting to save encrypted data...');
        const patient = new Patient(encryptedData);
        await patient.save();
        console.log('Patient data saved successfully');

        // Return decrypted data in response
        const decryptedResponse = {
            ...req.body,
            _id: patient._id
        };
        
        res.status(201).json(decryptedResponse);
    } catch (error) {
        console.error('Detailed error:', error);
        res.status(400).json({ 
            error: error.message,
            details: error.errors ? Object.keys(error.errors).map(key => ({
                field: key,
                message: error.errors[key].message
            })) : null
        });
    }
});

// Get all patients for a doctor with decryption
router.get('/doctor/:doctorAddress', async (req, res) => {
    try {
        const patients = await Patient.find({ doctorAddress: req.params.doctorAddress });
        const decryptedPatients = patients.map(patient => ({
            _id: patient._id,
            patientId: patient.patientId,
            patientName: decrypt(patient.patientName),
            age: parseInt(decrypt(patient.age)),
            gender: decrypt(patient.gender),
            clinicalDescription: decrypt(patient.clinicalDescription),
            disease: decrypt(patient.disease),
            doctorAddress: patient.doctorAddress,
            createdAt: patient.createdAt
        }));
        res.json(decryptedPatients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add search endpoint with decryption
router.get('/search/:patientId', async (req, res) => {
    try {
        const patient = await Patient.findOne({ patientId: req.params.patientId });
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        const decryptedData = {
            patientId: patient.patientId,
            patientName: decrypt(patient.patientName),
            age: parseInt(decrypt(patient.age)),
            gender: decrypt(patient.gender),
            clinicalDescription: decrypt(patient.clinicalDescription),
            disease: decrypt(patient.disease),
            doctorAddress: patient.doctorAddress,
            createdAt: patient.createdAt
        };

        res.json(decryptedData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;