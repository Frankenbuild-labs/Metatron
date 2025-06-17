// Tab switching functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tab switching for left navigation
    const leftTabBtns = document.querySelectorAll('.left-nav .tab-btn');
    const leftTabContents = document.querySelectorAll('.left-nav .tab-content');
    
    leftTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            leftTabBtns.forEach(b => b.classList.remove('active'));
            leftTabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            btn.classList.add('active');
            document.getElementById(tabName + '-content').classList.add('active');
        });
    });
    
    // Initialize tab switching for right navigation
    const rightTabBtns = document.querySelectorAll('.right-nav .tab-btn');
    const rightTabContents = document.querySelectorAll('.right-nav .tab-content');
    
    rightTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            rightTabBtns.forEach(b => b.classList.remove('active'));
            rightTabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            btn.classList.add('active');
            document.getElementById(tabName + '-content').classList.add('active');
        });
    });
    
    // Settings Modal functionality
    const settingsBtn = document.querySelector('.settings-btn');
    const settingsModal = document.getElementById('settingsModal');
    const settingsCloseBtn = document.getElementById('settingsCloseBtn');

    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            settingsModal.classList.add('active');
        });
    }

    if (settingsCloseBtn) {
        settingsCloseBtn.addEventListener('click', () => {
            settingsModal.classList.remove('active');
        });
    }

    // Close modal when clicking outside
    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.classList.remove('active');
            }
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && settingsModal.classList.contains('active')) {
            settingsModal.classList.remove('active');
        }
    });

    // Chat input functionality
    const textInput = document.querySelector('.text-input');
    const sendBtn = document.querySelector('.btn-send');
    const messagesContainer = document.querySelector('.messages');
    
    function sendMessage() {
        const message = textInput.value.trim();
        if (message) {
            // Add user message
            addMessage(message, 'user');
            textInput.value = '';
            
            // Simulate AI response (you can replace this with actual API call)
            setTimeout(() => {
                addMessage('This is a simulated response. Your frontend is working!', 'assistant');
            }, 1000);
        }
    }
    
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = text;
        
        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Send message on button click
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    // Send message on Enter key (but allow Shift+Enter for new lines)
    if (textInput) {
        textInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    // Navigation button functionality
    const navButtons = document.querySelectorAll('.nav-button');
    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const buttonText = button.querySelector('span').textContent;
            
            // Handle different navigation buttons
            switch(buttonText) {
                case 'Creative Studio':
                    openCreativeStudio();
                    break;
                case 'Agent/Flow Builder':
                    console.log('Agent/Flow Builder clicked');
                    break;
                case 'Social Station':
                    console.log('Social Station clicked');
                    break;
                case 'App/Web Builder':
                    console.log('App/Web Builder clicked');
                    break;
                case 'Model Training':
                    console.log('Model Training clicked');
                    break;
                case 'Video Meeting':
                    openVideoMeeting();
                    break;
                default:
                    console.log(`${buttonText} clicked`);
            }
        });
    });
    
    // Temperature slider functionality (in settings modal)
    const tempSlider = document.getElementById('temperatureSlider');
    const tempValue = document.getElementById('temperatureValue');

    if (tempSlider && tempValue) {
        tempSlider.addEventListener('input', (e) => {
            tempValue.textContent = e.target.value;
        });
    }

    // Settings form handling
    const settingsInputs = {
        aiModel: document.getElementById('aiModelSelect'),
        temperature: document.getElementById('temperatureSlider'),
        codeExecution: document.getElementById('codeExecutionToggle'),
        googleSearch: document.getElementById('googleSearchToggle'),
        voice: document.getElementById('voiceSelect'),
        language: document.getElementById('languageSelect'),
        voiceOutput: document.getElementById('voiceOutputToggle')
    };

    // Add event listeners to all settings
    Object.entries(settingsInputs).forEach(([key, element]) => {
        if (element) {
            const eventType = element.type === 'checkbox' ? 'change' :
                             element.type === 'range' ? 'input' : 'change';

            element.addEventListener(eventType, (e) => {
                const value = element.type === 'checkbox' ? e.target.checked : e.target.value;
                console.log(`Setting ${key} changed to:`, value);

                // Here you can save settings to localStorage or send to backend
                localStorage.setItem(`setting_${key}`, value);
            });
        }
    });

    // Load saved settings on page load
    Object.entries(settingsInputs).forEach(([key, element]) => {
        if (element) {
            const savedValue = localStorage.getItem(`setting_${key}`);
            if (savedValue !== null) {
                if (element.type === 'checkbox') {
                    element.checked = savedValue === 'true';
                } else {
                    element.value = savedValue;
                    // Update temperature display if it's the temperature slider
                    if (key === 'temperature' && tempValue) {
                        tempValue.textContent = savedValue;
                    }
                }
            }
        }
    });
    
    // Toggle functionality
    const toggles = document.querySelectorAll('.toggle-input');
    toggles.forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            const label = e.target.closest('.setting-row').querySelector('.setting-label').textContent;
            console.log(`${label} toggled:`, e.target.checked);
        });
    });
    
    // Model select functionality
    const modelSelects = document.querySelectorAll('.model-select');
    modelSelects.forEach(select => {
        select.addEventListener('change', (e) => {
            const label = e.target.closest('.setting-row').querySelector('.setting-label').textContent;
            console.log(`${label} changed to:`, e.target.value);
        });
    });
    
    // Creative Studio functionality
    initializeCreativeStudio();

    // Video Meeting functionality
    initializeVideoMeeting();

    console.log('Metatraon Frontend initialized successfully!');
});

