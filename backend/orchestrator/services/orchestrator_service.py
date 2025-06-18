"""
Metatron Orchestrator Service
Core service implementing PraisonAI agent orchestration with Agentic Worker Pattern
"""

import os
import logging
from typing import Dict, Any, List
from datetime import datetime

# PraisonAI imports
try:
    from praisonaiagents import Agent, Task
    PRAISONAI_AVAILABLE = True
except ImportError as e:
    logging.warning(f"PraisonAI not available: {e}")
    PRAISONAI_AVAILABLE = False

# Configure logging
logger = logging.getLogger(__name__)


class MetatronOrchestratorService:
    """
    Main orchestrator service using PraisonAI Agentic Orchestrator Worker pattern
    """
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize the orchestrator service"""
        self.config = config
        self.orchestrator_agent = None
        self.tools = []
        self.current_workspace = "orchestrator"
        self.conversation_history = []
        
        # Initialize the service
        self._initialize_service()
    
    def _initialize_service(self):
        """Initialize the PraisonAI orchestrator with Agentic Worker Pattern"""
        try:
            if not PRAISONAI_AVAILABLE:
                logger.warning("PraisonAI not available - using fallback mode")
                return
            
            # Set up API keys for PraisonAI
            os.environ['GOOGLE_API_KEY'] = self.config['api_keys']['gemini']
            # PraisonAI requires OPENAI_API_KEY even when using other models
            os.environ['OPENAI_API_KEY'] = 'not-needed-using-gemini'
            
            # Initialize tools first
            self._initialize_tools()
            
            # Create the main orchestrator agent with Agentic Worker Pattern
            self.orchestrator_agent = Agent(
                name="MetatronOrchestrator",
                role="Personal AI Assistant & Platform Coordinator",
                goal="""You are the central intelligence of the Metatron platform. Your goals are:
                
                1. 🎯 **Intelligent Task Routing**: Analyze user requests and route them to the most appropriate tools
                2. 🔄 **Seamless Coordination**: Orchestrate multiple platform features working together
                3. 🧠 **Context Awareness**: Maintain conversation context and user preferences
                4. 🎨 **Creative Assistance**: Help users with image generation and creative projects
                5. 📹 **Meeting Management**: Coordinate video meetings and AI agent participation
                6. 🔍 **Research Support**: Provide intelligent information gathering and analysis
                7. 🤝 **Personalized Experience**: Adapt responses based on user needs and history
                """,
                backstory="""You are an advanced AI orchestrator that serves as the central coordinator 
                for the Metatron platform. You have access to powerful tools for creative work, 
                video collaboration, and research. 
                
                You understand that users come to you for intelligent assistance that goes beyond 
                simple chat - they want a true AI partner that can help them accomplish complex tasks 
                by coordinating multiple platform features seamlessly.
                
                You are knowledgeable, helpful, and proactive. You anticipate user needs, suggest 
                relevant features, and always look for ways to make the user's experience better.
                
                When users ask for creative work, you leverage the Creative Studio. For collaboration 
                and meetings, you use the Video Meeting tools. For information and research, you 
                employ your research capabilities. You seamlessly combine these tools to provide 
                comprehensive solutions.
                
                You maintain a professional yet friendly tone, and you're always ready to help 
                users achieve their goals efficiently and effectively.""",
                tools=self.tools,
                llm=self.config['praisonai']['model'],
                memory=self.config['praisonai']['memory'],
                verbose=self.config['praisonai']['verbose'],
                allow_delegation=True,
                max_iter=3,
                max_execution_time=30
            )
            
            logger.info("✅ Metatron Orchestrator Agent initialized successfully with Agentic Worker Pattern")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize orchestrator: {str(e)}")
            self.orchestrator_agent = None
    
    def _initialize_tools(self):
        """Initialize available tools for the orchestrator"""
        self.tools = []

        try:
            # Import and initialize Creative Studio tool
            from tools.creative_studio_tool import CreativeStudioTool

            creative_studio_tool = CreativeStudioTool(
                segmind_api_url=self.config['services']['segmind_url']
            )

            # Always add Creative Studio tool (it has fallback responses)
            self.tools.append(creative_studio_tool)

            # Check if Creative Studio service is available
            if creative_studio_tool.check_service_health():
                logger.info("✅ Creative Studio tool initialized and service is healthy")
            else:
                logger.info("✅ Creative Studio tool initialized with fallback mode (service will be replaced)")

        except ImportError as e:
            logger.warning(f"⚠️ Could not import Creative Studio tool: {e}")
        except Exception as e:
            logger.error(f"❌ Error initializing Creative Studio tool: {e}")

        # TODO: Add Video Meeting and Research tools in subsequent tasks

        logger.info(f"🔧 Tools initialized: {len(self.tools)} tools available")
    
    def process_message(self, message: str, context: Dict[str, Any] = None, workspace: str = "orchestrator") -> Dict[str, Any]:
        """Process a user message through the orchestrator using Agentic Worker Pattern"""
        try:
            # Update workspace if different
            if workspace != self.current_workspace:
                self.current_workspace = workspace
                logger.info(f"🔄 Switched to workspace: {workspace}")
            
            # Add to conversation history
            self.conversation_history.append({
                'timestamp': datetime.now().isoformat(),
                'type': 'user',
                'message': message,
                'context': context or {},
                'workspace': workspace
            })
            
            # Process through orchestrator if available
            if self.orchestrator_agent and PRAISONAI_AVAILABLE:
                response = self._process_with_orchestrator(message, context)
            else:
                response = self._process_fallback(message, context)
            
            # Add response to conversation history
            self.conversation_history.append({
                'timestamp': datetime.now().isoformat(),
                'type': 'assistant',
                'message': response,
                'workspace': workspace
            })
            
            return {
                'success': True,
                'response': response,
                'context': {
                    'workspace': workspace,
                    'tools_available': self.get_available_tools(),
                    'conversation_length': len(self.conversation_history),
                    'agent_status': 'active' if self.orchestrator_agent else 'fallback'
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Error processing message: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'response': "I apologize, but I encountered an error processing your request. Please try again."
            }
    
    def _process_with_orchestrator(self, message: str, context: Dict[str, Any]) -> str:
        """Process message using PraisonAI orchestrator with Agentic Worker Pattern"""
        try:
            # Check if this is a creative request that should use the Creative Studio tool
            message_lower = message.lower()
            is_creative_request = any(word in message_lower for word in [
                'generate', 'create', 'image', 'picture', 'art', 'artwork', 'design',
                'draw', 'paint', 'illustration', 'photo', 'visual', 'graphic'
            ])

            # If it's a creative request and we have the Creative Studio tool, use it directly
            if is_creative_request and self.tools:
                creative_tool = next((tool for tool in self.tools if tool.__class__.__name__ == 'CreativeStudioTool'), None)
                if creative_tool:
                    # Extract creative parameters from the message
                    creative_params = self._extract_creative_parameters(message)

                    # Use the Creative Studio tool directly
                    tool_result = creative_tool._run("generate", **creative_params)

                    # Enhance the tool result with orchestrator intelligence
                    return f"""🎨 **Creative Studio Coordination**

