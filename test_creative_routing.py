#!/usr/bin/env python3
"""
Test script to verify Creative Studio tool routing
"""

import requests
import json

def test_creative_routing():
    """Test if creative requests are properly routed to the Creative Studio tool"""
    
    creative_requests = [
        "Generate a beautiful sunset landscape image",
        "Create an anime character with blue hair", 
        "Draw a futuristic cityscape",
        "Make an artistic portrait of a cat"
    ]
    
    non_creative_requests = [
        "Can you help me start a video meeting?",
        "I want to research information about AI",
        "What can you help me with?",
        "Hello, how are you today?"
    ]
    
    print("🧪 Testing Creative Studio Tool Routing...")
    
    print("\n" + "="*60)
    print("CREATIVE REQUESTS (should route to Creative Studio tool)")
    print("="*60)
    
    for i, message in enumerate(creative_requests, 1):
        try:
            data = {
                'message': message,
                'context': {'test': True},
                'workspace': 'orchestrator'
            }
            
            response = requests.post(
                'http://localhost:5001/api/orchestrator/chat',
                json=data,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code == 200:
                result = response.json()
                response_text = result.get('response', '')
                
                print(f"\n{i}. Message: {message}")
                print(f"   Status: ✅ {response.status_code}")
                
                # Check if response indicates Creative Studio tool usage
                if "Creative Studio Coordination" in response_text:
                    print(f"   Routing: ✅ CREATIVE STUDIO TOOL")
                elif "Creative Studio Request Processed" in response_text:
                    print(f"   Routing: ✅ CREATIVE STUDIO TOOL (Fallback)")
                elif "Creative Studio Ready" in response_text:
                    print(f"   Routing: ⚠️ FALLBACK MODE")
                else:
                    print(f"   Routing: ❌ UNKNOWN")
                
                # Show first 100 chars of response
                print(f"   Response: {response_text[:100]}...")
                
            else:
                print(f"\n{i}. Message: {message}")
                print(f"   Status: ❌ {response.status_code}")
                
        except Exception as e:
            print(f"\n{i}. Message: {message}")
            print(f"   Error: ❌ {str(e)}")
    
    print("\n" + "="*60)
    print("NON-CREATIVE REQUESTS (should use fallback responses)")
    print("="*60)
    
    for i, message in enumerate(non_creative_requests, 1):
        try:
            data = {
                'message': message,
                'context': {'test': True},
                'workspace': 'orchestrator'
            }
            
            response = requests.post(
                'http://localhost:5001/api/orchestrator/chat',
                json=data,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code == 200:
                result = response.json()
                response_text = result.get('response', '')
                
                print(f"\n{i}. Message: {message}")
                print(f"   Status: ✅ {response.status_code}")
                
                # Check response type
                if "Video Meeting" in response_text:
                    print(f"   Type: ✅ VIDEO MEETING")
                elif "Research" in response_text:
                    print(f"   Type: ✅ RESEARCH")
                elif "Platform Capabilities" in response_text:
                    print(f"   Type: ✅ GENERAL HELP")
                elif "Creative Studio" in response_text:
                    print(f"   Type: ⚠️ CREATIVE (unexpected)")
                else:
                    print(f"   Type: ❓ OTHER")
                
                # Show first 100 chars of response
                print(f"   Response: {response_text[:100]}...")
                
            else:
                print(f"\n{i}. Message: {message}")
                print(f"   Status: ❌ {response.status_code}")
                
        except Exception as e:
            print(f"\n{i}. Message: {message}")
            print(f"   Error: ❌ {str(e)}")

def test_status_endpoint():
    """Test the status endpoint to see tool information"""
    try:
        response = requests.get('http://localhost:5001/api/orchestrator/status')
        if response.status_code == 200:
            result = response.json()
            status = result.get('status', {})
            
            print(f"\n📊 ORCHESTRATOR STATUS:")
            print(f"   Orchestrator Initialized: {status.get('orchestrator_initialized')}")
            print(f"   PraisonAI Available: {status.get('praisonai_available')}")
            print(f"   Tools Available: {status.get('tools_available', [])}")
            print(f"   Tools Count: {status.get('tools_count', 0)}")
            print(f"   Service Mode: {status.get('service_mode')}")
            print(f"   Conversation Length: {status.get('conversation_length')}")
            
        else:
            print(f"❌ Status check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Status check error: {str(e)}")

if __name__ == '__main__':
    test_status_endpoint()
    test_creative_routing()
    
    print("\n" + "="*60)
    print("🎯 ROUTING TEST COMPLETE")
    print("="*60)
    print("Check the results above to verify Creative Studio tool routing is working correctly.")
