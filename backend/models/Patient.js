const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    unique: true,
  },
  patientName: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: String,
    required: true,
  },
  age: {
    type: String, // For encrypted data
    required: true,
  },
  gender: {
    type: String,
    required: true,
    // Removed enum validation since we're storing encrypted values
  },
  contactNumber: {
    type: String,
    required: true,
  },
  clinicalDescription: {
    type: String,
    required: true,
  },
  disease: {
    type: String,
    required: true,
  },
  doctorAddress: {
    type: String,
    required: true,
  },
  isEmergency: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Patient", patientSchema);
