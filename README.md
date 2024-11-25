1. npm install

2. Start Ganache:
- Download and install Ganache
- Create new workspace
- Keep Ganache running

3. Run the setup script:
  node scripts/setup-roles.js

- Copy the displayed contract address
- Update .env with the new contract address
- Note down the account addresses and their roles


4. Import accounts to MetaMask:
- Add Ganache network to MetaMask:
  - Network Name: Ganache
  - RPC URL: http://127.0.0.1:7545
  - Chain ID: 1337
  - Currency: ETH

- Import accounts from Ganache in order:
  1. First account = Admin
  2. Second account = Doctor
  3. Third account = Insurance Provider

5. Start the backend:
  cd backend
npm start

6. Start the frontend:
  npm start


## Account Roles
- Account #1: Admin (can add doctors)
- Account #2: Doctor (can add patients)
- Account #3: Insurance Provider
- Account #4+: Patients

## Important Notes
- Always use accounts in the same order from Ganache
- Admin must be the first account
- Doctor must be the second account
