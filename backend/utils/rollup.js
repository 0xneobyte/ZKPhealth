const { generateProof } = require('./zkp');

class ZKRollup {
    constructor() {
        this.batch = [];
        this.batchSize = 5; // Process 5 claims at a time
    }

    async addToBatch(claim) {
        this.batch.push(claim);
        
        // Process batch when it reaches batchSize
        if (this.batch.length >= this.batchSize) {
            return await this.processBatch();
        }
        return null;
    }

    async processBatch() {
        try {
            console.log('Processing batch of claims:', this.batch.length);

            // Generate aggregate proof for all claims in batch
            const batchProofs = await Promise.all(
                this.batch.map(claim => 
                    generateProof(claim.bloodPressure, [120, 140])
                )
            );

            // Create batch proof
            const batchResult = {
                timestamp: Date.now(),
                proofs: batchProofs,
                claims: this.batch.map(claim => ({
                    patientId: claim.patientId,
                    isEligible: claim.bloodPressure >= 120 && claim.bloodPressure <= 140
                }))
            };

            // Clear batch after processing
            this.batch = [];
            
            return batchResult;
        } catch (error) {
            console.error('Error processing batch:', error);
            throw error;
        }
    }
}

module.exports = new ZKRollup(); 