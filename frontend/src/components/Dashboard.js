import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';
import Modal from 'react-modal';

// Set Modal app element
Modal.setAppElement('#root');

function Dashboard() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');

  const handle2FASetup = async () => {
    try {
      setError('');
      const response = await authService.setup2FA(user.address);
      
      if (response.success) {
        setQrCode(response.qrCode);
        setSecret(response.secret);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      setError('Failed to set up 2FA. Please try again.');
    }
  };

  const handleVerify = async () => {
    try {
      setError('');
      const response = await authService.verify2FA(user.address, verificationCode);
      
      if (response.success) {
        alert('2FA enabled successfully!');
        setShowModal(false);
        // Optionally refresh user data here
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      setError('Invalid verification code. Please try again.');
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.role}!</p>
      <p>Address: {user.address}</p>
      
      <button onClick={handle2FASetup}>Enable 2FA</button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <Modal
        isOpen={showModal}
        onRequestClose={() => setShowModal(false)}
        contentLabel="2FA Setup"
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '20px',
            maxWidth: '500px'
          }
        }}
      >
        <h2>Set up Two-Factor Authentication</h2>
        <p>1. Scan this QR code with your authenticator app:</p>
        {qrCode && <img src={qrCode} alt="2FA QR Code" style={{ maxWidth: '100%' }} />}
        
        <p>2. Or enter this code manually in your authenticator app:</p>
        <code style={{ display: 'block', padding: '10px', background: '#f5f5f5' }}>
          {secret}
        </code>
        
        <p>3. Enter the verification code from your authenticator app:</p>
        <div style={{ marginTop: '20px' }}>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Enter 6-digit code"
            style={{ padding: '5px', marginRight: '10px' }}
          />
          <button onClick={handleVerify}>Verify</button>
        </div>
        
        <button 
          onClick={() => setShowModal(false)}
          style={{ marginTop: '20px' }}
        >
          Close
        </button>
      </Modal>
    </div>
  );
}

export default Dashboard; 