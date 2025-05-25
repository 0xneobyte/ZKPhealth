import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Container,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Avatar,
  Fade,
  Alert,
  alpha,
} from "@mui/material";
import {
  Business as BusinessIcon,
  Assessment as AssessmentIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  AccountBalance as AccountBalanceIcon,
  Description as DescriptionIcon,
  PersonOutline as PersonIcon,
  LocalHospital as HospitalIcon,
  Visibility as VisibilityIcon,
  ThumbUp as ApproveIcon,
  ThumbDown as RejectIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";

function InsuranceDashboard() {
  const { user, logout } = useAuth();
  const [claims, setClaims] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/insurance/claims`
      );
      const data = await response.json();
      setClaims(data);
    } catch (error) {
      setError("Failed to fetch claims");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (claim) => {
    console.log("Viewing claim details:", claim);
    setSelectedClaim(claim);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedClaim(null);
  };

  const handleUpdateStatus = async (claimId, newStatus) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/insurance/claims/${claimId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) throw new Error("Failed to update status");

      // Refresh claims list
      await fetchClaims();
      handleCloseDialog();
    } catch (error) {
      console.error("Error updating claim status:", error);
      setError("Failed to update claim status");
    }
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "error";
      default:
        return "warning";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircleIcon sx={{ fontSize: 16 }} />;
      case "rejected":
        return <CancelIcon sx={{ fontSize: 16 }} />;
      default:
        return <PendingIcon sx={{ fontSize: 16 }} />;
    }
  };

  // Calculate statistics
  const totalClaims = claims.length;
  const pendingClaims = claims.filter(c => c.status === 'pending').length;
  const approvedClaims = claims.filter(c => c.status === 'approved').length;
  const rejectedClaims = claims.filter(c => c.status === 'rejected').length;
  const totalValue = claims.reduce((sum, claim) => sum + (claim.totalCost || 0), 0);
  const eligibleClaims = claims.filter(c => c.isEligible).length;

  if (!user) {
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

  return (
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
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.9) 100%)',
            backdropFilter: 'blur(10px)',
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
                <BusinessIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  Insurance Dashboard
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Manage claims, process approvals, and monitor insurance operations
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

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
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
            <AssessmentIcon sx={{ fontSize: 32, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              {totalClaims}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Total Claims
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
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
            <PendingIcon sx={{ fontSize: 32, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              {pendingClaims}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Pending Review
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
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
            <MoneyIcon sx={{ fontSize: 32, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              ${totalValue.toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Total Value
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
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
            <SecurityIcon sx={{ fontSize: 32, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              {Math.round((eligibleClaims / totalClaims) * 100) || 0}%
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Eligibility Rate
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Profile Card */}
      <Card 
        elevation={0}
        sx={{ 
          borderRadius: 3,
          background: 'white',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          mb: 4,
        }}
      >
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: '#667eea' }}>
              <AccountBalanceIcon />
            </Avatar>
          }
          title={
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Insurance Provider Profile
            </Typography>
          }
          subheader="Your insurance provider account details"
          sx={{ pb: 1 }}
        />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Wallet Address
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                  {user?.address}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Account Role
                </Typography>
                <Chip 
                  label={user?.role?.toUpperCase()} 
                  color="primary"
                  sx={{ 
                    alignSelf: 'flex-start',
                    fontWeight: 600,
                    bgcolor: alpha('#667eea', 0.1),
                    color: '#667eea',
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Claims Management */}
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
              <DescriptionIcon />
            </Avatar>
          }
          title={
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Insurance Claims Management
            </Typography>
          }
          subheader={`${totalClaims} total claims • ${pendingClaims} pending review`}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={`${approvedClaims} Approved`}
                size="small"
                sx={{ 
                  bgcolor: alpha('#4caf50', 0.1),
                  color: '#4caf50',
                  fontWeight: 600,
                }}
              />
              <Chip
                label={`${rejectedClaims} Rejected`}
                size="small"
                sx={{ 
                  bgcolor: alpha('#f44336', 0.1),
                  color: '#f44336',
                  fontWeight: 600,
                }}
              />
            </Box>
          }
          sx={{ pb: 1 }}
        />
        <Divider />
        <CardContent sx={{ p: 0 }}>
          {error && (
            <Alert severity="error" sx={{ m: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
              <CircularProgress size={40} sx={{ color: '#667eea' }} />
            </Box>
          ) : claims.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <DescriptionIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No Claims Found
              </Typography>
              <Typography color="text.secondary">
                No insurance claims have been submitted yet.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha('#667eea', 0.05) }}>
                    <TableCell sx={{ fontWeight: 600 }}>Patient ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Claim Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Total Cost</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Eligibility</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {claims.map((claim, index) => (
                    <TableRow 
                      key={claim._id}
                      sx={{ 
                        '&:hover': { 
                          bgcolor: alpha('#667eea', 0.02),
                        },
                        borderLeft: `3px solid ${
                          claim.status === 'approved' ? '#4caf50' :
                          claim.status === 'rejected' ? '#f44336' : '#ff9800'
                        }`,
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: alpha('#667eea', 0.1), color: '#667eea', fontSize: '0.8rem' }}>
                            {claim.patientId?.substring(0, 2) || 'N/A'}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {claim.patientId}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={claim.claimType}
                          size="small"
                          sx={{ 
                            bgcolor: alpha('#4facfe', 0.1),
                            color: '#4facfe',
                            fontWeight: 500,
                            textTransform: 'capitalize',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
                          ${claim.totalCost?.toLocaleString() || '0'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={claim.isEligible ? "Eligible" : "Not Eligible"}
                          color={claim.isEligible ? "success" : "error"}
                          size="small"
                          title={claim.eligibilityReason}
                          icon={claim.isEligible ? <CheckCircleIcon /> : <CancelIcon />}
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={claim.status}
                          color={getStatusChipColor(claim.status)}
                          size="small"
                          icon={getStatusIcon(claim.status)}
                          sx={{ 
                            fontWeight: 500,
                            textTransform: 'capitalize',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(claim.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewDetails(claim)}
                          sx={{
                            borderColor: alpha('#667eea', 0.3),
                            color: '#667eea',
                            '&:hover': {
                              borderColor: '#667eea',
                              bgcolor: alpha('#667eea', 0.05),
                            },
                          }}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Claim Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          },
        }}
      >
        {selectedClaim && (
          <>
            <DialogTitle sx={{ 
              pb: 1,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}>
              <HospitalIcon />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Claim Details
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Patient ID: {selectedClaim.patientId}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Grid container spacing={3} sx={{ mt: 0 }}>
                {/* Basic Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#667eea' }}>
                    Basic Information
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: alpha('#667eea', 0.05), borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Patient ID
                    </Typography>
                    <Typography variant="body1">{selectedClaim.patientId}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: alpha('#4facfe', 0.05), borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Policy Number
                    </Typography>
                    <Typography variant="body1">{selectedClaim.policyNumber}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: alpha('#f5576c', 0.05), borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Claim Type
                    </Typography>
                    <Chip 
                      label={selectedClaim.claimType}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: alpha('#764ba2', 0.05), borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Insurance Provider
                    </Typography>
                    <Typography variant="body1">{selectedClaim.insuranceProvider}</Typography>
                  </Box>
                </Grid>

                {/* Medical Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#667eea', mt: 2 }}>
                    Medical Information
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: alpha('#667eea', 0.05), borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Diagnosis
                    </Typography>
                    <Typography variant="body1">{selectedClaim.diagnosis}</Typography>
                  </Box>
                </Grid>

                {/* Cost Breakdown */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#667eea', mt: 2 }}>
                    Cost Breakdown
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Card elevation={0} sx={{ bgcolor: alpha('#4facfe', 0.05), borderRadius: 2 }}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                            <Typography variant="body2">Treatment Cost:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              ${selectedClaim.treatmentCost}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                            <Typography variant="body2">Room Charges:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              ${selectedClaim.roomCharges}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                            <Typography variant="body2">Medication:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              ${selectedClaim.medicationCharges}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                            <Typography variant="body2">Consultation:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              ${selectedClaim.consultationFees}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                            <Typography variant="body2">Lab Tests:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              ${selectedClaim.labTestCharges}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Divider sx={{ my: 1 }} />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>Total Cost:</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#667eea' }}>
                              ${selectedClaim.totalCost}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Eligibility Status */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#667eea', mt: 2 }}>
                    Eligibility Assessment
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Card 
                    elevation={0} 
                    sx={{ 
                      bgcolor: selectedClaim.isEligible 
                        ? alpha('#4caf50', 0.05) 
                        : alpha('#f44336', 0.05),
                      borderRadius: 2,
                      border: `1px solid ${
                        selectedClaim.isEligible 
                          ? alpha('#4caf50', 0.2) 
                          : alpha('#f44336', 0.2)
                      }`,
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        {selectedClaim.isEligible ? (
                          <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 32 }} />
                        ) : (
                          <CancelIcon sx={{ color: '#f44336', fontSize: 32 }} />
                        )}
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: selectedClaim.isEligible ? '#4caf50' : '#f44336',
                          }}
                        >
                          {selectedClaim.isEligible ? "Eligible for Coverage" : "Not Eligible"}
                        </Typography>
                      </Box>
                      {selectedClaim.eligibilityReason && (
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: 'white',
                          borderRadius: 1,
                          border: `1px solid ${alpha('#667eea', 0.1)}`,
                        }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                            Assessment Details:
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                            {selectedClaim.eligibilityReason}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 1 }}>
              {selectedClaim.status === "pending" && (
                <>
                  <Button
                    onClick={() =>
                      handleUpdateStatus(selectedClaim._id, "approved")
                    }
                    variant="contained"
                    startIcon={<ApproveIcon />}
                    sx={{
                      bgcolor: '#4caf50',
                      '&:hover': { bgcolor: '#43a047' },
                      fontWeight: 600,
                    }}
                  >
                    Approve Claim
                  </Button>
                  <Button
                    onClick={() =>
                      handleUpdateStatus(selectedClaim._id, "rejected")
                    }
                    variant="contained"
                    startIcon={<RejectIcon />}
                    sx={{
                      bgcolor: '#f44336',
                      '&:hover': { bgcolor: '#d32f2f' },
                      fontWeight: 600,
                    }}
                  >
                    Reject Claim
                  </Button>
                </>
              )}
              <Button 
                onClick={handleCloseDialog}
                variant="outlined"
                sx={{
                  borderColor: alpha('#667eea', 0.3),
                  color: '#667eea',
                  '&:hover': {
                    borderColor: '#667eea',
                    bgcolor: alpha('#667eea', 0.05),
                  },
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
}

export default InsuranceDashboard;