// Creative Studio Functions
function openCreativeStudio() {
    const modal = document.getElementById('creativeStudioModal');
    if (modal) {
        modal.classList.add('active');

        // Hide right panel by default (since Editor mode is default)
        const rightPanel = document.querySelector('.studio-right-panel');
        if (rightPanel) {
            rightPanel.style.display = 'none';
            rightPanel.style.visibility = 'hidden';
        }

        // Initialize Motionity editor if in editor mode
        const editorMode = document.getElementById('editorMode');
        if (editorMode && editorMode.classList.contains('active')) {
            initializeMotionityEditor();
        }
    }
}

function closeCreativeStudio() {
    const modal = document.getElementById('creativeStudioModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function initializeCreativeStudio() {
    // Close button
    const closeBtn = document.getElementById('closeStudioBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeCreativeStudio);
    }

    // Mode switching
    const modeTabs = document.querySelectorAll('.mode-tab');
    const contentModes = document.querySelectorAll('.content-mode');
    const rightPanel = document.querySelector('.studio-right-panel');

    modeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const mode = tab.id.replace('ModeBtn', '');

            // Update active tab
            modeTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update active content
            contentModes.forEach(content => content.classList.remove('active'));
            const targetMode = document.getElementById(mode + 'Mode');
            if (targetMode) {
                targetMode.classList.add('active');
            }

            // Show/hide right panel based on mode
            if (mode === 'editor') {
                if (rightPanel) {
                    rightPanel.style.display = 'none';
                    rightPanel.style.visibility = 'hidden';
                }
                initializeMotionityEditor();
            } else {
                if (rightPanel) {
                    rightPanel.style.display = 'flex';
                    rightPanel.style.visibility = 'visible';
                }
            }
        });
    });

    // Generator mode selectors
    const modeSelectors = document.querySelectorAll('.mode-selector');
    const modeControls = document.querySelectorAll('.mode-controls');

    modeSelectors.forEach(selector => {
        selector.addEventListener('click', () => {
            const mode = selector.getAttribute('data-mode');

            // Update active selector
            modeSelectors.forEach(s => s.classList.remove('active'));
            selector.classList.add('active');

            // Update active controls
            modeControls.forEach(control => {
                control.style.display = 'none';
                control.classList.remove('active');
            });

            const targetControl = document.querySelector(`[data-mode="${mode}"]`);
            if (targetControl && targetControl.classList.contains('mode-controls')) {
                targetControl.style.display = 'block';
                targetControl.classList.add('active');
            }
        });
    });

    // Generation buttons
    const generateImageBtn = document.getElementById('generateImageBtn');
    const generateVideoBtn = document.getElementById('generateVideoBtn');

    if (generateImageBtn) {
        generateImageBtn.addEventListener('click', generateImage);
    }

    if (generateVideoBtn) {
        generateVideoBtn.addEventListener('click', generateVideo);
    }

    // Size presets
    const sizePresets = document.querySelectorAll('.size-preset');
    sizePresets.forEach(preset => {
        preset.addEventListener('click', () => {
            const width = preset.getAttribute('data-width');
            const height = preset.getAttribute('data-height');

            const widthInput = document.getElementById('canvasWidth');
            const heightInput = document.getElementById('canvasHeight');

            if (widthInput) widthInput.value = width;
            if (heightInput) heightInput.value = height;
        });
    });

    // Slider controls
    const sliders = ['creativity', 'detail', 'motion'];
    sliders.forEach(sliderName => {
        const slider = document.getElementById(sliderName + 'Slider');
        const value = document.getElementById(sliderName + 'Value');

        if (slider && value) {
            slider.addEventListener('input', (e) => {
                value.textContent = e.target.value;
            });
        }
    });

    // Style presets
    const stylePresets = document.querySelectorAll('.style-preset');
    stylePresets.forEach(preset => {
        preset.addEventListener('click', () => {
            const style = preset.getAttribute('data-style');
            console.log('Style preset selected:', style);
            // Add style to prompt or apply style settings
        });
    });
}

