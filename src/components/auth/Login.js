import React, { useState } from 'react';
import { Button, Container, Paper, Typography, Box } from '@mui/material';
import { useAuth } from './AuthContext';

const Login = () => {
    const { login } = useAuth();
    const [error, setError] = useState('');

    const handleLogin = async () => {
        try {
            setError('');
            await login();
        } catch (err) {
            setError(err.message);
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
                    
                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleLogin}
                            size="large"
                        >
                            Connect Wallet
                        </Button>
                    </Box>
                    
                    {error && (
                        <Typography color="error" align="center" sx={{ mt: 2 }}>
                            {error}
                        </Typography>
                    )}
                </Paper>
            </Box>
        </Container>
    );
};

export default Login; 