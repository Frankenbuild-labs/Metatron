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

            // Handle Witz tab special behavior - open management interface
            if (tabName === 'witz') {
                openWitzManagementInterface();
            } else {
                closeWitzManagementInterface();
            }
        });
    });
    
    // Initialize Cerebral Memory System
    initializeCerebralMemory();

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
    
    async function sendMessage() {
        const message = textInput.value.trim();
        if (message) {
            // Add user message
            addMessage(message, 'user');
            textInput.value = '';

            // Show typing indicator
            const typingIndicator = addTypingIndicator();

            try {
                // Call the orchestrator API
                const response = await fetch('http://localhost:5001/api/orchestrator/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: message,
                        context: {
                            timestamp: new Date().toISOString(),
                            frontend: 'metatron-web'
                        },
                        workspace: 'orchestrator'
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();

                // Remove typing indicator
                removeTypingIndicator(typingIndicator);

                if (result.success) {
                    // Add orchestrator response
                    addMessage(result.response, 'assistant');
                } else {
                    // Handle API error
                    addMessage('I apologize, but I encountered an error processing your request. Please try again.', 'assistant');
                    console.error('Orchestrator API error:', result.error);
                }

            } catch (error) {
                // Remove typing indicator
                removeTypingIndicator(typingIndicator);

                // Handle connection error
                console.error('Error connecting to orchestrator:', error);
                addMessage('I\'m having trouble connecting to my services right now. Please ensure the orchestrator is running and try again.', 'assistant');
            }
        }
    }
    
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        // Format the message content (handle basic markdown-like formatting)
        if (sender === 'assistant') {
            contentDiv.innerHTML = formatAssistantMessage(text);
        } else {
            contentDiv.textContent = text;
        }

        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function formatAssistantMessage(text) {
        // Basic formatting for orchestrator responses
        return text
            // Convert **bold** to <strong>
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Convert bullet points
            .replace(/^• (.*$)/gim, '<div class="bullet-point">• $1</div>')
            // Convert numbered lists
            .replace(/^(\d+)\. (.*$)/gim, '<div class="numbered-point">$1. $2</div>')
            // Convert line breaks
            .replace(/\n/g, '<br>')
            // Preserve emojis and special characters
            .replace(/🎨|📹|🔍|🚀|✅|⚠️|❌|🔧|🤖|🎯|💡/g, '<span class="emoji">$&</span>');
    }

    function addTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-animation">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <span class="typing-text">Metatron is thinking...</span>
            </div>
        `;

        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        return typingDiv;
    }

    function removeTypingIndicator(typingIndicator) {
        if (typingIndicator && typingIndicator.parentNode) {
            typingIndicator.parentNode.removeChild(typingIndicator);
        }
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
                    console.log('Agent/Flow Builder clicked - opening full builder');
                    // Generate a unique flow ID for this session
                    const flowId = `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    // Open Agent Flow Builder directly in new tab
                    window.open(`http://localhost:3000/builder/${flowId}`, '_blank');
                    break;
                case 'Social Station':
                    console.log('Social Station clicked');
                    break;
                case 'App/Web Builder':
                    console.log('App/Web Builder clicked');
                    loadAppWebBuilder();
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

            // Show/hide right panel and switch panel content based on mode
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

                // Switch panel content based on generator mode
                switchGeneratorPanel(mode);
            }
        });
    });

    // Generator mode selectors - separate handling for image and video generators

    // Image Generator mode selectors
    const imageGenModeSelectors = document.querySelectorAll('#imageGenMode .mode-selector');
    const imageGenModeControls = document.querySelectorAll('#imageGenMode .mode-controls');

    imageGenModeSelectors.forEach(selector => {
        selector.addEventListener('click', () => {
            const mode = selector.getAttribute('data-mode');

            // Update active selector within image generator
            imageGenModeSelectors.forEach(s => s.classList.remove('active'));
            selector.classList.add('active');

            // Update active controls within image generator
            imageGenModeControls.forEach(control => {
                control.style.display = 'none';
                control.classList.remove('active');
            });

            const targetControl = document.querySelector(`#imageGenMode [data-mode="${mode}"].mode-controls`);
            if (targetControl) {
                targetControl.style.display = 'block';
                targetControl.classList.add('active');
            }
        });
    });

    // Video Generator mode selectors
    const videoGenModeSelectors = document.querySelectorAll('#videoGenMode .mode-selector');
    const videoGenModeControls = document.querySelectorAll('#videoGenMode .mode-controls');

    videoGenModeSelectors.forEach(selector => {
        selector.addEventListener('click', () => {
            const mode = selector.getAttribute('data-mode');

            // Update active selector within video generator
            videoGenModeSelectors.forEach(s => s.classList.remove('active'));
            selector.classList.add('active');

            // Update active controls within video generator
            videoGenModeControls.forEach(control => {
                control.style.display = 'none';
                control.classList.remove('active');
            });

            const targetControl = document.querySelector(`#videoGenMode [data-mode="${mode}"].mode-controls`);
            if (targetControl) {
                targetControl.style.display = 'block';
                targetControl.classList.add('active');
            }

            // Update right panel for video modes
            updateVideoRightPanel(mode);
        });
    });

    // Generation buttons
    const generateImageBtn = document.getElementById('generateImageBtn');
    const generateVideoBtn = document.getElementById('generateVideoBtn');
    const generateImg2VideoBtn = document.getElementById('generateImg2VideoBtn');
    const generateVoiceBtn = document.getElementById('generateVoiceBtn');

    if (generateImageBtn) {
        generateImageBtn.addEventListener('click', generateImage);
    }

    if (generateVideoBtn) {
        generateVideoBtn.addEventListener('click', generateVideo);
    }

    if (generateImg2VideoBtn) {
        generateImg2VideoBtn.addEventListener('click', generateImg2Video);
    }

    if (generateVoiceBtn) {
        generateVoiceBtn.addEventListener('click', generateVoice);
    }

    // Size presets
    const sizePresets = document.querySelectorAll('.size-preset');
    sizePresets.forEach(preset => {
        preset.addEventListener('click', () => {
            const width = preset.getAttribute('data-width');
            const height = preset.getAttribute('data-height');

            // Check which panel is active and update the appropriate inputs
            const imagePanel = document.getElementById('imageGenPanel');
            const voicePanel = document.getElementById('voiceGenPanel');

            if (imagePanel && imagePanel.style.display !== 'none') {
                // Image generator panel is active
                const widthInput = document.getElementById('canvasWidth');
                const heightInput = document.getElementById('canvasHeight');

                if (widthInput) widthInput.value = width;
                if (heightInput) heightInput.value = height;
            } else if (voicePanel && voicePanel.style.display !== 'none') {
                // Voice generator panel is active
                const widthInput = document.getElementById('voiceWidth');
                const heightInput = document.getElementById('voiceHeight');

                if (widthInput) widthInput.value = width;
                if (heightInput) heightInput.value = height;
            }
        });
    });

    // Slider controls
    const sliders = ['creativity', 'detail', 'motion', 'videoDuration', 'videoMotion', 'lipSync', 'audioEnhance', 'facialDynamics'];
    sliders.forEach(sliderName => {
        const slider = document.getElementById(sliderName + 'Slider');
        const value = document.getElementById(sliderName + 'Value');

        if (slider && value) {
            slider.addEventListener('input', (e) => {
                let displayValue = e.target.value;
                // Special formatting for certain sliders
                if (sliderName === 'videoDuration') {
                    displayValue = e.target.value + 's';
                }
                value.textContent = displayValue;
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

function switchGeneratorPanel(mode) {
    // Hide all generator panels
    const panels = document.querySelectorAll('.generator-panel');
    panels.forEach(panel => {
        panel.style.display = 'none';
        panel.classList.remove('active');
    });

    // Show the appropriate panel for the current mode
    let targetPanel;
    switch(mode) {
        case 'imageGen':
            targetPanel = document.getElementById('imageGenPanel');
            break;
        case 'videoGen':
            targetPanel = document.getElementById('videoGenPanel');
            // Default to text2video mode for video generator
            updateVideoRightPanel('text2video');
            break;
        default:
            targetPanel = document.getElementById('imageGenPanel'); // Default to image
    }

    if (targetPanel) {
        targetPanel.style.display = 'block';
        targetPanel.classList.add('active');
    }

    console.log(`Switched to ${mode} panel`);
}

function updateVideoRightPanel(videoMode) {
    const videoPanel = document.getElementById('videoGenPanel');
    if (!videoPanel) return;

    // Remove all video mode classes
    videoPanel.classList.remove('text2video-mode', 'img2video-mode', 'voice2video-mode');

    // Add the current video mode class
    videoPanel.classList.add(`${videoMode}-mode`);

    console.log(`Updated video right panel to ${videoMode} mode`);
}

async function generateVideo() {
    const prompt = document.getElementById('videoPrompt').value;
    const progress = document.getElementById('videoProgress');
    const preview = document.getElementById('videoPreview');

    if (!prompt.trim()) {
        alert('Please enter a prompt for video generation');
        return;
    }

    // Show progress
    progress.style.display = 'block';

    try {
        console.log('🎬 Generating video with Wan2.1 model...');

        // Call Video API
        const response = await fetch('http://localhost:5005/api/video/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt,
                width: 480,
                height: 480,
                duration: 5
            })
        });

        const result = await response.json();

        progress.style.display = 'none';

        if (result.success) {
            // Show successful result
            preview.innerHTML = `
                <div style="text-align: center; color: var(--text-primary);">
                    <video controls style="max-width: 100%; border-radius: 8px; margin-bottom: 16px;">
                        <source src="${result.video_url}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                    <h3>✅ Video Generated!</h3>
                    <p>Prompt: "${prompt}"</p>
                    <div style="margin-top: 16px;">
                        <button onclick="downloadVideo('${result.video_url}')" class="download-btn">
                            <i class="fas fa-download"></i> Download Video
                        </button>
                    </div>
                </div>
            `;
        } else {
            throw new Error(result.error || 'Generation failed');
        }

    } catch (error) {
        progress.style.display = 'none';
        console.error('❌ Video generation failed:', error);

        // Show error message
        preview.innerHTML = `
            <div style="text-align: center; color: var(--text-primary);">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ff6b6b; margin-bottom: 16px;"></i>
                <h3>Generation Failed</h3>
                <p style="color: var(--text-secondary);">Error: ${error.message}</p>
                <p style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
                    Please check that the Video API service is running on port 5005.
                </p>
            </div>
        `;
    }
}

async function generateImg2Video() {
    const imageInput = document.getElementById('videoImageFile');
    const prompt = document.getElementById('img2videoPrompt').value;
    const progress = document.getElementById('videoProgress');
    const preview = document.getElementById('videoPreview');

    // Validate inputs
    if (!imageInput.files[0]) {
        alert('Please upload an image file');
        return;
    }

    if (!prompt.trim()) {
        alert('Please enter a description for the animation');
        return;
    }

    // Show progress
    progress.style.display = 'block';

    try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('image', imageInput.files[0]);
        formData.append('prompt', prompt);

        console.log('🎬 Generating image-to-video with Wan2.1 model...');

        // Call Image-to-Video API
        const response = await fetch('http://localhost:5005/api/video/img2video', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        progress.style.display = 'none';

        if (result.success) {
            // Show successful result
            preview.innerHTML = `
                <div style="text-align: center; color: var(--text-primary);">
                    <video controls style="max-width: 100%; border-radius: 8px; margin-bottom: 16px;">
                        <source src="${result.video_url}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                    <h3>✅ Image Animated!</h3>
                    <p>Animation: "${prompt}"</p>
                    <div style="margin-top: 16px;">
                        <button onclick="downloadVideo('${result.video_url}')" class="download-btn">
                            <i class="fas fa-download"></i> Download Video
                        </button>
                    </div>
                </div>
            `;
        } else {
            throw new Error(result.error || 'Generation failed');
        }

    } catch (error) {
        progress.style.display = 'none';
        console.error('❌ Image-to-video generation failed:', error);

        // Show error message
        preview.innerHTML = `
            <div style="text-align: center; color: var(--text-primary);">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ff6b6b; margin-bottom: 16px;"></i>
                <h3>Animation Failed</h3>
                <p style="color: var(--text-secondary);">Error: ${error.message}</p>
                <p style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
                    Please check that the Video API service is running on port 5005.
                </p>
            </div>
        `;
    }
}

async function generateVoice() {
    // Try to get inputs from main content area first, then fallback to right panel
    const audioInput = document.getElementById('voiceAudioInputMain') || document.getElementById('voiceAudioInput');
    const imageInput = document.getElementById('voiceImageInputMain') || document.getElementById('voiceImageInput');
    const prompt = document.getElementById('voicePrompt').value;
    const progress = document.getElementById('videoProgress'); // Use shared video progress
    const preview = document.getElementById('videoPreview'); // Use shared video preview

    // Validate inputs
    if (!audioInput.files[0]) {
        alert('Please upload an audio file');
        return;
    }

    if (!imageInput.files[0]) {
        alert('Please upload a reference image');
        return;
    }

    if (!prompt.trim()) {
        alert('Please enter a scene description');
        return;
    }

    // Show progress
    progress.style.display = 'block';

    try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('audio', audioInput.files[0]);
        formData.append('image', imageInput.files[0]);
        formData.append('prompt', prompt);

        console.log('🎤 Generating talking video with MultiTalk...');

        // Call MultiTalk API
        const response = await fetch('http://localhost:5004/api/voice/generate', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        progress.style.display = 'none';

        if (result.success) {
            // Show successful result
            preview.innerHTML = `
                <div style="text-align: center; color: var(--text-primary);">
                    <video controls style="max-width: 100%; border-radius: 8px; margin-bottom: 16px;">
                        <source src="${result.video_url}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                    <h3>✅ Talking Video Generated!</h3>
                    <p>Scene: "${prompt}"</p>
                    <div style="margin-top: 16px;">
                        <button onclick="downloadVideo('${result.video_url}')" class="download-btn">
                            <i class="fas fa-download"></i> Download Video
                        </button>
                    </div>
                </div>
            `;
        } else {
            throw new Error(result.error || 'Generation failed');
        }

    } catch (error) {
        progress.style.display = 'none';
        console.error('❌ Voice generation failed:', error);

        // Show error message
        preview.innerHTML = `
            <div style="text-align: center; color: var(--text-primary);">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ff6b6b; margin-bottom: 16px;"></i>
                <h3>Generation Failed</h3>
                <p style="color: var(--text-secondary);">Error: ${error.message}</p>
                <p style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
                    Please check that the MultiTalk service is running on port 5004.
                </p>
            </div>
        `;
    }
}

function downloadVideo(videoUrl) {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `talking_video_${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// File upload handlers
document.addEventListener('DOMContentLoaded', function() {
    // Audio file upload handler (main content area)
    const audioInputMain = document.getElementById('voiceAudioInputMain');
    if (audioInputMain) {
        audioInputMain.addEventListener('change', function(e) {
            const file = e.target.files[0];
            const preview = document.getElementById('uploadedAudioPreviewMain');

            if (file && preview) {
                preview.style.display = 'block';
                preview.innerHTML = `
                    <div class="file-preview">
                        <i class="fas fa-music"></i>
                        <span>${file.name}</span>
                        <button onclick="clearAudioUploadMain()" class="clear-btn">×</button>
                    </div>
                `;
            }
        });
    }

    // Image file upload handler (main content area)
    const imageInputMain = document.getElementById('voiceImageInputMain');
    if (imageInputMain) {
        imageInputMain.addEventListener('change', function(e) {
            const file = e.target.files[0];
            const preview = document.getElementById('uploadedVoiceImagePreviewMain');

            if (file && preview) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.style.display = 'block';
                    preview.innerHTML = `
                        <div class="file-preview">
                            <img src="${e.target.result}" alt="Preview" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">
                            <span>${file.name}</span>
                            <button onclick="clearImageUploadMain()" class="clear-btn">×</button>
                        </div>
                    `;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Audio file upload handler (right panel)
    const audioInput = document.getElementById('voiceAudioInput');
    if (audioInput) {
        audioInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            const preview = document.getElementById('uploadedAudioPreview');

            if (file && preview) {
                preview.style.display = 'block';
                preview.innerHTML = `
                    <div class="file-preview">
                        <i class="fas fa-music"></i>
                        <span>${file.name}</span>
                        <button onclick="clearAudioUpload()" class="clear-btn">×</button>
                    </div>
                `;
            }
        });
    }

    // Image file upload handler (right panel)
    const imageInput = document.getElementById('voiceImageInput');
    if (imageInput) {
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            const preview = document.getElementById('uploadedVoiceImagePreview');

            if (file && preview) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.style.display = 'block';
                    preview.innerHTML = `
                        <div class="file-preview">
                            <img src="${e.target.result}" alt="Preview" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">
                            <span>${file.name}</span>
                            <button onclick="clearImageUpload()" class="clear-btn">×</button>
                        </div>
                    `;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Image file upload handler for img2video
    const videoImageInput = document.getElementById('videoImageFile');
    if (videoImageInput) {
        videoImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            const preview = document.getElementById('videoImagePreview');

            if (file && preview) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.style.display = 'block';
                    preview.innerHTML = `
                        <div class="file-preview">
                            <img src="${e.target.result}" alt="Preview" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">
                            <span>${file.name}</span>
                            <button onclick="clearVideoImageUpload()" class="clear-btn">×</button>
                        </div>
                    `;
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

function clearAudioUpload() {
    const input = document.getElementById('voiceAudioInput');
    const preview = document.getElementById('uploadedAudioPreview');
    if (input) input.value = '';
    if (preview) preview.style.display = 'none';
}

function clearAudioUploadMain() {
    const input = document.getElementById('voiceAudioInputMain');
    const preview = document.getElementById('uploadedAudioPreviewMain');
    if (input) input.value = '';
    if (preview) preview.style.display = 'none';
}

function clearImageUpload() {
    const input = document.getElementById('voiceImageInput');
    const preview = document.getElementById('uploadedVoiceImagePreview');
    if (input) input.value = '';
    if (preview) preview.style.display = 'none';
}

function clearImageUploadMain() {
    const input = document.getElementById('voiceImageInputMain');
    const preview = document.getElementById('uploadedVoiceImagePreviewMain');
    if (input) input.value = '';
    if (preview) preview.style.display = 'none';
}

function clearVideoImageUpload() {
    const input = document.getElementById('videoImageFile');
    const preview = document.getElementById('videoImagePreview');
    if (input) input.value = '';
    if (preview) preview.style.display = 'none';
}

function clearImageUpload() {
    const input = document.getElementById('voiceImageInput');
    const preview = document.getElementById('uploadedVoiceImagePreview');
    if (input) input.value = '';
    if (preview) preview.style.display = 'none';
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

// Witz Management Interface Functions
function openWitzManagementInterface() {
    console.log('🎛️ Opening Witz Management Interface...');

    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    // Hide the original chat interface
    const originalContent = mainContent.innerHTML;

    // Store original content for restoration
    if (!window.originalMainContent) {
        window.originalMainContent = originalContent;
    }

    // Replace with management interface
    mainContent.innerHTML = createWitzManagementHTML();

    // Initialize management interface functionality
    initializeWitzManagement();

    console.log('✅ Witz Management Interface loaded');
}

function closeWitzManagementInterface() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent || !window.originalMainContent) return;

    // Restore original chat interface
    mainContent.innerHTML = window.originalMainContent;

    // Reinitialize chat functionality
    initializeChatInterface();

    console.log('✅ Restored original chat interface');
}

function createWitzManagementHTML() {
    return `
        <div class="witz-management-container">
            <!-- Management Header -->
            <div class="management-header">
                <div class="header-left">
                    <h1><i class="fas fa-cogs"></i> Metatron Management Center</h1>
                    <p>Configure your AI platform, manage agents, and design your interface</p>
                </div>
                <div class="header-right">
                    <button class="management-btn primary" id="saveAllSettings">
                        <i class="fas fa-save"></i> Save All Settings
                    </button>
                    <button class="management-btn secondary" id="exportConfig">
                        <i class="fas fa-download"></i> Export Config
                    </button>
                </div>
            </div>

            <!-- Management Navigation -->
            <div class="management-nav">
                <button class="management-tab active" data-section="orchestrator">
                    <i class="fas fa-brain"></i>
                    <span>Orchestrator</span>
                </button>
                <button class="management-tab" data-section="agents">
                    <i class="fas fa-robot"></i>
                    <span>Agents & Flows</span>
                </button>
                <button class="management-tab" data-section="flow-builder">
                    <i class="fas fa-project-diagram"></i>
                    <span>Flow Builder</span>
                </button>
                <button class="management-tab" data-section="interface">
                    <i class="fas fa-palette"></i>
                    <span>Interface Design</span>
                </button>
                <button class="management-tab" data-section="monitoring">
                    <i class="fas fa-chart-line"></i>
                    <span>Monitoring</span>
                </button>
                <button class="management-tab" data-section="settings">
                    <i class="fas fa-sliders-h"></i>
                    <span>System Settings</span>
                </button>
            </div>

            <!-- Management Content -->
            <div class="management-content">
                <!-- Orchestrator Section -->
                <div class="management-section active" id="orchestrator-section">
                    <div class="section-header">
                        <h2><i class="fas fa-brain"></i> Orchestrator Control Center</h2>
                        <div class="orchestrator-status">
                            <span class="status-indicator" id="orchestratorStatus"></span>
                            <span id="orchestratorStatusText">Checking...</span>
                        </div>
                    </div>

                    <div class="management-grid">
                        <div class="management-card">
                            <h3><i class="fas fa-tachometer-alt"></i> Performance Metrics</h3>
                            <div class="metrics-grid">
                                <div class="metric-item">
                                    <span class="metric-label">Response Time</span>
                                    <span class="metric-value" id="responseTime">--ms</span>
                                </div>
                                <div class="metric-item">
                                    <span class="metric-label">Active Conversations</span>
                                    <span class="metric-value" id="activeConversations">--</span>
                                </div>
                                <div class="metric-item">
                                    <span class="metric-label">Total Requests</span>
                                    <span class="metric-value" id="totalRequests">--</span>
                                </div>
                                <div class="metric-item">
                                    <span class="metric-label">Success Rate</span>
                                    <span class="metric-value" id="successRate">--%</span>
                                </div>
                            </div>
                        </div>

                        <div class="management-card">
                            <h3><i class="fas fa-cog"></i> Orchestrator Configuration</h3>
                            <div class="config-form">
                                <div class="form-group">
                                    <label>Primary Model</label>
                                    <select id="primaryModel" class="form-control">
                                        <option value="gemini-pro">Google Gemini Pro</option>
                                        <option value="gemini-flash">Google Gemini Flash</option>
                                        <option value="gpt-4">OpenAI GPT-4</option>
                                        <option value="claude-3">Anthropic Claude 3</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Temperature</label>
                                    <input type="range" id="orchestratorTemp" min="0" max="1" step="0.1" value="0.7" class="form-control">
                                    <span class="range-value">0.7</span>
                                </div>
                                <div class="form-group">
                                    <label>Max Tokens</label>
                                    <input type="number" id="maxTokens" value="4096" class="form-control">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Agents & Flows Section -->
                <div class="management-section" id="agents-section">
                    <div class="section-header">
                        <h2><i class="fas fa-robot"></i> Agents & Flow Management</h2>
                        <button class="management-btn primary" id="createNewAgent">
                            <i class="fas fa-plus"></i> Create New Agent
                        </button>
                    </div>

                    <div class="agents-grid">
                        <div class="agent-card">
                            <div class="agent-header">
                                <div class="agent-avatar">
                                    <i class="fas fa-code"></i>
                                </div>
                                <div class="agent-info">
                                    <h4>CodeMaster</h4>
                                    <p>Python Development Specialist</p>
                                </div>
                                <div class="agent-status active">
                                    <i class="fas fa-circle"></i>
                                </div>
                            </div>
                            <div class="agent-stats">
                                <span>Tasks: 127</span>
                                <span>Success: 98%</span>
                            </div>
                            <div class="agent-actions">
                                <button class="btn-small">Edit</button>
                                <button class="btn-small">Configure</button>
                                <button class="btn-small">Logs</button>
                            </div>
                        </div>

                        <div class="agent-card">
                            <div class="agent-header">
                                <div class="agent-avatar">
                                    <i class="fas fa-pen"></i>
                                </div>
                                <div class="agent-info">
                                    <h4>WriteWell</h4>
                                    <p>Content Writing Assistant</p>
                                </div>
                                <div class="agent-status inactive">
                                    <i class="fas fa-circle"></i>
                                </div>
                            </div>
                            <div class="agent-stats">
                                <span>Tasks: 89</span>
                                <span>Success: 95%</span>
                            </div>
                            <div class="agent-actions">
                                <button class="btn-small">Edit</button>
                                <button class="btn-small">Configure</button>
                                <button class="btn-small">Logs</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Interface Design Section -->
                <div class="management-section" id="interface-section">
                    <div class="section-header">
                        <h2><i class="fas fa-palette"></i> Interface Designer</h2>
                        <button class="management-btn primary" id="previewInterface">
                            <i class="fas fa-eye"></i> Preview Changes
                        </button>
                    </div>

                    <div class="interface-designer">
                        <div class="designer-sidebar">
                            <h3>Customization Options</h3>

                            <div class="design-group">
                                <h4>Theme Settings</h4>
                                <div class="form-group">
                                    <label>Primary Color</label>
                                    <input type="color" id="primaryColor" value="#069494" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label>Background Style</label>
                                    <select id="backgroundStyle" class="form-control">
                                        <option value="dark">Dark Theme</option>
                                        <option value="light">Light Theme</option>
                                        <option value="auto">Auto (System)</option>
                                    </select>
                                </div>
                            </div>

                            <div class="design-group">
                                <h4>Layout Configuration</h4>
                                <div class="form-group">
                                    <label>Sidebar Width</label>
                                    <input type="range" id="sidebarWidth" min="200" max="400" value="280" class="form-control">
                                    <span class="range-value">280px</span>
                                </div>
                                <div class="form-group">
                                    <label>Chat Input Height</label>
                                    <input type="range" id="chatInputHeight" min="40" max="120" value="60" class="form-control">
                                    <span class="range-value">60px</span>
                                </div>
                            </div>
                        </div>

                        <div class="designer-preview">
                            <h3>Live Preview</h3>
                            <div class="preview-frame">
                                <div class="preview-interface">
                                    <div class="preview-sidebar">Sidebar</div>
                                    <div class="preview-main">
                                        <div class="preview-chat">Chat Area</div>
                                        <div class="preview-input">Input Area</div>
                                    </div>
                                    <div class="preview-sidebar">Tools</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Monitoring Section -->
                <div class="management-section" id="monitoring-section">
                    <div class="section-header">
                        <h2><i class="fas fa-chart-line"></i> System Monitoring</h2>
                        <button class="management-btn secondary" id="refreshMetrics">
                            <i class="fas fa-sync"></i> Refresh
                        </button>
                    </div>

                    <div class="monitoring-dashboard">
                        <div class="monitoring-card">
                            <h3>API Usage</h3>
                            <div class="chart-placeholder">
                                <i class="fas fa-chart-bar"></i>
                                <p>API usage chart will be displayed here</p>
                            </div>
                        </div>

                        <div class="monitoring-card">
                            <h3>Response Times</h3>
                            <div class="chart-placeholder">
                                <i class="fas fa-chart-line"></i>
                                <p>Response time trends will be displayed here</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Agent Flow Builder Section -->
                <div class="management-section" id="flow-builder-section">
                    <div class="section-header-compact">
                        <div class="header-left">
                            <h2><i class="fas fa-project-diagram"></i> Flow Builder</h2>
                        </div>
                        <div class="header-right">
                            <button class="management-btn primary compact" id="loadFlowBuilder">
                                <i class="fas fa-rocket"></i> Launch Builder
                            </button>
                            <button class="management-btn secondary compact" id="createNewFlow">
                                <i class="fas fa-plus"></i> New Flow
                            </button>
                            <button class="management-btn secondary compact" id="importFlow">
                                <i class="fas fa-upload"></i> Import
                            </button>
                        </div>
                    </div>

                    <div class="flow-builder-container expanded" id="flowBuilderContainer">
                        <!-- Agent Flow interface will be loaded here -->
                        <div class="flow-builder-placeholder">
                            <div class="placeholder-content">
                                <i class="fas fa-project-diagram"></i>
                                <h3>Professional Agent Flow Builder</h3>
                                <p>Click "Launch Builder" to start designing your AI workflows</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- System Settings Section -->
                <div class="management-section" id="settings-section">
                    <div class="section-header">
                        <h2><i class="fas fa-sliders-h"></i> System Settings</h2>
                    </div>

                    <div class="settings-grid">
                        <div class="settings-card">
                            <h3>API Configuration</h3>
                            <div class="form-group">
                                <label>Google Gemini API Key</label>
                                <input type="password" id="geminiApiKey" placeholder="Enter your API key" class="form-control">
                            </div>
                            <div class="form-group">
                                <label>OpenAI API Key</label>
                                <input type="password" id="openaiApiKey" placeholder="Enter your API key" class="form-control">
                            </div>
                            <div class="form-group">
                                <label>Composio API Key</label>
                                <input type="password" id="composioApiKey" placeholder="Enter your Composio API key" class="form-control">
                            </div>
                        </div>

                        <div class="settings-card">
                            <h3>Security Settings</h3>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="enableAuth"> Enable Authentication
                                </label>
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="enableLogging"> Enable Request Logging
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function initializeWitzManagement() {
    console.log('🔧 Initializing Witz Management Interface...');

    // Initialize tab switching
    const managementTabs = document.querySelectorAll('.management-tab');
    const managementSections = document.querySelectorAll('.management-section');

    managementTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const sectionName = tab.getAttribute('data-section');

            // Update active tab
            managementTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update active section
            managementSections.forEach(section => section.classList.remove('active'));
            const targetSection = document.getElementById(sectionName + '-section');
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });

    // Initialize orchestrator status check
    checkOrchestratorStatus();

    // Initialize form controls
    initializeFormControls();

    // Initialize action buttons
    initializeManagementActions();

    console.log('✅ Witz Management Interface initialized');
}

async function checkOrchestratorStatus() {
    const statusIndicator = document.getElementById('orchestratorStatus');
    const statusText = document.getElementById('orchestratorStatusText');

    if (!statusIndicator || !statusText) return;

    try {
        statusText.textContent = 'Checking...';
        statusIndicator.className = 'status-indicator connecting';

        const response = await fetch('http://localhost:5001/api/orchestrator/health');
        const result = await response.json();

        if (result.status === 'healthy') {
            statusIndicator.className = 'status-indicator online';
            statusText.textContent = 'Online & Healthy';

            // Update metrics if available
            updateOrchestratorMetrics(result);
        } else {
            statusIndicator.className = 'status-indicator error';
            statusText.textContent = 'Service Issues';
        }
    } catch (error) {
        statusIndicator.className = 'status-indicator offline';
        statusText.textContent = 'Offline';
        console.error('Error checking orchestrator status:', error);
    }
}

function updateOrchestratorMetrics(healthData) {
    // Update performance metrics if elements exist
    const responseTimeEl = document.getElementById('responseTime');
    const activeConversationsEl = document.getElementById('activeConversations');
    const totalRequestsEl = document.getElementById('totalRequests');
    const successRateEl = document.getElementById('successRate');

    if (responseTimeEl && healthData.metrics) {
        responseTimeEl.textContent = healthData.metrics.avg_response_time || '--ms';
        activeConversationsEl.textContent = healthData.metrics.active_conversations || '--';
        totalRequestsEl.textContent = healthData.metrics.total_requests || '--';
        successRateEl.textContent = healthData.metrics.success_rate || '--%';
    }
}

function initializeFormControls() {
    // Temperature slider
    const tempSlider = document.getElementById('orchestratorTemp');
    if (tempSlider) {
        const tempValue = tempSlider.nextElementSibling;
        tempSlider.addEventListener('input', (e) => {
            if (tempValue) tempValue.textContent = e.target.value;
        });
    }

    // Sidebar width slider
    const sidebarSlider = document.getElementById('sidebarWidth');
    if (sidebarSlider) {
        const sidebarValue = sidebarSlider.nextElementSibling;
        sidebarSlider.addEventListener('input', (e) => {
            if (sidebarValue) sidebarValue.textContent = e.target.value + 'px';
        });
    }

    // Chat input height slider
    const inputSlider = document.getElementById('chatInputHeight');
    if (inputSlider) {
        const inputValue = inputSlider.nextElementSibling;
        inputSlider.addEventListener('input', (e) => {
            if (inputValue) inputValue.textContent = e.target.value + 'px';
        });
    }

    // Color picker
    const colorPicker = document.getElementById('primaryColor');
    if (colorPicker) {
        colorPicker.addEventListener('change', (e) => {
            updatePreviewColors(e.target.value);
        });
    }
}

function initializeManagementActions() {
    // Save all settings
    const saveBtn = document.getElementById('saveAllSettings');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveAllSettings);
    }

    // Export configuration
    const exportBtn = document.getElementById('exportConfig');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportConfiguration);
    }

    // Create new agent
    const createAgentBtn = document.getElementById('createNewAgent');
    if (createAgentBtn) {
        createAgentBtn.addEventListener('click', createNewAgent);
    }

    // Preview interface
    const previewBtn = document.getElementById('previewInterface');
    if (previewBtn) {
        previewBtn.addEventListener('click', previewInterfaceChanges);
    }

    // Refresh metrics
    const refreshBtn = document.getElementById('refreshMetrics');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', checkOrchestratorStatus);
    }

    // Flow Builder actions
    const loadFlowBuilderBtn = document.getElementById('loadFlowBuilder');
    if (loadFlowBuilderBtn) {
        loadFlowBuilderBtn.addEventListener('click', loadAgentFlowBuilder);
    }

    const createNewFlowBtn = document.getElementById('createNewFlow');
    if (createNewFlowBtn) {
        createNewFlowBtn.addEventListener('click', createNewFlow);
    }

    const importFlowBtn = document.getElementById('importFlow');
    if (importFlowBtn) {
        importFlowBtn.addEventListener('click', importFlow);
    }

    // Add workflow execution handlers
    const runFlowBtn = document.getElementById('runFlowBtn');
    if (runFlowBtn) {
        runFlowBtn.addEventListener('click', executeCurrentFlow);
    }

    const saveFlowBtn = document.getElementById('saveFlowBtn');
    if (saveFlowBtn) {
        saveFlowBtn.addEventListener('click', saveCurrentFlow);
    }

    const exportFlowBtn = document.getElementById('exportFlowBtn');
    if (exportFlowBtn) {
        exportFlowBtn.addEventListener('click', exportCurrentFlow);
    }
}

