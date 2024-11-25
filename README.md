# Healthcare ZKP System

A privacy-preserving healthcare system using Zero-Knowledge Proofs (ZKP) for secure blood pressure verification.

## Features
- Role-based authentication (Admin/Doctor/Insurance Provider)
- ZKP implementation for blood pressure range verification
- Privacy-preserving insurance claim system
- Admin dashboard for user management
- Doctor dashboard for patient registration and claims
- Insurance dashboard for claim verification

## Prerequisites
- Node.js (v14+ recommended)
- MongoDB (v4.4+ recommended)
- Ganache (for local blockchain)
- MetaMask browser extension
- Git
- Circom (for ZKP circuit compilation)

## Installation & Setup

1. **Clone and Install Dependencies**

### Install root project dependencies
- npm install

### Install backend dependencies
- cd backend
- npm install

### Install frontend dependencies
- cd frontend
- npm install  

### Install Circom globally
- npm install -g circom

### ZKP Circuit Setup
- cd circuits
- circom bloodPressureRange.circom --r1cs --wasm --sym

### Setup Script
- cd backend
- node scripts/setup-complete.js

This will:
- Compile the ZKP circuit
- Generate proving/verification keys
- Set up the ZKP system

4. **Start Ganache**:
- Download and install Ganache
- Create new workspace
- Keep Ganache running

5. **Run the Setup Script**
- node scripts/setup-roles.js
- Copy the displayed contract address
- Update .env with the new contract address
- Note down the account addresses and their roles

6. **Configure MetaMask**:
- Add Ganache network to MetaMask:
  - Network Name: Ganache
  - RPC URL: http://127.0.0.1:7545
  - Chain ID: 1337
  - Currency: ETH

- Import accounts from Ganache in order:
  1. First account = Admin
  2. Second account = Doctor
  3. Third account = Insurance Provider

7. **Start the Application**:
- Start mongodb
- cd backend/node server.js
- npm start on root folder to start the frontend


## Account Roles and Access
- Account #1: Admin (can manage users)
- Account #2: Doctor (can submit claims)
- Account #3: Insurance Provider (can verify claims)

## Testing the System

1. **Test ZKP Implementation**
- cd backend
- node scripts/test-zkp.js



2. **Test as Doctor**:
- Login with doctor account (Account #2)
- Submit claims with different blood pressure values:
  - BP = 130 (should be eligible)
  - BP = 150 (should not be eligible)

3. **Test as Insurance Provider**:
- Login with insurance account (Account #3)
- View submitted claims
- Verify proofs using "Verify Proof" button
- Note that actual BP values are hidden

## Important Notes
- Always use accounts in the same order from Ganache
- Admin must be the first account
- Doctor must be the second account
- Insurance provider must be the third account
- MongoDB must be running before starting the backend
- Ganache must be running before starting the application
- MetaMask must be connected to Ganache network

## Troubleshooting

1. **MetaMask Connection Issues**:
- Ensure Ganache is running
- Verify network configuration in MetaMask
- Check if correct account is selected

2. **MongoDB Connection Issues**:
- Verify MongoDB service is running
- Check connection string in .env
- Ensure database permissions are correct

3. **ZKP Verification Issues**:
- Run setup-complete.js again
- Check if circuit compilation was successful
- Verify proof generation parameters

## Security Features
- ZKP for data privacy
- Role-based access control
- JWT authentication
- Encrypted data storage
- Two-factor authentication support

## Technical Stack
- Frontend: React, Material-UI
- Backend: Node.js, Express
- Database: MongoDB
- Blockchain: Ethereum (Ganache)
- ZKP: Circom, SnarkJS
- Authentication: JWT, MetaMask

