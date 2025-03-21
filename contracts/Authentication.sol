// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Authentication {
    struct User {
        bool isRegistered;
        string role;
        uint256 lastLogin;
        bool is2FAEnabled;
        bytes32 twoFactorSecret;
        uint256 lastTOTPTimestamp;
    }
    
    mapping(address => User) public users;
    mapping(address => bool) public pendingTwoFactorAuth;
    address public owner;
    
    event UserRegistered(address indexed userAddress, string role);
    event UserLoggedIn(address indexed userAddress, uint256 timestamp);
    event TwoFactorEnabled(address indexed userAddress);
    event TwoFactorDisabled(address indexed userAddress);
    event TwoFactorLoginInitiated(address indexed userAddress);
    event TwoFactorLoginCompleted(address indexed userAddress);
    event PatientRecordCreated(
        address indexed patientAddress,
        string patientId,
        address indexed doctorAddress,
        uint256 timestamp
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    modifier onlyAdminOrDoctor() {
        require(
            users[msg.sender].isRegistered && 
            (keccak256(bytes(users[msg.sender].role)) == keccak256(bytes("admin")) ||
             keccak256(bytes(users[msg.sender].role)) == keccak256(bytes("doctor"))),
            "Only admin or doctor can call this"
        );
        _;
    }
    
    modifier onlyRegistered() {
        require(users[msg.sender].isRegistered, "User not registered");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        // Register owner as admin
        users[msg.sender] = User({
            isRegistered: true,
            role: "admin",
            lastLogin: 0,
            is2FAEnabled: false,
            twoFactorSecret: bytes32(0),
            lastTOTPTimestamp: 0
        });
    }
    
    // Only admin/doctor can register new users
    function registerUser(address _userAddress, string memory _role) public onlyAdminOrDoctor {
        require(!users[_userAddress].isRegistered, "User already registered");
        require(
            keccak256(bytes(_role)) == keccak256(bytes("patient")) ||
            keccak256(bytes(_role)) == keccak256(bytes("doctor")) ||
            keccak256(bytes(_role)) == keccak256(bytes("insurance")),
            "Invalid role"
        );
        
        users[_userAddress] = User({
            isRegistered: true,
            role: _role,
            lastLogin: 0,
            is2FAEnabled: false,
            twoFactorSecret: bytes32(0),
            lastTOTPTimestamp: 0
        });
        
        emit UserRegistered(_userAddress, _role);
    }
    
    // Only owner can register doctors/admins
    function registerDoctor(address _doctorAddress) public onlyOwner {
        require(!users[_doctorAddress].isRegistered, "User already registered");
        
        users[_doctorAddress] = User({
            isRegistered: true,
            role: "doctor",
            lastLogin: 0,
            is2FAEnabled: false,
            twoFactorSecret: bytes32(0),
            lastTOTPTimestamp: 0
        });
        
        emit UserRegistered(_doctorAddress, "doctor");
    }
    
    function enable2FA(bytes32 _hashedSecret) external onlyRegistered {
        require(!users[msg.sender].is2FAEnabled, "2FA already enabled");
        
        users[msg.sender].is2FAEnabled = true;
        users[msg.sender].twoFactorSecret = _hashedSecret;
        users[msg.sender].lastTOTPTimestamp = 0;
        
        emit TwoFactorEnabled(msg.sender);
    }
    
    function disable2FA() external onlyRegistered {
        require(users[msg.sender].is2FAEnabled, "2FA not enabled");
        
        users[msg.sender].is2FAEnabled = false;
        users[msg.sender].twoFactorSecret = bytes32(0);
        users[msg.sender].lastTOTPTimestamp = 0;
        pendingTwoFactorAuth[msg.sender] = false;
        
        emit TwoFactorDisabled(msg.sender);
    }
    
    function initiateLogin() external onlyRegistered {
        require(users[msg.sender].is2FAEnabled, "2FA not enabled for user");
        require(!pendingTwoFactorAuth[msg.sender], "Login already initiated");
        
        pendingTwoFactorAuth[msg.sender] = true;
        emit TwoFactorLoginInitiated(msg.sender);
    }
    
    function complete2FALogin(string memory _code) external onlyRegistered {
        require(pendingTwoFactorAuth[msg.sender], "No pending 2FA login");
        require(users[msg.sender].is2FAEnabled, "2FA not enabled");
        require(bytes(_code).length == 6, "Invalid code length");
        
        // In production, you'd verify the TOTP here
        // For now, we just check the code length and update state
        
        pendingTwoFactorAuth[msg.sender] = false;
        users[msg.sender].lastLogin = block.timestamp;
        users[msg.sender].lastTOTPTimestamp = block.timestamp;
        
        emit TwoFactorLoginCompleted(msg.sender);
        emit UserLoggedIn(msg.sender, block.timestamp);
    }
    
    function verifyTOTP(address userAddress, string memory code) internal view returns (bool) {
        require(users[userAddress].twoFactorSecret != bytes32(0), "2FA secret not set");
        
        bytes memory codeBytes = bytes(code);
        return codeBytes.length > 0;
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
    
    struct PatientRecord {
        string patientId;
        string patientName;
        uint256 age;
        string gender;
        string clinicalDescription;
        string disease;
        uint256 timestamp;
        address doctorAddress;
        bool isActive;
    }
    
    mapping(address => PatientRecord) public patientRecords;
    mapping(address => address[]) public doctorPatients;  // doctor -> their patients
    
    function registerPatientRecord(
        string memory _patientId,
        string memory _patientName,
        uint256 _age,
        string memory _gender,
        string memory _clinicalDescription,
        string memory _disease
    ) public {
        require(
            keccak256(bytes(users[msg.sender].role)) == keccak256(bytes("doctor")) ||
            keccak256(bytes(users[msg.sender].role)) == keccak256(bytes("admin")),
            "Only doctors or admins can register patients"
        );

        PatientRecord memory newRecord = PatientRecord({
            patientId: _patientId,
            patientName: _patientName,
            age: _age,
            gender: _gender,
            clinicalDescription: _clinicalDescription,
            disease: _disease,
            timestamp: block.timestamp,
            doctorAddress: msg.sender,
            isActive: true
        });

        patientRecords[msg.sender] = newRecord;
        doctorPatients[msg.sender].push(msg.sender);

        emit PatientRecordCreated(msg.sender, _patientId, msg.sender, block.timestamp);
    }
} 