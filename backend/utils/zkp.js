const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');

class ZKProof {
    static async generateProof(bloodPressure, range) {
        try {
            const input = {
                bloodPressure: bloodPressure,
                minRange: range[0],
                maxRange: range[1]
            };

            const wasmPath = path.join(__dirname, '../circuits/bloodPressureRange.wasm');
            const zkeyPath = path.join(__dirname, '../circuits/bloodPressureRange_0000.zkey');

            console.log('Generating proof with:', input);

            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                input,
                wasmPath,
                zkeyPath
            );

            const isInRange = bloodPressure >= range[0] && bloodPressure <= range[1];

            return {
                proof,
                publicSignals,
                isValid: isInRange
            };
        } catch (error) {
            console.error('Error generating proof:', error);
            throw error;
        }
    }

    static async verifyProof(proofData, publicSignals) {
        try {
            const vKeyPath = path.join(__dirname, '../circuits/verification_key.json');
            const vKey = JSON.parse(fs.readFileSync(vKeyPath));

            const isValid = await snarkjs.groth16.verify(
                vKey,
                publicSignals,
                proofData
            );

            return isValid;
        } catch (error) {
            console.error('Error verifying proof:', error);
            return false;
        }
    }
}

module.exports = ZKProof; 