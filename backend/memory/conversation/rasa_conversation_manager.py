"""
RASA-Inspired Conversation Management for Metatron
Implements sophisticated dialogue state tracking, flow management, and agent orchestration
"""

import json
import uuid
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import asyncio

logger = logging.getLogger(__name__)

class ConversationState(Enum):
    """Conversation states based on RASA patterns"""
    IDLE = "idle"
    LISTENING = "listening"
    PROCESSING = "processing"
    WAITING_FOR_INPUT = "waiting_for_input"
    AGENT_HANDOFF = "agent_handoff"
    FLOW_EXECUTION = "flow_execution"
    MEMORY_RETRIEVAL = "memory_retrieval"
    COMPLETED = "completed"
    ERROR = "error"

class FlowType(Enum):
    """Types of conversation flows"""
    SIMPLE_QA = "simple_qa"
    MEMORY_INTERACTION = "memory_interaction"
    MULTI_STEP_TASK = "multi_step_task"
    AGENT_COORDINATION = "agent_coordination"
    TOOL_USAGE = "tool_usage"
    LEARNING_FEEDBACK = "learning_feedback"

@dataclass
class ConversationContext:
    """Tracks conversation context and state"""
    session_id: str
    user_id: str
    current_state: ConversationState
    current_flow: Optional[str]
    flow_type: Optional[FlowType]
    brain_region: str
    memory_context: Dict[str, Any]
    agent_context: Dict[str, Any]
    flow_variables: Dict[str, Any]
    conversation_history: List[Dict[str, Any]]
    created_at: str
    updated_at: str
    metadata: Dict[str, Any]

@dataclass
class ConversationFlow:
    """Defines a conversation flow pattern"""
    flow_id: str
    flow_name: str
    flow_type: FlowType
    description: str
    trigger_patterns: List[str]
    brain_regions: List[str]
    steps: List[Dict[str, Any]]
    required_context: List[str]
    expected_duration: int  # in seconds
    success_criteria: Dict[str, Any]
    fallback_actions: List[str]
    metadata: Dict[str, Any]

@dataclass
class AgentCapability:
    """Represents an agent's capabilities (A2A-inspired)"""
    agent_id: str
    agent_name: str
    description: str
    skills: List[Dict[str, Any]]
    input_modes: List[str]
    output_modes: List[str]
    brain_regions: List[str]
    endpoint_url: Optional[str]
    status: str
    capabilities: Dict[str, Any]

