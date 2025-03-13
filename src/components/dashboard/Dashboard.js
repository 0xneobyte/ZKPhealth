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
                      {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handle2FASetup}
                    disabled={is2FAEnabled}
                    sx={{
                      mt: 2,
                      transition: "all 0.3s ease",
                      "&:disabled": {
                        backgroundColor: "success.light",
                        color: "white",
                      },
                    }}
                  >
                    {is2FAEnabled ? "2FA Enabled ✓" : "Enable 2FA Security"}
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
    );
  }

  // Default case - unauthorized access
  return (
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
  );
};

export default Dashboard;
