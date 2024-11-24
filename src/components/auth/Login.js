import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Box, Button, Typography, Paper, Alert, CircularProgress } from '@mui/material';

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
        <Box 
            sx={{ 
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.50'
            }}
        >
            <Paper 
                elevation={3}
                sx={{ 
                    p: 4, 
                    maxWidth: 400, 
                    width: '100%',
                    textAlign: 'center'
                }}
            >
                <Typography variant="h4" gutterBottom>
                    Healthcare ZKP System
                </Typography>
                
                <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 4 }}>
                    Login with MetaMask
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handleLogin}
                    disabled={isLoading}
                    sx={{ 
                        height: 48,
                        position: 'relative'
                    }}
                >
                    {isLoading ? (
                        <>
                            <CircularProgress 
                                size={24} 
                                sx={{ 
                                    position: 'absolute',
                                    left: 20
                                }}
                            />
                            Connecting...
                        </>
                    ) : (
                        'Connect with MetaMask'
                    )}
                </Button>
            </Paper>
        </Box>
    );
};

export default Login; 