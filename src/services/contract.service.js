import { ethers } from "ethers";
import Authentication from "../contracts/Authentication.json";

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
const contractABI = Authentication.abi;

// Initialize with just the interface first
export const getContract = () => {
  if (!window.ethereum) {
    throw new Error("MetaMask not found");
  }

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  return new ethers.Contract(contractAddress, contractABI, provider);
};

// Export a function to get a connected contract instance
export const getConnectedContract = async (signer) => {
  const contract = getContract();
  return contract.connect(signer);
};
