const Web3 = require('web3');
const Authentication = require('../build/contracts/Authentication.json');
require('dotenv').config();

async function reset2FA() {
    try {
        const web3 = new Web3('http://127.0.0.1:7545');
        const accounts = await web3.eth.getAccounts();
        const doctorAddress = accounts[1];
        
        const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
        console.log('Contract address:', contractAddress);
        
        if (!contractAddress) {
            throw new Error('Contract address not found in .env');
        }
        
        const contract = new web3.eth.Contract(
            Authentication.abi,
            contractAddress
        );
        
        console.log('Disabling 2FA for address:', doctorAddress);
        const tx = await contract.methods.disable2FA().send({
            from: doctorAddress,
            gas: 200000
        });
        
        console.log('2FA disabled successfully');
        console.log('Transaction:', tx);
        
        try {
            const response = await fetch(`http://localhost:3001/auth/users/${doctorAddress}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    is2FAEnabled: false,
                    totpSecret: null
                })
            });
            
            if (response.ok) {
                console.log('MongoDB 2FA data cleared');
            }
        } catch (error) {
            console.log('Error clearing MongoDB data:', error);
        }
        
    } catch (error) {
        console.error('Error resetting 2FA:', error);
    }
}

reset2FA(); 