import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, Alert, TextField, Paper } from '@mui/material';
import { useAuth } from '../auth/AuthContext';
import PatientForm from '../patients/PatientForm';
import PatientSearch from '../patients/PatientSearch';  // Add this import
import { connectWallet } from '../../utils/web3';
import { generateSecret, getQRCodeUrl, generateBackupCode } from '../../utils/totp';
import { storeTOTPSecret } from '../../services/auth.service';
import { ethers } from 'ethers';
import QRCode from 'qrcode.react';

const Dashboard = () => {
    const { user, logout, contract } = useAuth();
    const [tabValue, setTabValue] = useState(0);
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [open2FADialog, setOpen2FADialog] = useState(false);
    const [qrUrl, setQrUrl] = useState('');
    const [error, setError] = useState('');
    const [backupCode, setBackupCode] = useState('');
    const [patientId, setPatientId] = useState('');
    const [bloodPressure, setBloodPressure] = useState('');
    const [claimStatus, setClaimStatus] = useState('');

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    useEffect(() => {
        const check2FAStatus = async () => {
            try {
                if (contract && user) {
                    const enabled = await contract.is2FAEnabled(user.address);
                    setIs2FAEnabled(enabled);
                }
            } catch (err) {
                console.error('Error checking 2FA status:', err);
            }
        };
        check2FAStatus();
    }, [contract, user]);

    const handle2FASetup = async () => {
        try {
            setError('');
            if (!contract) {
                throw new Error('Contract not initialized');
            }

            const { signer, address } = await connectWallet();
            const connectedContract = contract.connect(signer);

            // Generate TOTP secret and backup code
            const totpSecret = generateSecret();
            const backup = generateBackupCode();
            setBackupCode(backup);
            
            const url = getQRCodeUrl(totpSecret, address);
            setQrUrl(url);
            
            const hashedSecret = ethers.utils.keccak256(
                ethers.utils.toUtf8Bytes(totpSecret)
            );
            
            // Store both secret and backup code
            await storeTOTPSecret(address, totpSecret, backup);
            
            const tx = await connectedContract.enable2FA(hashedSecret, {
                from: address,
                gasLimit: 100000
            });
            await tx.wait();
            
            setIs2FAEnabled(true);
            setOpen2FADialog(true);
        } catch (error) {
            console.error('Error setting up 2FA:', error);
            setError(error.message || 'Failed to set up 2FA');
        }
    };

    const submitClaim = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/insurance/verify-eligibility`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    patientId,
                    doctorAddress: user.address,
                    insuranceAddress: '0x3935cb7ed81d896ebd77f4c3bf03587963b6c4f8', // Your insurance provider address
                    bloodPressure
                })
            });

            const data = await response.json();
            setClaimStatus(data.message);
            
            // Clear form
            setPatientId('');
            setBloodPressure('');
        } catch (error) {
            setClaimStatus('Error submitting claim');
            console.error('Error:', error);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">
                    Welcome, {user?.role === 'doctor' ? 'Doctor' : 'Patient'}
                </Typography>
                <Button 
                    variant="contained" 
                    color="secondary" 
                    onClick={logout}
                >
                    Logout
                </Button>
            </Box>

            {user?.role === 'doctor' ? (
                <>
                    <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
                        <Tab label="Profile" />
                        <Tab label="Register Patient" />
                        <Tab label="Search Patient" />
                    </Tabs>

                    {tabValue === 0 ? (
                        <Box>
                            <Typography variant="body1" gutterBottom>
                                Address: {user?.address}
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                                Role: {user?.role}
                            </Typography>
                            <Button 
                                variant="contained" 
                                color="primary" 
                                onClick={handle2FASetup}
                                disabled={is2FAEnabled}
                                sx={{ mt: 2 }}
                            >
                                {is2FAEnabled ? '2FA Enabled' : 'Enable 2FA'}
                            </Button>
                        </Box>
                    ) : tabValue === 1 ? (
                        <PatientForm />
                    ) : (
                        <PatientSearch />
                    )}
                </>
            ) : (
                <Typography>
                    Access Denied. Only doctors can access this page.
                </Typography>
            )}

            <Dialog 
                open={open2FADialog} 
                onClose={() => setOpen2FADialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
                <DialogContent>
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography gutterBottom>
                            1. Install Google Authenticator or any TOTP-compatible app
                        </Typography>
                        <Typography gutterBottom>
                            2. Scan this QR code with your authenticator app
                        </Typography>
                        
                        {qrUrl && (
                            <Box sx={{ my: 3 }}>
                                <QRCode value={qrUrl} size={256} />
                            </Box>
                        )}
                        
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            Important: Save your backup code: {backupCode}
                        </Alert>
                        <Typography variant="caption">
                            Store this backup code securely. You'll need it if you lose access to your authenticator app.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen2FADialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom>Submit Insurance Claim</Typography>
                <form onSubmit={submitClaim}>
                    <TextField
                        fullWidth
                        label="Patient ID"
                        value={patientId}
                        onChange={(e) => setPatientId(e.target.value)}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        label="Blood Pressure (Systolic)"
                        type="number"
                        value={bloodPressure}
                        onChange={(e) => setBloodPressure(e.target.value)}
                        margin="normal"
                        required
                    />
                    <Button 
                        type="submit" 
                        variant="contained" 
                        color="primary"
                        sx={{ mt: 2 }}
                    >
                        Submit Claim
                    </Button>
                </form>
                {claimStatus && (
                    <Typography 
                        sx={{ mt: 2 }} 
                        color={claimStatus.includes('qualifies') ? 'success.main' : 'error.main'}
                    >
                        {claimStatus}
                    </Typography>
                )}
            </Paper>
        </Box>
    );
};

export default Dashboard;