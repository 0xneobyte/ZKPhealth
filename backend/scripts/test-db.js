const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function testDB() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-zkp');
        console.log('Connected to MongoDB successfully');

        // Create a test user
        const testUser = new User({
            walletAddress: '0x1a9023eeA7DED4d9cD4D4019c86D35A350E504d7',
            role: 'doctor',
            is2FAEnabled: false
        });

        // Save the user
        await testUser.save();
        console.log('Test user created successfully');

        // Verify by finding the user
        const foundUser = await User.findOne({ walletAddress: '0x1a9023eeA7DED4d9cD4D4019c86D35A350E504d7' });
        console.log('Found user:', foundUser);

        // List all users
        const allUsers = await User.find({});
        console.log('\nAll users in database:');
        console.log(allUsers);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

testDB(); 