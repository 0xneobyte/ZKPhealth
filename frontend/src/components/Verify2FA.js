import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function Verify2FA() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const { verify2FA } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await verify2FA(code);
    } catch (error) {
      setError(error.message || 'Invalid code');
    }
  };

  return (
    <div>
      <h2>Enter 2FA Code</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter 6-digit code"
          maxLength="6"
          pattern="[0-9]{6}"
          required
        />
        <button type="submit">Verify</button>
      </form>
    </div>
  );
}

export default Verify2FA; 