function updatePreviewColors(color) {
    const previewFrame = document.querySelector('.preview-frame');
    if (previewFrame) {
        previewFrame.style.setProperty('--preview-accent', color);
    }
}

async function saveAllSettings() {
    console.log('💾 Saving all settings...');

    const settings = {
        orchestrator: {
            primaryModel: document.getElementById('primaryModel')?.value,
            temperature: document.getElementById('orchestratorTemp')?.value,
            maxTokens: document.getElementById('maxTokens')?.value
        },
        interface: {
            primaryColor: document.getElementById('primaryColor')?.value,
            backgroundStyle: document.getElementById('backgroundStyle')?.value,
            sidebarWidth: document.getElementById('sidebarWidth')?.value,
            chatInputHeight: document.getElementById('chatInputHeight')?.value
        },
        security: {
            enableAuth: document.getElementById('enableAuth')?.checked,
            enableLogging: document.getElementById('enableLogging')?.checked
        }
    };

    try {
        // Save to localStorage for now (later integrate with backend)
        localStorage.setItem('metatron_settings', JSON.stringify(settings));
        showNotification('✅ Settings saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('❌ Error saving settings', 'error');
    }
}

function exportConfiguration() {
    console.log('📤 Exporting configuration...');

    const config = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        settings: JSON.parse(localStorage.getItem('metatron_settings') || '{}')
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metatron-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('📁 Configuration exported successfully!', 'success');
}

function createNewAgent() {
    console.log('🤖 Creating new agent...');
    showNotification('🚧 Agent creation interface coming soon!', 'info');
}

function previewInterfaceChanges() {
    console.log('👁️ Previewing interface changes...');
    showNotification('🎨 Interface preview coming soon!', 'info');
}

async function loadAgentFlowBuilder() {
    console.log('🎨 Loading Professional Agent Flow Builder...');

    const container = document.getElementById('flowBuilderContainer');
    if (!container) return;

    try {
        // Check if Agent Flow service is running
        let healthCheck = null;
        try {
            healthCheck = await fetch('http://localhost:3000/api/health', {
                mode: 'cors',
                credentials: 'omit'
            });
        } catch (corsError) {
            console.log('🔄 CORS issue detected, trying iframe direct load...');
            // If CORS fails, we'll try to load the iframe directly
            healthCheck = { ok: true }; // Assume service is running
        }

        if (!healthCheck || !healthCheck.ok) {
            // Show loading state while Agent Flow starts up
            container.innerHTML = `
                <div class="flow-builder-loading">
                    <div class="loading-content">
                        <div class="loading-spinner"></div>
                        <h3>Starting Agent Flow Service...</h3>
                        <p>Please wait while we initialize the professional flow builder</p>
                        <div class="loading-steps">
                            <div class="step active">🚀 Starting Next.js service</div>
                            <div class="step">🔧 Loading ReactFlow engine</div>
                            <div class="step">🎨 Initializing interface</div>
                        </div>
                        <button class="management-btn primary" onclick="loadAgentFlowBuilder()">
                            <i class="fas fa-refresh"></i> Check Again
                        </button>
                        <button class="management-btn secondary" onclick="loadAgentFlowDirect()">
                            <i class="fas fa-external-link-alt"></i> Load Direct
                        </button>
                    </div>
                </div>
            `;
            showNotification('🔄 Starting Agent Flow service...', 'info');
            return;
        }

        // Generate a unique flow ID for this session
        const flowId = `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create iframe for Agent Flow
        container.innerHTML = `
            <div class="agent-flow-iframe-container">
                <div class="iframe-header">
                    <div class="iframe-title">
                        <i class="fas fa-project-diagram"></i>
                        Professional Agent Flow Builder
                    </div>
                    <div class="iframe-controls">
                        <button class="iframe-btn" onclick="refreshAgentFlow()" title="Refresh">
                            <i class="fas fa-refresh"></i>
                        </button>
                        <button class="iframe-btn" onclick="openAgentFlowInNewTab()" title="Open in New Tab">
                            <i class="fas fa-external-link-alt"></i>
                        </button>
                    </div>
                </div>
                <iframe
                    id="agentFlowIframe"
                    src="http://localhost:3000/builder/${flowId}"
                    width="100%"
                    height="100%"
                    frameborder="0"
                    style="border: none; background: var(--bg-primary);">
                </iframe>
            </div>
        `;

        // Set up iframe communication
        setupAgentFlowCommunication();

        showNotification('🎨 Professional Agent Flow Builder loaded!', 'success');

    } catch (error) {
        console.error('Error loading Agent Flow Builder:', error);
        container.innerHTML = `
            <div class="flow-builder-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Agent Flow Service Not Available</h3>
                <p>The professional Agent Flow service is not running. Please start it first:</p>
                <div class="error-instructions">
                    <code>cd frontend/agent-flow && npm run dev</code>
                </div>
                <button class="management-btn primary" onclick="loadAgentFlowBuilder()">
                    <i class="fas fa-refresh"></i> Retry
                </button>
            </div>
        `;
        showNotification('❌ Agent Flow service not available', 'error');
    }
}

async function loadAppWebBuilder() {
    console.log('🌐 Loading App/Web Builder...');

    // Hide chat interface and show web builder
    const chatContainer = document.querySelector('.chat-container');
    const rightSidebar = document.querySelector('.right-sidebar');

    if (chatContainer) {
        chatContainer.style.display = 'none';
    }

    // Create or show web builder container
    let webBuilderContainer = document.getElementById('webBuilderContainer');
    if (!webBuilderContainer) {
        webBuilderContainer = document.createElement('div');
        webBuilderContainer.id = 'webBuilderContainer';
        webBuilderContainer.className = 'web-builder-container';
        webBuilderContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: var(--bg-primary);
            z-index: 1000;
            display: flex;
            flex-direction: column;
        `;
        document.body.appendChild(webBuilderContainer);
    }

    try {
        // Check if LocalSite-ai service is running
        let healthCheck = null;
        try {
            healthCheck = await fetch('http://localhost:3002', {
                mode: 'cors',
                credentials: 'omit'
            });
        } catch (corsError) {
            console.log('🔄 CORS issue detected, trying iframe direct load...');
            healthCheck = { ok: true }; // Assume service is running
        }

        if (!healthCheck || !healthCheck.ok) {
            webBuilderContainer.innerHTML = `
                <div class="web-builder-loading">
                    <div class="loading-content">
                        <div class="loading-spinner"></div>
                        <h3>Starting LocalSite-ai Service...</h3>
                        <p>Please wait while we initialize the web builder</p>
                        <div class="loading-steps">
                            <div class="step active">🚀 Starting Next.js service</div>
                            <div class="step">🎨 Loading Monaco Editor</div>
                            <div class="step">🤖 Initializing AI models</div>
                        </div>
                        <button class="management-btn primary" onclick="loadAppWebBuilder()">
                            <i class="fas fa-refresh"></i> Check Again
                        </button>
                        <button class="management-btn secondary" onclick="closeAppWebBuilder()">
                            <i class="fas fa-times"></i> Close
                        </button>
                    </div>
                </div>
            `;
            showNotification('🔄 Starting LocalSite-ai service...', 'info');
            return;
        }

        // Create iframe for LocalSite-ai
        webBuilderContainer.innerHTML = `
            <div class="web-builder-header">
                <div class="header-left">
                    <button class="header-btn" onclick="closeAppWebBuilder()" title="Back to Chat">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <div class="header-title">
                        <i class="fas fa-code"></i>
                        <span>App/Web Builder</span>
                    </div>
                </div>
                <div class="header-right">
                    <button class="header-btn" onclick="refreshAppWebBuilder()" title="Refresh">
                        <i class="fas fa-refresh"></i>
                    </button>
                    <button class="header-btn" onclick="openAppWebBuilderInNewTab()" title="Open in New Tab">
                        <i class="fas fa-external-link-alt"></i>
                    </button>
                </div>
            </div>
            <iframe
                id="appWebBuilderIframe"
                src="http://localhost:3002"
                width="100%"
                height="100%"
                frameborder="0"
                style="border: none; flex: 1; background: white;">
            </iframe>
        `;

        showNotification('🌐 App/Web Builder loaded successfully!', 'success');

    } catch (error) {
        console.error('Error loading App/Web Builder:', error);
        webBuilderContainer.innerHTML = `
            <div class="web-builder-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>LocalSite-ai Service Not Available</h3>
                <p>The App/Web Builder service is not running. Please start it first:</p>
                <div class="error-instructions">
                    <code>cd frontend/localsite-ai && npm run dev</code>
                </div>
                <button class="management-btn primary" onclick="loadAppWebBuilder()">
                    <i class="fas fa-refresh"></i> Retry
                </button>
                <button class="management-btn secondary" onclick="closeAppWebBuilder()">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        `;
        showNotification('❌ App/Web Builder service not available', 'error');
    }
}

function closeAppWebBuilder() {
    console.log('🔒 Closing App/Web Builder...');

    const webBuilderContainer = document.getElementById('webBuilderContainer');
    if (webBuilderContainer) {
        webBuilderContainer.remove();
    }

    // Show chat interface again
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
        chatContainer.style.display = 'flex';
    }

    showNotification('👋 App/Web Builder closed', 'info');
}

