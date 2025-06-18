"""
Metatron Orchestrator API Server
Flask-based REST API for PraisonAI orchestrator service
Following patterns from segmind_api_server.py
"""

import os
import sys
import json
import logging
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import Composio integration
try:
    from composio_integration import composio_integration
    COMPOSIO_AVAILABLE = True
except ImportError:
    COMPOSIO_AVAILABLE = False

# Import configuration
try:
    from config.settings import get_config
except ImportError:
    # Fallback configuration if import fails
    def get_config():
        return {
            'api_keys': {'gemini': 'AIzaSyDV7mSgHI6MLerw3n8NnDBBFPk-x0vJGdQ'},
            'server': {'host': '0.0.0.0', 'port': 5001, 'debug': False},
            'cors': {'origins': ['http://localhost:*', 'http://127.0.0.1:*', 'file://*']},
            'praisonai': {'model': 'gemini/gemini-2.0-flash-thinking-exp-01-21'},
            'services': {'segmind_url': 'http://localhost:5002/api/segmind', 'videosdk_url': 'http://localhost:5003'},
            'logging': {'level': 'INFO', 'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s'},
            'health_checks': {'segmind': 'http://localhost:5002/api/segmind/health', 'videosdk': 'http://localhost:5003/health'}
        }

# Initialize Flask app (following segmind pattern)
app = Flask(__name__)

# Get configuration
config = get_config()

# Configure CORS (following segmind pattern)
CORS(app, origins=config['cors']['origins'])

# Configure logging (following segmind pattern)
logging.basicConfig(
    level=getattr(logging, config['logging']['level']),
    format=config['logging']['format']
)
logger = logging.getLogger(__name__)

# Global orchestrator service (will be initialized)
orchestrator_service = None


@app.route('/api/orchestrator/health', methods=['GET'])
def health_check():
    """Health check endpoint (following segmind pattern)"""
    try:
        # Check if orchestrator is initialized
        orchestrator_status = 'healthy' if orchestrator_service else 'initializing'
        
        # Check external services
        external_services = {}
        for service_name, service_url in config['health_checks'].items():
            try:
                import requests
                response = requests.get(service_url, timeout=5)
                external_services[service_name] = 'healthy' if response.status_code == 200 else 'unhealthy'
            except Exception as e:
                external_services[service_name] = f'error: {str(e)}'
        
        return jsonify({
            'status': 'healthy',
            'service': 'metatron-orchestrator',
            'orchestrator': orchestrator_status,
            'external_services': external_services,
            'timestamp': datetime.now().isoformat(),
            'version': '1.0.0'
        })
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'service': 'metatron-orchestrator',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500


@app.route('/api/orchestrator/chat', methods=['POST'])
def process_chat():
    """Process chat message through orchestrator"""
    try:
        data = request.json
        
        # Validate required parameters (following segmind pattern)
        if not data or 'message' not in data:
            return jsonify({
                'success': False,
                'error': 'Message is required'
            }), 400
        
        message = data['message']
        context = data.get('context', {})
        workspace = data.get('workspace', 'orchestrator')
        
        # Initialize orchestrator if not already done
        if not orchestrator_service:
            initialize_orchestrator()

        # Process message through orchestrator
        if orchestrator_service:
            result = orchestrator_service.process_message(message, context, workspace)

            if result.get('success', True):
                logger.info(f"✅ Processed message: {message[:50]}...")
                return jsonify({
                    'success': True,
                    'response': result.get('response', 'Response processed'),
                    'context': result.get('context', {}),
                    'timestamp': datetime.now().isoformat()
                })
            else:
                logger.error(f"❌ Processing failed: {result.get('error', 'Unknown error')}")
                return jsonify({
                    'success': False,
                    'error': result.get('error', 'Processing failed')
                }), 400
        else:
            # Fallback response if orchestrator not available
            response = generate_simple_response(message, context)
            return jsonify({
                'success': True,
                'response': response,
                'context': {
                    'workspace': workspace,
                    'timestamp': datetime.now().isoformat(),
                    'service_status': 'fallback_mode'
                },
                'timestamp': datetime.now().isoformat()
            })
            
    except Exception as e:
        logger.error(f"Error processing chat: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/orchestrator/status', methods=['GET'])
def get_status():
    """Get orchestrator status and configuration"""
    try:
        # Get detailed status from orchestrator service if available
        if orchestrator_service:
            agent_status = orchestrator_service.get_agent_status()
            status_info = {
                'orchestrator_initialized': agent_status['agent_initialized'],
                'praisonai_available': agent_status['praisonai_available'],
                'workspace': agent_status['current_workspace'],
                'model': agent_status['model'],
                'tools_available': orchestrator_service.get_available_tools(),
                'tools_count': agent_status['tools_count'],
                'memory_enabled': agent_status['memory_enabled'],
                'verbose_mode': agent_status['verbose_mode'],
                'conversation_length': agent_status['conversation_length'],
                'service_mode': 'orchestrator' if agent_status['agent_initialized'] else 'enhanced_fallback'
            }
        else:
            status_info = {
                'orchestrator_initialized': False,
                'praisonai_available': False,
                'workspace': 'orchestrator',
                'model': config['praisonai']['model'],
                'tools_available': get_available_tools(),
                'tools_count': 0,
                'memory_enabled': config['praisonai'].get('memory', True),
                'verbose_mode': config['praisonai'].get('verbose', False),
                'conversation_length': 0,
                'service_mode': 'basic_fallback'
            }

        return jsonify({
            'success': True,
            'status': status_info,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting status: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/orchestrator/workflow/execute', methods=['POST'])
def execute_workflow():
    """Execute Agent Flow workflow using Composio tools"""
    try:
        data = request.json

        # Validate required parameters
        if not data or 'workflow' not in data:
            return jsonify({
                'success': False,
                'error': 'Workflow configuration is required'
            }), 400

        workflow_config = data['workflow']

        # Check if Composio is available
        if not COMPOSIO_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'Composio integration not available'
            }), 503

        # Execute workflow using Composio integration
        result = composio_integration.execute_workflow(workflow_config)

        if result.get('success', False):
            logger.info(f"✅ Workflow executed successfully")
            return jsonify({
                'success': True,
                'result': result,
                'timestamp': datetime.now().isoformat()
            })
        else:
            logger.error(f"❌ Workflow execution failed: {result.get('error', 'Unknown error')}")
            return jsonify({
                'success': False,
                'error': result.get('error', 'Workflow execution failed')
            }), 400

    except Exception as e:
        logger.error(f"Error executing workflow: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/orchestrator/tools/info', methods=['GET'])
def get_tools_info():
    """Get information about available Composio tools"""
    try:
        if not COMPOSIO_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'Composio integration not available'
            }), 503

        # Get tool information from Composio integration
        tool_info = composio_integration.get_tool_info()

        return jsonify({
            'success': True,
            'tools': tool_info,
            'composio_available': True,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Error getting tools info: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/orchestrator/tools/test', methods=['GET'])
def test_composio_connection():
    """Test Composio connection and tool availability"""
    try:
        if not COMPOSIO_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'Composio integration not available',
                'composio_available': False
            }), 503

        # Test Composio connection
        test_result = composio_integration.test_connection()

        return jsonify({
            'success': test_result.get('success', False),
            'test_result': test_result,
            'composio_available': True,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Error testing Composio connection: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'composio_available': False
        }), 500


