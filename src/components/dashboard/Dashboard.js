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
  Container,
  CardHeader,
  Divider,
  Avatar,
  Chip,
  alpha,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  Assignment as AssignmentIcon,
  LocalHospital as HospitalIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";
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
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* Modern Gradient Header */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 4,
              mb: 4,
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              },
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Avatar
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: alpha('#ffffff', 0.2),
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <HospitalIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      Doctor Dashboard
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      Manage patients, submit claims, and monitor healthcare data
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  onClick={logout}
                  startIcon={<PersonIcon />}
                  sx={{
                    borderColor: alpha('#ffffff', 0.3),
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: alpha('#ffffff', 0.1),
                    },
                  }}
                >
                  Logout
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Modern Navigation Tabs */}
          <Paper
            elevation={0}
            sx={{ 
              borderRadius: 3,
              mb: 4,
              overflow: 'hidden',
              background: 'white',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }}
          >
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              sx={{ 
                '& .MuiTabs-indicator': {
                  height: 4,
                  borderRadius: '4px 4px 0 0',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                },
                '& .MuiTab-root': {
                  minHeight: 72,
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  textTransform: 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha('#667eea', 0.05),
                  },
                  '&.Mui-selected': {
                    color: '#667eea',
                  },
                },
              }}
            >
              <Tab 
                icon={<DashboardIcon />} 
                label="Profile" 
                iconPosition="start"
                sx={{ gap: 1 }}
              />
              <Tab 
                icon={<PersonAddIcon />} 
                label="Register Patient" 
                iconPosition="start"
                sx={{ gap: 1 }}
              />
              <Tab 
                icon={<SearchIcon />} 
                label="Search Patient" 
                iconPosition="start"
                sx={{ gap: 1 }}
              />
              <Tab 
                icon={<AssignmentIcon />} 
                label="Submit Claim" 
                iconPosition="start"
                sx={{ gap: 1 }}
              />
            </Tabs>
          </Paper>

          {/* Profile Tab - Modern Doctor Dashboard */}
          {tabValue === 0 && (
            <Fade in={true} timeout={600}>
              <Grid container spacing={3}>
                {/* Doctor Profile Card */}
                <Grid item xs={12} md={4}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: 100,
                        height: 100,
                        background: alpha('#ffffff', 0.1),
                        borderRadius: '50%',
                        transform: 'translate(30%, -30%)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,
                            bgcolor: alpha('#ffffff', 0.2),
                            mr: 2,
                          }}
                        >
                          <HospitalIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Dr. {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Healthcare Provider
                          </Typography>
                        </Box>
                      </Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          opacity: 0.8,
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          wordBreak: 'break-all',
                        }}
                      >
                        {user?.address}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Security Status Card */}
                <Grid item xs={12} md={8}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      borderRadius: 3,
                      background: 'white',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      height: '100%',
                    }}
                  >
                    <CardHeader
                      avatar={
                        <Avatar sx={{ bgcolor: is2FAEnabled ? '#4caf50' : '#ff9800' }}>
                          <SecurityIcon />
                        </Avatar>
                      }
                      title={
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Account Security
                        </Typography>
                      }
                      subheader={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <Chip
                            label={is2FAEnabled ? "2FA Enabled" : "2FA Disabled"}
                            size="small"
                            icon={is2FAEnabled ? <CheckCircleIcon /> : <SecurityIcon />}
                            sx={{
                              bgcolor: is2FAEnabled 
                                ? alpha('#4caf50', 0.1) 
                                : alpha('#ff9800', 0.1),
                              color: is2FAEnabled ? '#4caf50' : '#ff9800',
                              fontWeight: 600,
                              '& .MuiChip-icon': {
                                fontSize: '1rem',
                              },
                            }}
                          />
                        </Box>
                      }
                      sx={{ pb: 1 }}
                    />
                    <Divider />
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Enhance your account security with two-factor authentication. 
                        This adds an extra layer of protection to your medical data and patient information.
                      </Typography>
                      <Button
                        variant={is2FAEnabled ? "outlined" : "contained"}
                        color={is2FAEnabled ? "success" : "primary"}
                        onClick={handle2FASetup}
                        disabled={is2FAEnabled || isLoading}
                        startIcon={is2FAEnabled ? <CheckCircleIcon /> : <SecurityIcon />}
                        sx={{
                          fontWeight: 600,
                          transition: "all 0.3s ease",
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
                </Grid>

                {/* Quick Stats Cards */}
                <Grid item xs={12}>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Card 
                        elevation={0}
                        sx={{ 
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                          color: 'white',
                          textAlign: 'center',
                          p: 2,
                        }}
                      >
                        <PersonAddIcon sx={{ fontSize: 32, mb: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          Register
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          New Patients
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Card 
                        elevation={0}
                        sx={{ 
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                          color: '#333',
                          textAlign: 'center',
                          p: 2,
                        }}
                      >
                        <SearchIcon sx={{ fontSize: 32, mb: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          Search
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          Patient Records
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Card 
                        elevation={0}
                        sx={{ 
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                          color: '#333',
                          textAlign: 'center',
                          p: 2,
                        }}
                      >
                        <AssignmentIcon sx={{ fontSize: 32, mb: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          Submit
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          Insurance Claims
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Card 
                        elevation={0}
                        sx={{ 
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
                          color: '#333',
                          textAlign: 'center',
                          p: 2,
                        }}
                      >
                        <AssessmentIcon sx={{ fontSize: 32, mb: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          Monitor
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          Health Data
                        </Typography>
                      </Card>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Quick Actions */}
                <Grid item xs={12}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      borderRadius: 3,
                      background: 'white',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    }}
                  >
                    <CardHeader
                      title={
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Quick Actions
                        </Typography>
                      }
                      sx={{ pb: 1 }}
                    />
                    <Divider />
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<PersonAddIcon />}
                            onClick={() => setTabValue(1)}
                            sx={{
                              py: 1.5,
                              borderColor: alpha('#667eea', 0.3),
                              color: '#667eea',
                              '&:hover': {
                                borderColor: '#667eea',
                                bgcolor: alpha('#667eea', 0.05),
                              },
                            }}
                          >
                            Register Patient
                          </Button>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<SearchIcon />}
                            onClick={() => setTabValue(2)}
                            sx={{
                              py: 1.5,
                              borderColor: alpha('#4facfe', 0.3),
                              color: '#4facfe',
                              '&:hover': {
                                borderColor: '#4facfe',
                                bgcolor: alpha('#4facfe', 0.05),
                              },
                            }}
                          >
                            Search Patient
                          </Button>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<AssignmentIcon />}
                            onClick={() => setTabValue(3)}
                            sx={{
                              py: 1.5,
                              borderColor: alpha('#f5576c', 0.3),
                              color: '#f5576c',
                              '&:hover': {
                                borderColor: '#f5576c',
                                bgcolor: alpha('#f5576c', 0.05),
                              },
                            }}
                          >
                            Submit Claim
                          </Button>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<TrendingUpIcon />}
                            sx={{
                              py: 1.5,
                              borderColor: alpha('#764ba2', 0.3),
                              color: '#764ba2',
                              '&:hover': {
                                borderColor: '#764ba2',
                                bgcolor: alpha('#764ba2', 0.05),
                              },
                            }}
                          >
                            View Analytics
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Fade>
          )}
          {/* Register Patient Tab */}
          {tabValue === 1 && (
            <Fade in={true} timeout={600}>
              <Card 
                elevation={0}
                sx={{ 
                  borderRadius: 3,
                  background: 'white',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }}
              >
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: '#667eea' }}>
                      <PersonAddIcon />
                    </Avatar>
                  }
                  title={
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Register New Patient
                    </Typography>
                  }
                  subheader="Add a new patient to the healthcare system"
                  sx={{ pb: 1 }}
                />
                <Divider />
                <CardContent>
                  <PatientForm />
                </CardContent>
              </Card>
            </Fade>
          )}

          {/* Search Patient Tab */}
          {tabValue === 2 && (
            <Fade in={true} timeout={600}>
              <Card 
                elevation={0}
                sx={{ 
                  borderRadius: 3,
                  background: 'white',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }}
              >
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: '#4facfe' }}>
                      <SearchIcon />
                    </Avatar>
                  }
                  title={
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Search Patient Records
                    </Typography>
                  }
                  subheader="Find and access existing patient information"
                  sx={{ pb: 1 }}
                />
                <Divider />
                <CardContent>
                  <PatientSearch />
                </CardContent>
              </Card>
            </Fade>
          )}
          {/* Submit Claim Tab */}
          {tabValue === 3 && (
            <Fade in={true} timeout={600}>
              <Card 
                elevation={0}
                sx={{ 
                  borderRadius: 3,
                  background: 'white',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  maxWidth: 800,
                  mx: 'auto',
                }}
              >
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: '#f5576c' }}>
                      <AssignmentIcon />
                    </Avatar>
                  }
                  title={
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Submit Insurance Claim
                    </Typography>
                  }
                  subheader="Create and submit insurance claims for patient treatments"
                  sx={{ pb: 1 }}
                />
                <Divider />
                <CardContent sx={{ p: 4 }}>
                  <form onSubmit={submitClaim}>
                    <Grid container spacing={3}>
                      {/* Patient Information Section */}
                      <Grid item xs={12}>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1, 
                            mb: 2,
                            p: 2,
                            bgcolor: alpha('#667eea', 0.05),
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: alpha('#667eea', 0.1),
                          }}
                        >
                          <PersonIcon sx={{ color: '#667eea' }} />
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600, color: '#667eea' }}
                          >
                            Patient Information
                          </Typography>
                        </Box>
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
                              fetchPatientDetails(newId);
                            }
                          }}
                          required
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
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
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
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
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
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
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
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
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
                        />
                      </Grid>

                      {/* Insurance Information Section */}
                      <Grid item xs={12}>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1, 
                            mb: 2,
                            mt: 2,
                            p: 2,
                            bgcolor: alpha('#4facfe', 0.05),
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: alpha('#4facfe', 0.1),
                          }}
                        >
                          <SecurityIcon sx={{ color: '#4facfe' }} />
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600, color: '#4facfe' }}
                          >
                            Insurance Information
                          </Typography>
                        </Box>
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
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
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
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
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
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
                        >
                          <MenuItem value="inpatient">Inpatient</MenuItem>
                          <MenuItem value="outpatient">Outpatient</MenuItem>
                          <MenuItem value="daycare">Daycare</MenuItem>
                        </TextField>
                      </Grid>

                      {/* Treatment Information Section */}
                      <Grid item xs={12}>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1, 
                            mb: 2,
                            mt: 2,
                            p: 2,
                            bgcolor: alpha('#f5576c', 0.05),
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: alpha('#f5576c', 0.1),
                          }}
                        >
                          <HospitalIcon sx={{ color: '#f5576c' }} />
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600, color: '#f5576c' }}
                          >
                            Treatment Information
                          </Typography>
                        </Box>
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
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
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
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Diagnosis"
                          name="diagnosis"
                          multiline
                          rows={3}
                          value={formData.diagnosis}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              diagnosis: e.target.value,
                            })
                          }
                          required
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
                        />
                      </Grid>

                      {/* Cost Breakdown Section */}
                      <Grid item xs={12}>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1, 
                            mb: 2,
                            mt: 2,
                            p: 2,
                            bgcolor: alpha('#764ba2', 0.05),
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: alpha('#764ba2', 0.1),
                          }}
                        >
                          <TrendingUpIcon sx={{ color: '#764ba2' }} />
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600, color: '#764ba2' }}
                          >
                            Cost Breakdown
                          </Typography>
                        </Box>
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
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
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
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
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
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
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
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
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
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Button
                          type="submit"
                          variant="contained"
                          fullWidth
                          size="large"
                          sx={{
                            py: 1.5,
                            fontWeight: 600,
                            mt: 3,
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            transition: "all 0.3s ease",
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                            },
                          }}
                        >
                          Submit Insurance Claim
                        </Button>
                      </Grid>
                    </Grid>
                  </form>
                  {claimStatus && (
                    <Alert
                      severity={
                        claimStatus.includes("Error") ? "error" : "success"
                      }
                      sx={{ 
                        mt: 3,
                        borderRadius: 2,
                        '& .MuiAlert-icon': {
                          fontSize: '1.25rem',
                        },
                      }}
                    >
                      {claimStatus}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Fade>
          )}

        </Container>

        {/* 2FA Setup Dialog */}
        <Dialog
          open={open2FADialog}
          onClose={() => setOpen2FADialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            },
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {step === 1
                ? "Set Up Two-Factor Authentication"
                : "Complete 2FA Setup"}
            </Typography>
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ p: 3 }}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 2,
                  borderRadius: 2,
                }}
              >
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
                      sx={{ 
                        mb: 2, 
                        fontFamily: "monospace",
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                    <Alert 
                      severity="warning"
                      sx={{ borderRadius: 2 }}
                    >
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
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
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
                    sx={{ borderRadius: 2 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleVerify}
                    disabled={verificationCode.length !== 6 || isLoading}
                    sx={{ borderRadius: 2 }}
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
                <Alert 
                  severity="success" 
                  sx={{ 
                    mb: 3,
                    borderRadius: 2,
                  }}
                >
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
                    sx={{ borderRadius: 2 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleEnableOnBlockchain}
                    disabled={isLoading}
                    sx={{ borderRadius: 2 }}
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