function refreshAppWebBuilder() {
    console.log('🔄 Refreshing App/Web Builder...');
    const iframe = document.getElementById('appWebBuilderIframe');
    if (iframe) {
        iframe.src = iframe.src;
    }
}

function openAppWebBuilderInNewTab() {
    console.log('🔗 Opening App/Web Builder in new tab...');
    window.open('http://localhost:3002', '_blank');
}

function initializeFlowBuilder() {
    console.log('🔧 Initializing Flow Builder...');

    // Initialize drag and drop functionality
    const nodeItems = document.querySelectorAll('.node-item');
    const canvas = document.querySelector('.flow-canvas');

    if (nodeItems.length > 0 && canvas) {
        nodeItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                const nodeType = item.dataset.nodeType || item.dataset.patternType;
                e.dataTransfer.setData('text/plain', nodeType);
                console.log('🎯 Dragging node type:', nodeType);
            });
        });

        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const nodeType = e.dataTransfer.getData('text/plain');
            console.log('🎯 Dropped node type:', nodeType);

            // Create a visual node representation
            createFlowNode(nodeType, e.offsetX, e.offsetY);
        });
    }

    // Initialize search functionality
    const searchInput = document.querySelector('#nodeSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const nodeItems = document.querySelectorAll('.node-item');

            nodeItems.forEach(item => {
                const label = item.querySelector('.node-label').textContent.toLowerCase();
                const description = item.querySelector('.node-description').textContent.toLowerCase();

                if (label.includes(searchTerm) || description.includes(searchTerm)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    // Initialize canvas controls
    initializeCanvasControls();

    // Handle window resize for proper Flow Builder sizing
    window.addEventListener('resize', handleFlowBuilderResize);

    console.log('✅ Flow Builder initialized');
}

function createFlowNode(nodeType, x, y) {
    console.log(`🎯 Creating ${nodeType} node at (${x}, ${y})`);

    const canvas = document.querySelector('.flow-canvas');
    const placeholder = canvas.querySelector('.canvas-placeholder');

    // Remove placeholder if it exists
    if (placeholder) {
        placeholder.remove();
    }

    // Ensure canvas has the necessary containers
    if (!canvas.querySelector('.flow-connections')) {
        const connectionsLayer = document.createElement('svg');
        connectionsLayer.className = 'flow-connections';
        connectionsLayer.style.position = 'absolute';
        connectionsLayer.style.top = '0';
        connectionsLayer.style.left = '0';
        connectionsLayer.style.width = '100%';
        connectionsLayer.style.height = '100%';
        connectionsLayer.style.pointerEvents = 'none';
        connectionsLayer.style.zIndex = '1';
        canvas.appendChild(connectionsLayer);
    }

    if (!canvas.querySelector('.flow-nodes-container')) {
        const nodesContainer = document.createElement('div');
        nodesContainer.className = 'flow-nodes-container';
        nodesContainer.style.position = 'absolute';
        nodesContainer.style.top = '0';
        nodesContainer.style.left = '0';
        nodesContainer.style.width = '100%';
        nodesContainer.style.height = '100%';
        nodesContainer.style.zIndex = '2';
        canvas.appendChild(nodesContainer);
    }

    // Generate unique node ID
    const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create node element
    const node = document.createElement('div');
    node.className = 'flow-node';
    node.id = nodeId;
    node.dataset.nodeType = nodeType;
    node.style.position = 'absolute';
    node.style.left = x + 'px';
    node.style.top = y + 'px';
    node.style.width = '140px';
    node.style.height = '90px';
    node.style.background = 'var(--bg-secondary)';
    node.style.border = '2px solid var(--accent-primary)';
    node.style.borderRadius = '8px';
    node.style.display = 'flex';
    node.style.flexDirection = 'column';
    node.style.alignItems = 'center';
    node.style.justifyContent = 'center';
    node.style.cursor = 'pointer';
    node.style.color = 'var(--text-primary)';
    node.style.fontSize = '12px';
    node.style.fontWeight = '500';
    node.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    node.style.transition = 'all 0.2s ease';

    // Add node content
    const icon = getNodeIcon(nodeType);
    const label = getNodeLabel(nodeType);

    node.innerHTML = `
        <div class="node-header">
            <div class="node-icon" style="font-size: 16px; margin-bottom: 4px;">${icon}</div>
            <div class="node-label">${label}</div>
        </div>
        <div class="connection-points">
            <div class="connection-point input" data-type="input" title="Input"></div>
            <div class="connection-point output" data-type="output" title="Output"></div>
        </div>
        <div class="node-settings-btn" title="Settings">
            <i class="fas fa-cog"></i>
        </div>
    `;

    // Add event listeners
    setupNodeInteractions(node);

    // Add to nodes container
    const nodesContainer = canvas.querySelector('.flow-nodes-container');
    nodesContainer.appendChild(node);

    // Store node data
    if (!window.flowNodes) window.flowNodes = new Map();
    window.flowNodes.set(nodeId, {
        id: nodeId,
        type: nodeType,
        x: x,
        y: y,
        data: getDefaultNodeData(nodeType)
    });

    showNotification(`✅ ${label} node created!`, 'success');

    return nodeId;
}

function getNodeIcon(nodeType) {
    const icons = {
        'input': '<i class="fas fa-sign-in-alt"></i>',
        'llm': '<i class="fas fa-brain"></i>',
        'tool': '<i class="fas fa-tools"></i>',
        'agent': '<i class="fas fa-robot"></i>',
        'output': '<i class="fas fa-sign-out-alt"></i>',
        'augmented-llm': '<span style="font-weight: bold;">A</span>',
        'prompt-chaining': '<span style="font-weight: bold;">C</span>',
        'routing': '<span style="font-weight: bold;">R</span>',
        'parallel': '<span style="font-weight: bold;">P</span>'
    };
    return icons[nodeType] || '<i class="fas fa-circle"></i>';
}

function getNodeLabel(nodeType) {
    const labels = {
        'input': 'Input',
        'llm': 'LLM',
        'tool': 'Tool',
        'agent': 'Agent',
        'output': 'Output',
        'augmented-llm': 'Aug LLM',
        'prompt-chaining': 'Chain',
        'routing': 'Router',
        'parallel': 'Parallel'
    };
    return labels[nodeType] || 'Node';
}

function setupNodeInteractions(node) {
    let isDragging = false;
    let isConnecting = false;
    let startX, startY, initialX, initialY;
    let selectedNode = null;

    // Node selection and settings
    node.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isDragging && !isConnecting) {
            selectNode(node);
        }
    });

    // Settings button
    const settingsBtn = node.querySelector('.node-settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openNodeSettings(node);
        });
    }

    // Node dragging
    node.addEventListener('mousedown', (e) => {
        if (e.target.closest('.connection-point') || e.target.closest('.node-settings-btn')) {
            return;
        }

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialX = parseInt(node.style.left);
        initialY = parseInt(node.style.top);
        node.style.zIndex = '1000';

        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        const newX = initialX + deltaX;
        const newY = initialY + deltaY;

        node.style.left = newX + 'px';
        node.style.top = newY + 'px';

        // Update stored position
        if (window.flowNodes && window.flowNodes.has(node.id)) {
            const nodeData = window.flowNodes.get(node.id);
            nodeData.x = newX;
            nodeData.y = newY;
        }

        // Update connections
        updateNodeConnections(node.id);
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            node.style.zIndex = 'auto';
        }
    });

    // Connection points
    const connectionPoints = node.querySelectorAll('.connection-point');
    connectionPoints.forEach(point => {
        point.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            startConnection(node, point);
        });
    });
}

