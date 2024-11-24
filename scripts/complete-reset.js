const Web3 = require('web3');
const Authentication = require('../build/contracts/Authentication.json');
const fetch = require('node-fetch');
require('dotenv').config();

async function completeReset() {
    try {
        const web3 = new Web3('http://127.0.0.1:7545');
        const accounts = await web3.eth.getAccounts();
        const admin = accounts[0];
        const doctorAddress = accounts[1];
        
        console.log('Admin address:', admin);
        console.log('Doctor address:', doctorAddress);
        
        // 1. Clear MongoDB first
        console.log('\n1. Clearing MongoDB...');
        try {
            // Make sure backend is running first
            const testResponse = await fetch('http://localhost:3001/test');
            if (!testResponse.ok) {
                throw new Error('Backend server not responding');
            }
            
            // Delete all users first
            const deleteAllResponse = await fetch('http://localhost:3001/auth/users/all', {
                method: 'DELETE'
            });
            
            if (deleteAllResponse.ok) {
                console.log('All MongoDB records cleared');
                
                // Wait a bit to ensure deletion is complete
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                console.log('Failed to clear MongoDB:', await deleteAllResponse.text());
            }
        } catch (error) {
            console.log('Error with MongoDB operation:', error.message);
            console.log('Make sure your backend server is running on port 3001');
            return;
        }

        // 2. Deploy new contract
        console.log('\n2. Deploying new contract...');
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
        console.log('\n3. Registering doctor...');
        await newContract.methods.registerDoctor(doctorAddress).send({
            from: admin,
            gas: 200000
        });
        console.log('Doctor registered in contract');

        // 4. Create MongoDB record
        console.log('\n4. Creating MongoDB record...');
        try {
            // Create new record
            const createResponse = await fetch('http://localhost:3001/auth/users', {
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

            if (!createResponse.ok) {
                const errorText = await createResponse.text();
                throw new Error(`Failed to create MongoDB record: ${errorText}`);
            }
            console.log('MongoDB record created successfully');
        } catch (error) {
            console.error('Error creating MongoDB record:', error.message);
            return;
        }

        // 5. Verify final state
        console.log('\n5. Verifying final state...');
        const isRegistered = await newContract.methods.isUserRegistered(doctorAddress).call();
        const role = await newContract.methods.getUserRole(doctorAddress).call();
        const is2FAEnabled = await newContract.methods.is2FAEnabled(doctorAddress).call();
        
        console.log('Contract state:');
        console.log('- Registered:', isRegistered);
        console.log('- Role:', role);
        console.log('- 2FA Enabled:', is2FAEnabled);

        // 6. Instructions
        console.log('\nIMPORTANT: Update your .env file with:');
        console.log(`REACT_APP_CONTRACT_ADDRESS=${newContract.options.address}`);
        
        console.log('\nNext steps:');
        console.log('1. Update .env with the new contract address');
        console.log('2. Clear browser localStorage');
        console.log('3. Restart frontend application');
        
    } catch (error) {
        console.error('Error in reset:', error);
    }
}

completeReset(); 