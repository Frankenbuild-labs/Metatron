"""
Composio Integration Module for Metatron Orchestrator
Provides 300+ external tool integrations through Composio
"""

import os
import logging
from typing import Dict, List, Any, Optional

# Set required environment variables for PraisonAI
os.environ['OPENAI_API_KEY'] = 'not-needed-using-gemini'

from composio_praisonai import ComposioToolSet, Action
from praisonaiagents import Agent, Task, Crew

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ComposioIntegration:
    """
    Composio integration for Metatron platform
    Provides access to 300+ external tools and services
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Composio integration
        
        Args:
            api_key: Composio API key (optional, can be set via environment)
        """
        self.api_key = api_key or os.getenv('COMPOSIO_API_KEY')
        self.toolset = ComposioToolSet()
        self.available_tools = {}
        self.initialized_tools = {}
        
        # Initialize core tools
        self._initialize_core_tools()
        
        logger.info("🔧 Composio integration initialized")
    
    def _initialize_core_tools(self):
        """Initialize commonly used tools"""
        try:
            # Core productivity tools
            core_actions = [
                # GitHub actions
                Action.GITHUB_CREATE_ISSUE,
                Action.GITHUB_GET_REPO,
                Action.GITHUB_CREATE_PULL_REQUEST,
                
                # Gmail actions
                Action.GMAIL_SEND_EMAIL,
                Action.GMAIL_READ_EMAIL,
                
                # Slack actions
                Action.SLACK_SEND_MESSAGE,
                Action.SLACK_CREATE_CHANNEL,
                
                # Google Calendar
                Action.GOOGLECALENDAR_CREATE_EVENT,
                Action.GOOGLECALENDAR_LIST_EVENTS,
                
                # File operations
                Action.FILETOOL_READ_FILE,
                Action.FILETOOL_WRITE_FILE,
                
                # Web scraping
                Action.WEBTOOL_SCRAPE_WEBSITE,
                Action.WEBTOOL_SEARCH_WEB,
            ]
            
            # Get tools for core actions
            self.available_tools['core'] = self.toolset.get_tools(actions=core_actions)
            logger.info(f"✅ Initialized {len(self.available_tools['core'])} core tools")
            
        except Exception as e:
            logger.warning(f"⚠️ Could not initialize some core tools: {e}")
            # Initialize with basic tools if specific actions fail
            self.available_tools['core'] = self.toolset.get_tools()
    
    def get_available_tools(self, category: str = 'core') -> List[Any]:
        """
        Get available tools for a specific category
        
        Args:
            category: Tool category ('core', 'github', 'gmail', etc.)
            
        Returns:
            List of available tools
        """
        return self.available_tools.get(category, [])
    
    def add_tool_category(self, category: str, actions: List[Action]) -> bool:
        """
        Add a new tool category with specific actions
        
        Args:
            category: Category name
            actions: List of Composio actions
            
        Returns:
            Success status
        """
        try:
            tools = self.toolset.get_tools(actions=actions)
            self.available_tools[category] = tools
            logger.info(f"✅ Added {len(tools)} tools for category: {category}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to add tools for {category}: {e}")
            return False
    
    def create_agent_with_tools(self, 
                               role: str, 
                               goal: str, 
                               backstory: str,
                               tool_categories: List[str] = None) -> Agent:
        """
        Create a PraisonAI agent with Composio tools
        
        Args:
            role: Agent role
            goal: Agent goal
            backstory: Agent backstory
            tool_categories: List of tool categories to include
            
        Returns:
            Configured PraisonAI agent
        """
        # Collect tools from specified categories
        tools = []
        categories = tool_categories or ['core']
        
        for category in categories:
            if category in self.available_tools:
                tools.extend(self.available_tools[category])
        
        # Create agent with tools
        agent = Agent(
            role=role,
            goal=goal,
            backstory=backstory,
            tools=tools,
            verbose=True,
            allow_delegation=False
        )
        
        logger.info(f"🤖 Created agent '{role}' with {len(tools)} tools")
        return agent
    
    def execute_workflow(self, workflow_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a workflow using Composio tools
        
        Args:
            workflow_config: Workflow configuration from Agent Flow
            
        Returns:
            Execution result
        """
        try:
            # Parse workflow configuration
            nodes = workflow_config.get('nodes', [])
            connections = workflow_config.get('connections', [])
            
            # Create agents and tasks based on workflow
            agents = []
            tasks = []
            
            for node in nodes:
                node_type = node.get('type')
                node_data = node.get('data', {})
                
                if node_type == 'agent':
                    # Create agent with specified tools
                    tool_categories = node_data.get('tool_categories', ['core'])
                    agent = self.create_agent_with_tools(
                        role=node_data.get('role', 'Assistant'),
                        goal=node_data.get('goal', 'Help with tasks'),
                        backstory=node_data.get('backstory', 'I am a helpful assistant'),
                        tool_categories=tool_categories
                    )
                    agents.append(agent)
                
                elif node_type == 'task':
                    # Create task
                    task = Task(
                        description=node_data.get('description', 'Complete the task'),
                        expected_output=node_data.get('expected_output', 'Task completed'),
                        agent=agents[-1] if agents else None  # Assign to last created agent
                    )
                    tasks.append(task)
            
            # Execute workflow using PraisonAI Crew
            if agents and tasks:
                crew = Crew(
                    agents=agents,
                    tasks=tasks,
                    verbose=True
                )
                
                result = crew.kickoff()
                
                return {
                    'success': True,
                    'result': str(result),
                    'agents_used': len(agents),
                    'tasks_completed': len(tasks)
                }
            else:
                return {
                    'success': False,
                    'error': 'No valid agents or tasks found in workflow'
                }
                
        except Exception as e:
            logger.error(f"❌ Workflow execution failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_tool_info(self) -> Dict[str, Any]:
        """
        Get information about available tools
        
        Returns:
            Tool information dictionary
        """
        info = {
            'categories': list(self.available_tools.keys()),
            'total_tools': sum(len(tools) for tools in self.available_tools.values()),
            'tool_details': {}
        }
        
        for category, tools in self.available_tools.items():
            info['tool_details'][category] = {
                'count': len(tools),
                'tools': [getattr(tool, 'name', str(tool)) for tool in tools[:5]]  # First 5 tools
            }
        
        return info
    
    def test_connection(self) -> Dict[str, Any]:
        """
        Test Composio connection and tool availability
        
        Returns:
            Connection test results
        """
        try:
            # Test basic toolset functionality
            test_tools = self.toolset.get_tools()
            
            return {
                'success': True,
                'message': 'Composio connection successful',
                'tools_available': len(test_tools),
                'api_key_configured': bool(self.api_key)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Composio connection failed'
            }

# Global instance for use across the application
composio_integration = ComposioIntegration()

def get_composio_tools(categories: List[str] = None) -> List[Any]:
    """
    Convenience function to get Composio tools
    
    Args:
        categories: List of tool categories
        
    Returns:
        List of tools
    """
    categories = categories or ['core']
    tools = []
    
    for category in categories:
        tools.extend(composio_integration.get_available_tools(category))
    
    return tools

def create_composio_agent(role: str, goal: str, backstory: str, tools: List[str] = None) -> Agent:
    """
    Convenience function to create agent with Composio tools
    
    Args:
        role: Agent role
        goal: Agent goal  
        backstory: Agent backstory
        tools: List of tool categories
        
    Returns:
        Configured agent
    """
    return composio_integration.create_agent_with_tools(
        role=role,
        goal=goal,
        backstory=backstory,
        tool_categories=tools or ['core']
    )
