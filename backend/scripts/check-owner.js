const ethers = require("ethers");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Add owner() function to ABI
const CONTRACT_ABI = [
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
];

async function checkOwner() {
  try {
    const provider = new ethers.providers.JsonRpcProvider(
      process.env.RPC_URL || "http://localhost:7545"
    );

    const contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      CONTRACT_ABI,
      provider
    );

    const owner = await contract.owner();
    console.log("Contract owner:", owner);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

checkOwner();
