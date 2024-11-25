import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (address) => {
    try {
      console.log('Starting login process...');
      console.log('Connected wallet:', address);

      // Call backend first to get/create user and role
      const response = await axios.post('http://localhost:3001/auth/login', { 
        address: address.toLowerCase() 
      });
      
      if (response.data.success) {
        const user = response.data.user;
        console.log('User role:', user.role);
        
        setUser({
          address: address.toLowerCase(),
          role: user.role
        });
        setIsAuthenticated(true);
        return true;
      }
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}; 