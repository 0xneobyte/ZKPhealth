import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    Container
} from '@mui/material';

const TwoFactorAuth = ({ onVerify, onCancel }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (code.length !== 6) {
                throw new Error('Code must be 6 digits');
            }
            await onVerify(code);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8 }}>
                <Paper sx={{ p: 4 }}>
                    <Typography variant="h5" align="center" gutterBottom>
                        Two-Factor Authentication
                    </Typography>
                    <Typography variant="body1" align="center" gutterBottom>
                        Please enter the 6-digit code
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Verification Code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            margin="normal"
                            type="number"
                            error={!!error}
                            helperText={error}
                        />
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                            <Button onClick={onCancel} variant="outlined">
                                Cancel
                            </Button>
                            <Button type="submit" variant="contained" color="primary">
                                Verify
                            </Button>
                        </Box>
                    </form>
                </Paper>
            </Box>
        </Container>
    );
};

export default TwoFactorAuth; 