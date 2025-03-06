#!/usr/bin/env python3
import json
import sys
import re
import os
import random
import pickle
import numpy as np
import warnings

# Redirect warnings to stderr to avoid interfering with JSON output
warnings.filterwarnings("ignore")

# Path to the ML Models directory
ML_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ML_DIR, 'data')
ARTIFACTS_DIR = os.path.join(ML_DIR, 'artifacts')

# Import the embedding model - try to handle different environments
try:
    from llama_index.embeddings.huggingface import HuggingFaceEmbedding
    EMBEDDING_AVAILABLE = True
except ImportError:
    sys.stderr.write("Warning: HuggingFaceEmbedding not available. Falling back to pattern matching.\n")
    EMBEDDING_AVAILABLE = False

# Common XSS patterns to detect (fallback if ML model is not available)
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

# Load the trained model
def load_model():
    model_path = os.path.join(ARTIFACTS_DIR, 'xss_model.pickle')
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

# Initialize embedding model
def initialize_embedding():
    try:
        import torch
        embed_model = HuggingFaceEmbedding(
            model_name="BAAI/bge-small-en-v1.5",
            device="cuda:0" if torch.cuda.is_available() else "cpu"
        )
        sys.stderr.write("Initialized embedding model\n")
        return embed_model
    except Exception as e:
        sys.stderr.write(f"Error initializing embedding model: {e}\n")
        return None

# Global variables for model and embedding
MODEL = load_model() if EMBEDDING_AVAILABLE else None
EMBED_MODEL = initialize_embedding() if EMBEDDING_AVAILABLE and MODEL else None

# Function to analyze a payload for XSS vulnerabilities
def analyze_xss(payload):
    if not payload:
        return {
            "is_attack": False,
            "confidence": 0.0,
            "attack_type": None,
            "matched_patterns": []
        }
    
    # Try to use the ML model if available
    if MODEL is not None and EMBED_MODEL is not None:
        try:
            # Get embedding for the payload
            embedding = EMBED_MODEL.get_text_embedding(payload)
            embedding = np.array([embedding])
            
            # Get prediction probabilities
            prediction = MODEL.predict_proba(embedding)
            is_attack = prediction[0][1] > 0.5
            confidence = prediction[0][1]
            
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
            
            sys.stderr.write(f"ML model prediction: {'Attack' if is_attack else 'Normal'} with confidence {confidence:.2f}\n")
            
            return {
                "is_attack": is_attack,
                "confidence": round(float(confidence), 2),
                "attack_type": attack_type,
                "matched_patterns": [],
                "source_ip": source_ip,
                "target_endpoint": target_endpoint,
                "method": "ml_model"
            }
        except Exception as e:
            sys.stderr.write(f"Error using ML model: {e}\n")
            sys.stderr.write("Falling back to pattern matching\n")
    
    # Fallback to pattern matching if ML model is not available or fails
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
    
    sys.stderr.write(f"Pattern matching result: {'Attack' if is_attack else 'Normal'} with confidence {confidence:.2f}\n")
    
    return {
        "is_attack": is_attack,
        "confidence": round(confidence, 2),
        "attack_type": attack_type,
        "matched_patterns": matched_patterns,
        "source_ip": source_ip,
        "target_endpoint": target_endpoint,
        "method": "pattern_matching"
    }

if __name__ == "__main__":
    # Get payload from command line argument
    payload = sys.argv[1] if len(sys.argv) > 1 else ""
    
    # Analyze the payload
    result = analyze_xss(payload)
    
    # Output the result as JSON (only to stdout)
    print(json.dumps(result)) 