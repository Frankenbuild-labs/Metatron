"""
Agent-to-Agent (A2A) Protocol Implementation for Metatron
Based on Google's A2A standard for agent interoperability
Enables standardized communication between AI agents
"""

import json
import uuid
import logging
import asyncio
import aiohttp
from datetime import datetime
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, asdict
from enum import Enum

logger = logging.getLogger(__name__)

class AgentState(Enum):
    """A2A Agent states"""
    IDLE = "idle"
    WORKING = "working"
    INPUT_REQUIRED = "input-required"
    COMPLETED = "completed"
    ERROR = "error"
    UNAVAILABLE = "unavailable"

class MessageType(Enum):
    """A2A Message types"""
    TEXT = "text"
    JSON = "application/json"
    MULTIPART = "multipart/form-data"

@dataclass
class AgentCard:
    """A2A Agent Card - describes agent capabilities"""
    name: str
    description: str
    url: str
    version: str
    capabilities: Dict[str, Any]
    default_input_modes: List[str]
    default_output_modes: List[str]
    skills: List[Dict[str, Any]]
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class AgentMessage:
    """A2A Message structure"""
    role: str  # 'user', 'agent', 'system'
    parts: List[Dict[str, Any]]
    timestamp: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class AgentStatus:
    """A2A Agent Status"""
    state: AgentState
    message: AgentMessage
    timestamp: str
    final: bool = False
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class TaskRequest:
    """A2A Task Request"""
    id: str
    message: AgentMessage
    context: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class TaskResponse:
    """A2A Task Response"""
    id: str
    status: AgentStatus
    context: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

