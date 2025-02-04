const express = require("express");
const router = express.Router();
const Patient = require("../models/Patient");
const PatientBatch = require("../models/PatientBatch");
const PatientRollup = require("../utils/patientRollup");
const { encrypt, decrypt } = require("../utils/encryption");

// IMPORTANT: Put batch-progress route FIRST
router.get("/batch-progress", async (req, res) => {
  try {
    // Get current batch size from PatientRollup singleton
    const currentBatchSize = PatientRollup.getCurrentBatchSize();
    const totalBatchSize = PatientRollup.getBatchSize();

    console.log("Batch progress request:", {
      current: currentBatchSize,
      total: totalBatchSize,
      remaining: totalBatchSize - currentBatchSize,
    });

    res.json({
      success: true,
      progress: {
        current: currentBatchSize,
        total: totalBatchSize,
        remaining: totalBatchSize - currentBatchSize,
      },
    });
  } catch (error) {
    console.error("Error getting batch progress:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Add this endpoint for generating patient IDs
router.get("/generate-id", async (req, res) => {
  try {
    // Get the latest patient ID from DB
    const latestPatient = await Patient.findOne().sort({ _id: -1 });

    // Generate new ID
    let newId;
    if (latestPatient) {
      const lastId = parseInt(latestPatient.patientId.split("-")[1]);
      newId = `DM-${String(lastId + 1).padStart(5, "0")}`;
    } else {
      newId = "DM-00001";
    }

    res.json({ patientId: newId });
  } catch (error) {
    console.error("Error generating patient ID:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate patient ID",
    });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { patientData, doctorAddress } = req.body;

    // Add to rollup batch
    const batchResult = await PatientRollup.addToBatch({
      ...patientData,
      doctorAddress,
    });

    // If batch is ready, store batch proof
    if (batchResult) {
      await PatientBatch.create({
        doctorAddress,
        patientsCount: batchResult.patients.length,
        batchProof: batchResult.batchProof,
        patients: batchResult.patients,
      });
      console.log("Patient batch processed:", batchResult);
    }

    // Store individual patient
    const patient = await Patient.create(patientData);

    res.json({
      success: true,
      patient,
      batchProcessed: !!batchResult,
    });
  } catch (error) {
    console.error("Error registering patient:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add monitoring endpoints
router.get("/batches/status", async (req, res) => {
  try {
    // Get all batches with status
    const batches = await PatientBatch.find({})
      .sort({ timestamp: -1 })
      .limit(10); // Last 10 batches

    const batchStats = {
      totalBatches: await PatientBatch.countDocuments(),
      totalPatients: await PatientBatch.aggregate([
        { $group: { _id: null, total: { $sum: "$patientsCount" } } },
      ]),
      recentBatches: batches,
    };

    res.json({
      success: true,
      stats: batchStats,
    });
  } catch (error) {
    console.error("Error fetching batch status:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify specific batch
router.post("/batches/verify/:batchId", async (req, res) => {
  try {
    const { batchId } = req.params;
    const verificationResult = await PatientRollup.verifyBatch(batchId);

    res.json({
      success: true,
      verification: verificationResult,
    });
  } catch (error) {
    console.error("Error verifying batch:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add this POST endpoint for patient registration
router.post("/", async (req, res) => {
  try {
    const patientData = req.body;
    console.log("Received patient data:", patientData);

    // Encrypt data
    const encryptedData = {
      patientId: patientData.patientId,
      patientName: encrypt(patientData.patientName),
      dateOfBirth: encrypt(patientData.dateOfBirth),
      age: encrypt(patientData.age.toString()),
      gender: encrypt(patientData.gender),
      contactNumber: encrypt(patientData.contactNumber),
      clinicalDescription: encrypt(patientData.clinicalDescription),
      disease: encrypt(patientData.disease),
      doctorAddress: patientData.doctorAddress,
    };

    console.log("Encrypted data structure:", Object.keys(encryptedData));

    // Save to MongoDB
    const patient = await Patient.create(encryptedData);
    console.log("Saved patient data:", patient);

    // Add to rollup batch
    const batchResult = await PatientRollup.addToBatch({
      ...patientData,
      doctorAddress: patientData.doctorAddress,
      dateOfBirth: patientData.dateOfBirth,
      contactNumber: patientData.contactNumber,
    });

    // Only trigger blockchain transaction if batch is complete
    if (batchResult) {
      // This will trigger MetaMask only once per 10 patients
      await PatientBatch.create({
        doctorAddress: patientData.doctorAddress,
        patientsCount: batchResult.patients.length,
        batchProof: batchResult.batchProof,
        patients: batchResult.patients,
      });
      console.log("Patient batch processed:", batchResult);
    }

    res.json({
      success: true,
      patient: {
        ...patient.toObject(),
        patientName: patientData.patientName,
        dateOfBirth: patientData.dateOfBirth,
        contactNumber: patientData.contactNumber,
        patientId: patient.patientId,
      },
      batchProcessed: !!batchResult,
    });
  } catch (error) {
    console.error("Error saving patient:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Move the search endpoint BEFORE the /:patientId endpoint
router.get("/search/:patientId", async (req, res) => {
  try {
    console.log("Searching for patient:", req.params.patientId);
    const patient = await Patient.findOne({ patientId: req.params.patientId });

    if (!patient) {
      console.log("Patient not found");
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    console.log("Patient found, decrypting data...");

    // Decrypt all sensitive fields
    const decryptedPatient = {
      ...patient.toObject(),
      patientName: decrypt(patient.patientName),
      age: decrypt(patient.age),
      gender: decrypt(patient.gender),
      clinicalDescription: decrypt(patient.clinicalDescription),
      disease: decrypt(patient.disease),
    };

    console.log("Data decrypted successfully");

    res.json({
      success: true,
      patient: decryptedPatient,
    });
  } catch (error) {
    console.error("Error searching for patient:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Add endpoint to get patient with decrypted data
router.get("/:patientId", async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.params.patientId });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Decrypt patient data
    const decryptedPatient = {
      ...patient.toObject(),
      patientName: decrypt(patient.patientName),
      dateOfBirth: decrypt(patient.dateOfBirth),
      age: decrypt(patient.age),
      gender: decrypt(patient.gender),
      contactNumber: decrypt(patient.contactNumber),
      clinicalDescription: decrypt(patient.clinicalDescription),
      disease: decrypt(patient.disease),
    };

    res.json(decryptedPatient);
  } catch (error) {
    console.error("Error fetching patient:", error);
    res.status(500).json({ message: error.message });
  }
});

// Add this route to your patients router
router.get("/:id", async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.params.id });
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    res.json({
      patientId: patient.patientId,
      patientName: patient.patientName,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      contactNumber: patient.contactNumber,
      // Add any other fields you want to return
    });
  } catch (error) {
    console.error("Error fetching patient:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
