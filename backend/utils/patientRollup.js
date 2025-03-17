const { generateProof } = require("./zkp");

class PatientRollup {
  constructor() {
    this.patientBatch = [];
    this.batchSize = 2; // Temporarily reduced from 10 to 2 for testing
  }

  getCurrentBatchSize() {
    return this.patientBatch.length;
  }

  getBatchSize() {
    return this.batchSize;
  }

  async addToBatch(patientData) {
    this.patientBatch.push({
      ...patientData,
      timestamp: Date.now(),
    });

    if (this.patientBatch.length >= this.batchSize) {
      return await this.processBatch();
    }
    return null;
  }

  async processBatch() {
    try {
      console.log("Processing patient batch:", this.patientBatch.length);

      // Generate batch proof for patient registrations
      const batchProof = Buffer.from(
        `batch_${Date.now()}_${this.patientBatch.length}`
      ).toString("base64");

      const batchResult = {
        timestamp: Date.now(),
        batchProof,
        patients: this.patientBatch.map((patient) => ({
          patientId: patient.patientId,
          registrationTime: patient.timestamp,
        })),
      };

      // Clear batch after processing
      this.patientBatch = [];

      return batchResult;
    } catch (error) {
      console.error("Error processing patient batch:", error);
      throw error;
    }
  }

  async verifyBatch(batchId) {
    try {
      const batch = await PatientBatch.findById(batchId);
      if (!batch) {
        throw new Error("Batch not found");
      }

      console.log("🔍 Verifying patient batch:", {
        batchId,
        patientsCount: batch.patientsCount,
        timestamp: batch.timestamp,
      });

      // Verify batch proof
      const isValid = this.verifyBatchProof(batch.batchProof);

      return {
        isValid,
        details: {
          patientsCount: batch.patientsCount,
          timestamp: batch.timestamp,
          doctorAddress: batch.doctorAddress,
        },
      };
    } catch (error) {
      console.error("Batch verification failed:", error);
      throw error;
    }
  }

  verifyBatchProof(proof) {
    // Verify the batch proof format
    return proof.startsWith("batch_");
  }
}

module.exports = new PatientRollup();