function selectNode(node) {
    // Remove previous selection
    document.querySelectorAll('.flow-node.selected').forEach(n => {
        n.classList.remove('selected');
    });

    // Select current node
    node.classList.add('selected');

    console.log('🎯 Node selected:', node.id);
}

function openNodeSettings(node) {
    console.log('⚙️ Opening settings for node:', node.id);

    const nodeData = window.flowNodes.get(node.id);
    if (!nodeData) return;

    // Create settings modal
    const modal = createSettingsModal(nodeData);
    document.body.appendChild(modal);

    // Show modal
    setTimeout(() => modal.classList.add('show'), 10);
}

function createSettingsModal(nodeData) {
    const modal = document.createElement('div');
    modal.className = 'node-settings-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-cog"></i> ${getNodeLabel(nodeData.type)} Settings</h3>
                <button class="modal-close" onclick="closeSettingsModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                ${generateNodeSettingsForm(nodeData)}
            </div>
            <div class="modal-footer">
                <button class="modal-btn secondary" onclick="closeSettingsModal()">Cancel</button>
                <button class="modal-btn primary" onclick="saveNodeSettings('${nodeData.id}')">Save Settings</button>
            </div>
        </div>
    `;

    return modal;
}

function generateNodeSettingsForm(nodeData) {
    const type = nodeData.type;
    const data = nodeData.data;

    switch (type) {
        case 'input':
            return `
                <div class="form-group">
                    <label>Input Label</label>
                    <input type="text" id="nodeLabel" value="${data.label || ''}" class="form-control">
                </div>
                <div class="form-group">
                    <label>Default Query</label>
                    <textarea id="nodeQuery" class="form-control" rows="3">${data.query || ''}</textarea>
                </div>
            `;
        case 'llm':
            return `
                <div class="form-group">
                    <label>LLM Label</label>
                    <input type="text" id="nodeLabel" value="${data.label || ''}" class="form-control">
                </div>
                <div class="form-group">
                    <label>System Prompt</label>
                    <textarea id="nodePrompt" class="form-control" rows="4">${data.prompt || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Model</label>
                    <select id="nodeModel" class="form-control">
                        <option value="gemini-pro" ${data.model === 'gemini-pro' ? 'selected' : ''}>Gemini Pro</option>
                        <option value="gpt-4" ${data.model === 'gpt-4' ? 'selected' : ''}>GPT-4</option>
                        <option value="claude-3" ${data.model === 'claude-3' ? 'selected' : ''}>Claude 3</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Temperature</label>
                    <input type="range" id="nodeTemperature" min="0" max="1" step="0.1" value="${data.temperature || 0.7}" class="form-control">
                    <span class="range-value">${data.temperature || 0.7}</span>
                </div>
            `;
        case 'tool':
            return `
                <div class="form-group">
                    <label>Tool Label</label>
                    <input type="text" id="nodeLabel" value="${data.label || ''}" class="form-control">
                </div>
                <div class="form-group">
                    <label>Tool Action</label>
                    <select id="nodeAction" class="form-control">
                        <option value="github_create_issue" ${data.action === 'github_create_issue' ? 'selected' : ''}>GitHub Create Issue</option>
                        <option value="gmail_send_email" ${data.action === 'gmail_send_email' ? 'selected' : ''}>Gmail Send Email</option>
                        <option value="slack_send_message" ${data.action === 'slack_send_message' ? 'selected' : ''}>Slack Send Message</option>
                        <option value="creative_studio" ${data.action === 'creative_studio' ? 'selected' : ''}>Creative Studio</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Parameters</label>
                    <textarea id="nodeParameters" class="form-control" rows="3">${data.parameters || ''}</textarea>
                </div>
            `;
        case 'agent':
            return `
                <div class="form-group">
                    <label>Agent Label</label>
                    <input type="text" id="nodeLabel" value="${data.label || ''}" class="form-control">
                </div>
                <div class="form-group">
                    <label>Agent Role</label>
                    <textarea id="nodeRole" class="form-control" rows="3">${data.role || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Available Tools</label>
                    <div class="checkbox-group">
                        <label><input type="checkbox" ${data.tools?.includes('github') ? 'checked' : ''}> GitHub</label>
                        <label><input type="checkbox" ${data.tools?.includes('gmail') ? 'checked' : ''}> Gmail</label>
                        <label><input type="checkbox" ${data.tools?.includes('slack') ? 'checked' : ''}> Slack</label>
                        <label><input type="checkbox" ${data.tools?.includes('creative') ? 'checked' : ''}> Creative Studio</label>
                    </div>
                </div>
            `;
        case 'output':
            return `
                <div class="form-group">
                    <label>Output Label</label>
                    <input type="text" id="nodeLabel" value="${data.label || ''}" class="form-control">
                </div>
                <div class="form-group">
                    <label>Output Format</label>
                    <select id="nodeFormat" class="form-control">
                        <option value="text" ${data.format === 'text' ? 'selected' : ''}>Text</option>
                        <option value="json" ${data.format === 'json' ? 'selected' : ''}>JSON</option>
                        <option value="markdown" ${data.format === 'markdown' ? 'selected' : ''}>Markdown</option>
                    </select>
                </div>
            `;
        default:
            return `
                <div class="form-group">
                    <label>Node Label</label>
                    <input type="text" id="nodeLabel" value="${data.label || ''}" class="form-control">
                </div>
            `;
    }
}

function getDefaultNodeData(nodeType) {
    const defaults = {
        'input': { label: 'Input', query: '' },
        'llm': { label: 'LLM', prompt: '', model: 'gemini-pro', temperature: 0.7 },
        'tool': { label: 'Tool', action: '', parameters: '' },
        'agent': { label: 'Agent', role: '', tools: [] },
        'output': { label: 'Output', format: 'text' }
    };
    return defaults[nodeType] || { label: 'Node' };
}

function closeSettingsModal() {
    const modal = document.querySelector('.node-settings-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

function saveNodeSettings(nodeId) {
    console.log('💾 Saving settings for node:', nodeId);

    const nodeData = window.flowNodes.get(nodeId);
    if (!nodeData) return;

    // Get form values
    const label = document.getElementById('nodeLabel')?.value || '';
    nodeData.data.label = label;

    // Update specific fields based on node type
    switch (nodeData.type) {
        case 'input':
            nodeData.data.query = document.getElementById('nodeQuery')?.value || '';
            break;
        case 'llm':
            nodeData.data.prompt = document.getElementById('nodePrompt')?.value || '';
            nodeData.data.model = document.getElementById('nodeModel')?.value || 'gemini-pro';
            nodeData.data.temperature = parseFloat(document.getElementById('nodeTemperature')?.value || 0.7);
            break;
        case 'tool':
            nodeData.data.action = document.getElementById('nodeAction')?.value || '';
            nodeData.data.parameters = document.getElementById('nodeParameters')?.value || '';
            break;
        case 'agent':
            nodeData.data.role = document.getElementById('nodeRole')?.value || '';
            // Get selected tools from checkboxes
            const toolCheckboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
            nodeData.data.tools = Array.from(toolCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.parentElement.textContent.trim().toLowerCase());
            break;
        case 'output':
            nodeData.data.format = document.getElementById('nodeFormat')?.value || 'text';
            break;
    }

    // Update visual node label
    const node = document.getElementById(nodeId);
    if (node) {
        const labelElement = node.querySelector('.node-label');
        if (labelElement) {
            labelElement.textContent = label || getNodeLabel(nodeData.type);
        }
    }

    closeSettingsModal();
    showNotification('✅ Node settings saved!', 'success');
}

function createNewFlow() {
    console.log('🆕 Creating new flow...');

    // Clear the canvas and reset data
    const canvas = document.querySelector('.flow-canvas');
    if (canvas) {
        canvas.innerHTML = `
            <div class="canvas-placeholder">
                <i class="fas fa-project-diagram"></i>
                <h3>New Flow Created</h3>
                <p>Drag nodes from the sidebar to build your workflow</p>
            </div>
        `;
    }

    // Reset flow data
    window.flowNodes = new Map();
    window.flowConnections = [];

    showNotification('🆕 New flow created! Start building your workflow.', 'success');
}

function importFlow() {
    console.log('📥 Importing flow...');

    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';

    input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const flowData = JSON.parse(e.target.result);
                    console.log('📥 Flow imported:', flowData);
                    showNotification('📥 Flow imported successfully!', 'success');
                } catch (error) {
                    console.error('Error importing flow:', error);
                    showNotification('❌ Error importing flow', 'error');
                }
            };
            reader.readAsText(file);
        }
    };

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
}

async function executeCurrentFlow() {
    console.log('🚀 Executing current flow...');

    // Check if we have nodes and connections
    if (!window.flowNodes || window.flowNodes.size === 0) {
        showNotification('⚠️ No nodes in the flow to execute', 'warning');
        return;
    }

    try {
        // Convert flow data to workflow configuration
        const workflowConfig = {
            nodes: Array.from(window.flowNodes.values()),
            connections: window.flowConnections || []
        };

        // Show execution status
        showNotification('🔄 Executing workflow...', 'info');

        // Execute workflow via orchestrator API
        const response = await fetch('http://localhost:5001/api/orchestrator/workflow/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                workflow: workflowConfig
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification('✅ Workflow executed successfully!', 'success');

            // Show execution results in a modal
            showWorkflowResults(result.result);
        } else {
            showNotification(`❌ Workflow execution failed: ${result.error}`, 'error');
        }

    } catch (error) {
        console.error('Error executing workflow:', error);
        showNotification('❌ Error executing workflow', 'error');
    }
}

function showWorkflowResults(result) {
    console.log('📊 Showing workflow results:', result);

    // Create results modal
    const modal = document.createElement('div');
    modal.className = 'workflow-results-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-chart-line"></i> Workflow Execution Results</h3>
                <button class="modal-close" onclick="closeWorkflowResults()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="results-summary">
                    <div class="result-stat">
                        <span class="stat-label">Status:</span>
                        <span class="stat-value ${result.success ? 'success' : 'error'}">
                            ${result.success ? 'Success' : 'Failed'}
                        </span>
                    </div>
                    <div class="result-stat">
                        <span class="stat-label">Agents Used:</span>
                        <span class="stat-value">${result.agents_used || 0}</span>
                    </div>
                    <div class="result-stat">
                        <span class="stat-label">Tasks Completed:</span>
                        <span class="stat-value">${result.tasks_completed || 0}</span>
                    </div>
                </div>

                <div class="results-content">
                    <h4>Execution Output:</h4>
                    <div class="result-output">
                        ${result.result || 'No output available'}
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-btn secondary" onclick="closeWorkflowResults()">Close</button>
                <button class="modal-btn primary" onclick="exportWorkflowResults()">Export Results</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Show modal
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeWorkflowResults() {
    const modal = document.querySelector('.workflow-results-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

function exportWorkflowResults() {
    console.log('📤 Exporting workflow results...');
    showNotification('📤 Results export coming soon!', 'info');
}

function saveCurrentFlow() {
    console.log('💾 Saving current flow...');

    if (!window.flowNodes || window.flowNodes.size === 0) {
        showNotification('⚠️ No flow to save', 'warning');
        return;
    }

    try {
        // Create flow data
        const flowData = {
            nodes: Array.from(window.flowNodes.values()),
            connections: window.flowConnections || [],
            metadata: {
                name: 'Untitled Flow',
                created: new Date().toISOString(),
                version: '1.0.0'
            }
        };

        // Save to localStorage
        const flowId = `flow_${Date.now()}`;
        localStorage.setItem(flowId, JSON.stringify(flowData));

        // Also save to a list of saved flows
        const savedFlows = JSON.parse(localStorage.getItem('savedFlows') || '[]');
        savedFlows.push({
            id: flowId,
            name: flowData.metadata.name,
            created: flowData.metadata.created,
            nodeCount: flowData.nodes.length,
            connectionCount: flowData.connections.length
        });
        localStorage.setItem('savedFlows', JSON.stringify(savedFlows));

        showNotification('💾 Flow saved successfully!', 'success');

    } catch (error) {
        console.error('Error saving flow:', error);
        showNotification('❌ Error saving flow', 'error');
    }
}

function exportCurrentFlow() {
    console.log('📤 Exporting current flow...');

    if (!window.flowNodes || window.flowNodes.size === 0) {
        showNotification('⚠️ No flow to export', 'warning');
        return;
    }

    try {
        // Create flow data
        const flowData = {
            nodes: Array.from(window.flowNodes.values()),
            connections: window.flowConnections || [],
            metadata: {
                name: 'Exported Flow',
                created: new Date().toISOString(),
                version: '1.0.0',
                platform: 'Metatron Agent Flow Builder'
            }
        };

        // Create downloadable file
        const dataStr = JSON.stringify(flowData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(dataBlob);
        downloadLink.download = `metatron-flow-${Date.now()}.json`;

        // Trigger download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        showNotification('📤 Flow exported successfully!', 'success');

    } catch (error) {
        console.error('Error exporting flow:', error);
        showNotification('❌ Error exporting flow', 'error');
    }
}

// Connection System
function startConnection(fromNode, connectionPoint) {
    console.log('🔗 Starting connection from:', fromNode.id);

    const canvas = document.querySelector('.flow-canvas');
    const connectionsLayer = canvas.querySelector('.flow-connections');

    if (!connectionsLayer) return;

    const pointType = connectionPoint.dataset.type;
    if (pointType !== 'output') return; // Only start connections from output points

    // Create temporary connection line
    const tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tempLine.setAttribute('class', 'temp-connection');
    tempLine.setAttribute('stroke', 'var(--accent-primary)');
    tempLine.setAttribute('stroke-width', '2');
    tempLine.setAttribute('stroke-dasharray', '5,5');

    const fromRect = fromNode.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const startX = fromRect.right - canvasRect.left - 10;
    const startY = fromRect.top + fromRect.height / 2 - canvasRect.top;

    tempLine.setAttribute('x1', startX);
    tempLine.setAttribute('y1', startY);
    tempLine.setAttribute('x2', startX);
    tempLine.setAttribute('y2', startY);

    connectionsLayer.appendChild(tempLine);

    // Track mouse movement
    const handleMouseMove = (e) => {
        const mouseX = e.clientX - canvasRect.left;
        const mouseY = e.clientY - canvasRect.top;
        tempLine.setAttribute('x2', mouseX);
        tempLine.setAttribute('y2', mouseY);
    };

    // Handle connection completion
    const handleMouseUp = (e) => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        // Check if we're over a valid target
        const target = e.target.closest('.flow-node');
        const targetPoint = e.target.closest('.connection-point');

        if (target && targetPoint && target !== fromNode && targetPoint.dataset.type === 'input') {
            createConnection(fromNode.id, target.id);
        }

        // Remove temporary line
        tempLine.remove();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

function createConnection(fromNodeId, toNodeId) {
    console.log('🔗 Creating connection:', fromNodeId, '→', toNodeId);

    // Initialize connections array if needed
    if (!window.flowConnections) window.flowConnections = [];

    // Check if connection already exists
    const existingConnection = window.flowConnections.find(
        conn => conn.from === fromNodeId && conn.to === toNodeId
    );

    if (existingConnection) {
        showNotification('⚠️ Connection already exists!', 'warning');
        return;
    }

    // Create connection data
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const connection = {
        id: connectionId,
        from: fromNodeId,
        to: toNodeId
    };

    window.flowConnections.push(connection);

    // Draw the connection
    drawConnection(connection);

    showNotification('✅ Nodes connected!', 'success');
}

function drawConnection(connection) {
    const canvas = document.querySelector('.flow-canvas');
    const connectionsLayer = canvas.querySelector('.flow-connections');

    if (!connectionsLayer) return;

    const fromNode = document.getElementById(connection.from);
    const toNode = document.getElementById(connection.to);

    if (!fromNode || !toNode) return;

    const canvasRect = canvas.getBoundingClientRect();
    const fromRect = fromNode.getBoundingClientRect();
    const toRect = toNode.getBoundingClientRect();

    const startX = fromRect.right - canvasRect.left - 10;
    const startY = fromRect.top + fromRect.height / 2 - canvasRect.top;
    const endX = toRect.left - canvasRect.left + 10;
    const endY = toRect.top + toRect.height / 2 - canvasRect.top;

    // Create SVG path for curved connection
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const controlX1 = startX + (endX - startX) * 0.5;
    const controlX2 = startX + (endX - startX) * 0.5;

    const pathData = `M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`;

    path.setAttribute('d', pathData);
    path.setAttribute('stroke', 'var(--accent-primary)');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('class', 'flow-connection');
    path.setAttribute('data-connection-id', connection.id);

    // Add arrow marker
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', `arrow-${connection.id}`);
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '10');
    marker.setAttribute('refX', '8');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');

    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    arrow.setAttribute('points', '0 0, 10 3, 0 6');
    arrow.setAttribute('fill', 'var(--accent-primary)');

    marker.appendChild(arrow);
    connectionsLayer.appendChild(marker);

    path.setAttribute('marker-end', `url(#arrow-${connection.id})`);

    // Add click handler for connection deletion
    path.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Delete this connection?')) {
            deleteConnection(connection.id);
        }
    });

    connectionsLayer.appendChild(path);
}