function initializeMotionityEditor() {
    console.log('🔧 Initializing custom Motionity editor...');

    const iframe = document.getElementById('motionityEditor');
    const loading = document.querySelector('.editor-loading');

    if (!iframe || !loading) {
        console.error('❌ Required elements not found!', { iframe, loading });
        return;
    }

    if (!iframe.src) {
        // Show loading
        loading.style.display = 'flex';
        iframe.style.display = 'none';

        // Update loading text
        const loadingText = loading.querySelector('h3');
        const loadingDesc = loading.querySelector('p');
        if (loadingText) loadingText.textContent = 'Loading Custom Motionity Editor...';
        if (loadingDesc) loadingDesc.textContent = 'Initializing your custom video editing workspace';

        // Load your custom Motionity editor
        setTimeout(() => {
            console.log('🌐 Loading custom Motionity editor from creative studio folder...');

            // Use your custom Motionity editor (URL encoded for spaces)
            iframe.src = 'creative%20studio/src/index.html';

            iframe.onload = () => {
                console.log('✅ Custom Motionity editor loaded successfully');
                loading.style.display = 'none';
                iframe.style.display = 'block';
            };

            // Just show the iframe immediately - it's working
            setTimeout(() => {
                console.log('✅ Showing Motionity editor');
                loading.style.display = 'none';
                iframe.style.display = 'block';
            }, 2000);

        }, 1000);
    } else {
        // Editor already loaded, just show it
        console.log('✅ Custom Motionity editor already loaded');
        loading.style.display = 'none';
        iframe.style.display = 'block';
    }
}

