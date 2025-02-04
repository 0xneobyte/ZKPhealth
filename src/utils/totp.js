import { authenticator } from "otplib";
import { twoFactorService } from "../services/twoFactor.service";

// Configure TOTP settings
authenticator.options = {
  window: 1, // Allow 1 step before/after current time
  step: 30, // 30-second step
  digits: 6, // 6-digit code
};

export const generateSecret = () => {
  return authenticator.generateSecret(); // Generate a random secret
};

export const generateTOTP = (secret) => {
  return authenticator.generate(secret);
};

export const verifyTOTP = (token, secret) => {
  return authenticator.verify({ token, secret });
};

export const getQRCodeUrl = (secret, email) => {
  return authenticator.keyuri(email, "Healthcare ZKP System", secret);
};

export const generateBackupCode = () => {
  const length = 16;
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const storeTOTPSecret = async (address, secret) => {
  try {
    // Use the new 2FA service instead of direct API call
    const response = await twoFactorService.setup(address);
    if (response.success) {
      localStorage.setItem("temp2FASecret", response.secret);
      return response;
    }
    throw new Error("Failed to store TOTP secret");
  } catch (error) {
    console.error("Error storing TOTP secret:", error);
    throw error;
  }
};
