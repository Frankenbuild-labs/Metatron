"""
Learning API Endpoints for Metatron Memory System
Provides REST API for VANNA-inspired learning capabilities
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

from vanna_learning_adapter import VannaLearningAdapter

# Configure logging
logger = logging.getLogger(__name__)

# Create Blueprint for learning endpoints
learning_bp = Blueprint('learning', __name__, url_prefix='/api/learning')

# Global learning adapter instance
learning_adapter = None

def initialize_learning_system(config: Dict[str, Any]) -> bool:
    """Initialize the learning system"""
    global learning_adapter
    
    try:
        learning_config = {
            'patterns_db_path': config.get('patterns_db_path', './backend/memory/data/learning_patterns.json'),
            'feedback_db_path': config.get('feedback_db_path', './backend/memory/data/feedback_records.json'),
            'vectorizer_path': config.get('vectorizer_path', './backend/memory/data/pattern_vectorizer.pkl'),
            'min_success_score': config.get('min_success_score', 0.7),
            'max_patterns_per_type': config.get('max_patterns_per_type', 1000),
            'pattern_decay_days': config.get('pattern_decay_days', 30)
        }
        
        learning_adapter = VannaLearningAdapter(learning_config)
        logger.info("✅ Learning system initialized successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize learning system: {str(e)}")
        return False

@learning_bp.route('/health', methods=['GET'])
def learning_health_check():
    """Health check for learning system"""
    try:
        if learning_adapter is None:
            return jsonify({
                'status': 'unhealthy',
                'service': 'metatron-learning',
                'error': 'Learning adapter not initialized',
                'timestamp': datetime.now().isoformat()
            }), 503
        
        stats = learning_adapter.get_learning_stats()
        
        return jsonify({
            'status': 'healthy',
            'service': 'metatron-learning',
            'learning_stats': stats,
            'timestamp': datetime.now().isoformat(),
            'version': '1.0.0'
        })
        
    except Exception as e:
        logger.error(f"Learning health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'service': 'metatron-learning',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@learning_bp.route('/learn', methods=['POST'])
def learn_from_interaction():
    """Learn from a successful interaction"""
    try:
        if learning_adapter is None:
            return jsonify({
                'success': False,
                'error': 'Learning system not initialized'
            }), 503
        
        data = request.json
        
        # Validate required parameters
        required_fields = ['input_context', 'output_result', 'success_score', 'brain_region']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Extract parameters
        input_context = data['input_context']
        output_result = data['output_result']
        success_score = float(data['success_score'])
        brain_region = data['brain_region']
        pattern_type = data.get('pattern_type', 'conversation')
        metadata = data.get('metadata', {})
        
        # Validate success score
        if not 0.0 <= success_score <= 1.0:
            return jsonify({
                'success': False,
                'error': 'Success score must be between 0.0 and 1.0'
            }), 400
        
        # Learn from interaction
        pattern_id = learning_adapter.learn_from_interaction(
            input_context=input_context,
            output_result=output_result,
            success_score=success_score,
            brain_region=brain_region,
            pattern_type=pattern_type,
            metadata=metadata
        )
        
        if pattern_id:
            logger.info(f"✅ Learned from interaction: {pattern_id}")
            return jsonify({
                'success': True,
                'pattern_id': pattern_id,
                'message': 'Successfully learned from interaction',
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Interaction not significant enough to learn from',
                'timestamp': datetime.now().isoformat()
            })
        
    except Exception as e:
        logger.error(f"Error learning from interaction: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@learning_bp.route('/patterns', methods=['POST'])
def retrieve_patterns():
    """Retrieve relevant patterns for improving responses"""
    try:
        if learning_adapter is None:
            return jsonify({
                'success': False,
                'error': 'Learning system not initialized'
            }), 503
        
        data = request.json
        
        if not data or 'query_context' not in data:
            return jsonify({
                'success': False,
                'error': 'Query context is required'
            }), 400
        
        query_context = data['query_context']
        pattern_type = data.get('pattern_type')
        brain_region = data.get('brain_region')
        limit = data.get('limit', 5)
        
        # Retrieve relevant patterns
        patterns = learning_adapter.retrieve_relevant_patterns(
            query_context=query_context,
            pattern_type=pattern_type,
            brain_region=brain_region,
            limit=limit
        )
        
        # Format patterns for response
        formatted_patterns = []
        for pattern in patterns:
            formatted_patterns.append({
                'id': pattern.id,
                'pattern_type': pattern.pattern_type,
                'input_context': pattern.input_context,
                'successful_output': pattern.successful_output,
                'success_score': pattern.success_score,
                'brain_region': pattern.brain_region,
                'effectiveness_score': pattern.effectiveness_score,
                'usage_count': pattern.usage_count,
                'created_at': pattern.created_at,
                'last_used': pattern.last_used
            })
        
        logger.info(f"🔍 Retrieved {len(formatted_patterns)} relevant patterns")
        
        return jsonify({
            'success': True,
            'patterns': formatted_patterns,
            'total_count': len(formatted_patterns),
            'query_context': query_context,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error retrieving patterns: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@learning_bp.route('/feedback', methods=['POST'])
def record_feedback():
    """Record user feedback for continuous improvement"""
    try:
        if learning_adapter is None:
            return jsonify({
                'success': False,
                'error': 'Learning system not initialized'
            }), 503
        
        data = request.json
        
        # Validate required parameters
        required_fields = ['pattern_id', 'user_id', 'feedback_type', 'feedback_score', 'original_output']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        pattern_id = data['pattern_id']
        user_id = data['user_id']
        feedback_type = data['feedback_type']
        feedback_score = float(data['feedback_score'])
        original_output = data['original_output']
        corrected_output = data.get('corrected_output')
        context = data.get('context', {})
        
        # Validate feedback score
        if not -1.0 <= feedback_score <= 1.0:
            return jsonify({
                'success': False,
                'error': 'Feedback score must be between -1.0 and 1.0'
            }), 400
        
        # Validate feedback type
        valid_feedback_types = ['positive', 'negative', 'correction']
        if feedback_type not in valid_feedback_types:
            return jsonify({
                'success': False,
                'error': f'Feedback type must be one of: {valid_feedback_types}'
            }), 400
        
        # Record feedback
        feedback_id = learning_adapter.record_feedback(
            pattern_id=pattern_id,
            user_id=user_id,
            feedback_type=feedback_type,
            feedback_score=feedback_score,
            original_output=original_output,
            corrected_output=corrected_output,
            context=context
        )
        
        if feedback_id:
            logger.info(f"✅ Recorded feedback: {feedback_id}")
            return jsonify({
                'success': True,
                'feedback_id': feedback_id,
                'message': 'Feedback recorded successfully',
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to record feedback'
            }), 500
        
    except Exception as e:
        logger.error(f"Error recording feedback: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@learning_bp.route('/suggestions', methods=['POST'])
def get_improvement_suggestions():
    """Get suggestions for improving responses"""
    try:
        if learning_adapter is None:
            return jsonify({
                'success': False,
                'error': 'Learning system not initialized'
            }), 503
        
        data = request.json
        
        if not data or 'context' not in data or 'brain_region' not in data:
            return jsonify({
                'success': False,
                'error': 'Context and brain_region are required'
            }), 400
        
        context = data['context']
        brain_region = data['brain_region']
        
        # Get improvement suggestions
        suggestions = learning_adapter.get_improvement_suggestions(
            context=context,
            brain_region=brain_region
        )
        
        logger.info(f"💡 Generated {len(suggestions)} improvement suggestions")
        
        return jsonify({
            'success': True,
            'suggestions': suggestions,
            'context': context,
            'brain_region': brain_region,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting improvement suggestions: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@learning_bp.route('/stats', methods=['GET'])
def get_learning_statistics():
    """Get comprehensive learning system statistics"""
    try:
        if learning_adapter is None:
            return jsonify({
                'success': False,
                'error': 'Learning system not initialized'
            }), 503
        
        stats = learning_adapter.get_learning_stats()
        
        return jsonify({
            'success': True,
            'statistics': stats,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting learning statistics: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@learning_bp.route('/cleanup', methods=['POST'])
def cleanup_old_patterns():
    """Clean up old, ineffective patterns"""
    try:
        if learning_adapter is None:
            return jsonify({
                'success': False,
                'error': 'Learning system not initialized'
            }), 503
        
        # Get stats before cleanup
        stats_before = learning_adapter.get_learning_stats()
        patterns_before = stats_before.get('total_patterns', 0)
        
        # Perform cleanup
        learning_adapter.cleanup_old_patterns()
        
        # Get stats after cleanup
        stats_after = learning_adapter.get_learning_stats()
        patterns_after = stats_after.get('total_patterns', 0)
        
        patterns_removed = patterns_before - patterns_after
        
        logger.info(f"🧹 Cleanup complete: removed {patterns_removed} patterns")
        
        return jsonify({
            'success': True,
            'patterns_before': patterns_before,
            'patterns_after': patterns_after,
            'patterns_removed': patterns_removed,
            'message': f'Cleanup complete: removed {patterns_removed} old patterns',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error during cleanup: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Helper function to get learning adapter (for use by other modules)
def get_learning_adapter():
    """Get the global learning adapter instance"""
    return learning_adapter