function showMotionityFallback(loading, iframe) {
    loading.innerHTML = `
        <div style="text-align: center; color: var(--text-primary); max-width: 500px;">
            <i class="fas fa-video" style="font-size: 48px; color: var(--accent-primary); margin-bottom: 20px;"></i>
            <h3 style="margin-bottom: 16px;">Custom Motionity Video Editor</h3>
            <p style="margin-bottom: 20px; color: var(--text-secondary);">
                Your custom Motionity editor couldn't load. This may be due to file path issues.
            </p>
            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                <button onclick="tryLoadMotionity()" style="
                    padding: 12px 24px;
                    background: var(--accent-primary);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    cursor: pointer;
                    font-weight: 500;
                ">
                    <i class="fas fa-refresh"></i> Retry Loading
                </button>
                <button onclick="openMotionityInNewTab()" style="
                    padding: 12px 24px;
                    background: var(--bg-tertiary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    color: var(--text-primary);
                    cursor: pointer;
                    font-weight: 500;
                ">
                    <i class="fas fa-external-link-alt"></i> Open Separately
                </button>
            </div>
            <div style="margin-top: 20px; padding: 16px; background: var(--bg-tertiary); border-radius: 8px; font-size: 12px; color: var(--text-secondary);">
                <strong>Custom Editor Path:</strong><br>
                • Loading from: creative studio/src/index.html<br>
                • Your customized Motionity editor<br>
                • Full video editing capabilities<br>
                • Integrated with AI generation features
            </div>
        </div>
    `;
    loading.style.display = 'flex';
    iframe.style.display = 'none';
}

// Helper functions for Motionity fallback
function tryLoadMotionity() {
    const iframe = document.getElementById('motionityEditor');
    const loading = document.querySelector('.editor-loading');

    if (iframe) {
        iframe.src = '';
        setTimeout(() => {
            initializeMotionityEditor();
        }, 500);
    }
}

function openMotionityInNewTab() {
    window.open('creative%20studio/src/index.html', '_blank');
}

function generateImage() {
    const prompt = document.getElementById('imagePrompt').value;
    const progress = document.getElementById('imageProgress');
    const preview = document.getElementById('imagePreview');

    if (!prompt.trim()) {
        alert('Please enter a prompt for image generation');
        return;
    }

    // Show progress
    progress.style.display = 'block';

    // Simulate generation process
    console.log('Generating image with prompt:', prompt);

    // Here you would integrate with your actual AI service
    setTimeout(() => {
        progress.style.display = 'none';

        // Show placeholder result
        preview.innerHTML = `
            <div style="text-align: center; color: var(--text-primary);">
                <i class="fas fa-image" style="font-size: 48px; color: var(--accent-primary); margin-bottom: 16px;"></i>
                <h3>Image Generated!</h3>
                <p>Prompt: "${prompt}"</p>
                <p style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
                    This is a placeholder. Integrate with your AI service for actual generation.
                </p>
            </div>
        `;
    }, 3000);
}

function generateVideo() {
    const prompt = document.getElementById('videoPrompt').value;
    const progress = document.getElementById('videoProgress');
    const preview = document.getElementById('videoPreview');

    if (!prompt.trim()) {
        alert('Please enter a prompt for video generation');
        return;
    }

    // Show progress
    progress.style.display = 'block';

    // Simulate generation process
    console.log('Generating video with prompt:', prompt);

    // Here you would integrate with your actual AI service
    setTimeout(() => {
        progress.style.display = 'none';

        // Show placeholder result
        preview.innerHTML = `
            <div style="text-align: center; color: var(--text-primary);">
                <i class="fas fa-video" style="font-size: 48px; color: var(--accent-primary); margin-bottom: 16px;"></i>
                <h3>Video Generated!</h3>
                <p>Prompt: "${prompt}"</p>
                <p style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
                    This is a placeholder. Integrate with your AI service for actual generation.
                </p>
            </div>
        `;
    }, 5000);
}

// Video Meeting Functions
function openVideoMeeting() {
    const modal = document.getElementById('videoMeetingModal');
    if (modal) {
        modal.classList.add('active');
        loadVideoSDK();
    }
}

