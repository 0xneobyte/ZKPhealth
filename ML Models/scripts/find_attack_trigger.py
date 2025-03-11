#!/usr/bin/env python3
import os
import sys
import json
import subprocess
import time
import itertools
import numpy as np
from tqdm import tqdm

# Path to the ML Models directory
ML_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS_DIR = os.path.join(ML_DIR, 'scripts')
DDOS_SCRIPT = os.path.join(SCRIPTS_DIR, 'ddos_analyze.py')

def run_ml_model(features):
    """Send features to the ML model and return the response"""
    try:
        # Convert features to JSON string
        features_json = json.dumps(features)
        
        # Path to Python interpreter (assuming it's in a virtual environment)
        python_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(ML_DIR))), 'venv/bin/python')
        if not os.path.exists(python_path):
            python_path = 'python'  # Fall back to system Python
        
        # Call the ML model script with the features
        cmd = [python_path, DDOS_SCRIPT, features_json]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        
        # Parse the JSON response
        response = json.loads(result.stdout.strip())
        return response
    except Exception as e:
        print(f"Error running ML model: {e}")
        print(f"Stdout: {result.stdout if 'result' in locals() else 'N/A'}")
        print(f"Stderr: {result.stderr if 'result' in locals() else 'N/A'}")
        return {"error": str(e), "is_attack": False, "confidence": 0}

def print_header(title):
    """Print a section header"""
    print("\n" + "=" * 60)
    print(f" {title} ".center(60, "="))
    print("=" * 60)

# Base feature set - we'll modify this to find a combination that triggers an attack
base_features = {
    "dt": 11425,
    "pktcount": 45304,
    "bytecount": 48294064,
    "dur": 100,
    "flows": 3,
    "packetins": 1943,
    "pktperflow": 13535,
    "byteperflow": 14428310,
    "pktrate": 451,
    "Protocol": "UDP",
    "port_no": 3,
    "tx_bytes": 143928631,
    "rx_bytes": 3917,
    "syn_flag": 0,
    "ack_flag": 0,
    "psh_flag": 0,
    "rst_flag": 0,
    "fin_flag": 0,
    "window_size": 65535,
    "urgent_ptr": 0,
    "header_len": 20
}

