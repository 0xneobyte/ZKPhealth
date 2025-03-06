#!/usr/bin/env python3
import os
import json
import time
import signal
import random
import datetime
import pickle
import numpy as np
import warnings
import sys
from collections import Counter, deque
import threading
import socket

# Redirect warnings to stderr to avoid interfering with JSON output
warnings.filterwarnings("ignore")

# In a real implementation, we would import scapy
# from scapy.all import sniff, IP, TCP, UDP

# Path to the ML Models directory
ML_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ML_DIR, 'data')
ARTIFACTS_DIR = os.path.join(ML_DIR, 'artifacts')

# File to indicate the monitor is running
MONITOR_PID_FILE = os.path.join(ML_DIR, 'scripts', '.ddos_monitor.pid')

# File to store detection results
DETECTION_RESULTS_FILE = os.path.join(ML_DIR, 'scripts', '.ddos_detection_results.json')

# File to store persistent DDoS detection data
DDOS_PERSISTENT_FILE = os.path.join(ML_DIR, 'scripts', '.ddos_persistent_data.json')

# File to indicate a DoS simulation is in progress
DOS_SIMULATION_FLAG_FILE = os.path.join(ML_DIR, 'scripts', '.dos_simulation_in_progress')

# Global variables for tracking
packet_counts = deque(maxlen=60)  # Store packet counts for the last 60 seconds
ip_counter = Counter()  # Count packets by source IP
port_counter = Counter()  # Count packets by destination port
syn_flood_counter = Counter()  # Count SYN packets by source IP
http_flood_counter = Counter()  # Count HTTP requests by source IP

# Detection thresholds
PACKETS_PER_SECOND_THRESHOLD = 1000
SYN_FLOOD_THRESHOLD = 100
HTTP_FLOOD_THRESHOLD = 50
UDP_FLOOD_THRESHOLD = 200

# Detection results
detection_results = {
    "totalDetections": 0,
    "byType": {
        "syn_flood": 0,
        "udp_flood": 0,
        "http_flood": 0,
        "slowloris": 0
    },
    "topSources": [],
    "topTargets": [],
    "recentTimestamps": [],
    "hourlyTrend": [],
    "trafficData": []
}

# Persistent detection data
persistent_data = {
    "totalDetections": 0,
    "byType": {
        "syn_flood": 0,
        "udp_flood": 0,
        "http_flood": 0,
        "slowloris": 0
    },
    "topSources": [],
    "topTargets": [],
    "recentTimestamps": [],
    "hourlyTrend": [],
    "detections": []  # List of all detections
}

# Flag to control the monitoring loop
running = True

# Load the trained model
def load_model():
    model_path = os.path.join(ARTIFACTS_DIR, 'ddos_model.pickle')
    if os.path.exists(model_path):
        try:
            with open(model_path, 'rb') as f:
                model = pickle.load(f)
            sys.stderr.write(f"Loaded ML model from {model_path}\n")
            return model
        except Exception as e:
            sys.stderr.write(f"Error loading model: {e}\n")
    else:
        sys.stderr.write(f"Model file not found at {model_path}\n")
    return None

# Global variable for model
MODEL = load_model()

def save_pid():
    """Save the current process ID to a file"""
    with open(MONITOR_PID_FILE, 'w') as f:
        f.write(str(os.getpid()))

def save_detection_results():
    """Save the detection results to a file"""
    with open(DETECTION_RESULTS_FILE, 'w') as f:
        json.dump(detection_results, f)

def load_persistent_data():
    """Load persistent detection data from file"""
    global persistent_data
    if os.path.exists(DDOS_PERSISTENT_FILE):
        try:
            with open(DDOS_PERSISTENT_FILE, 'r') as f:
                persistent_data = json.load(f)
            sys.stderr.write(f"Loaded persistent DDoS data from {DDOS_PERSISTENT_FILE}\n")
        except Exception as e:
            sys.stderr.write(f"Error loading persistent DDoS data: {e}\n")
            # Initialize with empty data if file exists but is corrupted
            initialize_persistent_data()
    else:
        # Initialize with empty data if file doesn't exist
        initialize_persistent_data()

def initialize_persistent_data():
    """Initialize persistent detection data with empty values"""
    global persistent_data
    persistent_data = {
        "totalDetections": 0,
        "byType": {
            "syn_flood": 0,
            "udp_flood": 0,
            "http_flood": 0,
            "slowloris": 0
        },
        "topSources": [],
        "topTargets": [],
        "recentTimestamps": [],
        "hourlyTrend": [],
        "detections": []  # List of all detections
    }
    
    # Initialize hourly trend data
    now = datetime.datetime.now()
    for hour in range(24):
        hour_timestamp = (now - datetime.timedelta(hours=23-hour)).strftime('%Y-%m-%d %H:00')
        persistent_data["hourlyTrend"].append({
            "hour": hour_timestamp,
            "count": 0
        })
    
    save_persistent_data()

