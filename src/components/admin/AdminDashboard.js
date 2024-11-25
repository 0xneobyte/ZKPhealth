import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, Paper, TextField, Button, MenuItem } from '@mui/material';
import { useAuth } from '../auth/AuthContext';
import Web3 from 'web3';

function AdminDashboard() {
  const { user, contract } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [newUserRole, setNewUserRole] = useState('');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Fetch all users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/auth/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      
      // Find next unused account
      const usedAddresses = users.map(user => user.walletAddress.toLowerCase());
      const nextAccount = accounts.find(account => 
        !usedAddresses.includes(account.toLowerCase())
      );

      if (!nextAccount) {
        throw new Error('No available Ganache accounts');
      }

      // Register in smart contract
      const tx = await contract.registerUser(nextAccount, newUserRole);
      await tx.wait();

      // Register in MongoDB
      const response = await fetch('http://localhost:3001/auth/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress: nextAccount,
          role: newUserRole,
          is2FAEnabled: false
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create user in database');
      }

      setSuccess(`User registered successfully! Wallet address: ${nextAccount}`);
      setNewUserRole('');
      fetchUsers(); // Refresh users list
    } catch (error) {
      console.error('Error adding user:', error);
      setError(error.message || 'Failed to add user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Profile" />
        <Tab label="Add User" />
        <Tab label="View Users" />
      </Tabs>

      {tabValue === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Profile</Typography>
          <Typography>Address: {user?.address}</Typography>
          <Typography>Role: {user?.role}</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 2 }}
            disabled={true} // 2FA functionality to be implemented later
          >
            Enable 2FA
          </Button>
        </Paper>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Add New User</Typography>
          {error && <Typography color="error">{error}</Typography>}
          {success && <Typography color="success.main">{success}</Typography>}
          
          <form onSubmit={handleAddUser}>
            <TextField
              select
              fullWidth
              label="Role"
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="doctor">Doctor</MenuItem>
              <MenuItem value="insurance">Insurance Provider</MenuItem>
            </TextField>
            
            <Button 
              type="submit" 
              variant="contained" 
              disabled={isLoading || !newUserRole}
            >
              {isLoading ? 'Adding...' : 'Add User'}
            </Button>
          </form>
        </Paper>
      )}

      {tabValue === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>All Users</Typography>
          {users.map((user, index) => (
            <Box key={user._id} sx={{ mb: 2, p: 2, bgcolor: 'grey.100' }}>
              <Typography>Address: {user.walletAddress}</Typography>
              <Typography>Role: {user.role}</Typography>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
}

export default AdminDashboard; 