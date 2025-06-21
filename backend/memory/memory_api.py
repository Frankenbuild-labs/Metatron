"""
Metatron Memory API Service
Production-ready memory system using MEM0AI with brain region mapping
Integrates with Cerebral UI and main chat orchestrator
"""

import os
import sys
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from flask import Flask, request, jsonify
from flask_cors import CORS

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from mem0 import Memory
    MEM0_AVAILABLE = True
except ImportError:
    MEM0_AVAILABLE = False
    print("⚠️ MEM0AI not installed. Install with: pip install mem0ai")

from config.memory_config import config

# Import learning system
try:
    from learning.learning_api import learning_bp, initialize_learning_system, get_learning_adapter
    LEARNING_AVAILABLE = True
except ImportError:
    LEARNING_AVAILABLE = False
    print("⚠️ Learning system not available")

# Import conversation system
try:
    from conversation.conversation_api import conversation_bp, initialize_conversation_system, get_conversation_manager
    CONVERSATION_AVAILABLE = True
except ImportError:
    CONVERSATION_AVAILABLE = False
    print("⚠️ Conversation system not available")

# Import unified service
try:
    from unified_memory_service import unified_bp, initialize_unified_service, get_unified_service
    UNIFIED_AVAILABLE = True
except ImportError:
    UNIFIED_AVAILABLE = False
    print("⚠️ Unified service not available")

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
CORS(app, origins=['http://localhost:*', 'http://127.0.0.1:*', 'file://*'])

# Register learning blueprint if available
if LEARNING_AVAILABLE:
    app.register_blueprint(learning_bp)

# Register conversation blueprint if available
if CONVERSATION_AVAILABLE:
    app.register_blueprint(conversation_bp)

# Register unified blueprint if available
if UNIFIED_AVAILABLE:
    app.register_blueprint(unified_bp)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global memory instance
memory_instance = None

# Brain region mapping for Cerebral UI
BRAIN_REGION_MAPPING = {
    'user': 'OCCIPITAL_LOBE',      # Personal Memory
    'session': 'FRONTAL_LOBE',     # Short-term Memory
    'agent': 'CEREBELLUM',         # Central Storage
    'episodic': 'TEMPORAL_LOBE',   # Long-term Memory
    'working': 'PARIETAL_LOBE'     # Working Memory
}

CEREBRAL_TO_MEM0_MAPPING = {
    'FRONTAL_LOBE': 'session',
    'TEMPORAL_LOBE': 'episodic', 
    'PARIETAL_LOBE': 'working',
    'OCCIPITAL_LOBE': 'user',
    'CEREBELLUM': 'agent'
}

def initialize_memory():
    """Initialize MEM0AI memory system and learning components"""
    global memory_instance

    if not MEM0_AVAILABLE:
        logger.error("❌ MEM0AI not available")
        return False

    try:
        # Initialize with configuration
        memory_config = {
            'vector_store': {
                'provider': 'chroma',
                'config': {
                    'path': config.VECTOR_STORE_CONFIG['path']
                }
            },
            'llm': {
                'provider': 'google',
                'config': {
                    'model': config.LLM_CONFIG['model'],
                    'api_key': config.LLM_CONFIG['api_key'],
                    'temperature': config.LLM_CONFIG['temperature']
                }
            }
        }

        memory_instance = Memory.from_config(memory_config)
        logger.info("✅ MEM0AI memory system initialized successfully")

        # Initialize learning system if available
        if LEARNING_AVAILABLE:
            learning_config = {
                'patterns_db_path': './backend/memory/data/learning_patterns.json',
                'feedback_db_path': './backend/memory/data/feedback_records.json',
                'vectorizer_path': './backend/memory/data/pattern_vectorizer.pkl',
                'min_success_score': 0.7,
                'max_patterns_per_type': 1000,
                'pattern_decay_days': 30
            }

            if initialize_learning_system(learning_config):
                logger.info("✅ Learning system initialized successfully")
            else:
                logger.warning("⚠️ Learning system initialization failed")

        # Initialize conversation system if available
        if CONVERSATION_AVAILABLE:
            conversation_config = {
                'session_timeout': 3600,
                'max_conversation_history': 50,
                'default_brain_region': 'FRONTAL_LOBE',
                'flows_db_path': './backend/memory/data/conversation_flows.json',
                'sessions_db_path': './backend/memory/data/conversation_sessions.json',
                'agents_db_path': './backend/memory/data/registered_agents.json'
            }

            if initialize_conversation_system(conversation_config):
                logger.info("✅ Conversation system initialized successfully")
            else:
                logger.warning("⚠️ Conversation system initialization failed")

        # Initialize unified service if available
        if UNIFIED_AVAILABLE:
            unified_config = {
                'memory_enabled': MEM0_AVAILABLE,
                'learning_enabled': LEARNING_AVAILABLE,
                'conversation_enabled': CONVERSATION_AVAILABLE,
                'default_brain_region': 'FRONTAL_LOBE',
                'enable_recommendations': True,
                'enable_analytics': True
            }

            if initialize_unified_service(unified_config):
                logger.info("✅ Unified Memory Service initialized successfully")
            else:
                logger.warning("⚠️ Unified service initialization failed")

        return True

    except Exception as e:
        logger.error(f"❌ Failed to initialize memory systems: {str(e)}")
        return False

