import detectEthereumProvider from '@metamask/detect-provider';
import { ethers } from 'ethers';

export const connectWallet = async () => {
    try {
        const provider = await detectEthereumProvider();
        
        if (!provider) {
            throw new Error('Please install MetaMask!');
        }

        // Request account access
        await provider.request({ method: 'eth_requestAccounts' });
        
        const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = ethersProvider.getSigner();
        const address = await signer.getAddress();
        
        return { provider: ethersProvider, signer, address };
    } catch (error) {
        console.error('Error connecting to wallet:', error);
        throw error;
    }
};

export const signMessage = async (message, signer) => {
    try {
        const signature = await signer.signMessage(message);
        return signature;
    } catch (error) {
        console.error('Error signing message:', error);
        throw error;
    }
}; 