import React, { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Grid,
} from "@mui/material";

const PatientSearch = () => {
  const [patientId, setPatientId] = useState("");
  const [patientData, setPatientData] = useState(null);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      console.log("Searching for patient:", patientId);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/patients/search/${patientId}`
      );
      const data = await response.json();

      console.log("Search response:", data);

      if (!data.success) {
        throw new Error(data.message || "Failed to find patient");
      }

      setPatientData(data.patient);
    } catch (error) {
      console.error("Search error:", error);
      setError(error.message);
      setPatientData(null);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: "auto" }}>
        <Typography variant="h5" gutterBottom align="center" sx={{ mb: 4 }}>
          Search Patient Records
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSearch}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Patient ID"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
              >
                Search
              </Button>
            </Grid>
          </Grid>
        </form>

        {patientData && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Patient Details:
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography>
                  <strong>Name:</strong> {patientData.patientName}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography>
                  <strong>Age:</strong> {patientData.age}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography>
                  <strong>Gender:</strong> {patientData.gender}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography>
                  <strong>Clinical Description:</strong>
                </Typography>
                <Typography>{patientData.clinicalDescription}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography>
                  <strong>Disease:</strong> {patientData.disease}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default PatientSearch;