@app.route('/api/memory/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        memory_status = 'healthy' if memory_instance else 'initializing'
        mem0_status = 'available' if MEM0_AVAILABLE else 'not_installed'
        
        return jsonify({
            'status': 'healthy',
            'service': 'metatron-memory',
            'memory_backend': memory_status,
            'mem0_available': MEM0_AVAILABLE,
            'mem0_status': mem0_status,
            'timestamp': datetime.now().isoformat(),
            'version': '1.0.0'
        })
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'service': 'metatron-memory',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/memory/add', methods=['POST'])
def add_memory():
    """Add new memory to the system"""
    try:
        data = request.json
        
        # Validate required parameters
        if not data or 'content' not in data:
            return jsonify({
                'success': False,
                'error': 'Content is required'
            }), 400
        
        content = data['content']
        user_id = data.get('user_id', 'default_user')
        brain_region = data.get('brain_region')
        metadata = data.get('metadata', {})
        
        # Map brain region to MEM0 memory type if provided
        if brain_region and brain_region in CEREBRAL_TO_MEM0_MAPPING:
            metadata['memory_type'] = CEREBRAL_TO_MEM0_MAPPING[brain_region]
        
        if not memory_instance:
            return jsonify({
                'success': False,
                'error': 'Memory system not initialized'
            }), 503
        
        # Add memory using MEM0AI
        result = memory_instance.add(
            messages=content if isinstance(content, list) else [{"role": "user", "content": content}],
            user_id=user_id,
            metadata=metadata
        )

        # Learn from successful memory addition if learning system is available
        if LEARNING_AVAILABLE and result.get('id'):
            learning_adapter = get_learning_adapter()
            if learning_adapter:
                try:
                    learning_adapter.learn_from_interaction(
                        input_context=content if isinstance(content, str) else str(content),
                        output_result=f"Successfully stored memory in {brain_region}",
                        success_score=1.0,  # Memory addition is always successful
                        brain_region=brain_region or 'CEREBELLUM',
                        pattern_type='memory_storage',
                        metadata={'memory_id': result.get('id'), 'user_id': user_id}
                    )
                except Exception as e:
                    logger.warning(f"Learning from memory addition failed: {e}")

        logger.info(f"✅ Added memory for user {user_id}")

        return jsonify({
            'success': True,
            'memory_id': result.get('id', 'unknown'),
            'brain_region': brain_region,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error adding memory: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/memory/search', methods=['POST'])
def search_memories():
    """Search memories using semantic similarity"""
    try:
        data = request.json
        
        if not data or 'query' not in data:
            return jsonify({
                'success': False,
                'error': 'Query is required'
            }), 400
        
        query = data['query']
        user_id = data.get('user_id', 'default_user')
        limit = data.get('limit', 5)
        brain_region = data.get('brain_region')
        
        if not memory_instance:
            return jsonify({
                'success': False,
                'error': 'Memory system not initialized'
            }), 503
        
        # Prepare filters
        filters = {}
        if brain_region and brain_region in CEREBRAL_TO_MEM0_MAPPING:
            filters['memory_type'] = CEREBRAL_TO_MEM0_MAPPING[brain_region]
        
        # Get learning suggestions if available
        learning_suggestions = []
        if LEARNING_AVAILABLE:
            learning_adapter = get_learning_adapter()
            if learning_adapter:
                try:
                    learning_suggestions = learning_adapter.get_improvement_suggestions(
                        context=query,
                        brain_region=brain_region or 'CEREBELLUM'
                    )
                except Exception as e:
                    logger.warning(f"Failed to get learning suggestions: {e}")

        # Search using MEM0AI
        results = memory_instance.search(
            query=query,
            user_id=user_id,
            limit=limit,
            filters=filters
        )
        
        # Format results for Cerebral UI
        formatted_results = []
        for result in results:
            memory_type = result.get('metadata', {}).get('memory_type', 'agent')
            brain_region_mapped = BRAIN_REGION_MAPPING.get(memory_type, 'CEREBELLUM')
            
            formatted_results.append({
                'id': result.get('id'),
                'content': result.get('memory'),
                'brain_region': brain_region_mapped,
                'similarity_score': result.get('score', 0),
                'metadata': result.get('metadata', {}),
                'created_at': result.get('created_at'),
                'updated_at': result.get('updated_at')
            })
        
        logger.info(f"🔍 Found {len(formatted_results)} memories for query: {query[:50]}...")

        # Learn from successful search if results found
        if LEARNING_AVAILABLE and formatted_results:
            learning_adapter = get_learning_adapter()
            if learning_adapter:
                try:
                    learning_adapter.learn_from_interaction(
                        input_context=query,
                        output_result=f"Found {len(formatted_results)} relevant memories",
                        success_score=min(1.0, len(formatted_results) / limit),  # Success based on result count
                        brain_region=brain_region or 'CEREBELLUM',
                        pattern_type='memory_search',
                        metadata={'result_count': len(formatted_results), 'user_id': user_id}
                    )
                except Exception as e:
                    logger.warning(f"Learning from search failed: {e}")

        return jsonify({
            'success': True,
            'results': formatted_results,
            'total_count': len(formatted_results),
            'query': query,
            'learning_suggestions': learning_suggestions,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error searching memories: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/memory/stats', methods=['GET'])
def get_memory_stats():
    """Get memory statistics for Cerebral 3D visualization"""
    try:
        user_id = request.args.get('user_id', 'default_user')
        
        if not memory_instance:
            return jsonify({
                'success': False,
                'error': 'Memory system not initialized'
            }), 503
        
        # Get all memories for user (MEM0AI doesn't have direct stats, so we search broadly)
        all_memories = memory_instance.search(
            query="",  # Empty query to get all
            user_id=user_id,
            limit=1000  # Large limit to get comprehensive stats
        )
        
        # Calculate statistics by brain region
        region_stats = {}
        for memory in all_memories:
            memory_type = memory.get('metadata', {}).get('memory_type', 'agent')
            brain_region = BRAIN_REGION_MAPPING.get(memory_type, 'CEREBELLUM')
            
            if brain_region not in region_stats:
                region_stats[brain_region] = {
                    'count': 0,
                    'recent_activity': 0,
                    'avg_importance': 0,
                    'memory_types': {}
                }
            
            region_stats[brain_region]['count'] += 1
            region_stats[brain_region]['memory_types'][memory_type] = \
                region_stats[brain_region]['memory_types'].get(memory_type, 0) + 1
        
        return jsonify({
            'success': True,
            'total_memories': len(all_memories),
            'regions': region_stats,
            'brain_region_mapping': BRAIN_REGION_MAPPING,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting memory stats: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Initialize memory system on startup
    if initialize_memory():
        print(f"""
╔══════════════════════════════════════════╗
║     Metatron Memory API Started         ║
╠══════════════════════════════════════════╣
║  Running on: http://localhost:{config.API_PORT}     ║
║  Backend: MEM0AI Production System      ║
║  Brain Regions: 5 mapped regions        ║
╚══════════════════════════════════════════╝
        """)
    else:
        print("⚠️ Starting in fallback mode without MEM0AI")
    
    # Run server
    app.run(
        host=config.API_HOST,
        port=config.API_PORT,
        debug=config.DEBUG
    )
