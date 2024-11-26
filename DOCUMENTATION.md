## Workflow 
```mermaid
graph TB
    subgraph Frontend
        Login[Login Component]
        Doc[Doctor Dashboard]
        Ins[Insurance Dashboard]
        Admin[Admin Dashboard]
    end

    subgraph Backend
        Auth[Authentication]
        ZKP[ZKP Circuit]
        API[API Routes]
    end

    subgraph Storage
        BC[Blockchain]
        DB[(MongoDB)]
    end

    Login --> Auth
    Auth --> BC
    Doc --> ZKP
    ZKP --> API
    API --> DB
    Ins --> API
    Admin --> API
```


## Components Breakdown

### 1. User Roles
We have three types of users:
```mermaid
graph LR
A[Users] --> B[Admin]
A --> C[Doctor]
A --> D[Insurance Provider]
B --> B1[Manage Users]
C --> C1[Submit Claims]
C --> C2[Add Patients]
D --> D1[Verify Claims]
```


#### Admin
- Can manage system users
- View all registered users
- Enable/disable features

#### Doctor
- Register patients
- Submit blood pressure claims
- View patient history

#### Insurance Provider
- View claims
- Verify eligibility
- Cannot see actual blood pressure values

### 2. Privacy Protection (ZKP Flow)
```mermaid
sequenceDiagram
participant D as Doctor
participant Z as ZKP System
participant I as Insurance
Note over D,I: Blood Pressure Check Process
D->>Z: Submit BP (e.g., 135)
Z->>Z: Generate Proof
Note over Z: Checks if BP is between 120-140
Z-->>D: Return Proof
D->>I: Submit Claim (No BP Value)
Note over I: Can only see if BP is in range
I->>Z: Verify Proof
Z-->>I: Confirm Validity
```

```mermaid
sequenceDiagram
    participant Doctor
    participant ZKP Circuit
    participant Smart Contract
    participant Insurance
    participant MongoDB

    Note over Doctor,Insurance: Blood Pressure Range Check (120-140)
    
    Doctor->>ZKP Circuit: Input: 
    Note over ZKP Circuit: Private Input: BP Value (e.g., 135)
    Note over ZKP Circuit: Public Input: Range [120,140]
    
    ZKP Circuit->>ZKP Circuit: Generate Proof
    Note over ZKP Circuit: 1. Check if BP in range
    Note over ZKP Circuit: 2. Create ZK proof
    Note over ZKP Circuit: 3. Hide actual BP value
    
    ZKP Circuit-->>Doctor: Return: {proof, isValid}
    
    Doctor->>MongoDB: Store Claim
    Note over MongoDB: Store:
    Note over MongoDB: - BP: "HIDDEN"
    Note over MongoDB: - zkProof
    Note over MongoDB: - isEligible
    
    Insurance->>MongoDB: Request Claim
    MongoDB-->>Insurance: Return Claim Data
    Note over Insurance: Can see:
    Note over Insurance: - Eligibility
    Note over Insurance: - Proof
    Note over Insurance: Cannot see:
    Note over Insurance: - Actual BP value
    
    Insurance->>ZKP Circuit: Verify Proof
    ZKP Circuit-->>Insurance: Verification Result
```


### 3. Technical Components

#### Frontend Components
1. **Login Component** (`src/components/auth/Login.js`)
   - Handles user authentication
   - Connects to MetaMask
   - Redirects based on role

2. **Doctor Dashboard** (`src/components/dashboard/Dashboard.js`)
   ```javascript
   // Key features
   - Submit claims
   - Register patients
   - View history
   ```

3. **Insurance Dashboard** (`src/components/insurance/InsuranceDashboard.js`)
   ```javascript
   // Key features
   - View claims
   - Verify proofs
   - Track eligibility
   ```

#### Backend Components
1. **ZKP Circuit** (`backend/circuits/bloodPressureRange.circom`)
   ```circom
   // Simplified version of our ZKP circuit
   template RangeCheck() {
       signal private input bloodPressure;
       signal input minRange;
       signal input maxRange;
       signal output inRange;
   }
   ```

2. **API Routes** (`backend/routes/`)
   - Authentication
   - Claims processing
   - User management

### 4. Data Flow
```mermaid
graph LR
subgraph Doctor Actions
A[Input BP] --> B[Generate Proof]
B --> C[Submit Claim]
end
subgraph Storage
C --> D[(MongoDB)]
C --> E[Blockchain]
end
subgraph Insurance Actions
D --> F[View Claim]
F --> G[Verify Proof]
end
```


### 5. Privacy Features

1. **Zero-Knowledge Proofs**
   - Proves BP is in range without revealing actual value
   - Uses cryptographic techniques
   - Mathematically verifiable

2. **Data Protection**
   ```javascript
   // Example of how data is stored
   {
       patientId: "DM-001",
       bloodPressure: "HIDDEN",
       zkProof: "proof_data",
       isEligible: true
   }
   ```

### 6. Smart Contract Integration
```mermaid
graph TB
A[User] --> B[MetaMask]
B --> C[Smart Contract]
C --> D[Role Management]
C --> E[Access Control]
C --> F[Verification]
```


### 7. How to Use

#### For Doctors:
1. Login with MetaMask
2. Navigate to Dashboard
3. Enter patient's blood pressure
4. Submit claim
5. System generates proof automatically

#### For Insurance Providers:
1. Login with MetaMask
2. View submitted claims
3. Verify proofs
4. See eligibility without actual values

## Security Considerations

1. **Privacy**
   - Blood pressure values never stored
   - Only proofs and eligibility stored
   - Zero-knowledge verification

2. **Access Control**
   - Role-based access
   - Smart contract enforcement
   - Secure authentication

## Technical Requirements
- Node.js
- MongoDB
- MetaMask
- Web3 compatibility




