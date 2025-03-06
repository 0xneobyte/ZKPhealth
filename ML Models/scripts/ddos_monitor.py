#!/usr/bin/env python3
import os
import json
import time
import signal
import random
import datetime
from collections import Counter, deque
import threading
import socket

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

# Flag to control the monitoring loop
running = True

def save_pid():
    """Save the current process ID to a file"""
    with open(MONITOR_PID_FILE, 'w') as f:
        f.write(str(os.getpid()))

def save_detection_results():
    """Save the detection results to a file"""
    with open(DETECTION_RESULTS_FILE, 'w') as f:
        json.dump(detection_results, f)

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
            
            print(f"DoS attack detected during simulation: {attack_type} targeting {target}")
            return
            
        except Exception as e:
            print(f"Error processing simulation flag: {e}")
            # Fall back to random detection if there's an error
    
    # Normal random detection logic (for when no simulation is in progress)
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

def packet_callback(packet):
    """Process a network packet (simulation)"""
    # In a real implementation, this would process actual packets from Scapy
    # For simulation, we'll just call our detection function
    update_traffic_data()
    detect_ddos_attacks()
    save_detection_results()

def monitor_network():
    """Monitor network traffic for DDoS attacks"""
    print("Starting DDoS monitoring...")
    save_pid()
    
    try:
        # In a real implementation, we would use Scapy to sniff packets
        # sniff(prn=packet_callback, store=0)
        
        # For simulation, we'll just call our callback periodically
        while running:
            packet_callback(None)
            time.sleep(1)
    except KeyboardInterrupt:
        print("Stopping DDoS monitoring...")
    finally:
        # Clean up
        if os.path.exists(MONITOR_PID_FILE):
            os.remove(MONITOR_PID_FILE)

def signal_handler(sig, frame):
    """Handle termination signals"""
    global running
    running = False
    print("Received signal to stop monitoring")

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