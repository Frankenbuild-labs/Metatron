"""
VANNA-Inspired Learning System for Metatron Memory
Adapts VANNA's RAG-based learning patterns for general knowledge and memory improvement
"""

import json
import uuid
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import os

logger = logging.getLogger(__name__)

@dataclass
class LearningPattern:
    """Represents a learned pattern from successful interactions"""
    id: str
    pattern_type: str  # 'conversation', 'query_response', 'user_preference', 'tool_usage'
    input_context: str
    successful_output: str
    success_score: float
    brain_region: str
    metadata: Dict[str, Any]
    created_at: str
    usage_count: int = 0
    last_used: Optional[str] = None
    effectiveness_score: float = 1.0

@dataclass
class FeedbackRecord:
    """Records user feedback for continuous improvement"""
    id: str
    pattern_id: str
    user_id: str
    feedback_type: str  # 'positive', 'negative', 'correction'
    original_output: str
    corrected_output: Optional[str]
    feedback_score: float  # -1.0 to 1.0
    timestamp: str
    context: Dict[str, Any]

class VannaLearningAdapter:
    """
    VANNA-inspired learning system adapted for general knowledge and memory improvement
    Uses RAG principles for dynamic learning without fine-tuning
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.patterns_db_path = config.get('patterns_db_path', './backend/memory/data/learning_patterns.json')
        self.feedback_db_path = config.get('feedback_db_path', './backend/memory/data/feedback_records.json')
        self.vectorizer_path = config.get('vectorizer_path', './backend/memory/data/pattern_vectorizer.pkl')
        
        # Learning parameters
        self.min_success_score = config.get('min_success_score', 0.7)
        self.max_patterns_per_type = config.get('max_patterns_per_type', 1000)
        self.pattern_decay_days = config.get('pattern_decay_days', 30)
        
        # Initialize storage
        self.patterns: Dict[str, LearningPattern] = {}
        self.feedback_records: Dict[str, FeedbackRecord] = {}
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.pattern_vectors = None
        
        # Load existing data
        self._load_patterns()
        self._load_feedback()
        self._initialize_vectorizer()
        
        logger.info("✅ VANNA Learning Adapter initialized")
    
    def learn_from_interaction(self, 
                             input_context: str,
                             output_result: str,
                             success_score: float,
                             brain_region: str,
                             pattern_type: str = 'conversation',
                             metadata: Optional[Dict] = None) -> str:
        """
        Learn from a successful interaction (VANNA-inspired)
        
        Args:
            input_context: The input that led to success
            output_result: The successful output/response
            success_score: How successful this interaction was (0.0-1.0)
            brain_region: Which brain region this relates to
            pattern_type: Type of pattern being learned
            metadata: Additional context information
            
        Returns:
            Pattern ID if learned, None if not significant enough
        """
        try:
            # Only learn from sufficiently successful interactions
            if success_score < self.min_success_score:
                logger.debug(f"Skipping learning - success score {success_score} below threshold")
                return None
            
            # Check if similar pattern already exists
            similar_pattern = self._find_similar_pattern(input_context, pattern_type, brain_region)
            
            if similar_pattern:
                # Update existing pattern
                similar_pattern.usage_count += 1
                similar_pattern.last_used = datetime.now().isoformat()
                similar_pattern.effectiveness_score = (
                    similar_pattern.effectiveness_score * 0.9 + success_score * 0.1
                )
                logger.info(f"📈 Updated existing pattern: {similar_pattern.id}")
                self._save_patterns()
                return similar_pattern.id
            else:
                # Create new pattern
                pattern_id = str(uuid.uuid4())
                new_pattern = LearningPattern(
                    id=pattern_id,
                    pattern_type=pattern_type,
                    input_context=input_context,
                    successful_output=output_result,
                    success_score=success_score,
                    brain_region=brain_region,
                    metadata=metadata or {},
                    created_at=datetime.now().isoformat(),
                    usage_count=1,
                    last_used=datetime.now().isoformat(),
                    effectiveness_score=success_score
                )
                
                self.patterns[pattern_id] = new_pattern
                logger.info(f"🧠 Learned new pattern: {pattern_id} ({pattern_type})")
                
                # Update vectorizer with new pattern
                self._update_vectorizer()
                self._save_patterns()
                
                return pattern_id
                
        except Exception as e:
            logger.error(f"Error learning from interaction: {e}")
            return None
    
    def retrieve_relevant_patterns(self,
                                 query_context: str,
                                 pattern_type: Optional[str] = None,
                                 brain_region: Optional[str] = None,
                                 limit: int = 5) -> List[LearningPattern]:
        """
        Retrieve relevant patterns for improving responses (RAG approach)
        
        Args:
            query_context: Current context to find patterns for
            pattern_type: Filter by pattern type
            brain_region: Filter by brain region
            limit: Maximum patterns to return
            
        Returns:
            List of relevant patterns sorted by relevance
        """
        try:
            if not self.patterns:
                return []
            
            # Filter patterns by type and region if specified
            candidate_patterns = []
            for pattern in self.patterns.values():
                if pattern_type and pattern.pattern_type != pattern_type:
                    continue
                if brain_region and pattern.brain_region != brain_region:
                    continue
                candidate_patterns.append(pattern)
            
            if not candidate_patterns:
                return []
            
            # Calculate similarity scores
            pattern_contexts = [p.input_context for p in candidate_patterns]
            
            if self.pattern_vectors is not None and len(pattern_contexts) > 0:
                # Use vectorizer for similarity
                query_vector = self.vectorizer.transform([query_context])
                similarities = cosine_similarity(query_vector, self.pattern_vectors).flatten()
                
                # Combine similarity with effectiveness scores
                scored_patterns = []
                for i, pattern in enumerate(candidate_patterns):
                    if i < len(similarities):
                        combined_score = similarities[i] * 0.7 + pattern.effectiveness_score * 0.3
                        scored_patterns.append((pattern, combined_score))
                
                # Sort by combined score
                scored_patterns.sort(key=lambda x: x[1], reverse=True)
                
                # Return top patterns
                return [pattern for pattern, score in scored_patterns[:limit]]
            else:
                # Fallback to simple text matching
                return self._simple_text_matching(query_context, candidate_patterns, limit)
                
        except Exception as e:
            logger.error(f"Error retrieving patterns: {e}")
            return []
    
    def record_feedback(self,
                       pattern_id: str,
                       user_id: str,
                       feedback_type: str,
                       feedback_score: float,
                       original_output: str,
                       corrected_output: Optional[str] = None,
                       context: Optional[Dict] = None) -> str:
        """
        Record user feedback for continuous improvement (Human-in-the-loop)
        
        Args:
            pattern_id: ID of the pattern being evaluated
            user_id: User providing feedback
            feedback_type: 'positive', 'negative', 'correction'
            feedback_score: Numerical feedback (-1.0 to 1.0)
            original_output: The original output that was evaluated
            corrected_output: User's correction (if applicable)
            context: Additional context
            
        Returns:
            Feedback record ID
        """
        try:
            feedback_id = str(uuid.uuid4())
            feedback_record = FeedbackRecord(
                id=feedback_id,
                pattern_id=pattern_id,
                user_id=user_id,
                feedback_type=feedback_type,
                original_output=original_output,
                corrected_output=corrected_output,
                feedback_score=feedback_score,
                timestamp=datetime.now().isoformat(),
                context=context or {}
            )
            
            self.feedback_records[feedback_id] = feedback_record
            
            # Update pattern effectiveness based on feedback
            if pattern_id in self.patterns:
                pattern = self.patterns[pattern_id]
                # Weighted update: recent feedback has more impact
                pattern.effectiveness_score = (
                    pattern.effectiveness_score * 0.8 + 
                    (feedback_score + 1.0) / 2.0 * 0.2  # Normalize -1,1 to 0,1
                )
                
                # If user provided correction, learn from it
                if corrected_output and feedback_score > 0:
                    self.learn_from_interaction(
                        input_context=pattern.input_context,
                        output_result=corrected_output,
                        success_score=min(1.0, feedback_score + 0.5),
                        brain_region=pattern.brain_region,
                        pattern_type=pattern.pattern_type,
                        metadata={'source': 'user_correction', 'original_pattern': pattern_id}
                    )
            
            self._save_feedback()
            self._save_patterns()
            
            logger.info(f"📝 Recorded feedback: {feedback_id} for pattern {pattern_id}")
            return feedback_id
            
        except Exception as e:
            logger.error(f"Error recording feedback: {e}")
            return None
    
    def get_improvement_suggestions(self, context: str, brain_region: str) -> List[Dict[str, Any]]:
        """
        Get suggestions for improving responses based on learned patterns
        
        Args:
            context: Current context
            brain_region: Target brain region
            
        Returns:
            List of improvement suggestions
        """
        try:
            relevant_patterns = self.retrieve_relevant_patterns(
                query_context=context,
                brain_region=brain_region,
                limit=3
            )
            
            suggestions = []
            for pattern in relevant_patterns:
                suggestion = {
                    'pattern_id': pattern.id,
                    'suggestion_type': pattern.pattern_type,
                    'suggested_approach': pattern.successful_output,
                    'confidence': pattern.effectiveness_score,
                    'usage_count': pattern.usage_count,
                    'brain_region': pattern.brain_region
                }
                suggestions.append(suggestion)
            
            return suggestions
            
        except Exception as e:
            logger.error(f"Error getting improvement suggestions: {e}")
            return []
    
    def cleanup_old_patterns(self):
        """Remove old, ineffective patterns to maintain quality"""
        try:
            cutoff_date = datetime.now() - timedelta(days=self.pattern_decay_days)
            patterns_to_remove = []
            
            for pattern_id, pattern in self.patterns.items():
                pattern_date = datetime.fromisoformat(pattern.created_at)
                
                # Remove if old and not effective
                if (pattern_date < cutoff_date and 
                    pattern.effectiveness_score < 0.5 and 
                    pattern.usage_count < 3):
                    patterns_to_remove.append(pattern_id)
            
            for pattern_id in patterns_to_remove:
                del self.patterns[pattern_id]
                logger.info(f"🗑️ Removed old pattern: {pattern_id}")
            
            if patterns_to_remove:
                self._update_vectorizer()
                self._save_patterns()
                
            logger.info(f"🧹 Cleanup complete: removed {len(patterns_to_remove)} patterns")
            
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
    
    def get_learning_stats(self) -> Dict[str, Any]:
        """Get statistics about the learning system"""
        try:
            stats = {
                'total_patterns': len(self.patterns),
                'total_feedback': len(self.feedback_records),
                'patterns_by_type': {},
                'patterns_by_region': {},
                'average_effectiveness': 0.0,
                'most_used_patterns': []
            }
            
            if self.patterns:
                # Calculate statistics
                effectiveness_scores = []
                for pattern in self.patterns.values():
                    # Count by type
                    stats['patterns_by_type'][pattern.pattern_type] = \
                        stats['patterns_by_type'].get(pattern.pattern_type, 0) + 1
                    
                    # Count by region
                    stats['patterns_by_region'][pattern.brain_region] = \
                        stats['patterns_by_region'].get(pattern.brain_region, 0) + 1
                    
                    effectiveness_scores.append(pattern.effectiveness_score)
                
                stats['average_effectiveness'] = np.mean(effectiveness_scores)
                
                # Most used patterns
                sorted_patterns = sorted(
                    self.patterns.values(),
                    key=lambda p: p.usage_count,
                    reverse=True
                )
                stats['most_used_patterns'] = [
                    {
                        'id': p.id,
                        'type': p.pattern_type,
                        'usage_count': p.usage_count,
                        'effectiveness': p.effectiveness_score
                    }
                    for p in sorted_patterns[:5]
                ]
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting learning stats: {e}")
            return {'error': str(e)}
    
    def _find_similar_pattern(self, input_context: str, pattern_type: str, brain_region: str) -> Optional[LearningPattern]:
        """Find if a similar pattern already exists"""
        for pattern in self.patterns.values():
            if (pattern.pattern_type == pattern_type and 
                pattern.brain_region == brain_region):
                
                # Simple similarity check (can be enhanced)
                if self._calculate_text_similarity(input_context, pattern.input_context) > 0.8:
                    return pattern
        return None
    
    def _calculate_text_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two texts"""
        try:
            vectorizer = TfidfVectorizer().fit([text1, text2])
            vectors = vectorizer.transform([text1, text2])
            similarity = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]
            return similarity
        except:
            return 0.0
    
    def _simple_text_matching(self, query: str, patterns: List[LearningPattern], limit: int) -> List[LearningPattern]:
        """Fallback text matching when vectorizer is not available"""
        scored_patterns = []
        query_words = set(query.lower().split())
        
        for pattern in patterns:
            pattern_words = set(pattern.input_context.lower().split())
            overlap = len(query_words.intersection(pattern_words))
            total_words = len(query_words.union(pattern_words))
            
            if total_words > 0:
                similarity = overlap / total_words
                combined_score = similarity * 0.7 + pattern.effectiveness_score * 0.3
                scored_patterns.append((pattern, combined_score))
        
        scored_patterns.sort(key=lambda x: x[1], reverse=True)
        return [pattern for pattern, score in scored_patterns[:limit]]
    
    def _initialize_vectorizer(self):
        """Initialize or load the TF-IDF vectorizer"""
        try:
            if os.path.exists(self.vectorizer_path) and self.patterns:
                with open(self.vectorizer_path, 'rb') as f:
                    self.vectorizer = pickle.load(f)
                self._update_pattern_vectors()
            elif self.patterns:
                self._update_vectorizer()
        except Exception as e:
            logger.error(f"Error initializing vectorizer: {e}")
    
    def _update_vectorizer(self):
        """Update the vectorizer with current patterns"""
        try:
            if not self.patterns:
                return
            
            pattern_texts = [pattern.input_context for pattern in self.patterns.values()]
            self.vectorizer.fit(pattern_texts)
            self._update_pattern_vectors()
            
            # Save vectorizer
            os.makedirs(os.path.dirname(self.vectorizer_path), exist_ok=True)
            with open(self.vectorizer_path, 'wb') as f:
                pickle.dump(self.vectorizer, f)
                
        except Exception as e:
            logger.error(f"Error updating vectorizer: {e}")
    
    def _update_pattern_vectors(self):
        """Update pattern vectors for similarity calculations"""
        try:
            if self.patterns:
                pattern_texts = [pattern.input_context for pattern in self.patterns.values()]
                self.pattern_vectors = self.vectorizer.transform(pattern_texts)
        except Exception as e:
            logger.error(f"Error updating pattern vectors: {e}")
    
    def _load_patterns(self):
        """Load patterns from storage"""
        try:
            if os.path.exists(self.patterns_db_path):
                with open(self.patterns_db_path, 'r') as f:
                    data = json.load(f)
                    for pattern_data in data:
                        pattern = LearningPattern(**pattern_data)
                        self.patterns[pattern.id] = pattern
                logger.info(f"📚 Loaded {len(self.patterns)} learning patterns")
        except Exception as e:
            logger.error(f"Error loading patterns: {e}")
    
    def _save_patterns(self):
        """Save patterns to storage"""
        try:
            os.makedirs(os.path.dirname(self.patterns_db_path), exist_ok=True)
            with open(self.patterns_db_path, 'w') as f:
                patterns_data = [asdict(pattern) for pattern in self.patterns.values()]
                json.dump(patterns_data, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving patterns: {e}")
    
    def _load_feedback(self):
        """Load feedback records from storage"""
        try:
            if os.path.exists(self.feedback_db_path):
                with open(self.feedback_db_path, 'r') as f:
                    data = json.load(f)
                    for feedback_data in data:
                        feedback = FeedbackRecord(**feedback_data)
                        self.feedback_records[feedback.id] = feedback
                logger.info(f"📝 Loaded {len(self.feedback_records)} feedback records")
        except Exception as e:
            logger.error(f"Error loading feedback: {e}")
    
    def _save_feedback(self):
        """Save feedback records to storage"""
        try:
            os.makedirs(os.path.dirname(self.feedback_db_path), exist_ok=True)
            with open(self.feedback_db_path, 'w') as f:
                feedback_data = [asdict(feedback) for feedback in self.feedback_records.values()]
                json.dump(feedback_data, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving feedback: {e}")
