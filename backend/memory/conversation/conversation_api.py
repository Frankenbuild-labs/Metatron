"""
Conversation API Endpoints for Metatron Memory System
Provides REST API for RASA-inspired conversation management capabilities
"""

import os
import sys
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from flask import Blueprint, request, jsonify

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from rasa_conversation_manager import RasaConversationManager, ConversationState, FlowType

# Configure logging
logger = logging.getLogger(__name__)

# Create Blueprint for conversation endpoints
conversation_bp = Blueprint('conversation', __name__, url_prefix='/api/conversation')

# Global conversation manager instance
conversation_manager = None

def initialize_conversation_system(config: Dict[str, Any]) -> bool:
    """Initialize the conversation management system"""
    global conversation_manager
    
    try:
        conversation_config = {
            'session_timeout': config.get('session_timeout', 3600),
            'max_conversation_history': config.get('max_conversation_history', 50),
            'default_brain_region': config.get('default_brain_region', 'FRONTAL_LOBE'),
            'flows_db_path': config.get('flows_db_path', './backend/memory/data/conversation_flows.json'),
            'sessions_db_path': config.get('sessions_db_path', './backend/memory/data/conversation_sessions.json'),
            'agents_db_path': config.get('agents_db_path', './backend/memory/data/registered_agents.json')
        }
        
        conversation_manager = RasaConversationManager(conversation_config)
        logger.info("✅ Conversation management system initialized successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize conversation system: {str(e)}")
        return False

