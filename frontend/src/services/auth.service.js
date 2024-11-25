import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const setup2FA = async (walletAddress) => {
  try {
    // First, get the QR code and secret
    const response = await axios.post(`${API_URL}/2fa/setup`, {
      walletAddress
    });

    if (response.data.success) {
      // Store secret temporarily in localStorage
      localStorage.setItem('temp2FASecret', response.data.secret);
    }

    return response.data;
  } catch (error) {
    console.error('2FA Setup error:', error);
    throw error;
  }
};

const verify2FA = async (walletAddress, token) => {
  try {
    const response = await axios.post(`${API_URL}/2fa/verify`, {
      walletAddress,
      token
    });

    if (response.data.success) {
      // Clear temporary secret after successful verification
      localStorage.removeItem('temp2FASecret');
    }

    return response.data;
  } catch (error) {
    console.error('2FA Verification error:', error);
    throw error;
  }
};

// Add updateUser function
const updateUser = async (walletAddress, data) => {
  try {
    const response = await axios.patch(`${API_URL}/auth/users/${walletAddress}`, data);
    return response.data;
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
};

export const authService = {
  setup2FA,
  verify2FA,
  updateUser
}; 