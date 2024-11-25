# Healthcare Blockchain System, Privacy Preserving Solution
This document details a healthcare system leveraging Zero-Knowledge Proofs (ZKPs) to securely verify blood pressure readings while maintaining patient privacy.

## Key Features

* **Role-Based Access Control:**  Strict access control for Administrators, Doctors, and Insurance Providers.
* **Secure Blood Pressure Verification:**  ZKP implementation ensures only the validity of blood pressure readings (within a specified range) is revealed, not the actual values.
* **Privacy-Preserving Claims System:**  Insurance claims are processed while protecting sensitive patient data.
* **Intuitive Dashboards:**  Dedicated dashboards for Admins (user management), Doctors (patient registration and claim submission), and Insurance Providers (claim verification).

## System Requirements

* **Node.js:** v14 or higher
* **MongoDB:** v4.4 or higher
* **Ganache:** Local blockchain emulator (for development)
* **MetaMask:** Browser extension for interacting with Ganache.
* **Git:** Version control system.
* **Circom:**  For compiling ZKP circuits.


## Installation and Setup

1. **Clone and Install Dependencies:**

   ```bash
   git clone <repository_url>
   cd <project_directory>
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   npm install -g circom
   ```

2. **ZKP Circuit Setup:**

   ```bash
   cd circuits
   circom bloodPressureRange.circom --r1cs --wasm --sym
   ```

3. **Backend Setup:**

   ```bash
   cd backend
   node scripts/setup-complete.js  // Compiles circuit, generates keys, sets up the ZKP system
   node scripts/setup-roles.js    // Deploys contracts;  **Note the contract address displayed.**
   ```

4. **Environment Configuration:** Update the `.env` file with the contract address obtained from step 3.  Also note the account addresses and their assigned roles.


5. **Ganache Setup:**

   * Download and install Ganache.
   * Create a new workspace.
   * **Keep Ganache running throughout the process.**

6. **MetaMask Configuration:**

   * Add the Ganache network to MetaMask:
      * Network Name: Ganache
      * RPC URL: `http://127.0.0.1:7545`
      * Chain ID: 1337
      * Currency: ETH
   * Import accounts from Ganache in the following order:
      1. Admin
      2. Doctor
      3. Insurance Provider

7. **Start the Application:**

   * Start MongoDB.
   * In the backend directory: `node server.js`
   * In the root directory: `npm start` (to start the frontend)


## Account Roles and Permissions

| Account # | Role           | Permissions                                      |
|-----------|-----------------|--------------------------------------------------|
| 1         | Admin           | User management                                   |
| 2         | Doctor          | Patient registration, claim submission            |
| 3         | Insurance Provider | Claim verification                               |


**Important:**  Maintain the order of accounts from Ganache (Admin, Doctor, Insurance Provider).


## Testing the System

1. **ZKP Test:** `cd backend && node scripts/test-zkp.js`

2. **Doctor Workflow:**
   * Log in as the Doctor (Account #2).
   * Submit claims with varying blood pressure values (e.g., 130, 150).  Observe eligibility based on the defined range.

3. **Insurance Provider Workflow:**
   * Log in as the Insurance Provider (Account #3).
   * Review submitted claims.
   * Verify proofs using the "Verify Proof" button.  Note that the actual blood pressure values remain hidden.


## Troubleshooting

* **MetaMask Connection:** Ensure Ganache is running, network settings in MetaMask are correct, and the appropriate account is selected.
* **MongoDB Connection:** Verify MongoDB is running, the connection string in `.env` is accurate, and database permissions are correctly configured.
* **ZKP Verification:** Re-run `setup-complete.js`, check circuit compilation logs, and review proof generation parameters.


## Security Considerations

* **Zero-Knowledge Proofs:**  Fundamental for data privacy.
* **Role-Based Access Control:**  Limits access based on roles.
* **JWT Authentication:**  Secure authentication mechanism.
* **Encrypted Data Storage:**  Protects data at rest.
* **(Future) Two-Factor Authentication:**  Enhanced