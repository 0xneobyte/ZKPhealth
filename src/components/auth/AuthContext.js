import React, { createContext, useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import { connectWallet, signMessage } from '../../utils/web3';
import { AUTHENTICATION_ABI } from '../../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [contract, setContract] = useState(null);
    const [pending2FA, setPending2FA] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    useEffect(() => {
        const initContract = async () => {
            try {
                const { provider } = await connectWallet();
                const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
                console.log('Contract Address:', contractAddress);
                
                if (!contractAddress) {
                    throw new Error('Contract address not found in environment variables');
                }

                const authContract = new ethers.Contract(
                    contractAddress,
                    AUTHENTICATION_ABI,
                    provider
                );
                console.log('Contract initialized:', authContract);
                setContract(authContract);
            } catch (error) {
                console.error('Error initializing contract:', error);
            }
        };

        initContract();
        
        // Check if user is already logged in
        const token = localStorage.getItem('auth_token');
        if (token) {
            setUser(JSON.parse(localStorage.getItem('user')));
        }
        setLoading(false);
    }, []);

    const login = async () => {
        if (isLoggingIn) return;
        try {
            setIsLoggingIn(true);
            setLoading(true);
            console.log('Starting login process...');
            
            if (!contract) {
                throw new Error('Contract not initialized');
            }

            const { signer, address } = await connectWallet();
            console.log('Connected wallet address:', address);
            
            // Debug contract state
            console.log('Contract address:', contract.address);
            
            try {
                const isRegistered = await contract.isUserRegistered(address);
                console.log('Is user registered:', isRegistered);
                
                if (!isRegistered) {
                    throw new Error('User not registered. Please contact admin.');
                }

                const role = await contract.getUserRole(address);
                console.log('User role:', role);

                // Call initiateLogin with explicit signer
                const signerContract = contract.connect(signer);
                console.log('Calling initiateLogin...');
                
                // Add gas limit to the transaction
                const tx = await signerContract.initiateLogin({
                    from: address,
                    gasLimit: 100000
                });
                
                console.log('InitiateLogin transaction:', tx);
                const receipt = await tx.wait();
                console.log('Transaction receipt:', receipt);

                await completeLogin(address, role, signer);
                
            } catch (error) {
                console.error('Error during login process:', error);
                if (error.code === 'ACTION_REJECTED') {
                    throw new Error('Transaction was rejected by user');
                }
                throw new Error('Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setLoading(false);
            setIsLoggingIn(false);
        }
    };

    const verify2FA = async (code) => {
        try {
            setLoading(true);
            
            const { signer, address } = await connectWallet();
            
            // Complete 2FA login on contract
            const tx = await contract.connect(signer).complete2FALogin(code);
            await tx.wait();

            const role = await contract.getUserRole(address);
            
            completeLogin(address, role, signer);
            setPending2FA(false);
            
        } catch (error) {
            console.error('2FA verification error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const completeLogin = async (address, role, signer) => {
        const nonce = Math.floor(Math.random() * 1000000).toString();
        const signature = await signMessage(
            `Login to Healthcare ZKP System\nNonce: ${nonce}`,
            signer
        );
        
        const userData = {
            address,
            role,
            token: signature
        };
        
        localStorage.setItem('auth_token', userData.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            login, 
            logout, 
            loading,
            pending2FA,
            verify2FA 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext); 