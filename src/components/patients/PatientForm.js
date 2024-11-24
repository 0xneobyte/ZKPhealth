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

            const { signer } = await connectWallet();
            const connectedContract = contract.connect(signer);

            // First store in blockchain
            console.log('Storing patient record in blockchain...');
            
            // Estimate gas for the transaction
            const gasEstimate = await connectedContract.estimateGas.registerPatientRecord(
                formData.patientId,
                formData.patientName,
                parseInt(formData.age),
                formData.gender,
                formData.clinicalDescription,
                formData.disease
            );

            // Add 20% buffer to gas estimate
            const gasLimit = Math.ceil(gasEstimate.toNumber() * 1.2);

            const tx = await connectedContract.registerPatientRecord(
                formData.patientId,
                formData.patientName,
                parseInt(formData.age),
                formData.gender,
                formData.clinicalDescription,
                formData.disease,
                { gasLimit }
            );

            console.log('Transaction sent:', tx.hash);
            const receipt = await tx.wait();
            console.log('Transaction confirmed:', receipt);

            // Then store in MongoDB
            console.log('Sending data to MongoDB:', {
                ...formData,
                doctorAddress: user.address
            });
            
            const response = await fetch(`${process.env.REACT_APP_API_URL}/patients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    patientId: formData.patientId,
                    patientName: formData.patientName,
                    age: formData.age,
                    gender: formData.gender,
                    clinicalDescription: formData.clinicalDescription,
                    disease: formData.disease,
                    doctorAddress: user.address
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to store in database');
            }

            setSuccess('Patient registered successfully!');
            
            // Reset form and get new patient ID
            setFormData({
                patientId: '', // This will be updated by fetchPatientId
                patientName: '',
                age: '',
                gender: '',
                clinicalDescription: '',
                disease: ''
            });
            await fetchPatientId(); // Fetch new patient ID after successful registration
            
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
    );
};

export default PatientForm;