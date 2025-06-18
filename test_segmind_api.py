#!/usr/bin/env python3
"""
Test script for Segmind API
"""

import requests
import json

def test_segmind_health():
    """Test the Segmind health endpoint"""
    try:
        response = requests.get('http://localhost:5002/api/segmind/health')
        print(f"Health Check Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_segmind_models():
    """Test the Segmind models endpoint"""
    try:
        response = requests.get('http://localhost:5002/api/segmind/models')
        print(f"Models Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Available models: {len(result.get('models', []))}")
            for model in result.get('models', [])[:3]:  # Show first 3
                print(f"  - {model['name']} ({model['id']})")
        else:
            print(f"Error: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"Models test failed: {e}")
        return False

def test_segmind_generate():
    """Test the Segmind generation endpoint"""
    try:
        data = {
            'prompt': 'a simple test image',
            'model': 'sdxl',
            'width': 512,
            'height': 512
        }
        
        print(f"Testing generation with: {data}")
        response = requests.post(
            'http://localhost:5002/api/segmind/generate',
            json=data,
            timeout=30
        )
        
        print(f"Generation Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print(f"✅ Generation successful!")
                print(f"Generation ID: {result.get('generation_id')}")
                print(f"Model: {result.get('model_name')}")
                print(f"Seed: {result.get('seed')}")
            else:
                print(f"❌ Generation failed: {result.get('error')}")
        else:
            print(f"❌ API Error: {response.text}")
        
        return response.status_code == 200
        
    except Exception as e:
        print(f"Generation test failed: {e}")
        return False

if __name__ == '__main__':
    print("🧪 Testing Segmind API...")
    
    print("\n" + "="*50)
    print("1. Testing Health Endpoint")
    print("="*50)
    health_ok = test_segmind_health()
    
    print("\n" + "="*50)
    print("2. Testing Models Endpoint")
    print("="*50)
    models_ok = test_segmind_models()
    
    print("\n" + "="*50)
    print("3. Testing Generation Endpoint")
    print("="*50)
    generate_ok = test_segmind_generate()
    
    print("\n" + "="*50)
    print("🎯 TEST SUMMARY")
    print("="*50)
    print(f"Health Check: {'✅ PASS' if health_ok else '❌ FAIL'}")
    print(f"Models Check: {'✅ PASS' if models_ok else '❌ FAIL'}")
    print(f"Generation Check: {'✅ PASS' if generate_ok else '❌ FAIL'}")
    
    if all([health_ok, models_ok, generate_ok]):
        print("\n🎉 ALL SEGMIND TESTS PASSED!")
    else:
        print("\n⚠️ Some Segmind tests failed. Check the output above for details.")
