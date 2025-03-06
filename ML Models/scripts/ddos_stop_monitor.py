#!/usr/bin/env python3
import os
import signal
import json

# Path to the ML Models directory
ML_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MONITOR_PID_FILE = os.path.join(ML_DIR, 'scripts', '.ddos_monitor.pid')

def stop_monitor():
    """Stop the DDoS monitoring process"""
    if not os.path.exists(MONITOR_PID_FILE):
        print("DDoS monitor is not running")
        return False
    
    try:
        with open(MONITOR_PID_FILE, 'r') as f:
            pid = int(f.read().strip())
        
        # Send termination signal to the process
        os.kill(pid, signal.SIGTERM)
        print(f"Sent termination signal to process {pid}")
        
        # Wait for the process to terminate
        import time
        for _ in range(5):  # Wait up to 5 seconds
            try:
                os.kill(pid, 0)  # Check if process exists
                time.sleep(1)
            except OSError:
                # Process has terminated
                break
        
        # Remove the PID file
        if os.path.exists(MONITOR_PID_FILE):
            os.remove(MONITOR_PID_FILE)
        
        print("DDoS monitor stopped successfully")
        return True
    except Exception as e:
        print(f"Error stopping DDoS monitor: {e}")
        
        # Clean up the PID file if it exists
        if os.path.exists(MONITOR_PID_FILE):
            os.remove(MONITOR_PID_FILE)
        
        return False

if __name__ == "__main__":
    success = stop_monitor()
    
    # Return a JSON result
    result = {
        "success": success
    }
    
    print(json.dumps(result)) 