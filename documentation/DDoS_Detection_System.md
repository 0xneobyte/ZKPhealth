# DDoS Detection System Documentation

This document provides a comprehensive overview of the DDoS detection system implemented in the ZKP Health platform. The system uses a hybrid approach combining rule-based detection and machine learning to identify and respond to Distributed Denial of Service (DDoS) attacks.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Packet Capture Process](#packet-capture-process)
3. [Rule-Based Detection](#rule-based-detection)
4. [Machine Learning Detection](#machine-learning-detection)
5. [Alert Generation and Storage](#alert-generation-and-storage)
6. [Admin Dashboard Integration](#admin-dashboard-integration)
7. [Training Data vs. Real-World Data](#training-data-vs-real-world-data)
8. [Recommendations for Improvement](#recommendations-for-improvement)

## System Architecture

The DDoS detection system consists of several interconnected components that work together to monitor, analyze, and respond to potential attacks.

```mermaid
flowchart TD
    subgraph "Client Requests"
        A[Legitimate Users] --> |HTTP Requests| B[Express Server]
        Z[Attackers] --> |DDoS Attack| B
    end

    subgraph "Backend Server"
        B --> C[trafficMonitor Middleware]
        C --> |Log Packets| D[global.packetLogs]
        C --> |Continue Request| E[Application Routes]

        %% Periodic Analysis
        F[30-second Interval Timer] --> |Trigger Analysis| G[Traffic Analysis]
        D --> |Provide Recent Packets| G

        %% Rule-based Detection
        G --> |Check Thresholds| H{Rule-based Detection}
        H --> |If Attack Detected| I[Generate Rule-based Alert]

        %% ML-based Detection
        G --> |Extract Features| J[Feature Extraction]
        J --> |Send Features| K[ML Model]
        K --> |Return Prediction| L{ML-based Detection}
        L --> |If Attack Detected| M[Generate ML-based Alert]
    end

    subgraph "Alert Storage"
        I --> |Store Alert| N[global.ddosAlerts]
        M --> |Store Alert| N
        I --> |Store Alert| O[mlSecurityAlerts]
        M --> |Store Alert| O
    end

    subgraph "Admin Dashboard"
        P[Admin UI] --> |Fetch Alerts| Q[/ml/dashboard API]
        Q --> |Return Alerts| P
        O --> |Provide Alerts| Q
    end

    subgraph "Packet Logger Service"
        R[packet_logger.py] --> |Capture Network Packets| S[Raw Packet Data]
        S --> |Process Packets| T[Packet Logger API]
        T --> |Store Packets| D
    end
```

## Packet Capture Process

The packet capture process is a critical component of the DDoS detection system, responsible for collecting and processing network traffic data.

### How Packets Are Captured

1. **Packet Logger Service**: A Python-based service (`packet_logger.py`) runs in the background to capture network packets.

2. **Express Middleware**: The `trafficMonitor` middleware intercepts all incoming HTTP requests to the Express server.

3. **Request Logging**: For each request, the middleware logs:

   - Source IP address
   - Timestamp
   - HTTP method
   - URL path
   - Headers
   - Request size

4. **Storage**: Captured packets are stored in a global array (`global.packetLogs`) for analysis.

### Code Implementation

```javascript
// Initialize global packet logs
global.packetLogs = global.packetLogs || [];

// Middleware function to log packets
const trafficMonitor = (req, res, next) => {
  // Extract request information
  const packet = {
    timestamp: new Date(),
    src_ip: req.ip || req.connection.remoteAddress,
    method: req.method,
    path: req.path,
    headers: req.headers,
    // Additional packet information
  };

  // Add to global packet logs
  global.packetLogs.push(packet);

  // Continue request processing
  next();
};
```

## Rule-Based Detection

The rule-based detection system provides a fast, lightweight approach to identifying potential DDoS attacks based on predefined thresholds.

### Detection Logic

1. **Periodic Analysis**: Every 30 seconds, the system analyzes recent traffic patterns.

2. **Traffic Metrics**: The system calculates:

   - Request rate (requests per second)
   - Number of unique IPs
   - Average requests per IP
   - Top attacking IPs

3. **Threshold Checking**: An alert is triggered if:
   - Request rate > 0.5 requests/second AND
   - Average requests per IP > 10

### Code Implementation

```javascript
// Set up a simple interval to log traffic stats
setInterval(() => {
  const now = Date.now();
  const last30Seconds = now - 30000;

  // Get packets from last 30 seconds
  const recentPackets = global.packetLogs.filter(
    (p) => new Date(p.timestamp).getTime() > last30Seconds
  );

  if (recentPackets.length > 0) {
    const uniqueIPs = new Set(recentPackets.map((p) => p.src_ip)).size;

    // Simple rule-based detection
    const requestRate = recentPackets.length / 30;
    const avgRequestsPerIP = recentPackets.length / Math.max(1, uniqueIPs);

    // Alert if traffic exceeds thresholds
    if (requestRate > 0.5 && avgRequestsPerIP > 10) {
      console.log("🚨 ALERT: Possible DDoS Attack Detected! 🚨");
      // Generate and store alert...
    }
  }
}, 30000);
```

## Machine Learning Detection

The machine learning-based detection system provides a more sophisticated approach to identifying complex attack patterns that might not be caught by simple rule-based detection.

### ML Model Architecture

1. **Model Type**: Random Forest Classifier from scikit-learn
2. **Features**: 20 traffic-related features including:
   - Protocol type (TCP/UDP)
   - Packet count
   - Byte count
   - Duration
   - Number of flows
   - Packet rate
   - TCP flags (SYN, ACK, PSH, RST, FIN)
   - Window size

### Detection Process

1. **Feature Extraction**: Traffic data is transformed into a feature vector.
2. **Model Prediction**: The feature vector is sent to the ML model for analysis.
3. **Confidence Score**: The model returns a prediction and confidence score.
4. **Alert Generation**: If the model predicts an attack or has high confidence, an alert is generated.

### Code Implementation

```python
def prepare_features(data):
    """Convert input data to model features"""
    features = np.array([
        [
            1 if data.get('Protocol') == 'TCP' else 0,  # Protocol (TCP=0, UDP=1)
            float(data.get('pktcount', 0)),  # Packet count
            float(data.get('bytecount', 0)),  # Byte count
            # ... other features ...
        ]
    ])
    return features

def analyze_traffic(data):
    """Analyze traffic data for DDoS attacks"""
    # Load the model
    model = load_model()

    # Prepare features
    features = prepare_features(data)

    # Make prediction
    probability = model.predict_proba(features)[0][1]
    prediction = int(probability > 0.5)

    # Return result
    result = {
        "is_attack": bool(prediction),
        "prediction": int(prediction),
        "confidence": float(probability),
        "attack_type": determine_attack_type(features, prediction)
    }
    return result
```

## Alert Generation and Storage

The system generates and stores alerts from both rule-based and ML-based detection mechanisms.

### Alert Types

1. **Rule-Based Alerts**:

   - Generated when traffic exceeds predefined thresholds
   - Typically have medium severity
   - Include traffic metrics and top attacking IPs

2. **ML-Based Alerts**:
   - Generated when the ML model predicts an attack
   - Typically have high severity
   - Include confidence score and attack type classification

### Alert Storage

Alerts are stored in two locations:

1. **`global.ddosAlerts`**: Used by the `/api/alerts` endpoint for direct API access
2. **`mlSecurityAlerts`**: Used by the admin dashboard through the `/ml/dashboard` endpoint

### Code Implementation

```javascript
// Rule-based alert
mlSecurityAlerts.push({
  timestamp: new Date().toISOString(),
  type: "ddos",
  severity: "medium",
  message: `DDoS attack detected - ${requestRate.toFixed(
    2
  )} req/s, ${avgRequestsPerIP.toFixed(2)} req/IP`,
  details: {
    requestRate,
    avgRequestsPerIP,
    uniqueIPs,
    totalRequests: recentPackets.length,
    source: "Rule-based detection",
    topAttackers: topIPs
      .slice(0, 3)
      .map(([ip, count]) => `${ip} (${count} requests)`),
  },
});

// ML-based alert
mlSecurityAlerts.push({
  timestamp: new Date().toISOString(),
  type: "ddos",
  severity: "high",
  message: `ML model detected DDoS attack - ${attackType} with ${(
    mlResponse.confidence * 100
  ).toFixed(0)}% confidence`,
  details: {
    requestRate,
    avgRequestsPerIP,
    uniqueIPs,
    totalRequests: features.request_count,
    confidence: mlResponse.confidence,
    attack_type: mlResponse.attack_type || "Unknown",
    source: "ML model detection",
  },
});
```

## Admin Dashboard Integration

The admin dashboard provides a visual interface for monitoring and responding to DDoS attacks.

### Dashboard Features

1. **DDoS Attack Statistics**:

   - Total number of detections
   - Attack types distribution
   - Top attack sources
   - Top attack targets

2. **Recent Security Alerts**:
   - Color-coded by severity (high, medium, low)
   - Timestamp and alert message
   - Alert type and details

### Data Flow

1. The admin dashboard fetches security data from the `/ml/dashboard` endpoint.
2. The endpoint returns XSS stats, DDoS stats, and recent security alerts.
3. The dashboard displays this information in various charts and lists.

## Training Data vs. Real-World Data

There is a significant mismatch between the training data used for the ML model and the real-world traffic patterns observed in the application.

### Training Data Characteristics

From the dataset (`ML Models/data/dataset_sdn.csv`):

- Protocol: Primarily UDP
- Packet Count: 45,000-126,000 packets
- Packet Rate: ~451 packets/second
- Flows: 2-3
- Duration: 100-280 seconds

### Real-World Traffic Characteristics

From observed traffic:

- Protocol: Primarily TCP
- Packet Count: 10-50 packets
- Packet Rate: 0.5-2.0 packets/second
- Flows: 1-3
- Duration: 30 seconds

### Impact on Detection

This mismatch explains why the ML model consistently predicts "not an attack" with similar confidence levels (~0.4). The model was trained to detect large-scale DDoS attacks with hundreds of packets per second, while our current traffic is orders of magnitude smaller.

## Recommendations for Improvement

Based on the analysis of the current system, here are recommendations for improving the DDoS detection capabilities:

1. **Retrain the ML Model**:

   - Collect real-world attack data from tools like GoldenEye
   - Create a more diverse training dataset with varying attack intensities
   - Include both TCP and UDP attack patterns

2. **Feature Engineering**:

   - Develop more discriminative features for low-volume attacks
   - Consider time-series features to detect pattern changes over time
   - Add features specific to application-layer attacks

3. **Hybrid Detection Improvements**:

   - Implement adaptive thresholds for rule-based detection
   - Create an ensemble approach that combines multiple ML models
   - Add anomaly detection for identifying unusual traffic patterns

4. **Response Mechanisms**:

   - Implement rate limiting for suspicious IPs
   - Add CAPTCHA challenges for potential attackers
   - Develop automatic IP blocking for confirmed attacks

5. **Monitoring and Alerting**:
   - Enhance the admin dashboard with real-time traffic visualization
   - Add alert notification via email or messaging services
   - Implement detailed attack forensics and reporting

By implementing these recommendations, the DDoS detection system can be significantly improved to better protect the application from both high and low-volume attacks.
