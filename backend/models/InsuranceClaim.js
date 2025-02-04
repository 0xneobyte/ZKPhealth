const mongoose = require("mongoose");

const insuranceClaimSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
  },
  doctorAddress: {
    type: String,
    required: true,
  },
  policyNumber: {
    type: String,
    required: true,
  },
  insuranceProvider: {
    type: String,
    required: true,
  },
  claimType: {
    type: String,
    required: true,
    enum: ["inpatient", "outpatient", "daycare"],
  },
  admissionDate: {
    type: Date,
    required: true,
  },
  dischargeDate: {
    type: Date,
    required: true,
  },
  diagnosis: {
    type: String,
    required: true,
  },
  treatmentCost: {
    type: Number,
    required: true,
  },
  roomCharges: {
    type: Number,
    required: true,
  },
  medicationCharges: {
    type: Number,
    required: true,
  },
  consultationFees: {
    type: Number,
    required: true,
  },
  labTestCharges: {
    type: Number,
    required: true,
  },
  totalCost: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Export the model
const InsuranceClaim = mongoose.model("InsuranceClaim", insuranceClaimSchema);
module.exports = InsuranceClaim;
