import React, { useState, useEffect } from 'react';
import { Box, LinearProgress, Typography, Paper } from '@mui/material';

const BatchProgress = ({ refreshTrigger }) => {
    const [progress, setProgress] = useState(null);

    const fetchProgress = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/patients/batch-progress`);
            const data = await response.json();
            if (data.success) {
                setProgress(data.progress);
            }
        } catch (error) {
            console.error('Error fetching batch progress:', error);
        }
    };

    useEffect(() => {
        fetchProgress();
    }, [refreshTrigger]);

    if (!progress) return null;

    const progressPercent = (progress.current / progress.total) * 100;

    return (
        <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
                Batch Progress: {progress.current}/{progress.total} patients
            </Typography>
            <LinearProgress 
                variant="determinate" 
                value={progressPercent} 
                sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
                {progress.remaining} more patients until next blockchain transaction
            </Typography>
        </Paper>
    );
};

export default BatchProgress; 