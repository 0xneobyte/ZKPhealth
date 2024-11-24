const Web3 = require('web3');
const Authentication = require('../build/contracts/Authentication.json');

async function checkUser() {
    try {
        const web3 = new Web3('http://127.0.0.1:7545');
        const accounts = await web3.eth.getAccounts();
        const doctorAddress = '0x91B8B2b45C9Fd04b165ff7a4523328394E1c60E6';
        
        const contractAddress = '0xA222CB99c519C02a097753622B02A237CB983a59';
        console.log('Contract address:', contractAddress);
        
        const contract = new web3.eth.Contract(
            Authentication.abi,
            contractAddress
        );
        
        console.log('Checking address:', doctorAddress);
        
        const isRegistered = await contract.methods.isUserRegistered(doctorAddress).call();
        console.log('Is registered:', isRegistered);
        
        if (isRegistered) {
            const role = await contract.methods.getUserRole(doctorAddress).call();
            console.log('Current role:', role);
        }
        
    } catch (error) {
        console.error('Error checking user:', error);
    }
}

checkUser(); 