import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Button,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";

function AdminDashboard() {
  const { user, logout } = useAuth();
  console.log("AdminDashboard - User:", user);
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
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
      setIsLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL;

      // First check if the server is running
      try {
        const healthCheck = await fetch(`${apiUrl}/health`, {
          credentials: "include",
        });
        if (!healthCheck.ok) {
          throw new Error("Backend server is not running");
        }
      } catch (error) {
        throw new Error(
          `Cannot connect to server at ${apiUrl}. Is it running?`
        );
      }

      console.log("Fetching users from:", `${apiUrl}/auth/users`);
      const response = await fetch(`${apiUrl}/auth/users`, {
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            "Users endpoint not found. Check your backend routes."
          );
        }
        const errorData = await response.text();
        console.error("Server response:", errorData);
        throw new Error(`Server returned ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      console.log("Fetched users:", data);
      setUsers(data);
      setError("");
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(`Failed to fetch users: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Admin Dashboard</Typography>
        <Button variant="contained" color="secondary" onClick={logout}>
          Logout
        </Button>
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Profile" />
        <Tab label="View Users" />
      </Tabs>

      {tabValue === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Profile
          </Typography>
          <Typography>Address: {user?.address}</Typography>
          <Typography>Role: {user?.role}</Typography>
        </Paper>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            All Users
          </Typography>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            users.map((user) => (
              <Box
                key={user._id}
                sx={{
                  mb: 2,
                  p: 2,
                  bgcolor: "grey.100",
                  borderRadius: 1,
                  "&:hover": {
                    bgcolor: "grey.200",
                  },
                }}
              >
                <Typography>
                  <strong>Address:</strong> {user.walletAddress}
                </Typography>
                <Typography>
                  <strong>Role:</strong> {user.role}
                </Typography>
                <Typography>
                  <strong>2FA Enabled:</strong>{" "}
                  {user.is2FAEnabled ? "Yes" : "No"}
                </Typography>
              </Box>
            ))
          )}
        </Paper>
      )}
    </Box>
  );
}

export default AdminDashboard;
