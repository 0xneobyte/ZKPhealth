import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useAuth } from '../auth/AuthContext';

const Dashboard = () => {
    const { user, logout } = useAuth();

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Welcome, Doctor
            </Typography>
            <Typography variant="body1" gutterBottom>
                Address: {user?.address}
            </Typography>
            <Typography variant="body1" gutterBottom>
                Role: {user?.role}
            </Typography>
            <Button 
                variant="contained" 
                color="secondary" 
                onClick={logout}
                sx={{ mt: 2 }}
            >
                Logout
            </Button>
        </Box>
    );
};

export default Dashboard; 