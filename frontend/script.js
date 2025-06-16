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

    // Load VideoSDK interface in an iframe
    setTimeout(() => {
        content.innerHTML = `
            <div class="videosdk-container">
                <iframe
                    src="videosdk/index.html"
                    allow="camera; microphone; fullscreen; display-capture"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-downloads"
                    loading="lazy">
                </iframe>
            </div>
        `;
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
