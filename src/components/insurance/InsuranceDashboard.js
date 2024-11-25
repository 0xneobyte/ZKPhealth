import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Button } from '@mui/material';
import { useAuth } from '../auth/AuthContext';

function InsuranceDashboard() {
    const { user, logout } = useAuth();
    const [claims, setClaims] = useState([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchClaims();
    }, []);

    const fetchClaims = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${process.env.REACT_APP_API_URL}/insurance/claims`);
            const data = await response.json();
            setClaims(data);
        } catch (error) {
            setError('Failed to fetch claims');
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const verifyClaim = async (claimId) => {
        try {
            console.log('Verifying claim:', claimId);
            const response = await fetch(`${process.env.REACT_APP_API_URL}/insurance/verify/${claimId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response:', errorText);
                throw new Error(`Server returned ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                alert(data.message);
                await fetchClaims();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Verification error:', error);
            alert(`Failed to verify claim: ${error.message}`);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">
                    Insurance Provider Dashboard
                </Typography>
                <Button 
                    variant="contained" 
                    color="secondary" 
                    onClick={logout}
                >
                    Logout
                </Button>
            </Box>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Profile</Typography>
                <Typography>Address: {user?.address}</Typography>
                <Typography>Role: {user?.role}</Typography>
            </Paper>

            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Claims Verification</Typography>
                {error && (
                    <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
                )}
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    claims.map((claim) => (
                        <Box 
                            key={claim._id} 
                            sx={{ 
                                mb: 2, 
                                p: 2, 
                                bgcolor: 'grey.100',
                                borderRadius: 1
                            }}
                        >
                            <Typography><strong>Patient ID:</strong> {claim.patientId}</Typography>
                            <Typography><strong>Doctor:</strong> {claim.doctorAddress}</Typography>
                            <Typography><strong>Status:</strong> {claim.isEligible ? 
                                <span style={{ color: 'green' }}>Eligible</span> : 
                                <span style={{ color: 'red' }}>Not Eligible</span>
                            }</Typography>
                            <Typography><strong>ZK Proof:</strong> {claim.zkProof}</Typography>
                            <Typography><strong>Date:</strong> {new Date(claim.timestamp).toLocaleString()}</Typography>
                            <Button 
                                variant="contained" 
                                color="primary"
                                onClick={() => verifyClaim(claim._id)}
                                sx={{ mt: 1 }}
                            >
                                Verify Proof
                            </Button>
                        </Box>
                    ))
                )}
            </Paper>
        </Box>
    );
}

export default InsuranceDashboard; 