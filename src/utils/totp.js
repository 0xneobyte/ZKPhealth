import { authenticator } from 'otplib';
import { Buffer } from 'buffer';

// Configure TOTP settings
authenticator.options = {
    window: 1,        // Allow 1 step before/after current time
    step: 30,         // 30-second step
    digits: 6         // 6-digit code
};

export const generateSecret = () => {
    return authenticator.generateSecret();  // Generate a random secret
};

export const generateTOTP = (secret) => {
    return authenticator.generate(secret);
};

export const verifyTOTP = (token, secret) => {
    return authenticator.verify({ token, secret });
};

export const getQRCodeUrl = (secret, email) => {
    return authenticator.keyuri(
        email,
        'Healthcare ZKP System',
        secret
    );
};

export const generateBackupCode = () => {
    // Generate a random 16-character backup code
    const bytes = Buffer.from(crypto.getRandomValues(new Uint8Array(8)));
    return bytes.toString('hex').toUpperCase();
}; 