function updateNodeConnections(nodeId) {
    if (!window.flowConnections) return;

    // Redraw all connections involving this node
    window.flowConnections.forEach(connection => {
        if (connection.from === nodeId || connection.to === nodeId) {
            // Remove old connection line
            const oldPath = document.querySelector(`[data-connection-id="${connection.id}"]`);
            if (oldPath) oldPath.remove();

            // Redraw connection
            drawConnection(connection);
        }
    });
}

function deleteConnection(connectionId) {
    // Remove from data
    if (window.flowConnections) {
        window.flowConnections = window.flowConnections.filter(conn => conn.id !== connectionId);
    }

    // Remove visual elements
    const path = document.querySelector(`[data-connection-id="${connectionId}"]`);
    if (path) path.remove();

    const marker = document.querySelector(`#arrow-${connectionId}`);
    if (marker) marker.remove();

    showNotification('🗑️ Connection deleted!', 'success');
}

// Canvas Controls
function initializeCanvasControls() {
    const canvas = document.querySelector('.flow-canvas');
    if (!canvas) return;

    // Add canvas controls
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'canvas-controls';
    controlsContainer.innerHTML = `
        <button class="canvas-control-btn" id="zoomInBtn" title="Zoom In">
            <i class="fas fa-plus"></i>
        </button>
        <button class="canvas-control-btn" id="zoomOutBtn" title="Zoom Out">
            <i class="fas fa-minus"></i>
        </button>
        <button class="canvas-control-btn" id="resetZoomBtn" title="Reset Zoom">
            <i class="fas fa-expand-arrows-alt"></i>
        </button>
        <button class="canvas-control-btn" id="fitToScreenBtn" title="Fit to Screen">
            <i class="fas fa-compress-arrows-alt"></i>
        </button>
    `;

    canvas.appendChild(controlsContainer);

    // Initialize zoom and pan
    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let isPanning = false;
    let lastPanX = 0;
    let lastPanY = 0;

    function updateTransform() {
        const nodesContainer = canvas.querySelector('.flow-nodes-container');
        const connectionsLayer = canvas.querySelector('.flow-connections');

        const transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;

        if (nodesContainer) {
            nodesContainer.style.transform = transform;
            nodesContainer.style.transformOrigin = '0 0';
        }

        if (connectionsLayer) {
            connectionsLayer.style.transform = transform;
            connectionsLayer.style.transformOrigin = '0 0';
        }
    }

    // Zoom controls
    document.getElementById('zoomInBtn').addEventListener('click', () => {
        scale = Math.min(scale * 1.2, 3);
        updateTransform();
    });

    document.getElementById('zoomOutBtn').addEventListener('click', () => {
        scale = Math.max(scale / 1.2, 0.1);
        updateTransform();
    });

    document.getElementById('resetZoomBtn').addEventListener('click', () => {
        scale = 1;
        translateX = 0;
        translateY = 0;
        updateTransform();
    });

    document.getElementById('fitToScreenBtn').addEventListener('click', () => {
        // Calculate bounds of all nodes
        const nodes = canvas.querySelectorAll('.flow-node');
        if (nodes.length === 0) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        nodes.forEach(node => {
            const x = parseInt(node.style.left);
            const y = parseInt(node.style.top);
            const width = parseInt(node.style.width);
            const height = parseInt(node.style.height);

            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + width);
            maxY = Math.max(maxY, y + height);
        });

        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;
        const canvasWidth = canvas.clientWidth;
        const canvasHeight = canvas.clientHeight;

        const scaleX = (canvasWidth - 100) / contentWidth;
        const scaleY = (canvasHeight - 100) / contentHeight;
        scale = Math.min(scaleX, scaleY, 1);

        translateX = (canvasWidth - contentWidth * scale) / 2 - minX * scale;
        translateY = (canvasHeight - contentHeight * scale) / 2 - minY * scale;

        updateTransform();
    });

    // Pan functionality
    canvas.addEventListener('mousedown', (e) => {
        if (e.target === canvas || e.target.classList.contains('flow-nodes-container')) {
            isPanning = true;
            lastPanX = e.clientX;
            lastPanY = e.clientY;
            canvas.style.cursor = 'grabbing';
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isPanning) {
            const deltaX = e.clientX - lastPanX;
            const deltaY = e.clientY - lastPanY;

            translateX += deltaX;
            translateY += deltaY;

            lastPanX = e.clientX;
            lastPanY = e.clientY;

            updateTransform();
        }
    });

    canvas.addEventListener('mouseup', () => {
        isPanning = false;
        canvas.style.cursor = 'default';
    });

    // Wheel zoom
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const oldScale = scale;
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        scale = Math.max(0.1, Math.min(3, scale * zoomFactor));

        // Adjust translation to zoom towards mouse position
        const scaleChange = scale / oldScale;
        translateX = mouseX - (mouseX - translateX) * scaleChange;
        translateY = mouseY - (mouseY - translateY) * scaleChange;

        updateTransform();
    });

    console.log('✅ Canvas controls initialized');
}