@conversation_bp.route('/health', methods=['GET'])
def conversation_health_check():
    """Health check for conversation management system"""
    try:
        if conversation_manager is None:
            return jsonify({
                'status': 'unhealthy',
                'service': 'metatron-conversation',
                'error': 'Conversation manager not initialized',
                'timestamp': datetime.now().isoformat()
            }), 503
        
        stats = conversation_manager.get_conversation_stats()
        
        return jsonify({
            'status': 'healthy',
            'service': 'metatron-conversation',
            'conversation_stats': stats,
            'timestamp': datetime.now().isoformat(),
            'version': '1.0.0'
        })
        
    except Exception as e:
        logger.error(f"Conversation health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'service': 'metatron-conversation',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@conversation_bp.route('/start', methods=['POST'])
def start_conversation():
    """Start a new conversation session"""
    try:
        if conversation_manager is None:
            return jsonify({
                'success': False,
                'error': 'Conversation system not initialized'
            }), 503
        
        data = request.json
        
        # Validate required parameters
        if not data or 'user_id' not in data or 'message' not in data:
            return jsonify({
                'success': False,
                'error': 'user_id and message are required'
            }), 400
        
        user_id = data['user_id']
        message = data['message']
        session_id = data.get('session_id')
        
        # Start conversation
        context = conversation_manager.start_conversation(
            user_id=user_id,
            initial_message=message,
            session_id=session_id
        )
        
        logger.info(f"✅ Started conversation: {context.session_id}")
        
        return jsonify({
            'success': True,
            'session_id': context.session_id,
            'user_id': context.user_id,
            'current_state': context.current_state.value,
            'brain_region': context.brain_region,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error starting conversation: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@conversation_bp.route('/message', methods=['POST'])
def process_message():
    """Process a message within a conversation"""
    try:
        if conversation_manager is None:
            return jsonify({
                'success': False,
                'error': 'Conversation system not initialized'
            }), 503
        
        data = request.json
        
        # Validate required parameters
        if not data or 'session_id' not in data or 'message' not in data:
            return jsonify({
                'success': False,
                'error': 'session_id and message are required'
            }), 400
        
        session_id = data['session_id']
        message = data['message']
        message_type = data.get('message_type', 'user')
        
        # Process message
        result = conversation_manager.process_message(
            session_id=session_id,
            message=message,
            message_type=message_type
        )
        
        if result.get('success', False):
            logger.info(f"✅ Processed message in session: {session_id}")
        else:
            logger.warning(f"⚠️ Message processing failed: {result.get('error')}")
        
        return jsonify({
            'success': result.get('success', False),
            'session_id': session_id,
            'result': result,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@conversation_bp.route('/session/<session_id>', methods=['GET'])
def get_conversation_session(session_id: str):
    """Get conversation session details"""
    try:
        if conversation_manager is None:
            return jsonify({
                'success': False,
                'error': 'Conversation system not initialized'
            }), 503
        
        if session_id not in conversation_manager.sessions:
            return jsonify({
                'success': False,
                'error': f'Session {session_id} not found'
            }), 404
        
        context = conversation_manager.sessions[session_id]
        
        # Format context for response
        session_data = {
            'session_id': context.session_id,
            'user_id': context.user_id,
            'current_state': context.current_state.value,
            'current_flow': context.current_flow,
            'flow_type': context.flow_type.value if context.flow_type else None,
            'brain_region': context.brain_region,
            'conversation_history': context.conversation_history[-10:],  # Last 10 messages
            'flow_variables': context.flow_variables,
            'created_at': context.created_at,
            'updated_at': context.updated_at,
            'metadata': context.metadata
        }
        
        return jsonify({
            'success': True,
            'session': session_data,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting conversation session: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@conversation_bp.route('/sessions', methods=['GET'])
def list_conversation_sessions():
    """List all conversation sessions for a user"""
    try:
        if conversation_manager is None:
            return jsonify({
                'success': False,
                'error': 'Conversation system not initialized'
            }), 503
        
        user_id = request.args.get('user_id')
        limit = int(request.args.get('limit', 10))
        
        sessions = []
        for context in conversation_manager.sessions.values():
            if user_id and context.user_id != user_id:
                continue
            
            session_summary = {
                'session_id': context.session_id,
                'user_id': context.user_id,
                'current_state': context.current_state.value,
                'current_flow': context.current_flow,
                'brain_region': context.brain_region,
                'message_count': len(context.conversation_history),
                'created_at': context.created_at,
                'updated_at': context.updated_at
            }
            sessions.append(session_summary)
        
        # Sort by updated_at (most recent first)
        sessions.sort(key=lambda x: x['updated_at'], reverse=True)
        
        # Apply limit
        sessions = sessions[:limit]
        
        return jsonify({
            'success': True,
            'sessions': sessions,
            'total_count': len(sessions),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error listing conversation sessions: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@conversation_bp.route('/flows', methods=['GET'])
def list_conversation_flows():
    """List available conversation flows"""
    try:
        if conversation_manager is None:
            return jsonify({
                'success': False,
                'error': 'Conversation system not initialized'
            }), 503
        
        flows = []
        for flow in conversation_manager.flows.values():
            flow_data = {
                'flow_id': flow.flow_id,
                'flow_name': flow.flow_name,
                'flow_type': flow.flow_type.value,
                'description': flow.description,
                'trigger_patterns': flow.trigger_patterns,
                'brain_regions': flow.brain_regions,
                'step_count': len(flow.steps),
                'expected_duration': flow.expected_duration,
                'metadata': flow.metadata
            }
            flows.append(flow_data)
        
        return jsonify({
            'success': True,
            'flows': flows,
            'total_count': len(flows),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error listing conversation flows: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@conversation_bp.route('/agents', methods=['GET'])
def list_registered_agents():
    """List registered agents (A2A-style)"""
    try:
        if conversation_manager is None:
            return jsonify({
                'success': False,
                'error': 'Conversation system not initialized'
            }), 503
        
        agents = []
        for agent in conversation_manager.agents.values():
            agent_data = {
                'agent_id': agent.agent_id,
                'agent_name': agent.agent_name,
                'description': agent.description,
                'skills': agent.skills,
                'input_modes': agent.input_modes,
                'output_modes': agent.output_modes,
                'brain_regions': agent.brain_regions,
                'status': agent.status,
                'capabilities': agent.capabilities
            }
            agents.append(agent_data)
        
        return jsonify({
            'success': True,
            'agents': agents,
            'total_count': len(agents),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error listing registered agents: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@conversation_bp.route('/stats', methods=['GET'])
def get_conversation_statistics():
    """Get comprehensive conversation management statistics"""
    try:
        if conversation_manager is None:
            return jsonify({
                'success': False,
                'error': 'Conversation system not initialized'
            }), 503
        
        stats = conversation_manager.get_conversation_stats()
        
        # Add additional statistics
        session_states = {}
        flow_usage = {}
        brain_region_usage = {}
        
        for context in conversation_manager.sessions.values():
            # Count session states
            state = context.current_state.value
            session_states[state] = session_states.get(state, 0) + 1
            
            # Count flow usage
            if context.current_flow:
                flow_usage[context.current_flow] = flow_usage.get(context.current_flow, 0) + 1
            
            # Count brain region usage
            region = context.brain_region
            brain_region_usage[region] = brain_region_usage.get(region, 0) + 1
        
        stats.update({
            'session_states': session_states,
            'flow_usage': flow_usage,
            'brain_region_usage': brain_region_usage
        })
        
        return jsonify({
            'success': True,
            'statistics': stats,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting conversation statistics: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@conversation_bp.route('/session/<session_id>/state', methods=['PUT'])
def update_conversation_state(session_id: str):
    """Update conversation session state"""
    try:
        if conversation_manager is None:
            return jsonify({
                'success': False,
                'error': 'Conversation system not initialized'
            }), 503
        
        if session_id not in conversation_manager.sessions:
            return jsonify({
                'success': False,
                'error': f'Session {session_id} not found'
            }), 404
        
        data = request.json
        if not data or 'state' not in data:
            return jsonify({
                'success': False,
                'error': 'state is required'
            }), 400
        
        new_state = data['state']
        
        # Validate state
        try:
            state_enum = ConversationState(new_state)
        except ValueError:
            return jsonify({
                'success': False,
                'error': f'Invalid state: {new_state}'
            }), 400
        
        # Update session state
        context = conversation_manager.sessions[session_id]
        old_state = context.current_state.value
        context.current_state = state_enum
        context.updated_at = datetime.now().isoformat()
        
        logger.info(f"✅ Updated session {session_id} state: {old_state} -> {new_state}")
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'old_state': old_state,
            'new_state': new_state,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error updating conversation state: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Helper function to get conversation manager (for use by other modules)
def get_conversation_manager():
    """Get the global conversation manager instance"""
    return conversation_manager
