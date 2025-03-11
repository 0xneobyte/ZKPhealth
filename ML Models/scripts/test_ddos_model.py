#!/usr/bin/env python3
import os
import sys
import json
import subprocess
import time

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

# Real-world traffic features we've been seeing
real_traffic_features = {
    "dt": int(time.time() * 1000),
    "pktcount": 62,
    "bytecount": 0,
    "dur": 30,
    "flows": 3,
    "packetins": 62,
    "pktperflow": 20.67,
    "byteperflow": 0,
    "pktrate": 2.07,
    "Protocol": "UDP",
    "port_no": 80,
    "tx_bytes": 0,
    "rx_bytes": 0,
    "syn_flag": 1,
    "ack_flag": 1,
    "psh_flag": 0,
    "rst_flag": 0,
    "fin_flag": 1,
    "window_size": 65535,
    "urgent_ptr": 0,
    "header_len": 20
}

# Training data scale features from CSV file sample (first record)
training_scale_features = {
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

# Known attack pattern based on our documentation
known_attack_features = {
    "dt": 11425,
    "pktcount": 126395,    # Very high packet count
    "bytecount": 134737070, # High byte count
    "dur": 280,            # Longer duration
    "flows": 2,
    "packetins": 1943,
    "pktperflow": 13531,
    "byteperflow": 14424046,
    "pktrate": 451,        # Very high packet rate
    "Protocol": "UDP",     # UDP protocol (from training data)
    "port_no": 4,          # Note this specific port
    "tx_bytes": 354583059, # Very high tx_bytes
    "rx_bytes": 4295,
    "syn_flag": 0,         # These fields are added to match our current format
    "ack_flag": 0,
    "psh_flag": 0,
    "rst_flag": 0,
    "fin_flag": 0,
    "window_size": 65535,
    "urgent_ptr": 0,
    "header_len": 20
}

# Scaled version of our real-world traffic to match training data scale
scaled_real_traffic = real_traffic_features.copy()
scaled_real_traffic.update({
    "pktcount": real_traffic_features["pktcount"] * 700,      # Scale up by 700x
    "bytecount": real_traffic_features["pktcount"] * 700 * 1000, # Approx byte count
    "packetins": real_traffic_features["packetins"] * 30,     # Scale up by 30x
    "pktperflow": real_traffic_features["pktperflow"] * 600,  # Scale up by 600x
    "byteperflow": real_traffic_features["pktperflow"] * 600 * 1000,
    "pktrate": real_traffic_features["pktrate"] * 200,        # Scale up by 200x
    "tx_bytes": real_traffic_features["pktcount"] * 700 * 2000, # Approx tx bytes
    "rx_bytes": real_traffic_features["pktcount"] * 60,       # Approx rx bytes
})

# Real traffic with extreme amplification (higher than training data)
extreme_amplified_traffic = real_traffic_features.copy()
extreme_amplified_traffic.update({
    "pktcount": real_traffic_features["pktcount"] * 3000,     # Much higher than training
    "bytecount": real_traffic_features["pktcount"] * 3000 * 2000,
    "packetins": real_traffic_features["packetins"] * 100,
    "pktperflow": real_traffic_features["pktperflow"] * 1000,
    "byteperflow": real_traffic_features["pktperflow"] * 1000 * 2000,
    "pktrate": real_traffic_features["pktrate"] * 500,        # Well above training rate
    "tx_bytes": real_traffic_features["pktcount"] * 3000 * 3000,
    "rx_bytes": real_traffic_features["pktcount"] * 200,
})

if __name__ == "__main__":
    # Test 1: Real-world traffic (what we've been sending)
    print_header("TEST 1: REAL-WORLD TRAFFIC (CURRENT)")
    print("Sending features similar to what we're currently sending:")
    print(json.dumps(real_traffic_features, indent=2))
    
    response = run_ml_model(real_traffic_features)
    print("\nML Model Response:")
    print(json.dumps(response, indent=2))
    print(f"\nDetected as attack: {'YES' if response.get('is_attack') else 'NO'}")
    print(f"Confidence: {response.get('confidence', 0) * 100:.1f}%")
    
    # Test 2: Training data scale features
    print_header("TEST 2: TRAINING DATA SCALE (NORMAL TRAFFIC)")
    print("Sending features at the scale the model was trained on:")
    print(json.dumps(training_scale_features, indent=2))
    
    response = run_ml_model(training_scale_features)
    print("\nML Model Response:")
    print(json.dumps(response, indent=2))
    print(f"\nDetected as attack: {'YES' if response.get('is_attack') else 'NO'}")
    print(f"Confidence: {response.get('confidence', 0) * 100:.1f}%")
    
    # Test 3: Known attack pattern from CSV file
    print_header("TEST 3: KNOWN ATTACK PATTERN")
    print("Sending a known attack pattern from the training data:")
    print(json.dumps(known_attack_features, indent=2))
    
    response = run_ml_model(known_attack_features)
    print("\nML Model Response:")
    print(json.dumps(response, indent=2))
    print(f"\nDetected as attack: {'YES' if response.get('is_attack') else 'NO'}")
    print(f"Confidence: {response.get('confidence', 0) * 100:.1f}%")
    
    # Test 4: Extreme amplification of real traffic
    print_header("TEST 4: EXTREME AMPLIFICATION")
    print("Sending our traffic with extreme amplification (much higher than training):")
    print(json.dumps(extreme_amplified_traffic, indent=2))
    
    response = run_ml_model(extreme_amplified_traffic)
    print("\nML Model Response:")
    print(json.dumps(response, indent=2))
    print(f"\nDetected as attack: {'YES' if response.get('is_attack') else 'NO'}")
    print(f"Confidence: {response.get('confidence', 0) * 100:.1f}%")
    
    print("\nSummary of Tests:")
    print("=" * 60)
    print("This demonstrates that the ML model was likely trained with specific")
    print("attack patterns from the training data, and it doesn't generalize well")
    print("to detect attacks at different scales or with different characteristics.") 