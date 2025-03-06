#!/usr/bin/env python3
import json
import os
import random
import datetime
import pickle
import numpy as np
import sys
from collections import Counter

# Path to the ML Models directory
ML_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ML_DIR, 'data')
ARTIFACTS_DIR = os.path.join(ML_DIR, 'artifacts')

# File to store XSS detection results
XSS_RESULTS_FILE = os.path.join(ML_DIR, 'scripts', '.xss_detection_results.json')

# Function to generate XSS statistics
def generate_xss_stats():
    # Try to load real detection results if available
    if os.path.exists(XSS_RESULTS_FILE):
        try:
            with open(XSS_RESULTS_FILE, 'r') as f:
                results = json.load(f)
                sys.stderr.write("Loaded real XSS detection results\n")
                return results
        except Exception as e:
            sys.stderr.write(f"Error loading XSS detection results: {e}\n")
            sys.stderr.write("Falling back to simulated data\n")
    
    # If no real data is available, generate simulated data
    sys.stderr.write("Generating simulated XSS statistics\n")
    
    # Total detections (random number between 50-150)
    total_detections = random.randint(50, 150)
    
    # Distribution by attack type
    attack_types = ['reflected', 'stored', 'dom']
    by_type = {}
    remaining = total_detections
    
    for attack_type in attack_types[:-1]:
        count = random.randint(1, remaining - 1)
        by_type[attack_type] = count
        remaining -= count
    
    by_type[attack_types[-1]] = remaining
    
    # Top attack sources
    source_ips = [
        f"192.168.1.{random.randint(1, 255)}" for _ in range(20)
    ]
    source_counts = Counter()
    for _ in range(total_detections):
        source_counts[random.choice(source_ips)] += 1
    
    top_sources = [
        {"ip": ip, "count": count}
        for ip, count in source_counts.most_common(5)
    ]
    
    # Top attack targets
    endpoints = [
        "/login", "/register", "/profile", "/dashboard", 
        "/admin", "/search", "/patients", "/records"
    ]
    target_counts = Counter()
    for _ in range(total_detections):
        target_counts[random.choice(endpoints)] += 1
    
    top_targets = [
        {"endpoint": endpoint, "count": count}
        for endpoint, count in target_counts.most_common(5)
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
    
    return {
        "totalDetections": total_detections,
        "byType": by_type,
        "topSources": top_sources,
        "topTargets": top_targets,
        "recentTimestamps": recent_timestamps,
        "hourlyTrend": hourly_counts
    }

# Function to save XSS detection results
def save_xss_detection(detection):
    """Save a new XSS detection to the results file"""
    results = {
        "totalDetections": 0,
        "byType": {
            "reflected": 0,
            "stored": 0,
            "dom": 0
        },
        "topSources": [],
        "topTargets": [],
        "recentTimestamps": [],
        "hourlyTrend": []
    }
    
    # Load existing results if available
    if os.path.exists(XSS_RESULTS_FILE):
        try:
            with open(XSS_RESULTS_FILE, 'r') as f:
                results = json.load(f)
        except:
            pass
    
    # Update results with new detection
    results["totalDetections"] += 1
    
    # Update attack type counts
    if detection.get("attack_type") in results["byType"]:
        results["byType"][detection["attack_type"]] += 1
    
    # Add timestamp
    results["recentTimestamps"].append(detection.get("timestamp", datetime.datetime.now().isoformat()))
    results["recentTimestamps"] = sorted(results["recentTimestamps"], reverse=True)[:100]
    
    # Update source IPs
    source_ip = detection.get("source_ip")
    if source_ip:
        # Find if this IP is already in the list
        found = False
        for source in results["topSources"]:
            if source["ip"] == source_ip:
                source["count"] += 1
                found = True
                break
        
        if not found:
            results["topSources"].append({"ip": source_ip, "count": 1})
        
        # Sort by count and keep top 5
        results["topSources"] = sorted(results["topSources"], key=lambda x: x["count"], reverse=True)[:5]
    
    # Update target endpoints
    target_endpoint = detection.get("target_endpoint")
    if target_endpoint:
        # Find if this endpoint is already in the list
        found = False
        for target in results["topTargets"]:
            if target["endpoint"] == target_endpoint:
                target["count"] += 1
                found = True
                break
        
        if not found:
            results["topTargets"].append({"endpoint": target_endpoint, "count": 1})
        
        # Sort by count and keep top 5
        results["topTargets"] = sorted(results["topTargets"], key=lambda x: x["count"], reverse=True)[:5]
    
    # Update hourly trend
    hour = datetime.datetime.now().strftime('%Y-%m-%d %H:00')
    
    # Find if this hour is already in the list
    hour_found = False
    for trend in results["hourlyTrend"]:
        if trend["hour"] == hour:
            trend["count"] += 1
            hour_found = True
            break
    
    if not hour_found:
        results["hourlyTrend"].append({
            "hour": hour,
            "count": 1
        })
        
        # Keep only the last 24 hours
        if len(results["hourlyTrend"]) > 24:
            results["hourlyTrend"] = results["hourlyTrend"][-24:]
    
    # Save updated results
    with open(XSS_RESULTS_FILE, 'w') as f:
        json.dump(results, f)
    
    return results

if __name__ == "__main__":
    stats = generate_xss_stats()
    # Output only the JSON to stdout
    print(json.dumps(stats)) 