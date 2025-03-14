import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

export const twoFactorService = {
  setup: async (address) => {
    const response = await axios.post(`${API_URL}/2fa/setup`, {
      walletAddress: address,
    });
    return response.data;
  },

  verify: async (address, code) => {
    const response = await axios.post(`${API_URL}/2fa/verify`, {
      walletAddress: address,
      token: code,
    });
    return response.data;
  },

  enable: async (address) => {
    try {
      const response = await axios.post(`${API_URL}/2fa/enable`, {
        walletAddress: address,
      });
      return response.data;
    } catch (error) {
      console.error("Error enabling 2FA:", error);
      // Return an object with success: false to make error handling consistent
      return {
        success: false,
        message:
          error.response?.data?.message || error.message || "Network error",
      };
    }
  },

  is2FAEnabled: async (address) => {
    try {
      const response = await axios.get(`${API_URL}/2fa/status/${address}`);
      return response.data.is2FAEnabled;
    } catch (error) {
      console.error("Error checking 2FA status:", error);
      return false;
    }
  },

  disable: async (walletAddress) => {
    const response = await axios.post(`${API_URL}/2fa/disable`, {
      walletAddress: walletAddress.toLowerCase(),
    });
    return response.data;
  },
};