class A2AProtocol:
    """
    Agent-to-Agent Protocol implementation
    Provides standardized communication between AI agents
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.registered_agents: Dict[str, AgentCard] = {}
        self.active_tasks: Dict[str, Dict[str, Any]] = {}
        self.session = None
        
        # Configuration
        self.timeout = config.get('timeout', 30)
        self.max_retries = config.get('max_retries', 3)
        self.agent_registry_url = config.get('agent_registry_url')
        
        logger.info("✅ A2A Protocol initialized")
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    async def discover_agent(self, agent_url: str) -> Optional[AgentCard]:
        """
        Discover an agent by querying its endpoint
        
        Args:
            agent_url: URL of the agent to discover
            
        Returns:
            AgentCard if successful, None otherwise
        """
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            # Query agent root endpoint
            async with self.session.get(f"{agent_url}/", timeout=self.timeout) as response:
                if response.status == 200:
                    data = await response.json()
                    agent_card_url = data.get('agent_card_url', f"{agent_url}/agent-card")
                else:
                    agent_card_url = f"{agent_url}/agent-card"
            
            # Get agent card
            async with self.session.get(agent_card_url, timeout=self.timeout) as response:
                if response.status == 200:
                    card_data = await response.json()
                    
                    agent_card = AgentCard(
                        name=card_data.get('name', 'Unknown Agent'),
                        description=card_data.get('description', ''),
                        url=agent_url,
                        version=card_data.get('version', '1.0.0'),
                        capabilities=card_data.get('capabilities', {}),
                        default_input_modes=card_data.get('defaultInputModes', ['text']),
                        default_output_modes=card_data.get('defaultOutputModes', ['text']),
                        skills=card_data.get('skills', []),
                        metadata=card_data.get('metadata', {})
                    )
                    
                    logger.info(f"✅ Discovered agent: {agent_card.name}")
                    return agent_card
                else:
                    logger.error(f"Failed to get agent card from {agent_card_url}: {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error discovering agent at {agent_url}: {e}")
            return None
    
    async def register_agent(self, agent_url: str) -> bool:
        """
        Register an agent for use
        
        Args:
            agent_url: URL of the agent to register
            
        Returns:
            Success status
        """
        try:
            agent_card = await self.discover_agent(agent_url)
            if agent_card:
                agent_id = self._generate_agent_id(agent_card.name, agent_url)
                self.registered_agents[agent_id] = agent_card
                logger.info(f"✅ Registered agent: {agent_id} ({agent_card.name})")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Error registering agent: {e}")
            return False
    
    async def send_task(self, agent_id: str, message: str, 
                       context: Optional[Dict[str, Any]] = None) -> Optional[TaskResponse]:
        """
        Send a task to an agent
        
        Args:
            agent_id: ID of the registered agent
            message: Message to send
            context: Optional context data
            
        Returns:
            TaskResponse if successful, None otherwise
        """
        try:
            if agent_id not in self.registered_agents:
                logger.error(f"Agent {agent_id} not registered")
                return None
            
            agent_card = self.registered_agents[agent_id]
            task_id = str(uuid.uuid4())
            
            # Create task request
            agent_message = AgentMessage(
                role="user",
                parts=[{"type": "text", "text": message}],
                timestamp=datetime.now().isoformat()
            )
            
            task_request = TaskRequest(
                id=task_id,
                message=agent_message,
                context=context or {},
                metadata={"source": "metatron", "timestamp": datetime.now().isoformat()}
            )
            
            # Send task to agent
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            task_url = f"{agent_card.url}/a2a/tasks/send"
            request_data = {
                "jsonrpc": "2.0",
                "id": task_id,
                "method": "send_task",
                "params": asdict(task_request)
            }
            
            async with self.session.post(
                task_url,
                json=request_data,
                timeout=self.timeout
            ) as response:
                if response.status == 200:
                    response_data = await response.json()
                    
                    if 'result' in response_data:
                        result = response_data['result']
                        
                        # Parse agent status
                        status_data = result.get('status', {})
                        agent_status = AgentStatus(
                            state=AgentState(status_data.get('state', 'working')),
                            message=AgentMessage(
                                role=status_data.get('message', {}).get('role', 'agent'),
                                parts=status_data.get('message', {}).get('parts', []),
                                timestamp=status_data.get('timestamp', datetime.now().isoformat())
                            ),
                            timestamp=status_data.get('timestamp', datetime.now().isoformat()),
                            final=status_data.get('final', False)
                        )
                        
                        task_response = TaskResponse(
                            id=result.get('id', task_id),
                            status=agent_status,
                            context=result.get('context', {}),
                            metadata=result.get('metadata', {})
                        )
                        
                        # Store active task
                        self.active_tasks[task_id] = {
                            'agent_id': agent_id,
                            'request': task_request,
                            'response': task_response,
                            'created_at': datetime.now().isoformat()
                        }
                        
                        logger.info(f"✅ Sent task to agent {agent_id}: {task_id}")
                        return task_response
                    else:
                        logger.error(f"Invalid response from agent: {response_data}")
                        return None
                else:
                    logger.error(f"Failed to send task to agent: {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error sending task to agent: {e}")
            return None
    
    async def continue_task(self, task_id: str, message: str) -> Optional[TaskResponse]:
        """
        Continue an existing task with additional input
        
        Args:
            task_id: ID of the existing task
            message: Additional message/input
            
        Returns:
            Updated TaskResponse if successful, None otherwise
        """
        try:
            if task_id not in self.active_tasks:
                logger.error(f"Task {task_id} not found")
                return None
            
            task_info = self.active_tasks[task_id]
            agent_id = task_info['agent_id']
            agent_card = self.registered_agents[agent_id]
            
            # Create continuation message
            agent_message = AgentMessage(
                role="user",
                parts=[{"type": "text", "text": message}],
                timestamp=datetime.now().isoformat()
            )
            
            # Send continuation to agent
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            continue_url = f"{agent_card.url}/a2a/tasks/{task_id}/continue"
            request_data = {
                "jsonrpc": "2.0",
                "id": str(uuid.uuid4()),
                "method": "continue_task",
                "params": {
                    "task_id": task_id,
                    "message": asdict(agent_message)
                }
            }
            
            async with self.session.post(
                continue_url,
                json=request_data,
                timeout=self.timeout
            ) as response:
                if response.status == 200:
                    response_data = await response.json()
                    
                    if 'result' in response_data:
                        result = response_data['result']
                        
                        # Parse updated status
                        status_data = result.get('status', {})
                        agent_status = AgentStatus(
                            state=AgentState(status_data.get('state', 'working')),
                            message=AgentMessage(
                                role=status_data.get('message', {}).get('role', 'agent'),
                                parts=status_data.get('message', {}).get('parts', []),
                                timestamp=status_data.get('timestamp', datetime.now().isoformat())
                            ),
                            timestamp=status_data.get('timestamp', datetime.now().isoformat()),
                            final=status_data.get('final', False)
                        )
                        
                        task_response = TaskResponse(
                            id=result.get('id', task_id),
                            status=agent_status,
                            context=result.get('context', {}),
                            metadata=result.get('metadata', {})
                        )
                        
                        # Update active task
                        task_info['response'] = task_response
                        task_info['updated_at'] = datetime.now().isoformat()
                        
                        logger.info(f"✅ Continued task {task_id}")
                        return task_response
                    else:
                        logger.error(f"Invalid continuation response: {response_data}")
                        return None
                else:
                    logger.error(f"Failed to continue task: {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error continuing task: {e}")
            return None
    
    async def get_task_status(self, task_id: str) -> Optional[TaskResponse]:
        """
        Get the current status of a task
        
        Args:
            task_id: ID of the task
            
        Returns:
            Current TaskResponse if found, None otherwise
        """
        try:
            if task_id in self.active_tasks:
                return self.active_tasks[task_id]['response']
            return None
            
        except Exception as e:
            logger.error(f"Error getting task status: {e}")
            return None
    
    def list_registered_agents(self) -> List[Dict[str, Any]]:
        """
        List all registered agents
        
        Returns:
            List of agent information
        """
        try:
            agents = []
            for agent_id, agent_card in self.registered_agents.items():
                agent_info = {
                    'agent_id': agent_id,
                    'name': agent_card.name,
                    'description': agent_card.description,
                    'url': agent_card.url,
                    'version': agent_card.version,
                    'skills': agent_card.skills,
                    'capabilities': agent_card.capabilities,
                    'input_modes': agent_card.default_input_modes,
                    'output_modes': agent_card.default_output_modes
                }
                agents.append(agent_info)
            
            return agents
            
        except Exception as e:
            logger.error(f"Error listing registered agents: {e}")
            return []
    
    def list_active_tasks(self) -> List[Dict[str, Any]]:
        """
        List all active tasks
        
        Returns:
            List of active task information
        """
        try:
            tasks = []
            for task_id, task_info in self.active_tasks.items():
                task_summary = {
                    'task_id': task_id,
                    'agent_id': task_info['agent_id'],
                    'agent_name': self.registered_agents[task_info['agent_id']].name,
                    'state': task_info['response'].status.state.value,
                    'created_at': task_info['created_at'],
                    'updated_at': task_info.get('updated_at', task_info['created_at'])
                }
                tasks.append(task_summary)
            
            return tasks
            
        except Exception as e:
            logger.error(f"Error listing active tasks: {e}")
            return []
    
    def _generate_agent_id(self, agent_name: str, agent_url: str) -> str:
        """Generate a unique agent ID"""
        # Simple ID generation based on name and URL
        import hashlib
        combined = f"{agent_name}_{agent_url}"
        return hashlib.md5(combined.encode()).hexdigest()[:8]
    
    def get_protocol_stats(self) -> Dict[str, Any]:
        """Get A2A protocol statistics"""
        try:
            active_task_states = {}
            for task_info in self.active_tasks.values():
                state = task_info['response'].status.state.value
                active_task_states[state] = active_task_states.get(state, 0) + 1
            
            return {
                'registered_agents': len(self.registered_agents),
                'active_tasks': len(self.active_tasks),
                'task_states': active_task_states,
                'protocol_version': '1.0.0',
                'supported_message_types': [t.value for t in MessageType],
                'supported_agent_states': [s.value for s in AgentState]
            }
            
        except Exception as e:
            logger.error(f"Error getting protocol stats: {e}")
            return {'error': str(e)}
