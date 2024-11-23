const Web3 = require('web3');
const { artifacts } = require('truffle');
const Authentication = artifacts.require("Authentication");

module.exports = async function(callback) {
  try {
    // Initialize web3
    const web3 = new Web3('http://127.0.0.1:7545');
    
    const auth = await Authentication.deployed();
    console.log('Contract address:', auth.address);
    
    // Get accounts from web3
    const accounts = await web3.eth.getAccounts();
    const userAddress = accounts[0];
    
    console.log('Attempting to register user:', userAddress);
    
    // Check if user is already registered
    const isRegistered = await auth.isUserRegistered(userAddress);
    console.log('Is user already registered?', isRegistered);
    
    if (isRegistered) {
      console.log('User already registered');
      callback();
      return;
    }
    
    // Register the user as a doctor
    console.log('Registering user...');
    const tx = await auth.registerUser(userAddress, "doctor", { from: userAddress });
    console.log('Registration transaction:', tx);
    
    // Verify registration
    const verifyRegistration = await auth.isUserRegistered(userAddress);
    console.log('Registration verified:', verifyRegistration);
    
    const role = await auth.getUserRole(userAddress);
    console.log('User role:', role);
    
    console.log(`Successfully registered user ${userAddress} as doctor`);
    
  } catch (error) {
    console.error("Error registering user:", error);
  }
  callback();
}; 