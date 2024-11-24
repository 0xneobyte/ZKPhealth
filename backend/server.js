const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection with logging
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-zkp')
    .then(() => {
        console.log('Successfully connected to MongoDB.');
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });

// Add connection error handling
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.once('open', () => {
    console.log('MongoDB database connection established successfully');
});

// Routes with logging
app.use('/auth', authRoutes);
app.use('/patients', patientRoutes);

// Add a test route
app.get('/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 