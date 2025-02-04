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
} from "@mui/material";
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
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Insurance Provider Dashboard</Typography>
        <Button variant="contained" color="secondary" onClick={logout}>
          Logout
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Profile
        </Typography>
        <Typography>Address: {user?.address}</Typography>
        <Typography>Role: {user?.role}</Typography>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Insurance Claims
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
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient ID</TableCell>
                  <TableCell>Claim Type</TableCell>
                  <TableCell>Total Cost</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {claims.map((claim) => (
                  <TableRow key={claim._id}>
                    <TableCell>{claim.patientId}</TableCell>
                    <TableCell>{claim.claimType}</TableCell>
                    <TableCell>${claim.totalCost}</TableCell>
                    <TableCell>
                      <Chip
                        label={claim.status}
                        color={getStatusChipColor(claim.status)}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(claim.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleViewDetails(claim)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Claim Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedClaim && (
          <>
            <DialogTitle>Claim Details</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Patient ID</Typography>
                  <Typography>{selectedClaim.patientId}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Policy Number</Typography>
                  <Typography>{selectedClaim.policyNumber}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Claim Type</Typography>
                  <Typography>{selectedClaim.claimType}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">
                    Insurance Provider
                  </Typography>
                  <Typography>{selectedClaim.insuranceProvider}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Diagnosis</Typography>
                  <Typography>{selectedClaim.diagnosis}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Cost Breakdown</Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography>
                      Treatment Cost: ${selectedClaim.treatmentCost}
                    </Typography>
                    <Typography>
                      Room Charges: ${selectedClaim.roomCharges}
                    </Typography>
                    <Typography>
                      Medication: ${selectedClaim.medicationCharges}
                    </Typography>
                    <Typography>
                      Consultation: ${selectedClaim.consultationFees}
                    </Typography>
                    <Typography>
                      Lab Tests: ${selectedClaim.labTestCharges}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ mt: 1 }}>
                      Total Cost: ${selectedClaim.totalCost}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              {selectedClaim.status === "pending" && (
                <>
                  <Button
                    onClick={() =>
                      handleUpdateStatus(selectedClaim._id, "approved")
                    }
                    color="success"
                    variant="contained"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() =>
                      handleUpdateStatus(selectedClaim._id, "rejected")
                    }
                    color="error"
                    variant="contained"
                  >
                    Reject
                  </Button>
                </>
              )}
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

export default InsuranceDashboard;
