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
  Grid,
  MenuItem,
  Card,
  CardContent,
  Fade,
  DialogActions,
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
  const [isLoading, setIsLoading] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [bloodPressure, setBloodPressure] = useState("");
  const [claimStatus, setClaimStatus] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatmentCost, setTreatmentCost] = useState("");
  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    dateOfBirth: "",
    gender: "",
    contactNumber: "",
    policyNumber: "",
    insuranceProvider: "",
    hospitalName: "ZKP General Hospital",
    hospitalId: "ZKP123",
    claimType: "",
    admissionDate: "",
    dischargeDate: "",
    diagnosis: "",
    treatmentCost: "",
    roomCharges: "",
    medicationCharges: "",
    consultationFees: "",
    labTestCharges: "",
  });

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

  // Function to refresh 2FA status
  const refresh2FAStatus = async () => {
    try {
      if (user) {
        const enabled = await twoFactorService.is2FAEnabled(user.address);
        setIs2FAEnabled(enabled);
        return enabled;
      }
      return false;
    } catch (err) {
      console.error("Error refreshing 2FA status:", err);
      return false;
    }
  };

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
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  const handle2FASetup = async () => {
    try {
      setError("");
      setIsLoading(true);
      console.log("=== Starting 2FA Setup Process ===");
      console.log("Getting QR code for address:", user.address);

      const response = await twoFactorService.setup(user.address);

      if (response.success) {
        console.log("✓ Got QR code successfully");
        console.log("✓ Received secret:", !!response.secret);
        console.log("✓ Received QR data:", !!response.qrCode);

        // Use the QR code data from the backend
        setQrCodeData(response.qrCode);
        setBackupCode(response.secret);
        setStep(1);
        setOpen2FADialog(true);
        console.log("Showing QR code dialog to user");
      }
    } catch (error) {
      console.error("❌ Error getting QR code:", error);
      setError("Failed to setup 2FA. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setError("");
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableOnBlockchain = async () => {
    try {
      setIsLoading(true);
      console.log("=== Starting Blockchain Enable Process ===");

      // First, check if there's a valid backupCode
      if (!backupCode) {
        setError("Missing secret code. Please restart the 2FA setup process.");
        return;
      }

      console.log("Connecting wallet...");
      const { signer, address } = await connectWallet();

      if (!signer) {
        setError(
          "Failed to connect wallet. Please make sure your wallet is unlocked."
        );
        return;
      }

      console.log("Connected wallet:", address);

      console.log("Getting contract instance...");
      const connectedContract = await getConnectedContract(signer);

      if (!connectedContract) {
        setError("Failed to connect to the smart contract. Please try again.");
        return;
      }

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
      const dbResult = await twoFactorService.enable(address);

      if (!dbResult || !dbResult.success) {
        setError(
          "Transaction succeeded but failed to update database. Please contact support."
        );
        return;
      }

      console.log("✓ 2FA enabled in MongoDB");

      // Update local state
      setIs2FAEnabled(true);
      setOpen2FADialog(false);

      // Double-check with the server that 2FA is enabled
      await refresh2FAStatus();

      console.log("=== 2FA Setup Complete ===");

      // Show success notification
      alert("2FA has been successfully enabled for your account!");
    } catch (error) {
      console.error("❌ Blockchain enable error:", error);
      setError(
        `Failed to enable 2FA on blockchain: ${
          error.message || "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const submitClaim = async (e) => {
    e.preventDefault();
    try {
      const totalCost =
        Number(formData.treatmentCost) +
        Number(formData.roomCharges) +
        Number(formData.medicationCharges) +
        Number(formData.consultationFees) +
        Number(formData.labTestCharges);

      // Format dates properly
      const formattedData = {
        ...formData,
        admissionDate: new Date(formData.admissionDate)
          .toISOString()
          .split("T")[0],
        dischargeDate: new Date(formData.dischargeDate)
          .toISOString()
          .split("T")[0],
        doctorAddress: user.address,
        totalCost,
        claimDate: new Date().toISOString(),
      };

      console.log("Formatted claim data:", formattedData);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/insurance/submit-claim`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formattedData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Claim submission response:", data);
      setClaimStatus(data.message);

      // Clear form
      setFormData({
        patientId: "",
        patientName: "",
        dateOfBirth: "",
        gender: "",
        contactNumber: "",
        policyNumber: "",
        insuranceProvider: "",
        hospitalName: "ZKP General Hospital",
        hospitalId: "ZKP123",
        claimType: "",
        admissionDate: "",
        dischargeDate: "",
        diagnosis: "",
        treatmentCost: "",
        roomCharges: "",
        medicationCharges: "",
        consultationFees: "",
        labTestCharges: "",
      });
    } catch (error) {
      setClaimStatus("Error submitting claim");
      console.error("Error:", error);
    }
  };

  const fetchPatientDetails = async (id) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/patients/${id}`
      );
      if (!response.ok) {
        throw new Error("Patient not found");
      }
      const patient = await response.json();

      // Update form with patient details
      setFormData((prev) => ({
        ...prev,
        patientId: id,
        patientName: patient.patientName,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        contactNumber: patient.contactNumber || "", // In case these fields don't exist
      }));
    } catch (error) {
      console.error("Error fetching patient details:", error);
      // Optionally show an error message
      setClaimStatus("Error: Patient not found");
    }
  };

  // Render different dashboards based on user role
  console.log("Dashboard - User role:", user?.role);

  if (user?.role?.toLowerCase() === "admin") {
    console.log("Redirecting to AdminDashboard");
    return <Navigate to="/admin" />;
  }

  if (user?.role === "insurance") {
    return <InsuranceDashboard />;
  }

  if (user?.role === "doctor") {
    return (
      <>
        <Fade in={true} timeout={800}>
          <Box>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 2,
                backgroundColor: "#f9faf5",
                border: "1px solid #e0e0e0",
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
                },
              }}
            >
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                sx={{
                  mb: 3,
                  "& .MuiTabs-indicator": {
                    backgroundColor: "primary.main",
                    height: 3,
                    borderRadius: "3px 3px 0 0",
                  },
                }}
                centered
                variant="fullWidth"
              >
                <Tab
                  label="Profile"
                  sx={{
                    fontWeight: 500,
                    transition: "all 0.3s ease",
                    "&.Mui-selected": {
                      color: "primary.main",
                      fontWeight: 600,
                    },
                  }}
                />
                <Tab
                  label="Register Patient"
                  sx={{
                    fontWeight: 500,
                    transition: "all 0.3s ease",
                    "&.Mui-selected": {
                      color: "primary.main",
                      fontWeight: 600,
                    },
                  }}
                />
                <Tab
                  label="Search Patient"
                  sx={{
                    fontWeight: 500,
                    transition: "all 0.3s ease",
                    "&.Mui-selected": {
                      color: "primary.main",
                      fontWeight: 600,
                    },
                  }}
                />
                <Tab
                  label="Submit Claim"
                  sx={{
                    fontWeight: 500,
                    transition: "all 0.3s ease",
                    "&.Mui-selected": {
                      color: "primary.main",
                      fontWeight: 600,
                    },
                  }}
                />
              </Tabs>
            </Paper>

            {tabValue === 0 ? (
              <Fade in={true} timeout={500}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography
                      variant="h5"
                      gutterBottom
                      color="primary"
                      sx={{ fontWeight: 600, mb: 3 }}
                    >
                      Doctor Profile
                    </Typography>
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="body1"
                        gutterBottom
                        sx={{ display: "flex", alignItems: "center" }}
                      >
                        <strong style={{ marginRight: "8px" }}>
                          Wallet Address:
                        </strong>
                        <span
                          style={{
                            fontFamily: "monospace",
                            backgroundColor: "#f5f5f5",
                            padding: "4px 8px",
                            borderRadius: "4px",
                          }}
                        >
                          {user?.address}
                        </span>
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        <strong>Role:</strong>{" "}
                        {user?.role.charAt(0).toUpperCase() +
                          user?.role.slice(1)}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handle2FASetup}
                      disabled={is2FAEnabled || isLoading}
                      sx={{
                        mt: 2,
                        transition: "all 0.3s ease",
                        "&:disabled": {
                          backgroundColor: "success.light",
                          color: "white",
                        },
                      }}
                    >
                      {is2FAEnabled ? (
                        "2FA Enabled ✓"
                      ) : isLoading ? (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <CircularProgress
                            size={20}
                            color="inherit"
                            sx={{ mr: 1 }}
                          />
                          Setting up...
                        </Box>
                      ) : (
                        "Enable 2FA Security"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </Fade>
            ) : tabValue === 1 ? (
              <Fade in={true} timeout={500}>
                <Box>
                  <PatientForm />
                </Box>
              </Fade>
            ) : tabValue === 2 ? (
              <Fade in={true} timeout={500}>
                <Box>
                  <PatientSearch />
                </Box>
              </Fade>
            ) : (
              <Fade in={true} timeout={500}>
                <Box sx={{ maxWidth: 800, mx: "auto" }}>
                  <Card sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography
                        variant="h5"
                        gutterBottom
                        color="primary"
                        sx={{ fontWeight: 600, mb: 3 }}
                      >
                        Submit Insurance Claim
                      </Typography>
                      <form onSubmit={submitClaim}>
                        <Grid container spacing={3}>
                          <Grid item xs={12}>
                            <Typography
                              variant="subtitle1"
                              gutterBottom
                              sx={{ fontWeight: "bold", color: "primary.dark" }}
                            >
                              Patient Information
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Patient ID"
                              name="patientId"
                              value={formData.patientId}
                              onChange={(e) => {
                                const newId = e.target.value;
                                setFormData({ ...formData, patientId: newId });
                                if (newId.length > 0) {
                                  // Or any other condition that indicates a complete ID
                                  fetchPatientDetails(newId);
                                }
                              }}
                              required
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Patient Name"
                              name="patientName"
                              value={formData.patientName}
                              InputProps={{
                                readOnly: true,
                              }}
                              required
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Date of Birth"
                              name="dateOfBirth"
                              type="date"
                              value={formData.dateOfBirth}
                              InputProps={{
                                readOnly: true,
                              }}
                              InputLabelProps={{ shrink: true }}
                              required
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              select
                              fullWidth
                              label="Gender"
                              name="gender"
                              value={formData.gender}
                              InputProps={{
                                readOnly: true,
                              }}
                              required
                            >
                              <MenuItem value="male">Male</MenuItem>
                              <MenuItem value="female">Female</MenuItem>
                              <MenuItem value="other">Other</MenuItem>
                            </TextField>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Contact Number"
                              name="contactNumber"
                              value={formData.contactNumber}
                              InputProps={{
                                readOnly: true,
                              }}
                              required
                            />
                          </Grid>

                          <Grid item xs={12}>
                            <Typography
                              variant="subtitle1"
                              gutterBottom
                              sx={{ fontWeight: "bold", mt: 2 }}
                            >
                              Insurance Information
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Policy Number"
                              name="policyNumber"
                              value={formData.policyNumber}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  policyNumber: e.target.value,
                                })
                              }
                              required
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Insurance Provider"
                              name="insuranceProvider"
                              value={formData.insuranceProvider}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  insuranceProvider: e.target.value,
                                })
                              }
                              required
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              select
                              fullWidth
                              label="Claim Type"
                              name="claimType"
                              value={formData.claimType}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  claimType: e.target.value,
                                })
                              }
                              required
                            >
                              <MenuItem value="inpatient">Inpatient</MenuItem>
                              <MenuItem value="outpatient">Outpatient</MenuItem>
                              <MenuItem value="daycare">Daycare</MenuItem>
                            </TextField>
                          </Grid>

                          <Grid item xs={12}>
                            <Typography
                              variant="subtitle1"
                              gutterBottom
                              sx={{ fontWeight: "bold", mt: 2 }}
                            >
                              Treatment Information
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Admission Date"
                              name="admissionDate"
                              type="date"
                              value={formData.admissionDate}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  admissionDate: e.target.value,
                                })
                              }
                              InputLabelProps={{ shrink: true }}
                              required
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Discharge Date"
                              name="dischargeDate"
                              type="date"
                              value={formData.dischargeDate}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  dischargeDate: e.target.value,
                                })
                              }
                              InputLabelProps={{ shrink: true }}
                              required
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Diagnosis"
                              name="diagnosis"
                              multiline
                              rows={2}
                              value={formData.diagnosis}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  diagnosis: e.target.value,
                                })
                              }
                              required
                            />
                          </Grid>

                          <Grid item xs={12}>
                            <Typography
                              variant="subtitle1"
                              gutterBottom
                              sx={{ fontWeight: "bold", mt: 2 }}
                            >
                              Cost Breakdown
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Treatment Cost"
                              name="treatmentCost"
                              type="number"
                              value={formData.treatmentCost}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  treatmentCost: e.target.value,
                                })
                              }
                              required
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Room Charges"
                              name="roomCharges"
                              type="number"
                              value={formData.roomCharges}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  roomCharges: e.target.value,
                                })
                              }
                              required
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Medication Charges"
                              name="medicationCharges"
                              type="number"
                              value={formData.medicationCharges}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  medicationCharges: e.target.value,
                                })
                              }
                              required
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Consultation Fees"
                              name="consultationFees"
                              type="number"
                              value={formData.consultationFees}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  consultationFees: e.target.value,
                                })
                              }
                              required
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Lab Test Charges"
                              name="labTestCharges"
                              type="number"
                              value={formData.labTestCharges}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  labTestCharges: e.target.value,
                                })
                              }
                              required
                            />
                          </Grid>

                          <Grid item xs={12}>
                            <Button
                              type="submit"
                              variant="contained"
                              color="primary"
                              fullWidth
                              size="large"
                              sx={{
                                py: 1.5,
                                fontWeight: 600,
                                mt: 2,
                                transition: "all 0.3s ease",
                              }}
                            >
                              Submit Claim
                            </Button>
                          </Grid>
                        </Grid>
                      </form>
                      {claimStatus && (
                        <Alert
                          severity={
                            claimStatus.includes("Error") ? "error" : "success"
                          }
                          sx={{ mt: 3 }}
                        >
                          {claimStatus}
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              </Fade>
            )}
          </Box>
        </Fade>

        {/* 2FA Setup Dialog */}
        <Dialog
          open={open2FADialog}
          onClose={() => setOpen2FADialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {step === 1
              ? "Set Up Two-Factor Authentication"
              : "Complete 2FA Setup"}
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {step === 1 ? (
              // Step 1: QR Code Scanning and Verification
              <>
                <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
                  Scan this QR code with your authenticator app (Google
                  Authenticator, Authy, etc.)
                </Typography>

                {qrCodeData && (
                  <Box sx={{ textAlign: "center", my: 3 }}>
                    {qrCodeData.startsWith("data:") ? (
                      // If it's a data URL from the backend
                      <img
                        src={qrCodeData}
                        alt="2FA QR Code"
                        style={{ maxWidth: "100%", height: "auto" }}
                      />
                    ) : (
                      // If it's an otpauth URL, use the QRCode component
                      <QRCode
                        value={qrCodeData}
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    )}
                  </Box>
                )}

                {backupCode && (
                  <Box sx={{ mt: 2, mb: 3 }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Backup code (if you can't scan the QR code):
                    </Typography>
                    <TextField
                      fullWidth
                      variant="outlined"
                      value={backupCode}
                      InputProps={{
                        readOnly: true,
                      }}
                      sx={{ mb: 2, fontFamily: "monospace" }}
                    />
                    <Alert severity="warning">
                      Save this backup code in a secure location. You'll need it
                      if you lose access to your authenticator app.
                    </Alert>
                  </Box>
                )}

                <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                  Enter the 6-digit verification code:
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/[^0-9]/g, "")
                      .slice(0, 6);
                    setVerificationCode(value);
                  }}
                  sx={{ mb: 2 }}
                  inputProps={{
                    maxLength: 6,
                    pattern: "[0-9]*",
                    inputMode: "numeric",
                  }}
                />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 3,
                  }}
                >
                  <Button
                    onClick={() => setOpen2FADialog(false)}
                    color="secondary"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleVerify}
                    disabled={verificationCode.length !== 6 || isLoading}
                  >
                    {isLoading ? (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <CircularProgress
                          size={20}
                          color="inherit"
                          sx={{ mr: 1 }}
                        />
                        Verifying...
                      </Box>
                    ) : (
                      "Verify Code"
                    )}
                  </Button>
                </Box>
              </>
            ) : (
              // Step 2: Blockchain Enablement
              <>
                <Alert severity="success" sx={{ mb: 3 }}>
                  Verification successful! Your code has been verified.
                </Alert>
                <Typography variant="body1" paragraph>
                  You're almost done! The final step is to enable 2FA on the
                  blockchain to secure your account.
                </Typography>
                <Typography variant="body1" paragraph>
                  This will require you to sign a transaction with your wallet.
                  The transaction will store a secure hash of your secret on the
                  blockchain.
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  paragraph
                  sx={{ mb: 3 }}
                >
                  Note: You'll need to approve this transaction in your wallet.
                  Make sure your wallet is connected.
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 3,
                  }}
                >
                  <Button
                    onClick={() => setOpen2FADialog(false)}
                    color="secondary"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleEnableOnBlockchain}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <CircularProgress
                          size={20}
                          color="inherit"
                          sx={{ mr: 1 }}
                        />
                        Enabling...
                      </Box>
                    ) : (
                      "Enable 2FA on Blockchain"
                    )}
                  </Button>
                </Box>
              </>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Default case - unauthorized access
  return (
    <>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom color="error">
          Access Denied
        </Typography>
        <Typography variant="body1" paragraph>
          You don't have permission to access this dashboard.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={logout}
          sx={{ mt: 2 }}
        >
          Return to Login
        </Button>
      </Box>
    </>
  );
};

export default Dashboard;
