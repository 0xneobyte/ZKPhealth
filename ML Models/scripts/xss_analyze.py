#!/usr/bin/env python3
import json
import sys
import re
import os
import random

# Path to the ML Models directory
ML_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ML_DIR, 'data')
ARTIFACTS_DIR = os.path.join(ML_DIR, 'artifacts')

# Common XSS patterns to detect
XSS_PATTERNS = [
    r'<script.*?>',
    r'javascript:',
    r'<img.*?onerror=',
    r'<svg.*?onload=',
    r'<iframe.*?src=',
    r'<body.*?onload=',
    r'<.*?on\w+=',
    r'alert\s*\(',
    r'document\.cookie',
    r'eval\s*\(',
    r'document\.location',
    r'document\.write',
    r'\.innerHTML',
    r'fromCharCode',
    r'<style.*?expression',
]

# Function to analyze a payload for XSS vulnerabilities
def analyze_xss(payload):
    # In a real implementation, this would use the trained ML model
    # For now, we'll use pattern matching and some randomization
    
    if not payload:
        return {
            "is_attack": False,
            "confidence": 0.0,
            "attack_type": None,
            "matched_patterns": []
        }
    
    # Check for XSS patterns
    matched_patterns = []
    for pattern in XSS_PATTERNS:
        if re.search(pattern, payload, re.IGNORECASE):
            matched_patterns.append(pattern)
    
    # Determine if it's an attack based on matched patterns
    is_attack = len(matched_patterns) > 0
    
    # Calculate confidence score (0.0 to 1.0)
    if is_attack:
        # Base confidence on number of matched patterns
        confidence = min(0.5 + (len(matched_patterns) * 0.1), 0.99)
    else:
        confidence = max(0.01, random.random() * 0.3)  # Low confidence for non-attacks
    
    # Determine attack type if it's an attack
    attack_type = None
    if is_attack:
        # Simplified logic to determine attack type
        if 'document.cookie' in payload or 'localStorage' in payload:
            attack_type = 'data_theft'
        elif '<iframe' in payload:
            attack_type = 'stored'
        elif '<img' in payload or '<svg' in payload:
            attack_type = 'reflected'
        elif 'javascript:' in payload or 'eval(' in payload:
            attack_type = 'dom'
        else:
            # Randomly assign an attack type if we can't determine it
            attack_type = random.choice(['reflected', 'stored', 'dom'])
    
    # Generate source IP and target endpoint for the attack
    source_ip = f"192.168.1.{random.randint(1, 255)}"
    endpoints = ["/login", "/register", "/profile", "/dashboard", "/admin", "/search", "/patients", "/records"]
    target_endpoint = random.choice(endpoints)
    
    return {
        "is_attack": is_attack,
        "confidence": round(confidence, 2),
        "attack_type": attack_type,
        "matched_patterns": matched_patterns,
        "source_ip": source_ip,
        "target_endpoint": target_endpoint
    }

if __name__ == "__main__":
    # Get payload from command line argument
    payload = sys.argv[1] if len(sys.argv) > 1 else ""
    
    # Analyze the payload
    result = analyze_xss(payload)
    
    # Output the result as JSON
    print(json.dumps(result)) 