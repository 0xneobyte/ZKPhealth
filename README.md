# Healthcare ZKP System

## Setup Instructions

1. Install dependencies: 
npm install

2. Install and start Ganache:
- Download Ganache from https://trufflesuite.com/ganache/
- Create a new workspace
- Keep note of the RPC URL (usually http://127.0.0.1:7545)

3. Deploy the smart contract:
truffle migrate --network development


4. Copy the deployed contract address to .env file

5. Start the development server:
npm start



6. Make sure MetaMask is installed and connected to your local Ganache network:
- Add a new network in MetaMask:
  - Network Name: Ganache
  - RPC URL: http://127.0.0.1:7545
  - Chain ID: 1337
  - Currency Symbol: ETH

7. Import a Ganache account into MetaMask using the private key

The application should now be running at http://localhost:3000