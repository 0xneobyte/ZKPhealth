const mongoose = require("mongoose");

const patientBatchSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  doctorAddress: {
    type: String,
    required: true,
  },
  patientsCount: {
    type: Number,
    required: true,
  },
  batchProof: {
    type: String,
    required: true,
  },
  patients: [
    {
      patientId: String,
      registrationTime: Date,
    },
  ],
  isEmergency: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("PatientBatch", patientBatchSchema);
