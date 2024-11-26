import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    Alert,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { useAuth } from '../auth/AuthContext';
import { connectWallet } from '../../utils/web3';
import BatchProgress from './BatchProgress';

const PatientForm = () => {
    const { user, contract } = useAuth();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        patientId: '',
        patientName: '',
        age: '',
        gender: '',
        clinicalDescription: '',
        disease: ''
    });
    const [refreshBatchProgress, setRefreshBatchProgress] = useState(0);

    const fetchPatientId = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/patients/generate-id`);
            if (!response.ok) throw new Error('Failed to generate patient ID');
            const data = await response.json();
            setFormData(prev => ({
                ...prev,
                patientId: data.patientId
            }));
        } catch (error) {
            console.error('Error fetching patient ID:', error);
            setError('Failed to generate patient ID');
        }
    };

    useEffect(() => {
        fetchPatientId();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setSuccess('');

            console.log('Sending data to MongoDB:', {
                ...formData,
                doctorAddress: user.address
            });
            
            // First, save to MongoDB and add to batch
            const response = await fetch(`${process.env.REACT_APP_API_URL}/patients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    doctorAddress: user.address
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to store in database');
            }

            const data = await response.json();

            // Only if batch is processed (10 patients), do blockchain transaction
            if (data.batchProcessed) {
                const { signer } = await connectWallet();
                const connectedContract = contract.connect(signer);
                
                console.log('Batch complete - storing batch in blockchain...');
                
                const tx = await connectedContract.registerPatientRecord(
                    formData.patientId,
                    formData.patientName,
                    parseInt(formData.age),
                    formData.gender,
                    formData.clinicalDescription,
                    formData.disease,
                    { gasLimit: 300000 }
                );

                console.log('Batch transaction sent:', tx.hash);
                await tx.wait();
                console.log('Batch transaction confirmed');
            }

            setSuccess('Patient registered successfully!');
            
            // Reset form and get new patient ID
            setFormData({
                patientId: '',
                patientName: '',
                age: '',
                gender: '',
                clinicalDescription: '',
                disease: ''
            });
            await fetchPatientId();

            // Trigger batch progress refresh
            setRefreshBatchProgress(prev => prev + 1);

        } catch (err) {
            console.error('Detailed error:', err);
            setError(err.message || 'Failed to register patient');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <Box>
            <BatchProgress refreshTrigger={refreshBatchProgress} />
            <Box sx={{ p: 3 }}>
                <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
                    <Typography variant="h5" gutterBottom align="center" sx={{ mb: 4 }}>
                        Patient Registration Form
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {success}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Patient ID"
                                    name="patientId"
                                    value={formData.patientId}
                                    disabled
                                    sx={{ mb: 2 }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Patient Name"
                                    name="patientName"
                                    value={formData.patientName}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Age"
                                    name="age"
                                    type="number"
                                    value={formData.age}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Gender</InputLabel>
                                    <Select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                    >
                                        <MenuItem value="male">Male</MenuItem>
                                        <MenuItem value="female">Female</MenuItem>
                                        <MenuItem value="other">Other</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Clinical Description"
                                    name="clinicalDescription"
                                    multiline
                                    rows={4}
                                    value={formData.clinicalDescription}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Disease"
                                    name="disease"
                                    value={formData.disease}
                                    onChange={handleChange}
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
                                >
                                    Register Patient
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </Paper>
            </Box>
        </Box>
    );
};

export default PatientForm;