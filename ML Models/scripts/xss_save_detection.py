#!/usr/bin/env python3
import json
import sys
import os
from xss_stats import save_xss_detection

if __name__ == "__main__":
    # Get detection data from command line argument
    detection_json = sys.argv[1] if len(sys.argv) > 1 else "{}"
    
    try:
        # Parse the detection data
        detection = json.loads(detection_json)
        
        # Save the detection
        save_xss_detection(detection)
        
        # Output success to stdout (only valid JSON)
        print(json.dumps({"success": True}))
    except Exception as e:
        # Log error to stderr
        sys.stderr.write(f"Error saving XSS detection: {str(e)}\n")
        # Output error as JSON to stdout
        print(json.dumps({"success": False, "error": str(e)})) 