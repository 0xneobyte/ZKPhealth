const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Import routes
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const twoFactorRoutes = require('./routes/twoFactor');
const insuranceRoutes = require('./routes/insurance');

dotenv.config();

const app = express();

// Set strictQuery to false to match test script behavior
mongoose.set('strictQuery', false);

// MongoDB Connection using the same settings as the test script
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-zkp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Add this after MongoDB connection
mongoose.connection.on('connected', () => {
    console.log('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

// Middleware
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Mount routes
if (authRoutes) app.use('/auth', authRoutes);
if (patientRoutes) app.use('/patients', patientRoutes);
if (twoFactorRoutes) app.use('/2fa', twoFactorRoutes);
if (insuranceRoutes) app.use('/insurance', insuranceRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        success: false, 
        message: err.message || 'Internal server error'
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 