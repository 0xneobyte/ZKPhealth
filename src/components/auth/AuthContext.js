import React, { createContext, useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import { connectWallet, signMessage } from '../../utils/web3';
import { AUTHENTICATION_ABI } from '../../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [contract, setContract] = useState(null);

    useEffect(() => {
        const initContract = async () => {
            try {
                const { provider } = await connectWallet();
                const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
                const authContract = new ethers.Contract(
                    contractAddress,
                    AUTHENTICATION_ABI,
                    provider
                );
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
        try {
            setLoading(true);
            
            // Connect to MetaMask
            const { signer, address } = await connectWallet();
            
            // Check if user is registered
            const isRegistered = await contract.isUserRegistered(address);
            if (!isRegistered) {
                throw new Error('User not registered. Please contact admin.');
            }

            // Get user role from contract
            const role = await contract.getUserRole(address);
            
            // Create a random nonce for signing
            const nonce = Math.floor(Math.random() * 1000000).toString();
            
            // Sign the message
            const signature = await signMessage(
                `Login to Healthcare ZKP System\nNonce: ${nonce}`,
                signer
            );
            
            // Call login function on contract
            const tx = await contract.connect(signer).login();
            await tx.wait();
            
            const userData = {
                address,
                role,
                token: signature // Using signature as token for now
            };
            
            localStorage.setItem('auth_token', userData.token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext); 