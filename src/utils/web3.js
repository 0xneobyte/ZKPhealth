import { ethers } from "ethers";

export const connectWallet = async () => {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask not found");
    }

    await window.ethereum.request({
      method: "eth_requestAccounts",
      params: [],
    });

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    const signer = provider.getSigner();
    const address = await signer.getAddress();

    return { signer, address };
  } catch (error) {
    console.error("Wallet connection error:", error);
    throw error;
  }
};

export const signMessage = async (message, signer) => {
  try {
    const signature = await signer.signMessage(message);
    return signature;
  } catch (error) {
    console.error("Error signing message:", error);
    throw error;
  }
};
