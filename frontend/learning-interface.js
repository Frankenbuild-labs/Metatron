/**
 * Learning Interface for Metatron Memory System
 * Provides user feedback mechanisms and learning statistics visualization
 * Integrates VANNA-inspired learning patterns with the chat interface
 */

class LearningInterface {
    constructor() {
        this.memoryApiUrl = 'http://localhost:5006';
        this.currentPatternId = null;
        this.learningStats = {};
        this.feedbackHistory = [];
        
        this.init();
    }
    
    async init() {
        console.log('🧠 Initializing Learning Interface...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupLearningFeatures());
        } else {
            this.setupLearningFeatures();
        }
        
        // Check learning service health
        await this.checkLearningServiceHealth();
    }
    
    setupLearningFeatures() {
        // Add learning feedback buttons to chat messages
        this.addFeedbackButtonsToChat();
        
        // Add learning statistics panel
        this.createLearningStatsPanel();
        
        // Setup learning event listeners
        this.setupLearningEventListeners();
        
        console.log('✅ Learning interface features setup complete');
    }
    
    async checkLearningServiceHealth() {
        try {
            const response = await fetch(`${this.memoryApiUrl}/api/learning/health`);
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Learning service is healthy:', data);
                this.learningStats = data.learning_stats || {};
                this.updateLearningStatusIndicator(true);
                return true;
            } else {
                console.warn('⚠️ Learning service health check failed');
                this.updateLearningStatusIndicator(false);
                return false;
            }
        } catch (error) {
            console.error('❌ Learning service not available:', error);
            this.updateLearningStatusIndicator(false);
            return false;
        }
    }
    
    updateLearningStatusIndicator(isHealthy) {
        // Update brain button to show learning status
        const brainBtn = document.getElementById('brainMemoryBtn');
        if (brainBtn) {
            if (isHealthy) {
                brainBtn.classList.add('learning-active');
                brainBtn.title = 'Memory System - Learning Active';
            } else {
                brainBtn.classList.remove('learning-active');
            }
        }
    }
    
    addFeedbackButtonsToChat() {
        // Add feedback buttons to existing chat messages
        const chatMessages = document.querySelectorAll('.message.ai');
        chatMessages.forEach(message => {
            if (!message.querySelector('.learning-feedback')) {
                this.addFeedbackButtonsToMessage(message);
            }
        });
        
        // Observer for new messages
        const chatContainer = document.getElementById('chatMessages');
        if (chatContainer) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE && 
                            node.classList.contains('message') && 
                            node.classList.contains('ai')) {
                            this.addFeedbackButtonsToMessage(node);
                        }
                    });
                });
            });
            
            observer.observe(chatContainer, { childList: true, subtree: true });
        }
    }
    
    addFeedbackButtonsToMessage(messageElement) {
        const feedbackContainer = document.createElement('div');
        feedbackContainer.className = 'learning-feedback';
        feedbackContainer.innerHTML = `
            <div class="feedback-buttons">
                <button class="feedback-btn positive" data-feedback="1" title="Good response">
                    <i class="fas fa-thumbs-up"></i>
                </button>
                <button class="feedback-btn negative" data-feedback="-1" title="Poor response">
                    <i class="fas fa-thumbs-down"></i>
                </button>
                <button class="feedback-btn correction" title="Provide correction">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
            <div class="feedback-status" style="display: none;"></div>
        `;
        
        messageElement.appendChild(feedbackContainer);
        
        // Add event listeners
        const feedbackButtons = feedbackContainer.querySelectorAll('.feedback-btn');
        feedbackButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleFeedbackClick(btn, messageElement);
            });
        });
    }
    
    async handleFeedbackClick(button, messageElement) {
        const feedbackType = button.classList.contains('positive') ? 'positive' :
                           button.classList.contains('negative') ? 'negative' : 'correction';
        const feedbackScore = parseFloat(button.dataset.feedback) || 0;
        
        const messageText = messageElement.querySelector('.message-content')?.textContent || '';
        
        if (feedbackType === 'correction') {
            this.showCorrectionDialog(messageText, messageElement);
        } else {
            await this.submitFeedback(feedbackType, feedbackScore, messageText, null, messageElement);
        }
    }
    
    showCorrectionDialog(originalText, messageElement) {
        const modal = document.createElement('div');
        modal.className = 'correction-modal';
        modal.innerHTML = `
            <div class="correction-dialog">
                <h3>Provide Correction</h3>
                <div class="original-text">
                    <label>Original Response:</label>
                    <div class="text-display">${originalText}</div>
                </div>
                <div class="correction-input">
                    <label>Your Correction:</label>
                    <textarea id="correctionText" placeholder="Enter your improved version...">${originalText}</textarea>
                </div>
                <div class="correction-actions">
                    <button id="submitCorrection" class="btn-primary">Submit Correction</button>
                    <button id="cancelCorrection" class="btn-secondary">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        document.getElementById('submitCorrection').addEventListener('click', async () => {
            const correctedText = document.getElementById('correctionText').value;
            if (correctedText.trim() && correctedText !== originalText) {
                await this.submitFeedback('correction', 0.8, originalText, correctedText, messageElement);
            }
            document.body.removeChild(modal);
        });
        
        document.getElementById('cancelCorrection').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Focus on textarea
        document.getElementById('correctionText').focus();
    }
    
    async submitFeedback(feedbackType, feedbackScore, originalText, correctedText, messageElement) {
        try {
            // For now, we'll use a dummy pattern ID since we need to track patterns better
            const patternId = this.generatePatternId(originalText);
            
            const response = await fetch(`${this.memoryApiUrl}/api/learning/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pattern_id: patternId,
                    user_id: 'default_user',
                    feedback_type: feedbackType,
                    feedback_score: feedbackScore,
                    original_output: originalText,
                    corrected_output: correctedText,
                    context: {
                        source: 'chat_interface',
                        timestamp: new Date().toISOString()
                    }
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                this.showFeedbackSuccess(messageElement, feedbackType);
                console.log('✅ Feedback submitted:', result);
                
                // Update learning stats
                await this.updateLearningStats();
            } else {
                this.showFeedbackError(messageElement, 'Failed to submit feedback');
            }
            
        } catch (error) {
            console.error('Error submitting feedback:', error);
            this.showFeedbackError(messageElement, 'Network error');
        }
    }
    
    showFeedbackSuccess(messageElement, feedbackType) {
        const statusElement = messageElement.querySelector('.feedback-status');
        if (statusElement) {
            statusElement.style.display = 'block';
            statusElement.innerHTML = `<span class="feedback-success">✅ ${feedbackType} feedback recorded</span>`;
            
            // Hide after 3 seconds
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 3000);
        }
        
        // Disable feedback buttons for this message
        const buttons = messageElement.querySelectorAll('.feedback-btn');
        buttons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
        });
    }
    
    showFeedbackError(messageElement, errorMessage) {
        const statusElement = messageElement.querySelector('.feedback-status');
        if (statusElement) {
            statusElement.style.display = 'block';
            statusElement.innerHTML = `<span class="feedback-error">❌ ${errorMessage}</span>`;
            
            // Hide after 5 seconds
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 5000);
        }
    }
    
    createLearningStatsPanel() {
        // Add learning stats to the right panel
        const rightPanel = document.querySelector('.right-panel');
        if (rightPanel) {
            const statsPanel = document.createElement('div');
            statsPanel.className = 'learning-stats-panel';
            statsPanel.innerHTML = `
                <div class="panel-section">
                    <h3><i class="fas fa-brain"></i> Learning Stats</h3>
                    <div class="learning-metrics">
                        <div class="metric">
                            <span class="metric-label">Patterns Learned:</span>
                            <span class="metric-value" id="totalPatterns">0</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Feedback Received:</span>
                            <span class="metric-value" id="totalFeedback">0</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Avg Effectiveness:</span>
                            <span class="metric-value" id="avgEffectiveness">0%</span>
                        </div>
                    </div>
                    <button id="viewLearningDetails" class="btn-secondary">View Details</button>
                </div>
            `;
            
            rightPanel.appendChild(statsPanel);
            
            // Add event listener for details button
            document.getElementById('viewLearningDetails').addEventListener('click', () => {
                this.showLearningDetailsModal();
            });
        }
    }
    
    async updateLearningStats() {
        try {
            const response = await fetch(`${this.memoryApiUrl}/api/learning/stats`);
            if (response.ok) {
                const data = await response.json();
                const stats = data.statistics || {};
                
                // Update UI elements
                const totalPatternsEl = document.getElementById('totalPatterns');
                const totalFeedbackEl = document.getElementById('totalFeedback');
                const avgEffectivenessEl = document.getElementById('avgEffectiveness');
                
                if (totalPatternsEl) totalPatternsEl.textContent = stats.total_patterns || 0;
                if (totalFeedbackEl) totalFeedbackEl.textContent = stats.total_feedback || 0;
                if (avgEffectivenessEl) {
                    const effectiveness = ((stats.average_effectiveness || 0) * 100).toFixed(1);
                    avgEffectivenessEl.textContent = `${effectiveness}%`;
                }
                
                this.learningStats = stats;
            }
        } catch (error) {
            console.error('Error updating learning stats:', error);
        }
    }
    
    showLearningDetailsModal() {
        // Create detailed learning statistics modal
        const modal = document.createElement('div');
        modal.className = 'learning-details-modal';
        modal.innerHTML = `
            <div class="learning-details-dialog">
                <div class="modal-header">
                    <h2>Learning System Details</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-content">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h4>Patterns by Type</h4>
                            <div id="patternsByType"></div>
                        </div>
                        <div class="stat-card">
                            <h4>Patterns by Brain Region</h4>
                            <div id="patternsByRegion"></div>
                        </div>
                        <div class="stat-card">
                            <h4>Most Used Patterns</h4>
                            <div id="mostUsedPatterns"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Populate with current stats
        this.populateLearningDetails(modal);
        
        // Close button
        modal.querySelector('.close-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    
    populateLearningDetails(modal) {
        const stats = this.learningStats;
        
        // Patterns by type
        const typeContainer = modal.querySelector('#patternsByType');
        if (stats.patterns_by_type) {
            typeContainer.innerHTML = Object.entries(stats.patterns_by_type)
                .map(([type, count]) => `<div class="stat-item">${type}: ${count}</div>`)
                .join('');
        }
        
        // Patterns by region
        const regionContainer = modal.querySelector('#patternsByRegion');
        if (stats.patterns_by_region) {
            regionContainer.innerHTML = Object.entries(stats.patterns_by_region)
                .map(([region, count]) => `<div class="stat-item">${region}: ${count}</div>`)
                .join('');
        }
        
        // Most used patterns
        const usedContainer = modal.querySelector('#mostUsedPatterns');
        if (stats.most_used_patterns) {
            usedContainer.innerHTML = stats.most_used_patterns
                .map(pattern => `
                    <div class="pattern-item">
                        <span class="pattern-type">${pattern.type}</span>
                        <span class="pattern-usage">Used: ${pattern.usage_count}</span>
                        <span class="pattern-effectiveness">Eff: ${(pattern.effectiveness * 100).toFixed(1)}%</span>
                    </div>
                `).join('');
        }
    }
    
    setupLearningEventListeners() {
        // Update stats periodically
        setInterval(() => {
            this.updateLearningStats();
        }, 60000); // Every minute
        
        // Initial stats load
        this.updateLearningStats();
    }
    
    generatePatternId(text) {
        // Simple hash function for generating pattern IDs
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return `pattern_${Math.abs(hash)}_${Date.now()}`;
    }
}

// Initialize the learning interface when the script loads
const learningInterface = new LearningInterface();
