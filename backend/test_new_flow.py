#!/usr/bin/env python3
"""Test the new 4-state conversation flow"""

import requests
import json
import time

BASE_URL = "http://127.0.0.1:3001"

def test_state_1_new_concept():
    """Test STATE 1: New concept input"""
    print("\n" + "="*60)
    print("TEST: STATE 1 - New Concept (Bubble Sort)")
    print("="*60)
    
    payload = {
        "user_input": "explain bubble sort",
        "conversation_history": [],
        "current_topic": None,
        "explanation_style": None
    }
    
    response = requests.post(f"{BASE_URL}/chat", json=payload, stream=True, timeout=60)
    print(f"Status: {response.status_code}")
    
    chunks_collected = []
    content_buffer = ""
    stage = None
    
    for line in response.iter_lines():
        if line:
            line_str = line.decode('utf-8') if isinstance(line, bytes) else line
            if line_str.startswith('data: '):
                json_str = line_str[6:]
                try:
                    data = json.loads(json_str)
                    chunks_collected.append(data)
                    
                    # Extract stage and content
                    if 'stage' in data:
                        stage = data['stage']
                        print(f"\n[STAGE] {stage}")
                    if 'content' in data:
                        # Parse the content JSON
                        try:
                            content_data = json.loads(data['content'])
                            if isinstance(content_data, dict):
                                if content_data.get('concept'):
                                    print(f"  Concept: {content_data['concept']}")
                                if content_data.get('style'):
                                    print(f"  Style: {content_data['style']}")
                                if content_data.get('is_clear'):
                                    print(f"  Clear: {content_data['is_clear']}")
                                if content_data.get('explanation'):
                                    print(f"  Explanation: {content_data['explanation'][:100]}...")
                                if content_data.get('question'):
                                    print(f"  Question: {content_data['question'][:80]}...")
                        except:
                            # If not valid JSON, show first 100 chars
                            print(f"  Content: {str(data.get('content', ''))[:100]}...")
                    if 'type' in data:
                        print(f"  Response Type: {data['type']}")
                    
                except json.JSONDecodeError as e:
                    print(f"JSON Error: {e}")
    
    print(f"\nTotal streaming chunks: {len(chunks_collected)}")
    return chunks_collected


def test_state_4_skip():
    """Test STATE 4: Skip command"""
    print("\n" + "="*60)
    print("TEST: STATE 4 - Skip Command")
    print("="*60)
    
    payload = {
        "user_input": "skip",
        "conversation_history": [],
        "current_topic": None,
        "explanation_style": None
    }
    
    response = requests.post(f"{BASE_URL}/chat", json=payload, stream=True, timeout=30)
    print(f"Status: {response.status_code}")
    
    for line in response.iter_lines():
        if line:
            line_str = line.decode('utf-8') if isinstance(line, bytes) else line
            if line_str.startswith('data: '):
                json_str = line_str[6:]
                try:
                    data = json.loads(json_str)
                    print(f"Response: {json.dumps(data, indent=2)}")
                except:
                    pass


if __name__ == "__main__":
    try:
        # Test STATE 1
        test_state_1_new_concept()
        
        # Test STATE 4
        time.sleep(2)
        test_state_4_skip()
        
        print("\n" + "="*60)
        print("All tests completed!")
        print("="*60)
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
