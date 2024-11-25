import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempAddress, setTempAddress] = useState(null);
  const navigate = useNavigate();

  const login = async (address) => {
    try {
      console.log('Starting login process...');
      
      const response = await axios.post('http://localhost:3001/auth/login', { 
        address: address.toLowerCase() 
      });

      if (response.data.requires2FA) {
        setTempAddress(address);
        setRequires2FA(true);
        navigate('/verify-2fa');
        return;
      }

      // Store JWT token
      localStorage.setItem('token', response.data.token);
      
      setUser({
        address: address.toLowerCase(),
        role: response.data.user.role
      });
      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const verify2FA = async (code) => {
    try {
      const response = await axios.post('http://localhost:3001/auth/verify2fa', {
        address: tempAddress,
        code
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        setIsAuthenticated(true);
        setRequires2FA(false);
        setTempAddress(null);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    setRequires2FA(false);
    setTempAddress(null);
    navigate('/login');
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          logout();
        }
      });

      window.ethereum.on('chainChanged', () => {
        // Network changed, refresh the page
        window.location.reload();
      });

      window.ethereum.on('disconnect', () => {
        logout();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      requires2FA,
      login, 
      logout,
      verify2FA 
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 