{tool_result}

**Orchestrator Notes:**
I've coordinated your creative request through the Creative Studio tool. The image generation process has been optimized based on your request: "{message}"

**What's Next:**
- Your image will appear in the Creative Studio interface
- You can generate variations or enhancements
- Try different models or styles for varied results
- Ask me for help with specific creative techniques or styles!"""

            # For non-creative requests or when tools aren't available, use the standard orchestrator
            task_description = f"""
            **User Request**: {message}

            **Context**: {context or 'No additional context provided'}

            **Available Tools**: {[tool.__class__.__name__ for tool in self.tools] if self.tools else 'None currently active'}

            **Instructions**:
            As the Metatron platform orchestrator, analyze this request and provide a comprehensive,
            helpful response. Use your available tools as needed:

            - For creative requests (images, art, design): Coordinate with Creative Studio capabilities
            - For video meetings or collaboration: Manage Video Meeting features
            - For research or information needs: Utilize Research capabilities
            - For general assistance: Provide intelligent guidance and suggestions

            Always be helpful, professional, and engaging. Anticipate follow-up needs and suggest
            relevant platform features when appropriate.
            """
            
            # Create and execute task
            task = Task(
                description=task_description,
                agent=self.orchestrator_agent,
                expected_output="A comprehensive, helpful, and contextually appropriate response to the user's request"
            )
            
            # Execute the task
            result = task.execute()
            
            # Extract response from result
            if result and hasattr(result, 'raw'):
                response = result.raw
            elif isinstance(result, str):
                response = result
            else:
                response = "I've processed your request successfully. How else can I help you?"
            
            logger.info(f"✅ Orchestrator processed message successfully")
            return response
                
        except Exception as e:
            logger.error(f"❌ Orchestrator processing failed: {str(e)}")
            return self._process_fallback(message, context)

    def _extract_creative_parameters(self, message: str) -> Dict[str, Any]:
        """Extract creative parameters from user message using intelligent parsing"""
        params = {'prompt': message}
        message_lower = message.lower()

        # Extract style preferences
        style_keywords = {
            'photorealistic': ['realistic', 'photo', 'photography', 'real'],
            'artistic': ['artistic', 'art', 'painting', 'masterpiece'],
            'anime': ['anime', 'manga', 'japanese'],
            'cartoon': ['cartoon', 'animated', 'disney'],
            'abstract': ['abstract', 'modern'],
            'cinematic': ['cinematic', 'movie', 'film'],
            'fantasy': ['fantasy', 'magical', 'mystical'],
            'scifi': ['sci-fi', 'futuristic', 'cyberpunk', 'robot'],
            'vintage': ['vintage', 'retro', 'old'],
            'minimalist': ['minimalist', 'simple', 'clean']
        }

        for style, keywords in style_keywords.items():
            if any(keyword in message_lower for keyword in keywords):
                params['style'] = style
                break

        # Extract model preferences
        model_keywords = {
            'sdxl': ['high quality', 'detailed', 'professional'],
            'realistic_vision': ['portrait', 'person', 'face', 'human'],
            'dreamshaper': ['fantasy', 'dream', 'magical'],
            'cartoon': ['cartoon', 'animated'],
            'anime': ['anime', 'manga']
        }

        for model, keywords in model_keywords.items():
            if any(keyword in message_lower for keyword in keywords):
                params['model'] = model
                break

        # Extract size preferences
        if any(word in message_lower for word in ['large', 'big', 'high resolution']):
            params['width'] = 1024
            params['height'] = 1024
        elif any(word in message_lower for word in ['square']):
            params['width'] = 512
            params['height'] = 512
        elif any(word in message_lower for word in ['wide', 'landscape']):
            params['width'] = 768
            params['height'] = 512
        elif any(word in message_lower for word in ['tall', 'portrait']):
            params['width'] = 512
            params['height'] = 768

        # Clean up the prompt by removing style and size indicators
        clean_prompt = message
        for style_words in style_keywords.values():
            for word in style_words:
                clean_prompt = clean_prompt.replace(word, '').strip()

        # Remove size indicators
        size_words = ['large', 'big', 'high resolution', 'square', 'wide', 'landscape', 'tall', 'portrait']
        for word in size_words:
            clean_prompt = clean_prompt.replace(word, '').strip()

        # Clean up extra spaces and commas
        clean_prompt = ' '.join(clean_prompt.split())
        clean_prompt = clean_prompt.replace(' ,', ',').replace(',,', ',')

        params['prompt'] = clean_prompt if clean_prompt else message

        return params
    
    def _process_fallback(self, message: str, context: Dict[str, Any]) -> str:
        """Enhanced fallback processing with intelligent routing"""
        logger.info("🔄 Using enhanced fallback processing")
        
        message_lower = message.lower()
        
        # Creative Studio responses
        if any(word in message_lower for word in ['image', 'picture', 'generate', 'create', 'art', 'creative', 'draw', 'design', 'artwork']):
            return """🎨 **Creative Studio Ready!**

