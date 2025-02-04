import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  TextField,
  Paper,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import PatientForm from "../patients/PatientForm";
import PatientSearch from "../patients/PatientSearch";
import { connectWallet } from "../../utils/web3";
import { ethers } from "ethers";
import QRCode from "qrcode.react";
import { twoFactorService } from "../../services/twoFactor.service";
import { Navigate } from "react-router-dom";
import { getConnectedContract } from "../../services/contract.service";

const Dashboard = () => {
  const { user, logout, loading, contract } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [open2FADialog, setOpen2FADialog] = useState(false);
  const [qrCodeData, setQrCodeData] = useState("");
  const [error, setError] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState(1);
  const [patientId, setPatientId] = useState("");
  const [bloodPressure, setBloodPressure] = useState("");
  const [claimStatus, setClaimStatus] = useState("");

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    const check2FAStatus = async () => {
      try {
        if (user) {
          const enabled = await twoFactorService.is2FAEnabled(user.address);
          setIs2FAEnabled(enabled);
        }
      } catch (err) {
        console.error("Error checking 2FA status:", err);
      }
    };
    check2FAStatus();
  }, [user]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  const handle2FASetup = async () => {
    try {
      setError("");
      console.log("=== Starting 2FA Setup Process ===");
      console.log("Getting QR code for address:", user.address);

      const response = await twoFactorService.setup(user.address);

      if (response.success) {
        console.log("✓ Got QR code successfully");
        console.log("✓ Received secret:", !!response.secret);
        console.log("✓ Received QR data:", !!response.qrCode);

        // Create otpauth URL
        const otpauthUrl = `otpauth://totp/Healthcare_ZKP:${user.address}?secret=${response.secret}&issuer=Healthcare_ZKP`;
        setQrCodeData(otpauthUrl);
        setBackupCode(response.secret);
        setStep(1);
        setOpen2FADialog(true);
        console.log("Showing QR code dialog to user");
      }
    } catch (error) {
      console.error("❌ Error getting QR code:", error);
      setError("Failed to setup 2FA. Please try again.");
    }
  };

  const handleVerify = async () => {
    try {
      setError("");
      console.log("=== Starting Code Verification ===");
      console.log("Verifying code for address:", user.address);
      console.log("Code length:", verificationCode?.length);

      const verifyResponse = await twoFactorService.verify(
        user.address,
        verificationCode
      );

      if (verifyResponse.success) {
        console.log("✓ Code verified successfully!");
        console.log("Moving to blockchain setup step...");
        setStep(2);
      } else {
        console.log("❌ Invalid verification code");
        setError("Invalid code. Please try again.");
      }
    } catch (error) {
      console.error("❌ Verification error:", error);
      setError("Failed to verify code. Please try again.");
    }
  };

  const handleEnableOnBlockchain = async () => {
    try {
      console.log("=== Starting Blockchain Enable Process ===");
      console.log("Connecting wallet...");
      const { signer, address } = await connectWallet();
      console.log("Connected wallet:", address);

      console.log("Getting contract instance...");
      const connectedContract = await getConnectedContract(signer);

      console.log("Generating hashed secret...");
      const hashedSecret = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(backupCode)
      );
      console.log("Secret hashed successfully");

      console.log("Sending enable2FA transaction...");
      const tx = await connectedContract.enable2FA(hashedSecret);
      console.log("Transaction sent:", tx.hash);

      console.log("Waiting for transaction confirmation...");
      await tx.wait();
      console.log("✓ Transaction confirmed");

      console.log("Enabling 2FA in MongoDB...");
      await twoFactorService.enable(address);
      console.log("✓ 2FA enabled in MongoDB");

      setIs2FAEnabled(true);
      setOpen2FADialog(false);
      console.log("=== 2FA Setup Complete ===");
    } catch (error) {
      console.error("❌ Blockchain enable error:", error);
      setError("Failed to enable 2FA on blockchain");
    }
  };

  const submitClaim = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/insurance/verify-eligibility`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            patientId,
            doctorAddress: user.address,
            insuranceAddress: "0x3935cb7ed81d896ebd77f4c3bf03587963b6c4f8", // Your insurance provider address
            bloodPressure,
          }),
        }
      );

      const data = await response.json();
      setClaimStatus(data.message);

      // Clear form
      setPatientId("");
      setBloodPressure("");
    } catch (error) {
      setClaimStatus("Error submitting claim");
      console.error("Error:", error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4">
          Welcome, {user?.role === "doctor" ? "Doctor" : "Patient"}
        </Typography>
        <Button variant="contained" color="secondary" onClick={logout}>
          Logout
        </Button>
      </Box>

      {user?.role === "doctor" ? (
        <>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="Profile" />
            <Tab label="Register Patient" />
            <Tab label="Search Patient" />
          </Tabs>

          {tabValue === 0 ? (
            <Box>
              <Typography variant="body1" gutterBottom>
                Address: {user?.address}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Role: {user?.role}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handle2FASetup}
                disabled={is2FAEnabled}
                sx={{ mt: 2 }}
              >
                {is2FAEnabled ? "2FA Enabled" : "Enable 2FA"}
              </Button>
            </Box>
          ) : tabValue === 1 ? (
            <PatientForm />
          ) : (
            <PatientSearch />
          )}
        </>
      ) : (
        <Typography>
          Access Denied. Only doctors can access this page.
        </Typography>
      )}

      <Dialog open={open2FADialog} onClose={() => setOpen2FADialog(false)}>
        <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {step === 1 && (
            <>
              <Typography variant="body1" gutterBottom>
                1. Scan this QR code with your authenticator app (Google
                Authenticator, Authy, etc.)
              </Typography>
              {qrCodeData && (
                <Box sx={{ textAlign: "center", my: 2 }}>
                  <QRCode
                    value={qrCodeData}
                    size={256}
                    level="M"
                    includeMargin={true}
                  />
                </Box>
              )}
              <Typography variant="body1" gutterBottom>
                2. Enter the 6-digit code from your authenticator app to verify:
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
                    const value = e.target.value
                      .replace(/[^0-9]/g, "")
                      .slice(0, 6);
                    setVerificationCode(value);
                  }}
                  placeholder="Enter 6-digit code"
                  type="tel"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  data-lpignore="true"
                  aria-label="Verification code input"
                />
              </Box>
              <Button
                fullWidth
                variant="contained"
                onClick={handleVerify}
                sx={{ mt: 2 }}
              >
                Verify Code
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Typography variant="body1" gutterBottom>
                Code verified successfully! Click below to enable 2FA on the
                blockchain:
              </Typography>
              <Button
                fullWidth
                variant="contained"
                onClick={handleEnableOnBlockchain}
                sx={{ mt: 2 }}
              >
                Enable 2FA
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Submit Insurance Claim
        </Typography>
        <form onSubmit={submitClaim}>
          <TextField
            fullWidth
            label="Patient ID"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Blood Pressure (Systolic)"
            type="number"
            value={bloodPressure}
            onChange={(e) => setBloodPressure(e.target.value)}
            margin="normal"
            required
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
          >
            Submit Claim
          </Button>
        </form>
        {claimStatus && (
          <Typography
            sx={{ mt: 2 }}
            color={
              claimStatus.includes("qualifies") ? "success.main" : "error.main"
            }
          >
            {claimStatus}
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default Dashboard;
