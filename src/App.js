import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import { CircularProgress, Box } from '@mui/material';
import TwoFactorAuth from './components/auth/TwoFactorAuth';
import InsuranceDashboard from './components/insurance/InsuranceDashboard';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    return children;
};

const RoleBasedRedirect = () => {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" />;
    }

    switch(user.role.toLowerCase()) {
        case 'admin':
            return <Navigate to="/admin" />;
        case 'doctor':
            return <Navigate to="/dashboard" />;
        case 'insurance':
            return <Navigate to="/insurance" />;
        default:
            return <Navigate to="/login" />;
    }
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route 
                        path="/admin" 
                        element={
                            <ProtectedRoute>
                                <AdminDashboard />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/dashboard" 
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/insurance" 
                        element={
                            <ProtectedRoute>
                                <InsuranceDashboard />
                            </ProtectedRoute>
                        } 
                    />
                    <Route path="/" element={<RoleBasedRedirect />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App; 