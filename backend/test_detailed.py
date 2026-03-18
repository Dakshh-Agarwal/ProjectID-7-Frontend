#!/usr/bin/env python3
"""Detailed test of the new 4-state conversation flow"""

import requests
import json

BASE_URL = "http://127.0.0.1:3001"

def test_state_1_detailed():
    """Test STATE 1 with detailed output"""
    print("\n" + "="*80)
    print("TEST: STATE 1 - New Concept (Detailed Variable Output)")
    print("="*80)
    
    payload = {
        "user_input": "explain bubble sort",
        "conversation_history": [],
        "current_topic": None,
        "explanation_style": None
    }
    
    response = requests.post(f"{BASE_URL}/chat", json=payload, stream=True, timeout=60)
    print(f"Status: {response.status_code}\n")
    
    chunk_count = 0
    raw_output = ""
    
    for line in response.iter_lines():
        if line:
            line_str = line.decode('utf-8') if isinstance(line, bytes) else line
            raw_output += line_str + "\n"
            
            if line_str.startswith('data: '):
                chunk_count += 1
                json_str = line_str[6:]
                print(f"--- CHUNK {chunk_count} ---")
                print(f"Raw JSON length: {len(json_str)}")
                print(f"First 500 chars:\n{json_str[:500]}")
                
                try:
                    data = json.loads(json_str)
                    print(f"Parsed keys: {list(data.keys())}")
                    
                    for key, value in data.items():
                        if key == 'content' and isinstance(value, str) and len(value) > 100:
                            print(f"  {key}: {type(value).__name__} ({len(value)} chars)")
                            print(f"    First 200 chars: {value[:200]}")
                        else:
                            print(f"  {key}: {value}")
                except json.JSONDecodeError as e:
                    print(f"JSON Parse Error: {e}")
                print()
    
    print(f"\nTotal chunks received: {chunk_count}")
    print(f"Total output length: {len(raw_output)} chars")


def test_health():
    """Test health endpoint"""
    print("\n" + "="*80)
    print("TEST: Health Endpoint")
    print("="*80)
    
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")


if __name__ == "__main__":
    try:
        test_health()
        test_state_1_detailed()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
