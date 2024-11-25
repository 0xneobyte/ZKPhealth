const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const twoFactorRoutes = require('./routes/twoFactor');
const errorHandler = require('./middleware/errorHandler');

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

// Update CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

// Add health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/patients', patientRoutes);
app.use('/2fa', twoFactorRoutes);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 