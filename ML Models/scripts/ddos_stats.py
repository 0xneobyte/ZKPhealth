#!/usr/bin/env python3
import json
import os
import random
import datetime
import sys
from collections import Counter

# Path to the ML Models directory
ML_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ML_DIR, 'data')
ARTIFACTS_DIR = os.path.join(ML_DIR, 'artifacts')

# File to store persistent DDoS detection data
DDOS_PERSISTENT_FILE = os.path.join(ML_DIR, 'scripts', '.ddos_persistent_data.json')

# Function to generate DDoS statistics
def generate_ddos_stats():
    # Try to load real detection data if available
    if os.path.exists(DDOS_PERSISTENT_FILE):
        try:
            with open(DDOS_PERSISTENT_FILE, 'r') as f:
                data = json.load(f)
                sys.stderr.write("Loaded real DDoS detection data\n")
                return data
        except Exception as e:
            sys.stderr.write(f"Error loading DDoS detection data: {e}\n")
            sys.stderr.write("Falling back to simulated data\n")
    else:
        sys.stderr.write(f"No persistent DDoS data found at {DDOS_PERSISTENT_FILE}\n")
        sys.stderr.write("Generating simulated DDoS statistics\n")
    
    # If no real data is available, generate simulated data
    # Total detections (random number between 30-100)
    total_detections = random.randint(30, 100)
    
    # Distribution by attack type
    attack_types = ['syn_flood', 'udp_flood', 'http_flood', 'slowloris']
    by_type = {}
    remaining = total_detections
    
    for attack_type in attack_types[:-1]:
        count = random.randint(1, remaining - (len(attack_types) - 1))
        by_type[attack_type] = count
        remaining -= count
    
    by_type[attack_types[-1]] = remaining
    
    # Top attack sources
    source_ips = [
        f"{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}" 
        for _ in range(20)
    ]
    source_counts = Counter()
    for _ in range(total_detections):
        source_counts[random.choice(source_ips)] += 1
    
    top_sources = [
        {"ip": ip, "count": count}
        for ip, count in source_counts.most_common(5)
    ]
    
    # Top attack targets (ports/services)
    targets = [
        "HTTP (80)", "HTTPS (443)", "DNS (53)", "SSH (22)", 
        "FTP (21)", "SMTP (25)", "API Gateway", "Load Balancer"
    ]
    target_counts = Counter()
    for _ in range(total_detections):
        target_counts[random.choice(targets)] += 1
    
    top_targets = [
        {"service": service, "count": count}
        for service, count in target_counts.most_common(5)
    ]
    
    # Recent timestamps (last 24 hours)
    now = datetime.datetime.now()
    recent_timestamps = []
    for _ in range(min(100, total_detections)):
        minutes_ago = random.randint(1, 24 * 60)
        timestamp = (now - datetime.timedelta(minutes=minutes_ago)).isoformat()
        recent_timestamps.append(timestamp)
    
    # Sort timestamps in descending order (newest first)
    recent_timestamps.sort(reverse=True)
    
    # Trend data (hourly counts for the last 24 hours)
    hourly_counts = []
    for hour in range(24):
        hour_timestamp = (now - datetime.timedelta(hours=hour)).strftime('%Y-%m-%d %H:00')
        hourly_counts.append({
            "hour": hour_timestamp,
            "count": random.randint(0, 10)
        })
    
    # Reverse to get chronological order
    hourly_counts.reverse()
    
    # Traffic data (packets per second for the last minute)
    traffic_data = []
    for second in range(60):
        time_str = (now - datetime.timedelta(seconds=60-second)).strftime('%H:%M:%S')
        traffic_data.append({
            "time": time_str,
            "packets": random.randint(50, 8000)
        })
    
    return {
        "totalDetections": total_detections,
        "byType": by_type,
        "topSources": top_sources,
        "topTargets": top_targets,
        "recentTimestamps": recent_timestamps,
        "hourlyTrend": hourly_counts,
        "trafficData": traffic_data
    }

# Function to save a new DDoS detection
def save_ddos_detection(detection):
    """Save a new DDoS detection to the persistent file"""
    # Initialize with default structure
    data = {
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
        "detections": []
    }
    
    # Load existing data if available
    if os.path.exists(DDOS_PERSISTENT_FILE):
        try:
            with open(DDOS_PERSISTENT_FILE, 'r') as f:
                data = json.load(f)
        except Exception as e:
            sys.stderr.write(f"Error loading existing DDoS data: {e}\n")
    
    # Add the new detection
    if "detections" not in data:
        data["detections"] = []
    
    data["detections"].append(detection)
    data["totalDetections"] += 1
    
    # Update attack type counts
    attack_type = detection.get("attack_type")
    if attack_type and attack_type in data["byType"]:
        data["byType"][attack_type] += 1
    
    # Update timestamps
    timestamp = detection.get("timestamp", datetime.datetime.now().isoformat())
    data["recentTimestamps"].append(timestamp)
    data["recentTimestamps"] = sorted(data["recentTimestamps"], reverse=True)[:100]
    
    # Update sources
    source_ip = detection.get("source_ip")
    if source_ip:
        # Check if this source is already in the list
        source_found = False
        for source in data["topSources"]:
            if source["ip"] == source_ip:
                source["count"] += 1
                source_found = True
                break
        
        if not source_found:
            data["topSources"].append({"ip": source_ip, "count": 1})
        
        # Sort and keep top 5
        data["topSources"] = sorted(data["topSources"], key=lambda x: x["count"], reverse=True)[:5]
    
    # Update targets
    target = detection.get("target")
    if target:
        # Check if this target is already in the list
        target_found = False
        for t in data["topTargets"]:
            if t["service"] == target:
                t["count"] += 1
                target_found = True
                break
        
        if not target_found:
            data["topTargets"].append({"service": target, "count": 1})
        
        # Sort and keep top 5
        data["topTargets"] = sorted(data["topTargets"], key=lambda x: x["count"], reverse=True)[:5]
    
    # Update hourly trend
    hour = datetime.datetime.now().strftime('%Y-%m-%d %H:00')
    
    # Check if this hour is already in the list
    hour_found = False
    for trend in data["hourlyTrend"]:
        if trend["hour"] == hour:
            trend["count"] += 1
            hour_found = True
            break
    
    if not hour_found:
        data["hourlyTrend"].append({
            "hour": hour,
            "count": 1
        })
        
        # Keep only the last 24 hours
        if len(data["hourlyTrend"]) > 24:
            data["hourlyTrend"] = data["hourlyTrend"][-24:]
    
    # Save the updated data
    with open(DDOS_PERSISTENT_FILE, 'w') as f:
        json.dump(data, f)
    
    return data

if __name__ == "__main__":
    stats = generate_ddos_stats()
    # Output only the JSON to stdout
    print(json.dumps(stats)) 