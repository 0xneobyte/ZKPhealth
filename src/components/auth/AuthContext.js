import React, { createContext, useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import { connectWallet, signMessage } from '../../utils/web3';
import { AUTHENTICATION_ABI } from '../../utils/constants';
import { authenticator } from 'otplib';

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
            
            // First connect wallet and get signer
            const { signer, address } = await connectWallet();
            console.log('Connected wallet:', address);
            
            // Connect contract with signer
            const connectedContract = contract.connect(signer);
            
            // Check contract first
            const isRegistered = await connectedContract.isUserRegistered(address);
            console.log('Is registered:', isRegistered);
            
            if (!isRegistered) {
                throw new Error('User not registered. Please contact admin.');
            }

            const role = await connectedContract.getUserRole(address);
            console.log('User role:', role);

            // Call initiateLogin
            console.log('Initiating login...');
            const tx = await connectedContract.initiateLogin();
            await tx.wait();
            console.log('Login initiated');

            // Check 2FA status
            const is2FAEnabled = await connectedContract.is2FAEnabled(address);
            console.log('2FA enabled:', is2FAEnabled);

            if (is2FAEnabled) {
                setPending2FA(true);
            } else {
                await completeLogin(address, role, signer);
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
            console.log('Starting 2FA verification for code:', code);
            
            const { signer, address } = await connectWallet();
            console.log('Connected wallet:', address);

            // Get the stored TOTP secret from localStorage
            const secrets = JSON.parse(localStorage.getItem('totp_secrets') || '{}');
            const secret = secrets[address.toLowerCase()];
            console.log('Found stored secret:', !!secret);

            if (!secret) {
                throw new Error('2FA secret not found. Please set up 2FA again.');
            }

            // Verify locally using otplib
            const isValid = authenticator.verify({
                token: code,
                secret: secret
            });
            console.log('Local verification result:', isValid);

            if (!isValid) {
                throw new Error('Invalid 2FA code');
            }
            
            // Complete login on contract
            const signerContract = contract.connect(signer);
            console.log('Completing 2FA login on contract');
            
            const tx = await signerContract.complete2FALogin(code, {
                from: address,
                gasLimit: 100000
            });
            await tx.wait();
            console.log('Contract 2FA login completed');

            const role = await contract.getUserRole(address);
            await completeLogin(address, role, signer);
            setPending2FA(false);
            
        } catch (error) {
            console.error('2FA verification error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const completeLogin = async (address, role, signer) => {
        try {
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

            // Don't update is2FAEnabled status, just update role if needed
            const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/users/${address}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    role: role
                })
            });

            if (!response.ok) {
                console.error('Failed to update MongoDB record');
            } else {
                console.log('MongoDB record updated');
            }
            
            localStorage.setItem('auth_token', userData.token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
        } catch (error) {
            console.error('Error in completeLogin:', error);
        }
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
            verify2FA,
            contract 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext); 