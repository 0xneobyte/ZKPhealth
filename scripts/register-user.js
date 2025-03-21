const Web3 = require('web3');
const fetch = require('node-fetch');

// Get contract ABI
const Authentication = require('../build/contracts/Authentication.json');

async function resetUser() {
    try {
        const web3 = new Web3('http://127.0.0.1:7545');
        
        // Get accounts
        const accounts = await web3.eth.getAccounts();
        const userAddress = accounts[0];
        
        console.log('Resetting user:', userAddress);

        // Deploy new contract
        console.log('Deploying new contract...');
        const Contract = new web3.eth.Contract(Authentication.abi);
        const deploy = Contract.deploy({
            data: Authentication.bytecode
        });
        
        const newContract = await deploy.send({
            from: userAddress,
            gas: 3000000
        });
        
        console.log('New contract deployed at:', newContract.options.address);

        // Clear old MongoDB record
        try {
            console.log('Clearing old MongoDB record...');
            await fetch(`http://localhost:3001/auth/users/${userAddress}`, {
                method: 'DELETE'
            });
            console.log('Old MongoDB record cleared');
        } catch (error) {
            console.log('No old MongoDB record to clear');
        }

        // Register user in contract
        console.log('Registering user in contract...');
        await newContract.methods.registerUser(userAddress, "doctor").send({ 
            from: userAddress,
            gas: 200000
        });

        // Create MongoDB record
        try {
            console.log('Creating MongoDB record...');
            const response = await fetch('http://localhost:3001/auth/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    walletAddress: userAddress,
                    role: 'doctor',
                    is2FAEnabled: false
                })
            });
            
            if (response.ok) {
                console.log('MongoDB record created successfully');
            } else {
                throw new Error('Failed to create MongoDB record');
            }
        } catch (error) {
            console.error('Error creating MongoDB record:', error);
            throw error;
        }
        
        // Verify final state
        const isRegistered = await newContract.methods.isUserRegistered(userAddress).call();
        const role = await newContract.methods.getUserRole(userAddress).call();
        const is2FAEnabled = await newContract.methods.is2FAEnabled(userAddress).call();
        
        console.log('\nFinal state:');
        console.log('- Contract Registration:', isRegistered);
        console.log('- Role:', role);
        console.log('- 2FA Enabled:', is2FAEnabled);
        
        console.log('\nIMPORTANT: Update your .env file with:');
        console.log(`REACT_APP_CONTRACT_ADDRESS=${newContract.options.address}`);
        
    } catch (error) {
        console.error("Error in setup:", error);
    }
}

resetUser(); 