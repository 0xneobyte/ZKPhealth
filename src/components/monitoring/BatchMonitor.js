import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';

function BatchMonitor() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBatchStats();
    }, []);

    const fetchBatchStats = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/patients/batches/status`);
            const data = await response.json();
            setStats(data.stats);
        } catch (error) {
            console.error('Error fetching batch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <CircularProgress />;
    }

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Batch Processing Monitor</Typography>
            {stats && (
                <Box>
                    <Typography>Total Batches: {stats.totalBatches}</Typography>
                    <Typography>Total Patients: {stats.totalPatients}</Typography>
                    <Typography variant="subtitle1" sx={{ mt: 2 }}>Recent Batches:</Typography>
                    {stats.recentBatches.map(batch => (
                        <Box key={batch._id} sx={{ mt: 1, p: 1, bgcolor: 'grey.100' }}>
                            <Typography>Batch ID: {batch._id}</Typography>
                            <Typography>Patients: {batch.patientsCount}</Typography>
                            <Typography>Time: {new Date(batch.timestamp).toLocaleString()}</Typography>
                        </Box>
                    ))}
                </Box>
            )}
        </Paper>
    );
}

export default BatchMonitor; 