const Web3 = require('web3');
const Authentication = require('../build/contracts/Authentication.json');
const fetch = require('node-fetch');

async function createMongoDBUser(address, role) {
  try {
    const response = await fetch('http://localhost:3001/auth/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        walletAddress: address.toLowerCase(),
        role: role,
        is2FAEnabled: false
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create MongoDB user: ${await response.text()}`);
    }
    console.log(`MongoDB user created for ${role}`);
  } catch (error) {
    console.error(`Error creating MongoDB user for ${role}:`, error);
  }
}

async function setupRoles() {
  try {
    const web3 = new Web3('http://127.0.0.1:7545');
    const accounts = await web3.eth.getAccounts();

    console.log('\nGanache Accounts and Roles:');
    console.log('============================');
    console.log(`Admin Account:     ${accounts[0]}`);
    console.log(`Doctor Account:    ${accounts[1]}`);
    console.log(`Insurance Account: ${accounts[2]}`);
    console.log(`Patient Account:   ${accounts[3]}`);

    // Deploy new contract
    console.log('\nDeploying new contract...');
    const Contract = new web3.eth.Contract(Authentication.abi);
    const deploy = Contract.deploy({
      data: Authentication.bytecode
    });
    
    const newContract = await deploy.send({
      from: accounts[0],
      gas: 3000000
    });

    console.log(`Contract deployed at: ${newContract.options.address}`);

    // Register users in contract and MongoDB
    console.log('\nRegistering users in contract and MongoDB...');
    
    // Admin is automatically registered in contract constructor
    console.log('Admin already registered (constructor)');
    await createMongoDBUser(accounts[0], 'admin');
    
    // Register doctor
    await newContract.methods.registerUser(accounts[1], "doctor").send({
      from: accounts[0],
      gas: 200000
    });
    console.log('Doctor registered in contract');
    await createMongoDBUser(accounts[1], 'doctor');

    // Register insurance provider
    await newContract.methods.registerUser(accounts[2], "insurance").send({
      from: accounts[0],
      gas: 200000
    });
    console.log('Insurance provider registered in contract');
    await createMongoDBUser(accounts[2], 'insurance');

    console.log('\nUpdate your .env file with:');
    console.log(`REACT_APP_CONTRACT_ADDRESS=${newContract.options.address}`);

  } catch (error) {
    console.error('Setup error:', error);
  }
}

setupRoles(); 