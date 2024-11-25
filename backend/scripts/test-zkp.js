const ZKProof = require('../utils/zkp');

async function testZKP() {
    try {
        console.log("Testing ZKP implementation...\n");

        // Test Case 1: Valid blood pressure (130)
        console.log("Test Case 1: BP = 130 (Should be valid)");
        const result1 = await ZKProof.generateProof(130, [120, 140]);
        console.log("Result:", {
            isValid: result1.isValid,
            hasProof: !!result1.proof
        });

        // Test Case 2: Invalid blood pressure (150)
        console.log("\nTest Case 2: BP = 150 (Should be invalid)");
        const result2 = await ZKProof.generateProof(150, [120, 140]);
        console.log("Result:", {
            isValid: result2.isValid,
            hasProof: !!result2.proof
        });

        // Test verification
        console.log("\nTesting Verification...");
        if (result1.proof) {
            const verified = await ZKProof.verifyProof(result1.proof, result1.publicSignals);
            console.log("Verification of valid proof:", verified);
        }

    } catch (error) {
        console.error("Test failed:", error);
    }
}

testZKP(); 