function closeVideoMeeting() {
    const modal = document.getElementById('videoMeetingModal');
    if (modal) {
        modal.classList.remove('active');
        // Clean up VideoSDK instance if needed
        const content = document.getElementById('videoMeetingContent');
        if (content) {
            content.innerHTML = `
                <div class="meeting-loading">
                    <i class="fas fa-video"></i>
                    <h3>Loading Video Meeting...</h3>
                    <p>Initializing VideoSDK...</p>
                </div>
            `;
        }
    }
}

function loadVideoSDK() {
    const content = document.getElementById('videoMeetingContent');
    if (!content) return;

    // Show loading state
    content.innerHTML = `
        <div class="meeting-loading">
            <i class="fas fa-video"></i>
            <h3>Loading VideoSDK...</h3>
            <p>Initializing video meeting interface...</p>
        </div>
    `;

    // Load VideoSDK interface with AI agent controls
    setTimeout(() => {
        content.innerHTML = `
            <div class="videosdk-container">
                <div class="meeting-controls">
                    <div class="ai-agent-controls">
                        <button id="addAiAgentBtn" class="ai-agent-btn">
                            <i class="fas fa-robot"></i>
                            Add AI Agent
                        </button>
                        <button id="removeAiAgentBtn" class="ai-agent-btn" style="display: none;">
                            <i class="fas fa-robot"></i>
                            Remove AI Agent
                        </button>
                        <button id="testAiAgentBtn" class="ai-agent-btn test-btn" style="display: none;">
                            <i class="fas fa-microphone"></i>
                            Test Agent
                        </button>
                        <div class="agent-status" id="agentStatus">
                            <span class="status-indicator offline"></span>
                            <span class="status-text">AI Agent Offline</span>
                        </div>
                    </div>
                </div>
                <iframe
                    src="videosdk/index.html"
                    allow="camera; microphone; fullscreen; display-capture"
                    loading="lazy">
                </iframe>
            </div>
        `;

        // Initialize AI agent controls
        initializeAiAgentControls();
    }, 1000);
}

function initializeVideoMeeting() {
    // Close button handler
    const closeBtn = document.getElementById('closeMeetingBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeVideoMeeting);
    }

    // Close modal when clicking outside
    const modal = document.getElementById('videoMeetingModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeVideoMeeting();
            }
        });
    }
}

// AI Agent Control Functions
function initializeAiAgentControls() {
    const addBtn = document.getElementById('addAiAgentBtn');
    const removeBtn = document.getElementById('removeAiAgentBtn');
    const testBtn = document.getElementById('testAiAgentBtn');

    if (addBtn) {
        addBtn.addEventListener('click', showAiAgentConfig);
    }

    if (removeBtn) {
        removeBtn.addEventListener('click', removeAiAgent);
    }

    if (testBtn) {
        testBtn.addEventListener('click', testAiAgent);
    }

    // Check agent service status
    checkAgentServiceStatus();
}