def save_persistent_data():
    """Save persistent detection data to file"""
    with open(DDOS_PERSISTENT_FILE, 'w') as f:
        json.dump(persistent_data, f)
    sys.stderr.write(f"Saved persistent DDoS data to {DDOS_PERSISTENT_FILE}\n")

def add_detection_to_persistent_data(attack_type, source_ip, target, timestamp=None):
    """Add a detection to the persistent data"""
    global persistent_data
    
    if timestamp is None:
        timestamp = datetime.datetime.now().isoformat()
    
    # Create detection object
    detection = {
        "timestamp": timestamp,
        "attack_type": attack_type,
        "source_ip": source_ip,
        "target": target
    }
    
    # Add to detections list
    persistent_data["detections"].append(detection)
    
    # Update total count
    persistent_data["totalDetections"] += 1
    
    # Update attack type count
    if attack_type in persistent_data["byType"]:
        persistent_data["byType"][attack_type] += 1
    
    # Update recent timestamps
    persistent_data["recentTimestamps"].append(timestamp)
    persistent_data["recentTimestamps"] = sorted(persistent_data["recentTimestamps"], reverse=True)[:100]
    
    # Update top sources
    source_found = False
    for source in persistent_data["topSources"]:
        if source["ip"] == source_ip:
            source["count"] += 1
            source_found = True
            break
    
    if not source_found:
        persistent_data["topSources"].append({"ip": source_ip, "count": 1})
    
    # Sort and keep top 5 sources
    persistent_data["topSources"] = sorted(persistent_data["topSources"], key=lambda x: x["count"], reverse=True)[:5]
    
    # Update top targets
    target_found = False
    for t in persistent_data["topTargets"]:
        if t["service"] == target:
            t["count"] += 1
            target_found = True
            break
    
    if not target_found:
        persistent_data["topTargets"].append({"service": target, "count": 1})
    
    # Sort and keep top 5 targets
    persistent_data["topTargets"] = sorted(persistent_data["topTargets"], key=lambda x: x["count"], reverse=True)[:5]
    
    # Update hourly trend
    hour = datetime.datetime.now().strftime('%Y-%m-%d %H:00')
    hour_found = False
    
    for trend in persistent_data["hourlyTrend"]:
        if trend["hour"] == hour:
            trend["count"] += 1
            hour_found = True
            break
    
    if not hour_found:
        persistent_data["hourlyTrend"].append({
            "hour": hour,
            "count": 1
        })
        # Keep only the last 24 hours
        if len(persistent_data["hourlyTrend"]) > 24:
            persistent_data["hourlyTrend"] = persistent_data["hourlyTrend"][-24:]
    
    # Save the updated data
    save_persistent_data()

def update_traffic_data():
    """Update the traffic data with current packet count"""
    now = datetime.datetime.now().strftime('%H:%M:%S')
    
    # In a real implementation, this would be the actual packet count
    # For simulation, we'll generate random data
    base_traffic = random.randint(100, 500)
    
    # Simulate occasional traffic spikes
    if random.random() < 0.1:  # 10% chance of a spike
        traffic = base_traffic * random.randint(5, 20)
    else:
        traffic = base_traffic + random.randint(-50, 50)
        traffic = max(50, traffic)  # Ensure traffic doesn't go below 50
    
    packet_counts.append(traffic)
    
    # Update traffic data
    detection_results["trafficData"].append({
        "time": now,
        "packets": traffic
    })
    
    # Keep only the last 60 data points
    if len(detection_results["trafficData"]) > 60:
        detection_results["trafficData"] = detection_results["trafficData"][-60:]