function setupAgentFlowCommunication() {
    console.log('🔗 Setting up Agent Flow communication...');

    // Listen for messages from Agent Flow iframe
    window.addEventListener('message', (event) => {
        // Verify origin for security
        if (event.origin !== 'http://localhost:3000') return;

        const { type, data } = event.data;

        switch (type) {
            case 'WORKFLOW_EXECUTE':
                console.log('🚀 Executing workflow from Agent Flow:', data);
                executeAgentFlowWorkflow(data);
                break;

            case 'WORKFLOW_SAVE':
                console.log('💾 Saving workflow from Agent Flow:', data);
                saveAgentFlowWorkflow(data);
                break;

            case 'WORKFLOW_EXPORT':
                console.log('📤 Exporting workflow from Agent Flow:', data);
                exportAgentFlowWorkflow(data);
                break;

            case 'IFRAME_READY':
                console.log('✅ Agent Flow iframe ready');
                showNotification('🎨 Agent Flow ready for use!', 'success');
                break;

            default:
                console.log('📨 Unknown message from Agent Flow:', type, data);
        }
    });

    // Send configuration to Agent Flow
    const iframe = document.getElementById('agentFlowIframe');
    if (iframe) {
        iframe.onload = () => {
            // Send Metatron configuration to Agent Flow
            iframe.contentWindow.postMessage({
                type: 'METATRON_CONFIG',
                data: {
                    orchestratorUrl: 'http://localhost:5001',
                    theme: 'dark',
                    primaryColor: '#069494'
                }
            }, 'http://localhost:3000');
        };
    }
}

