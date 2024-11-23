const Authentication = artifacts.require("Authentication");

module.exports = async function(callback) {
  try {
    const auth = await Authentication.deployed();
    
    // Get the first account from Ganache
    const accounts = await web3.eth.getAccounts();
    const userAddress = accounts[0];  // This should match your MetaMask account
    
    // Register the user as a doctor
    await auth.registerUser(userAddress, "doctor");
    
    console.log(`Successfully registered user ${userAddress} as doctor`);
    
  } catch (error) {
    console.error("Error registering user:", error);
  }
  callback();
}; 