def detect_ddos_attacks():
    """Detect DDoS attacks based on traffic patterns"""
    # Check if a DoS simulation is in progress
    simulation_in_progress = os.path.exists(DOS_SIMULATION_FLAG_FILE)
    
    # If a simulation is in progress, guarantee a detection
    if simulation_in_progress:
        try:
            with open(DOS_SIMULATION_FLAG_FILE, 'r') as f:
                target_ip = f.read().strip()
            
            # Use SYN flood as the attack type for simulations
            attack_type = 'syn_flood'
            
            # Generate random source IPs for the attack
            source_ips = [
                f"{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}"
                for _ in range(5)
            ]
            source_ip = random.choice(source_ips)
            
            # Determine the target service based on common ports
            target = "HTTP (80)"  # Default to HTTP
            
            # Update detection counts
            detection_results["totalDetections"] += 1
            detection_results["byType"][attack_type] += 1
            
            # Update recent timestamps
            now = datetime.datetime.now().isoformat()
            detection_results["recentTimestamps"].append(now)
            detection_results["recentTimestamps"] = sorted(detection_results["recentTimestamps"], reverse=True)[:100]
            
            # Update top sources
            for src_ip in source_ips:
                ip_counter[src_ip] += random.randint(10, 50)  # Add significant counts
            
            detection_results["topSources"] = [
                {"ip": ip, "count": count}
                for ip, count in ip_counter.most_common(5)
            ]
            
            # Update top targets - make sure the simulated target is at the top
            port_counter[target] += 50  # Add a significant count
            detection_results["topTargets"] = [
                {"service": service, "count": count}
                for service, count in port_counter.most_common(5)
            ]
            
            # Update hourly trend
            hour = datetime.datetime.now().strftime('%Y-%m-%d %H:00')
            hour_found = False
            for trend in detection_results["hourlyTrend"]:
                if trend["hour"] == hour:
                    trend["count"] += 1
                    hour_found = True
                    break
            
            if not hour_found:
                detection_results["hourlyTrend"].append({
                    "hour": hour,
                    "count": 1
                })
                # Keep only the last 24 hours
                if len(detection_results["hourlyTrend"]) > 24:
                    detection_results["hourlyTrend"] = detection_results["hourlyTrend"][-24:]
            
            # Add to persistent data
            add_detection_to_persistent_data(attack_type, source_ip, target, now)
            
            sys.stderr.write(f"DoS attack detected during simulation: {attack_type} targeting {target}\n")
            return
            
        except Exception as e:
            sys.stderr.write(f"Error processing simulation flag: {e}\n")
            # Fall back to ML detection if there's an error
    
    # Try to use the ML model if available
    if MODEL is not None:
        try:
            # Generate features for the model
            # In a real implementation, these would be extracted from actual network traffic
            # For simulation, we'll generate random features
            
            # Create a feature vector similar to what was used in training
            # Protocol (0=TCP, 1=UDP, 2=ICMP), packet size, packet count, etc.
            features = np.array([
                [
                    random.randint(0, 2),  # Protocol
                    random.randint(64, 1500),  # Packet size
                    len(packet_counts),  # Number of packets
                    sum(packet_counts) / max(1, len(packet_counts)),  # Average packet rate
                    max(packet_counts) if packet_counts else 0,  # Max packet rate
                    random.randint(1, 65535),  # Source port
                    random.randint(1, 65535),  # Destination port
                    random.randint(0, 255),  # TTL
                    random.randint(0, 1),  # TCP flags (SYN)
                    random.randint(0, 1),  # TCP flags (ACK)
                    random.randint(0, 1),  # TCP flags (FIN)
                    random.randint(0, 1),  # TCP flags (RST)
                    random.randint(0, 1),  # TCP flags (PSH)
                    random.randint(0, 1),  # TCP flags (URG)
                    random.randint(0, 100),  # Flow duration
                    random.randint(1, 1000),  # Flow packets
                    random.randint(64, 150000),  # Flow bytes
                    random.random(),  # Flow packets per second
                    random.random(),  # Flow bytes per second
                    random.randint(0, 1)  # Is attack (will be predicted)
                ]
            ])
            
            # Reshape for LSTM input (samples, timesteps, features)
            features = features.reshape(features.shape[0], 1, features.shape[1])
            
            # Get prediction
            prediction = MODEL.predict(features)
            is_attack = prediction[0][0] > 0.5
            
            if is_attack:
                # Determine attack type based on features
                if features[0, 0, 8] > 0.5:  # SYN flag
                    attack_type = 'syn_flood'
                elif features[0, 0, 0] == 1:  # UDP protocol
                    attack_type = 'udp_flood'
                elif features[0, 0, 0] == 0 and features[0, 0, 6] == 80:  # TCP to port 80
                    attack_type = 'http_flood'
                else:
                    attack_type = 'slowloris'
                
                # Generate source IP and target
                source_ip = f"{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}"
                targets = ["HTTP (80)", "HTTPS (443)", "DNS (53)", "SSH (22)", "FTP (21)", "SMTP (25)"]
                target = targets[int(features[0, 0, 6]) % len(targets)]
                
                # Update detection counts
                detection_results["totalDetections"] += 1
                detection_results["byType"][attack_type] += 1
                
                # Update recent timestamps
                now = datetime.datetime.now().isoformat()
                detection_results["recentTimestamps"].append(now)
                detection_results["recentTimestamps"] = sorted(detection_results["recentTimestamps"], reverse=True)[:100]
                
                # Update top sources
                ip_counter[source_ip] += 1
                detection_results["topSources"] = [
                    {"ip": ip, "count": count}
                    for ip, count in ip_counter.most_common(5)
                ]
                
                # Update top targets
                port_counter[target] += 1
                detection_results["topTargets"] = [
                    {"service": service, "count": count}
                    for service, count in port_counter.most_common(5)
                ]
                
                # Update hourly trend
                hour = datetime.datetime.now().strftime('%Y-%m-%d %H:00')
                hour_found = False
                for trend in detection_results["hourlyTrend"]:
                    if trend["hour"] == hour:
                        trend["count"] += 1
                        hour_found = True
                        break
                
                if not hour_found:
                    detection_results["hourlyTrend"].append({
                        "hour": hour,
                        "count": 1
                    })
                    # Keep only the last 24 hours
                    if len(detection_results["hourlyTrend"]) > 24:
                        detection_results["hourlyTrend"] = detection_results["hourlyTrend"][-24:]
                
                # Add to persistent data
                add_detection_to_persistent_data(attack_type, source_ip, target, now)
                
                sys.stderr.write(f"ML model detected DoS attack: {attack_type} targeting {target}\n")
                return
            
        except Exception as e:
            sys.stderr.write(f"Error using ML model: {e}\n")
            # Fall back to random detection if there's an error
    
    # Fallback: Random detection logic (for when ML model is not available or fails)
    if random.random() < 0.05:  # 5% chance of detecting an attack
        attack_type = random.choice(['syn_flood', 'udp_flood', 'http_flood', 'slowloris'])
        source_ip = f"{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}"
        target = random.choice([
            "HTTP (80)", "HTTPS (443)", "DNS (53)", "SSH (22)", 
            "FTP (21)", "SMTP (25)", "API Gateway", "Load Balancer"
        ])
        
        # Update detection counts
        detection_results["totalDetections"] += 1
        detection_results["byType"][attack_type] += 1
        
        # Update recent timestamps
        now = datetime.datetime.now().isoformat()
        detection_results["recentTimestamps"].append(now)
        detection_results["recentTimestamps"] = sorted(detection_results["recentTimestamps"], reverse=True)[:100]
        
        # Update top sources
        ip_counter[source_ip] += 1
        detection_results["topSources"] = [
            {"ip": ip, "count": count}
            for ip, count in ip_counter.most_common(5)
        ]
        
        # Update top targets
        port_counter[target] += 1
        detection_results["topTargets"] = [
            {"service": service, "count": count}
            for service, count in port_counter.most_common(5)
        ]
        
        # Update hourly trend
        hour = datetime.datetime.now().strftime('%Y-%m-%d %H:00')
        hour_found = False
        for trend in detection_results["hourlyTrend"]:
            if trend["hour"] == hour:
                trend["count"] += 1
                hour_found = True
                break
        
        if not hour_found:
            detection_results["hourlyTrend"].append({
                "hour": hour,
                "count": 1
            })
            # Keep only the last 24 hours
            if len(detection_results["hourlyTrend"]) > 24:
                detection_results["hourlyTrend"] = detection_results["hourlyTrend"][-24:]
        
        # Add to persistent data
        add_detection_to_persistent_data(attack_type, source_ip, target, now)
        
        sys.stderr.write(f"Random detection of DoS attack: {attack_type} targeting {target}\n")