async function executeAgentFlowWorkflow(workflowData) {
    console.log('🚀 Executing Agent Flow workflow via Metatron orchestrator...');

    try {
        // Execute workflow via our orchestrator API
        const response = await fetch('http://localhost:5001/api/orchestrator/workflow/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                workflow: workflowData
            })
        });

        const result = await response.json();

        // Send result back to Agent Flow
        const iframe = document.getElementById('agentFlowIframe');
        if (iframe) {
            iframe.contentWindow.postMessage({
                type: 'WORKFLOW_RESULT',
                data: result
            }, 'http://localhost:3000');
        }

        if (result.success) {
            showNotification('✅ Workflow executed successfully!', 'success');
        } else {
            showNotification(`❌ Workflow execution failed: ${result.error}`, 'error');
        }

    } catch (error) {
        console.error('Error executing workflow:', error);
        showNotification('❌ Error executing workflow', 'error');

        // Send error back to Agent Flow
        const iframe = document.getElementById('agentFlowIframe');
        if (iframe) {
            iframe.contentWindow.postMessage({
                type: 'WORKFLOW_ERROR',
                data: { error: error.message }
            }, 'http://localhost:3000');
        }
    }
}

function saveAgentFlowWorkflow(workflowData) {
    console.log('💾 Saving Agent Flow workflow...');

    try {
        // Save to localStorage as backup
        const workflowId = workflowData.id || `workflow_${Date.now()}`;
        localStorage.setItem(`agent_flow_${workflowId}`, JSON.stringify(workflowData));

        showNotification('💾 Workflow saved successfully!', 'success');

    } catch (error) {
        console.error('Error saving workflow:', error);
        showNotification('❌ Error saving workflow', 'error');
    }
}

