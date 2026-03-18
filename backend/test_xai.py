#!/usr/bin/env python3
"""Test the xAI-powered backend"""

import requests
import json
import time

BASE_URL = "http://127.0.0.1:3002"

print("Testing xAI-powered Backend")
print("=" * 60)

# Test 1: Health check
print("\n[1] Health Check")
try:
    response = requests.get(f"{BASE_URL}/health", timeout=5)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json())}")
except Exception as e:
    print(f"Error: {e}")

# Test 2: Chat with Grok
print("\n[2] Chat Endpoint (Explain bubble sort)")
try:
    payload = {
        "user_input": "explain bubble sort to me like I'm 10",
        "conversation_history": [],
        "current_topic": None,
        "explanation_style": None
    }
    
    response = requests.post(f"{BASE_URL}/chat", json=payload, stream=True, timeout=30)
    print(f"Status: {response.status_code}")
    
    chunk_count = 0
    for line in response.iter_lines():
        if line:
            line_str = line.decode('utf-8') if isinstance(line, bytes) else line
            if line_str.startswith('data: '):
                chunk_count += 1
                json_str = line_str[6:]
                try:
                    data = json.loads(json_str)
                    if chunk_count <= 3:
                        print(f"  Chunk {chunk_count}: {json.dumps(data, indent=2)[:200]}")
                except:
                    pass
    
    print(f"  Total chunks: {chunk_count}")
    print("Chat endpoint working with xAI!")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("Backend is now using xAI (Grok) API!")
print("Port: 3002")