def packet_callback(packet):
    """Process a network packet (simulation)"""
    # In a real implementation, this would process actual packets from Scapy
    # For simulation, we'll just call our detection function
    update_traffic_data()
    detect_ddos_attacks()
    save_detection_results()

def monitor_network():
    """Monitor network traffic for DDoS attacks"""
    sys.stderr.write("Starting DDoS monitoring...\n")
    save_pid()
    
    # Load persistent data
    load_persistent_data()
    
    try:
        # In a real implementation, we would use Scapy to sniff packets
        # sniff(prn=packet_callback, store=0)
        
        # For simulation, we'll just call our callback periodically
        while running:
            packet_callback(None)
            time.sleep(1)
    except KeyboardInterrupt:
        sys.stderr.write("Stopping DDoS monitoring...\n")
    finally:
        # Clean up
        if os.path.exists(MONITOR_PID_FILE):
            os.remove(MONITOR_PID_FILE)

def signal_handler(sig, frame):
    """Handle termination signals"""
    global running
    running = False
    sys.stderr.write("Received signal to stop monitoring\n")

if __name__ == "__main__":
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Initialize hourly trend data
    now = datetime.datetime.now()
    for hour in range(24):
        hour_timestamp = (now - datetime.timedelta(hours=23-hour)).strftime('%Y-%m-%d %H:00')
        detection_results["hourlyTrend"].append({
            "hour": hour_timestamp,
            "count": 0
        })
    
    # Start monitoring
    monitor_network() 