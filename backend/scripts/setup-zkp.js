const snarkjs = require("snarkjs");
const fs = require("fs");

async function setup() {
    // Compile circuit
    console.log("Compiling circuit...");
    await exec("circom circuits/bloodPressureRange.circom --r1cs --wasm");

    // Generate zkey
    console.log("Generating zkey...");
    const { zKey } = await snarkjs.zKey.newZKey(
        "bloodPressureRange.r1cs",
        "pot12_final.ptau",
        "bloodPressureRange_0000.zkey"
    );

    // Export verification key
    console.log("Exporting verification key...");
    const vKey = await snarkjs.zKey.exportVerificationKey(zKey);
    fs.writeFileSync(
        "circuits/verification_key.json",
        JSON.stringify(vKey, null, 2)
    );

    console.log("Setup complete!");
}

setup().catch(console.error); 