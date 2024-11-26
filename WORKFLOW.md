
# Healthcare System Workflow Documentation

## Overview
This system allows three types of users (Admin, Doctors, and Insurance Providers) to interact with patient data while keeping sensitive information private using special encryption methods.

## Key Components Explained

### 1. User Management (Authentication)
- Users log in using their digital wallet (MetaMask)
- Two-factor authentication (2FA) adds extra security (like having both a key and a password)
- Each user gets a specific role (Admin, Doctor, or Insurance Provider)

### 2. Different User Dashboards

#### Admin Dashboard
- What it does: Manages all users in the system
- Main features:
  - See all registered users
  - Manage user roles
  - Monitor system health

#### Doctor Dashboard
- What it does: Handles patient information and insurance claims
- Main features:
  - Register new patients
  - Submit blood pressure readings
  - Create insurance claims

#### Insurance Provider Dashboard
- What it does: Reviews and verifies claims
- Main features:
  - See submitted claims
  - Verify blood pressure readings without seeing actual values
  - Process claims

### 3. Privacy Protection System (ZKP - Zero-Knowledge Proofs)
- What it is: A way to prove something is true without revealing the actual information
- Example: 
  - A doctor can prove a patient's blood pressure is in a healthy range
  - The insurance company can verify this WITHOUT seeing the actual blood pressure numbers

### 4. How Data Flows

1. Patient Visit:
   - Doctor records patient's blood pressure
   - System creates a private proof of the reading

2. Claim Submission:
   - Doctor submits claim with the proof
   - Actual blood pressure numbers stay private

3. Claim Verification:
   - Insurance provider checks if blood pressure was in acceptable range
   - They can verify without seeing actual numbers

### 5. Technical Components Simplified

- Frontend: The screens users see and interact with
- Backend: The system that processes all requests
- Blockchain: Keeps record of all important transactions
- Database: Stores user information and claims
- ZKP System: Handles the private proof creation and verification

### 6. Security Features

1. Two-Factor Authentication (2FA):
   - Like having a second lock on your door
   - Even if someone gets your password, they can't get in

2. Digital Wallet Authentication:
   - Uses MetaMask for secure login
   - Like having a digital ID card

3. Role-Based Access:
   - Different users can only see what they're allowed to
   - Like having different keys for different rooms

## How to Use the System

1. First Time Setup:
   - Install MetaMask (digital wallet)
   - Get your account set up with the correct role
   - Set up two-factor authentication

2. Regular Usage:
   - Log in with MetaMask
   - Use 2FA code when prompted
   - Access your specific dashboard based on your role

## Common Terms Simplified

- MetaMask: A digital wallet that works like your ID card
- Blockchain: A secure digital record book
- ZKP (Zero-Knowledge Proof): A way to prove something without showing the actual information
- Smart Contract: Automated digital agreements
- Two-Factor Authentication (2FA): A second security check, like a backup password

## Important Notes

- Always keep your MetaMask information private
- Don't share your 2FA codes
- Log out when you're done using the system
- Report any unusual behavior to system administrators