import React, { useState } from 'react';
import { Button, Container, Paper, Typography, Box, Alert, CircularProgress } from '@mui/material';
import { useAuth } from './AuthContext';

const Login = () => {
    const { login } = useAuth();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (isLoading) return;
        try {
            setIsLoading(true);
            setError('');
            await login();
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Failed to connect wallet');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8 }}>
                <Paper sx={{ p: 4 }}>
                    <Typography variant="h4" align="center" gutterBottom>
                        Healthcare ZKP System
                    </Typography>
                    <Typography variant="h6" align="center" gutterBottom>
                        Login with MetaMask
                    </Typography>
                    
                    {error && (
                        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    
                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleLogin}
                            size="large"
                            disabled={isLoading}
                            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                            {isLoading ? 'Connecting...' : 'Connect Wallet'}
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Login; 