import React from 'react';
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import { CircularProgress, Box } from '@mui/material';
import TwoFactorAuth from './components/auth/TwoFactorAuth';

const AppContent = () => {
    const { user, loading, pending2FA, verify2FA } = useAuth();

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (pending2FA) {
        return <TwoFactorAuth onVerify={verify2FA} />;
    }

    return user ? <Dashboard /> : <Login />;
};

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App; 