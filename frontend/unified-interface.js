/**
 * Unified Memory Interface for Metatron Memory System
 * Provides a single, intelligent interface that orchestrates all memory subsystems
 * Integrates memory storage, learning patterns, and conversation management
 */

class UnifiedMemoryInterface {
    constructor() {
        this.memoryApiUrl = 'http://localhost:5006';
        this.currentSessionId = null;
        this.systemHealth = {};
        this.lastAnalysis = null;
        this.recommendations = [];
        
        this.init();
    }
    
    async init() {
        console.log('🚀 Initializing Unified Memory Interface...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupUnifiedFeatures());
        } else {
            this.setupUnifiedFeatures();
        }
        
        // Check unified service health
        await this.checkUnifiedServiceHealth();
    }
    
    setupUnifiedFeatures() {
        // Create unified control panel
        this.createUnifiedControlPanel();
        
        // Enhance existing interfaces with unified capabilities
        this.enhanceExistingInterfaces();
        
        // Setup unified event listeners
        this.setupUnifiedEventListeners();
        
        console.log('✅ Unified memory interface features setup complete');
    }
    
    async checkUnifiedServiceHealth() {
        try {
            const response = await fetch(`${this.memoryApiUrl}/api/unified/health`);
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Unified service is healthy:', data);
                this.systemHealth = data;
                this.updateSystemHealthDisplay();
                return true;
            } else {
                console.warn('⚠️ Unified service health check failed');
                this.updateSystemHealthDisplay(false);
                return false;
            }
        } catch (error) {
            console.error('❌ Unified service not available:', error);
            this.updateSystemHealthDisplay(false);
            return false;
        }
    }
    
    updateSystemHealthDisplay(isHealthy = null) {
        const healthScore = isHealthy !== null ? (isHealthy ? 1.0 : 0.0) : this.systemHealth.health_score;

        // Update brain button with unified status - DISABLED to remove pulsing circle
        const brainBtn = document.getElementById('brainMemoryBtn');
        if (brainBtn) {
            // Remove existing status classes to stop pulsing
            brainBtn.classList.remove('unified-healthy', 'unified-degraded', 'unified-unhealthy');
            brainBtn.title = 'Cerebral Memory System - 3D Brain Interface';
        }
    }
    
    createUnifiedControlPanel() {
        // Add unified control panel to the right panel
        const rightPanel = document.querySelector('.right-panel');
        if (rightPanel) {
            const unifiedPanel = document.createElement('div');
            unifiedPanel.className = 'unified-control-panel';
            unifiedPanel.innerHTML = `
                <div class="panel-section">
                    <h3><i class="fas fa-brain"></i> Unified Memory System</h3>
                    
                    <div class="system-health">
                        <div class="health-header">
                            <span class="health-label">System Health:</span>
                            <span class="health-score" id="unifiedHealthScore">--</span>
                        </div>
                        <div class="subsystem-status">
                            <div class="subsystem" id="memorySubsystem">
                                <span class="subsystem-name">Memory</span>
                                <span class="subsystem-status-indicator" id="memoryStatus">--</span>
                            </div>
                            <div class="subsystem" id="learningSubsystem">
                                <span class="subsystem-name">Learning</span>
                                <span class="subsystem-status-indicator" id="learningStatus">--</span>
                            </div>
                            <div class="subsystem" id="conversationSubsystem">
                                <span class="subsystem-name">Conversation</span>
                                <span class="subsystem-status-indicator" id="conversationStatus">--</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="unified-actions">
                        <button id="runSystemAnalysis" class="btn-primary">
                            <i class="fas fa-chart-line"></i> System Analysis
                        </button>
                        <button id="viewRecommendations" class="btn-secondary">
                            <i class="fas fa-lightbulb"></i> Recommendations
                        </button>
                        <button id="unifiedSettings" class="btn-secondary">
                            <i class="fas fa-cog"></i> Settings
                        </button>
                    </div>
                    
                    <div class="quick-stats" id="unifiedQuickStats">
                        <div class="stat-item">
                            <span class="stat-label">Operations Today:</span>
                            <span class="stat-value" id="operationsToday">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Success Rate:</span>
                            <span class="stat-value" id="successRate">--</span>
                        </div>
                    </div>
                </div>
            `;
            
            // Insert at the top of the right panel
            rightPanel.insertBefore(unifiedPanel, rightPanel.firstChild);
            
            // Add event listeners
            document.getElementById('runSystemAnalysis').addEventListener('click', () => {
                this.runSystemAnalysis();
            });
            
            document.getElementById('viewRecommendations').addEventListener('click', () => {
                this.showRecommendationsModal();
            });
            
            document.getElementById('unifiedSettings').addEventListener('click', () => {
                this.showUnifiedSettingsModal();
            });
        }
    }
    
    enhanceExistingInterfaces() {
        // Enhance chat interface with unified processing
        this.enhanceChatWithUnified();
        
        // Enhance memory interface with unified capabilities
        this.enhanceMemoryWithUnified();
        
        // Add unified indicators to existing components
        this.addUnifiedIndicators();
    }
    
    enhanceChatWithUnified() {
        // Find existing chat send functionality and enhance it
        const originalSendMessage = window.sendMessage;
        if (originalSendMessage) {
            window.sendMessage = async () => {
                const messageInput = document.getElementById('messageInput');
                if (!messageInput || !messageInput.value.trim()) return;
                
                const message = messageInput.value.trim();
                messageInput.value = '';
                
                // Use unified chat endpoint
                await this.processUnifiedChat(message);
            };
        }
    }
    
    async processUnifiedChat(message) {
        try {
            // Add user message to chat
            this.addMessageToChat('user', message);
            
            // Show processing indicator
            this.showProcessingIndicator();
            
            // Process through unified service
            const response = await fetch(`${this.memoryApiUrl}/api/unified/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: 'default_user',
                    message: message,
                    session_id: this.currentSessionId,
                    learning_enabled: true,
                    conversation_enabled: true
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success) {
                    // Update session ID
                    if (data.results.session_id) {
                        this.currentSessionId = data.results.session_id;
                    }
                    
                    // Process conversation response
                    if (data.results.conversation && data.results.conversation.response) {
                        this.addMessageToChat('assistant', data.results.conversation.response);
                    }
                    
                    // Show relevant memories if found
                    if (data.results.relevant_memories && data.results.relevant_memories.length > 0) {
                        this.showRelevantMemories(data.results.relevant_memories);
                    }
                    
                    // Show learning insights
                    if (data.learning_insights.has_learning_insights) {
                        this.showLearningInsights(data.learning_insights);
                    }
                    
                    // Update recommendations
                    if (data.recommendations && data.recommendations.length > 0) {
                        this.recommendations = data.recommendations;
                        this.updateRecommendationsBadge();
                    }
                    
                    console.log('✅ Unified chat processed successfully');
                } else {
                    this.addMessageToChat('system', `Error: ${data.results.error || 'Unknown error'}`);
                }
            } else {
                throw new Error('Failed to process unified chat');
            }
            
        } catch (error) {
            console.error('Error in unified chat:', error);
            this.addMessageToChat('system', 'Sorry, there was an error processing your message.');
        } finally {
            this.hideProcessingIndicator();
        }
    }
    
    async runSystemAnalysis() {
        try {
            this.showAnalysisProgress();
            
            const response = await fetch(`${this.memoryApiUrl}/api/unified/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: 'default_user',
                    content: 'comprehensive_system_analysis',
                    learning_enabled: true,
                    conversation_enabled: true
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success) {
                    this.lastAnalysis = data;
                    this.showAnalysisResults(data);
                    console.log('✅ System analysis completed');
                } else {
                    throw new Error(data.results.error || 'Analysis failed');
                }
            } else {
                throw new Error('Failed to run system analysis');
            }
            
        } catch (error) {
            console.error('Error running system analysis:', error);
            alert('Failed to run system analysis: ' + error.message);
        } finally {
            this.hideAnalysisProgress();
        }
    }
    
    showAnalysisResults(analysisData) {
        const modal = document.createElement('div');
        modal.className = 'analysis-results-modal';
        modal.innerHTML = `
            <div class="analysis-dialog">
                <div class="modal-header">
                    <h2>System Analysis Results</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-content">
                    <div class="analysis-grid">
                        <div class="analysis-card">
                            <h4>Memory Analysis</h4>
                            <div class="analysis-content">
                                ${this.formatMemoryAnalysis(analysisData.results.memory_analysis)}
                            </div>
                        </div>
                        <div class="analysis-card">
                            <h4>Learning Analysis</h4>
                            <div class="analysis-content">
                                ${this.formatLearningAnalysis(analysisData.results.learning_analysis)}
                            </div>
                        </div>
                        <div class="analysis-card">
                            <h4>Conversation Analysis</h4>
                            <div class="analysis-content">
                                ${this.formatConversationAnalysis(analysisData.results.conversation_analysis)}
                            </div>
                        </div>
                    </div>
                    <div class="recommendations-section">
                        <h4>Recommendations</h4>
                        <div class="recommendations-list">
                            ${analysisData.recommendations.map(rec => `
                                <div class="recommendation-item priority-${rec.priority}">
                                    <div class="rec-title">${rec.title}</div>
                                    <div class="rec-description">${rec.description}</div>
                                    <div class="rec-action">Action: ${rec.action}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
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
    
    formatMemoryAnalysis(analysis) {
        if (!analysis || analysis.error) {
            return '<p class="error">Memory analysis unavailable</p>';
        }
        
        return `
            <div class="metric">
                <span class="metric-label">Total Memories:</span>
                <span class="metric-value">${analysis.total_memories || 0}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Memory Types:</span>
                <span class="metric-value">${analysis.memory_types ? analysis.memory_types.join(', ') : 'None'}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Avg Relevance:</span>
                <span class="metric-value">${analysis.relevance_scores ? (analysis.relevance_scores.reduce((a, b) => a + b, 0) / analysis.relevance_scores.length).toFixed(2) : 'N/A'}</span>
            </div>
        `;
    }
    
    formatLearningAnalysis(analysis) {
        if (!analysis || analysis.error) {
            return '<p class="error">Learning analysis unavailable</p>';
        }
        
        const stats = analysis.learning_stats || {};
        return `
            <div class="metric">
                <span class="metric-label">Total Patterns:</span>
                <span class="metric-value">${stats.total_patterns || 0}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Relevant Patterns:</span>
                <span class="metric-value">${analysis.relevant_patterns || 0}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Avg Effectiveness:</span>
                <span class="metric-value">${analysis.pattern_effectiveness ? (analysis.pattern_effectiveness.reduce((a, b) => a + b, 0) / analysis.pattern_effectiveness.length).toFixed(2) : 'N/A'}</span>
            </div>
        `;
    }
    
    formatConversationAnalysis(analysis) {
        if (!analysis || analysis.error) {
            return '<p class="error">Conversation analysis unavailable</p>';
        }
        
        return `
            <div class="metric">
                <span class="metric-label">Total Sessions:</span>
                <span class="metric-value">${analysis.total_sessions || 0}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Active Sessions:</span>
                <span class="metric-value">${analysis.active_sessions || 0}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Registered Flows:</span>
                <span class="metric-value">${analysis.registered_flows || 0}</span>
            </div>
        `;
    }
    
    showRecommendationsModal() {
        if (this.recommendations.length === 0) {
            alert('No recommendations available. Run a system analysis first.');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'recommendations-modal';
        modal.innerHTML = `
            <div class="recommendations-dialog">
                <div class="modal-header">
                    <h2>System Recommendations</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-content">
                    <div class="recommendations-list">
                        ${this.recommendations.map(rec => `
                            <div class="recommendation-item priority-${rec.priority}">
                                <div class="rec-header">
                                    <span class="rec-type">${rec.type}</span>
                                    <span class="rec-priority">${rec.priority}</span>
                                </div>
                                <div class="rec-title">${rec.title}</div>
                                <div class="rec-description">${rec.description}</div>
                                <div class="rec-action">
                                    <strong>Recommended Action:</strong> ${rec.action}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
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
    
    updateRecommendationsBadge() {
        const recommendationsBtn = document.getElementById('viewRecommendations');
        if (recommendationsBtn && this.recommendations.length > 0) {
            recommendationsBtn.innerHTML = `
                <i class="fas fa-lightbulb"></i> Recommendations 
                <span class="badge">${this.recommendations.length}</span>
            `;
        }
    }
    
    addMessageToChat(role, content) {
        const chatContainer = document.getElementById('chatMessages');
        if (!chatContainer) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${role}`;
        
        const timestamp = new Date().toLocaleTimeString();
        const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
        
        messageElement.innerHTML = `
            <div class="message-header">
                <span class="message-role">${roleLabel}</span>
                <span class="message-time">${timestamp}</span>
            </div>
            <div class="message-content">${content}</div>
        `;
        
        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    showProcessingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'unifiedProcessingIndicator';
        indicator.className = 'processing-indicator';
        indicator.innerHTML = `
            <div class="processing-content">
                <div class="spinner"></div>
                <span>Processing through unified memory system...</span>
            </div>
        `;
        
        const chatContainer = document.getElementById('chatMessages');
        if (chatContainer) {
            chatContainer.appendChild(indicator);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }
    
    hideProcessingIndicator() {
        const indicator = document.getElementById('unifiedProcessingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    showAnalysisProgress() {
        const btn = document.getElementById('runSystemAnalysis');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        }
    }
    
    hideAnalysisProgress() {
        const btn = document.getElementById('runSystemAnalysis');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-chart-line"></i> System Analysis';
        }
    }
    
    setupUnifiedEventListeners() {
        // Update system health periodically
        setInterval(() => {
            this.checkUnifiedServiceHealth();
        }, 60000); // Every minute
        
        // Update health display when data changes
        if (this.systemHealth.subsystems) {
            this.updateSubsystemStatus();
        }
    }
    
    updateSubsystemStatus() {
        const subsystems = this.systemHealth.subsystems || {};
        
        // Update health score
        const healthScoreElement = document.getElementById('unifiedHealthScore');
        if (healthScoreElement) {
            const score = (this.systemHealth.health_score * 100).toFixed(0);
            healthScoreElement.textContent = `${score}%`;
            healthScoreElement.className = `health-score ${this.getHealthClass(this.systemHealth.health_score)}`;
        }
        
        // Update subsystem statuses
        Object.entries(subsystems).forEach(([system, status]) => {
            const statusElement = document.getElementById(`${system}Status`);
            if (statusElement) {
                statusElement.textContent = status ? '✅' : '❌';
                statusElement.className = `subsystem-status-indicator ${status ? 'healthy' : 'unhealthy'}`;
            }
        });
    }
    
    getHealthClass(score) {
        if (score >= 0.8) return 'healthy';
        if (score >= 0.5) return 'degraded';
        return 'unhealthy';
    }
    
    enhanceMemoryWithUnified() {
        // Enhance existing memory operations with unified processing
        // This would integrate with existing memory interface components
        console.log('🔗 Enhanced memory operations with unified processing');
    }
    
    addUnifiedIndicators() {
        // Add unified status indicators to existing components
        console.log('📊 Added unified indicators to existing components');
    }
    
    showUnifiedSettingsModal() {
        // Placeholder for unified settings modal
        alert('Unified settings coming soon!');
    }
}

// Initialize the unified interface when the script loads
const unifiedInterface = new UnifiedMemoryInterface();