function exportAgentFlowWorkflow(workflowData) {
    console.log('📤 Exporting Agent Flow workflow...');

    try {
        // Create downloadable file
        const dataStr = JSON.stringify(workflowData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(dataBlob);
        downloadLink.download = `agent-flow-${workflowData.name || 'workflow'}-${Date.now()}.json`;

        // Trigger download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        showNotification('📤 Workflow exported successfully!', 'success');

    } catch (error) {
        console.error('Error exporting workflow:', error);
        showNotification('❌ Error exporting workflow', 'error');
    }
}

function refreshAgentFlow() {
    console.log('🔄 Refreshing Agent Flow...');

    const iframe = document.getElementById('agentFlowIframe');
    if (iframe) {
        iframe.src = iframe.src; // Reload iframe
        showNotification('🔄 Agent Flow refreshed', 'info');
    }
}

function openAgentFlowInNewTab() {
    console.log('🔗 Opening Agent Flow in new tab...');

    const iframe = document.getElementById('agentFlowIframe');
    if (iframe) {
        window.open(iframe.src, '_blank');
        showNotification('🔗 Agent Flow opened in new tab', 'info');
    }
}

function loadAgentFlowDirect() {
    console.log('🎯 Loading Agent Flow directly (bypassing health check)...');

    const container = document.getElementById('flowBuilderContainer');
    if (!container) return;

    // Generate a unique flow ID for this session
    const flowId = `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create iframe for Agent Flow directly
    container.innerHTML = `
        <div class="agent-flow-iframe-container">
            <div class="iframe-header">
                <div class="iframe-title">
                    <i class="fas fa-project-diagram"></i>
                    Professional Agent Flow Builder
                </div>
                <div class="iframe-controls">
                    <button class="iframe-btn" onclick="refreshAgentFlow()" title="Refresh">
                        <i class="fas fa-refresh"></i>
                    </button>
                    <button class="iframe-btn" onclick="openAgentFlowInNewTab()" title="Open in New Tab">
                        <i class="fas fa-external-link-alt"></i>
                    </button>
                </div>
            </div>
            <iframe
                id="agentFlowIframe"
                src="http://localhost:3000/builder/${flowId}"
                width="100%"
                height="100%"
                frameborder="0"
                style="border: none; background: var(--bg-primary);"
                onload="handleAgentFlowLoad()"
                onerror="handleAgentFlowError()">
            </iframe>
        </div>
    `;

    // Set up iframe communication
    setupAgentFlowCommunication();

    showNotification('🎨 Loading Agent Flow directly...', 'info');
}

function handleAgentFlowLoad() {
    console.log('✅ Agent Flow iframe loaded successfully');
    showNotification('🎨 Professional Agent Flow Builder loaded!', 'success');
}

function handleAgentFlowError() {
    console.log('❌ Agent Flow iframe failed to load');
    showNotification('❌ Agent Flow service not available', 'error');
}

function handleFlowBuilderResize() {
    // Ensure Flow Builder maintains proper dimensions on window resize
    const flowContainer = document.querySelector('.flow-builder-container');
    const iframeContainer = document.querySelector('.agent-flow-iframe-container');

    if (flowContainer && iframeContainer) {
        // Recalculate heights based on viewport
        const viewportHeight = window.innerHeight;
        const newHeight = Math.max(600, viewportHeight - 200);

        flowContainer.style.height = newHeight + 'px';

        console.log('🔄 Flow Builder resized to:', newHeight + 'px');
    }
}

function initializeChatInterface() {
    // Reinitialize chat functionality after returning from management
    const textInput = document.querySelector('.text-input');
    const sendBtn = document.querySelector('.btn-send');

    if (textInput && sendBtn) {
        // Remove existing listeners and re-add them
        const newSendBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);

        const newTextInput = textInput.cloneNode(true);
        textInput.parentNode.replaceChild(newTextInput, textInput);

        // Re-add event listeners
        newSendBtn.addEventListener('click', sendMessage);
        newTextInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
}

// Cerebral Memory System Functions
function initializeCerebralMemory() {
    const brainBtn = document.getElementById('brainMemoryBtn');
    const memoryModal = document.getElementById('cerebralMemoryModal');
    const closeMemoryBtn = document.getElementById('closeMemoryBtn');

    if (brainBtn) {
        brainBtn.addEventListener('click', openCerebralMemory);
    }

    if (closeMemoryBtn) {
        closeMemoryBtn.addEventListener('click', closeCerebralMemory);
    }

    // Close modal when clicking outside
    if (memoryModal) {
        memoryModal.addEventListener('click', (e) => {
            if (e.target === memoryModal) {
                closeCerebralMemory();
            }
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && memoryModal && memoryModal.classList.contains('active')) {
            closeCerebralMemory();
        }
    });
}

function openCerebralMemory() {
    const memoryModal = document.getElementById('cerebralMemoryModal');
    const appContainer = document.getElementById('cerebralAppContainer');

    if (memoryModal) {
        memoryModal.classList.add('active');

        // Load the Cerebral app in iframe to keep user in main app
        loadCerebralApp(appContainer);
    }
}

function closeCerebralMemory() {
    const memoryModal = document.getElementById('cerebralMemoryModal');

    if (memoryModal) {
        memoryModal.classList.remove('active');

        // Clean up the 3D brain when closing
        const appContainer = document.getElementById('cerebralAppContainer');
        if (appContainer && appContainer.brainInstance) {
            appContainer.brainInstance.destroy();
            appContainer.brainInstance = null;
        }

        // Reset container for next load
        if (appContainer) {
            appContainer.innerHTML = `
                <div class="memory-loading">
                    <i class="fas fa-brain"></i>
                    <h3>Loading Memory System...</h3>
                    <p>Initializing 3D brain interface</p>
                </div>
            `;
        }
    }
}

function loadCerebralApp(container) {
    if (!container) return;

    // Clear container and create 3D brain
    container.innerHTML = '';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.position = 'relative';

    try {
        // Initialize the 3D brain
        const brain = new CerebralBrain(container);
        console.log('Cerebral Memory System loaded successfully');

        // Store brain instance for cleanup
        container.brainInstance = brain;
    } catch (error) {
        console.error('Failed to load Cerebral Memory System:', error);
        container.innerHTML = `
            <div class="memory-loading">
                <i class="fas fa-exclamation-triangle" style="color: #ff6b6b;"></i>
                <h3>Failed to Load Memory System</h3>
                <p>Error: ${error.message}</p>
                <button onclick="loadCerebralApp(document.getElementById('cerebralAppContainer'))" style="margin-top: 16px; padding: 8px 16px; background: var(--accent-primary); color: white; border: none; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-refresh"></i> Retry
                </button>
            </div>
        `;
    }
}
