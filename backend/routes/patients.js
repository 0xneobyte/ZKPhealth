const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');

// Create patient record
router.post('/', async (req, res) => {
    try {
        const patient = new Patient(req.body);
        await patient.save();
        res.status(201).json(patient);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all patients for a doctor
router.get('/doctor/:doctorAddress', async (req, res) => {
    try {
        const patients = await Patient.find({ doctorAddress: req.params.doctorAddress });
        res.json(patients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 