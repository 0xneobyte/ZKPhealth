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

// Middleware
app.use(cors());
app.use(express.json());

// At the top of your file
mongoose.set('strictQuery', true);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes with logging
app.use('/auth', authRoutes);
app.use('/patients', patientRoutes);
app.use('/2fa', twoFactorRoutes);

// Add a test route
app.get('/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 