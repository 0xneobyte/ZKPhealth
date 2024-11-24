const Web3 = require('web3');
const Authentication = require('../build/contracts/Authentication.json');
require('dotenv').config();

async function registerDoctor() {
    try {
        const web3 = new Web3('http://127.0.0.1:7545');
        const accounts = await web3.eth.getAccounts();
        
        const admin = accounts[0];  // Contract owner/admin
        const doctorAddress = accounts[1];  // Doctor to be registered
        
        console.log('Admin address:', admin);
        console.log('Doctor address:', doctorAddress);
        
        const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
        console.log('Contract address:', contractAddress);
        
        if (!contractAddress) {
            throw new Error('Contract address not found in .env');
        }
        
        const contract = new web3.eth.Contract(
            Authentication.abi,
            contractAddress
        );
        
        console.log('Registering doctor...');
        const tx = await contract.methods.registerDoctor(doctorAddress).send({
            from: admin,
            gas: 200000
        });
        
        console.log('Doctor registration transaction:', tx);
        console.log('Doctor registered successfully');
        
        try {
            const response = await fetch('http://localhost:3001/auth/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    walletAddress: doctorAddress,
                    role: 'doctor',
                    is2FAEnabled: false
                })
            });
            
            if (response.ok) {
                console.log('MongoDB record created for doctor');
            } else {
                console.error('Failed to create MongoDB record');
            }
        } catch (error) {
            console.error('Error creating MongoDB record:', error);
        }
        
    } catch (error) {
        console.error('Error registering doctor:', error);
    }
}

registerDoctor(); 