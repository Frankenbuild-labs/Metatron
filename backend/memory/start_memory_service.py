#!/usr/bin/env python3
"""
Metatron Memory Service Startup Script
Initializes and starts the production-ready memory system
"""

import os
import sys
import subprocess
import time
import requests
from pathlib import Path

def check_dependencies():
    """Check if required dependencies are installed"""
    print("🔍 Checking dependencies...")
    
    required_packages = [
        'mem0ai',
        'flask',
        'flask-cors',
        'chromadb',
        'google-generativeai'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"  ✅ {package}")
        except ImportError:
            missing_packages.append(package)
            print(f"  ❌ {package}")
    
    if missing_packages:
        print(f"\n📦 Installing missing packages: {', '.join(missing_packages)}")
        try:
            subprocess.check_call([
                sys.executable, '-m', 'pip', 'install'
            ] + missing_packages)
            print("✅ Dependencies installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install dependencies: {e}")
            return False
    
    return True

def check_environment():
    """Check environment variables"""
    print("\n🔧 Checking environment configuration...")
    
    required_env_vars = [
        'GOOGLE_GEMINI_API_KEY'
    ]
    
    missing_vars = []
    
    for var in required_env_vars:
        if os.getenv(var):
            print(f"  ✅ {var}")
        else:
            missing_vars.append(var)
            print(f"  ❌ {var}")
    
    if missing_vars:
        print(f"\n⚠️ Missing environment variables: {', '.join(missing_vars)}")
        print("Please set these variables before starting the service:")
        for var in missing_vars:
            print(f"  export {var}=your_value_here")
        return False
    
    return True

def create_directories():
    """Create necessary directories"""
    print("\n📁 Creating directories...")
    
    directories = [
        './backend/memory/data',
        './backend/memory/data/chromadb',
        './backend/memory/logs'
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"  ✅ {directory}")

def test_memory_service():
    """Test if memory service is running"""
    print("\n🧪 Testing memory service...")
    
    max_retries = 10
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            response = requests.get('http://localhost:5006/api/memory/health', timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"  ✅ Memory service is healthy")
                print(f"  📊 Status: {data.get('status')}")
                print(f"  🧠 Backend: {data.get('memory_backend')}")
                print(f"  🔗 MEM0 Available: {data.get('mem0_available')}")
                return True
        except requests.exceptions.RequestException:
            pass
        
        print(f"  ⏳ Attempt {attempt + 1}/{max_retries} - waiting for service...")
        time.sleep(retry_delay)
    
    print("  ❌ Memory service failed to start properly")
    return False

def start_memory_service():
    """Start the memory service"""
    print("\n🚀 Starting Metatron Memory Service...")
    
    # Change to memory directory
    memory_dir = Path(__file__).parent
    os.chdir(memory_dir)
    
    try:
        # Start the memory API service
        process = subprocess.Popen([
            sys.executable, 'memory_api.py'
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        print(f"  🔄 Memory service started with PID: {process.pid}")
        
        # Wait a moment for service to initialize
        time.sleep(3)
        
        # Test the service
        if test_memory_service():
            print("\n🎉 Memory service started successfully!")
            print("📍 Service endpoints:")
            print("  • Health: http://localhost:5006/api/memory/health")
            print("  • Add Memory: POST http://localhost:5006/api/memory/add")
            print("  • Search: POST http://localhost:5006/api/memory/search")
            print("  • Stats: GET http://localhost:5006/api/memory/stats")
            return process
        else:
            print("\n❌ Memory service failed to start properly")
            process.terminate()
            return None
            
    except Exception as e:
        print(f"❌ Failed to start memory service: {e}")
        return None

def main():
    """Main startup function"""
    print("🧠 Metatron Memory System Startup")
    print("=" * 50)
    
    # Check dependencies
    if not check_dependencies():
        print("❌ Dependency check failed")
        sys.exit(1)
    
    # Check environment
    if not check_environment():
        print("❌ Environment check failed")
        sys.exit(1)
    
    # Create directories
    create_directories()
    
    # Start memory service
    process = start_memory_service()
    
    if process:
        try:
            print("\n⌨️ Press Ctrl+C to stop the service")
            process.wait()
        except KeyboardInterrupt:
            print("\n🛑 Stopping memory service...")
            process.terminate()
            process.wait()
            print("✅ Memory service stopped")
    else:
        print("❌ Failed to start memory service")
        sys.exit(1)

if __name__ == '__main__':
    main()
