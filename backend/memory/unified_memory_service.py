"""
Unified Memory Service for Metatron
Orchestrates MEM0AI memory, VANNA learning, and RASA conversation management
into a single, intelligent, production-ready API service
"""

import os
import sys
import json
import logging
import asyncio
from datetime import datetime
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, asdict
from flask import Flask, request, jsonify, Blueprint
from flask_cors import CORS

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import all subsystems
try:
    from mem0 import Memory
    MEM0_AVAILABLE = True
except ImportError:
    MEM0_AVAILABLE = False

try:
    from learning.learning_api import initialize_learning_system, get_learning_adapter
    LEARNING_AVAILABLE = True
except ImportError:
    LEARNING_AVAILABLE = False

try:
    from conversation.conversation_api import initialize_conversation_system, get_conversation_manager
    CONVERSATION_AVAILABLE = True
except ImportError:
    CONVERSATION_AVAILABLE = False

from config.memory_config import config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class UnifiedMemoryRequest:
    """Unified request structure for memory operations"""
    user_id: str
    content: Union[str, List[Dict[str, Any]]]
    operation_type: str  # 'store', 'search', 'chat', 'learn', 'analyze'
    brain_region: Optional[str] = None
    context: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None
    learning_enabled: bool = True
    conversation_enabled: bool = True

@dataclass
class UnifiedMemoryResponse:
    """Unified response structure for memory operations"""
    success: bool
    operation_type: str
    results: Dict[str, Any]
    memory_context: Dict[str, Any]
    learning_insights: Dict[str, Any]
    conversation_state: Dict[str, Any]
    recommendations: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    timestamp: str

