#!/usr/bin/env python3
"""
Metatron AI Agent Service Startup Script
This script starts the AI agent service for the Metatron video meeting platform.
"""

import os
import sys
import subprocess
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_environment():
    """Check if the environment is properly set up."""
    logger.info("Checking environment setup...")
    
    # Check if virtual environment exists
    venv_path = os.path.join(os.path.dirname(__file__), 'venv')
    if not os.path.exists(venv_path):
        logger.error("Virtual environment not found. Please run setup first.")
        return False
    
    # Check if .env file exists
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if not os.path.exists(env_path):
        logger.error(".env file not found. Please create it with required API keys.")
        return False
    
    logger.info("Environment check passed!")
    return True

def activate_venv_and_run():
    """Activate virtual environment and run the agent service."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Determine the correct activation script based on OS
    if os.name == 'nt':  # Windows
        activate_script = os.path.join(script_dir, 'venv', 'Scripts', 'activate.bat')
        python_exe = os.path.join(script_dir, 'venv', 'Scripts', 'python.exe')
    else:  # Unix/Linux/Mac
        activate_script = os.path.join(script_dir, 'venv', 'bin', 'activate')
        python_exe = os.path.join(script_dir, 'venv', 'bin', 'python')
    
    # Check if Python executable exists
    if not os.path.exists(python_exe):
        logger.error(f"Python executable not found at {python_exe}")
        return False
    
    # Run the agent service
    service_script = os.path.join(script_dir, 'agent_service.py')
    
    try:
        logger.info("Starting Metatron AI Agent Service...")
        logger.info(f"Using Python: {python_exe}")
        logger.info(f"Running script: {service_script}")
        
        # Change to the script directory
        os.chdir(script_dir)
        
        # Run the service
        subprocess.run([python_exe, service_script], check=True)
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to start agent service: {e}")
        return False
    except KeyboardInterrupt:
        logger.info("Service stopped by user")
        return True
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return False
    
    return True

def main():
    """Main function to start the agent service."""
    logger.info("=" * 50)
    logger.info("Metatron AI Agent Service Startup")
    logger.info("=" * 50)
    
    # Check environment
    if not check_environment():
        logger.error("Environment check failed. Exiting.")
        sys.exit(1)
    
    # Start the service
    success = activate_venv_and_run()
    
    if success:
        logger.info("Agent service started successfully!")
    else:
        logger.error("Failed to start agent service.")
        sys.exit(1)

if __name__ == "__main__":
    main()