I can help you create amazing images and artwork! The Creative Studio feature uses advanced AI to generate:

• **Custom Images** from your text descriptions
• **Artistic Creations** in various styles  
• **Design Elements** for your projects
• **Visual Content** for any purpose

You can access the Creative Studio through the interface, or just tell me what you'd like to create and I'll help coordinate the generation process!"""
        
        # Video Meeting responses
        elif any(word in message_lower for word in ['video', 'meeting', 'call', 'conference', 'zoom', 'teams', 'collaborate']):
            return """📹 **Video Meeting Coordination**

I can help you manage video meetings and collaboration! Here's what I can coordinate:

• **Start New Meetings** with custom settings
• **AI Agent Integration** for enhanced collaboration
• **Meeting Management** and participant coordination
• **Smart Assistance** during calls

The Video Meeting feature includes advanced AI agent support that can join your meetings to provide real-time assistance. Would you like me to help set up a meeting?"""
        
        # Research responses
        elif any(word in message_lower for word in ['search', 'research', 'find', 'information', 'what is', 'how to', 'tell me about', 'explain']):
            return """🔍 **Research & Information Services**

I can help you research and find information on any topic! My research capabilities include:

• **Internet Search** for current information
• **Fact Checking** and source verification
• **Detailed Analysis** of complex topics
• **Information Synthesis** from multiple sources

