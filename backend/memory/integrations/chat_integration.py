"""
Chat Integration for Metatron Memory System
Connects memory system with main chat orchestrator for memory-aware conversations
"""

import requests
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

# Import learning system
try:
    import sys
    import os
    sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'learning'))
    from learning_api import get_learning_adapter
    LEARNING_AVAILABLE = True
except ImportError:
    LEARNING_AVAILABLE = False

logger = logging.getLogger(__name__)

class ChatMemoryIntegration:
    """
    Integration layer between memory system and chat orchestrator
    Enables memory-aware conversations and automatic memory formation
    """
    
    def __init__(self, memory_api_url: str = "http://localhost:5006"):
        self.memory_api_url = memory_api_url
        self.session_context = {}
        
    def add_conversation_memory(self, user_id: str, messages: List[Dict], 
                              brain_region: Optional[str] = None) -> bool:
        """
        Add conversation to memory system
        
        Args:
            user_id: User identifier
            messages: List of conversation messages
            brain_region: Specific brain region for memory storage
            
        Returns:
            bool: Success status
        """
        try:
            # Prepare memory content
            if isinstance(messages, list) and len(messages) > 0:
                # Format conversation for memory storage
                conversation_text = self._format_conversation(messages)
                
                # Determine brain region if not specified
                if not brain_region:
                    brain_region = self._classify_conversation_type(conversation_text)
                
                # Add to memory
                response = requests.post(
                    f"{self.memory_api_url}/api/memory/add",
                    json={
                        'content': messages,
                        'user_id': user_id,
                        'brain_region': brain_region,
                        'metadata': {
                            'type': 'conversation',
                            'timestamp': datetime.now().isoformat(),
                            'message_count': len(messages)
                        }
                    },
                    timeout=10
                )
                
                if response.status_code == 200:
                    result = response.json()
                    logger.info(f"✅ Added conversation memory: {result.get('memory_id')}")
                    return True
                else:
                    logger.error(f"❌ Failed to add memory: {response.status_code}")
                    return False
                    
            return False
            
        except Exception as e:
            logger.error(f"Error adding conversation memory: {e}")
            return False
    
    def retrieve_relevant_memories(self, user_id: str, query: str, 
                                 limit: int = 5, brain_region: Optional[str] = None) -> List[Dict]:
        """
        Retrieve relevant memories for conversation context
        
        Args:
            user_id: User identifier
            query: Search query
            limit: Maximum number of memories to retrieve
            brain_region: Specific brain region to search
            
        Returns:
            List of relevant memories
        """
        try:
            search_params = {
                'query': query,
                'user_id': user_id,
                'limit': limit
            }
            
            if brain_region:
                search_params['brain_region'] = brain_region
            
            response = requests.post(
                f"{self.memory_api_url}/api/memory/search",
                json=search_params,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                memories = result.get('results', [])
                logger.info(f"🔍 Retrieved {len(memories)} relevant memories")
                return memories
            else:
                logger.error(f"❌ Failed to search memories: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"Error retrieving memories: {e}")
            return []
    
    def get_memory_context_for_chat(self, user_id: str, current_message: str) -> Dict[str, Any]:
        """
        Get memory context for enhancing chat responses with learning suggestions

        Args:
            user_id: User identifier
            current_message: Current user message

        Returns:
            Memory context for chat enhancement including learning patterns
        """
        try:
            # Search for relevant memories
            memories = self.retrieve_relevant_memories(user_id, current_message, limit=3)

            # Get memory statistics for context
            stats_response = requests.get(
                f"{self.memory_api_url}/api/memory/stats",
                params={'user_id': user_id},
                timeout=5
            )

            stats = {}
            if stats_response.status_code == 200:
                stats = stats_response.json()

            # Get learning suggestions if available
            learning_suggestions = []
            if LEARNING_AVAILABLE:
                try:
                    suggestions_response = requests.post(
                        f"{self.memory_api_url}/api/learning/suggestions",
                        json={
                            'context': current_message,
                            'brain_region': self._classify_conversation_type(current_message)
                        },
                        timeout=5
                    )

                    if suggestions_response.status_code == 200:
                        suggestions_data = suggestions_response.json()
                        learning_suggestions = suggestions_data.get('suggestions', [])

                except Exception as e:
                    logger.warning(f"Failed to get learning suggestions: {e}")

            # Format context for chat
            context = {
                'relevant_memories': memories,
                'memory_stats': stats,
                'has_memories': len(memories) > 0,
                'memory_summary': self._create_memory_summary(memories),
                'learning_suggestions': learning_suggestions,
                'has_learning_suggestions': len(learning_suggestions) > 0
            }

            return context

        except Exception as e:
            logger.error(f"Error getting memory context: {e}")
            return {'relevant_memories': [], 'has_memories': False, 'learning_suggestions': []}
    
    def update_session_context(self, user_id: str, context_data: Dict):
        """Update session context for working memory"""
        if user_id not in self.session_context:
            self.session_context[user_id] = {}
        
        self.session_context[user_id].update(context_data)
        self.session_context[user_id]['last_updated'] = datetime.now().isoformat()
    
    def get_session_context(self, user_id: str) -> Dict:
        """Get current session context"""
        return self.session_context.get(user_id, {})
    
    def _format_conversation(self, messages: List[Dict]) -> str:
        """Format conversation messages for memory storage"""
        formatted_parts = []
        for msg in messages:
            role = msg.get('role', 'unknown')
            content = msg.get('content', '')
            formatted_parts.append(f"{role}: {content}")
        
        return "\n".join(formatted_parts)
    
    def _classify_conversation_type(self, conversation_text: str) -> str:
        """
        Classify conversation to determine appropriate brain region
        
        Returns:
            Brain region identifier
        """
        text_lower = conversation_text.lower()
        
        # Personal information -> Personal Memory (Occipital Lobe)
        if any(word in text_lower for word in ['my name', 'i am', 'i like', 'my preference', 'remember me']):
            return 'OCCIPITAL_LOBE'
        
        # Learning/Knowledge -> Long-term Memory (Temporal Lobe)
        elif any(word in text_lower for word in ['learn', 'remember', 'knowledge', 'fact', 'information']):
            return 'TEMPORAL_LOBE'
        
        # Current task/workflow -> Working Memory (Parietal Lobe)
        elif any(word in text_lower for word in ['current', 'working on', 'task', 'project', 'now']):
            return 'PARIETAL_LOBE'
        
        # System/Tool usage -> Central Storage (Cerebellum)
        elif any(word in text_lower for word in ['tool', 'function', 'system', 'command', 'api']):
            return 'CEREBELLUM'
        
        # Default to Short-term Memory (Frontal Lobe)
        else:
            return 'FRONTAL_LOBE'
    
    def _create_memory_summary(self, memories: List[Dict]) -> str:
        """Create a summary of relevant memories for context"""
        if not memories:
            return "No relevant memories found."
        
        summary_parts = []
        for memory in memories[:3]:  # Top 3 most relevant
            content = memory.get('content', '')
            brain_region = memory.get('brain_region', 'UNKNOWN')
            
            # Truncate long content
            if len(content) > 100:
                content = content[:97] + "..."
            
            summary_parts.append(f"[{brain_region}] {content}")
        
        return " | ".join(summary_parts)
    
    def learn_from_chat_interaction(self,
                                   user_id: str,
                                   user_message: str,
                                   ai_response: str,
                                   user_feedback: Optional[float] = None,
                                   success_indicators: Optional[Dict] = None) -> bool:
        """
        Learn from chat interaction for continuous improvement

        Args:
            user_id: User identifier
            user_message: User's input message
            ai_response: AI's response
            user_feedback: Optional user feedback score (-1.0 to 1.0)
            success_indicators: Optional success metrics (response_time, etc.)

        Returns:
            Success status
        """
        try:
            if not LEARNING_AVAILABLE:
                return False

            # Determine success score
            success_score = 0.7  # Default moderate success

            if user_feedback is not None:
                # Convert user feedback (-1 to 1) to success score (0 to 1)
                success_score = (user_feedback + 1.0) / 2.0
            elif success_indicators:
                # Calculate success based on indicators
                response_time = success_indicators.get('response_time', 1.0)
                message_length = len(ai_response)

                # Simple heuristic: faster responses and appropriate length = better
                time_score = max(0.0, 1.0 - (response_time / 10.0))  # Penalize slow responses
                length_score = min(1.0, message_length / 500.0)  # Reward detailed responses up to 500 chars

                success_score = (time_score * 0.3 + length_score * 0.7)

            # Determine brain region
            brain_region = self._classify_conversation_type(user_message)

            # Learn from interaction
            learn_response = requests.post(
                f"{self.memory_api_url}/api/learning/learn",
                json={
                    'input_context': user_message,
                    'output_result': ai_response,
                    'success_score': success_score,
                    'brain_region': brain_region,
                    'pattern_type': 'conversation',
                    'metadata': {
                        'user_id': user_id,
                        'user_feedback': user_feedback,
                        'success_indicators': success_indicators or {}
                    }
                },
                timeout=5
            )

            if learn_response.status_code == 200:
                result = learn_response.json()
                if result.get('success'):
                    logger.info(f"✅ Learned from chat interaction: {result.get('pattern_id')}")
                    return True

            return False

        except Exception as e:
            logger.error(f"Error learning from chat interaction: {e}")
            return False

    def record_user_feedback(self,
                           pattern_id: str,
                           user_id: str,
                           feedback_type: str,
                           feedback_score: float,
                           original_response: str,
                           corrected_response: Optional[str] = None) -> bool:
        """
        Record explicit user feedback for learning improvement

        Args:
            pattern_id: ID of the pattern being evaluated
            user_id: User providing feedback
            feedback_type: 'positive', 'negative', 'correction'
            feedback_score: Numerical feedback (-1.0 to 1.0)
            original_response: The original AI response
            corrected_response: User's correction (if applicable)

        Returns:
            Success status
        """
        try:
            if not LEARNING_AVAILABLE:
                return False

            feedback_response = requests.post(
                f"{self.memory_api_url}/api/learning/feedback",
                json={
                    'pattern_id': pattern_id,
                    'user_id': user_id,
                    'feedback_type': feedback_type,
                    'feedback_score': feedback_score,
                    'original_output': original_response,
                    'corrected_output': corrected_response,
                    'context': {'source': 'chat_interface'}
                },
                timeout=5
            )

            if feedback_response.status_code == 200:
                result = feedback_response.json()
                if result.get('success'):
                    logger.info(f"✅ Recorded user feedback: {result.get('feedback_id')}")
                    return True

            return False

        except Exception as e:
            logger.error(f"Error recording user feedback: {e}")
            return False

    def health_check(self) -> bool:
        """Check if memory service is available"""
        try:
            response = requests.get(
                f"{self.memory_api_url}/api/memory/health",
                timeout=5
            )
            return response.status_code == 200
        except:
            return False

# Global integration instance
chat_memory_integration = ChatMemoryIntegration()

def get_memory_integration() -> ChatMemoryIntegration:
    """Get the global memory integration instance"""
    return chat_memory_integration
