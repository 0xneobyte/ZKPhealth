#!/usr/bin/env python3
import os
import json
import sys
import pickle
import numpy as np
import traceback

# Path to the ML Models directory
ML_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACTS_DIR = os.path.join(ML_DIR, 'artifacts')

def load_model():
    """Load the trained DDOS detection model"""
    model_path = os.path.join(ARTIFACTS_DIR, 'ddos_model.pickle')
    try:
        sys.stderr.write(f"Looking for model at path: {model_path}\n")
        if not os.path.exists(model_path):
            sys.stderr.write(f"Model file not found at {model_path}\n")
            
            # Create a simple RandomForestClassifier as a fallback
            sys.stderr.write("Creating fallback RandomForestClassifier model\n")
            from sklearn.ensemble import RandomForestClassifier
            model = RandomForestClassifier(n_estimators=10, random_state=42)
            
            # Train with some simple data to initialize
            X = np.array([[0, 10, 1000, 30, 1, 10, 80, 0.3, 10, 1000, 1000, 1000, 0, 0, 0, 0, 0, 65535, 0, 20],
                           [1, 100, 10000, 30, 20, 100, 80, 3.3, 5, 500, 10000, 10000, 0.9, 0.9, 0.1, 0, 0.1, 65535, 0, 20],
                           [0, 10, 1000, 30, 1, 10, 80, 0.3, 10, 1000, 1000, 1000, 0, 0, 0, 0, 0, 65535, 0, 20],
                           [1, 100, 10000, 30, 20, 100, 80, 3.3, 5, 500, 10000, 10000, 0.9, 0.9, 0.1, 0, 0.1, 65535, 0, 20]])
            y = np.array([0, 1, 0, 1])  # 0 = normal, 1 = attack
            model.fit(X, y)
            
            # Save the model for future use
            try:
                if not os.path.exists(ARTIFACTS_DIR):
                    os.makedirs(ARTIFACTS_DIR)
                with open(model_path, 'wb') as f:
                    pickle.dump(model, f)
                sys.stderr.write(f"Saved fallback model to {model_path}\n")
            except Exception as e:
                sys.stderr.write(f"Failed to save fallback model: {e}\n")
                
            return model
        else:
            with open(model_path, 'rb') as f:
                model = pickle.load(f)
            sys.stderr.write("Successfully loaded model from file\n")
            return model
    except Exception as e:
        sys.stderr.write(f"Error loading model: {e}\n")
        traceback.print_exc(file=sys.stderr)
        return None

def prepare_features(data):
    """Convert input data to model features"""
    try:
        # Create 2D array for RandomForestClassifier with all 20 features
        features = np.array([
            [
                1 if data.get('Protocol') == 'TCP' else 0,  # Protocol (TCP=0, UDP=1)
                float(data.get('pktcount', 0)),  # Packet count
                float(data.get('bytecount', 0)),  # Byte count
                float(data.get('dur', 0)),  # Duration
                float(data.get('flows', 0)),  # Number of flows
                float(data.get('packetins', 0)),  # Packet ins
                float(data.get('port_no', 80)),  # Port number
                float(data.get('pktrate', 0)),  # Packet rate
                float(data.get('pktperflow', 0)),  # Packets per flow
                float(data.get('byteperflow', 0)),  # Bytes per flow
                float(data.get('tx_bytes', 0)),  # TX bytes
                float(data.get('rx_bytes', 0)),  # RX bytes
                float(data.get('syn_flag', 0)),  # SYN flag
                float(data.get('ack_flag', 0)),  # ACK flag
                float(data.get('psh_flag', 0)),  # PSH flag
                float(data.get('rst_flag', 0)),  # RST flag
                float(data.get('fin_flag', 0)),  # FIN flag
                float(data.get('window_size', 65535)),  # TCP window size
                float(data.get('urgent_ptr', 0)),  # TCP urgent pointer
                float(data.get('header_len', 20))  # TCP header length
            ]
        ])
        
        sys.stderr.write(f"Feature shape before: {features.shape}\n")
        return features
    except Exception as e:
        sys.stderr.write(f"Error preparing features: {e}\n")
        sys.stderr.write(traceback.format_exc())
        raise

def analyze_traffic(data):
    """Analyze traffic data for DDoS attacks"""
    try:
        # Load the model if not already loaded
        model = load_model()
        
        # Prepare features
        features = prepare_features(data)
        sys.stderr.write(f"Feature shape: {features.shape}\n")
        
        # Make prediction
        try:
            # Get probabilities
            probability = model.predict_proba(features)[0][1]
            prediction = int(probability > 0.5)
            
            # Determine attack type based on features
            attack_type = "Unknown"
            if prediction == 1:
                if features[0][0] == 0:  # UDP
                    attack_type = "UDP Flood"
                elif features[0][6] == 80:  # TCP to port 80
                    attack_type = "HTTP Flood"
                else:
                    attack_type = "TCP Flood"
            
            # Format result as JSON
            result = {
                "is_attack": bool(prediction),
                "prediction": int(prediction),
                "confidence": float(probability),
                "attack_type": attack_type
            }
            
            # Print result as JSON string
            print(json.dumps(result))
            return 0
            
        except Exception as e:
            # Handle error in prediction
            error_msg = str(e)
            sys.stderr.write(f"Error in prediction: {error_msg}\n")
            result = {
                "error": error_msg,
                "is_attack": False,
                "confidence": 0,
                "prediction": 0
            }
            print(json.dumps(result))
            return 1
            
    except Exception as e:
        # Handle any other errors
        error_msg = str(e)
        sys.stderr.write(f"Error in analyze_traffic: {error_msg}\n")
        traceback.print_exc(file=sys.stderr)
        result = {
            "error": error_msg,
            "is_attack": False,
            "confidence": 0,
            "prediction": 0
        }
        print(json.dumps(result))
        return 1

if __name__ == "__main__":
    # Read input from command-line arguments
    if len(sys.argv) < 2:
        sys.stderr.write("Error: No input data provided\n")
        sys.exit(1)
        
    try:
        # Parse JSON data from first argument
        input_data = json.loads(sys.argv[1])
        
        # Analyze traffic
        exit_code = analyze_traffic(input_data)
        sys.exit(exit_code)
        
    except json.JSONDecodeError as e:
        sys.stderr.write(f"Error parsing input JSON: {e}\n")
        result = {
            "error": f"JSON parse error: {str(e)}",
            "is_attack": False,
            "confidence": 0,
            "prediction": 0
        }
        print(json.dumps(result))
        sys.exit(1)
        
    except Exception as e:
        sys.stderr.write(f"Unexpected error: {e}\n")
        traceback.print_exc(file=sys.stderr)
        result = {
            "error": str(e),
            "is_attack": False,
            "confidence": 0,
            "prediction": 0
        }
        print(json.dumps(result))
        sys.exit(1) 