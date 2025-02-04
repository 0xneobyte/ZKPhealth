import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  Alert,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";

const Verify2FA = ({ open, onClose }) => {
  const { verify2FA, loading } = useAuth();
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");

  const handleVerify = async () => {
    try {
      if (verificationCode.length !== 6) {
        setError("Please enter a 6-digit code");
        return;
      }
      setError("");
      await verify2FA(verificationCode);
    } catch (error) {
      console.error("2FA verification failed:", error);
      setError(error.message || "Invalid verification code");
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Two-Factor Authentication Required</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Typography variant="body1" gutterBottom>
          Enter the 6-digit code from your authenticator app:
        </Typography>
        <Box sx={{ mt: 1 }}>
          <input
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "16px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              boxSizing: "border-box",
            }}
            value={verificationCode}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
              setVerificationCode(value);
            }}
            placeholder="Enter 6-digit code"
            type="tel"
            pattern="[0-9]*"
            inputMode="numeric"
            autoComplete="off"
            disabled={loading}
          />
        </Box>
        <Button
          fullWidth
          variant="contained"
          onClick={handleVerify}
          sx={{ mt: 2 }}
          disabled={loading || verificationCode.length !== 6}
        >
          {loading ? "Verifying..." : "Verify"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default Verify2FA;