function showAiAgentConfig() {
    // Create configuration modal
    const configModal = document.createElement('div');
    configModal.className = 'ai-agent-config-modal';
    configModal.innerHTML = `
        <div class="config-modal-content">
            <div class="config-modal-header">
                <h3><i class="fas fa-robot"></i> Configure AI Agent</h3>
                <button class="close-config-btn" onclick="closeAiAgentConfig()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="config-modal-body">
                <div class="config-section">
                    <label>Agent Voice:</label>
                    <select id="agentVoiceSelect">
                        <option value="Leda">Leda (Default)</option>
                        <option value="Charon">Charon</option>
                        <option value="Kore">Kore</option>
                        <option value="Fenrir">Fenrir</option>
                    </select>
                </div>
                <div class="config-section">
                    <label>Agent Instructions:</label>
                    <textarea id="agentInstructions" placeholder="Custom instructions for the AI agent...">You are Metatron's AI Assistant in a video meeting. Be helpful, professional, and concise in your responses.</textarea>
                </div>
                <div class="config-section">
                    <label>Meeting ID:</label>
                    <input type="text" id="meetingIdInput" placeholder="Enter meeting ID or leave blank for auto-generated">
                </div>
            </div>
            <div class="config-modal-footer">
                <button class="cancel-btn" onclick="closeAiAgentConfig()">Cancel</button>
                <button class="start-agent-btn" onclick="startAiAgent()">Start AI Agent</button>
            </div>
        </div>
    `;

    document.body.appendChild(configModal);

    // Add styles for the modal
    if (!document.getElementById('aiAgentModalStyles')) {
        const styles = document.createElement('style');
        styles.id = 'aiAgentModalStyles';
        styles.textContent = `
            .ai-agent-config-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            .config-modal-content {
                background: var(--bg-secondary);
                border-radius: 12px;
                width: 90%;
                max-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
            }
            .config-modal-header {
                padding: 20px;
                border-bottom: 1px solid var(--border-color);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .config-modal-header h3 {
                margin: 0;
                color: var(--text-primary);
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .close-config-btn {
                background: none;
                border: none;
                color: var(--text-secondary);
                cursor: pointer;
                padding: 8px;
                border-radius: 4px;
            }
            .close-config-btn:hover {
                background: var(--bg-tertiary);
                color: var(--text-primary);
            }
            .config-modal-body {
                padding: 20px;
            }
            .config-section {
                margin-bottom: 20px;
            }
            .config-section label {
                display: block;
                margin-bottom: 8px;
                color: var(--text-primary);
                font-weight: 500;
            }
            .config-section select,
            .config-section input,
            .config-section textarea {
                width: 100%;
                padding: 12px;
                border: 1px solid var(--border-color);
                border-radius: 8px;
                background: var(--bg-primary);
                color: var(--text-primary);
                font-size: 14px;
            }
            .config-section textarea {
                min-height: 80px;
                resize: vertical;
            }
            .config-modal-footer {
                padding: 20px;
                border-top: 1px solid var(--border-color);
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            }
            .cancel-btn, .start-agent-btn {
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
            }
            .cancel-btn {
                background: var(--bg-tertiary);
                color: var(--text-primary);
            }
            .start-agent-btn {
                background: var(--accent-primary);
                color: white;
            }
            .cancel-btn:hover {
                background: var(--bg-quaternary);
            }
            .start-agent-btn:hover {
                background: var(--accent-secondary);
            }
        `;
        document.head.appendChild(styles);
    }
}

function closeAiAgentConfig() {
    const modal = document.querySelector('.ai-agent-config-modal');
    if (modal) {
        modal.remove();
    }
}

async function startAiAgent() {
    const voice = document.getElementById('agentVoiceSelect').value;
    const instructions = document.getElementById('agentInstructions').value;
    let meetingId = document.getElementById('meetingIdInput').value;

    // Try to get meeting ID from VideoSDK iframe if not provided
    if (!meetingId) {
        try {
            const iframe = document.querySelector('.videosdk-container iframe');
            if (iframe && iframe.contentWindow) {
                // Try to get meeting ID from VideoSDK
                meetingId = 'metatron-meeting-' + Date.now();
            } else {
                meetingId = 'metatron-meeting-' + Date.now();
            }
        } catch (e) {
            meetingId = 'metatron-meeting-' + Date.now();
        }
    }

    try {
        // Update UI to show starting
        updateAgentStatus('connecting', 'Starting AI Agent...');

        // Get VideoSDK token from environment or generate one
        const videosdk_token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiJmYWZjY2Y3ZS0wMTQxLTQ3MzktYWMxYy0zNTNhYjY0YThhZTMiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIiwiYWxsb3dfbW9kIiwiYXNrX2pvaW4iXSwiaWF0IjoxNzUwMTE0MDAxLCJleHAiOjE3NTAyMDA0MDF9.AxmthJlFMt_82hk-9hL7qo_6LRo2GqYu8cJ-gV_l3cg';

        const response = await fetch('http://localhost:5003/agent/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                meetingId: meetingId,
                participantId: 'metatron-ai-agent-' + Date.now(),
                voice: voice,
                instructions: instructions,
                token: videosdk_token,
                apiBase: 'https://api.videosdk.live'
            })
        });

        const result = await response.json();

        if (result.success) {
            updateAgentStatus('online', 'AI Agent Active');
            showAgentControls(true);
            closeAiAgentConfig();

            // Show success message with meeting ID
            showNotification(`AI Agent started in meeting: ${meetingId}`, 'success');
        } else {
            updateAgentStatus('offline', 'AI Agent Offline');
            showNotification('Failed to start AI Agent: ' + result.message, 'error');
        }

    } catch (error) {
        console.error('Error starting AI agent:', error);
        updateAgentStatus('offline', 'AI Agent Offline');
        showNotification('Error connecting to AI Agent service', 'error');
    }
}