class RasaConversationManager:
    """
    RASA-inspired conversation management system for Metatron
    Handles dialogue state tracking, flow management, and agent orchestration
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.sessions: Dict[str, ConversationContext] = {}
        self.flows: Dict[str, ConversationFlow] = {}
        self.agents: Dict[str, AgentCapability] = {}
        
        # Configuration
        self.session_timeout = config.get('session_timeout', 3600)  # 1 hour
        self.max_conversation_history = config.get('max_conversation_history', 50)
        self.default_brain_region = config.get('default_brain_region', 'FRONTAL_LOBE')
        
        # Storage paths
        self.flows_db_path = config.get('flows_db_path', './backend/memory/data/conversation_flows.json')
        self.sessions_db_path = config.get('sessions_db_path', './backend/memory/data/conversation_sessions.json')
        self.agents_db_path = config.get('agents_db_path', './backend/memory/data/registered_agents.json')
        
        # Initialize system
        self._load_flows()
        self._load_agents()
        self._register_default_flows()
        
        logger.info("✅ RASA Conversation Manager initialized")
    
    def start_conversation(self, user_id: str, initial_message: str, 
                         session_id: Optional[str] = None) -> ConversationContext:
        """
        Start a new conversation or continue existing one
        
        Args:
            user_id: User identifier
            initial_message: First message in conversation
            session_id: Optional existing session ID
            
        Returns:
            ConversationContext for the session
        """
        try:
            if session_id and session_id in self.sessions:
                # Continue existing conversation
                context = self.sessions[session_id]
                context.updated_at = datetime.now().isoformat()
            else:
                # Start new conversation
                session_id = str(uuid.uuid4())
                context = ConversationContext(
                    session_id=session_id,
                    user_id=user_id,
                    current_state=ConversationState.LISTENING,
                    current_flow=None,
                    flow_type=None,
                    brain_region=self._classify_brain_region(initial_message),
                    memory_context={},
                    agent_context={},
                    flow_variables={},
                    conversation_history=[],
                    created_at=datetime.now().isoformat(),
                    updated_at=datetime.now().isoformat(),
                    metadata={}
                )
                self.sessions[session_id] = context
            
            # Add message to history
            self._add_to_conversation_history(context, 'user', initial_message)
            
            logger.info(f"🎭 Started conversation: {session_id}")
            return context
            
        except Exception as e:
            logger.error(f"Error starting conversation: {e}")
            raise
    
    def process_message(self, session_id: str, message: str, 
                       message_type: str = 'user') -> Dict[str, Any]:
        """
        Process a message within a conversation context
        
        Args:
            session_id: Session identifier
            message: Message content
            message_type: Type of message ('user', 'agent', 'system')
            
        Returns:
            Processing result with next actions
        """
        try:
            if session_id not in self.sessions:
                raise ValueError(f"Session {session_id} not found")
            
            context = self.sessions[session_id]
            
            # Update conversation state
            context.current_state = ConversationState.PROCESSING
            context.updated_at = datetime.now().isoformat()
            
            # Add message to history
            self._add_to_conversation_history(context, message_type, message)
            
            # Determine appropriate flow
            flow_result = self._determine_conversation_flow(context, message)
            
            # Execute flow if identified
            if flow_result['flow_id']:
                execution_result = self._execute_conversation_flow(
                    context, flow_result['flow_id'], message
                )
                return execution_result
            else:
                # Default processing
                return self._default_message_processing(context, message)
                
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            return {
                'success': False,
                'error': str(e),
                'next_state': ConversationState.ERROR.value
            }
    
    def _determine_conversation_flow(self, context: ConversationContext, 
                                   message: str) -> Dict[str, Any]:
        """
        Determine which conversation flow to use based on message and context
        
        Args:
            context: Current conversation context
            message: User message
            
        Returns:
            Flow determination result
        """
        try:
            message_lower = message.lower()
            best_flow = None
            best_score = 0.0
            
            for flow_id, flow in self.flows.items():
                score = 0.0
                
                # Check trigger patterns
                for pattern in flow.trigger_patterns:
                    if pattern.lower() in message_lower:
                        score += 1.0
                
                # Check brain region compatibility
                if context.brain_region in flow.brain_regions:
                    score += 0.5
                
                # Check context requirements
                context_match = True
                for req in flow.required_context:
                    if req not in context.flow_variables:
                        context_match = False
                        break
                
                if context_match:
                    score += 0.3
                
                # Update best flow if this scores higher
                if score > best_score and score > 0.5:  # Minimum threshold
                    best_score = score
                    best_flow = flow_id
            
            return {
                'flow_id': best_flow,
                'confidence': best_score,
                'available_flows': list(self.flows.keys())
            }
            
        except Exception as e:
            logger.error(f"Error determining conversation flow: {e}")
            return {'flow_id': None, 'confidence': 0.0}
    
    def _execute_conversation_flow(self, context: ConversationContext, 
                                 flow_id: str, message: str) -> Dict[str, Any]:
        """
        Execute a specific conversation flow
        
        Args:
            context: Conversation context
            flow_id: Flow to execute
            message: Current message
            
        Returns:
            Flow execution result
        """
        try:
            if flow_id not in self.flows:
                raise ValueError(f"Flow {flow_id} not found")
            
            flow = self.flows[flow_id]
            context.current_flow = flow_id
            context.flow_type = flow.flow_type
            context.current_state = ConversationState.FLOW_EXECUTION
            
            # Initialize flow variables if not present
            if 'current_step' not in context.flow_variables:
                context.flow_variables['current_step'] = 0
                context.flow_variables['flow_start_time'] = datetime.now().isoformat()
            
            current_step = context.flow_variables['current_step']
            
            if current_step >= len(flow.steps):
                # Flow completed
                return self._complete_flow(context, flow)
            
            # Execute current step
            step = flow.steps[current_step]
            step_result = self._execute_flow_step(context, flow, step, message)
            
            # Update step counter if step completed successfully
            if step_result.get('step_completed', False):
                context.flow_variables['current_step'] += 1
            
            return step_result
            
        except Exception as e:
            logger.error(f"Error executing conversation flow: {e}")
            return {
                'success': False,
                'error': str(e),
                'next_state': ConversationState.ERROR.value
            }
    
    def _execute_flow_step(self, context: ConversationContext, 
                         flow: ConversationFlow, step: Dict[str, Any], 
                         message: str) -> Dict[str, Any]:
        """
        Execute a single step in a conversation flow
        
        Args:
            context: Conversation context
            flow: Current flow
            step: Step to execute
            message: Current message
            
        Returns:
            Step execution result
        """
        try:
            step_type = step.get('type', 'message')
            step_data = step.get('data', {})
            
            if step_type == 'message':
                return self._execute_message_step(context, step_data, message)
            elif step_type == 'memory_query':
                return self._execute_memory_step(context, step_data, message)
            elif step_type == 'agent_call':
                return self._execute_agent_step(context, step_data, message)
            elif step_type == 'condition':
                return self._execute_condition_step(context, step_data, message)
            elif step_type == 'input_collection':
                return self._execute_input_step(context, step_data, message)
            else:
                logger.warning(f"Unknown step type: {step_type}")
                return {
                    'success': False,
                    'error': f'Unknown step type: {step_type}',
                    'step_completed': False
                }
                
        except Exception as e:
            logger.error(f"Error executing flow step: {e}")
            return {
                'success': False,
                'error': str(e),
                'step_completed': False
            }
    
    def _execute_message_step(self, context: ConversationContext, 
                            step_data: Dict[str, Any], message: str) -> Dict[str, Any]:
        """Execute a message step (send response to user)"""
        try:
            response_template = step_data.get('template', 'I understand.')
            
            # Simple template variable replacement
            response = response_template
            for var, value in context.flow_variables.items():
                response = response.replace(f'{{{var}}}', str(value))
            
            # Add response to conversation history
            self._add_to_conversation_history(context, 'assistant', response)
            
            return {
                'success': True,
                'response': response,
                'step_completed': True,
                'next_state': ConversationState.WAITING_FOR_INPUT.value
            }
            
        except Exception as e:
            logger.error(f"Error executing message step: {e}")
            return {
                'success': False,
                'error': str(e),
                'step_completed': False
            }
    
    def _execute_memory_step(self, context: ConversationContext, 
                           step_data: Dict[str, Any], message: str) -> Dict[str, Any]:
        """Execute a memory query step"""
        try:
            # This would integrate with your memory system
            query = step_data.get('query', message)
            brain_region = step_data.get('brain_region', context.brain_region)
            
            # Placeholder for memory integration
            memory_result = {
                'query': query,
                'brain_region': brain_region,
                'results': [],  # Would be populated by actual memory search
                'timestamp': datetime.now().isoformat()
            }
            
            context.memory_context['last_query'] = memory_result
            
            return {
                'success': True,
                'memory_result': memory_result,
                'step_completed': True,
                'next_state': ConversationState.PROCESSING.value
            }
            
        except Exception as e:
            logger.error(f"Error executing memory step: {e}")
            return {
                'success': False,
                'error': str(e),
                'step_completed': False
            }
    
    def _execute_agent_step(self, context: ConversationContext, 
                          step_data: Dict[str, Any], message: str) -> Dict[str, Any]:
        """Execute an agent call step (A2A-inspired)"""
        try:
            agent_id = step_data.get('agent_id')
            if not agent_id or agent_id not in self.agents:
                return {
                    'success': False,
                    'error': f'Agent {agent_id} not found',
                    'step_completed': False
                }
            
            agent = self.agents[agent_id]
            
            # Placeholder for A2A agent communication
            agent_result = {
                'agent_id': agent_id,
                'agent_name': agent.agent_name,
                'request': message,
                'response': f"Agent {agent.agent_name} processed: {message}",
                'status': 'completed',
                'timestamp': datetime.now().isoformat()
            }
            
            context.agent_context[agent_id] = agent_result
            
            return {
                'success': True,
                'agent_result': agent_result,
                'step_completed': True,
                'next_state': ConversationState.PROCESSING.value
            }
            
        except Exception as e:
            logger.error(f"Error executing agent step: {e}")
            return {
                'success': False,
                'error': str(e),
                'step_completed': False
            }
    
    def _execute_condition_step(self, context: ConversationContext, 
                              step_data: Dict[str, Any], message: str) -> Dict[str, Any]:
        """Execute a conditional step"""
        try:
            condition = step_data.get('condition', 'true')
            
            # Simple condition evaluation (can be enhanced)
            if condition == 'true':
                result = True
            elif condition == 'false':
                result = False
            else:
                # Evaluate condition based on context
                result = self._evaluate_condition(condition, context, message)
            
            return {
                'success': True,
                'condition_result': result,
                'step_completed': True,
                'next_state': ConversationState.PROCESSING.value
            }
            
        except Exception as e:
            logger.error(f"Error executing condition step: {e}")
            return {
                'success': False,
                'error': str(e),
                'step_completed': False
            }
    
    def _execute_input_step(self, context: ConversationContext, 
                          step_data: Dict[str, Any], message: str) -> Dict[str, Any]:
        """Execute an input collection step"""
        try:
            variable_name = step_data.get('variable', 'user_input')
            prompt = step_data.get('prompt', 'Please provide input:')
            
            # Store user input in flow variables
            context.flow_variables[variable_name] = message
            
            return {
                'success': True,
                'collected_input': {variable_name: message},
                'step_completed': True,
                'next_state': ConversationState.PROCESSING.value
            }
            
        except Exception as e:
            logger.error(f"Error executing input step: {e}")
            return {
                'success': False,
                'error': str(e),
                'step_completed': False
            }
    
    def _complete_flow(self, context: ConversationContext, 
                      flow: ConversationFlow) -> Dict[str, Any]:
        """Complete a conversation flow"""
        try:
            context.current_state = ConversationState.COMPLETED
            context.current_flow = None
            
            # Calculate flow duration
            start_time = context.flow_variables.get('flow_start_time')
            if start_time:
                start_dt = datetime.fromisoformat(start_time)
                duration = (datetime.now() - start_dt).total_seconds()
                context.flow_variables['flow_duration'] = duration
            
            return {
                'success': True,
                'flow_completed': True,
                'flow_id': flow.flow_id,
                'flow_name': flow.flow_name,
                'duration': context.flow_variables.get('flow_duration', 0),
                'next_state': ConversationState.IDLE.value
            }
            
        except Exception as e:
            logger.error(f"Error completing flow: {e}")
            return {
                'success': False,
                'error': str(e),
                'flow_completed': False
            }
    
    def _default_message_processing(self, context: ConversationContext, 
                                  message: str) -> Dict[str, Any]:
        """Default message processing when no specific flow is identified"""
        try:
            context.current_state = ConversationState.LISTENING
            
            # Simple response generation (can be enhanced with LLM)
            response = f"I understand you said: {message}. How can I help you further?"
            
            # Add response to conversation history
            self._add_to_conversation_history(context, 'assistant', response)
            
            return {
                'success': True,
                'response': response,
                'flow_used': None,
                'next_state': ConversationState.WAITING_FOR_INPUT.value
            }
            
        except Exception as e:
            logger.error(f"Error in default message processing: {e}")
            return {
                'success': False,
                'error': str(e),
                'next_state': ConversationState.ERROR.value
            }
    
    def _classify_brain_region(self, message: str) -> str:
        """Classify message to determine appropriate brain region"""
        message_lower = message.lower()
        
        # Memory-related -> Temporal Lobe
        if any(word in message_lower for word in ['remember', 'memory', 'recall', 'forget']):
            return 'TEMPORAL_LOBE'
        
        # Personal information -> Occipital Lobe
        elif any(word in message_lower for word in ['my', 'i am', 'personal', 'preference']):
            return 'OCCIPITAL_LOBE'
        
        # Current task -> Parietal Lobe
        elif any(word in message_lower for word in ['working', 'current', 'task', 'now']):
            return 'PARIETAL_LOBE'
        
        # System/tools -> Cerebellum
        elif any(word in message_lower for word in ['tool', 'system', 'function', 'api']):
            return 'CEREBELLUM'
        
        # Default -> Frontal Lobe
        else:
            return 'FRONTAL_LOBE'
    
    def _evaluate_condition(self, condition: str, context: ConversationContext, 
                          message: str) -> bool:
        """Evaluate a condition string"""
        # Simple condition evaluation (can be enhanced)
        if 'has_memory' in condition:
            return bool(context.memory_context)
        elif 'message_contains' in condition:
            # Extract the search term from condition
            return True  # Placeholder
        else:
            return True
    
    def _add_to_conversation_history(self, context: ConversationContext, 
                                   role: str, content: str):
        """Add message to conversation history"""
        message_entry = {
            'role': role,
            'content': content,
            'timestamp': datetime.now().isoformat(),
            'brain_region': context.brain_region
        }
        
        context.conversation_history.append(message_entry)
        
        # Trim history if too long
        if len(context.conversation_history) > self.max_conversation_history:
            context.conversation_history = context.conversation_history[-self.max_conversation_history:]
    
    def _register_default_flows(self):
        """Register default conversation flows"""
        try:
            # Memory interaction flow
            memory_flow = ConversationFlow(
                flow_id="memory_interaction",
                flow_name="Memory Interaction",
                flow_type=FlowType.MEMORY_INTERACTION,
                description="Handle memory-related queries and operations",
                trigger_patterns=["remember", "memory", "recall", "forget", "brain"],
                brain_regions=["TEMPORAL_LOBE", "FRONTAL_LOBE"],
                steps=[
                    {
                        "type": "memory_query",
                        "data": {"query": "{user_message}", "brain_region": "{brain_region}"}
                    },
                    {
                        "type": "message",
                        "data": {"template": "I found some relevant memories. How would you like to proceed?"}
                    }
                ],
                required_context=[],
                expected_duration=30,
                success_criteria={"memory_retrieved": True},
                fallback_actions=["default_response"],
                metadata={}
            )
            
            self.flows[memory_flow.flow_id] = memory_flow
            
            # Simple Q&A flow
            qa_flow = ConversationFlow(
                flow_id="simple_qa",
                flow_name="Simple Q&A",
                flow_type=FlowType.SIMPLE_QA,
                description="Handle simple question and answer interactions",
                trigger_patterns=["what", "how", "why", "when", "where"],
                brain_regions=["FRONTAL_LOBE", "TEMPORAL_LOBE"],
                steps=[
                    {
                        "type": "message",
                        "data": {"template": "Let me help you with that question."}
                    }
                ],
                required_context=[],
                expected_duration=15,
                success_criteria={"response_provided": True},
                fallback_actions=["default_response"],
                metadata={}
            )
            
            self.flows[qa_flow.flow_id] = qa_flow
            
            logger.info("✅ Default conversation flows registered")
            
        except Exception as e:
            logger.error(f"Error registering default flows: {e}")
    
    def _load_flows(self):
        """Load conversation flows from storage"""
        try:
            # Implementation for loading flows from JSON file
            # For now, we'll use the default flows
            pass
        except Exception as e:
            logger.error(f"Error loading flows: {e}")
    
    def _load_agents(self):
        """Load registered agents from storage"""
        try:
            # Implementation for loading agents from JSON file
            # For now, we'll register some default agents
            pass
        except Exception as e:
            logger.error(f"Error loading agents: {e}")
    
    def get_conversation_stats(self) -> Dict[str, Any]:
        """Get conversation management statistics"""
        try:
            active_sessions = len([s for s in self.sessions.values() 
                                 if s.current_state != ConversationState.COMPLETED])
            
            return {
                'total_sessions': len(self.sessions),
                'active_sessions': active_sessions,
                'registered_flows': len(self.flows),
                'registered_agents': len(self.agents),
                'flow_types': list(set(f.flow_type.value for f in self.flows.values())),
                'conversation_states': list(ConversationState.__members__.keys())
            }
            
        except Exception as e:
            logger.error(f"Error getting conversation stats: {e}")
            return {'error': str(e)}