Just tell me what you'd like to research, and I'll help you find accurate, up-to-date information with proper sources!"""
        
        # General greetings
        elif any(word in message_lower for word in ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'greetings']):
            return """👋 **Welcome to Metatron!**

Hello! I'm your intelligent AI assistant and platform coordinator. I'm here to help you with:

🎨 **Creative Projects** - Generate images and artwork
📹 **Video Meetings** - Manage calls with AI agent support  
🔍 **Research** - Find information and analyze topics
🤖 **Platform Coordination** - Seamlessly integrate all features

What would you like to work on today? I'm ready to help you accomplish your goals!"""
        
        # Help requests
        elif any(word in message_lower for word in ['help', 'what can you do', 'capabilities', 'features', 'assist']):
            return """🚀 **Metatron Platform Capabilities**

I'm your intelligent platform coordinator with access to powerful features:

🎨 **Creative Studio**
   • AI image generation from text
   • Multiple artistic styles and models
   • Custom artwork creation

📹 **Video Meetings**  
   • Smart meeting management
   • AI agent participation
   • Enhanced collaboration tools

🔍 **Research & Analysis**
   • Internet search capabilities
   • Information verification
   • Detailed topic analysis

🤖 **Intelligent Coordination**
   • Multi-feature integration
   • Context-aware assistance
   • Personalized recommendations

Just tell me what you need, and I'll coordinate the right tools and features to help you succeed!"""
        
        # Default intelligent response
        else:
            return f"""🤔 **Understanding Your Request**

I see you're asking about: "{message}"

As your Metatron AI coordinator, I can help you with various tasks. Based on your request, I can:

• **Clarify your needs** and suggest the best approach
• **Coordinate platform features** to accomplish your goals  
• **Provide intelligent assistance** across all capabilities

Could you tell me more specifically what you'd like to accomplish? I'm here to help with creative projects, video meetings, research, or any combination of platform features!"""
    
    def get_available_tools(self) -> List[str]:
        """Get list of available tool names"""
        if self.tools:
            return [tool.__class__.__name__ for tool in self.tools]
        elif self.orchestrator_agent and hasattr(self.orchestrator_agent, 'tools'):
            return [tool.__class__.__name__ for tool in self.orchestrator_agent.tools]
        return ['CreativeStudioTool (pending)', 'VideoMeetingTool (pending)', 'ResearchTool (pending)']
    
    def get_conversation_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent conversation history"""
        return self.conversation_history[-limit:] if limit > 0 else self.conversation_history
    
    def clear_conversation_history(self):
        """Clear conversation history"""
        self.conversation_history = []
        logger.info("🗑️ Conversation history cleared")
    
    def switch_workspace(self, workspace_type: str) -> bool:
        """Switch to a different workspace (future feature)"""
        try:
            self.current_workspace = workspace_type
            logger.info(f"🔄 Switched to workspace: {workspace_type}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to switch workspace: {str(e)}")
            return False
    
    def get_agent_status(self) -> Dict[str, Any]:
        """Get detailed agent status information"""
        return {
            'agent_initialized': self.orchestrator_agent is not None,
            'praisonai_available': PRAISONAI_AVAILABLE,
            'tools_count': len(self.tools),
            'conversation_length': len(self.conversation_history),
            'current_workspace': self.current_workspace,
            'model': self.config['praisonai']['model'],
            'memory_enabled': self.config['praisonai']['memory'],
            'verbose_mode': self.config['praisonai']['verbose']
        }