def find_attack_trigger():
    """Try various parameter combinations to find what triggers an attack detection"""
    print_header("SEARCHING FOR ATTACK TRIGGER COMBINATIONS")
    
    # Key features to manipulate based on domain knowledge
    key_features = {
        "pktcount": [45304, 126395, 500000, 1000000],  # Try different packet counts
        "pktrate": [451, 1000, 2000, 5000],           # Try different packet rates
        "Protocol": ["UDP", "TCP"],                    # Try different protocols
        "port_no": [3, 4, 22, 23, 25, 53, 80, 443],    # Try security-sensitive ports
        "syn_flag": [0, 1],                            # SYN flood is a common attack
        "fin_flag": [0, 1],                            # FIN scan is another technique
        "rst_flag": [0, 1]                             # RST flood attack
    }
    
    # Track the highest confidence score
    max_confidence = 0
    best_features = None
    
    # We'll use a recursive approach to avoid testing all combinations
    def search_combinations(current_features, remaining_features, depth=0):
        nonlocal max_confidence, best_features
        
        # Test current combination
        response = run_ml_model(current_features)
        confidence = response.get("confidence", 0)
        is_attack = response.get("is_attack", False)
        
        if is_attack:
            print(f"\n🚨 FOUND ATTACK TRIGGER! Confidence: {confidence * 100:.1f}%")
            print(json.dumps(current_features, indent=2))
            print("\nML Model Response:")
            print(json.dumps(response, indent=2))
            if best_features is None or confidence > max_confidence:
                max_confidence = confidence
                best_features = current_features.copy()
            return True
            
        # Update max confidence
        if confidence > max_confidence:
            max_confidence = confidence
            best_features = current_features.copy()
            print(f"\nNew highest confidence: {confidence * 100:.1f}%")
            print(f"Features: {json.dumps(current_features, indent=2)}")
        
        # Stop recursion if we've reached max depth
        if depth >= len(remaining_features):
            return False
            
        # Continue recursion with the next feature
        feature = list(remaining_features.keys())[depth]
        values = remaining_features[feature]
        
        found = False
        for value in values:
            current_features[feature] = value
            found = search_combinations(current_features, remaining_features, depth + 1)
            if found:
                return True
                
        return False
    
    # Start with an exhaustive search of more promising combinations
    print("Testing protocol vs port combinations (most likely to affect detection)...")
    protocols = key_features["Protocol"]
    ports = key_features["port_no"]
    syn_flags = key_features["syn_flag"]
    
    for protocol, port, syn in itertools.product(protocols, ports, syn_flags):
        test_features = base_features.copy()
        test_features["Protocol"] = protocol
        test_features["port_no"] = port
        test_features["syn_flag"] = syn
        
        # Modify packet count based on protocol (HTTP attacks typically have lower counts)
        if protocol == "TCP" and port == 80:
            # For HTTP, try a more realistic attack pattern
            test_features["pktcount"] = 10000
            test_features["pktrate"] = 100
            test_features["bytecount"] = 20000000  # More bytes per packet for HTTP
        
        response = run_ml_model(test_features)
        confidence = response.get("confidence", 0)
        is_attack = response.get("is_attack", False)
        
        print(f"Protocol: {protocol}, Port: {port}, SYN: {syn} -> ", end="")
        if is_attack:
            print(f"ATTACK DETECTED! Confidence: {confidence * 100:.1f}%")
            max_confidence = confidence
            best_features = test_features.copy()
            break
        else:
            print(f"Not detected ({confidence * 100:.1f}%)")
    
    # Try extreme values approach if the above didn't work
    if not best_features or not best_features.get("is_attack", False):
        print("\nTrying extreme values approach...")
        
        # Test with extremely large values
        extreme_features = base_features.copy()
        # Use values 10-100x higher than the training data
        extreme_features["pktcount"] = 10000000  # 10 million packets
        extreme_features["bytecount"] = 10000000000  # 10 billion bytes
        extreme_features["pktrate"] = 50000  # 50,000 packets per second
        extreme_features["syn_flag"] = 1  # SYN flood
        
        response = run_ml_model(extreme_features)
        confidence = response.get("confidence", 0)
        is_attack = response.get("is_attack", False)
        
        print(f"Extreme values -> ", end="")
        if is_attack:
            print(f"ATTACK DETECTED! Confidence: {confidence * 100:.1f}%")
            max_confidence = confidence
            best_features = extreme_features.copy()
        else:
            print(f"Not detected ({confidence * 100:.1f}%)")
    
    # Try manipulating the model's decision boundary
    if not best_features or not best_features.get("is_attack", False):
        print("\nTrying to exploit the model's decision boundary...")
        
        # Try negative values (which might confuse the model)
        negative_features = base_features.copy()
        negative_features["pktcount"] = -100000
        negative_features["pktrate"] = -1000
        
        response = run_ml_model(negative_features)
        confidence = response.get("confidence", 0)
        is_attack = response.get("is_attack", False)
        
        print(f"Negative values -> ", end="")
        if is_attack:
            print(f"ATTACK DETECTED! Confidence: {confidence * 100:.1f}%")
            max_confidence = confidence
            best_features = negative_features.copy()
        else:
            print(f"Not detected ({confidence * 100:.1f}%)")
    
    # Last resort: try a more systematic recursive search with a deeper approach
    if not best_features or not best_features.get("is_attack", False):
        print("\nTrying recursive feature search...")
        search_combinations(base_features.copy(), key_features)
    
    # Report findings
    print_header("SEARCH RESULTS")
    if best_features and max_confidence > 0.5:
        print(f"Found attack-triggering features with confidence {max_confidence * 100:.1f}%:")
        print(json.dumps(best_features, indent=2))
    else:
        print(f"Could not find features that trigger attack detection.")
        print(f"Highest confidence achieved: {max_confidence * 100:.1f}%")
        print(f"Best features found:")
        print(json.dumps(best_features, indent=2))
    
    return best_features, max_confidence

