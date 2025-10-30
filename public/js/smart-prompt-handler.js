// Smart Prompt Handler - Hide/Show Prompt Based on Model Requirements
// Membuat UI lebih user-friendly seperti fal.ai sandbox

(function() {
    'use strict';
    
    // ========== MODEL CONFIGURATION ==========
    
    // Models yang TIDAK memerlukan prompt (hanya upload)
    const NO_PROMPT_MODELS = {
        // Image models - hanya butuh upload
        'fal-ai/clarity-upscaler': {
            requiresUpload: true,
            requiresPrompt: false,
            uploadLabel: 'Upload Image to Upscale',
            uploadPlaceholder: 'Upload an image to upscale to higher resolution',
            generateButtonText: 'Upscale Image'
        },
        'fal-ai/imageutils/rembg': {
            requiresUpload: true,
            requiresPrompt: false,
            uploadLabel: 'Upload Image',
            uploadPlaceholder: 'Upload an image to remove background',
            generateButtonText: 'Remove Background'
        },
        'fal-ai/face-to-sticker': {
            requiresUpload: true,
            requiresPrompt: false,
            uploadLabel: 'Upload Face Photo',
            uploadPlaceholder: 'Upload a photo with a face to convert to sticker',
            generateButtonText: 'Create Sticker'
        },
        'fal-ai/face-swap': {
            requiresUpload: true,
            requiresPrompt: false,
            uploadLabel: 'Upload Face Photos',
            uploadPlaceholder: 'Upload images for face swapping',
            generateButtonText: 'Swap Faces'
        },
        'fal-ai/flux-pro/inpainting': {
            requiresUpload: true,
            requiresPrompt: false,
            uploadLabel: 'Upload Image to Edit',
            uploadPlaceholder: 'Upload an image to retouch or edit',
            generateButtonText: 'Edit Image'
        },
        'fal-ai/flux-pro/v1.1-ultra': {
            requiresUpload: true,
            requiresPrompt: true, // This one needs both
            uploadLabel: 'Upload Reference Image (Optional)',
            uploadPlaceholder: 'Upload a reference image',
            generateButtonText: 'Generate Image'
        },
        // 3D Generation models
        'fal-ai/bytedance/seed3d': {
            requiresUpload: true,
            requiresPrompt: false,
            uploadLabel: 'Upload Image for 3D',
            uploadPlaceholder: 'Upload an image to convert to 3D model',
            generateButtonText: 'Generate 3D'
        },
        // Note: Text-to-3D models DO require prompt (unlike image-to-3d)
        // They will be auto-detected by model detection logic
    };
    
    // Models yang butuh prompt tapi bisa optional upload
    const OPTIONAL_UPLOAD_MODELS = [
        'fal-ai/flux-pro/inpainting',
        'fal-ai/flux-realism/inpainting'
    ];
    
    // ========== STATE MANAGEMENT ==========
    
    let currentMode = 'image';
    let currentModel = null;
    let promptSections = {
        image: null,
        video: null
    };
    let isProcessing = false; // Flag to prevent infinite loops
    let initializationComplete = false;
    
    // Debounce helper
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // ========== INITIALIZATION ==========
    
    async function loadNoPromptModelsFromDatabase() {
        try {
            console.log('🔄 Loading no-prompt models from database...');
            const response = await fetch('/api/models/no-prompt');
            const data = await response.json();
            
            if (data.success && data.models) {
                console.log(`✅ Loaded ${data.models.length} no-prompt models from database`);
                
                // Add database models to NO_PROMPT_MODELS if not already there
                data.models.forEach(modelId => {
                    if (!NO_PROMPT_MODELS[modelId]) {
                        NO_PROMPT_MODELS[modelId] = {
                            requiresUpload: true,
                            requiresPrompt: false,
                            uploadLabel: 'Upload Image/Video',
                            uploadPlaceholder: 'Upload file to process',
                            generateButtonText: 'Process'
                        };
                        console.log('➕ Added model from database:', modelId);
                    }
                });
                
                console.log('✅ Total no-prompt models:', Object.keys(NO_PROMPT_MODELS).length);
                console.log('📋 No-prompt models:', Object.keys(NO_PROMPT_MODELS).join(', '));
                
                // ✅ Re-check current model after loading from database
                setTimeout(() => {
                    if (currentModel) {
                        console.log('🔄 Re-checking current model after database load:', currentModel);
                        updateUIForModel(currentModel, currentMode || 'image');
                    }
                }, 200);
            }
        } catch (error) {
            console.warn('⚠️ Could not load no-prompt models from database, using defaults:', error.message);
        }
    }
    
    function init() {
        // Prevent double initialization
        if (initializationComplete) {
            console.log('⚠️ Smart Prompt Handler already initialized');
            return;
        }
        
        console.log('🎯 Smart Prompt Handler initializing...');
        
        try {
            // Get prompt sections with error handling
            promptSections.image = document.querySelector('#image-mode > div:has(#image-textarea)');
            promptSections.video = document.querySelector('#video-mode > div:has(#video-textarea)');
            
            // Load no-prompt models from database
            loadNoPromptModelsFromDatabase();
            
            // Listen to model selection changes
            setupModelListeners();
            
            // Listen to mode changes
            setupModeListeners();
            
            initializationComplete = true;
            console.log('✅ Smart Prompt Handler initialized successfully');
            
            // Initial check after a brief delay to let other scripts initialize
            setTimeout(() => {
                checkCurrentModel();
            }, 500);
        } catch (error) {
            console.error('❌ Smart Prompt Handler initialization failed:', error);
        }
    }
    
    // ========== EVENT LISTENERS ==========
    
    // Debounced update function to prevent multiple rapid calls
    const debouncedUpdateUI = debounce(function(modelId, mode) {
        if (!isProcessing) {
            updateUIForModel(modelId, mode);
        }
    }, 100);
    
    function setupModelListeners() {
        // Image model selection
        const imageModelSelect = document.getElementById('image-model-select');
        if (imageModelSelect) {
            // Remove any existing listeners first
            const newSelect = imageModelSelect.cloneNode(true);
            imageModelSelect.parentNode.replaceChild(newSelect, imageModelSelect);
            
            newSelect.addEventListener('change', function(e) {
                e.stopPropagation(); // Prevent event bubbling
                if (isProcessing) return; // Skip if already processing
                
                currentMode = 'image';
                currentModel = this.value;
                console.log('📷 Image model selected:', currentModel);
                debouncedUpdateUI(currentModel, 'image');
            }, { passive: true });
        }
        
        // Video model selection
        const videoModelSelect = document.getElementById('video-model-select');
        if (videoModelSelect) {
            // Remove any existing listeners first
            const newSelect = videoModelSelect.cloneNode(true);
            videoModelSelect.parentNode.replaceChild(newSelect, videoModelSelect);
            
            newSelect.addEventListener('change', function(e) {
                e.stopPropagation(); // Prevent event bubbling
                if (isProcessing) return; // Skip if already processing
                
                currentMode = 'video';
                currentModel = this.value;
                console.log('🎬 Video model selected:', currentModel);
                debouncedUpdateUI(currentModel, 'video');
            }, { passive: true });
        }
        
        // Listen to model card clicks (from browse page) - with debouncing
        document.addEventListener('model-selected', function(e) {
            if (isProcessing) return;
            
            currentModel = e.detail.modelId;
            currentMode = e.detail.type || 'image';
            console.log('🎯 Model selected from card:', currentModel, 'type:', currentMode);
            debouncedUpdateUI(currentModel, currentMode);
        }, { passive: true, once: false });
    }
    
    function setupModeListeners() {
        const creationTabs = document.querySelectorAll('.creation-tab');
        creationTabs.forEach(tab => {
            tab.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent event bubbling
                if (isProcessing) return;
                
                const mode = this.getAttribute('data-mode');
                if (mode === 'image' || mode === 'video') {
                    currentMode = mode;
                    console.log('🔄 Mode switched to:', mode);
                    setTimeout(() => checkCurrentModel(), 200);
                }
            }, { passive: true });
        });
    }
    
    // ========== UI UPDATE LOGIC ==========
    
    function updateUIForModel(modelId, mode) {
        // Set processing flag to prevent concurrent calls
        if (isProcessing) {
            console.log('⚠️ Already processing, skipping update');
            return;
        }
        
        // ✅ VALIDATE: Only update UI if mode matches active tab
        const activeTab = document.querySelector('.creation-tab.active');
        const actualMode = activeTab ? activeTab.getAttribute('data-mode') : 'image';
        
        if (mode !== actualMode) {
            console.log('⚠️ Mode mismatch! Requested:', mode, '| Actual:', actualMode, '| Skipping update');
            return;
        }
        
        isProcessing = true;
        console.log('🔧 Updating UI for model:', modelId, 'mode:', mode);
        
        try {
            const modelConfig = NO_PROMPT_MODELS[modelId];
            const promptSection = mode === 'image' ? promptSections.image : promptSections.video;
            const uploadSection = mode === 'image' 
                ? document.getElementById('image-upload-section')
                : document.getElementById('video-upload-section');
            const typeSelect = mode === 'image'
                ? document.getElementById('image-type')
                : document.getElementById('video-type');
            
            if (!promptSection) {
                console.warn('⚠️ Prompt section not found for mode:', mode);
                return;
            }
            
            // Check if model doesn't need prompt
            if (modelConfig && !modelConfig.requiresPrompt) {
                console.log('🔍 Model config found for:', modelId);
                console.log('   - requiresPrompt:', modelConfig.requiresPrompt);
                console.log('   - requiresUpload:', modelConfig.requiresUpload);
                console.log('   ✅ HIDING PROMPT SECTION');
                
                // Hide prompt section
                hidePromptSection(promptSection, mode);
                
                // Show upload section
                if (uploadSection && modelConfig.requiresUpload) {
                    showUploadSection(uploadSection, modelConfig, mode);
                }
                
                // Update type dropdown WITHOUT triggering change event
                // This prevents infinite loops
                if (typeSelect) {
                    let newValue;
                    if (modelId.includes('upscale')) {
                        newValue = 'upscale';
                    } else if (modelId.includes('rembg')) {
                        newValue = 'remove-bg';
                    } else if (modelId.includes('seed3d') || modelId.includes('image-to-3d') || modelId.includes('img2mesh')) {
                        // ✅ Image-to-3D models - set to image-to-3d type
                        newValue = 'image-to-3d';
                    } else if (modelId.includes('3d')) {
                        // ✅ Other 3D models - set to text-to-3d type
                        newValue = 'text-to-3d';
                    } else {
                        newValue = 'edit-image'; // Default for other edit models
                    }
                    
                    if (typeSelect.value !== newValue) {
                        typeSelect.value = newValue;
                        // Don't dispatch change event - it causes infinite loops
                        // The type is already set, no need to trigger other handlers
                    }
                }
                
                // Update generate button text
                updateGenerateButton(modelConfig.generateButtonText || 'Generate');
                
                console.log('✅ Prompt hidden for no-prompt model:', modelId);
            } else {
                if (modelConfig) {
                    console.log('🔍 Model config found BUT requiresPrompt is TRUE');
                    console.log('   - Model:', modelId);
                    console.log('   - requiresPrompt:', modelConfig.requiresPrompt);
                } else {
                    console.log('⚠️ No config found for model:', modelId);
                    console.log('   Available models:', Object.keys(NO_PROMPT_MODELS).slice(0, 5).join(', ') + '...');
                }
                // Show prompt section
                showPromptSection(promptSection, mode);
                
                // Upload section visibility depends on type
                if (uploadSection) {
                    const currentType = typeSelect ? typeSelect.value : '';
                    const needsUpload = currentType !== 'text-to-image' && currentType !== 'text-to-video';
                    
                    if (needsUpload) {
                        showUploadSection(uploadSection, modelConfig || {
                            uploadLabel: mode === 'image' ? 'Upload Image' : 'Upload Start Frame',
                            uploadPlaceholder: 'Upload file for editing'
                        }, mode);
                    } else {
                        uploadSection.classList.add('hidden');
                    }
                }
                
                // Reset generate button text
                updateGenerateButton('Run');
                
                console.log('✅ Prompt shown for standard model:', modelId);
            }
        } catch (error) {
            console.error('❌ Error updating UI:', error);
        } finally {
            // Clear processing flag after a brief delay
            setTimeout(() => {
                isProcessing = false;
            }, 100);
        }
    }
    
    function hidePromptSection(section, mode) {
        if (!section) return;
        
        section.classList.add('hidden');
        section.style.display = 'none';
        
        // Add info message
        const infoId = `${mode}-prompt-hidden-info`;
        let infoMessage = document.getElementById(infoId);
        
        if (!infoMessage) {
            infoMessage = document.createElement('div');
            infoMessage.id = infoId;
            infoMessage.className = 'bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4';
            infoMessage.innerHTML = `
                <div class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <div class="flex-1">
                        <p class="text-sm text-blue-300 font-medium">No Prompt Required</p>
                        <p class="text-xs text-blue-400/70 mt-1">This model only needs an image upload. Just upload your file and click generate!</p>
                    </div>
                </div>
            `;
            
            // Insert before the upload section
            const uploadSection = mode === 'image'
                ? document.getElementById('image-upload-section')
                : document.getElementById('video-upload-section');
            
            if (uploadSection && uploadSection.parentNode) {
                uploadSection.parentNode.insertBefore(infoMessage, uploadSection);
            }
        }
    }
    
    function showPromptSection(section, mode) {
        if (!section) return;
        
        section.classList.remove('hidden');
        section.style.display = '';
        
        // Remove info message if exists
        const infoId = `${mode}-prompt-hidden-info`;
        const infoMessage = document.getElementById(infoId);
        if (infoMessage) {
            infoMessage.remove();
        }
    }
    
    function showUploadSection(section, config, mode) {
        if (!section) return;
        
        section.classList.remove('hidden');
        
        // Update upload label if config provided
        if (config.uploadLabel) {
            const label = section.querySelector('label');
            if (label) {
                label.textContent = config.uploadLabel;
            }
        }
        
        // Update upload placeholder text
        if (config.uploadPlaceholder) {
            const placeholder = section.querySelector('p');
            if (placeholder) {
                placeholder.textContent = config.uploadPlaceholder;
            }
        }
    }
    
    function updateGenerateButton(text) {
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) {
            const span = generateBtn.querySelector('span');
            if (span) {
                span.textContent = text;
            }
        }
    }
    
    function checkCurrentModel() {
        // Don't check if not initialized yet or already processing
        if (!initializationComplete || isProcessing) {
            return;
        }
        
        try {
            const selectId = currentMode === 'image' ? 'image-model-select' : 'video-model-select';
            const select = document.getElementById(selectId);
            
            if (select && select.value) {
                currentModel = select.value;
                // Use debounced version to prevent rapid calls
                debouncedUpdateUI(currentModel, currentMode);
            }
        } catch (error) {
            console.error('❌ Error checking current model:', error);
        }
    }
    
    // ========== VALIDATION ==========
    
    // Override validation for no-prompt models
    window.validateGenerationInputs = function(mode, model, prompt, uploadFile) {
        const modelConfig = NO_PROMPT_MODELS[model];
        
        if (modelConfig && !modelConfig.requiresPrompt) {
            // For no-prompt models, only check upload
            if (modelConfig.requiresUpload && !uploadFile) {
                return {
                    valid: false,
                    message: 'Please upload an image file'
                };
            }
            return {
                valid: true,
                message: 'Ready to generate'
            };
        } else {
            // Standard validation - need prompt
            if (!prompt || prompt.trim().length === 0) {
                return {
                    valid: false,
                    message: 'Please enter a prompt'
                };
            }
            return {
                valid: true,
                message: 'Ready to generate'
            };
        }
    };
    
    // ========== EXPORT ==========
    
    // Export functions for external use
    window.SmartPromptHandler = {
        init: init,
        updateUIForModel: updateUIForModel,
        isNoPromptModel: function(modelId) {
            return NO_PROMPT_MODELS.hasOwnProperty(modelId) && !NO_PROMPT_MODELS[modelId].requiresPrompt;
        },
        getModelConfig: function(modelId) {
            return NO_PROMPT_MODELS[modelId] || null;
        }
    };
    
    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();

