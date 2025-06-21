"""
Memory System Configuration
Production-ready configuration for MEM0AI, VANNA, and RASA integration
"""
import os
from typing import Dict, Any

class MemoryConfig:
    """Configuration for the Metatron Memory System"""

    def __init__(self):
        # API Configuration
        self.API_HOST = os.getenv('MEMORY_API_HOST', '0.0.0.0')
        self.API_PORT = int(os.getenv('MEMORY_API_PORT', 5006))
        self.DEBUG = os.getenv('MEMORY_DEBUG', 'True').lower() == 'true'

        # LLM Configuration (Gemini 2.0 Flash) - Updated for MEM0AI compatibility
        self.LLM_CONFIG = {
            'provider': 'google',
            'model': 'gemini-2.0-flash-exp',
            'api_key': os.getenv('GOOGLE_GEMINI_API_KEY', ''),
            'temperature': 0.1,
            'max_tokens': 4096,
            'embedding_model': 'models/text-embedding-004'
        }
        
        # Vector Store Configuration (ChromaDB) - Updated for MEM0AI
        self.VECTOR_STORE_CONFIG = {
            'provider': 'chroma',
            'path': './backend/memory/data/chromadb',
            'collection_name': 'metatron_memories',
            'embedding_model': 'models/text-embedding-004',
            'distance_metric': 'cosine'
        }

        # MEM0AI Specific Configuration
        self.MEM0_CONFIG = {
            'vector_store': {
                'provider': 'chroma',
                'config': {
                    'path': './backend/memory/data/chromadb',
                    'collection_name': 'metatron_memories'
                }
            },
            'llm': {
                'provider': 'google',
                'config': {
                    'model': 'gemini-2.0-flash-exp',
                    'api_key': os.getenv('GOOGLE_GEMINI_API_KEY', ''),
                    'temperature': 0.1
                }
            },
            'embedder': {
                'provider': 'google',
                'config': {
                    'model': 'models/text-embedding-004',
                    'api_key': os.getenv('GOOGLE_GEMINI_API_KEY', '')
                }
            }
        }
        
        # Memory Types Configuration - Updated for MEM0AI compatibility
        self.MEMORY_TYPES = {
            'session': {  # MEM0AI session memory -> Short-term
                'retention_days': 7,
                'brain_region': 'FRONTAL_LOBE',
                'max_items': 100,
                'mem0_type': 'session'
            },
            'episodic': {  # MEM0AI episodic memory -> Long-term
                'retention_days': 365,
                'brain_region': 'TEMPORAL_LOBE',
                'max_items': 1000,
                'mem0_type': 'episodic'
            },
            'working': {  # Working memory
                'retention_days': 1,
                'brain_region': 'PARIETAL_LOBE',
                'max_items': 50,
                'mem0_type': 'working'
            },
            'user': {  # MEM0AI user memory -> Personal
                'retention_days': -1,  # Permanent
                'brain_region': 'OCCIPITAL_LOBE',
                'max_items': 500,
                'mem0_type': 'user'
            },
            'agent': {  # MEM0AI agent memory -> System
                'retention_days': 30,
                'brain_region': 'CEREBELLUM',
                'max_items': 200,
                'mem0_type': 'agent'
            }
        }
        
        # Brain Region Mapping
        self.BRAIN_REGIONS = {
            'frontal_lobe': {
                'name': 'Short-term Memory',
                'color': '#FF6B6B',
                'description': 'Immediate tasks and processing'
            },
            'temporal_lobe': {
                'name': 'Long-term Memory', 
                'color': '#4ECDC4',
                'description': 'Extended information storage'
            },
            'parietal_lobe': {
                'name': 'Working Memory',
                'color': '#45B7D1',
                'description': 'Active information processing'
            },
            'occipital_lobe': {
                'name': 'Personal Memory',
                'color': '#F7B801',
                'description': 'Personal experiences and events'
            },
            'cerebellum': {
                'name': 'Central Storage',
                'color': '#9A61B2',
                'description': 'System and learned patterns'
            }
        }
        
        # Learning Configuration (Vanna-inspired)
        self.LEARNING_CONFIG = {
            'enable_learning': True,
            'min_success_rate': 0.8,
            'pattern_threshold': 3,  # Minimum occurrences to form pattern
            'learning_domains': [
                'tool_usage',
                'workflow_patterns', 
                'creative_preferences',
                'conversation_flows'
            ]
        }
        
        # Conversation Configuration (Rasa-inspired)
        self.CONVERSATION_CONFIG = {
            'max_context_turns': 10,
            'context_window_minutes': 30,
            'enable_agent_handoffs': True,
            'conversation_memory_retention': 7  # days
        }

    def get_config(self) -> Dict[str, Any]:
        """Get complete configuration dictionary"""
        return {
            'api': {
                'host': self.API_HOST,
                'port': self.API_PORT,
                'debug': self.DEBUG
            },
            'llm': self.LLM_CONFIG,
            'vector_store': self.VECTOR_STORE_CONFIG,
            'memory_types': self.MEMORY_TYPES,
            'brain_regions': self.BRAIN_REGIONS,
            'learning': self.LEARNING_CONFIG,
            'conversation': self.CONVERSATION_CONFIG
        }

# Global config instance
config = MemoryConfig()
