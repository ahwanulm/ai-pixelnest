// Auto Prompt Enhancement Feature
// Intelligently enhances user prompts using Groq AI

(function() {
    'use strict';

    // ========== CONFIGURATION ==========
    
    let autoPromptEnabled = false;
    let isEnhancing = false;
    let serviceAvailable = false;
    
    // LocalStorage keys
    const STORAGE_KEY = 'pixelnest_auto_prompt_state';
    
    // State management with persistence
    const state = {
        image: { originalPrompt: '', enhancedPrompt: '', isActive: false },
        video: { originalPrompt: '', enhancedPrompt: '', isActive: false },
        audio: { originalPrompt: '', enhancedPrompt: '', isActive: false }
    };
    
    // Load saved state from localStorage
    function loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                state.image.isActive = parsed.image || false;
                state.video.isActive = parsed.video || false;
                state.audio.isActive = parsed.audio || false;
            }
        } catch (error) {
            console.error('Failed to load auto prompt state:', error);
        }
    }
    
    // Save state to localStorage
    function saveState() {
        try {
            const toSave = {
                image: state.image.isActive,
                video: state.video.isActive,
                audio: state.audio.isActive
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        } catch (error) {
            console.error('Failed to save auto prompt state:', error);
        }
    }

    // ========== INITIALIZATION ==========
    
    async function init() {
        
        try {
            // Load saved state from localStorage FIRST
            loadState();
            
            // Create auto prompt toggles for each mode
            createAutoPromptToggle('image', 'image-textarea');
            createAutoPromptToggle('video', 'video-textarea');
            createAutoPromptToggle('audio', 'audio-prompt');
            
            // Apply saved state to checkboxes
            applyStateToCheckboxes();
            
            // Set up event listeners
            setupEventListeners();
            
            // Check if service is available (async, doesn't block UI)
            checkServiceStatus().then(available => {
                if (!available) {
                    console.warn('⚠️ Auto Prompt service not configured - toggles will be hidden when models are selected');
                }
            });
            
        } catch (error) {
            console.error('❌ Auto Prompt Enhancement initialization failed:', error);
        }
    }
    
    // Apply saved state to checkboxes
    function applyStateToCheckboxes() {
        ['image', 'video', 'audio'].forEach(mode => {
            const checkbox = document.getElementById(`${mode}-auto-prompt-checkbox`);
            if (checkbox) {
                checkbox.checked = state[mode].isActive;
            }
        });
    }

    // ========== SERVICE STATUS ==========
    
    async function checkServiceStatus() {
        try {
            const response = await fetch('/api/auto-prompt/status');
            const data = await response.json();
            serviceAvailable = data.available;
            
            if (!serviceAvailable) {
                console.warn('⚠️ Auto Prompt service not available');
            }
            
            return serviceAvailable;
        } catch (error) {
            console.error('❌ Failed to check auto prompt status:', error);
            serviceAvailable = false;
            return false;
        }
    }

    // ========== UI CREATION ==========
    
    function createAutoPromptToggle(mode, textareaId) {
        const textarea = document.getElementById(textareaId);
        if (!textarea) {
            console.warn(`⚠️ Textarea not found: ${textareaId}`);
            return;
        }

        // Get saved state for this mode
        const isChecked = state[mode]?.isActive || false;
        
        // Create toggle UI - COMPACT VERSION
        const toggleHtml = `
            <div id="${mode}-auto-prompt-toggle" class="auto-prompt-toggle mb-2">
                <div class="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-orange-500/10 to-violet-500/10 border border-orange-500/30 rounded-lg transition-all duration-300 hover:border-orange-500/50">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-wand-magic-sparkles text-orange-400 text-sm"></i>
                        <span class="text-xs font-medium text-white">Auto Prompt</span>
                        <span class="px-1.5 py-0.5 bg-orange-500/20 text-orange-300 text-[10px] rounded-full">AI</span>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="${mode}-auto-prompt-checkbox" class="sr-only peer" ${isChecked ? 'checked' : ''}>
                        <div class="w-9 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-orange-500 peer-checked:to-violet-500"></div>
                    </label>
                </div>
                <div id="${mode}-auto-prompt-status" class="mt-1.5 text-xs text-orange-400 flex items-center gap-1.5 ml-2" style="display: none;">
                    <div class="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                    <span>Enhancing...</span>
                </div>
            </div>
        `;

        // Insert TEPAT SEBELUM textarea (di atas kolom prompt)
        textarea.insertAdjacentHTML('beforebegin', toggleHtml);
    }

    // ========== EVENT LISTENERS ==========
    
    function setupEventListeners() {
        // Listen to checkbox changes
        ['image', 'video', 'audio'].forEach(mode => {
            const checkbox = document.getElementById(`${mode}-auto-prompt-checkbox`);
            if (checkbox) {
                checkbox.addEventListener('change', function() {
                    // Update state
                    state[mode].isActive = this.checked;
                    
                    // Save to localStorage (PERSISTENT!)
                    saveState();
                    
                    if (this.checked) {
                    } else {
                        // Clear cached prompts when disabled
                        state[mode].originalPrompt = '';
                        state[mode].enhancedPrompt = '';
                    }
                    
                    // ⚠️ DO NOT auto-enhance immediately when checkbox is toggled
                    // Enhancement will happen automatically when user clicks "Run" button
                    // This prevents aggressive/unexpected behavior
                });
            }
        });

        // Listen to model changes to show/hide auto prompt toggle
        document.addEventListener('DOMContentLoaded', () => {
            setupModelChangeListeners();
        });
    }
    
    // ⚠️ AUTO-ENHANCE ON TYPING DISABLED
    // Enhancement now only happens when user clicks "Run" button
    // This prevents aggressive auto-enhancement while user is still typing
    // See dashboard-generation.js line ~1187 for enhancement logic on Generate click

    function setupModelChangeListeners() {
        // Image model select
        const imageModelSelect = document.getElementById('image-model-select');
        if (imageModelSelect) {
            imageModelSelect.addEventListener('change', () => {
                updateToggleVisibility('image', imageModelSelect.value);
            });
            // Initial check after small delay to ensure DOM is ready
            setTimeout(() => {
                updateToggleVisibility('image', imageModelSelect.value);
            }, 100);
        } else {
            // If no model select yet, show toggle by default
            setTimeout(() => {
                const toggle = document.getElementById('image-auto-prompt-toggle');
                if (toggle) toggle.style.display = 'block';
            }, 100);
        }

        // Video model select
        const videoModelSelect = document.getElementById('video-model-select');
        if (videoModelSelect) {
            videoModelSelect.addEventListener('change', () => {
                updateToggleVisibility('video', videoModelSelect.value);
            });
            // Initial check after small delay
            setTimeout(() => {
                updateToggleVisibility('video', videoModelSelect.value);
            }, 100);
        } else {
            // If no model select yet, show toggle by default
            setTimeout(() => {
                const toggle = document.getElementById('video-auto-prompt-toggle');
                if (toggle) toggle.style.display = 'block';
            }, 100);
        }

        // Audio - always show by default (no complex model selection)
        setTimeout(() => {
            const toggle = document.getElementById('audio-auto-prompt-toggle');
            if (toggle) {
                toggle.style.display = 'block';
            }
        }, 100);
    }

    // ========== TOGGLE VISIBILITY ==========
    
    function updateToggleVisibility(mode, modelId) {
        const toggle = document.getElementById(`${mode}-auto-prompt-toggle`);
        if (!toggle) {
            console.warn(`⚠️ Toggle not found for mode: ${mode}`);
            return;
        }

        // Models that don't require prompts (from smart-prompt-handler.js)
        const noPromptModels = [
            'fal-ai/clarity-upscaler',
            'fal-ai/imageutils/rembg',
            'fal-ai/face-to-sticker'
        ];

        // Hide toggle for models that don't need prompts
        if (noPromptModels.includes(modelId)) {
            toggle.style.display = 'none';
        } else {
            // Show toggle for models that need prompts
            toggle.style.display = 'block';
        }
        
        // Add warning badge if service not available
        if (!serviceAvailable) {
            const statusDiv = toggle.querySelector('.flex.items-center.justify-between');
            if (statusDiv && !statusDiv.querySelector('.service-warning')) {
                const warning = document.createElement('div');
                warning.className = 'service-warning px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded ml-2';
                warning.innerHTML = '<i class="fas fa-exclamation-triangle mr-1"></i>Not configured';
                statusDiv.appendChild(warning);
            }
        }
    }

    // ========== PROMPT ENHANCEMENT ==========
    
    async function enhancePromptForMode(mode) {
        if (isEnhancing) {
            return;
        }

        const textareaId = mode === 'image' ? 'image-textarea' : 
                          mode === 'video' ? 'video-textarea' : 'audio-prompt';
        const textarea = document.getElementById(textareaId);
        const statusDiv = document.getElementById(`${mode}-auto-prompt-status`);
        
        if (!textarea || !statusDiv) return;

        const originalPrompt = textarea.value.trim();
        
        // Don't enhance if empty or too short
        if (!originalPrompt || originalPrompt.length < 3) {
            return;
        }

        // ✨ CRITICAL: Save original prompt FIRST before any enhancement
        state[mode].originalPrompt = originalPrompt;

        // Don't enhance if already enhanced (check if we already have this exact original)
        if (state[mode].originalPrompt === originalPrompt && state[mode].enhancedPrompt) {
            textarea.value = state[mode].enhancedPrompt;
            return;
        }

        isEnhancing = true;
        
        // Show professional loading animation
        showEnhancingAnimation(statusDiv, textarea);

        try {
            // Get current model
            const modelSelect = mode === 'image' ? document.getElementById('image-model-select') :
                               mode === 'video' ? document.getElementById('video-model-select') : null;
            const modelId = modelSelect ? modelSelect.value : '';

            const response = await fetch('/api/auto-prompt/enhance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: originalPrompt,
                    mode: mode,
                    modelId: modelId
                })
            });

            if (!response.ok) {
                // Handle different error statuses
                if (response.status === 503) {
                    throw new Error('⚠️ Auto Prompt service not configured. Please contact admin to setup Groq API.');
                } else if (response.status === 401) {
                    throw new Error('🔒 Please login to use Auto Prompt feature.');
                } else {
                    throw new Error('❌ Failed to enhance prompt. Please try again.');
                }
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Enhancement failed');
            }

            // Store in state (originalPrompt already saved above, just update enhanced)
            // ✨ CRITICAL: Don't overwrite originalPrompt - it's already saved
            if (!state[mode].originalPrompt) {
                state[mode].originalPrompt = originalPrompt;
            }
            state[mode].enhancedPrompt = data.enhancedPrompt || originalPrompt;

            // Animate the enhancement
            await animatePromptEnhancement(textarea, originalPrompt, data.enhancedPrompt);

            // Show success notification
            showNotification('✨ Prompt enhanced successfully!', 'success');

        } catch (error) {
            console.error('❌ Prompt enhancement error:', error);
            
            // More specific error messages
            let errorMsg = error.message;
            if (errorMsg.includes('not configured')) {
                showNotification('⚠️ Auto Prompt not configured. Contact admin.', 'warning');
            } else if (errorMsg.includes('login')) {
                showNotification('🔒 Please login to use Auto Prompt', 'error');
            } else {
                showNotification('❌ Enhancement failed. Please try again.', 'error');
            }
            
            // Auto-disable toggle if service not available
            if (errorMsg.includes('not configured')) {
                const checkbox = document.getElementById(`${mode}-auto-prompt-checkbox`);
                if (checkbox) {
                    checkbox.checked = false;
                    state[mode].isActive = false;
                    saveState();
                }
            }
        } finally {
            isEnhancing = false;
            hideEnhancingAnimation(statusDiv, textarea);
        }
    }

    // ========== ANIMATION ==========
    
    // Show professional loading animation
    function showEnhancingAnimation(statusDiv, textarea) {
        // Update status text with animation
        statusDiv.innerHTML = `
            <div class="flex items-center gap-2">
                <div class="relative">
                    <div class="w-4 h-4 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
                    <div class="absolute inset-0 w-4 h-4 border-2 border-transparent border-r-violet-500 rounded-full animate-spin" style="animation-duration: 0.8s; animation-direction: reverse;"></div>
                </div>
                <span class="text-orange-400 font-medium animate-pulse">Menyempurnakan prompt</span>
                <div class="flex gap-0.5 ml-1">
                    <span class="w-1 h-1 bg-orange-400 rounded-full animate-bounce" style="animation-delay: 0s;"></span>
                    <span class="w-1 h-1 bg-orange-400 rounded-full animate-bounce" style="animation-delay: 0.1s;"></span>
                    <span class="w-1 h-1 bg-orange-400 rounded-full animate-bounce" style="animation-delay: 0.2s;"></span>
                </div>
            </div>
        `;
        statusDiv.style.display = 'flex';
        
        // Add subtle glow effect to textarea
        textarea.style.transition = 'all 0.3s ease';
        textarea.style.boxShadow = '0 0 15px rgba(251, 146, 60, 0.15)';
        textarea.style.borderColor = 'rgba(251, 146, 60, 0.3)';
    }
    
    // Hide loading animation
    function hideEnhancingAnimation(statusDiv, textarea) {
        statusDiv.style.display = 'none';
        textarea.style.boxShadow = '';
        textarea.style.borderColor = '';
    }
    
    async function animatePromptEnhancement(textarea, originalText, enhancedText) {
        return new Promise((resolve) => {
            // Create typing effect container
            const typingIndicator = document.createElement('div');
            typingIndicator.className = 'absolute top-2 right-2 flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-500/20 to-violet-500/20 border border-orange-500/30 rounded-lg backdrop-blur-sm';
            typingIndicator.innerHTML = `
                <i class="fas fa-wand-magic-sparkles text-orange-400 text-xs animate-pulse"></i>
                <span class="text-xs text-orange-300 font-medium">AI Enhancing...</span>
            `;
            
            // Add to textarea parent
            const parent = textarea.parentElement;
            const originalPosition = parent.style.position;
            parent.style.position = 'relative';
            parent.appendChild(typingIndicator);
            
            // Fade out original with scale effect
            textarea.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            textarea.style.opacity = '0.4';
            textarea.style.transform = 'scale(0.98)';
            textarea.style.filter = 'blur(2px)';

            setTimeout(() => {
                // Update text
                textarea.value = enhancedText;
                
                // Remove blur and fade in
                textarea.style.opacity = '1';
                textarea.style.transform = 'scale(1)';
                textarea.style.filter = 'blur(0px)';
                
                // Add success glow effect
                textarea.style.boxShadow = '0 0 30px rgba(251, 146, 60, 0.4), 0 0 60px rgba(139, 92, 246, 0.2)';
                
                setTimeout(() => {
                    // Remove typing indicator with fade
                    typingIndicator.style.transition = 'all 0.3s ease';
                    typingIndicator.style.opacity = '0';
                    typingIndicator.style.transform = 'translateY(-10px)';
                    
                    setTimeout(() => {
                        typingIndicator.remove();
                        parent.style.position = originalPosition;
                        
                        // Gradually remove glow
                        textarea.style.transition = 'box-shadow 0.8s ease';
                        textarea.style.boxShadow = '';
                        
                        resolve();
                    }, 300);
                }, 800);
            }, 400);
        });
    }

    // ========== NOTIFICATIONS ==========
    
    function showNotification(message, type = 'info') {
        // Use existing notification system if available
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
        }
    }

    // ========== GENERATION INTEGRATION ==========
    
    // Add auto-prompt info to loading cards
    function addAutoPromptToLoadingCard() {
        // Override the createLoadingCard function to include auto-prompt status
        const originalCreateLoadingCard = window.createLoadingCard;
        if (originalCreateLoadingCard) {
            window.createLoadingCard = function(generationType) {
                const currentMode = generationType || 'image';
                const isAutoPromptActive = state[currentMode]?.isActive || false;
                
                return originalCreateLoadingCard(generationType, { 
                    autoPromptActive: isAutoPromptActive 
                });
            };
        }
    }
    
    // Hook into generation process to enhance prompts before submission
    window.addEventListener('beforeGenerate', async (event) => {
        const { mode, prompt, modelId } = event.detail;
        
        if (!state[mode]?.isActive || !prompt) return;

        // Enhance prompt before generating
        try {
            event.preventDefault(); // Pause generation
            
            const textareaId = mode === 'image' ? 'image-textarea' : 
                              mode === 'video' ? 'video-textarea' : 'audio-prompt';
            const textarea = document.getElementById(textareaId);
            
            if (textarea) {
                await enhancePromptForMode(mode);
                
                // Dispatch enhanced generation event
                window.dispatchEvent(new CustomEvent('promptEnhanced', {
                    detail: { mode, enhancedPrompt: textarea.value }
                }));
            }
        } catch (error) {
            console.error('Enhancement error:', error);
        }
    });
    
    // Integrate with loading cards
    setTimeout(() => {
        addAutoPromptToLoadingCard();
    }, 1000);

    // ========== EXPORT ==========
    
    window.AutoPrompt = {
        init,
        enhancePrompt: enhancePromptForMode,
        isServiceAvailable: () => serviceAvailable,
        isEnabled: (mode) => state[mode]?.isActive || false,
        getOriginalPrompt: (mode) => state[mode]?.originalPrompt || null,
        getEnhancedPrompt: (mode) => state[mode]?.enhancedPrompt || null,
        clearState: () => {
            localStorage.removeItem(STORAGE_KEY);
        }
    };

    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

