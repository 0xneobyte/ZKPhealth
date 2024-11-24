const Web3 = require('web3');
const fetch = require('node-fetch');
const Authentication = require('../build/contracts/Authentication.json');
require('dotenv').config();

async function cleanAndRegisterDoctor() {
    try {
        const web3 = new Web3('http://127.0.0.1:7545');
        const accounts = await web3.eth.getAccounts();
        
        const admin = accounts[0];
        const doctorAddress = accounts[1];
        
        console.log('Admin address:', admin);
        console.log('Doctor address:', doctorAddress);
        
        // 1. Clear MongoDB records
        console.log('\nClearing MongoDB records...');
        try {
            await fetch(`http://localhost:3001/auth/users/${doctorAddress}`, {
                method: 'DELETE'
            });
            console.log('Cleared existing MongoDB record');
        } catch (error) {
            console.log('No MongoDB record to clear');
        }

        // 2. Deploy new contract
        console.log('\nDeploying new contract...');
        const Contract = new web3.eth.Contract(Authentication.abi);
        const deploy = Contract.deploy({
            data: Authentication.bytecode
        });
        
        const newContract = await deploy.send({
            from: admin,
            gas: 3000000
        });
        
        console.log('New contract deployed at:', newContract.options.address);

        // 3. Register doctor
        console.log('\nRegistering doctor...');
        await newContract.methods.registerDoctor(doctorAddress).send({
            from: admin,
            gas: 200000
        });

        // 4. Create MongoDB record
        console.log('\nCreating MongoDB record...');
        const response = await fetch('http://localhost:3001/auth/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                walletAddress: doctorAddress.toLowerCase(),
                role: 'doctor',
                is2FAEnabled: false
            })
        });

        if (response.ok) {
            console.log('MongoDB record created successfully');
        } else {
            throw new Error('Failed to create MongoDB record');
        }

        console.log('\nIMPORTANT: Update your .env file with:');
        console.log(`REACT_APP_CONTRACT_ADDRESS=${newContract.options.address}`);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

cleanAndRegisterDoctor(); 