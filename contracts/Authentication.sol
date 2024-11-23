// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Authentication {
    struct User {
        bool isRegistered;
        string role;
        uint256 lastLogin;
        bool is2FAEnabled;
        bytes32 twoFactorSecret;
    }
    
    mapping(address => User) public users;
    mapping(address => bool) public pendingTwoFactorAuth;
    
    event UserRegistered(address indexed userAddress, string role);
    event UserLoggedIn(address indexed userAddress, uint256 timestamp);
    event TwoFactorEnabled(address indexed userAddress);
    
    function registerUser(address _userAddress, string memory _role) public {
        require(!users[_userAddress].isRegistered, "User already registered");
        
        users[_userAddress] = User({
            isRegistered: true,
            role: _role,
            lastLogin: 0,
            is2FAEnabled: false,
            twoFactorSecret: bytes32(0)
        });
        
        emit UserRegistered(_userAddress, _role);
    }
    
    function enable2FA(bytes32 _secret) public {
        require(users[msg.sender].isRegistered, "User not registered");
        require(!users[msg.sender].is2FAEnabled, "2FA already enabled");
        
        users[msg.sender].is2FAEnabled = true;
        users[msg.sender].twoFactorSecret = _secret;
        
        emit TwoFactorEnabled(msg.sender);
    }
    
    function initiateLogin() public {
        require(users[msg.sender].isRegistered, "User not registered");
        if (users[msg.sender].is2FAEnabled) {
            pendingTwoFactorAuth[msg.sender] = true;
        } else {
            users[msg.sender].lastLogin = block.timestamp;
            emit UserLoggedIn(msg.sender, block.timestamp);
        }
    }
    
    function complete2FALogin(string memory _code) public {
        require(pendingTwoFactorAuth[msg.sender], "No pending 2FA login");
        require(users[msg.sender].is2FAEnabled, "2FA not enabled");
        
        // In a real implementation, we would verify the code here
        // For this demo, we'll accept any non-empty code
        require(bytes(_code).length > 0, "Invalid 2FA code");
        
        pendingTwoFactorAuth[msg.sender] = false;
        users[msg.sender].lastLogin = block.timestamp;
        emit UserLoggedIn(msg.sender, block.timestamp);
    }
    
    function isUserRegistered(address _userAddress) public view returns (bool) {
        return users[_userAddress].isRegistered;
    }
    
    function getUserRole(address _userAddress) public view returns (string memory) {
        require(users[_userAddress].isRegistered, "User not registered");
        return users[_userAddress].role;
    }
    
    function is2FAEnabled(address _userAddress) public view returns (bool) {
        return users[_userAddress].is2FAEnabled;
    }
} 