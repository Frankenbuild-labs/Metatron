"""
Vanna Learning Engine Adapter
Adapted from vanna-ai/vanna repository
Enhanced for Metatron's domain-specific learning patterns
"""
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from collections import defaultdict, Counter

class VannaLearningEngine:
    """
    Domain-specific learning engine adapted from Vanna
    Learns from successful interactions and builds patterns
    """
    
    def __init__(self, config: Dict[str, Any], memory_core):
        self.config = config
        self.learning_config = config['learning']
        self.memory_core = memory_core
        self.patterns = defaultdict(list)
        self.success_rates = defaultdict(float)
        
    def train_from_interaction(self, interaction_data: Dict[str, Any]) -> bool:
        """
        Learn from successful tool/workflow interactions
        Adapted from Vanna's training approach
        """
        if not self.learning_config['enable_learning']:
            return False
            
        try:
            interaction_type = interaction_data.get('type', 'unknown')
            success = interaction_data.get('success', False)
            
            if not success:
                return False
            
            # Extract pattern from successful interaction
            pattern = self._extract_interaction_pattern(interaction_data)
            
            if pattern:
                # Store pattern in memory
                pattern_id = self.memory_core.add_memory(
                    content=f"Learned pattern: {pattern['description']}",
                    user_id=interaction_data.get('user_id', 'system'),
                    metadata={
                        'type': 'system',
                        'pattern_type': interaction_type,
                        'pattern_data': pattern,
                        'success_rate': 1.0,
                        'usage_count': 1,
                        'learning_source': 'interaction'
                    }
                )
                
                # Update internal patterns
                self.patterns[interaction_type].append(pattern)
                self._update_success_rate(interaction_type, True)
                
                print(f"Learned new {interaction_type} pattern: {pattern_id}")
                return True
                
        except Exception as e:
            print(f"Error learning from interaction: {e}")
            
        return False
    
    def train_from_documentation(self, docs: str, domain: str, user_id: str = 'system') -> bool:
        """
        Learn from user documentation and guides
        Adapted from Vanna's documentation training
        """
        try:
            # Extract key concepts and procedures from documentation
            concepts = self._extract_documentation_concepts(docs, domain)
            
            for concept in concepts:
                # Store as long-term memory
                concept_id = self.memory_core.add_memory(
                    content=concept['content'],
                    user_id=user_id,
                    metadata={
                        'type': 'long_term',
                        'domain': domain,
                        'concept_type': concept['type'],
                        'importance_score': concept.get('importance', 0.7),
                        'learning_source': 'documentation'
                    }
                )
                
                print(f"Learned concept from docs: {concept_id}")
            
            return True
            
        except Exception as e:
            print(f"Error learning from documentation: {e}")
            return False
    
    def train_from_examples(self, examples: List[Dict], category: str, user_id: str = 'system') -> bool:
        """
        Learn from user-provided examples
        Adapted from Vanna's example-based learning
        """
        try:
            for example in examples:
                # Extract pattern from example
                pattern = self._extract_example_pattern(example, category)
                
                if pattern:
                    # Store as system memory
                    pattern_id = self.memory_core.add_memory(
                        content=f"Example pattern: {pattern['description']}",
                        user_id=user_id,
                        metadata={
                            'type': 'system',
                            'category': category,
                            'pattern_data': pattern,
                            'example_source': example.get('source', 'user'),
                            'learning_source': 'examples'
                        }
                    )
                    
                    print(f"Learned pattern from example: {pattern_id}")
            
            return True
            
        except Exception as e:
            print(f"Error learning from examples: {e}")
            return False
    
    def get_learned_patterns(self, domain: str, query: str, user_id: str = 'system') -> List[Dict]:
        """
        Retrieve learned patterns for specific domains
        Enhanced from Vanna's pattern retrieval
        """
        try:
            # Search for relevant patterns in memory
            patterns = self.memory_core.search_memories(
                query=f"{domain} {query}",
                user_id=user_id,
                filters={
                    'learning_source': ['interaction', 'documentation', 'examples'],
                    'domain': domain
                },
                limit=10
            )
            
            # Filter and rank patterns by relevance and success rate
            relevant_patterns = []
            for pattern in patterns:
                metadata = pattern['metadata']
                
                # Check success rate threshold
                success_rate = metadata.get('success_rate', 0.0)
                if success_rate >= self.learning_config['min_success_rate']:
                    relevant_patterns.append({
                        'id': pattern['id'],
                        'description': pattern['content'],
                        'pattern_data': metadata.get('pattern_data', {}),
                        'success_rate': success_rate,
                        'usage_count': metadata.get('usage_count', 0),
                        'similarity_score': pattern['similarity_score']
                    })
            
            # Sort by success rate and similarity
            relevant_patterns.sort(
                key=lambda x: (x['success_rate'], x['similarity_score']), 
                reverse=True
            )
            
            return relevant_patterns
            
        except Exception as e:
            print(f"Error retrieving patterns: {e}")
            return []
    
    def optimize_memory_retrieval(self, query_patterns: List[str], user_id: str) -> Dict[str, Any]:
        """
        Optimize memory search based on usage patterns
        NEW - Enhanced retrieval optimization
        """
        try:
            # Analyze query patterns to optimize search
            optimization_data = {
                'suggested_filters': {},
                'boosted_regions': [],
                'query_expansion': []
            }
            
            # Find common patterns in queries
            pattern_analysis = self._analyze_query_patterns(query_patterns)
            
            # Suggest filters based on patterns
            if pattern_analysis['common_domains']:
                optimization_data['suggested_filters']['domain'] = pattern_analysis['common_domains']
            
            # Boost brain regions based on usage
            region_usage = self._get_region_usage_stats(user_id)
            optimization_data['boosted_regions'] = sorted(
                region_usage.items(), 
                key=lambda x: x[1], 
                reverse=True
            )[:3]
            
            # Expand query with learned synonyms
            optimization_data['query_expansion'] = self._get_query_expansions(query_patterns)
            
            return optimization_data
            
        except Exception as e:
            print(f"Error optimizing retrieval: {e}")
            return {}
    
    def _extract_interaction_pattern(self, interaction_data: Dict) -> Optional[Dict]:
        """Extract learnable pattern from interaction"""
        interaction_type = interaction_data.get('type')
        
        if interaction_type == 'tool_usage':
            return {
                'type': 'tool_pattern',
                'tool_name': interaction_data.get('tool_name'),
                'parameters': interaction_data.get('parameters', {}),
                'context': interaction_data.get('context', ''),
                'success_indicators': interaction_data.get('success_indicators', []),
                'description': f"Successful use of {interaction_data.get('tool_name')} tool"
            }
            
        elif interaction_type == 'workflow_execution':
            return {
                'type': 'workflow_pattern',
                'workflow_name': interaction_data.get('workflow_name'),
                'steps': interaction_data.get('steps', []),
                'conditions': interaction_data.get('conditions', {}),
                'execution_time': interaction_data.get('execution_time'),
                'description': f"Successful workflow: {interaction_data.get('workflow_name')}"
            }
            
        elif interaction_type == 'creative_generation':
            return {
                'type': 'creative_pattern',
                'prompt_style': interaction_data.get('prompt_style'),
                'model_used': interaction_data.get('model'),
                'parameters': interaction_data.get('parameters', {}),
                'user_rating': interaction_data.get('user_rating'),
                'description': f"Successful creative generation with {interaction_data.get('model')}"
            }
        
        return None
    
    def _extract_documentation_concepts(self, docs: str, domain: str) -> List[Dict]:
        """Extract key concepts from documentation"""
        # Simple concept extraction (can be enhanced with NLP)
        concepts = []
        
        # Split into sections and extract key information
        sections = docs.split('\n\n')
        
        for section in sections:
            if len(section.strip()) > 50:  # Meaningful content
                concepts.append({
                    'content': section.strip(),
                    'type': 'procedure' if any(word in section.lower() for word in ['step', 'how to', 'process']) else 'concept',
                    'domain': domain,
                    'importance': 0.7
                })
        
        return concepts
    
    def _extract_example_pattern(self, example: Dict, category: str) -> Optional[Dict]:
        """Extract pattern from user example"""
        return {
            'type': 'example_pattern',
            'category': category,
            'input': example.get('input', ''),
            'output': example.get('output', ''),
            'context': example.get('context', ''),
            'description': f"Example pattern for {category}"
        }
    
    def _update_success_rate(self, pattern_type: str, success: bool):
        """Update success rate for pattern type"""
        current_rate = self.success_rates[pattern_type]
        # Simple moving average
        self.success_rates[pattern_type] = (current_rate + (1.0 if success else 0.0)) / 2
    
    def _analyze_query_patterns(self, query_patterns: List[str]) -> Dict:
        """Analyze common patterns in queries"""
        # Extract common domains and topics
        word_counts = Counter()
        for query in query_patterns:
            words = query.lower().split()
            word_counts.update(words)
        
        common_words = [word for word, count in word_counts.most_common(10)]
        
        return {
            'common_domains': common_words[:5],
            'query_complexity': sum(len(q.split()) for q in query_patterns) / len(query_patterns),
            'common_patterns': common_words
        }
    
    def _get_region_usage_stats(self, user_id: str) -> Dict[str, int]:
        """Get brain region usage statistics"""
        stats = self.memory_core.get_memory_stats(user_id)
        return {region: data['count'] for region, data in stats.get('regions', {}).items()}
    
    def _get_query_expansions(self, query_patterns: List[str]) -> List[str]:
        """Get query expansion suggestions based on learned patterns"""
        # Simple expansion based on common co-occurring terms
        expansions = []
        
        # This could be enhanced with more sophisticated NLP
        common_expansions = {
            'tool': ['usage', 'function', 'command'],
            'workflow': ['process', 'steps', 'procedure'],
            'creative': ['generation', 'design', 'art'],
            'memory': ['recall', 'remember', 'store']
        }
        
        for query in query_patterns:
            for key, values in common_expansions.items():
                if key in query.lower():
                    expansions.extend(values)
        
        return list(set(expansions))[:5]  # Return unique expansions
