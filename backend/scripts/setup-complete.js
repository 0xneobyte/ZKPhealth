const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const https = require('https');

async function downloadPowersOfTau() {
    const file = fs.createWriteStream("circuits/pot12_final.ptau");
    return new Promise((resolve, reject) => {
        https.get("https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau", (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink("circuits/pot12_final.ptau");
            reject(err);
        });
    });
}

async function main() {
    try {
        // Ensure circuits directory exists
        if (!fs.existsSync('circuits')) {
            fs.mkdirSync('circuits');
        }

        // Check if circom is installed
        try {
            execSync("circom --version");
            console.log("✓ Circom is installed");
        } catch (error) {
            console.error("❌ Circom is not installed. Please install it first:");
            console.error("npm install -g circom");
            process.exit(1);
        }

        console.log("1. Compiling circuit...");
        try {
            // Create a temporary directory for compilation
            const circuitDir = path.join(__dirname, '../circuits');
            execSync(`circom ${circuitDir}/bloodPressureRange.circom --r1cs --wasm --sym`, { 
                cwd: circuitDir,
                stdio: 'inherit' 
            });
            console.log("✓ Circuit compiled");
        } catch (error) {
            console.error("❌ Circuit compilation failed");
            process.exit(1);
        }

        console.log("\n2. Getting Powers of Tau file...");
        if (!fs.existsSync("circuits/pot12_final.ptau")) {
            console.log("Downloading Powers of Tau file...");
            await downloadPowersOfTau();
        }
        console.log("✓ Powers of Tau file ready");

        console.log("\n3. Generating zKey...");
        const circuitDir = path.join(__dirname, '../circuits');
        await snarkjs.zKey.newZKey(
            path.join(circuitDir, 'bloodPressureRange.r1cs'),
            path.join(circuitDir, 'pot12_final.ptau'),
            path.join(circuitDir, 'bloodPressureRange_0000.zkey')
        );
        console.log("✓ zKey generated");

        console.log("\n4. Exporting verification key...");
        const vKey = await snarkjs.zKey.exportVerificationKey(
            path.join(circuitDir, 'bloodPressureRange_0000.zkey')
        );
        fs.writeFileSync(
            path.join(circuitDir, 'verification_key.json'),
            JSON.stringify(vKey, null, 2)
        );
        console.log("✓ Verification key exported");

        console.log("\nSetup completed successfully! 🎉");
    } catch (error) {
        console.error("Error during setup:", error);
        process.exit(1);
    }
}

main().then(() => process.exit(0)); 