class UnifiedMemoryService:
    """
    Unified Memory Service that orchestrates all memory subsystems
    Provides a single, intelligent interface for all memory operations
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.memory_instance = None
        self.learning_adapter = None
        self.conversation_manager = None
        
        # Service status
        self.services_status = {
            'memory': False,
            'learning': False,
            'conversation': False
        }
        
        # Initialize all subsystems
        self._initialize_subsystems()
        
        logger.info("✅ Unified Memory Service initialized")
    
    def _initialize_subsystems(self):
        """Initialize all memory subsystems"""
        try:
            # Initialize MEM0AI Memory
            if MEM0_AVAILABLE:
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
                
                self.memory_instance = Memory.from_config(memory_config)
                self.services_status['memory'] = True
                logger.info("✅ Memory subsystem initialized")
            
            # Initialize Learning System
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
                    self.learning_adapter = get_learning_adapter()
                    self.services_status['learning'] = True
                    logger.info("✅ Learning subsystem initialized")
            
            # Initialize Conversation System
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
                    self.conversation_manager = get_conversation_manager()
                    self.services_status['conversation'] = True
                    logger.info("✅ Conversation subsystem initialized")
                    
        except Exception as e:
            logger.error(f"Error initializing subsystems: {e}")
    
    async def process_unified_request(self, request: UnifiedMemoryRequest) -> UnifiedMemoryResponse:
        """
        Process a unified memory request through all appropriate subsystems
        
        Args:
            request: Unified memory request
            
        Returns:
            Unified memory response with results from all subsystems
        """
        try:
            operation_type = request.operation_type
            results = {}
            memory_context = {}
            learning_insights = {}
            conversation_state = {}
            recommendations = []
            
            # Route to appropriate operation
            if operation_type == 'store':
                results = await self._handle_store_operation(request)
            elif operation_type == 'search':
                results = await self._handle_search_operation(request)
            elif operation_type == 'chat':
                results = await self._handle_chat_operation(request)
            elif operation_type == 'learn':
                results = await self._handle_learn_operation(request)
            elif operation_type == 'analyze':
                results = await self._handle_analyze_operation(request)
            else:
                raise ValueError(f"Unknown operation type: {operation_type}")
            
            # Gather context from all subsystems
            memory_context = await self._get_memory_context(request)
            learning_insights = await self._get_learning_insights(request)
            conversation_state = await self._get_conversation_state(request)
            recommendations = await self._generate_recommendations(request, results)
            
            return UnifiedMemoryResponse(
                success=True,
                operation_type=operation_type,
                results=results,
                memory_context=memory_context,
                learning_insights=learning_insights,
                conversation_state=conversation_state,
                recommendations=recommendations,
                metadata=request.metadata or {},
                timestamp=datetime.now().isoformat()
            )
            
        except Exception as e:
            logger.error(f"Error processing unified request: {e}")
            return UnifiedMemoryResponse(
                success=False,
                operation_type=request.operation_type,
                results={'error': str(e)},
                memory_context={},
                learning_insights={},
                conversation_state={},
                recommendations=[],
                metadata={},
                timestamp=datetime.now().isoformat()
            )
    
    async def _handle_store_operation(self, request: UnifiedMemoryRequest) -> Dict[str, Any]:
        """Handle memory storage operation"""
        results = {}
        
        # Store in memory system
        if self.memory_instance and self.services_status['memory']:
            try:
                memory_result = self.memory_instance.add(
                    messages=request.content if isinstance(request.content, list) else [{"role": "user", "content": request.content}],
                    user_id=request.user_id,
                    metadata=request.metadata or {}
                )
                results['memory'] = memory_result
                
                # Learn from successful storage
                if self.learning_adapter and request.learning_enabled:
                    self.learning_adapter.learn_from_interaction(
                        input_context=str(request.content),
                        output_result=f"Successfully stored in {request.brain_region or 'memory'}",
                        success_score=1.0,
                        brain_region=request.brain_region or 'CEREBELLUM',
                        pattern_type='memory_storage',
                        metadata={'user_id': request.user_id}
                    )
                
            except Exception as e:
                results['memory'] = {'error': str(e)}
        
        return results
    
    async def _handle_search_operation(self, request: UnifiedMemoryRequest) -> Dict[str, Any]:
        """Handle memory search operation"""
        results = {}
        
        # Search memory system
        if self.memory_instance and self.services_status['memory']:
            try:
                search_results = self.memory_instance.search(
                    query=str(request.content),
                    user_id=request.user_id,
                    limit=request.context.get('limit', 5) if request.context else 5
                )
                results['memory'] = search_results
                
                # Get learning suggestions
                if self.learning_adapter and request.learning_enabled:
                    suggestions = self.learning_adapter.get_improvement_suggestions(
                        context=str(request.content),
                        brain_region=request.brain_region or 'CEREBELLUM'
                    )
                    results['learning_suggestions'] = suggestions
                
            except Exception as e:
                results['memory'] = {'error': str(e)}
        
        return results
    
    async def _handle_chat_operation(self, request: UnifiedMemoryRequest) -> Dict[str, Any]:
        """Handle chat operation with full system integration"""
        results = {}
        
        # Process through conversation system
        if self.conversation_manager and request.conversation_enabled:
            try:
                # Start or continue conversation
                if not request.session_id:
                    context = self.conversation_manager.start_conversation(
                        user_id=request.user_id,
                        initial_message=str(request.content)
                    )
                    session_id = context.session_id
                else:
                    session_id = request.session_id
                
                # Process message
                conversation_result = self.conversation_manager.process_message(
                    session_id=session_id,
                    message=str(request.content),
                    message_type='user'
                )
                
                results['conversation'] = conversation_result
                results['session_id'] = session_id
                
            except Exception as e:
                results['conversation'] = {'error': str(e)}
        
        # Search relevant memories
        if self.memory_instance and self.services_status['memory']:
            try:
                memory_results = self.memory_instance.search(
                    query=str(request.content),
                    user_id=request.user_id,
                    limit=3
                )
                results['relevant_memories'] = memory_results
                
            except Exception as e:
                results['relevant_memories'] = {'error': str(e)}
        
        # Get learning patterns
        if self.learning_adapter and request.learning_enabled:
            try:
                patterns = self.learning_adapter.retrieve_relevant_patterns(
                    query_context=str(request.content),
                    brain_region=request.brain_region,
                    limit=3
                )
                results['learning_patterns'] = patterns
                
            except Exception as e:
                results['learning_patterns'] = {'error': str(e)}
        
        return results
    
    async def _handle_learn_operation(self, request: UnifiedMemoryRequest) -> Dict[str, Any]:
        """Handle learning operation"""
        results = {}
        
        if self.learning_adapter and request.learning_enabled:
            try:
                # Extract learning parameters from context
                context = request.context or {}
                success_score = context.get('success_score', 0.8)
                pattern_type = context.get('pattern_type', 'general')
                
                pattern_id = self.learning_adapter.learn_from_interaction(
                    input_context=str(request.content),
                    output_result=context.get('output_result', 'Learning recorded'),
                    success_score=success_score,
                    brain_region=request.brain_region or 'CEREBELLUM',
                    pattern_type=pattern_type,
                    metadata=request.metadata or {}
                )
                
                results['learning'] = {
                    'pattern_id': pattern_id,
                    'success': pattern_id is not None
                }
                
            except Exception as e:
                results['learning'] = {'error': str(e)}
        
        return results
    
    async def _handle_analyze_operation(self, request: UnifiedMemoryRequest) -> Dict[str, Any]:
        """Handle analysis operation across all systems"""
        results = {}
        
        # Memory analysis
        if self.memory_instance and self.services_status['memory']:
            try:
                # Search for related memories
                memory_results = self.memory_instance.search(
                    query=str(request.content),
                    user_id=request.user_id,
                    limit=10
                )
                
                # Analyze memory patterns
                analysis = {
                    'total_memories': len(memory_results),
                    'relevance_scores': [r.get('score', 0) for r in memory_results],
                    'memory_types': list(set(r.get('metadata', {}).get('memory_type', 'unknown') for r in memory_results))
                }
                
                results['memory_analysis'] = analysis
                
            except Exception as e:
                results['memory_analysis'] = {'error': str(e)}
        
        # Learning analysis
        if self.learning_adapter and request.learning_enabled:
            try:
                stats = self.learning_adapter.get_learning_stats()
                patterns = self.learning_adapter.retrieve_relevant_patterns(
                    query_context=str(request.content),
                    limit=5
                )
                
                analysis = {
                    'learning_stats': stats,
                    'relevant_patterns': len(patterns),
                    'pattern_effectiveness': [p.effectiveness_score for p in patterns] if patterns else []
                }
                
                results['learning_analysis'] = analysis
                
            except Exception as e:
                results['learning_analysis'] = {'error': str(e)}
        
        # Conversation analysis
        if self.conversation_manager and request.conversation_enabled:
            try:
                stats = self.conversation_manager.get_conversation_stats()
                results['conversation_analysis'] = stats
                
            except Exception as e:
                results['conversation_analysis'] = {'error': str(e)}
        
        return results
    
    async def _get_memory_context(self, request: UnifiedMemoryRequest) -> Dict[str, Any]:
        """Get memory context for the request"""
        if not self.memory_instance or not self.services_status['memory']:
            return {}
        
        try:
            # Get recent memories for context
            recent_memories = self.memory_instance.search(
                query=str(request.content),
                user_id=request.user_id,
                limit=3
            )
            
            return {
                'recent_memories_count': len(recent_memories),
                'brain_region': request.brain_region,
                'has_relevant_context': len(recent_memories) > 0
            }
            
        except Exception as e:
            logger.error(f"Error getting memory context: {e}")
            return {}
    
    async def _get_learning_insights(self, request: UnifiedMemoryRequest) -> Dict[str, Any]:
        """Get learning insights for the request"""
        if not self.learning_adapter or not request.learning_enabled:
            return {}
        
        try:
            patterns = self.learning_adapter.retrieve_relevant_patterns(
                query_context=str(request.content),
                brain_region=request.brain_region,
                limit=2
            )
            
            return {
                'relevant_patterns_count': len(patterns),
                'has_learning_insights': len(patterns) > 0,
                'average_effectiveness': sum(p.effectiveness_score for p in patterns) / len(patterns) if patterns else 0
            }
            
        except Exception as e:
            logger.error(f"Error getting learning insights: {e}")
            return {}
    
    async def _get_conversation_state(self, request: UnifiedMemoryRequest) -> Dict[str, Any]:
        """Get conversation state for the request"""
        if not self.conversation_manager or not request.conversation_enabled:
            return {}
        
        try:
            if request.session_id and request.session_id in self.conversation_manager.sessions:
                context = self.conversation_manager.sessions[request.session_id]
                return {
                    'session_id': request.session_id,
                    'current_state': context.current_state.value,
                    'current_flow': context.current_flow,
                    'brain_region': context.brain_region,
                    'message_count': len(context.conversation_history)
                }
            else:
                return {
                    'session_id': None,
                    'current_state': 'idle',
                    'ready_for_conversation': True
                }
                
        except Exception as e:
            logger.error(f"Error getting conversation state: {e}")
            return {}
    
    async def _generate_recommendations(self, request: UnifiedMemoryRequest, results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate intelligent recommendations based on results"""
        recommendations = []
        
        try:
            # Memory-based recommendations
            if 'memory' in results and results['memory']:
                if request.operation_type == 'search':
                    memory_results = results['memory']
                    if len(memory_results) == 0:
                        recommendations.append({
                            'type': 'memory_suggestion',
                            'title': 'No memories found',
                            'description': 'Consider storing this information for future reference',
                            'action': 'store',
                            'priority': 'medium'
                        })
                    elif len(memory_results) > 5:
                        recommendations.append({
                            'type': 'memory_organization',
                            'title': 'Many related memories found',
                            'description': 'Consider organizing these memories by topic',
                            'action': 'organize',
                            'priority': 'low'
                        })
            
            # Learning-based recommendations
            if 'learning_patterns' in results and results['learning_patterns']:
                patterns = results['learning_patterns']
                if len(patterns) > 0:
                    avg_effectiveness = sum(p.effectiveness_score for p in patterns) / len(patterns)
                    if avg_effectiveness > 0.8:
                        recommendations.append({
                            'type': 'learning_insight',
                            'title': 'High-quality patterns available',
                            'description': 'Previous similar interactions were very successful',
                            'action': 'apply_patterns',
                            'priority': 'high'
                        })
            
            # Conversation-based recommendations
            if 'conversation' in results and results['conversation']:
                conv_result = results['conversation']
                if conv_result.get('flow_used'):
                    recommendations.append({
                        'type': 'conversation_flow',
                        'title': 'Conversation flow active',
                        'description': f"Following {conv_result['flow_used']} pattern",
                        'action': 'continue_flow',
                        'priority': 'high'
                    })
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
        
        return recommendations
    
    def get_service_status(self) -> Dict[str, Any]:
        """Get comprehensive service status"""
        return {
            'unified_service': True,
            'subsystems': self.services_status,
            'available_operations': ['store', 'search', 'chat', 'learn', 'analyze'],
            'total_subsystems': len(self.services_status),
            'active_subsystems': sum(self.services_status.values()),
            'health_score': sum(self.services_status.values()) / len(self.services_status),
            'timestamp': datetime.now().isoformat()
        }

