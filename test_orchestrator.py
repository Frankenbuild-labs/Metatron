#!/usr/bin/env python3
"""
Test script for Metatron Orchestrator API
"""

import requests
import json

def test_health():
    """Test the health endpoint"""
    try:
        response = requests.get('http://localhost:5001/api/orchestrator/health')
        print(f"Health Check Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_chat(message):
    """Test the chat endpoint"""
    try:
        data = {
            'message': message,
            'context': {'test': True},
            'workspace': 'orchestrator'
        }
        
        response = requests.post(
            'http://localhost:5001/api/orchestrator/chat',
            json=data,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"\nChat Test Status: {response.status_code}")
        print(f"Message: {message}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Chat test failed: {e}")
        return False

def test_status():
    """Test the status endpoint"""
    try:
        response = requests.get('http://localhost:5001/api/orchestrator/status')
        print(f"\nStatus Check: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Status check failed: {e}")
        return False

if __name__ == '__main__':
    print("🧪 Testing Metatron Orchestrator API...")
    
    # Test health endpoint
    print("\n" + "="*50)
    print("1. Testing Health Endpoint")
    print("="*50)
    health_ok = test_health()
    
    # Test status endpoint
    print("\n" + "="*50)
    print("2. Testing Status Endpoint")
    print("="*50)
    status_ok = test_status()
    
    # Test chat endpoint with different messages
    print("\n" + "="*50)
    print("3. Testing Chat Endpoint")
    print("="*50)
    
    test_messages = [
        "Hello, I need help with creative projects",
        "Generate a beautiful sunset landscape image",
        "Create an anime character with blue hair",
        "Can you help me start a video meeting?",
        "I want to research information about AI",
        "What can you help me with?"
    ]
    
    chat_results = []
    for msg in test_messages:
        chat_results.append(test_chat(msg))
    
    # Summary
    print("\n" + "="*50)
    print("🎯 TEST SUMMARY")
    print("="*50)
    print(f"Health Check: {'✅ PASS' if health_ok else '❌ FAIL'}")
    print(f"Status Check: {'✅ PASS' if status_ok else '❌ FAIL'}")
    print(f"Chat Tests: {sum(chat_results)}/{len(chat_results)} passed")
    
    if all([health_ok, status_ok] + chat_results):
        print("\n🎉 ALL TESTS PASSED! Orchestrator is working correctly.")
    else:
        print("\n⚠️ Some tests failed. Check the output above for details.")