def explore_attack_label():
    """Try to understand how the model was labeled for attack/non-attack"""
    print_header("EXPLORING ATTACK LABELS")
    
    # Start with baseline from CSV (labeled as 0/non-attack)
    csv_baseline = {
        "dt": 11425,
        "pktcount": 45304,
        "bytecount": 48294064,
        "dur": 100,
        "flows": 3,
        "packetins": 1943,
        "pktperflow": 13535,
        "byteperflow": 14428310,
        "pktrate": 451,
        "Protocol": "UDP",
        "port_no": 3,
        "tx_bytes": 143928631,
        "rx_bytes": 3917,
        "syn_flag": 0,
        "ack_flag": 0, 
        "psh_flag": 0,
        "rst_flag": 0,
        "fin_flag": 0,
        "window_size": 65535,
        "urgent_ptr": 0,
        "header_len": 20
    }
    
    print("Testing baseline from CSV data (labeled as non-attack):")
    response = run_ml_model(csv_baseline)
    print(f"Prediction: {'Attack' if response.get('is_attack') else 'Not Attack'}")
    print(f"Confidence: {response.get('confidence', 0) * 100:.1f}%")
    
    # Create a feature injection hack to try to trick the model
    # This attempts to directly influence the classification by exploiting decision trees
    hack_features = base_features.copy()
    # Set label field directly to try to influence prediction
    hack_features["label"] = 1
    
    print("\nTrying feature injection hack:")
    response = run_ml_model(hack_features)
    print(f"Prediction: {'Attack' if response.get('is_attack') else 'Not Attack'}")
    print(f"Confidence: {response.get('confidence', 0) * 100:.1f}%")
    
    # Direct override attempt (unlikely to work but worth trying)
    override_features = base_features.copy()
    override_features["is_attack"] = True
    override_features["prediction"] = 1
    override_features["confidence"] = 0.99
    
    print("\nTrying direct override:")
    response = run_ml_model(override_features)
    print(f"Prediction: {'Attack' if response.get('is_attack') else 'Not Attack'}")
    print(f"Confidence: {response.get('confidence', 0) * 100:.1f}%")
    
    # Create a "mock model response" to see if the output processing can be influenced
    mock_response = base_features.copy()
    mock_response["output"] = json.dumps({
        "is_attack": True,
        "prediction": 1,
        "confidence": 0.99,
        "attack_type": "Injection"
    })
    
    print("\nTrying mock response injection:")
    response = run_ml_model(mock_response)
    print(f"Prediction: {'Attack' if response.get('is_attack') else 'Not Attack'}")
    print(f"Confidence: {response.get('confidence', 0) * 100:.1f}%")
    
    return response

if __name__ == "__main__":
    # First, explore if there are issues with how attack/non-attack are labeled
    print_header("ML MODEL ATTACK DETECTION EXPLORER")
    print("This script tries to find features that would make the ML model detect an attack.\n")
    
    explore_attack_label()
    
    # Then try to find combinations that trigger attack detection
    best_features, max_confidence = find_attack_trigger()
    
    print("\nConclusion:")
    print("=" * 60)
    if max_confidence > 0.5:
        print("Found feature combinations that trigger attack detection!")
        print(f"Highest confidence: {max_confidence * 100:.1f}%")
    else:
        print("Could not find any feature combination that triggers attack detection.")
        print("This strongly suggests the model is incorrectly trained or has fundamental issues.")
        print("Recommendation: Train a new model with proper attack/non-attack labels.") 