# Create Blueprint for unified API endpoints
unified_bp = Blueprint('unified', __name__, url_prefix='/api/unified')

# Global unified service instance
unified_service = None

def initialize_unified_service(config: Dict[str, Any]) -> bool:
    """Initialize the unified memory service"""
    global unified_service

    try:
        unified_service = UnifiedMemoryService(config)
        logger.info("✅ Unified Memory Service initialized successfully")
        return True

    except Exception as e:
        logger.error(f"❌ Failed to initialize unified service: {str(e)}")
        return False

@unified_bp.route('/health', methods=['GET'])
def unified_health_check():
    """Comprehensive health check for all subsystems"""
    try:
        if unified_service is None:
            return jsonify({
                'status': 'unhealthy',
                'service': 'metatron-unified',
                'error': 'Unified service not initialized',
                'timestamp': datetime.now().isoformat()
            }), 503

        status = unified_service.get_service_status()

        # Determine overall health
        health_score = status['health_score']
        if health_score >= 0.8:
            overall_status = 'healthy'
            status_code = 200
        elif health_score >= 0.5:
            overall_status = 'degraded'
            status_code = 200
        else:
            overall_status = 'unhealthy'
            status_code = 503

        return jsonify({
            'status': overall_status,
            'service': 'metatron-unified',
            'health_score': health_score,
            'subsystems': status['subsystems'],
            'available_operations': status['available_operations'],
            'active_subsystems': status['active_subsystems'],
            'total_subsystems': status['total_subsystems'],
            'timestamp': status['timestamp'],
            'version': '1.0.0'
        }), status_code

    except Exception as e:
        logger.error(f"Unified health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'service': 'metatron-unified',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@unified_bp.route('/process', methods=['POST'])
def process_unified_request():
    """Process a unified memory request"""
    try:
        if unified_service is None:
            return jsonify({
                'success': False,
                'error': 'Unified service not initialized'
            }), 503

        data = request.json

        # Validate required parameters
        if not data or 'user_id' not in data or 'content' not in data or 'operation_type' not in data:
            return jsonify({
                'success': False,
                'error': 'user_id, content, and operation_type are required'
            }), 400

        # Create unified request
        unified_request = UnifiedMemoryRequest(
            user_id=data['user_id'],
            content=data['content'],
            operation_type=data['operation_type'],
            brain_region=data.get('brain_region'),
            context=data.get('context'),
            metadata=data.get('metadata'),
            session_id=data.get('session_id'),
            learning_enabled=data.get('learning_enabled', True),
            conversation_enabled=data.get('conversation_enabled', True)
        )

        # Process request asynchronously
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            response = loop.run_until_complete(
                unified_service.process_unified_request(unified_request)
            )
        finally:
            loop.close()

        # Convert response to dict
        response_dict = asdict(response)

        logger.info(f"✅ Processed unified request: {unified_request.operation_type}")

        return jsonify(response_dict)

    except Exception as e:
        logger.error(f"Error processing unified request: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@unified_bp.route('/store', methods=['POST'])
def unified_store():
    """Simplified store endpoint"""
    try:
        data = request.json

        if not data or 'user_id' not in data or 'content' not in data:
            return jsonify({
                'success': False,
                'error': 'user_id and content are required'
            }), 400

        # Create store request
        store_request = UnifiedMemoryRequest(
            user_id=data['user_id'],
            content=data['content'],
            operation_type='store',
            brain_region=data.get('brain_region'),
            metadata=data.get('metadata'),
            learning_enabled=data.get('learning_enabled', True)
        )

        # Process request
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            response = loop.run_until_complete(
                unified_service.process_unified_request(store_request)
            )
        finally:
            loop.close()

        return jsonify(asdict(response))

    except Exception as e:
        logger.error(f"Error in unified store: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@unified_bp.route('/search', methods=['POST'])
def unified_search():
    """Simplified search endpoint"""
    try:
        data = request.json

        if not data or 'user_id' not in data or 'query' not in data:
            return jsonify({
                'success': False,
                'error': 'user_id and query are required'
            }), 400

        # Create search request
        search_request = UnifiedMemoryRequest(
            user_id=data['user_id'],
            content=data['query'],
            operation_type='search',
            brain_region=data.get('brain_region'),
            context=data.get('context'),
            learning_enabled=data.get('learning_enabled', True)
        )

        # Process request
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            response = loop.run_until_complete(
                unified_service.process_unified_request(search_request)
            )
        finally:
            loop.close()

        return jsonify(asdict(response))

    except Exception as e:
        logger.error(f"Error in unified search: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@unified_bp.route('/chat', methods=['POST'])
def unified_chat():
    """Simplified chat endpoint with full system integration"""
    try:
        data = request.json

        if not data or 'user_id' not in data or 'message' not in data:
            return jsonify({
                'success': False,
                'error': 'user_id and message are required'
            }), 400

        # Create chat request
        chat_request = UnifiedMemoryRequest(
            user_id=data['user_id'],
            content=data['message'],
            operation_type='chat',
            brain_region=data.get('brain_region'),
            session_id=data.get('session_id'),
            context=data.get('context'),
            learning_enabled=data.get('learning_enabled', True),
            conversation_enabled=data.get('conversation_enabled', True)
        )

        # Process request
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            response = loop.run_until_complete(
                unified_service.process_unified_request(chat_request)
            )
        finally:
            loop.close()

        return jsonify(asdict(response))

    except Exception as e:
        logger.error(f"Error in unified chat: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@unified_bp.route('/analyze', methods=['POST'])
def unified_analyze():
    """Comprehensive analysis across all systems"""
    try:
        data = request.json

        if not data or 'user_id' not in data:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400

        # Create analyze request
        analyze_request = UnifiedMemoryRequest(
            user_id=data['user_id'],
            content=data.get('content', 'general_analysis'),
            operation_type='analyze',
            brain_region=data.get('brain_region'),
            context=data.get('context'),
            learning_enabled=data.get('learning_enabled', True),
            conversation_enabled=data.get('conversation_enabled', True)
        )

        # Process request
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            response = loop.run_until_complete(
                unified_service.process_unified_request(analyze_request)
            )
        finally:
            loop.close()

        return jsonify(asdict(response))

    except Exception as e:
        logger.error(f"Error in unified analyze: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Helper function to get unified service (for use by other modules)
def get_unified_service():
    """Get the global unified service instance"""
    return unified_service
