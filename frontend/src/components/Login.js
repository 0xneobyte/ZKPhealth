import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      setError('');

      if (!window.ethereum) {
        throw new Error('Please install MetaMask!');
      }

      // Request account access
      await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      // Get the network ID
      const networkId = await window.ethereum.request({
        method: 'net_version'
      });

      // Check if we're on the correct network (Ganache = 1337)
      if (networkId !== '1337') {
        throw new Error('Please connect to Ganache network');
      }

      // Get accounts
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      });
      
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      await login(accounts[0]);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>Login with MetaMask</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button 
        onClick={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? 'Connecting...' : 'Connect Wallet'}
      </button>
    </div>
  );
}

export default Login; 