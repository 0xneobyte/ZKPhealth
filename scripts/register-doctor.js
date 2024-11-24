const Web3 = require('web3');
const Authentication = require('../build/contracts/Authentication.json');

async function registerDoctor() {
    try {
        const web3 = new Web3('http://127.0.0.1:7545');
        const accounts = await web3.eth.getAccounts();
        
        const admin = accounts[0];  // Contract owner/admin
        const doctorAddress = '0x91B8B2b45C9Fd04b165ff7a4523328394E1c60E6';  // Your doctor address
        
        console.log('Admin address:', admin);
        console.log('Doctor address:', doctorAddress);
        
        const contractAddress = '0xA222CB99c519C02a097753622B02A237CB983a59';  // Updated contract address
        console.log('Contract address:', contractAddress);
        
        const contract = new web3.eth.Contract(
            Authentication.abi,
            contractAddress
        );
        
        // First check if doctor is already registered
        const isRegistered = await contract.methods.isUserRegistered(doctorAddress).call();
        console.log('Is doctor registered:', isRegistered);
        
        if (!isRegistered) {
            console.log('Registering doctor...');
            const tx = await contract.methods.registerDoctor(doctorAddress).send({
                from: admin,
                gas: 200000
            });
            console.log('Doctor registration transaction:', tx);
            console.log('Doctor registered successfully');
        } else {
            console.log('Doctor already registered');
            const role = await contract.methods.getUserRole(doctorAddress).call();
            console.log('Doctor role:', role);
        }
        
    } catch (error) {
        console.error('Error registering doctor:', error);
    }
}

registerDoctor(); 