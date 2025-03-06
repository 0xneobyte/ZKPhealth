#!/usr/bin/env python3
import os
import json
import time
import random
import datetime
import sys
from collections import deque
import threading
import socket
import http.server
import socketserver
from urllib.parse import urlparse, parse_qs

# In a real implementation, we would import scapy
# from scapy.all import sniff, IP, TCP, UDP

# Path to the ML Models directory
ML_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# File to indicate a DoS simulation is in progress
DOS_SIMULATION_FLAG_FILE = os.path.join(ML_DIR, 'scripts', '.dos_simulation_in_progress')

# Store the last 100 packets
packet_logs = deque(maxlen=100)

# Flag to control the monitoring loop
running = True

# Protocol mapping
PROTOCOLS = {
    1: "ICMP",
    6: "TCP",
    17: "UDP",
    # Add more as needed
}

# Function to generate a mock packet (for simulation)
def generate_mock_packet():
    """Generate a mock packet for simulation purposes"""
    src_ip = f"{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}"
    dst_ip = f"{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}"
    
    # Randomly choose protocol
    protocol = random.choice(list(PROTOCOLS.keys()))
    protocol_name = PROTOCOLS[protocol]
    
    # Generate ports for TCP/UDP
    src_port = random.randint(1024, 65535) if protocol in [6, 17] else None
    dst_port = random.choice([80, 443, 22, 21, 25, 53, 3306, 5432]) if protocol in [6, 17] else None
    
    # Generate packet size
    size = random.randint(64, 1500)
    
    # Generate TCP flags (if TCP)
    flags = ""
    if protocol == 6:  # TCP
        flag_options = ["S", "A", "F", "R", "P", "U"]
        num_flags = random.randint(1, 3)
        flags = "".join(random.sample(flag_options, num_flags))
    
    # Generate timestamp
    timestamp = datetime.datetime.now().isoformat()
    
    # Create packet object
    packet = {
        "timestamp": timestamp,
        "protocol": protocol_name,
        "src_ip": src_ip,
        "dst_ip": dst_ip,
        "size": size,
        "ttl": random.randint(32, 128)
    }
    
    # Add protocol-specific fields
    if protocol in [6, 17]:  # TCP or UDP
        packet["src_port"] = src_port
        packet["dst_port"] = dst_port
    
    if protocol == 6:  # TCP
        packet["flags"] = flags
    
    return packet

def capture_packets():
    """Capture network packets (simulation)"""
    while running:
        # In a real implementation, this would capture actual packets
        # For simulation, we'll generate random packets
        packet = generate_mock_packet()
        packet_logs.append(packet)
        
        # Sleep for a random time to simulate varying packet rates
        time.sleep(random.uniform(0.1, 0.5))

# HTTP request handler for the packet log API
class PacketLogHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        # Handle API endpoints
        if parsed_path.path == "/api/packets":
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            # Get query parameters
            query = parse_qs(parsed_path.query)
            limit = int(query.get('limit', ['100'])[0])
            
            # Get the packets (limited by the query parameter)
            packets = list(packet_logs)[-limit:]
            
            self.wfile.write(json.dumps(packets).encode())
            return
        
        # Handle simulated DoS attack
        elif parsed_path.path == "/api/simulate-dos":
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            # Get query parameters
            query = parse_qs(parsed_path.query)
            target_ip = query.get('target', ['192.168.1.1'])[0]
            duration = int(query.get('duration', ['10'])[0])  # Duration in seconds
            
            # Start a thread to simulate DoS attack
            threading.Thread(target=simulate_dos_attack, args=(target_ip, duration)).start()
            
            response = {
                "status": "success",
                "message": f"Simulating DoS attack on {target_ip} for {duration} seconds"
            }
            
            self.wfile.write(json.dumps(response).encode())
            return
        
        # Default: return 404
        self.send_response(404)
        self.end_headers()
        self.wfile.write(b'Not Found')

# Function to set the DoS simulation flag
def set_dos_simulation_flag(target_ip):
    """Create a flag file to indicate a DoS simulation is in progress"""
    with open(DOS_SIMULATION_FLAG_FILE, 'w') as f:
        f.write(target_ip)
    sys.stderr.write(f"DoS simulation flag set for target: {target_ip}\n")

# Function to clear the DoS simulation flag
def clear_dos_simulation_flag():
    """Remove the flag file when simulation is complete"""
    if os.path.exists(DOS_SIMULATION_FLAG_FILE):
        os.remove(DOS_SIMULATION_FLAG_FILE)
        sys.stderr.write("DoS simulation flag cleared\n")

# Function to simulate a DoS attack
def simulate_dos_attack(target_ip, duration):
    """Simulate a DoS attack by generating a high volume of packets to the target"""
    sys.stderr.write(f"Simulating DoS attack on {target_ip} for {duration} seconds\n")
    
    # Set the simulation flag
    set_dos_simulation_flag(target_ip)
    
    end_time = time.time() + duration
    
    try:
        while time.time() < end_time:
            # Generate 10-20 packets per iteration
            for _ in range(random.randint(10, 20)):
                # Create a SYN flood packet (TCP with SYN flag)
                packet = {
                    "timestamp": datetime.datetime.now().isoformat(),
                    "src_ip": f"{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}",
                    "dst_ip": target_ip,
                    "protocol": "TCP",
                    "src_port": random.randint(1024, 65535),
                    "dst_port": random.choice([80, 443, 22]),
                    "flags": "S",  # SYN flag
                    "size": random.randint(64, 128),
                    "ttl": random.randint(32, 128)
                }
                
                packet_logs.append(packet)
            
            # Sleep for a short time to avoid overwhelming the CPU
            time.sleep(0.05)
    finally:
        # Always clear the flag when done, even if there's an error
        clear_dos_simulation_flag()
        sys.stderr.write(f"DoS attack simulation completed\n")

# Function to check if a port is available
def is_port_available(port):
    """Check if a port is available for use"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(("", port))
            return True
    except OSError:
        return False

# Function to find an available port
def find_available_port(start_port, max_attempts=10):
    """Find an available port starting from start_port"""
    for port in range(start_port, start_port + max_attempts):
        if is_port_available(port):
            return port
    return None

if __name__ == "__main__":
    # Start packet capture in a separate thread
    capture_thread = threading.Thread(target=capture_packets)
    capture_thread.daemon = True
    capture_thread.start()
    
    # Start HTTP server for the API
    DEFAULT_PORT = 8000
    
    # Try to find an available port
    PORT = find_available_port(DEFAULT_PORT, 20)
    
    if PORT is None:
        sys.stderr.write(f"Could not find an available port after trying {DEFAULT_PORT} through {DEFAULT_PORT + 19}\n")
        sys.exit(1)
    
    try:
        with socketserver.TCPServer(("", PORT), PacketLogHandler) as httpd:
            sys.stderr.write(f"Packet logger API running at http://localhost:{PORT}\n")
            sys.stderr.write(f"View packets: http://localhost:{PORT}/api/packets\n")
            sys.stderr.write(f"Simulate DoS: http://localhost:{PORT}/api/simulate-dos?target=192.168.1.1&duration=10\n")
            
            # Print the port to stdout for the parent process to capture
            print(PORT)
            sys.stdout.flush()
            
            httpd.serve_forever()
    except KeyboardInterrupt:
        sys.stderr.write("Shutting down packet logger\n")
        running = False 