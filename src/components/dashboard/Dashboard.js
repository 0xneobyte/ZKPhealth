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
import { Navigate, Link } from "react-router-dom";
import { getConnectedContract } from "../../services/contract.service";
import InsuranceDashboard from "../insurance/InsuranceDashboard";

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

  // Render different dashboards based on user role
  if (user?.role === "insurance") {
    return <InsuranceDashboard />;
  }

  if (user?.role === "doctor") {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
          <Typography variant="h4">Welcome, Doctor</Typography>
          <Button variant="contained" color="secondary" onClick={logout}>
            Logout
          </Button>
        </Box>

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
      </Box>
    );
  }

  // Default case - unauthorized access
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Access Denied
      </Typography>
      <Typography>
        You don't have permission to access this dashboard.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={logout}
        sx={{ mt: 2 }}
      >
        Logout
      </Button>
    </Box>
  );
};

export default Dashboard;
