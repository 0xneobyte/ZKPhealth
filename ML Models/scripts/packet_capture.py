#!/usr/bin/env python3
import sys
import json
import signal
from scapy.all import *
from collections import defaultdict

# Global stats
stats = {
    'syn_count': 0,
    'ack_count': 0,
    'psh_count': 0,
    'rst_count': 0,
    'fin_count': 0,
    'total_window_size': 0,
    'total_urgent_ptr': 0,
    'total_header_len': 0,
    'packet_count': 0,
    'byte_count': 0
}

def packet_callback(packet):
    """Process each captured packet"""
    try:
        if TCP in packet:
            # Update TCP flag counts
            flags = packet[TCP].flags
            if flags & 0x02:  # SYN
                stats['syn_count'] += 1
            if flags & 0x10:  # ACK
                stats['ack_count'] += 1
            if flags & 0x08:  # PSH
                stats['psh_count'] += 1
            if flags & 0x04:  # RST
                stats['rst_count'] += 1
            if flags & 0x01:  # FIN
                stats['fin_count'] += 1
            
            # Update other TCP stats
            stats['total_window_size'] += packet[TCP].window
            stats['total_urgent_ptr'] += packet[TCP].urgptr
            stats['total_header_len'] += len(packet[TCP])
            
            # Update packet and byte counts
            stats['packet_count'] += 1
            stats['byte_count'] += len(packet)
            
            # Print current stats
            sys.stderr.write(f"Current stats: {json.dumps(stats)}\n")
            sys.stderr.flush()
            
            # Print stats as JSON to stdout
            print(json.dumps(stats))
            sys.stdout.flush()
    except Exception as e:
        sys.stderr.write(f"Error processing packet: {e}\n")
        sys.stderr.flush()

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    sys.stderr.write("\nStopping packet capture...\n")
    sys.exit(0)

if __name__ == "__main__":
    # Set up signal handler
    signal.signal(signal.SIGINT, signal_handler)
    
    try:
        # Start packet capture
        sys.stderr.write("Starting packet capture on port 3001...\n")
        sniff(filter="tcp port 3001", prn=packet_callback, store=0)
    except Exception as e:
        sys.stderr.write(f"Error in packet capture: {e}\n")
        sys.exit(1) 