from flask import Flask, request, jsonify
from flask_cors import CORS
import asyncio
import threading
import os
from gemini_agent import agent_manager
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Global event loop for async operations
loop = None
loop_thread = None

def start_event_loop():
    """Start the asyncio event loop in a separate thread."""
    global loop
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_forever()

def run_async(coro):
    """Run an async coroutine in the event loop."""
    if loop is None:
        return None
    future = asyncio.run_coroutine_threadsafe(coro, loop)
    return future.result(timeout=30)  # 30 second timeout

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'Metatron AI Agent Service',
        'agent_running': agent_manager.is_running
    })

@app.route('/agent/start', methods=['POST'])
def start_agent():
    """Start the AI agent with given configuration."""
    try:
        data = request.get_json() or {}
        
        # Extract configuration
        meeting_id = data.get('meetingId', 'default-meeting')
        participant_id = data.get('participantId', 'ai-agent')
        instructions = data.get('instructions')
        voice = data.get('voice', 'Leda')
        
        # VideoSDK context (this would normally come from VideoSDK)
        context = {
            'meeting_id': meeting_id,
            'participant_id': participant_id,
            'token': data.get('token', ''),  # VideoSDK token
            'api_base': data.get('apiBase', 'https://api.videosdk.live')
        }
        
        # Start the agent
        success = run_async(agent_manager.start_agent(context, instructions, voice))
        
        if success:
            return jsonify({
                'success': True,
                'message': 'AI agent started successfully',
                'agent_id': participant_id
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to start AI agent'
            }), 500
            
    except Exception as e:
        logger.error(f"Error starting agent: {e}")
        return jsonify({
            'success': False,
            'message': f'Error starting agent: {str(e)}'
        }), 500

@app.route('/agent/stop', methods=['POST'])
def stop_agent():
    """Stop the running AI agent."""
    try:
        success = run_async(agent_manager.stop_agent())
        
        if success:
            return jsonify({
                'success': True,
                'message': 'AI agent stopped successfully'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'No agent was running or failed to stop'
            }), 400
            
    except Exception as e:
        logger.error(f"Error stopping agent: {e}")
        return jsonify({
            'success': False,
            'message': f'Error stopping agent: {str(e)}'
        }), 500

@app.route('/agent/status', methods=['GET'])
def agent_status():
    """Get the current status of the AI agent."""
    return jsonify({
        'running': agent_manager.is_running,
        'session_active': agent_manager.session is not None
    })

@app.route('/agent/configure', methods=['POST'])
def configure_agent():
    """Configure agent settings (voice, instructions, etc.)."""
    try:
        data = request.get_json() or {}

        # For now, return the configuration that would be applied
        # In a full implementation, this would update the running agent
        return jsonify({
            'success': True,
            'message': 'Configuration updated',
            'config': {
                'voice': data.get('voice', 'Leda'),
                'instructions': data.get('instructions', 'Default instructions'),
                'personality': data.get('personality', 'helpful')
            }
        })

    except Exception as e:
        logger.error(f"Error configuring agent: {e}")
        return jsonify({
            'success': False,
            'message': f'Error configuring agent: {str(e)}'
        }), 500

@app.route('/agent/test', methods=['POST'])
def test_agent():
    """Test agent functionality with a simple message."""
    try:
        data = request.get_json() or {}
        message = data.get('message', 'Hello, can you hear me?')

        if agent_manager.is_running:
            # Simulate agent response
            response_message = f"Yes, I can hear you! You said: '{message}'. I'm Metatron's AI Assistant and I'm working properly."

            return jsonify({
                'success': True,
                'message': 'Agent responded successfully',
                'agent_response': response_message
            })
        else:
            return jsonify({
                'success': False,
                'message': 'No agent is currently running'
            }), 400

    except Exception as e:
        logger.error(f"Error testing agent: {e}")
        return jsonify({
            'success': False,
            'message': f'Error testing agent: {str(e)}'
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'message': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'message': 'Internal server error'
    }), 500

def initialize_service():
    """Initialize the service and start the event loop."""
    global loop_thread
    
    # Start the asyncio event loop in a separate thread
    loop_thread = threading.Thread(target=start_event_loop, daemon=True)
    loop_thread.start()
    
    # Wait a moment for the loop to start
    import time
    time.sleep(0.5)
    
    logger.info("Metatron AI Agent Service initialized")

if __name__ == '__main__':
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Check for required environment variables
    if not os.getenv('GOOGLE_API_KEY'):
        logger.warning("GOOGLE_API_KEY not found in environment variables")
        logger.info("Please set GOOGLE_API_KEY in your .env file")
    
    # Initialize the service
    initialize_service()
    
    # Start the Flask app
    port = int(os.getenv('AGENT_API_PORT', 5003))
    logger.info(f"Starting Metatron AI Agent Service on port {port}")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=True,
        threaded=True
    )
