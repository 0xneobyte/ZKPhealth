import React, { createContext, useState, useContext, useEffect } from 'react';
import { connectWallet, signMessage } from '../../utils/web3';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        const token = localStorage.getItem('auth_token');
        if (token) {
            // Verify token and set user
            // This is where you'd typically validate the JWT
            setUser(JSON.parse(localStorage.getItem('user')));
        }
        setLoading(false);
    }, []);

    const login = async () => {
        try {
            setLoading(true);
            
            // Connect to MetaMask
            const { signer, address } = await connectWallet();
            
            // Create a random nonce for signing
            const nonce = Math.floor(Math.random() * 1000000).toString();
            
            // Sign the message
            const signature = await signMessage(
                `Login to Healthcare ZKP System\nNonce: ${nonce}`,
                signer
            );
            
            // Here you would typically send the signature, address, and nonce to your backend
            // The backend would verify the signature and return a JWT
            // For now, we'll simulate this
            
            const userData = {
                address,
                role: 'doctor', // This would come from your smart contract
                token: 'dummy_jwt_token' // This would come from your backend
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