async function removeAiAgent() {
    try {
        updateAgentStatus('connecting', 'Stopping AI Agent...');

        const response = await fetch('http://localhost:5003/agent/stop', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            updateAgentStatus('offline', 'AI Agent Offline');
            showAgentControls(false);
            showNotification('AI Agent stopped successfully!', 'success');
        } else {
            updateAgentStatus('offline', 'AI Agent Offline');
            showAgentControls(false);
            showNotification('AI Agent stopped (service response: ' + result.message + ')', 'info');
        }

    } catch (error) {
        console.error('Error stopping AI agent:', error);
        updateAgentStatus('offline', 'AI Agent Offline');
        showAgentControls(false);
        showNotification('AI Agent stopped (connection error)', 'info');
    }
}

function updateAgentStatus(status, text) {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');

    if (statusIndicator && statusText) {
        statusIndicator.className = `status-indicator ${status}`;
        statusText.textContent = text;
    }
}

function showAgentControls(agentActive) {
    const addBtn = document.getElementById('addAiAgentBtn');
    const removeBtn = document.getElementById('removeAiAgentBtn');
    const testBtn = document.getElementById('testAiAgentBtn');

    if (addBtn && removeBtn && testBtn) {
        if (agentActive) {
            addBtn.style.display = 'none';
            removeBtn.style.display = 'inline-flex';
            testBtn.style.display = 'inline-flex';
        } else {
            addBtn.style.display = 'inline-flex';
            removeBtn.style.display = 'none';
            testBtn.style.display = 'none';
        }
    }
}

async function testAiAgent() {
    try {
        const response = await fetch('http://localhost:5003/agent/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Hello AI Agent, can you hear me? Please respond to confirm you are working.'
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification('✅ Agent Test: ' + result.agent_response, 'success');
        } else {
            showNotification('❌ Agent Test Failed: ' + result.message, 'error');
        }

    } catch (error) {
        console.error('Error testing AI agent:', error);
        showNotification('❌ Agent Test Error: Connection failed', 'error');
    }
}

async function checkAgentServiceStatus() {
    try {
        const response = await fetch('http://localhost:5003/health');
        const result = await response.json();

        if (result.status === 'healthy') {
            if (result.agent_running) {
                updateAgentStatus('online', 'AI Agent Active');
                showAgentControls(true);
            } else {
                updateAgentStatus('offline', 'AI Agent Offline');
                showAgentControls(false);
            }
        }
    } catch (error) {
        console.error('Agent service not available:', error);
        updateAgentStatus('error', 'Service Unavailable');
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    // Add notification styles if not already added
    if (!document.getElementById('notificationStyles')) {
        const styles = document.createElement('style');
        styles.id = 'notificationStyles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 10001;
                animation: slideIn 0.3s ease-out;
            }
            .notification.success { background: #10b981; }
            .notification.error { background: #ef4444; }
            .notification.info { background: #3b82f6; }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Remove notification after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}
