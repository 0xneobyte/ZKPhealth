import { verifyTOTP } from '../utils/totp';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const verifyTOTPCode = async (address, code, secret) => {
    try {
        console.log('Verifying code:', code, 'for address:', address);
        
        // First verify locally
        const isValid = verifyTOTP(code, secret);
        console.log('Local verification result:', isValid);
        
        if (!isValid) {
            throw new Error('Invalid 2FA code');
        }

        // Then verify with backend
        const response = await fetch(`${API_URL}/auth/verify2fa`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                walletAddress: address,
                code,
                totpSecret: secret
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Backend verification error:', error);
            throw new Error(error.message || 'Verification failed');
        }

        const result = await response.json();
        console.log('Backend verification result:', result);

        return true;
    } catch (error) {
        console.error('TOTP verification error:', error);
        throw error;
    }
};

export const storeTOTPSecret = async (address, secret) => {
    console.log('Storing TOTP secret for:', address);
    
    // Store locally first
    const secrets = JSON.parse(localStorage.getItem('totp_secrets') || '{}');
    secrets[address.toLowerCase()] = secret;  // Make sure to use lowercase address
    localStorage.setItem('totp_secrets', JSON.stringify(secrets));
    console.log('Stored secret in localStorage:', secret);

    // Store in backend
    const response = await fetch(`${API_URL}/auth/enable2fa`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            walletAddress: address.toLowerCase(),
            totpSecret: secret
        })
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('Error storing secret in backend:', error);
        throw new Error(error.message);
    }
    console.log('Stored secret in backend');
};

export const getTOTPSecret = async (address) => {
    console.log('Getting TOTP secret for:', address);
    
    // First try localStorage with lowercase address
    const secrets = JSON.parse(localStorage.getItem('totp_secrets') || '{}');
    const localSecret = secrets[address.toLowerCase()];
    
    if (localSecret) {
        console.log('Found secret in localStorage:', localSecret);
        return localSecret;
    }
    
    // If not in localStorage, try to get from backend
    try {
        const response = await fetch(`${API_URL}/auth/users/${address.toLowerCase()}/totp-secret`);
        if (!response.ok) {
            throw new Error('Failed to fetch TOTP secret');
        }
        
        const { secret } = await response.json();
        if (!secret) {
            throw new Error('No TOTP secret found in database');
        }
        
        // Store in localStorage for future use
        secrets[address.toLowerCase()] = secret;
        localStorage.setItem('totp_secrets', JSON.stringify(secrets));
        
        console.log('Retrieved and stored secret from backend');
        return secret;
    } catch (error) {
        console.error('Error getting TOTP secret:', error);
        throw error;
    }
}; 