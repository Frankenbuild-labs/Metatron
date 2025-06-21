"""
Metatron Memory Core Adapter
Production-ready adapter using MEM0AI with brain-region mapping
Enhanced for Cerebral UI integration and conversation awareness
"""
import uuid
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

try:
    from mem0 import Memory
    MEM0_AVAILABLE = True
except ImportError:
    MEM0_AVAILABLE = False
    print("⚠️ MEM0AI not available. Install with: pip install mem0ai")

import chromadb
from chromadb.config import Settings
import google.generativeai as genai

class MetatronMemoryCore:
    """
    Production-ready memory core using MEM0AI
    Enhanced with brain region mapping and Cerebral UI integration
    """

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.memory_instance = None
        self.fallback_mode = False

        # Brain region mapping for Cerebral UI
        self.brain_region_mapping = {
            'user': 'OCCIPITAL_LOBE',      # Personal Memory
            'session': 'FRONTAL_LOBE',     # Short-term Memory
            'agent': 'CEREBELLUM',         # Central Storage
            'episodic': 'TEMPORAL_LOBE',   # Long-term Memory
            'working': 'PARIETAL_LOBE'     # Working Memory
        }

        self.cerebral_to_mem0_mapping = {
            'FRONTAL_LOBE': 'session',
            'TEMPORAL_LOBE': 'episodic',
            'PARIETAL_LOBE': 'working',
            'OCCIPITAL_LOBE': 'user',
            'CEREBELLUM': 'agent'
        }

        # Initialize memory system
        self._init_memory_system()

    def _init_memory_system(self):
        """Initialize MEM0AI memory system"""
        if not MEM0_AVAILABLE:
            print("⚠️ MEM0AI not available, using fallback mode")
            self.fallback_mode = True
            self._init_fallback_system()
            return

        try:
            # Configure MEM0AI
            mem0_config = self.config.get('mem0_config', {})
            if not mem0_config:
                # Use default configuration
                mem0_config = {
                    'vector_store': {
                        'provider': 'chroma',
                        'config': {
                            'path': './backend/memory/data/chromadb'
                        }
                    },
                    'llm': {
                        'provider': 'google',
                        'config': {
                            'model': 'gemini-2.0-flash-exp',
                            'api_key': self.config.get('llm', {}).get('api_key', ''),
                            'temperature': 0.1
                        }
                    }
                }

            self.memory_instance = Memory.from_config(mem0_config)
            print("✅ MEM0AI memory system initialized successfully")

        except Exception as e:
            print(f"❌ Failed to initialize MEM0AI: {e}")
            self.fallback_mode = True
            self._init_fallback_system()

    def _init_fallback_system(self):
        """Initialize fallback system when MEM0AI is not available"""
        try:
            # Initialize basic ChromaDB for fallback
            self.chroma_client = chromadb.PersistentClient(
                path=self.config.get('vector_store', {}).get('path', './backend/memory/data/chromadb'),
                settings=Settings(anonymized_telemetry=False)
            )

            self.collection = self.chroma_client.get_or_create_collection(
                name="metatron_memories_fallback",
                metadata={"description": "Metatron Memory System Fallback"}
            )

            # Initialize Gemini for fallback
            api_key = self.config.get('llm', {}).get('api_key', '')
            if api_key:
                genai.configure(api_key=api_key)
                self.llm = genai.GenerativeModel('gemini-2.0-flash-exp')

            print("✅ Fallback memory system initialized")

        except Exception as e:
            print(f"❌ Failed to initialize fallback system: {e}")
            self.memory_instance = None
        
    def _classify_memory_type(self, content: str, metadata: Dict = None) -> str:
        """
        Classify memory into brain regions using LLM
        Enhanced from Mem0's classification approach
        """
        if metadata and 'type' in metadata:
            return metadata['type']
            
        prompt = f"""
        Classify this memory content into one of these categories:
        - short_term: Immediate tasks, current conversation, temporary information
        - long_term: Important facts, learned knowledge, permanent information  
        - working: Active processing, calculations, reasoning steps
        - personal: User preferences, personal experiences, biographical info
        - system: Tool usage, workflow patterns, system behaviors
        
        Content: {content}
        
        Return only the category name.
        """
        
        try:
            response = self.llm.generate_content(prompt)
            memory_type = response.text.strip().lower()
            
            if memory_type in self.memory_types:
                return memory_type
            else:
                return 'system'  # Default fallback
                
        except Exception as e:
            print(f"Error classifying memory: {e}")
            return 'system'
    
    def _generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text using Gemini"""
        try:
            # Use Gemini's embedding capability
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document"
            )
            return result['embedding']
        except Exception as e:
            print(f"Error generating embedding: {e}")
            # Fallback to simple hash-based embedding
            return [float(hash(text) % 1000) / 1000.0] * 768
    
    def add_memory(self, content: str, user_id: str, metadata: Optional[Dict] = None) -> str:
        """
        Add new memory to the system
        Enhanced from Mem0 with brain region classification
        """
        if metadata is None:
            metadata = {}
            
        # Generate unique memory ID
        memory_id = str(uuid.uuid4())
        
        # Classify memory type and brain region
        memory_type = self._classify_memory_type(content, metadata)
        brain_region = self.memory_types[memory_type]['brain_region']
        
        # Generate embedding
        embedding = self._generate_embedding(content)
        
        # Prepare memory document
        memory_doc = {
            'id': memory_id,
            'content': content,
            'user_id': user_id,
            'memory_type': memory_type,
            'brain_region': brain_region,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'access_count': 0,
            'importance_score': metadata.get('importance', 0.5),
            **metadata
        }
        
        # Store in vector database
        self.collection.add(
            ids=[memory_id],
            embeddings=[embedding],
            documents=[content],
            metadatas=[memory_doc]
        )
        
        print(f"Added memory {memory_id} to {brain_region} ({memory_type})")
        return memory_id
    
    def search_memories(self, query: str, user_id: str, 
                       filters: Optional[Dict] = None, limit: int = 5) -> List[Dict]:
        """
        Search memories using semantic similarity
        Enhanced from Mem0 with brain region filtering
        """
        # Generate query embedding
        query_embedding = self._generate_embedding(query)
        
        # Prepare filters
        where_clause = {"user_id": user_id}
        if filters:
            where_clause.update(filters)
        
        # Search in vector store
        results = self.collection.query(
            query_embeddings=[query_embedding],
            where=where_clause,
            n_results=limit,
            include=['documents', 'metadatas', 'distances']
        )
        
        # Format results
        memories = []
        if results['ids'] and results['ids'][0]:
            for i, memory_id in enumerate(results['ids'][0]):
                memory = {
                    'id': memory_id,
                    'content': results['documents'][0][i],
                    'metadata': results['metadatas'][0][i],
                    'similarity_score': 1 - results['distances'][0][i],  # Convert distance to similarity
                    'brain_region': results['metadatas'][0][i].get('brain_region', 'unknown')
                }
                memories.append(memory)
                
                # Update access count
                self._update_access_count(memory_id)
        
        return memories
    
    def update_memory(self, memory_id: str, content: str = None, 
                     metadata: Dict = None) -> bool:
        """
        Update existing memory
        Enhanced from Mem0 with brain region re-classification
        """
        try:
            # Get existing memory
            existing = self.collection.get(ids=[memory_id], include=['metadatas', 'documents'])
            
            if not existing['ids']:
                return False
                
            existing_metadata = existing['metadatas'][0]
            existing_content = existing['documents'][0]
            
            # Update content if provided
            if content:
                existing_content = content
                # Re-classify if content changed
                memory_type = self._classify_memory_type(content)
                existing_metadata['memory_type'] = memory_type
                existing_metadata['brain_region'] = self.memory_types[memory_type]['brain_region']
                
                # Generate new embedding
                embedding = self._generate_embedding(content)
            else:
                # Keep existing embedding
                embedding = None
            
            # Update metadata
            if metadata:
                existing_metadata.update(metadata)
            
            existing_metadata['updated_at'] = datetime.now().isoformat()
            
            # Update in vector store
            if embedding:
                self.collection.update(
                    ids=[memory_id],
                    embeddings=[embedding],
                    documents=[existing_content],
                    metadatas=[existing_metadata]
                )
            else:
                self.collection.update(
                    ids=[memory_id],
                    documents=[existing_content],
                    metadatas=[existing_metadata]
                )
            
            return True
            
        except Exception as e:
            print(f"Error updating memory {memory_id}: {e}")
            return False
    
    def delete_memory(self, memory_id: str, user_id: str) -> bool:
        """
        Delete memory with safety checks
        Enhanced from Mem0 with user verification
        """
        try:
            # Verify ownership
            existing = self.collection.get(
                ids=[memory_id], 
                where={"user_id": user_id},
                include=['metadatas']
            )
            
            if not existing['ids']:
                return False
            
            # Delete from vector store
            self.collection.delete(ids=[memory_id])
            
            print(f"Deleted memory {memory_id}")
            return True
            
        except Exception as e:
            print(f"Error deleting memory {memory_id}: {e}")
            return False
    
    def get_memory_stats(self, user_id: str) -> Dict[str, Any]:
        """
        Get memory statistics for visualization
        NEW - For Cerebral 3D brain visualization
        """
        try:
            # Get all memories for user
            all_memories = self.collection.get(
                where={"user_id": user_id},
                include=['metadatas']
            )
            
            if not all_memories['ids']:
                return {'total': 0, 'regions': {}}
            
            # Count by brain region
            region_stats = {}
            for metadata in all_memories['metadatas']:
                region = metadata.get('brain_region', 'unknown')
                memory_type = metadata.get('memory_type', 'unknown')
                
                if region not in region_stats:
                    region_stats[region] = {
                        'count': 0,
                        'types': {},
                        'avg_importance': 0,
                        'recent_activity': 0
                    }
                
                region_stats[region]['count'] += 1
                region_stats[region]['types'][memory_type] = region_stats[region]['types'].get(memory_type, 0) + 1
                region_stats[region]['avg_importance'] += metadata.get('importance_score', 0.5)
                
                # Check recent activity (last 24 hours)
                created_at = datetime.fromisoformat(metadata.get('created_at', datetime.now().isoformat()))
                if (datetime.now() - created_at).days < 1:
                    region_stats[region]['recent_activity'] += 1
            
            # Calculate averages
            for region in region_stats:
                if region_stats[region]['count'] > 0:
                    region_stats[region]['avg_importance'] /= region_stats[region]['count']
            
            return {
                'total': len(all_memories['ids']),
                'regions': region_stats,
                'brain_region_info': self.brain_regions
            }
            
        except Exception as e:
            print(f"Error getting memory stats: {e}")
            return {'total': 0, 'regions': {}}
    
    def _update_access_count(self, memory_id: str):
        """Update access count for memory analytics"""
        try:
            existing = self.collection.get(ids=[memory_id], include=['metadatas'])
            if existing['ids']:
                metadata = existing['metadatas'][0]
                metadata['access_count'] = metadata.get('access_count', 0) + 1
                metadata['last_accessed'] = datetime.now().isoformat()
                
                self.collection.update(
                    ids=[memory_id],
                    metadatas=[metadata]
                )
        except Exception as e:
            print(f"Error updating access count: {e}")
