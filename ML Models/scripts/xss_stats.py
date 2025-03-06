#!/usr/bin/env python3
import json
import os
import random
import datetime
from collections import Counter

# Path to the ML Models directory
ML_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ML_DIR, 'data')
ARTIFACTS_DIR = os.path.join(ML_DIR, 'artifacts')

# Function to generate mock XSS statistics
def generate_xss_stats():
    # In a real implementation, this would load the actual model and analyze logs
    # For now, we'll generate mock data
    
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

if __name__ == "__main__":
    stats = generate_xss_stats()
    print(json.dumps(stats)) 