"""
Configuration settings for Metatron Orchestrator Service
Following existing patterns from Segmind API server
"""

import os
from typing import Dict, Any

# API Keys and Authentication
GOOGLE_GEMINI_API_KEY = os.getenv('GOOGLE_GEMINI_API_KEY', 'AIzaSyDV7mSgHI6MLerw3n8NnDBBFPk-x0vJGdQ')

# Set environment variables for PraisonAI compatibility
os.environ['GOOGLE_API_KEY'] = GOOGLE_GEMINI_API_KEY
os.environ['OPENAI_API_KEY'] = 'not-needed-using-gemini'

# Service Configuration
ORCHESTRATOR_HOST = os.getenv('ORCHESTRATOR_HOST', '0.0.0.0')
ORCHESTRATOR_PORT = int(os.getenv('ORCHESTRATOR_PORT', 5001))
DEBUG_MODE = os.getenv('DEBUG', 'False').lower() == 'true'

# CORS Configuration (following segmind pattern)
CORS_ORIGINS = [
    'http://localhost:*',
    'http://127.0.0.1:*', 
    'file://*'
]

# Gemini Model Configuration
GEMINI_MODEL = 'gemini-2.0-flash-thinking-exp-01-21'
GEMINI_TEMPERATURE = 0.7
GEMINI_MAX_TOKENS = 4096

# PraisonAI Configuration
PRAISONAI_CONFIG = {
    'model': f'gemini/{GEMINI_MODEL}',
    'temperature': GEMINI_TEMPERATURE,
    'max_tokens': GEMINI_MAX_TOKENS,
    'process': 'workflow',  # Agentic Orchestrator Worker pattern
    'memory': True,
    'self_reflect': True,
    'verbose': DEBUG_MODE
}

# Service Integration URLs
SEGMIND_API_URL = 'http://localhost:5002/api/segmind'
VIDEOSDK_API_URL = 'http://localhost:5003'

# Logging Configuration
LOGGING_CONFIG = {
    'level': 'INFO' if not DEBUG_MODE else 'DEBUG',
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
}

# Health Check Configuration
HEALTH_CHECK_SERVICES = {
    'segmind': SEGMIND_API_URL + '/health',
    'videosdk': VIDEOSDK_API_URL + '/health'
}

def get_config() -> Dict[str, Any]:
    """Get complete configuration dictionary"""
    return {
        'api_keys': {
            'gemini': GOOGLE_GEMINI_API_KEY
        },
        'server': {
            'host': ORCHESTRATOR_HOST,
            'port': ORCHESTRATOR_PORT,
            'debug': DEBUG_MODE
        },
        'cors': {
            'origins': CORS_ORIGINS
        },
        'praisonai': PRAISONAI_CONFIG,
        'services': {
            'segmind_url': SEGMIND_API_URL,
            'videosdk_url': VIDEOSDK_API_URL
        },
        'logging': LOGGING_CONFIG,
        'health_checks': HEALTH_CHECK_SERVICES
    }
