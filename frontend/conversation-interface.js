/**
 * Conversation Interface for Metatron Memory System
 * Provides RASA-inspired conversation management and agent orchestration
 * Integrates with memory and learning systems for intelligent dialogues
 */

class ConversationInterface {
    constructor() {
        this.memoryApiUrl = 'http://localhost:5006';
        this.currentSessionId = null;
        this.conversationState = 'idle';
        this.activeFlow = null;
        this.registeredAgents = [];
        this.conversationStats = {};
        
        this.init();
    }
    
    async init() {
        console.log('🎭 Initializing Conversation Interface...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupConversationFeatures());
        } else {
            this.setupConversationFeatures();
        }
        
        // Check conversation service health
        await this.checkConversationServiceHealth();
    }
    
    setupConversationFeatures() {
        // Enhance chat interface with conversation management
        this.enhanceChatInterface();
        
        // Add conversation controls panel
        this.createConversationControlsPanel();
        
        // Setup conversation event listeners
        this.setupConversationEventListeners();
        
        console.log('✅ Conversation interface features setup complete');
    }
    
    async checkConversationServiceHealth() {
        try {
            const response = await fetch(`${this.memoryApiUrl}/api/conversation/health`);
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Conversation service is healthy:', data);
                this.conversationStats = data.conversation_stats || {};
                this.updateConversationStatusIndicator(true);
                
                // Load registered agents
                await this.loadRegisteredAgents();
                return true;
            } else {
                console.warn('⚠️ Conversation service health check failed');
                this.updateConversationStatusIndicator(false);
                return false;
            }
        } catch (error) {
            console.error('❌ Conversation service not available:', error);
            this.updateConversationStatusIndicator(false);
            return false;
        }
    }
    
    updateConversationStatusIndicator(isHealthy) {
        // Update brain button to show conversation status
        const brainBtn = document.getElementById('brainMemoryBtn');
        if (brainBtn) {
            if (isHealthy) {
                brainBtn.classList.add('conversation-active');
                brainBtn.title = 'Memory System - Conversation Management Active';
            } else {
                brainBtn.classList.remove('conversation-active');
            }
        }
    }
    
    enhanceChatInterface() {
        // Add conversation state indicator to chat
        const chatContainer = document.getElementById('chatMessages');
        if (chatContainer) {
            const stateIndicator = document.createElement('div');
            stateIndicator.id = 'conversationStateIndicator';
            stateIndicator.className = 'conversation-state-indicator';
            stateIndicator.innerHTML = `
                <div class="state-display">
                    <span class="state-label">Conversation:</span>
                    <span class="state-value" id="currentConversationState">Idle</span>
                </div>
                <div class="flow-display" id="currentFlowDisplay" style="display: none;">
                    <span class="flow-label">Flow:</span>
                    <span class="flow-value" id="currentFlowName"></span>
                </div>
            `;
            
            chatContainer.parentNode.insertBefore(stateIndicator, chatContainer);
        }
        
        // Intercept chat messages to use conversation management
        this.interceptChatMessages();
    }
    
    interceptChatMessages() {
        // Find the chat send function and enhance it
        const sendButton = document.querySelector('#sendBtn, .send-button, [onclick*="sendMessage"]');
        if (sendButton) {
            const originalOnClick = sendButton.onclick;
            sendButton.onclick = async (e) => {
                e.preventDefault();
                await this.handleConversationMessage();
            };
        }
        
        // DISABLED: Do not intercept main chat - it has its own system
        // The conversation interface should only work if there's a dedicated chatMessages container
        const chatContainer = document.getElementById('chatMessages');
        if (chatContainer) {
            const chatInput = document.querySelector('#messageInput, .chat-input');
            if (chatInput && !chatInput.classList.contains('text-input')) {
                chatInput.addEventListener('keypress', async (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        await this.handleConversationMessage();
                    }
                });
            }
        }
    }
    
    async handleConversationMessage() {
        // Only work if chatMessages container exists and input is not the main chat
        const chatContainer = document.getElementById('chatMessages');
        if (!chatContainer) return;

        const chatInput = document.querySelector('#messageInput, .chat-input');
        if (!chatInput || !chatInput.value.trim() || chatInput.classList.contains('text-input')) return;
        
        const message = chatInput.value.trim();
        chatInput.value = '';
        
        // Add user message to chat
        this.addMessageToChat('user', message);
        
        try {
            // Start or continue conversation
            if (!this.currentSessionId) {
                await this.startConversation(message);
            } else {
                await this.processConversationMessage(message);
            }
        } catch (error) {
            console.error('Error handling conversation message:', error);
            this.addMessageToChat('system', 'Sorry, there was an error processing your message.');
        }
    }
    
    async startConversation(message) {
        try {
            const response = await fetch(`${this.memoryApiUrl}/api/conversation/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: 'default_user',
                    message: message
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.currentSessionId = data.session_id;
                this.conversationState = data.current_state;
                
                console.log('✅ Started conversation:', this.currentSessionId);
                this.updateConversationStateDisplay();
                
                // Process the initial message
                await this.processConversationMessage(message);
            } else {
                throw new Error('Failed to start conversation');
            }
        } catch (error) {
            console.error('Error starting conversation:', error);
            throw error;
        }
    }
    
    async processConversationMessage(message) {
        try {
            const response = await fetch(`${this.memoryApiUrl}/api/conversation/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: this.currentSessionId,
                    message: message,
                    message_type: 'user'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                const result = data.result;
                
                if (result.success) {
                    // Update conversation state
                    this.conversationState = result.next_state || this.conversationState;
                    this.activeFlow = result.flow_used || this.activeFlow;
                    
                    // Add AI response to chat
                    if (result.response) {
                        this.addMessageToChat('assistant', result.response);
                    }
                    
                    // Handle special result types
                    if (result.memory_result) {
                        this.handleMemoryResult(result.memory_result);
                    }
                    
                    if (result.agent_result) {
                        this.handleAgentResult(result.agent_result);
                    }
                    
                    if (result.flow_completed) {
                        this.handleFlowCompletion(result);
                    }
                    
                    this.updateConversationStateDisplay();
                    console.log('✅ Processed conversation message');
                } else {
                    this.addMessageToChat('system', `Error: ${result.error}`);
                }
            } else {
                throw new Error('Failed to process conversation message');
            }
        } catch (error) {
            console.error('Error processing conversation message:', error);
            throw error;
        }
    }
    
    handleMemoryResult(memoryResult) {
        console.log('🧠 Memory result:', memoryResult);
        
        if (memoryResult.results && memoryResult.results.length > 0) {
            const memoryInfo = `Found ${memoryResult.results.length} relevant memories in ${memoryResult.brain_region}`;
            this.addMessageToChat('system', memoryInfo);
        }
    }
    
    handleAgentResult(agentResult) {
        console.log('🤖 Agent result:', agentResult);
        
        const agentInfo = `Agent ${agentResult.agent_name} responded: ${agentResult.response}`;
        this.addMessageToChat('agent', agentInfo);
    }
    
    handleFlowCompletion(result) {
        console.log('✅ Flow completed:', result);
        
        this.activeFlow = null;
        const completionMessage = `Completed flow: ${result.flow_name} (${result.duration}s)`;
        this.addMessageToChat('system', completionMessage);
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
    
    updateConversationStateDisplay() {
        const stateElement = document.getElementById('currentConversationState');
        const flowDisplay = document.getElementById('currentFlowDisplay');
        const flowNameElement = document.getElementById('currentFlowName');
        
        if (stateElement) {
            stateElement.textContent = this.conversationState || 'Idle';
            stateElement.className = `state-value state-${this.conversationState}`;
        }
        
        if (flowDisplay && flowNameElement) {
            if (this.activeFlow) {
                flowDisplay.style.display = 'block';
                flowNameElement.textContent = this.activeFlow;
            } else {
                flowDisplay.style.display = 'none';
            }
        }
    }
    
    createConversationControlsPanel() {
        // Add conversation controls to the right panel
        const rightPanel = document.querySelector('.right-panel');
        if (rightPanel) {
            const controlsPanel = document.createElement('div');
            controlsPanel.className = 'conversation-controls-panel';
            controlsPanel.innerHTML = `
                <div class="panel-section">
                    <h3><i class="fas fa-comments"></i> Conversation</h3>
                    <div class="conversation-info">
                        <div class="info-item">
                            <span class="info-label">Session:</span>
                            <span class="info-value" id="sessionIdDisplay">None</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">State:</span>
                            <span class="info-value" id="stateDisplay">Idle</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Agents:</span>
                            <span class="info-value" id="agentCountDisplay">0</span>
                        </div>
                    </div>
                    <div class="conversation-actions">
                        <button id="viewConversationFlows" class="btn-secondary">View Flows</button>
                        <button id="viewRegisteredAgents" class="btn-secondary">View Agents</button>
                        <button id="resetConversation" class="btn-secondary">Reset Session</button>
                    </div>
                </div>
            `;
            
            rightPanel.appendChild(controlsPanel);
            
            // Add event listeners for controls
            document.getElementById('viewConversationFlows').addEventListener('click', () => {
                this.showConversationFlowsModal();
            });
            
            document.getElementById('viewRegisteredAgents').addEventListener('click', () => {
                this.showRegisteredAgentsModal();
            });
            
            document.getElementById('resetConversation').addEventListener('click', () => {
                this.resetConversation();
            });
        }
    }
    
    async loadRegisteredAgents() {
        try {
            const response = await fetch(`${this.memoryApiUrl}/api/conversation/agents`);
            if (response.ok) {
                const data = await response.json();
                this.registeredAgents = data.agents || [];
                
                // Update agent count display
                const agentCountElement = document.getElementById('agentCountDisplay');
                if (agentCountElement) {
                    agentCountElement.textContent = this.registeredAgents.length;
                }
                
                console.log(`✅ Loaded ${this.registeredAgents.length} registered agents`);
            }
        } catch (error) {
            console.error('Error loading registered agents:', error);
        }
    }
    
    async showConversationFlowsModal() {
        try {
            const response = await fetch(`${this.memoryApiUrl}/api/conversation/flows`);
            if (response.ok) {
                const data = await response.json();
                const flows = data.flows || [];
                
                this.createFlowsModal(flows);
            }
        } catch (error) {
            console.error('Error loading conversation flows:', error);
        }
    }
    
    createFlowsModal(flows) {
        const modal = document.createElement('div');
        modal.className = 'conversation-flows-modal';
        modal.innerHTML = `
            <div class="flows-dialog">
                <div class="modal-header">
                    <h2>Conversation Flows</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-content">
                    <div class="flows-list">
                        ${flows.map(flow => `
                            <div class="flow-item">
                                <div class="flow-header">
                                    <h4>${flow.flow_name}</h4>
                                    <span class="flow-type">${flow.flow_type}</span>
                                </div>
                                <div class="flow-description">${flow.description}</div>
                                <div class="flow-details">
                                    <span class="flow-steps">Steps: ${flow.step_count}</span>
                                    <span class="flow-duration">Duration: ${flow.expected_duration}s</span>
                                    <span class="flow-regions">Regions: ${flow.brain_regions.join(', ')}</span>
                                </div>
                                <div class="flow-triggers">
                                    <strong>Triggers:</strong> ${flow.trigger_patterns.join(', ')}
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
    
    showRegisteredAgentsModal() {
        const modal = document.createElement('div');
        modal.className = 'registered-agents-modal';
        modal.innerHTML = `
            <div class="agents-dialog">
                <div class="modal-header">
                    <h2>Registered Agents</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-content">
                    <div class="agents-list">
                        ${this.registeredAgents.map(agent => `
                            <div class="agent-item">
                                <div class="agent-header">
                                    <h4>${agent.name}</h4>
                                    <span class="agent-status">${agent.status || 'Available'}</span>
                                </div>
                                <div class="agent-description">${agent.description}</div>
                                <div class="agent-skills">
                                    <strong>Skills:</strong> ${agent.skills.map(skill => skill.name || skill.id).join(', ')}
                                </div>
                                <div class="agent-modes">
                                    <span class="input-modes">Input: ${agent.input_modes.join(', ')}</span>
                                    <span class="output-modes">Output: ${agent.output_modes.join(', ')}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    ${this.registeredAgents.length === 0 ? '<p class="no-agents">No agents registered</p>' : ''}
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
    
    resetConversation() {
        this.currentSessionId = null;
        this.conversationState = 'idle';
        this.activeFlow = null;
        
        // Update displays
        this.updateConversationStateDisplay();
        
        const sessionDisplay = document.getElementById('sessionIdDisplay');
        const stateDisplay = document.getElementById('stateDisplay');
        
        if (sessionDisplay) sessionDisplay.textContent = 'None';
        if (stateDisplay) stateDisplay.textContent = 'Idle';
        
        console.log('🔄 Conversation session reset');
    }
    
    setupConversationEventListeners() {
        // Update conversation info periodically
        setInterval(() => {
            if (this.currentSessionId) {
                this.updateConversationInfo();
            }
        }, 30000); // Every 30 seconds
        
        // Update session display when session changes
        if (this.currentSessionId) {
            const sessionDisplay = document.getElementById('sessionIdDisplay');
            if (sessionDisplay) {
                sessionDisplay.textContent = this.currentSessionId.substring(0, 8) + '...';
            }
        }
    }
    
    async updateConversationInfo() {
        try {
            if (!this.currentSessionId) return;
            
            const response = await fetch(`${this.memoryApiUrl}/api/conversation/session/${this.currentSessionId}`);
            if (response.ok) {
                const data = await response.json();
                const session = data.session;
                
                this.conversationState = session.current_state;
                this.activeFlow = session.current_flow;
                
                this.updateConversationStateDisplay();
                
                const stateDisplay = document.getElementById('stateDisplay');
                if (stateDisplay) {
                    stateDisplay.textContent = this.conversationState;
                }
            }
        } catch (error) {
            console.error('Error updating conversation info:', error);
        }
    }
}

// Initialize the conversation interface when the script loads
const conversationInterface = new ConversationInterface();