def generate_simple_response(message: str, context: dict) -> str:
    """Generate a simple intelligent response while orchestrator is being set up"""
    message_lower = message.lower()
    
    # Creative Studio responses
    if any(word in message_lower for word in ['image', 'picture', 'generate', 'create', 'art', 'creative', 'draw', 'design']):
        return "I can help you with creative projects! The Creative Studio feature allows you to generate images and artwork using AI. You can access it through the Creative Studio button in the interface, or I can help coordinate your creative requests."
    
    # Video Meeting responses
    elif any(word in message_lower for word in ['video', 'meeting', 'call', 'conference', 'zoom', 'teams']):
        return "For video meetings and collaboration, I can help you manage meetings and coordinate AI agent participation. The Video Meeting feature includes advanced AI assistance for enhanced collaboration."
    
    # Research responses
    elif any(word in message_lower for word in ['search', 'research', 'find', 'information', 'what is', 'how to', 'tell me about']):
        return "I can help you research information and find answers to your questions. I have access to research capabilities that can help you find current information and provide detailed analysis on various topics."
    
    # General greetings
    elif any(word in message_lower for word in ['hello', 'hi', 'hey', 'good morning', 'good afternoon']):
        return "Hello! I'm your Metatron AI assistant. I can help you with creative projects through the Creative Studio, manage video meetings with AI agent support, conduct research, and coordinate various platform features. What would you like to work on today?"
    
    # Help requests
    elif any(word in message_lower for word in ['help', 'what can you do', 'capabilities', 'features']):
        return """I'm your intelligent Metatron platform coordinator! Here's what I can help you with:

🎨 **Creative Studio**: Generate images, artwork, and creative content using AI
📹 **Video Meetings**: Start meetings, manage AI agents, and coordinate collaboration  
🔍 **Research**: Search for information, fact-check, and provide detailed analysis
🤖 **Platform Coordination**: Seamlessly integrate all features for complex tasks

Just tell me what you'd like to work on, and I'll help coordinate the right tools and features!"""
    
    # Default response
    else:
        return f"I understand you're asking about '{message}'. As your Metatron AI assistant, I can help coordinate creative projects, video meetings, research, and more. Could you tell me more specifically what you'd like to accomplish?"


def initialize_orchestrator():
    """Initialize the PraisonAI orchestrator service with Agentic Worker Pattern"""
    global orchestrator_service
    try:
        logger.info("🚀 Initializing Metatron Orchestrator with Agentic Worker Pattern...")

        # Import and initialize orchestrator service
        from services.orchestrator_service import MetatronOrchestratorService
        orchestrator_service = MetatronOrchestratorService(config)

        if orchestrator_service.orchestrator_agent:
            logger.info("✅ Metatron Orchestrator initialized successfully with PraisonAI")
        else:
            logger.info("⚠️ Orchestrator running in fallback mode (enhanced)")

        return True

    except Exception as e:
        logger.error(f"❌ Failed to initialize orchestrator: {str(e)}")
        logger.info("🔄 Continuing with basic fallback mode")
        return False


def get_available_tools():
    """Get list of available tools"""
    return ['creative_studio', 'video_meeting', 'research']


# Error handlers (following segmind pattern)
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


if __name__ == '__main__':
    # Initialize orchestrator on startup
    initialize_orchestrator()
    
    # Print startup banner (following segmind pattern)
    port = config['server']['port']
    print(f"""
╔══════════════════════════════════════════╗
║     Metatron Orchestrator Started       ║
╠══════════════════════════════════════════╣
║  Running on: http://localhost:{port}     ║
║  API Base: /api/orchestrator             ║
║  Model: {config['praisonai']['model']:<25} ║
╚══════════════════════════════════════════╝
    """)
    
    # Run server (following segmind pattern)
    app.run(
        host=config['server']['host'],
        port=config['server']['port'],
        debug=config['server']['debug']
    )
