// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Authentication {
    struct User {
        bool isRegistered;
        string role;
        uint256 lastLogin;
    }
    
    mapping(address => User) public users;
    
    event UserRegistered(address indexed userAddress, string role);
    event UserLoggedIn(address indexed userAddress, uint256 timestamp);
    
    function registerUser(address _userAddress, string memory _role) public {
        require(!users[_userAddress].isRegistered, "User already registered");
        
        users[_userAddress] = User({
            isRegistered: true,
            role: _role,
            lastLogin: 0
        });
        
        emit UserRegistered(_userAddress, _role);
    }
    
    function login() public {
        require(users[msg.sender].isRegistered, "User not registered");
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
} 