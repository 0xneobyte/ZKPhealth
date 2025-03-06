import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Box, Button, Typography, Container, Alert } from "@mui/material";

const Login = () => {
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setError("");
      setLoading(true);
      console.log("Initiating login...");
      await login();
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h4" gutterBottom>
          Healthcare ZKP System
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Login with MetaMask
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          color="primary"
          onClick={handleLogin}
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? "Connecting..." : "Connect Wallet"}
        </Button>
      </Box>
    </Container>
  );
};

export default Login;
