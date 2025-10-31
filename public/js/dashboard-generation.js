// Dashboard Generation Logic

// ========== DYNAMIC UPLOAD FIELDS MANAGEMENT ==========
let dynamicUploadFieldsCount = 1;
let maxDynamicUploadFields = 3;
let uploadDelegationInitialized = false; // Flag to prevent multiple delegation setup

/**
 * Setup Image Upload Mode based on model configuration
 * @param {string} imageType - The type of image operation
 * @param {string} uploadMode - Upload mode: 'single', 'dynamic', 'batch', 'both'
 * @param {number} maxImages - Maximum number of images allowed
 */
function setupImageUploadMode(imageType, uploadMode, maxImages) {
    const addImageBtn = document.getElementById('add-image-field-btn');
    const dynamicFieldsContainer = document.getElementById('dynamic-upload-fields');
    const imageFilesList = document.getElementById('image-files-list');
    const uploadLabel = document.getElementById('image-upload-label');
    const uploadLabelMulti = document.getElementById('image-upload-label-multi');
    
    // ✅ SAFETY: Default to single upload if not specified
    uploadMode = uploadMode || 'single';
    maxImages = maxImages || 1;
    
    // Reset dynamic fields count
    dynamicUploadFieldsCount = 1;
    maxDynamicUploadFields = maxImages;
    
    // Show/hide appropriate labels
    if (uploadMode === 'single' || maxImages === 1) {
        // Single upload mode (DEFAULT for backward compatibility)
        if (uploadLabel) uploadLabel.classList.remove('hidden');
        if (uploadLabelMulti) uploadLabelMulti.classList.add('hidden');
        if (addImageBtn) addImageBtn.classList.add('hidden');
        if (imageFilesList) imageFilesList.classList.add('hidden');
        
        // Remove extra upload fields if any
        removeAllDynamicUploadFields();
        
        console.log('📌 Upload mode: SINGLE (backward compatible)');
    } else {
        // Multiple upload mode (ONLY for models with supports_multi_image)
        if (uploadLabel) uploadLabel.classList.add('hidden');
        if (uploadLabelMulti) {
            uploadLabelMulti.classList.remove('hidden');
            uploadLabelMulti.textContent = `Upload Images (Max: ${maxImages})`;
        }
        
        if (uploadMode === 'dynamic' || uploadMode === 'both') {
            // Show add button for dynamic mode
            if (addImageBtn) addImageBtn.classList.remove('hidden');
        } else {
            if (addImageBtn) addImageBtn.classList.add('hidden');
        }
        
        console.log(`📌 Upload mode: MULTIPLE (max: ${maxImages}, mode: ${uploadMode})`);
    }
}

/**
 * Add a new dynamic upload field
 */
function addDynamicUploadField() {
    if (dynamicUploadFieldsCount >= maxDynamicUploadFields) {
        showNotification(`Maximum ${maxDynamicUploadFields} images allowed`, 'warning');
        return;
    }
    
    const container = document.getElementById('dynamic-upload-fields');
    if (!container) return;
    
    dynamicUploadFieldsCount++;
    const fieldIndex = dynamicUploadFieldsCount - 1;
    
    const fieldHTML = `
        <div class="upload-field-item" data-field-index="${fieldIndex}">
            <div class="relative border-2 border-dashed border-white/20 rounded-lg p-4 text-center hover:border-white/50 transition-all duration-300 cursor-pointer group hover:scale-[1.02]">
                <span class="absolute inset-0 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                
                <!-- Remove button -->
                <button type="button" class="remove-upload-field absolute top-2 right-2 z-20 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition">
                    <i class="fas fa-times"></i>
                </button>
                
                <input type="file" class="hidden image-upload-input" accept="image/*" data-index="${fieldIndex}">
                <svg class="w-8 h-8 mx-auto mb-2 text-gray-500 group-hover:text-white transition-colors duration-300 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                <p class="text-xs text-gray-500 group-hover:text-gray-300 transition-colors duration-300 relative z-10 image-upload-text">Click to upload image ${fieldIndex + 1}</p>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', fieldHTML);
    
    console.log(`✅ Added upload field ${fieldIndex + 1}/${maxDynamicUploadFields}`);
}

/**
 * Remove a specific dynamic upload field
 */
function removeDynamicUploadField(fieldIndex) {
    const field = document.querySelector(`.upload-field-item[data-field-index="${fieldIndex}"]`);
    if (field && fieldIndex > 0) { // Don't remove the first field (index 0)
        field.remove();
        dynamicUploadFieldsCount--;
        console.log(`❌ Removed upload field ${fieldIndex + 1}`);
    }
}

/**
 * Remove all dynamic upload fields except the first one
 */
function removeAllDynamicUploadFields() {
    const container = document.getElementById('dynamic-upload-fields');
    if (!container) return;
    
    const fields = container.querySelectorAll('.upload-field-item');
    fields.forEach((field, index) => {
        if (index > 0) { // Keep the first field
            field.remove();
        }
    });
    
    dynamicUploadFieldsCount = 1;
}

/**
 * ✅ Setup event delegation for upload fields (ONCE)
 * This prevents multiple listeners on the same element
 */
function setupUploadDelegation() {
    if (uploadDelegationInitialized) {
        console.log('⏭️ Upload delegation already initialized, skipping...');
        return;
    }
    
    const container = document.getElementById('dynamic-upload-fields');
    if (!container) return;
    
    console.log('🔧 Setting up event delegation for upload fields...');
    
    // ✅ Use event delegation on parent container - SINGLE CLICK HANDLER
    container.addEventListener('click', function(e) {
        // Priority 1: Check for remove button click
        const removeBtn = e.target.closest('.remove-upload-field');
        if (removeBtn) {
            e.stopPropagation();
            e.preventDefault();
            
            const fieldItem = removeBtn.closest('.upload-field-item');
            if (fieldItem) {
                const fieldIndex = parseInt(fieldItem.dataset.fieldIndex);
                removeDynamicUploadField(fieldIndex);
            }
            return; // Exit early
        }
        
        // Priority 2: Check for dropzone click (upload trigger)
        const dropzone = e.target.closest('.upload-field-item .relative');
        if (dropzone) {
            const fieldItem = e.target.closest('.upload-field-item');
            if (!fieldItem) return;
            
            const input = fieldItem.querySelector('.image-upload-input');
            if (!input) return;
            
            console.log(`🖱️ Upload field ${fieldItem.dataset.fieldIndex} clicked`);
            
            // Stop propagation to prevent any parent handlers
            e.stopPropagation();
            
            // Trigger file input
            input.click();
        }
    });
    
    // ✅ Handle file selection changes via delegation
    container.addEventListener('change', function(e) {
        if (!e.target.classList.contains('image-upload-input')) return;
        
        const input = e.target;
        const fieldItem = input.closest('.upload-field-item');
        if (!fieldItem) return;
        
        const textEl = fieldItem.querySelector('.image-upload-text');
        
        if (input.files && input.files.length > 0) {
            const fileName = input.files[0].name;
            const fileSize = (input.files[0].size / 1024 / 1024).toFixed(2);
            
            if (textEl) {
                textEl.innerHTML = `<i class="fas fa-check-circle text-green-400 mr-1"></i> ${fileName} <span class="text-gray-600">(${fileSize} MB)</span>`;
                textEl.classList.add('text-green-400');
            }
            
            console.log(`✅ File selected for field ${input.dataset.index || 0}: ${fileName}`);
        }
    });
    
    uploadDelegationInitialized = true;
    console.log('✅ Upload delegation initialized successfully');
}

document.addEventListener('DOMContentLoaded', function() {
    // State management
    let currentQuantity = 1;
    
    // ===== Dynamic Upload Button =====
    const addImageFieldBtn = document.getElementById('add-image-field-btn');
    if (addImageFieldBtn) {
        addImageFieldBtn.addEventListener('click', function() {
            addDynamicUploadField();
        });
    }
    
    // ✅ Setup event delegation for upload fields (ONCE)
    setupUploadDelegation();
    
    // ✨ Helper function to clean model names (remove fal.ai and fal.id references)
    function cleanModelName(modelName) {
        if (!modelName) return 'Unknown Model';
        
        // Remove common fal.ai and fal.id prefixes and patterns
        let cleaned = modelName
            .replace(/^fal-ai\//gi, '')      // Remove fal-ai/ prefix
            .replace(/^fal\.ai\//gi, '')     // Remove fal.ai/ prefix
            .replace(/^fal\.id\//gi, '')     // Remove fal.id/ prefix
            .replace(/^fal-id\//gi, '')      // Remove fal-id/ prefix
            .replace(/\(fal\.ai\)/gi, '')    // Remove (fal.ai) suffix
            .replace(/\(fal\.id\)/gi, '')    // Remove (fal.id) suffix
            .replace(/\[fal\.ai\]/gi, '')    // Remove [fal.ai] suffix
            .replace(/\[fal\.id\]/gi, '')    // Remove [fal.id] suffix
            .replace(/- fal\.ai$/gi, '')     // Remove - fal.ai suffix
            .replace(/- fal\.id$/gi, '')     // Remove - fal.id suffix
            .replace(/by fal\.ai/gi, '')     // Remove by fal.ai
            .replace(/by fal\.id/gi, '')     // Remove by fal.id
            .trim();
        
        // Make model name more user-friendly (optional beautification)
        // Replace dashes and underscores with spaces for better readability
        cleaned = cleaned
            .replace(/[-_]/g, ' ')           // Replace - and _ with spaces
            .replace(/\s+/g, ' ')            // Remove multiple spaces
            .trim();
        
        // Capitalize first letter of each word for better presentation
        cleaned = cleaned.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        
        return cleaned || modelName; // Return original if cleaning results in empty string
    }
    
    // ✨ Helper function to format time as "X minutes/hours/days ago"
    function timeAgo(date) {
        if (!date) return 'Unknown time';
        
        const timestamp = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        const secondsAgo = Math.floor((now - timestamp) / 1000);
        
        if (secondsAgo < 10) return 'just now';
        if (secondsAgo < 60) return `${secondsAgo} seconds ago`;
        
        const minutesAgo = Math.floor(secondsAgo / 60);
        if (minutesAgo < 60) return minutesAgo === 1 ? '1 minute ago' : `${minutesAgo} minutes ago`;
        
        const hoursAgo = Math.floor(minutesAgo / 60);
        if (hoursAgo < 24) return hoursAgo === 1 ? '1 hour ago' : `${hoursAgo} hours ago`;
        
        const daysAgo = Math.floor(hoursAgo / 24);
        if (daysAgo < 30) return daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;
        
        const monthsAgo = Math.floor(daysAgo / 30);
        if (monthsAgo < 12) return monthsAgo === 1 ? '1 month ago' : `${monthsAgo} months ago`;
        
        const yearsAgo = Math.floor(monthsAgo / 12);
        return yearsAgo === 1 ? '1 year ago' : `${yearsAgo} years ago`;
    }
    
    // ✨ FIX: Get current mode dynamically (supports state restoration)
    function getCurrentMode() {
        const activeTab = document.querySelector('.creation-tab.active');
        const mode = activeTab ? activeTab.getAttribute('data-mode') : 'image';
        return mode;
    }
    
    // Initialize with current active tab
    let currentMode = getCurrentMode();
    
    // ✨ Initialize SSE connection for real-time progress updates
    if (window.queueClient && !window.queueClient.eventSource) {
        window.queueClient.connectSSE(
            // onUpdate: Real-time progress updates
            (data) => {
                
                // Find loading card for this job
                const loadingCard = document.querySelector(`[data-job-id="${data.jobId}"]`);
                if (loadingCard && typeof updateLoadingProgress === 'function') {
                    updateLoadingProgress(loadingCard, data.progress, data.status);
                } else if (!loadingCard) {
                }
            },
            // onComplete: Will be handled by individual pollJobStatus
            null,
            // onError: Will be handled by individual pollJobStatus
            null
        );
    }
    
    // ✨ Re-check mode after delay to handle:
    // 1. State restoration (dashboard.js)
    // 2. Model loading (models-loader.js, model-cards-handler.js)
    // 3. Tab initialization
    setTimeout(() => {
        const restoredMode = getCurrentMode();
        if (restoredMode !== currentMode) {
            currentMode = restoredMode;
        }
    }, 300); // Increased to 300ms to wait for all initializations
    
    // ✨ Track generation state per mode (allows concurrent generations)
    let isGenerating = {
        image: false,
        video: false,
        audio: false
    };
    
    // ✨ Rate limiting: Max 3 concurrent generations recommended by FAL.AI best practices
    const MAX_CONCURRENT_GENERATIONS = 3;
    
    let availableModels = []; // Store loaded models with real prices
    let selectedModel = null; // Currently selected model

    // Store last pricing update timestamp
    let lastPricingUpdate = 0;
    let pricingCheckInterval = null;

    // Load available models from database
    async function loadAvailableModels(forceReload = false) {
        try {
            
            // ✨ FIX: Load models for BOTH image and video, not just current mode
            // This ensures models are available regardless of tab switches
            const cacheBuster = Date.now();
            
            // Load image models
            const imageResponse = await fetch(`/api/models/dashboard?type=image&limit=100&_t=${cacheBuster}`, {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!imageResponse.ok) {
                throw new Error(`HTTP ${imageResponse.status}: ${imageResponse.statusText}`);
            }
            
            const imageData = await imageResponse.json();
            
            // Load video models
            const videoResponse = await fetch(`/api/models/dashboard?type=video&limit=100&_t=${cacheBuster}`, {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!videoResponse.ok) {
                throw new Error(`HTTP ${videoResponse.status}: ${videoResponse.statusText}`);
            }
            
            const videoData = await videoResponse.json();
            
            // Load audio models
            const audioResponse = await fetch(`/api/models/dashboard?type=audio&limit=100&_t=${cacheBuster}`, {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!audioResponse.ok) {
                throw new Error(`HTTP ${audioResponse.status}: ${audioResponse.statusText}`);
            }
            
            const audioData = await audioResponse.json();
            
            // Merge all types
            const allModels = [...(imageData.models || []), ...(videoData.models || []), ...(audioData.models || [])];
            
            const data = {
                success: imageData.success && videoData.success && audioData.success,
                models: allModels,
                last_pricing_update: Math.max(
                    imageData.last_pricing_update || 0,
                    videoData.last_pricing_update || 0,
                    audioData.last_pricing_update || 0
                )
            };
            
            if (data.success) {
                // Check if pricing was updated
                const serverPricingUpdate = data.last_pricing_update || 0;
                
                if (forceReload || lastPricingUpdate === 0) {
                    lastPricingUpdate = serverPricingUpdate;
                } else if (serverPricingUpdate > lastPricingUpdate) {
                    
                    // Show notification to user
                    showPricingUpdateNotification();
                    lastPricingUpdate = serverPricingUpdate;
                }
                
                availableModels = data.models;
                
                // ✅ RESTORE selected model from localStorage (if exists)
                let restoredModel = null;
                try {
                    const savedModelId = localStorage.getItem(`selected_${currentMode}_model_id`);
                    if (savedModelId) {
                        restoredModel = availableModels.find(m => m.id === parseInt(savedModelId) && m.type === currentMode);
                        if (restoredModel) {
                        } else {
                        }
                    }
                } catch (e) {
                    console.warn('Failed to restore model from localStorage:', e);
                }
                
                // Set default selected model based on current mode
                if (availableModels.length > 0) {
                    const defaultModel = availableModels.find(m => m.type === currentMode && m.is_active) || availableModels[0];
                    
                    // Priority: restored > existing > default
                    if (restoredModel) {
                        selectedModel = restoredModel;
                    } else if (selectedModel) {
                        // If we had a selected model before, try to keep it
                        const updatedModel = availableModels.find(m => m.id === selectedModel.id);
                        if (updatedModel) {
                            selectedModel = updatedModel;
                        } else {
                            selectedModel = defaultModel;
                        }
                    } else {
                        selectedModel = defaultModel;
                    }
                    
                }
                
                // Sync with models-loader if it loaded models first
                if (window.allLoadedModels && window.allLoadedModels.length > 0) {
                    // Merge models from both sources
                    const mergedIds = new Set(availableModels.map(m => m.id));
                    window.allLoadedModels.forEach(model => {
                        if (!mergedIds.has(model.id)) {
                            availableModels.push(model);
                        }
                    });
            }
            
            // ✅ ALWAYS recalculate cost after model restoration/selection
            // This ensures credits display correctly on page refresh
            if (selectedModel) {
                calculateCreditCost();
            }
            }
        } catch (error) {
            console.error('❌ Error loading models:', error);
        }
    }
    
    // Show pricing update notification
    function showPricingUpdateNotification() {
        // Create notification toast
        const toast = document.createElement('div');
        toast.className = 'fixed top-20 right-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 max-w-sm animate-slide-in';
        toast.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="text-2xl">💰</div>
                <div class="flex-1">
                    <div class="font-bold mb-1">Pricing Updated!</div>
                    <div class="text-sm opacity-90 mb-2">Model prices have been updated by admin.</div>
                    <button onclick="this.closest('.fixed').remove(); location.reload();" 
                            class="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs font-semibold transition">
                        Reload Page
                    </button>
                </div>
                <button onclick="this.closest('.fixed').remove()" class="text-white/70 hover:text-white">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;
        
        // Add animation styles if not exist
        if (!document.getElementById('pricing-update-styles')) {
            const style = document.createElement('style');
            style.id = 'pricing-update-styles';
            style.textContent = `
                @keyframes slide-in {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(400px)';
            toast.style.transition = 'all 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 10000);
    }
    
    // Start periodic pricing check (every 30 seconds)
    function startPricingCheck() {
        if (pricingCheckInterval) {
            clearInterval(pricingCheckInterval);
        }
        
        pricingCheckInterval = setInterval(async () => {
            await loadAvailableModels(false); // Don't force reload on check
        }, 30000); // Check every 30 seconds
    }
    
    // Stop pricing check (cleanup)
    function stopPricingCheck() {
        if (pricingCheckInterval) {
            clearInterval(pricingCheckInterval);
            pricingCheckInterval = null;
        }
    }
    
    // Expose reload function globally
    window.reloadModelPricing = function() {
        return loadAvailableModels(true);
    };

    // ✨ Update Audio Toggle Visibility
    function updateAudioToggleVisibility() {
        const audioSection = document.querySelector('#video-mode > div:has(.audio-btn)');
        
        if (!audioSection) {
            return;
        }
        
        // Show audio toggle only for:
        // 1. Video mode AND model with multi-tier pricing
        // 2. Audio generation models
        const shouldShow = currentMode === 'video' && selectedModel && (
            selectedModel.has_multi_tier_pricing === true ||
            selectedModel.type === 'audio'
        );
        
        if (shouldShow) {
            audioSection.style.display = 'block';
            
            // Update hint based on model type
            const hint = document.getElementById('audio-cost-hint');
            const priceNote = document.getElementById('audio-price-note');
            
            if (selectedModel.has_multi_tier_pricing) {
                if (hint) hint.textContent = 'This model has different pricing for audio on/off';
                if (priceNote && selectedModel.price_text_to_video_with_audio) {
                    const priceNoAudio = selectedModel.price_text_to_video_no_audio || 0;
                    const priceWithAudio = selectedModel.price_text_to_video_with_audio || 0;
                    const diff = ((priceWithAudio - priceNoAudio) * 100).toFixed(1);
                    if (diff > 0) {
                        priceNote.textContent = `+$${diff}/s with audio`;
                    }
                }
            } else if (selectedModel.type === 'audio') {
                if (hint) hint.textContent = 'Audio generation model selected';
                if (priceNote) priceNote.textContent = 'Audio output';
            }
        } else {
            audioSection.style.display = 'none';
        }
    }
    
    // Credit Cost Calculator Function (with real model pricing)
    function calculateCreditCost() {
        
        // Update audio toggle visibility based on selected model
        updateAudioToggleVisibility();
        
        // If no model selected, show placeholder
        if (!selectedModel) {
            const creditCostEl = document.getElementById('credit-cost');
            const creditBreakdownEl = document.getElementById('credit-breakdown');
            
            if (creditCostEl) {
                creditCostEl.textContent = '-- Credits';
            }
            if (creditBreakdownEl) {
                creditBreakdownEl.textContent = 'Select a model to see pricing';
            }
            return;
        }
        
        const mode = currentMode;
        const quantity = currentQuantity;
        
        let baseCost = 1.0; // Default fallback
        let costMultiplier = 1.0; // For edit operations
        
        // Use real model price if available
        if (selectedModel && selectedModel.cost) {
            baseCost = parseFloat(selectedModel.cost);
            
            // Apply multipliers for special operations (fal.ai logic)
            if (mode === 'image') {
                const imageType = document.getElementById('image-type');
                const type = imageType ? imageType.value : 'text-to-image';
                
                // ⚠️ WARNING: Do NOT apply operation multipliers!
                // Admin panel already set correct pricing per model
                // Multipliers were causing double-charging for specialized models
                
                // If you have different models for different operations:
                // - Use separate models (e.g., "FLUX Upscaler" vs "FLUX Dev")
                // - Admin sets correct price for each model
                // - Frontend just uses model.cost without multipliers
                
                costMultiplier = 1.0; // Always use base cost from database
                
            } else if (mode === 'video') {
                const videoType = document.getElementById('video-type');
                const type = videoType ? videoType.value : 'text-to-video';
                const activeDuration = document.querySelector('.duration-btn.active');
                const requestedDuration = activeDuration ? parseInt(activeDuration.getAttribute('data-duration')) : 5;
                const activeAudio = document.querySelector('.audio-btn.active');
                const hasAudio = activeAudio ? activeAudio.getAttribute('data-audio') === 'true' : false;
                
                // ===== MULTI-TIER PRICING SUPPORT =====
                // Check if model has multi-tier pricing (audio/type variants)
                const hasMultiTier = selectedModel.has_multi_tier_pricing || false;
                
                if (hasMultiTier) {
                    // MULTI-TIER MODEL (e.g., Veo 3)
                    // ⚠️ WARNING: DO NOT RECALCULATE HERE!
                    // Admin panel already calculated and stored credits in model.cost field
                    // Just use the stored value to avoid double multiplication
                    
                    // For display purposes, use base cost from database
                    baseCost = parseFloat(selectedModel.cost) || 1;
                    costMultiplier = 1.0;
                    
                } else {
                    // SIMPLE PRICING (original logic)
                    const modelMaxDuration = selectedModel.max_duration || 20;
                    const pricingType = selectedModel.pricing_type || 'flat';
                    
                    // SMART PRICING: Per-second vs Flat rate
                    if (pricingType === 'per_second') {
                        // PER-SECOND MODELS (e.g., Sora 2: $0.24/s, Kling: $0.28/s)
                        // baseCost is stored as credits PER SECOND in DB
                        // We just multiply by requested duration
                        
                        const creditsPerSecond = baseCost; // Already per-second rate from DB
                        
                        // Calculate actual cost for requested duration
                        baseCost = creditsPerSecond * requestedDuration;
                        costMultiplier = 1.0; // Already calculated exact cost
                    } else {
                        // FLAT RATE MODELS (e.g., MiniMax: $0.50 flat, Runway: $0.60 flat)
                        costMultiplier = 1.0;
                    }
                    
                    // No additional multipliers - price is already set in admin
                    // Image-to-video price should be configured in admin panel
                    costMultiplier = 1.0;
                }
            }
        } else {
            // ⚠️ NO MODEL SELECTED - Show minimum estimate
            // User MUST select a model before generation
            // This is just a placeholder for UI display
            console.warn('⚠️ No model selected! Using minimum fallback (1 credit)');
            console.warn('⚠️ User MUST select a model to see accurate pricing');
            baseCost = 1.0; // Minimum fallback - NOT accurate!
            
            // Show warning in UI
            const creditBreakdownEl = document.getElementById('credit-breakdown');
            if (creditBreakdownEl) {
                creditBreakdownEl.innerHTML = '<span style="color: #f59e0b;">⚠️ Select a model to see accurate pricing</span>';
            }
        }
        
        const adjustedCost = baseCost * costMultiplier;
        const totalCost = adjustedCost * quantity;
        
        const creditCostEl = document.getElementById('credit-cost');
        const creditBreakdownEl = document.getElementById('credit-breakdown');
        
        if (creditCostEl) {
            creditCostEl.textContent = `${totalCost.toFixed(1)} ${totalCost === 1 ? 'Credit' : 'Credits'}`;
        } else {
            console.warn('⚠️ credit-cost element not found');
        }
        
        // Update credit breakdown with detailed info (clean, no FAL.AI info)
        if (creditBreakdownEl) {
            if (mode === 'video' && selectedModel) {
                // Video: Show proportional pricing explanation (without model name)
                const activeDuration = document.querySelector('.duration-btn.active');
                const requestedDuration = activeDuration ? parseInt(activeDuration.getAttribute('data-duration')) : 5;
                
                // Calculate cost per second based on pricing type
                let breakdownText;
                
                if (selectedModel.has_multi_tier_pricing) {
                    // Multi-tier: Show base cost
                    breakdownText = `${quantity}x × ${adjustedCost.toFixed(1)} credits (${requestedDuration}s)`;
                } else if (selectedModel.pricing_type === 'per_second') {
                    // Per-second: Show clear breakdown
                    const creditsPerSecond = parseFloat(selectedModel.cost).toFixed(1);
                    breakdownText = `${quantity}x × ${adjustedCost.toFixed(1)} credits (${creditsPerSecond} cr/s × ${requestedDuration}s)`;
                } else {
                    // Flat rate: No per-second cost
                    const operationInfo = costMultiplier !== 1.0 ? ` ×${costMultiplier.toFixed(1)}` : '';
                    breakdownText = `${quantity}x × ${adjustedCost.toFixed(1)} credits${operationInfo}`;
                }
                
                creditBreakdownEl.textContent = breakdownText;
            } else {
                // Image or fallback: Show standard breakdown (without model name)
                const operationInfo = costMultiplier !== 1.0 ? ` ×${costMultiplier.toFixed(1)}` : '';
                creditBreakdownEl.textContent = `${quantity}x × ${adjustedCost.toFixed(1)} credits${operationInfo}`;
            }
        }
    }

    // Helper function to add missing model
    window.addModelIfMissing = function(model) {
        const exists = availableModels.find(m => m.id === model.id);
        if (!exists) {
            availableModels.push(model);
        }
    };
    
    // Update selected model (exposed globally for models-loader)
    window.updateSelectedModel = function(modelId) {
        
        // Try multiple matching strategies
        let model = availableModels.find(m => {
            const match = m.model_id === modelId || 
                   m.id === parseInt(modelId) || 
                   m.id === modelId ||
                   m.model_id === String(modelId) ||
                   String(m.id) === String(modelId);
            
            if (match) {
            }
            return match;
        });
        
        // If not found, check window.allLoadedModels
        if (!model && window.allLoadedModels) {
            model = window.allLoadedModels.find(m => m.id === parseInt(modelId) || m.id === modelId);
            if (model) {
                availableModels.push(model);
            }
        }
        
        if (model) {
            selectedModel = model;
            
            // ✅ SAVE selected model to localStorage for persistence
            try {
                localStorage.setItem(`selected_${currentMode}_model_id`, modelId);
                localStorage.setItem(`selected_${currentMode}_model`, JSON.stringify(model));
            } catch (e) {
                console.warn('Failed to save model to localStorage:', e);
            }
            
            calculateCreditCost();
        } else {
            console.error('❌ MODEL NOT FOUND:', modelId);
            availableModels.slice(0, 10).forEach(m => {
            });
            if (window.allLoadedModels) {
                window.allLoadedModels.slice(0, 10).forEach(m => {
                });
            }
        }
    }

    // Mode Tab Switching
    const creationTabs = document.querySelectorAll('.creation-tab');
    const creationModes = document.querySelectorAll('.creation-mode');

    creationTabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            const mode = this.getAttribute('data-mode');
            currentMode = mode;
            
            creationTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            creationModes.forEach(m => {
                m.classList.remove('active');
                m.classList.add('hidden');
            });
            
            const selectedMode = document.getElementById(`${mode}-mode`);
            if (selectedMode) {
                selectedMode.classList.remove('hidden');
                selectedMode.classList.add('active');
            }
            
            // Clear selected model when switching mode
            // User needs to select a model in the new mode
            selectedModel = null;
            
            // Show placeholder
            const creditCostEl = document.getElementById('credit-cost');
            const creditBreakdownEl = document.getElementById('credit-breakdown');
            
            if (creditCostEl) {
                creditCostEl.textContent = '-- Credits';
            }
            if (creditBreakdownEl) {
                creditBreakdownEl.textContent = 'Select a model to see pricing';
            }
            
            // ✨ Update button state based on new mode's generation status
            const generateBtn = document.getElementById('generate-btn');
            if (generateBtn) {
                const anyGenerating = Object.values(isGenerating).some(val => val === true);
                if (anyGenerating) {
                } else {
                    // Reset button to default state if nothing is generating
                    generateBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg><span>Run</span>';
                }
            }
            
            // Trigger change on the dropdown for the new mode to set first model
            setTimeout(() => {
                const selectId = mode === 'image' ? 'image-model-select' : 'video-model-select';
                const select = document.getElementById(selectId);
                if (select && select.options.length > 0) {
                    select.dispatchEvent(new Event('change'));
                }
            }, 150);
        });
    });

    // Character counter for textareas
    const imageTextarea = document.getElementById('image-textarea');
    const videoTextarea = document.getElementById('video-textarea');

    if (imageTextarea) {
        imageTextarea.addEventListener('input', function() {
            document.getElementById('image-counter').textContent = this.value.length;
        });
    }

    if (videoTextarea) {
        videoTextarea.addEventListener('input', function() {
            document.getElementById('video-counter').textContent = this.value.length;
        });
    }

    // Image Type Change Handler
    const imageType = document.getElementById('image-type');
    const imageUploadSection = document.getElementById('image-upload-section');
    const imageAspectRatioSection = document.getElementById('image-aspect-ratio-section');
    const imageAspectRatioAutoNote = document.getElementById('image-aspect-ratio-auto-note');
    
    if (imageType && imageUploadSection) {
        imageType.addEventListener('change', function() {
            const value = this.value;
            const imageUploadInput = document.getElementById('image-upload');
            
            // Show upload section for edit operations and image-to-3d (not text-to-3d)
            if (value === 'edit-image' || value === 'edit-multi' || value === 'upscale' || value === 'remove-bg' || value === 'image-to-3d') {
                imageUploadSection.classList.remove('hidden');
                
                // ✅ SAFETY: Check if model supports multiple images (default to false for backward compatibility)
                const supportsMultiImage = !!(selectedModel && selectedModel.metadata && selectedModel.metadata.supports_multi_image);
                
                // ✅ Default values for backward compatibility
                const maxImages = supportsMultiImage ? (parseInt(selectedModel.metadata.max_images) || 3) : 1;
                const uploadMode = supportsMultiImage ? (selectedModel.metadata.multi_image_upload_mode || 'dynamic') : 'single';
                
                // Configure upload UI based on mode
                setupImageUploadMode(value, uploadMode, maxImages);
                
                // ✅ BACKWARD COMPATIBILITY: For models without metadata, use legacy single upload
                if (imageUploadInput) {
                    if (supportsMultiImage) {
                        // New: Dynamic multiple upload via separate fields
                        imageUploadInput.removeAttribute('multiple');
                    } else {
                        // Legacy: Single file upload (default behavior)
                    imageUploadInput.removeAttribute('multiple');
                    }
                }
                
                console.log(`📸 Image upload configured: ${supportsMultiImage ? 'MULTIPLE' : 'SINGLE'} mode`);
                if (supportsMultiImage) {
                    console.log(`   Max images: ${maxImages}, Upload mode: ${uploadMode}`);
                }
                
                // ✅ Hide aspect ratio picker for edit operations (will auto-detect from uploaded image)
                // Also hide for image-to-3d (3D models don't use aspect ratio)
                if (imageAspectRatioSection) {
                    const aspectButtons = imageAspectRatioSection.querySelectorAll('.aspect-btn');
                    aspectButtons.forEach(btn => {
                        btn.disabled = true;
                        btn.classList.add('opacity-30', 'cursor-not-allowed');
                        btn.classList.remove('hover:scale-105');
                    });
                    
                    // Show auto-detect note
                    if (imageAspectRatioAutoNote) {
                        imageAspectRatioAutoNote.classList.remove('hidden');
                    }
                    
                }
            } else if (value === 'text-to-3d') {
                // text-to-3d: hide upload, hide aspect ratio (3D doesn't use it)
                imageUploadSection.classList.add('hidden');
                
                if (imageAspectRatioSection) {
                    const aspectButtons = imageAspectRatioSection.querySelectorAll('.aspect-btn');
                    aspectButtons.forEach(btn => {
                        btn.disabled = true;
                        btn.classList.add('opacity-30', 'cursor-not-allowed');
                        btn.classList.remove('hover:scale-105');
                    });
                    
                    if (imageAspectRatioAutoNote) {
                        imageAspectRatioAutoNote.classList.remove('hidden');
                        // Update note for text-to-3d
                        imageAspectRatioAutoNote.querySelector('span').textContent = 'Aspect ratio not applicable for 3D generation';
                    }
                    
                }
            } else {
                imageUploadSection.classList.add('hidden');
                if (imageUploadInput) {
                    imageUploadInput.removeAttribute('multiple');
                }
                
                // ✅ Re-enable aspect ratio picker for text-to-image
                if (imageAspectRatioSection) {
                    const aspectButtons = imageAspectRatioSection.querySelectorAll('.aspect-btn');
                    aspectButtons.forEach(btn => {
                        btn.disabled = false;
                        btn.classList.remove('opacity-30', 'cursor-not-allowed');
                        btn.classList.add('hover:scale-105');
                    });
                    
                    // Hide auto-detect note
                    if (imageAspectRatioAutoNote) {
                        imageAspectRatioAutoNote.classList.add('hidden');
                    }
                }
            }
            calculateCreditCost();
        });
    }

    // Video Type Change Handler
    const videoType = document.getElementById('video-type');
    const videoUploadSection = document.getElementById('video-upload-section');
    const videoEndFrameSection = document.getElementById('video-end-frame-section');
    const aspectRatioButtons = document.getElementById('video-aspect-ratio-buttons');
    const aspectRatioAutoNote = document.getElementById('aspect-ratio-auto-note');
    const aspectRatioI2vHint = document.getElementById('aspect-ratio-i2v-hint');
    
    if (videoType && videoUploadSection) {
        videoType.addEventListener('change', function() {
            const value = this.value;
            
            if (value === 'image-to-video' || value === 'image-to-video-end') {
                // Show upload section
                videoUploadSection.classList.remove('hidden');
                
                // Show/hide end frame section
                if (value === 'image-to-video-end' && videoEndFrameSection) {
                    videoEndFrameSection.classList.remove('hidden');
                } else if (videoEndFrameSection) {
                    videoEndFrameSection.classList.add('hidden');
                }
                
                // Disable aspect ratio selection (will auto-detect from image)
                if (aspectRatioButtons) {
                    const buttons = aspectRatioButtons.querySelectorAll('.aspect-btn');
                    buttons.forEach(btn => {
                        btn.disabled = true;
                        btn.classList.add('opacity-50', 'cursor-not-allowed');
                        btn.classList.remove('hover:scale-105');
                    });
                }
                
                // Show auto-detect notes
                if (aspectRatioAutoNote) aspectRatioAutoNote.classList.remove('hidden');
                if (aspectRatioI2vHint) aspectRatioI2vHint.classList.remove('hidden');
                
            } else {
                // Hide upload section
                videoUploadSection.classList.add('hidden');
                if (videoEndFrameSection) {
                    videoEndFrameSection.classList.add('hidden');
                }
                
                // Enable aspect ratio selection
                if (aspectRatioButtons) {
                    const buttons = aspectRatioButtons.querySelectorAll('.aspect-btn');
                    buttons.forEach(btn => {
                        btn.disabled = false;
                        btn.classList.remove('opacity-50', 'cursor-not-allowed');
                        btn.classList.add('hover:scale-105');
                    });
                }
                
                // Hide auto-detect notes
                if (aspectRatioAutoNote) aspectRatioAutoNote.classList.add('hidden');
                if (aspectRatioI2vHint) aspectRatioI2vHint.classList.add('hidden');
            }
            
            calculateCreditCost();
        });
    }

    // ========== VIDEO UPLOAD HANDLERS (Robust - Prevents Re-trigger) ==========
    
    // Start Frame Upload
    const startFrameDropzone = document.getElementById('video-start-frame-dropzone');
    const startFrameInput = document.getElementById('video-start-frame');
    const startFrameText = document.getElementById('video-start-frame-text');
    
    if (startFrameDropzone && startFrameInput) {
        let isSelectingFile = false; // Flag to prevent re-trigger during file selection
        
        // Click dropzone to trigger file input
        startFrameDropzone.addEventListener('click', function(e) {
            // Don't trigger if already selecting a file
            if (isSelectingFile) {
                return;
            }
            
            isSelectingFile = true;
            startFrameInput.click();
        });
        
        // Handle file selection
        startFrameInput.addEventListener('change', function() {
            
            if (this.files && this.files.length > 0) {
                const fileName = this.files[0].name;
                const fileSize = (this.files[0].size / 1024 / 1024).toFixed(2); // MB
                
                if (startFrameText) {
                    startFrameText.innerHTML = `
                        <i class="fas fa-check-circle text-green-400 mr-1"></i>
                        ${fileName} <span class="text-gray-600">(${fileSize} MB)</span>
                    `;
                    startFrameText.classList.add('text-green-400');
                    startFrameText.classList.remove('text-gray-500');
                }
                
            }
            
            // Reset flag after selection completes
            setTimeout(() => {
                isSelectingFile = false;
            }, 500);
        });
        
        // Also reset flag if user cancels (focus returns without file change)
        startFrameInput.addEventListener('cancel', function() {
            isSelectingFile = false;
        });
    }
    
    // End Frame Upload
    const endFrameDropzone = document.getElementById('video-end-frame-dropzone');
    const endFrameInput = document.getElementById('video-end-frame');
    const endFrameText = document.getElementById('video-end-frame-text');
    
    if (endFrameDropzone && endFrameInput) {
        let isSelectingFile = false; // Flag to prevent re-trigger during file selection
        
        // Click dropzone to trigger file input
        endFrameDropzone.addEventListener('click', function(e) {
            // Don't trigger if already selecting a file
            if (isSelectingFile) {
                return;
            }
            
            isSelectingFile = true;
            endFrameInput.click();
        });
        
        // Handle file selection
        endFrameInput.addEventListener('change', function() {
            
            if (this.files && this.files.length > 0) {
                const fileName = this.files[0].name;
                const fileSize = (this.files[0].size / 1024 / 1024).toFixed(2); // MB
                
                if (endFrameText) {
                    endFrameText.innerHTML = `
                        <i class="fas fa-check-circle text-green-400 mr-1"></i>
                        ${fileName} <span class="text-gray-600">(${fileSize} MB)</span>
                    `;
                    endFrameText.classList.add('text-green-400');
                    endFrameText.classList.remove('text-gray-500');
                }
                
            }
            
            // Reset flag after selection completes
            setTimeout(() => {
                isSelectingFile = false;
            }, 500);
        });
        
        // Also reset flag if user cancels
        endFrameInput.addEventListener('cancel', function() {
            isSelectingFile = false;
        });
    }

    // Aspect Ratio Buttons
    const aspectBtns = document.querySelectorAll('.aspect-btn');
    aspectBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const parent = this.parentElement;
            parent.querySelectorAll('.aspect-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Duration Buttons
    const durationBtns = document.querySelectorAll('.duration-btn');
    durationBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const parent = this.parentElement;
            parent.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            calculateCreditCost();
        });
    });

    // Audio Buttons (NEW)
    const audioBtns = document.querySelectorAll('.audio-btn');
    audioBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const parent = this.parentElement;
            parent.querySelectorAll('.audio-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            calculateCreditCost();
        });
    });

    // Quantity Dropdown
    const quantitySelect = document.getElementById('quantity-select');
    
    if (quantitySelect) {
        quantitySelect.addEventListener('change', function() {
            currentQuantity = parseInt(this.value);
            calculateCreditCost();
        });
    }

    // Initial calculation
    calculateCreditCost();

    // ============ GENERATION BUTTON - REAL API CALL ============
    
    const generateBtn = document.getElementById('generate-btn');
    const resultContainer = document.getElementById('result-container');
    const loadingState = document.getElementById('loading-state');
    const resultDisplay = document.getElementById('result-display');
    const emptyStatePlaceholder = document.getElementById('empty-state-placeholder');
    const generationsCount = document.getElementById('generations-count');
    const resultScrollArea = document.getElementById('result-scroll-area');
    
    if (generateBtn) {
        // ✨ Button cooldown state
        let buttonCooldown = false;
        let cooldownTimer = null;
        
        generateBtn.addEventListener('click', async function() {
            console.log('🎯 [GENERATION] Button clicked!');
            
            // ✨ Check if button is in cooldown
            if (buttonCooldown) {
                console.log('⏳ [GENERATION] Button in cooldown, aborting');
                showNotification('⏳ Please wait before generating again', 'warning');
                return;
            }
            
            // ✨ ALWAYS get fresh mode from DOM (prevent stale state)
            const mode = getCurrentMode();
            const previousMode = currentMode;
            currentMode = mode; // Update state
            
            console.log('🎯 [GENERATION] Mode:', mode);
            
            // ✨ Check if THIS mode is already generating (allows concurrent generations)
            if (isGenerating[mode]) {
                console.log('⚠️ [GENERATION] Mode already generating:', mode);
                showNotification(`${mode.charAt(0).toUpperCase() + mode.slice(1)} generation already in progress`, 'warning');
                return;
            }
            
            // ✨ Check concurrent generation limit (Best practice: max 3 simultaneous)
            const activeGenerations = Object.values(isGenerating).filter(v => v === true).length;
            if (activeGenerations >= MAX_CONCURRENT_GENERATIONS) {
                console.log('⚠️ [GENERATION] Max concurrent limit reached:', activeGenerations);
                const activeTypes = Object.keys(isGenerating).filter(k => isGenerating[k]).join(', ');
                showNotification(
                    `Maximum ${MAX_CONCURRENT_GENERATIONS} concurrent generations allowed. Please wait for one to finish.`, 
                    'warning'
                );
                return;
            }
            
            console.log('✅ [GENERATION] Checks passed, proceeding...');
            
            // ✨ Start 10 second cooldown
            buttonCooldown = true;
            const cooldownButtonHTML = generateBtn.innerHTML;
            let countdown = 10;
            
            const updateButtonCountdown = () => {
                if (countdown > 0) {
                    generateBtn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>Wait ${countdown}s</span>`;
                    countdown--;
                    cooldownTimer = setTimeout(updateButtonCountdown, 1000);
                } else {
                    buttonCooldown = false;
                    // Check if there are active generations
                    const activeCount = Object.values(isGenerating).filter(v => v === true).length;
                    if (activeCount > 0) {
                        generateBtn.innerHTML = `<svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="4" class="opacity-25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" class="opacity-75"></path></svg><span>Generating... (${activeCount})</span>`;
                    } else {
                        generateBtn.innerHTML = cooldownButtonHTML;
                    }
                }
            };
            
            updateButtonCountdown();
            
            if (mode !== previousMode) {
            }
            
            console.log('🚀 [GENERATION] Starting generation for mode:', mode);
            
            // ✨ Initialize loading card variable (will be created later)
            let earlyLoadingCard = null;
            
            // Helper function to cleanup if validation fails
            const cleanupEarlyLoading = () => {
                console.log('🧹 [LOADING CARD] Cleanup called, removing card...');
                if (earlyLoadingCard) {
                    earlyLoadingCard.remove();
                    earlyLoadingCard = null;
                    console.log('✅ [LOADING CARD] Card removed');
                } else {
                    console.log('⚠️ [LOADING CARD] No card to remove');
                }
            };
            
            // ✅ FIX: Use specific textarea ID instead of querySelector
            // This fixes mobile/desktop consistency issue
            const textarea = mode === 'image' 
                ? document.getElementById('image-textarea')
                : mode === 'video'
                ? document.getElementById('video-textarea')
                : document.getElementById('audio-prompt');
            
            // ⚠️ IMPORTANT: Get initial prompt for validation ONLY
            // The actual prompt will be read AFTER enhancement
            let initialPrompt = textarea ? textarea.value.trim() : '';
            
            // Get selected model
            const modelSelect = mode === 'image' 
                ? document.getElementById('image-model-select') 
                : mode === 'video'
                ? document.getElementById('video-model-select')
                : null; // Audio uses custom model selection
            const model = modelSelect ? modelSelect.value : '';
            
            // ===== AUDIO MODE VALIDATION =====
            if (mode === 'audio') {
                // Use audio-specific validation
                if (window.validateAudioInputs) {
                    const validation = window.validateAudioInputs();
                    if (!validation.isValid) {
                        console.warn('❌ Audio validation failed:', validation.errors);
                        cleanupEarlyLoading();
                        showNotification(validation.errors[0], 'error');
                        return;
                    }
                } else {
                    console.warn('⚠️ validateAudioInputs not available, using basic validation');
                    if (!initialPrompt) {
                        cleanupEarlyLoading();
                        showNotification('Please enter text or prompt!', 'error');
                        return;
                    }
                }
            } else {
                // Image/Video validation
                // Check if this is a no-prompt model using SmartPromptHandler
                const isNoPromptModel = window.SmartPromptHandler && window.SmartPromptHandler.isNoPromptModel(model);
                
                // Get upload file and type
                const uploadInput = mode === 'image' ? document.getElementById('image-upload') : document.getElementById('video-start-frame');
                const hasUpload = uploadInput && uploadInput.files.length > 0;
                const imageType = mode === 'image' ? document.getElementById('image-type')?.value : null;
                const videoType = mode === 'video' ? document.getElementById('video-type')?.value : null;
                
                // Check if type is edit-based (edit-image, edit-video, etc) - prompt is optional if upload exists
                const isEditType = imageType && (imageType.includes('edit') || imageType === 'upscale' || imageType === 'remove-bg') ||
                                   videoType && (videoType.includes('edit') || videoType.includes('enhance'));
                
                // Validate inputs based on model type
                // Prompt is OPTIONAL for:
                // 1. No-prompt models (like remove-bg, upscale, face-swap)
                // 2. Edit types WITH upload (edit-image with image upload)
                if (!isNoPromptModel && !isEditType && !initialPrompt) {
                    console.warn('❌ [VALIDATION] No prompt entered', {
                        isNoPromptModel,
                        isEditType,
                        initialPrompt: initialPrompt || '(empty)'
                    });
                    cleanupEarlyLoading();
                    showNotification('Please enter a prompt!', 'error');
                    return;
                }
                
                // For edit types, require upload
                if (isEditType && !initialPrompt && !hasUpload) {
                    cleanupEarlyLoading();
                    showNotification(mode === 'image' ? 'Please upload an image or enter a prompt!' : 'Please upload a video or enter a prompt!', 'error');
                    return;
                }
                
                // For no-prompt models, check upload requirement
                if (isNoPromptModel && !hasUpload) {
                    cleanupEarlyLoading();
                    showNotification('Please upload an image!', 'error');
                    return;
                }
            }
            
            // ✨✨✨ CRITICAL: Enhance prompt BEFORE generation if auto-prompt is enabled
            // Determine default prompt based on type if no prompt provided
            let defaultPrompt = 'Process image';
            if (mode === 'image') {
                const imageType = document.getElementById('image-type')?.value;
                if (imageType === 'edit-image') defaultPrompt = 'Retouch and enhance the image naturally';
                else if (imageType === 'edit-multi') defaultPrompt = 'Edit and enhance all images';
                else if (imageType === 'upscale') defaultPrompt = 'Upscale image';
                else if (imageType === 'remove-bg') defaultPrompt = 'Remove background';
            } else if (mode === 'video') {
                const videoType = document.getElementById('video-type')?.value;
                if (videoType && videoType.includes('edit')) defaultPrompt = 'Edit and enhance video';
            }
            
            let finalPrompt = initialPrompt || defaultPrompt;
            let originalPrompt = null;
            
            // ✨ Check if auto-prompt is enabled (will affect loading card timing)
            const autoPromptEnabled = window.AutoPrompt && window.AutoPrompt.isEnabled && window.AutoPrompt.isEnabled(mode);
            
            if (autoPromptEnabled) {
                console.log('🪄 [AUTO-PROMPT] Auto-prompt is enabled, enhancing...');
                
                // Check if we have cached enhanced prompt
                const cachedOriginal = window.AutoPrompt.getOriginalPrompt(mode);
                const cachedEnhanced = window.AutoPrompt.getEnhancedPrompt(mode);
                
                // Case 1: We have cached enhancement and textarea matches it
                if (cachedEnhanced && initialPrompt === cachedEnhanced && cachedOriginal) {
                    finalPrompt = cachedEnhanced;
                    originalPrompt = cachedOriginal;
                    console.log('✅ [AUTO-PROMPT] Using cached enhancement');
                }
                // Case 2: Textarea already contains enhanced prompt (different from cached)
                else if (cachedOriginal && initialPrompt !== cachedOriginal && initialPrompt.length > cachedOriginal.length) {
                    finalPrompt = initialPrompt;
                    originalPrompt = cachedOriginal;
                    console.log('✅ [AUTO-PROMPT] Using existing enhanced prompt');
                }
                // Case 3: Need to enhance NOW before generation
                else if (initialPrompt && initialPrompt.length >= 3) {
                    
                    // Save original BEFORE enhancement
                    originalPrompt = initialPrompt;
                    
                    try {
                        console.log('⏳ [AUTO-PROMPT] Enhancing prompt...');
                        // ⚡ CRITICAL: Wait for enhancement to complete
                        await window.AutoPrompt.enhancePrompt(mode);
                        
                        // ⚡ CRITICAL: Re-read textarea AFTER enhancement
                        const enhancedValue = textarea ? textarea.value.trim() : initialPrompt;
                        
                        
                        // Verify enhancement actually happened
                        if (enhancedValue && enhancedValue !== initialPrompt && enhancedValue.length > initialPrompt.length) {
                            finalPrompt = enhancedValue;
                            console.log('✅ [AUTO-PROMPT] Enhancement completed successfully');
                        } else {
                            console.warn('⚠️ [AUTO-PROMPT] Enhancement did not change prompt, using original');
                            finalPrompt = initialPrompt;
                            originalPrompt = null; // Don't save if enhancement failed
                        }
                    } catch (error) {
                        console.error('❌ [AUTO-PROMPT] Enhancement ERROR:', error);
                        // Continue with original prompt if enhancement fails
                        finalPrompt = initialPrompt;
                        originalPrompt = null;
                    }
                } else {
                    finalPrompt = initialPrompt;
                }
            } else {
                finalPrompt = initialPrompt;
            }
            
            // ✨✨✨ CREATE LOADING CARD AFTER AUTO-PROMPT ENHANCEMENT (if enabled)
            // This ensures user sees enhancement complete before loading starts
            console.log('🎨 [LOADING CARD] Creating loading card now (after auto-prompt)...');
            
            const freshResultContainer = document.getElementById('result-container');
            const freshResultDisplay = document.getElementById('result-display');
            const hasCreateLoadingCard = typeof createLoadingCard === 'function' || typeof window.createLoadingCard === 'function';
            const createLoadingCardFn = typeof createLoadingCard === 'function' ? createLoadingCard : window.createLoadingCard;
            
            // ✨ Ensure result-container is visible
            if (freshResultContainer) {
                freshResultContainer.classList.remove('hidden');
                freshResultContainer.style.display = 'block';
            }
            
            // ✨ Ensure result-display is visible
            if (freshResultDisplay) {
                freshResultDisplay.classList.remove('hidden');
                freshResultDisplay.style.display = 'block';
            }
            
            // ✨ Create loading card
            if (freshResultDisplay) {
                if (hasCreateLoadingCard && createLoadingCardFn) {
                    try {
                        // Pass autoPromptActive option to show badge if auto-prompt was used
                        const loadingCardOptions = {
                            autoPromptActive: autoPromptEnabled && originalPrompt !== null
                        };
                        earlyLoadingCard = createLoadingCardFn(mode, loadingCardOptions);
                        
                        if (earlyLoadingCard) {
                            earlyLoadingCard.setAttribute('data-generation-loading', 'true');
                            earlyLoadingCard.setAttribute('data-temp-id', 'temp-loading');
                            freshResultDisplay.insertBefore(earlyLoadingCard, freshResultDisplay.firstChild);
                            
                            console.log('✅ [LOADING CARD] Created and inserted!');
                            
                            // Scroll into view (desktop only)
                            if (window.innerWidth >= 1024) {
                                freshResultDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                            }
                        } else {
                            console.error('❌ [LOADING CARD] createLoadingCard returned null/undefined');
                        }
                    } catch (error) {
                        console.error('❌ [LOADING CARD] Error creating loading card:', error);
                    }
                } else {
                    // ✨ FALLBACK: Create simple inline loading card
                    console.warn('⚠️ [LOADING CARD] External function not available, using fallback...');
                    try {
                        earlyLoadingCard = document.createElement('div');
                        earlyLoadingCard.className = 'loading-card bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-sm rounded-xl overflow-hidden border border-blue-500/50 p-6';
                        earlyLoadingCard.setAttribute('data-generation-loading', 'true');
                        earlyLoadingCard.setAttribute('data-temp-id', 'temp-loading');
                        
                        const typeText = mode === 'video' ? 'Video' : mode === 'audio' ? 'Audio' : 'Image';
                        earlyLoadingCard.innerHTML = `
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin"></div>
                                <div>
                                    <h3 class="text-lg font-bold text-white">Generating ${typeText}</h3>
                                    <p class="text-sm text-gray-400 loading-status">Initializing...</p>
                                    <div class="w-64 h-2 bg-black/30 rounded-full mt-2 overflow-hidden">
                                        <div class="loading-progress-bar h-full bg-gradient-to-r from-blue-500 to-pink-500 rounded-full" style="width: 0%"></div>
                                    </div>
                                </div>
                            </div>
                        `;
                        
                        freshResultDisplay.insertBefore(earlyLoadingCard, freshResultDisplay.firstChild);
                        console.log('✅ [LOADING CARD] Fallback card created!');
                        
                        // Scroll into view (desktop only)
                        if (window.innerWidth >= 1024) {
                            freshResultDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                    } catch (fallbackError) {
                        console.error('❌ [LOADING CARD] Fallback creation failed:', fallbackError);
                    }
                }
            } else {
                console.error('❌ [LOADING CARD] result-display element not found!');
            }
            
            // ✅ FINAL VALIDATION: Ensure we have a prompt
            if (!finalPrompt || finalPrompt === 'Process image') {
                finalPrompt = initialPrompt || 'Process image';
            }
            
            if (originalPrompt) {
            }
            
            // Prepare form data
            const formData = new FormData();
            formData.append('prompt', finalPrompt);
            formData.append('quantity', currentQuantity);
            
            
            // Add original prompt if auto-prompt was used
            if (originalPrompt && originalPrompt !== finalPrompt) {
                formData.append('originalPrompt', originalPrompt);
            } else {
            }
            
            if (mode === 'image') {
                const imageType = document.getElementById('image-type').value;
                const aspectRatio = document.querySelector('#image-mode .aspect-btn.active')?.getAttribute('data-ratio') || '1:1';
                
                formData.append('type', imageType);
                formData.append('aspectRatio', aspectRatio);
                formData.append('model', model);
                
                // Handle image upload for edit modes
                if (imageType !== 'text-to-image' && imageType !== 'text-to-3d') {
                    const imageUrl = document.getElementById('image-upload-url')?.value;
                    
                    // ✅ Collect all images from dynamic upload fields
                    const allUploadInputs = document.querySelectorAll('.image-upload-input');
                    const uploadedFiles = [];
                    
                    allUploadInputs.forEach(input => {
                        if (input.files && input.files.length > 0) {
                            uploadedFiles.push(...Array.from(input.files));
                        }
                    });
                    
                    // ✅ SAFETY: Check if model supports multiple images (default to false)
                    const supportsMultiImage = !!(selectedModel && selectedModel.metadata && selectedModel.metadata.supports_multi_image);
                    const maxImages = supportsMultiImage ? (parseInt(selectedModel.metadata.max_images) || 3) : 1;
                    
                    if (uploadedFiles.length > 0) {
                        // ✅ Validate max images limit
                        if (supportsMultiImage && uploadedFiles.length > maxImages) {
                            cleanupEarlyLoading();
                            showNotification(`Maximum ${maxImages} images allowed for this model`, 'error');
                            return;
                        }
                        
                        // ✅ Handle multiple images ONLY if model supports it
                        if (supportsMultiImage && uploadedFiles.length > 1) {
                            // Multiple images: Use 'images' field for batch processing
                            // FAL.AI will process each image separately and combine results
                            uploadedFiles.forEach((file, index) => {
                                formData.append('images', file);
                            });
                            console.log(`✅ Uploading ${uploadedFiles.length} images for batch processing (fal-ai: one request per image)`);
                        } else {
                            // Single image: Use 'startImage' field (standard behavior)
                            formData.append('startImage', uploadedFiles[0]);
                            console.log(`✅ Uploading 1 image for processing`);
                            
                            // ⚠️ SAFETY: Warn if user uploaded multiple files but model doesn't support it
                            if (uploadedFiles.length > 1) {
                                console.warn(`⚠️  Model does not support multiple images. Only using first image.`);
                                showNotification('Model only supports 1 image. Using first image only.', 'warning');
                            }
                        }
                    } else if (imageUrl && imageUrl.trim()) {
                        // URL fallback
                        formData.append('startImageUrl', imageUrl.trim());
                        console.log(`✅ Using image URL for processing`);
                    } else {
                        cleanupEarlyLoading();
                        showNotification('Please upload an image or provide URL', 'error');
                        return;
                    }
                }
                
            } else if (mode === 'video') {
                const videoType = document.getElementById('video-type').value;
                const aspectRatio = document.querySelector('#video-mode .aspect-btn.active')?.getAttribute('data-ratio') || '16:9';
                const duration = parseInt(document.querySelector('#video-mode .duration-btn.active')?.getAttribute('data-duration') || '5');
                
                // ✅ VALIDASI WAJIB UPLOAD untuk Image-to-Video
                if (videoType !== 'text-to-video') {
                    const startFrame = document.getElementById('video-start-frame');
                    const startUrl = document.getElementById('video-start-url')?.value;
                    
                    // Check if upload is provided
                    const hasStartFrame = (startFrame && startFrame.files.length > 0) || (startUrl && startUrl.trim());
                    
                    if (!hasStartFrame) {
                        cleanupEarlyLoading();
                        showNotification('⚠️ Image-to-Video requires start frame! Please upload an image.', 'error');
                        return;
                    }
                    
                    // Check end frame for advanced mode
                    if (videoType === 'image-to-video-end') {
                        const endFrame = document.getElementById('video-end-frame');
                        const endUrl = document.getElementById('video-end-url')?.value;
                        const hasEndFrame = (endFrame && endFrame.files.length > 0) || (endUrl && endUrl.trim());
                        
                        if (!hasEndFrame) {
                            cleanupEarlyLoading();
                            showNotification('⚠️ Advanced mode requires end frame! Please upload an end image.', 'error');
                            return;
                        }
                    }
                }
                
                const hasAudio = document.querySelector('#video-mode .audio-btn.active')?.getAttribute('data-audio') === 'true';
                
                formData.append('type', videoType);
                formData.append('aspectRatio', aspectRatio);
                formData.append('duration', duration);
                formData.append('hasAudio', hasAudio); // NEW: Audio parameter
                formData.append('model', model);
                
                // Handle image uploads for image-to-video modes
                if (videoType !== 'text-to-video') {
                    const startFrame = document.getElementById('video-start-frame');
                    const startUrl = document.getElementById('video-start-url')?.value;
                    
                    if (startFrame.files.length > 0) {
                        formData.append('startImage', startFrame.files[0]);
                    } else if (startUrl && startUrl.trim()) {
                        formData.append('startImageUrl', startUrl.trim());
                    }
                    
                    if (videoType === 'image-to-video-end') {
                        const endFrame = document.getElementById('video-end-frame');
                        const endUrl = document.getElementById('video-end-url')?.value;
                        
                        if (endFrame.files.length > 0) {
                            formData.append('endImage', endFrame.files[0]);
                        } else if (endUrl && endUrl.trim()) {
                            formData.append('endImageUrl', endUrl.trim());
                        }
                    }
                }
            } else if (mode === 'audio') {
                // ===== AUDIO GENERATION =====
                const audioData = window.getAudioGenerationData ? window.getAudioGenerationData() : {};
                
                formData.append('type', audioData.type || 'text-to-speech');
                formData.append('model', audioData.model || '');
                
                // Duration (optional for TTS)
                if (audioData.duration) {
                    formData.append('duration', audioData.duration);
                }
                
                // Advanced options for music (genre, mood, tempo, instruments, lyrics)
                if (audioData.advanced) {
                    formData.append('advanced', JSON.stringify(audioData.advanced));
                }
                
            }
            
            // Show loading state for THIS mode
            isGenerating[mode] = true;
            
            // ✨ Update button with concurrent generation counter
            const activeCount = Object.values(isGenerating).filter(v => v === true).length;
            const originalButtonHTML = generateBtn.innerHTML;
            generateBtn.setAttribute('data-original-html', originalButtonHTML);
            
            // Show counter if multiple generations are running
            const counterBadge = activeCount > 1 
                ? `<span class="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">${activeCount}</span>` 
                : '';
            
            generateBtn.innerHTML = `
                <div class="relative">
                    ${counterBadge}
                    <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
                <span>Generating...</span>
            `;
            
            // Note: Button is NOT disabled so user can generate in other modes simultaneously
            
            // Hide old loading state
            if (loadingState) {
                loadingState.classList.add('hidden');
                loadingState.style.display = 'none';
            }
            
            // Loading card already created at the top! Just ensure result display is visible
            // ✨ Get fresh references
            const currentResultContainer = document.getElementById('result-container');
            const currentResultDisplay = document.getElementById('result-display');
            
            // ✨ Ensure result-container is visible (parent container)
            if (currentResultContainer) {
                currentResultContainer.classList.remove('hidden');
                currentResultContainer.style.display = 'block';
            }
            
            if (currentResultDisplay) {
                currentResultDisplay.classList.remove('hidden');
                currentResultDisplay.style.display = 'block'; // Force show
                
                // Loading card already created immediately after button click ✅
                
                // 📱 Auto-redirect to mobile processing view on mobile devices
                if (window.innerWidth < 1024) {
                    // Use setTimeout to ensure DOM is ready
                    setTimeout(() => {
                        if (typeof window.openMobileResults === 'function') {
                            window.openMobileResults();
                        }
                    }, 100);
                }
            } else {
                console.error('❌ result-display element not found!');
            }
            
            try {
                // ✨ NEW: Queue-based generation (non-blocking!)
                
                // Add mode and settings to FormData for queue
                formData.append('mode', mode);
                
                // Build settings object with all required fields
                const settingsObj = {
                    model: formData.get('model'),
                    aspectRatio: formData.get('aspectRatio'),
                    quantity: parseInt(formData.get('quantity') || '1')
                };
                
                // ✨ CRITICAL: Add originalPrompt to settings if it exists
                if (formData.get('originalPrompt')) {
                    settingsObj.originalPrompt = formData.get('originalPrompt');
                }
                
                // Add video-specific settings
                if (mode === 'video') {
                    // ✨ Fix default duration untuk model Veo3 yang hanya accept 4s, 6s, 8s
                    const rawDuration = parseInt(formData.get('duration') || '6'); // Default 6s instead of 5s
                    settingsObj.duration = rawDuration;
                    settingsObj.hasAudio = formData.get('hasAudio') === 'true';
                    settingsObj.videoType = formData.get('type'); // text-to-video, image-to-video, etc
                }
                
                // ✨ Add audio-specific settings
                if (mode === 'audio') {
                    settingsObj.audioType = formData.get('type'); // text-to-speech, text-to-music, text-to-audio
                    if (formData.get('duration')) {
                        settingsObj.duration = parseInt(formData.get('duration'));
                    }
                    // Advanced options for music (genre, mood, tempo, etc)
                    if (formData.get('advanced')) {
                        try {
                            settingsObj.advanced = JSON.parse(formData.get('advanced'));
                        } catch (e) {
                            console.warn('⚠️ Failed to parse audio advanced options:', e);
                        }
                    }
                }
                
                formData.append('settings', JSON.stringify(settingsObj));
                
                // Create job in queue (instant response!)
                // ✨ Send FormData directly (supports file uploads + JSON data)
                const response = await fetch('/api/queue-generation/create', {
                    method: 'POST',
                    // ⚠️ Don't set Content-Type header - browser will set it automatically with boundary
                    body: formData
                });
                
                const data = await response.json();
                
                if (!response.ok || !data.success) {
                    throw new Error(data.message || 'Failed to queue generation');
                }
                
                
                // ✨ CRITICAL: Link loading card to job ID BEFORE polling starts
                // First try to find temp loading card, fallback to latest loading card
                let loadingCard = null;
                
                // Method 1: Find by temp ID (most reliable)
                loadingCard = document.querySelector('[data-temp-id="temp-loading"]');
                if (loadingCard) {
                    loadingCard.removeAttribute('data-temp-id');
                    loadingCard.setAttribute('data-job-id', data.jobId);
                } else {
                    // Method 2: Fallback - Get latest loading card without job ID
                    const allLoadingCards = document.querySelectorAll('[data-generation-loading="true"]');
                    for (let i = allLoadingCards.length - 1; i >= 0; i--) {
                        const card = allLoadingCards[i];
                        // Only use cards that don't already have a job ID
                        if (!card.hasAttribute('data-job-id')) {
                            loadingCard = card;
                            loadingCard.setAttribute('data-job-id', data.jobId);
                            break;
                        }
                    }
                }
                
                if (!loadingCard) {
                    console.error('❌ No loading card found to link!', {
                        tempIdCard: !!document.querySelector('[data-temp-id="temp-loading"]'),
                        totalLoadingCards: document.querySelectorAll('[data-generation-loading="true"]').length,
                        jobId: data.jobId
                    });
                }
                
                // ✨ Start real-time tracking via SSE or polling
                if (window.queueClient) {
                    window.queueClient.pollJobStatus(
                        data.jobId,
                        (job) => {
                            // onUpdate: Update progress
                            // ✨ Fix: Find loading card by job ID (supports concurrent generations)
                            const loadingCard = document.querySelector(`[data-job-id="${data.jobId}"]`);
                            if (loadingCard && typeof updateLoadingProgress === 'function') {
                                updateLoadingProgress(loadingCard, job.progress);
                            } else if (!loadingCard) {
                                console.error(`   ❌ Loading card not found for job ${data.jobId}`);
                                // List all loading cards
                                const allLoadingCards = document.querySelectorAll('[data-generation-loading="true"]');
                                allLoadingCards.forEach((card, idx) => {
                                });
                            }
                        },
                        (job) => {
                            // onComplete: Show result
                            
                            // ✨ CRITICAL: Reset isGenerating for this mode
                            isGenerating[mode] = false;
                            
                            // Don't call completeLoading here - let handleGenerationComplete do it
                            // This prevents double rendering
                            
                            // Parse job settings to get originalPrompt
                            let jobSettings = job.settings || {};
                            if (typeof jobSettings === 'string') {
                                try {
                                    jobSettings = JSON.parse(jobSettings);
                                } catch (e) {
                                    console.error('Failed to parse job settings:', e);
                                    jobSettings = {};
                                }
                            }
                            
                            // Mock data format for compatibility
                            const mockData = {
                                success: true,
                                creditsUsed: job.creditsCost,
                                creditsRemaining: 0, // Will be updated from credits endpoint
                                generationId: job.id, // ✨ Add generation ID for immediate share functionality
                                metadata: {
                                    originalPrompt: jobSettings.originalPrompt || null,
                                    settings: jobSettings
                                },
                                data: mode === 'image' ? {
                                    images: [{
                                        url: job.resultUrl,
                                        width: 1024,
                                        height: 1024
                                    }]
                                } : mode === 'video' ? {
                                    video: {
                                        url: job.resultUrl,
                                        width: 1920,
                                        height: 1080,
                                        duration: 5
                                    }
                                } : {
                                    audio: {
                                        url: job.resultUrl,
                                        duration: jobSettings.duration || 5,
                                        type: jobSettings.type || 'audio'
                                    }
                                }
                            };
                            
                            // Use existing display function
                            handleGenerationComplete(mockData, mode);
                        },
                        async (error) => {
                            // onError: Show error
                            console.error('❌ Generation failed:', error);
                            
                            // ✨ CRITICAL: Reset isGenerating for this mode
                            isGenerating[mode] = false;
                            
                            // ✨ Show user-friendly error notification
                            const errorMsg = error.errorMessage || error.error || error.message || 'Generation failed';
                            showNotification(errorMsg, 'error');
                            
                            // ✨ CRITICAL: Display failed job card FIRST, then remove loading card
                            // This prevents "blank screen" during the transition
                            const softRefreshSuccess = await softRefreshFailedJob(data.jobId, mode, errorMsg);
                            
                            // ✨ NOW remove loading card (after failed card is displayed)
                            const loadingCard = document.querySelector(`[data-job-id="${data.jobId}"]`);
                            if (loadingCard && typeof removeLoadingCard === 'function') {
                                removeLoadingCard(loadingCard);
                            } else if (loadingCard) {
                                // Manual removal if function not available
                                loadingCard.remove();
                            }
                            
                            // Fallback to full refresh if soft refresh failed
                            if (!softRefreshSuccess) {
                                if (typeof loadRecentGenerations === 'function') {
                                    loadRecentGenerations();
                                } else {
                                    console.warn('⚠️ loadRecentGenerations not available, failed card may not show');
                                }
                            } else {
                            }
                            
                            // Update button state
                            const remainingActive = Object.values(isGenerating).filter(v => v === true).length;
                            if (remainingActive === 0) {
                                generateBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg><span>Run</span>';
                            }
                        }
                    );
                    
                    // Don't wait for completion - return immediately!
                    // Polling will handle the rest
                    showNotification('Generation queued! You can close this page.', 'success');
                    return; // Exit early - polling handles the rest
                }
                
                // Fallback to old polling if queueClient not available
                console.warn('⚠️ queueClient not available, using old polling');
                const endpoint = mode === 'image' ? '/api/generate/image/generate' : '/api/generate/video/generate';
                
                const fallbackResponse = await fetch(endpoint, {
                    method: 'POST',
                    body: formData
                });
                
                const fallbackData = await fallbackResponse.json();
                
                if (!fallbackResponse.ok) {
                    throw new Error(fallbackData.message || 'Generation failed');
                }
                
                // Handle completion (for fallback mode)
                handleGenerationComplete(fallbackData, mode);
                
            } catch (error) {
                console.error('Generation error:', error);
                
                // Remove loading card on error
                const loadingCard = document.querySelector('[data-generation-loading="true"]');
                if (loadingCard && typeof removeLoadingCard === 'function') {
                    removeLoadingCard(loadingCard);
                }
                
                // Show failed card (DON'T show empty state)
                
                // Get current settings for failed metadata
                const failedType = mode === 'image' 
                    ? document.getElementById('image-type')?.value 
                    : document.getElementById('video-type')?.value;
                const failedAspectRatio = document.querySelector(`#${mode}-mode .aspect-btn.active`)?.getAttribute('data-ratio') || '1:1';
                const failedDuration = mode === 'video' 
                    ? parseInt(document.querySelector('#video-mode .duration-btn.active')?.getAttribute('data-duration') || '5')
                    : null;
                
                // Create metadata for failed generation (without FAL.AI model_id)
                const failedMetadata = {
                    type: mode,
                    subType: failedType,
                    prompt: prompt,
                    settings: {
                        model: selectedModel?.name || 'Unknown Model',
                        aspectRatio: failedAspectRatio,
                        quantity: currentQuantity,
                        duration: failedDuration
                    },
                    creditsCost: 0,
                    status: 'failed',
                    createdAt: new Date().toISOString(),
                    errorMessage: error.message || 'Failed to generate'
                };
                
                displayFailedResult(error.message || 'Failed to generate', mode, failedMetadata);
                
                // 📱 Sync failed result to mobile view
                if (window.innerWidth < 1024 && typeof window.syncResultsToMobile === 'function') {
                    setTimeout(() => {
                        window.syncResultsToMobile();
                    }, 100);
                }
                
                // ✨ Soft refresh result container to show updated history
                if (typeof loadRecentGenerations === 'function') {
                    setTimeout(() => {
                        loadRecentGenerations();
                    }, 1000); // 1 second delay to ensure DB is updated
                }
                
                showNotification(error.message || 'Failed to generate. Please try again.', 'error');
            } finally {
                // ✨ CRITICAL: Reset loading state for THIS mode
                isGenerating[mode] = false;
                
                // ✨ Update button state based on remaining active generations
                const remainingActive = Object.values(isGenerating).filter(v => v === true).length;
                
                if (remainingActive === 0) {
                    // All done - reset to default
                    generateBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg><span>Run</span>';
                } else {
                    // Update counter badge
                    const counterBadge = remainingActive > 1 
                        ? `<span class="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">${remainingActive}</span>` 
                        : '';
                    
                    generateBtn.innerHTML = `
                        <div class="relative">
                            ${counterBadge}
                            <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 74 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        <span>Generating...</span>
                    `;
                }
            }
        });
    }
    
    // Helper: Handle generation complete (queue or direct)
    function handleGenerationComplete(data, mode) {
        // Complete loading animation and remove loading card
        const loadingCard = document.querySelector('[data-generation-loading="true"]');
        if (loadingCard) {
            if (typeof completeLoading === 'function') {
                completeLoading(loadingCard);
            }
            
            // Remove loading card after brief animation
            setTimeout(() => {
                loadingCard.remove();
            }, 500);
        }
        
        // Get current settings for metadata
        const currentType = mode === 'image' 
            ? document.getElementById('image-type')?.value 
            : document.getElementById('video-type')?.value;
        const currentAspectRatio = document.querySelector(`#${mode}-mode .aspect-btn.active`)?.getAttribute('data-ratio') || '1:1';
        const currentDuration = mode === 'video' 
            ? parseInt(document.querySelector('#video-mode .duration-btn.active')?.getAttribute('data-duration') || '5')
            : null;
        
        // ✨ FIX: Use actual credits from backend (not frontend calculation)
        // The backend already calculated the exact cost based on the actual API usage
        let actualCreditsCost = parseFloat(data.creditsUsed);
        
        // Log for debugging
        
        // If backend didn't send credits, this is an error - don't fallback
        if (isNaN(actualCreditsCost)) {
            console.error('❌ Backend did not send creditsUsed! This should not happen.');
            actualCreditsCost = 0;
        }
        
        // Round to 2 decimal places for display consistency
        actualCreditsCost = Math.round(actualCreditsCost * 100) / 100;
        
        // Create metadata for new generation (with accurate credits cost)
        // If data already has metadata (from polling), merge it with UI data
        const generationMetadata = data.metadata ? {
            ...data.metadata,
            type: mode,
            subType: currentType,
            prompt: document.getElementById(mode === 'image' ? 'image-textarea' : 'video-textarea')?.value || '',
            settings: {
                ...(data.metadata.settings || {}),
                model: cleanModelName(selectedModel?.name) || 'Unknown Model',
                aspectRatio: currentAspectRatio,
                quantity: currentQuantity,
                duration: currentDuration
            },
            creditsCost: actualCreditsCost,
            status: 'completed',
            createdAt: new Date().toISOString()
        } : {
            type: mode,
            subType: currentType,
            prompt: document.getElementById(mode === 'image' ? 'image-textarea' : 'video-textarea')?.value || '',
            settings: {
                model: cleanModelName(selectedModel?.name) || 'Unknown Model',
                aspectRatio: currentAspectRatio,
                quantity: currentQuantity,
                duration: currentDuration
            },
            creditsCost: actualCreditsCost,
            status: 'completed',
            createdAt: new Date().toISOString()
        };
        
        // Add originalPrompt to metadata if auto-prompt was used (if not already in data.metadata)
        if (!generationMetadata.originalPrompt && window.AutoPrompt && window.AutoPrompt.isEnabled(mode)) {
            const originalPrompt = window.AutoPrompt.getOriginalPrompt(mode);
            if (originalPrompt && originalPrompt !== generationMetadata.prompt) {
                generationMetadata.originalPrompt = originalPrompt;
            }
        }
        
        
        // Display result
        displayResult(data, mode, generationMetadata);
        
        // ✨ SOFT REFRESH: Update the newly created card with server data
        setTimeout(() => {
            softRefreshLatestCard(mode);
        }, 600);
        
        // 📱 Sync successful result to mobile view
        if (window.innerWidth < 1024 && typeof window.syncResultsToMobile === 'function') {
            setTimeout(() => {
                window.syncResultsToMobile();
            }, 100);
        }
        
        // Update credits display
        if (data.creditsRemaining !== undefined) {
            updateCreditsDisplay(data.creditsRemaining);
        } else {
            // Refresh credits from server
            checkUserCredits();
        }
        
        // Show success notification with appropriate mode name
        const modeNames = {
            'image': 'Image',
            'video': 'Video',
            'audio': 'Audio',
            '3d': '3D Model'
        };
        const modeName = modeNames[mode] || 'Generation';
        showNotification(`${modeName} generated successfully! Used ${actualCreditsCost.toFixed(1)} credits.`, 'success');
    }
    
    // ✨ Soft refresh latest result card from server (updates existing new card)
    async function softRefreshLatestCard(mode) {
        try {
            
            // Fetch the latest generation from server (filter by mode if needed)
            const url = `/api/generate/history?limit=1${mode ? `&type=${mode}` : ''}`;
            const response = await fetch(url);
            const result = await response.json();
            
            if (!result.success || !result.data || result.data.length === 0) {
                // Fallback: just remove data-new attribute
                const newestCard = resultDisplay.querySelector('[data-new="true"]');
                if (newestCard) {
                    newestCard.removeAttribute('data-new');
                }
                return;
            }
            
            const latestGen = result.data[0];
            
            // Find the newest card (first child marked as new)
            const newestCard = resultDisplay.querySelector('[data-new="true"]');
            
            if (!newestCard) {
                return;
            }
            
            // Verify it's the same generation (check by timestamp or URL)
            const cardUrl = newestCard.querySelector('img, video, audio')?.src || 
                           newestCard.querySelector('[data-result-url]')?.getAttribute('data-result-url');
            const serverUrl = latestGen.result_url;
            
            // Update card with server data
            newestCard.setAttribute('data-generation-id', latestGen.id);
            newestCard.removeAttribute('data-new');
            
            // ✨ CRITICAL: Update card metadata with complete data from server
            // Parse settings from database
            let parsedSettings = latestGen.settings;
            if (typeof parsedSettings === 'string') {
                try {
                    parsedSettings = JSON.parse(parsedSettings);
                } catch (e) {
                    console.error('Failed to parse settings in softRefresh:', e);
                    parsedSettings = {};
                }
            }
            
            // Build complete metadata including originalPrompt from settings
            const completeMetadata = {
                id: latestGen.id,
                type: latestGen.generation_type,
                subType: latestGen.sub_type,
                prompt: latestGen.prompt,
                settings: parsedSettings,
                creditsCost: latestGen.credits_cost,
                status: latestGen.status,
                createdAt: latestGen.created_at,
                errorMessage: latestGen.error_message
            };
            
            // Add originalPrompt to metadata if available in settings
            if (parsedSettings && parsedSettings.originalPrompt) {
                completeMetadata.originalPrompt = parsedSettings.originalPrompt;
            }
            
            // Update data-metadata with complete server data
            newestCard.setAttribute('data-metadata', JSON.stringify(completeMetadata));
            
            // Update card metadata if available
            if (latestGen.created_at) {
                const timeEl = newestCard.querySelector('.time-ago, [data-created-at]');
                if (timeEl) {
                    timeEl.setAttribute('data-created-at', latestGen.created_at);
                    // Update displayed time if timeAgo function exists
                    if (typeof updateTimeAgo === 'function') {
                        updateTimeAgo(timeEl);
                    }
                }
            }
            
            // Update credits cost if displayed
            if (latestGen.cost_credits !== undefined) {
                const costEl = newestCard.querySelector('[data-credits-cost]');
                if (costEl) {
                    costEl.textContent = `${parseFloat(latestGen.cost_credits).toFixed(1)} credits`;
                    costEl.setAttribute('data-credits-cost', latestGen.cost_credits);
                }
            }
            
            // Add subtle highlight animation to show it's been refreshed
            newestCard.style.transition = 'all 0.3s ease';
            newestCard.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.3)';
            newestCard.style.transform = 'scale(1.02)';
            
            // Remove highlight after animation
            setTimeout(() => {
                newestCard.style.boxShadow = '';
                newestCard.style.transform = '';
            }, 600);
            
            // Update generations count
            if (typeof updateGenerationsCount === 'function') {
                updateGenerationsCount();
            }
            
            // Trigger any custom refresh callbacks
            if (typeof window.onCardRefreshed === 'function') {
                window.onCardRefreshed(newestCard, latestGen, mode);
            }
            
        } catch (error) {
            console.error('❌ Error soft refreshing card:', error);
            // Fallback: at least remove data-new attribute
            const newestCard = resultDisplay.querySelector('[data-new="true"]');
            if (newestCard) {
                newestCard.removeAttribute('data-new');
            }
        }
    }
    
    // ✨ Soft refresh failed job (fetch and display as failed card)
    async function softRefreshFailedJob(jobId, mode, errorMessage) {
        try {
            
            // ✨ CRITICAL: Fetch directly from job status endpoint with retry
            // This is more reliable than history endpoint during race conditions
            let failedJob = null;
            const maxRetries = 3;
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    
                    const statusResponse = await fetch(`/api/queue-generation/status/${jobId}`);
                    const statusData = await statusResponse.json();
                    
                    if (statusData.success && statusData.job && statusData.job.status === 'failed') {
                        // Convert job format to match generation history format
                        failedJob = {
                            id: statusData.job.id,
                            job_id: jobId,
                            type: mode,
                            status: 'failed',
                            error_message: statusData.job.errorMessage || errorMessage,
                            prompt: statusData.job.settings?.prompt || '',
                            settings: statusData.job.settings || {},
                            created_at: statusData.job.createdAt
                        };
                        break;
                    } else if (statusData.success && statusData.job) {
                    }
                } catch (err) {
                    console.warn(`   Attempt ${attempt} failed:`, err.message);
                }
                
                // Wait before retry (progressive backoff: 500ms, 1s, 1.5s)
                if (attempt < maxRetries && !failedJob) {
                    const delay = attempt * 500;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            
            // Fallback to history endpoint if job not found via status
            if (!failedJob) {
                const response = await fetch(`/api/generate/history?limit=10`);
                const result = await response.json();
                
                if (!result.success || !result.data || result.data.length === 0) {
                    return false;
                }
                
                // Find the failed job by ID or recent failed status
                failedJob = result.data.find(gen => gen.job_id === jobId);
                if (!failedJob) {
                    // Fallback: get most recent failed job of this type
                    failedJob = result.data.find(gen => gen.status === 'failed' && gen.type === mode);
                }
            }
            
            if (!failedJob) {
                // Create a generic failed card even if DB not updated yet
                failedJob = {
                    id: `temp-${jobId}`,
                    job_id: jobId,
                    type: mode,
                    status: 'failed',
                    error_message: errorMessage,
                    prompt: '',
                    settings: {},
                    created_at: new Date().toISOString()
                };
            }
            
            
            // Check if already displayed to prevent duplicates
            const existingCard = resultDisplay.querySelector(`[data-generation-id="${failedJob.id}"]`);
            if (existingCard) {
                // Just update the status indicator
                const statusBadge = existingCard.querySelector('[data-status]');
                if (statusBadge) {
                    statusBadge.textContent = 'Failed';
                    statusBadge.className = 'px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400';
                }
                return true;
            }
            
            // ✨ CRITICAL: Ensure result display exists
            if (!resultDisplay) {
                console.error('❌ Result display element not found!');
                return false;
            }
            
            // Create failed job card
            const failedCard = createFailedJobCard(failedJob, mode, errorMessage);
            
            if (!failedCard) {
                console.error('❌ Failed to create failed job card, creating minimal fallback...');
                // Create minimal error card as last resort
                const minimalCard = document.createElement('div');
                minimalCard.className = 'result-card bg-gradient-to-br from-red-900/20 to-gray-900/40 rounded-xl p-4 border border-red-500/30 relative';
                minimalCard.setAttribute('data-generation-id', failedJob.id);
                minimalCard.setAttribute('data-status', 'failed');
                minimalCard.innerHTML = `
                    <div class="absolute top-2 right-2">
                        <button onclick="handleDeleteCard(this)" 
                                class="px-2 py-1.5 bg-red-600/80 hover:bg-red-700 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
                                title="Delete failed generation">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="text-red-400">
                        <div class="font-semibold mb-2">❌ Generation Failed</div>
                        <div class="text-sm text-gray-400">${errorMessage || 'Unknown error'}</div>
                    </div>
                `;
                resultDisplay.classList.remove('hidden');
                resultDisplay.style.display = 'block';
                resultDisplay.insertBefore(minimalCard, resultDisplay.firstChild);
                return true;
            }
            
            // Show result display
            resultDisplay.classList.remove('hidden');
            resultDisplay.style.display = 'block';
            
            // Add fade-in animation
            failedCard.style.opacity = '0';
            failedCard.style.transform = 'translateY(-20px)';
            
            // Prepend to top (newest first)
            resultDisplay.insertBefore(failedCard, resultDisplay.firstChild);
            
            // Animate in
            setTimeout(() => {
                failedCard.style.transition = 'all 0.4s ease-out';
                failedCard.style.opacity = '1';
                failedCard.style.transform = 'translateY(0)';
            }, 50);
            
            // Update generations count
            if (typeof updateGenerationsCount === 'function') {
                updateGenerationsCount();
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Error soft refreshing failed job:', error);
            return false;
        }
    }
    
    // ✨ Create failed job card
    function createFailedJobCard(jobData, mode, errorMessage) {
        try {
            const card = document.createElement('div');
            card.className = 'result-card bg-gradient-to-br from-red-900/20 to-gray-900/40 rounded-xl p-4 border border-red-500/30 hover:border-red-500/50 transition-all duration-300 relative';
            card.setAttribute('data-generation-id', jobData.id);
            card.setAttribute('data-status', 'failed');
            
            const modeIcons = {
                'image': '🖼️',
                'video': '🎬',
                'audio': '🎵',
                '3d': '🎨'
            };
            
            const icon = modeIcons[mode] || '❌';
            const displayError = errorMessage || jobData.error_message || 'Generation failed';
            
            card.innerHTML = `
                <div class="absolute top-2 right-2">
                    <button onclick="handleDeleteCard(this)" 
                            class="px-2 py-1.5 bg-red-600/80 hover:bg-red-700 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
                            title="Delete failed generation">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="flex items-start gap-3">
                    <div class="text-4xl opacity-50">${icon}</div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between gap-2 mb-2 pr-8">
                            <h3 class="font-semibold text-red-400">Failed Generation</h3>
                            <span data-status class="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">Failed</span>
                        </div>
                        
                        ${jobData.prompt ? `
                            <p class="text-sm text-gray-400 mb-2 line-clamp-2">${escapeHtml(jobData.prompt)}</p>
                        ` : ''}
                        
                        <div class="bg-red-950/30 border border-red-500/30 rounded-lg p-3 mb-3">
                            <p class="text-xs text-red-300 flex items-start gap-2">
                                <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                                </svg>
                                <span>${escapeHtml(displayError)}</span>
                            </p>
                        </div>
                        
                        <div class="flex items-center justify-between text-xs text-gray-500">
                            <span data-created-at="${jobData.created_at || new Date().toISOString()}" class="time-ago">
                                ${timeAgo(jobData.created_at || new Date())}
                            </span>
                            ${jobData.cost_credits ? `
                                <span class="text-gray-400">
                                    <span data-credits-cost="${jobData.cost_credits}">${parseFloat(jobData.cost_credits).toFixed(1)}</span> credits
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            return card;
            
        } catch (error) {
            console.error('❌ Error creating failed job card:', error);
            return null;
        }
    }
    
    // Helper function to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Track ongoing soft refresh to prevent concurrent calls
    let softRefreshInProgress = false;
    
    // ✨ Soft refresh new result (fetches and displays latest generation)
    async function softRefreshNewResult(mode) {
        try {
            // ✅ FIX: Prevent concurrent soft refresh calls
            if (softRefreshInProgress) {
                return;
            }
            
            softRefreshInProgress = true;
            
            // Fetch the latest generations from server (limit=5 to catch multi-track Suno results)
            const response = await fetch('/api/generate/history?limit=5');
            const result = await response.json();
            
            if (!result.success || !result.data || result.data.length === 0) {
                softRefreshInProgress = false;
                return;
            }
            
            // ✨ CRITICAL: Remove all placeholder cards (data-new="true") to prevent duplicates
            // This ensures old placeholder cards are replaced with proper database-backed cards
            const placeholderCards = resultDisplay.querySelectorAll('[data-new="true"]');
            placeholderCards.forEach(card => {
                card.remove();
            });
            
            // ✅ FIX: Stronger duplicate check - also check by result_url for safety
            const newGenerations = result.data.filter(gen => {
                // Check by generation ID
                const existingCardById = resultDisplay.querySelector(`[data-generation-id="${gen.id}"]`);
                if (existingCardById) {
                    return false;
                }
                
                // Additional check by result URL (for extra safety)
                if (gen.result_url) {
                    const allCards = resultDisplay.querySelectorAll('[data-generation-id]');
                    for (let card of allCards) {
                        // For audio cards, check audio source
                        const audioEl = card.querySelector('audio source');
                        if (audioEl && audioEl.src === gen.result_url) {
                            return false;
                        }
                        // For video cards
                        const videoEl = card.querySelector('video source');
                        if (videoEl && videoEl.src === gen.result_url) {
                            return false;
                        }
                        // For image cards
                        const imgEl = card.querySelector('img.result-image');
                        if (imgEl && imgEl.src === gen.result_url) {
                            return false;
                        }
                    }
                }
                
                return true;
            });
            
            if (newGenerations.length === 0) {
                softRefreshInProgress = false;
                return;
            }
            
            
            // Show result display
            if (resultDisplay) {
                resultDisplay.classList.remove('hidden');
                resultDisplay.style.display = 'block';
            }
            
            // Scroll to top for immediate visibility
            if (resultScrollArea) {
                resultScrollArea.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
            
            // Process each new generation
            newGenerations.forEach((latestGen, genIndex) => {
                // Prepare metadata
                // Parse settings if it's a JSON string
                let parsedSettings = latestGen.settings;
                if (typeof parsedSettings === 'string') {
                    try {
                        parsedSettings = JSON.parse(parsedSettings);
                    } catch (e) {
                        console.error('Failed to parse settings:', e);
                        parsedSettings = {};
                    }
                }
                
                const metadata = {
                    id: latestGen.id,
                    type: latestGen.generation_type,
                    subType: latestGen.sub_type,
                    prompt: latestGen.prompt,
                    settings: parsedSettings,
                    creditsCost: latestGen.credits_cost,
                    status: latestGen.status,
                    createdAt: latestGen.created_at,
                    errorMessage: latestGen.error_message,
                    // Include Suno track info if available
                    track_index: latestGen.metadata?.track_index,
                    total_tracks: latestGen.metadata?.total_tracks,
                    track: latestGen.metadata?.track,  // ✅ FIX: Include full track object with duration
                    all_tracks: latestGen.metadata?.all_tracks
                };
                
                // Add originalPrompt to metadata if available in settings
                if (parsedSettings && parsedSettings.originalPrompt) {
                    metadata.originalPrompt = parsedSettings.originalPrompt;
                }
                
                if (latestGen.status === 'completed' && latestGen.result_url) {
                let newCard;
                
                // Create appropriate card based on type
                if (latestGen.generation_type === 'image') {
                    const urls = latestGen.result_url.split(',');
                    urls.forEach((url, index) => {
                        const imageCard = createImageCard({
                            url: url.trim(),
                            width: latestGen.settings?.width || 1024,
                            height: latestGen.settings?.height || 1024
                        }, index, latestGen.id, metadata);
                        
                        // Add animation
                        imageCard.style.opacity = '0';
                        imageCard.style.transform = 'translateY(-20px)';
                        resultDisplay.insertBefore(imageCard, resultDisplay.firstChild);
                        
                        // Animate in with pulse
                        setTimeout(() => {
                            imageCard.style.transition = 'all 0.4s ease-out';
                            imageCard.style.opacity = '1';
                            imageCard.style.transform = 'translateY(0)';
                            addCompletionPulse(imageCard);
                        }, 50 + (index * 100));
                        
                        newCard = imageCard;
                    });
                } else if (latestGen.generation_type === 'video') {
                    newCard = createVideoCard({
                        url: latestGen.result_url,
                        width: latestGen.settings?.width || 1920,
                        height: latestGen.settings?.height || 1080,
                        duration: latestGen.settings?.duration || 5
                    }, latestGen.id, metadata);
                    
                    // Add animation
                    newCard.style.opacity = '0';
                    newCard.style.transform = 'translateY(-20px)';
                    resultDisplay.insertBefore(newCard, resultDisplay.firstChild);
                    
                    setTimeout(() => {
                        newCard.style.transition = 'all 0.4s ease-out';
                        newCard.style.opacity = '1';
                        newCard.style.transform = 'translateY(0)';
                        addCompletionPulse(newCard);
                    }, 50);
                } else if (latestGen.generation_type === 'audio') {
                    // ✅ Get actual duration from Suno metadata if available
                    let audioDuration = 5;
                    if (latestGen.metadata?.track?.duration) {
                        audioDuration = Math.round(parseFloat(latestGen.metadata.track.duration));
                    } else if (latestGen.metadata?.track?.audio_length) {
                        audioDuration = Math.round(parseFloat(latestGen.metadata.track.audio_length));
                    } else if (latestGen.settings?.duration) {
                        audioDuration = latestGen.settings.duration;
                    }
                    
                    newCard = createAudioCard({
                        url: latestGen.result_url,
                        duration: audioDuration,
                        type: latestGen.sub_type || 'audio'
                    }, latestGen.id, metadata);
                    
                    // ✅ Verify generation ID was set
                    const verifyId = newCard.getAttribute('data-generation-id');
                    if (!verifyId) {
                        console.error('❌ WARNING: Soft refresh created audio card without generation ID!', latestGen);
                    } else {
                    }
                    
                    // Add animation
                    newCard.style.opacity = '0';
                    newCard.style.transform = 'translateY(-20px)';
                    resultDisplay.insertBefore(newCard, resultDisplay.firstChild);
                    
                    setTimeout(() => {
                        newCard.style.transition = 'all 0.4s ease-out';
                        newCard.style.opacity = '1';
                        newCard.style.transform = 'translateY(0)';
                        addCompletionPulse(newCard);
                    }, 50);
                }
                
                }
            }); // End forEach
            
            // Update generations count
            updateGenerationsCount();
            
            // ✅ Reset flag after all cards are added
            softRefreshInProgress = false;
            
        } catch (error) {
            console.error('❌ Error soft refreshing new result:', error);
            // ✅ Reset flag on error too
            softRefreshInProgress = false;
        }
    }
    
    // Track displayed results to prevent duplicates
    const displayedResults = new Set();
    
    // Display result function with scroll
    function displayResult(data, mode, generationMetadata = null) {
        
        if (!resultDisplay) {
            console.error('❌ resultDisplay not found!');
            return;
        }
        
        // Generate unique ID for this result to prevent duplicates
        const resultId = data.data?.images?.[0]?.url || data.data?.video?.url || data.data?.audio?.url || Date.now();
        
        // Check if this result was already displayed
        if (displayedResults.has(resultId)) {
            console.warn('⚠️ Result already displayed, skipping to prevent duplicate:', resultId);
            return;
        }
        
        // Mark this result as displayed
        displayedResults.add(resultId);
        
        // Clear old entries after 100 items to prevent memory leak
        if (displayedResults.size > 100) {
            const firstItem = displayedResults.values().next().value;
            displayedResults.delete(firstItem);
        }
        
        // Show result display with smooth transition
        resultDisplay.classList.remove('hidden');
        resultDisplay.style.display = 'block';
        
        // ✨ Immediate visual feedback - scroll to top first
        if (resultScrollArea) {
            resultScrollArea.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
        
        // Update counter and hide empty placeholder if needed
        updateGenerationsCount();
        
        // Create new results (prepend to top - newest first)
        if (mode === 'image' && data.data.images) {
            data.data.images.forEach((image, index) => {
                const imageCard = createImageCard(image, index, null, generationMetadata);
                // Add fade-in animation
                imageCard.style.opacity = '0';
                imageCard.style.transform = 'translateY(-20px)';
                imageCard.setAttribute('data-new', 'true'); // Mark as new
                
                // Prepend to top (newest first)
                resultDisplay.insertBefore(imageCard, resultDisplay.firstChild);
                
                // Animate in with completion pulse
                setTimeout(() => {
                    imageCard.style.transition = 'all 0.4s ease-out';
                    imageCard.style.opacity = '1';
                    imageCard.style.transform = 'translateY(0)';
                    
                    // Add completion pulse effect
                    addCompletionPulse(imageCard);
                }, 50 + (index * 100)); // Stagger animation
            });
        } else if (mode === 'video' && data.data.video) {
            const videoCard = createVideoCard(data.data.video, null, generationMetadata);
            // Add fade-in animation
            videoCard.style.opacity = '0';
            videoCard.style.transform = 'translateY(-20px)';
            videoCard.setAttribute('data-new', 'true'); // Mark as new
            
            // Prepend to top (newest first)
            resultDisplay.insertBefore(videoCard, resultDisplay.firstChild);
            
            // Animate in with completion pulse
            setTimeout(() => {
                videoCard.style.transition = 'all 0.4s ease-out';
                videoCard.style.opacity = '1';
                videoCard.style.transform = 'translateY(0)';
                
                // Add completion pulse effect
                addCompletionPulse(videoCard);
            }, 50);
        } else if (mode === 'audio' && data.data.audio) {
            const audioCard = createAudioCard(data.data.audio, null, generationMetadata);
            // Add fade-in animation
            audioCard.style.opacity = '0';
            audioCard.style.transform = 'translateY(-20px)';
            audioCard.setAttribute('data-new', 'true'); // Mark as new
            
            // Prepend to top (newest first)
            resultDisplay.insertBefore(audioCard, resultDisplay.firstChild);
            
            // Animate in with completion pulse
            setTimeout(() => {
                audioCard.style.transition = 'all 0.4s ease-out';
                audioCard.style.opacity = '1';
                audioCard.style.transform = 'translateY(0)';
                
                // Add completion pulse effect
                addCompletionPulse(audioCard);
            }, 50);
        } else if (mode === '3d' && (data.data.model || data.data['3d'])) {
            const modelData = data.data.model || data.data['3d'];
            const modelCard = create3DCard(modelData, null, generationMetadata);
            // Add fade-in animation
            modelCard.style.opacity = '0';
            modelCard.style.transform = 'translateY(-20px)';
            modelCard.setAttribute('data-new', 'true'); // Mark as new
            
            // Prepend to top (newest first)
            resultDisplay.insertBefore(modelCard, resultDisplay.firstChild);
            
            // Animate in with completion pulse
            setTimeout(() => {
                modelCard.style.transition = 'all 0.4s ease-out';
                modelCard.style.opacity = '1';
                modelCard.style.transform = 'translateY(0)';
                
                // Add completion pulse effect
                addCompletionPulse(modelCard);
            }, 50);
        } else if (mode === 'text' && (data.data.text || data.data.output)) {
            const textData = data.data.text || data.data.output || data.data;
            const textCard = createTextOutputCard(textData, null, generationMetadata);
            // Add fade-in animation
            textCard.style.opacity = '0';
            textCard.style.transform = 'translateY(-20px)';
            textCard.setAttribute('data-new', 'true'); // Mark as new
            
            // Prepend to top (newest first)
            resultDisplay.insertBefore(textCard, resultDisplay.firstChild);
            
            // Animate in with completion pulse
            setTimeout(() => {
                textCard.style.transition = 'all 0.4s ease-out';
                textCard.style.opacity = '1';
                textCard.style.transform = 'translateY(0)';
                
                // Add completion pulse effect
                addCompletionPulse(textCard);
            }, 50);
        }
        
    }
    
    // ✨ Add completion pulse effect to newly created card
    function addCompletionPulse(card) {
        if (!card) return;
        
        // Add a subtle pulse/glow effect to highlight the new result
        const originalBoxShadow = card.style.boxShadow || '';
        
        // Initial glow
        card.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.4), 0 0 20px rgba(34, 197, 94, 0.2)';
        
        // Pulse animation
        let pulseCount = 0;
        const pulseInterval = setInterval(() => {
            pulseCount++;
            
            if (pulseCount % 2 === 0) {
                card.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.4), 0 0 20px rgba(34, 197, 94, 0.2)';
            } else {
                card.style.boxShadow = '0 0 0 2px rgba(34, 197, 94, 0.2), 0 0 10px rgba(34, 197, 94, 0.1)';
            }
            
            // Stop after 2 pulses
            if (pulseCount >= 4) {
                clearInterval(pulseInterval);
                // Fade out the glow
                setTimeout(() => {
                    card.style.transition = 'box-shadow 0.5s ease-out';
                    card.style.boxShadow = originalBoxShadow;
                }, 100);
            }
        }, 300);
    }
    
    // Update generations count and empty state visibility
    function updateGenerationsCount() {
        const resultDisplay = document.getElementById('result-display');
        const generationsCount = document.getElementById('generations-count');
        const emptyStatePlaceholder = document.getElementById('empty-state-placeholder');
        
        if (!resultDisplay || !generationsCount) return;
        
        // Count all result cards (not loading cards)
        const allCards = resultDisplay.querySelectorAll('.result-card:not(.loading-card)');
        const visibleCards = Array.from(allCards).filter(card => 
            card.style.display !== 'none' && !card.classList.contains('hidden')
        );
        
        const count = visibleCards.length;
        generationsCount.textContent = count;
        
        // Show/hide empty state placeholder
        if (emptyStatePlaceholder) {
            if (count === 0) {
                emptyStatePlaceholder.classList.remove('hidden');
                emptyStatePlaceholder.style.display = 'block';
            } else {
                emptyStatePlaceholder.classList.add('hidden');
                emptyStatePlaceholder.style.display = 'none';
            }
        }
    }
    
    // Filter functionality
    function initializeFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const resultDisplay = document.getElementById('result-display');
        
        if (!filterButtons.length || !resultDisplay) return;
        
        filterButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const filter = this.getAttribute('data-filter');
                
                // Update active state
                filterButtons.forEach(b => {
                    b.classList.remove('active', 'bg-blue-600/20', 'text-blue-300', 'border-blue-600/30');
                    b.classList.add('bg-white/5', 'text-gray-400', 'border-white/10');
                });
                this.classList.remove('bg-white/5', 'text-gray-400', 'border-white/10');
                this.classList.add('active', 'bg-blue-600/20', 'text-blue-300', 'border-blue-600/30');
                
                // Apply filter
                const allCards = resultDisplay.querySelectorAll('.result-card:not(.loading-card)');
                allCards.forEach(card => {
                    const cardMode = card.getAttribute('data-mode');
                    
                    if (filter === 'all') {
                        card.style.display = '';
                        card.classList.remove('hidden');
                    } else if (cardMode === filter) {
                        card.style.display = '';
                        card.classList.remove('hidden');
                    } else {
                        card.style.display = 'none';
                        card.classList.add('hidden');
                    }
                });
                
                // Update count after filtering
                updateGenerationsCount();
            });
        });
    }
    
    // Initialize filters on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeFilters);
    } else {
        initializeFilters();
    }
    
    // Delete generation from database
    async function deleteGenerationFromDB(generationId, cardElement) {
        try {
            const response = await fetch(`/api/generate/delete/${generationId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Remove from DOM
                cardElement.remove();
                showNotification('Deleted successfully', 'success');
                
                // Update counter
                updateGenerationsCount();
            } else {
                console.error('❌ Failed to delete:', data.message);
                showNotification(data.message || 'Failed to delete', 'error');
            }
        } catch (error) {
            console.error('❌ Delete error:', error);
            showNotification('Failed to delete', 'error');
        }
    }
    
    // Helper function to calculate aspect ratio from dimensions
    function calculateAspectRatio(width, height) {
        if (!width || !height) return '1:1';
        
        const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
        const divisor = gcd(width, height);
        const ratioW = width / divisor;
        const ratioH = height / divisor;
        
        // Common aspect ratios mapping
        const ratio = `${ratioW}:${ratioH}`;
        
        // Normalize to common formats
        if (ratioW === ratioH) return '1:1';
        if (ratioW === 16 && ratioH === 9) return '16:9';
        if (ratioW === 9 && ratioH === 16) return '9:16';
        if (ratioW === 4 && ratioH === 3) return '4:3';
        if (ratioW === 3 && ratioH === 4) return '3:4';
        if (ratioW === 21 && ratioH === 9) return '21:9';
        if (ratioW === 9 && ratioH === 21) return '9:21';
        
        // Return simplified ratio
        return ratio;
    }
    
    // Create image card
    function createImageCard(image, index, generationId = null, metadata = null) {
        const card = document.createElement('div');
        card.className = 'result-card bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer';
        
        // Set data-mode for filtering
        card.setAttribute('data-mode', 'image');
        
        // Store generation ID and metadata
        if (generationId) {
            card.setAttribute('data-generation-id', generationId);
        }
        if (metadata) {
            card.setAttribute('data-metadata', JSON.stringify(metadata));
        }
        
        // Extract metadata for display
        const prompt = metadata?.prompt || 'No prompt provided';
        const modelName = cleanModelName(metadata?.settings?.model) || 'Unknown model';
        const quantity = metadata?.settings?.quantity || 1;
        // Fix decimal handling: ensure proper parsing and rounding
        const creditsUsed = metadata?.creditsCost ? 
            parseFloat(parseFloat(metadata.creditsCost).toFixed(2)) : 0;
        
        // Use aspect ratio from settings (what user selected), fallback to calculated
        const actualAspectRatio = metadata?.settings?.aspectRatio || 
                                  metadata?.settings?.aspect_ratio ||
                                  calculateAspectRatio(image.width, image.height);
        
        // ✨ CRITICAL FIX: Calculate unique image number based on quantity and position
        // If quantity > 1, show "Image 1 of 3", "Image 2 of 3", etc.
        // If quantity = 1, just show "Image" (no number)
        let imageLabel = 'Image';
        if (quantity > 1) {
            imageLabel = `Image ${index + 1} of ${quantity}`;
        }
        
        // Add click handler for detail view
        card.addEventListener('click', (e) => {
            // Don't open modal if clicking delete or download button
            if (e.target.closest('button')) return;
            openGenerationDetailModal(card);
        });
        
        const timestamp = new Date().toLocaleString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        card.innerHTML = `
            <!-- Desktop: Horizontal Layout -->
            <div class="hidden md:flex md:flex-row gap-4">
                <!-- Image Preview (Left Side) -->
                <div class="relative w-64 h-64 flex-shrink-0">
                    <img src="${image.url}" alt="${imageLabel}" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <div class="absolute top-2 right-2 flex gap-1.5">
                        <button class="btn-fullscreen px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
                                data-url="${image.url}" data-prompt="${prompt.replace(/"/g, '&quot;')}" data-model="${modelName.replace(/"/g, '&quot;')}" 
                                title="View Fullscreen">
                            <i class="fas fa-expand"></i>
                        </button>
                        <button onclick="openShareModal(this)" 
                                class="btn-share px-2 py-1 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
                                title="Share to Public Gallery">
                            <i class="fas fa-share-alt"></i>
                        </button>
                        <button onclick="downloadFile('${image.url}', '${imageLabel.replace(/\s+/g, '-')}-${Date.now()}.jpg')" 
                                class="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-lg">
                            <i class="fas fa-download"></i>
                        </button>
                        <button onclick="handleDeleteCard(this)" 
                                class="px-2 py-1 bg-red-600/80 hover:bg-red-700 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
                                title="Delete this result">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="absolute bottom-2 left-2 flex gap-2">
                        <div class="px-2 py-1 bg-black/70 backdrop-blur-sm rounded-md text-xs text-white flex items-center gap-2">
                            <span>${imageLabel}</span>
                            <span class="text-gray-300">•</span>
                            <span class="text-blue-300">${actualAspectRatio}</span>
                        </div>
                        <div class="shared-badge hidden px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-sm rounded-md text-xs text-emerald-300 flex items-center gap-1">
                            <i class="fas fa-check-circle"></i>
                            <span>Dibagikan</span>
                        </div>
                    </div>
                </div>
                
                <!-- Content (Right Side) -->
                <div class="flex-1 p-4 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center gap-2 mb-3">
                            <div class="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-300 font-semibold">
                                <i class="fas fa-image mr-1"></i> Image
                            </div>
                            <div class="text-xs text-gray-400">
                                ${image.width} × ${image.height}
                            </div>
                            <div class="text-xs text-blue-300">
                                ${actualAspectRatio}
                            </div>
                        </div>
                        
                        <p class="text-sm text-gray-300 leading-relaxed line-clamp-3 mb-2">
                            ${prompt}
                        </p>
                        <p class="text-xs text-gray-500">
                            <i class="fas fa-robot mr-1"></i> ${modelName}
                        </p>
                    </div>
                    
                    <!-- Date & Time (Separated Below) -->
                    <div class="mt-4 pt-3 border-t border-white/10">
                        <div class="flex items-center justify-between text-xs text-gray-500">
                            <div class="flex items-center gap-1">
                                <i class="fas fa-clock"></i>
                                <span>${timestamp}</span>
                            </div>
                            <div class="flex items-center gap-1 text-yellow-400">
                                <i class="fas fa-coins"></i>
                                <span>${creditsUsed.toFixed(1)} credits</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Mobile: Vertical Layout -->
            <div class="md:hidden">
                <div class="relative bg-black flex items-center justify-center" style="max-height: 70vh;">
                    <img src="${image.url}" alt="${imageLabel}" class="w-auto h-auto" style="max-height: 70vh; max-width: 100%; object-fit: contain;">
                    <div class="absolute top-2 right-2 flex gap-1">
                        <button class="btn-fullscreen px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-semibold transition"
                                data-url="${image.url}" data-prompt="${prompt.replace(/"/g, '&quot;')}" data-model="${modelName.replace(/"/g, '&quot;')}"
                                title="Fullscreen">
                            <i class="fas fa-expand"></i>
                        </button>
                        <button onclick="openShareModal(this)" 
                                class="btn-share px-2 py-1 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-semibold transition"
                                title="Share">
                            <i class="fas fa-share-alt"></i>
                        </button>
                        <button onclick="downloadFile('${image.url}', '${imageLabel.replace(/\s+/g, '-')}-${Date.now()}.jpg')" 
                                class="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-semibold transition">
                            <i class="fas fa-download"></i>
                        </button>
                        <button onclick="handleDeleteCard(this)" 
                                class="px-2 py-1 bg-red-600/80 hover:bg-red-700 rounded-lg text-xs font-semibold transition"
                                title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="absolute bottom-2 left-2 flex gap-2">
                        <div class="px-2 py-1 bg-black/70 backdrop-blur-sm rounded-md text-xs text-white">
                            ${actualAspectRatio}
                        </div>
                        <div class="shared-badge hidden px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-sm rounded-md text-xs text-emerald-300 flex items-center gap-1">
                            <i class="fas fa-check-circle"></i>
                            <span>Shared</span>
                        </div>
                    </div>
                </div>
                <div class="p-4">
                    <p class="text-sm text-gray-300 leading-relaxed line-clamp-2 mb-2">${prompt}</p>
                    <p class="text-xs text-gray-500 mb-2"><i class="fas fa-robot mr-1"></i> ${modelName}</p>
                    <p class="text-xs text-gray-400 mb-2">${image.width} × ${image.height} • ${actualAspectRatio}</p>
                    <div class="pt-2 border-t border-white/10 flex items-center justify-between">
                        <span class="text-xs text-gray-500"><i class="fas fa-clock mr-1"></i> ${timestamp}</span>
                        <span class="text-xs text-yellow-400"><i class="fas fa-coins mr-1"></i> ${creditsUsed.toFixed(1)}</span>
                    </div>
                </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners for fullscreen buttons
        card.querySelectorAll('.btn-fullscreen').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = btn.getAttribute('data-url');
                const prompt = btn.getAttribute('data-prompt');
                const model = btn.getAttribute('data-model');
                openFullscreenViewer(url, 0, { prompt, model });
            });
        });
        
        // Initialize share button after card is created
        setTimeout(() => {
            const genId = card.getAttribute('data-generation-id');
            if (genId && typeof window.checkGenerationSharedStatus === 'function') {
                window.checkGenerationSharedStatus(genId);
            }
        }, 100);
        
        return card;
    }
    
    // Create failed generation card
    function createFailedCard(errorMessage, mode, generationId = null, metadata = null) {
        const card = document.createElement('div');
        card.className = 'result-card bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-sm rounded-xl overflow-hidden border border-red-500/30 transition-all duration-300 cursor-pointer';
        
        // Set data-mode for filtering
        card.setAttribute('data-mode', mode || 'unknown');
        
        // Store generation ID and metadata
        if (generationId) {
            card.setAttribute('data-generation-id', generationId);
        }
        if (metadata) {
            card.setAttribute('data-metadata', JSON.stringify(metadata));
        }
        
        // Add click handler for detail view
        card.addEventListener('click', (e) => {
            // Don't open modal if clicking delete button
            if (e.target.closest('button')) return;
            openGenerationDetailModal(card);
        });
        
        const timestamp = new Date().toLocaleString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const modeIcon = mode === 'video' ? 'fa-video' : 'fa-image';
        const modeColor = mode === 'video' ? 'blue' : 'cyan';
        
        card.innerHTML = `
            <!-- Desktop: Horizontal Layout -->
            <div class="hidden md:flex md:flex-row gap-4">
                <!-- Failed Visual (Left Side) -->
                <div class="relative w-64 h-64 flex-shrink-0 bg-red-500/10 flex items-center justify-center">
                    <div class="text-center">
                        <svg class="w-16 h-16 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                        <p class="text-red-400 font-semibold">Generation failed</p>
                    </div>
                    <div class="absolute top-2 right-2">
                        <button onclick="handleDeleteCard(this)" 
                                class="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
                                title="Delete failed generation">
                            <i class="fas fa-trash mr-1"></i> Delete
                        </button>
                    </div>
                </div>
                
                <!-- Content (Right Side) -->
                <div class="flex-1 p-4 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center gap-2 mb-3">
                            <div class="px-2 py-1 bg-${modeColor}-500/20 border border-${modeColor}-500/30 rounded text-xs text-${modeColor}-300 font-semibold">
                                <i class="fas ${modeIcon} mr-1"></i> ${mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </div>
                            <div class="px-2 py-1 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-300 font-semibold">
                                <i class="fas fa-exclamation-triangle mr-1"></i> Failed
                            </div>
                        </div>
                        
                        <p class="text-sm text-red-300 font-semibold mb-2">Error Message:</p>
                        <p class="text-sm text-gray-400 leading-relaxed">
                            ${errorMessage}
                        </p>
                    </div>
                    
                    <!-- Date & Time (Separated Below) -->
                    <div class="mt-4 pt-3 border-t border-white/10">
                        <div class="flex items-center justify-between text-xs text-gray-500">
                            <div class="flex items-center gap-1">
                                <i class="fas fa-clock"></i>
                                <span>${timestamp}</span>
                            </div>
                            <div class="flex items-center gap-1 text-gray-400">
                                <i class="fas fa-info-circle"></i>
                                <span>No credits charged</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Mobile: Vertical Layout -->
            <div class="md:hidden">
                <div class="relative bg-red-500/10 p-8 flex items-center justify-center">
                    <div class="text-center">
                        <svg class="w-12 h-12 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                        <p class="text-red-400 font-semibold text-sm">Generation failed</p>
                    </div>
                    <div class="absolute top-2 right-2">
                        <button onclick="handleDeleteCard(this)" 
                                class="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-semibold transition">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="px-2 py-1 bg-red-500/20 rounded text-xs text-red-300 font-semibold">
                            <i class="fas fa-exclamation-triangle mr-1"></i> Failed
                        </span>
                    </div>
                    <p class="text-xs text-gray-400 mb-2">${errorMessage}</p>
                    <div class="pt-2 border-t border-white/10 text-xs text-gray-500">
                        <i class="fas fa-clock mr-1"></i> ${timestamp}
                    </div>
                </div>
            </div>
        `;
        
        return card;
    }
    
    // Display failed result
    function displayFailedResult(errorMessage, mode, failedMetadata = null) {
        
        if (!resultDisplay) {
            console.error('❌ resultDisplay element not found!');
            return;
        }
        
        
        // Explicitly show result display
        resultDisplay.classList.remove('hidden');
        resultDisplay.style.display = 'block';
        
        // Update counter
        updateGenerationsCount();
        
        // Create failed card with metadata
        const failedCard = createFailedCard(errorMessage, mode, null, failedMetadata);
        
        // Set initial state for animation (same as success cards)
        failedCard.style.opacity = '0';
        failedCard.style.transform = 'translateY(-20px)';
        failedCard.setAttribute('data-new', 'true'); // Mark as new
        
        // Prepend to top (newest first)
        resultDisplay.insertBefore(failedCard, resultDisplay.firstChild);
        
        // Animate in (same timing as success cards)
        setTimeout(() => {
            failedCard.style.transition = 'all 0.4s ease-out';
            failedCard.style.opacity = '1';
            failedCard.style.transform = 'translateY(0)';
        }, 10);
        
        // Scroll to top to see new failed result
        if (resultScrollArea) {
            resultScrollArea.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
        
    }
    
    // Create video card
    function createVideoCard(video, generationId = null, metadata = null) {
        const card = document.createElement('div');
        card.className = 'result-card bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer';
        
        // Set data-mode for filtering
        card.setAttribute('data-mode', 'video');
        
        // Store generation ID and metadata
        if (generationId) {
            card.setAttribute('data-generation-id', generationId);
        }
        if (metadata) {
            card.setAttribute('data-metadata', JSON.stringify(metadata));
        }
        
        // Extract metadata for display
        const prompt = metadata?.prompt || 'No prompt provided';
        const modelName = cleanModelName(metadata?.settings?.model) || 'Unknown model';
        const duration = metadata?.settings?.duration || video.duration || 5;
        // Fix decimal handling: ensure proper parsing and rounding
        const creditsUsed = metadata?.creditsCost ? 
            parseFloat(parseFloat(metadata.creditsCost).toFixed(2)) : 0;
        
        // Use aspect ratio from settings (what user selected), fallback to calculated
        const actualAspectRatio = metadata?.settings?.aspectRatio || 
                                  metadata?.settings?.aspect_ratio ||
                                  calculateAspectRatio(video.width, video.height);
        
        // Add click handler for detail view
        card.addEventListener('click', (e) => {
            // Don't open modal if clicking delete or download button
            if (e.target.closest('button')) return;
            openGenerationDetailModal(card);
        });
        
        const timestamp = new Date().toLocaleString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        card.innerHTML = `
            <!-- Desktop: Horizontal Layout -->
            <div class="hidden md:flex md:flex-row gap-4">
                <!-- Video Preview (Left Side) -->
                <div class="relative w-96 h-64 flex-shrink-0 bg-black">
                    <video src="${video.url}" controls class="w-full h-full object-cover">
                        Your browser does not support the video tag.
                    </video>
                    <div class="absolute top-2 right-2 flex gap-1.5">
                        <button class="btn-fullscreen px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
                                data-url="${video.url}" data-prompt="${prompt.replace(/"/g, '&quot;')}" data-model="${modelName.replace(/"/g, '&quot;')}" 
                                title="View Fullscreen">
                            <i class="fas fa-expand"></i>
                        </button>
                        <button onclick="openShareModal(this)" 
                                class="btn-share px-2 py-1 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
                                title="Share to Public Gallery">
                            <i class="fas fa-share-alt"></i>
                        </button>
                        <button onclick="downloadFile('${video.url}', 'video-${Date.now()}.mp4')" 
                                class="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-lg">
                            <i class="fas fa-download"></i>
                        </button>
                        <button onclick="handleDeleteCard(this)" 
                                class="px-2 py-1 bg-red-600/80 hover:bg-red-700 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
                                title="Delete this result">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="absolute bottom-2 left-2 flex gap-2">
                        <div class="px-2 py-1 bg-black/70 backdrop-blur-sm rounded-md text-xs text-white flex items-center gap-2">
                            <i class="fas fa-video"></i>
                            <span>${duration}s</span>
                            <span class="text-gray-300">•</span>
                            <span class="text-blue-300">${actualAspectRatio}</span>
                        </div>
                        <div class="shared-badge hidden px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-sm rounded-md text-xs text-emerald-300 flex items-center gap-1">
                            <i class="fas fa-check-circle"></i>
                            <span>Dibagikan</span>
                        </div>
                    </div>
                </div>
                
                <!-- Content (Right Side) -->
                <div class="flex-1 p-4 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center gap-2 mb-3">
                            <div class="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-300 font-semibold">
                                <i class="fas fa-video mr-1"></i> Video
                            </div>
                            <div class="text-xs text-gray-400">
                                ${video.width} × ${video.height}
                            </div>
                            <div class="text-xs text-gray-400">
                                • ${duration}s
                            </div>
                            <div class="text-xs text-blue-300">
                                ${actualAspectRatio}
                            </div>
                        </div>
                        
                        <p class="text-sm text-gray-300 leading-relaxed line-clamp-3 mb-2">
                            ${prompt}
                        </p>
                        <p class="text-xs text-gray-500">
                            <i class="fas fa-robot mr-1"></i> ${modelName}
                        </p>
                    </div>
                    
                    <!-- Date & Time (Separated Below) -->
                    <div class="mt-4 pt-3 border-t border-white/10">
                        <div class="flex items-center justify-between text-xs text-gray-500">
                            <div class="flex items-center gap-1">
                                <i class="fas fa-clock"></i>
                                <span>${timestamp}</span>
                            </div>
                            <div class="flex items-center gap-1 text-yellow-400">
                                <i class="fas fa-coins"></i>
                                <span>${creditsUsed.toFixed(1)} credits</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Mobile: Vertical Layout -->
            <div class="md:hidden">
                <div class="relative bg-black flex items-center justify-center" style="max-height: 60vh;">
                    <video src="${video.url}" controls class="w-auto h-auto" style="max-height: 60vh; max-width: 100%; object-fit: contain;">
                        Your browser does not support the video tag.
                    </video>
                    <div class="absolute top-2 right-2 flex gap-1">
                        <button class="btn-fullscreen px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-semibold transition"
                                data-url="${video.url}" data-prompt="${prompt.replace(/"/g, '&quot;')}" data-model="${modelName.replace(/"/g, '&quot;')}"
                                title="Fullscreen">
                            <i class="fas fa-expand"></i>
                        </button>
                        <button onclick="openShareModal(this)" 
                                class="btn-share px-2 py-1 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-semibold transition"
                                title="Share">
                            <i class="fas fa-share-alt"></i>
                        </button>
                        <button onclick="downloadFile('${video.url}', 'video-${Date.now()}.mp4')" 
                                class="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-semibold transition">
                            <i class="fas fa-download"></i>
                        </button>
                        <button onclick="handleDeleteCard(this)" 
                                class="px-2 py-1 bg-red-600/80 hover:bg-red-700 rounded-lg text-xs font-semibold transition"
                                title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="absolute bottom-2 left-2 flex gap-2">
                        <div class="px-2 py-1 bg-black/70 backdrop-blur-sm rounded-md text-xs text-white">
                            ${duration}s • ${actualAspectRatio}
                        </div>
                        <div class="shared-badge hidden px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-sm rounded-md text-xs text-emerald-300 flex items-center gap-1">
                            <i class="fas fa-check-circle"></i>
                            <span>Shared</span>
                        </div>
                    </div>
                </div>
                <div class="p-4">
                    <p class="text-sm text-gray-300 leading-relaxed line-clamp-2 mb-2">${prompt}</p>
                    <p class="text-xs text-gray-500 mb-2"><i class="fas fa-robot mr-1"></i> ${modelName}</p>
                    <p class="text-xs text-gray-400 mb-2">${video.width} × ${video.height} • ${duration}s • ${actualAspectRatio}</p>
                    <div class="pt-2 border-t border-white/10 flex items-center justify-between">
                        <span class="text-xs text-gray-500"><i class="fas fa-clock mr-1"></i> ${timestamp}</span>
                        <span class="text-xs text-yellow-400"><i class="fas fa-coins mr-1"></i> ${creditsUsed.toFixed(1)}</span>
                    </div>
                </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners for fullscreen buttons
        card.querySelectorAll('.btn-fullscreen').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = btn.getAttribute('data-url');
                const prompt = btn.getAttribute('data-prompt');
                const model = btn.getAttribute('data-model');
                openFullscreenViewer(url, 0, { prompt, model });
            });
        });
        
        // Initialize share button after card is created
        setTimeout(() => {
            const genId = card.getAttribute('data-generation-id');
            if (genId && typeof window.checkGenerationSharedStatus === 'function') {
                window.checkGenerationSharedStatus(genId);
            }
        }, 100);
        
        return card;
    }
    
    // Create audio card
    function createAudioCard(audio, generationId = null, metadata = null) {
        const card = document.createElement('div');
        card.className = 'result-card bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10';
        
        // Set data-mode for filtering
        card.setAttribute('data-mode', 'audio');
        
        // Store generation ID and metadata
        if (generationId) {
            card.setAttribute('data-generation-id', generationId);
        }
        if (metadata) {
            card.setAttribute('data-metadata', JSON.stringify(metadata));
        }
        
        const timestamp = new Date().toLocaleString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const audioTypeLabel = metadata?.subType || audio.type || 'Audio';
        
        // ✅ Fix: Read actual duration from Suno track metadata, not requested duration
        // Priority: 1. metadata.track.duration (actual from Suno), 2. audio.duration, 3. settings.duration (request), 4. default 5s
        let duration = 5; // default
        
        // Try various possible duration field names from Suno API
        if (metadata?.track?.duration) {
            duration = Math.round(parseFloat(metadata.track.duration));
        } else if (metadata?.track?.audio_length) {
            duration = Math.round(parseFloat(metadata.track.audio_length));
        } else if (metadata?.track?.length) {
            duration = Math.round(parseFloat(metadata.track.length));
        } else if (audio.duration) {
            duration = Math.round(parseFloat(audio.duration));
        } else if (metadata?.settings?.duration) {
            // Fallback to requested duration (may be inaccurate for Suno)
            duration = Math.round(parseFloat(metadata.settings.duration));
        }
        
        const prompt = metadata?.prompt || 'Generated audio';
        const modelName = cleanModelName(metadata?.settings?.model) || 'Unknown model';
        // Fix decimal handling: ensure proper parsing and rounding
        const creditsUsed = metadata?.creditsCost ? 
            parseFloat(parseFloat(metadata.creditsCost).toFixed(2)) : 0;
        
        // Check if this is a Suno track with multiple outputs
        const trackIndex = metadata?.track_index;
        const totalTracks = metadata?.total_tracks;
        const isSunoMultiTrack = trackIndex && totalTracks && totalTracks > 1;
        
        // Truncate prompt for display (max 150 characters)
        const truncatedPrompt = prompt.length > 150 ? prompt.substring(0, 150) + '...' : prompt;
        const needsReadMore = prompt.length > 150;
        
        card.innerHTML = `
            <!-- Desktop: Horizontal Layout -->
            <div class="hidden md:flex md:flex-row gap-4">
                <!-- Audio Player (Left Side) -->
                <div class="relative w-64 h-64 flex-shrink-0 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 flex items-center justify-center">
                    <div class="text-center w-full px-4">
                        <div class="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-music text-cyan-400 text-3xl"></i>
                        </div>
                        <audio controls class="w-full">
                            <source src="${audio.url}" type="audio/mpeg">
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                    <div class="absolute top-2 right-2 flex gap-2">
                        <button onclick="downloadFile('${audio.url}', 'audio-${Date.now()}.mp3')" 
                                class="px-2 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-lg">
                            <i class="fas fa-download"></i>
                        </button>
                        <button onclick="handleDeleteCard(this)" 
                                class="px-2 py-1.5 bg-red-600/80 hover:bg-red-700 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
                                title="Delete this result">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded text-xs text-white flex items-center gap-1">
                        <i class="fas fa-clock text-xs"></i>
                        <span>${duration}s</span>
                    </div>
                </div>
                
                <!-- Content (Right Side) -->
                <div class="flex-1 p-4 flex flex-col justify-between">
                    <div>
                        <div class="flex flex-wrap items-center gap-1.5 mb-3">
                            <span class="px-1.5 py-0.5 bg-cyan-500/20 border border-cyan-500/30 rounded text-xs text-cyan-300 font-medium inline-flex items-center gap-1">
                                <i class="fas fa-music text-xs"></i> ${audioTypeLabel}
                            </span>
                            ${isSunoMultiTrack ? `
                            <span class="px-1.5 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-300 font-medium inline-flex items-center gap-1">
                                <i class="fas fa-list text-xs"></i> Track ${trackIndex}/${totalTracks}
                            </span>
                            ` : ''}
                            <span class="px-1.5 py-0.5 bg-gray-700/30 border border-gray-600/30 rounded text-xs text-gray-300 inline-flex items-center gap-1">
                                <i class="fas fa-clock text-xs"></i> ${duration}s
                            </span>
                            <span class="px-1.5 py-0.5 bg-gray-700/30 border border-gray-600/30 rounded text-xs text-gray-400 truncate max-w-xs" title="${modelName}">
                                <i class="fas fa-robot text-xs"></i> ${modelName}
                            </span>
                        </div>
                        
                        <p class="text-sm text-gray-300 leading-relaxed mb-2">
                            ${truncatedPrompt}
                        </p>
                        ${needsReadMore ? `
                        <button onclick="openAudioDetailModal(this)" 
                                class="text-xs text-cyan-400 hover:text-cyan-300 transition inline-flex items-center gap-1">
                            <span>Read more</span>
                            <i class="fas fa-chevron-right text-xs"></i>
                        </button>
                        ` : ''}
                    </div>
                    
                    <!-- Date & Time (Separated Below) -->
                    <div class="mt-4 pt-3 border-t border-white/10">
                        <div class="flex items-center justify-between text-xs text-gray-500">
                            <div class="flex items-center gap-1">
                                <i class="fas fa-calendar-alt text-xs"></i>
                                <span>${timestamp}</span>
                            </div>
                            <div class="flex items-center gap-1 text-yellow-400">
                                <i class="fas fa-coins text-xs"></i>
                                <span>${creditsUsed.toFixed(2)} credits</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Mobile: Vertical Layout -->
            <div class="md:hidden">
                <div class="relative bg-gradient-to-br from-cyan-900/20 to-blue-900/20 p-6 flex items-center justify-center">
                    <div class="text-center w-full">
                        <div class="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fas fa-music text-cyan-400 text-2xl"></i>
                        </div>
                        <audio controls class="w-full">
                            <source src="${audio.url}" type="audio/mpeg">
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                    <div class="absolute top-2 right-2 flex gap-2">
                        <button onclick="downloadFile('${audio.url}', 'audio-${Date.now()}.mp3')" 
                                class="px-2 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-xs font-semibold transition">
                            <i class="fas fa-download"></i>
                        </button>
                        <button onclick="handleDeleteCard(this)" 
                                class="px-2 py-1.5 bg-red-600/80 hover:bg-red-700 rounded-lg text-xs font-semibold transition"
                                title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="p-4">
                    <div class="flex flex-wrap items-center gap-1.5 mb-2">
                        <span class="px-1.5 py-0.5 bg-cyan-500/20 rounded text-xs text-cyan-300 font-medium">
                            <i class="fas fa-music text-xs"></i> ${audioTypeLabel}
                        </span>
                        ${isSunoMultiTrack ? `
                        <span class="px-1.5 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-300 font-medium inline-flex items-center gap-1">
                            <i class="fas fa-list text-xs"></i> Track ${trackIndex}/${totalTracks}
                        </span>
                        ` : ''}
                        <span class="px-1.5 py-0.5 bg-gray-700/30 rounded text-xs text-gray-300">
                            <i class="fas fa-clock text-xs"></i> ${duration}s
                        </span>
                    </div>
                    <p class="text-xs text-gray-400 mb-2">${truncatedPrompt}</p>
                    ${needsReadMore ? `
                    <button onclick="openAudioDetailModal(this)" 
                            class="text-xs text-cyan-400 hover:text-cyan-300 transition mb-2 inline-flex items-center gap-1">
                        <span>Read more</span>
                        <i class="fas fa-chevron-right text-xs"></i>
                    </button>
                    ` : ''}
                    <div class="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
                        <span><i class="fas fa-calendar-alt mr-1 text-xs"></i> ${timestamp}</span>
                        <span class="text-yellow-400"><i class="fas fa-coins mr-1 text-xs"></i> ${creditsUsed.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
        return card;
    }
    
    // Create 3D model card
    function create3DCard(model, generationId = null, metadata = null) {
        const card = document.createElement('div');
        card.className = 'bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-pink-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/10 cursor-pointer';
        
        // Store generation ID and metadata
        if (generationId) {
            card.setAttribute('data-generation-id', generationId);
        }
        if (metadata) {
            card.setAttribute('data-metadata', JSON.stringify(metadata));
        }
        
        // Extract metadata for display
        const prompt = metadata?.prompt || 'Generated 3D model';
        const modelName = cleanModelName(metadata?.settings?.model) || 'Unknown model';
        // Fix decimal handling: ensure proper parsing and rounding
        const creditsUsed = metadata?.creditsCost ? 
            parseFloat(parseFloat(metadata.creditsCost).toFixed(2)) : 0;
        const modelFormat = model.format || (model.url?.split('.').pop() || 'glb').toUpperCase();
        const modelSize = model.size_mb ? `${model.size_mb.toFixed(2)} MB` : 'Unknown size';
        
        // Add click handler for detail view
        card.addEventListener('click', (e) => {
            // Don't open modal if clicking delete or download button
            if (e.target.closest('button')) return;
            open3DDetailModal(card);
        });
        
        const timestamp = new Date().toLocaleString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Truncate prompt for card view
        const maxLength = 150;
        const truncatedPrompt = prompt.length > maxLength ? prompt.substring(0, maxLength) + '...' : prompt;
        const needsReadMore = prompt.length > maxLength;
        
        card.innerHTML = `
            <!-- Desktop: Horizontal Layout -->
            <div class="hidden md:flex md:flex-row gap-4">
                <!-- 3D Model Preview (Left Side) -->
                <div class="relative w-96 h-64 flex-shrink-0 bg-black">
                    <model-viewer 
                        src="${model.url}" 
                        alt="Generated 3D Model" 
                        auto-rotate 
                        camera-controls
                        shadow-intensity="1"
                        class="w-full h-full"
                        style="background-color: #000; --poster-color: transparent;">
                    </model-viewer>
                    <div class="absolute top-2 right-2 flex gap-1.5">
                        <button class="btn-fullscreen-3d px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
                                data-url="${model.url}" data-prompt="${prompt.replace(/"/g, '&quot;')}" data-model="${modelName.replace(/"/g, '&quot;')}" 
                                title="View Fullscreen">
                            <i class="fas fa-expand"></i>
                        </button>
                        <button onclick="downloadFile('${model.url}', 'model-${Date.now()}.${modelFormat.toLowerCase()}')" 
                                class="px-2 py-1 bg-pink-600 hover:bg-pink-700 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-lg">
                            <i class="fas fa-download"></i>
                        </button>
                        <button onclick="handleDeleteCard(this)" 
                                class="px-2 py-1 bg-red-600/80 hover:bg-red-700 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
                                title="Delete this result">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="absolute bottom-2 left-2 flex gap-2">
                        <div class="px-2 py-1 bg-black/70 backdrop-blur-sm rounded-md text-xs text-white flex items-center gap-2">
                            <i class="fas fa-cube"></i>
                            <span>3D Model</span>
                            <span class="text-gray-300">•</span>
                            <span class="text-pink-300">${modelFormat}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Content (Right Side) -->
                <div class="flex-1 p-4 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center gap-2 mb-3">
                            <div class="px-2 py-1 bg-pink-500/20 border border-pink-500/30 rounded text-xs text-pink-300 font-semibold">
                                <i class="fas fa-cube mr-1"></i> 3D Model
                            </div>
                            <div class="text-xs text-gray-400">
                                ${modelFormat}
                            </div>
                            <div class="text-xs text-pink-300">
                                ${modelSize}
                            </div>
                        </div>
                        
                        <p class="text-sm text-gray-300 leading-relaxed line-clamp-3 mb-2">
                            ${prompt}
                        </p>
                        <p class="text-xs text-gray-500">
                            <i class="fas fa-robot mr-1"></i> ${modelName}
                        </p>
                    </div>
                    
                    <div class="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                        <span class="text-gray-500">
                            <i class="fas fa-calendar-alt mr-1"></i> ${timestamp}
                        </span>
                        <span class="text-yellow-400 font-semibold">
                            <i class="fas fa-coins mr-1"></i> ${creditsUsed.toFixed(2)} credits
                        </span>
                    </div>
                </div>
            </div>
            
            <!-- Mobile: Vertical Layout -->
            <div class="md:hidden">
                <div class="relative bg-gradient-to-br from-blue-900/20 to-cyan-900/20 p-6 flex items-center justify-center" style="height: 250px;">
                    <model-viewer 
                        src="${model.url}" 
                        alt="Generated 3D Model" 
                        auto-rotate 
                        camera-controls
                        shadow-intensity="1"
                        class="w-full h-full"
                        style="background-color: transparent; --poster-color: transparent;">
                    </model-viewer>
                    <div class="absolute top-2 right-2 flex gap-2">
                        <button onclick="downloadFile('${model.url}', 'model-${Date.now()}.${modelFormat.toLowerCase()}')" 
                                class="px-2 py-1.5 bg-pink-600 hover:bg-pink-700 rounded-lg text-xs font-semibold transition">
                            <i class="fas fa-download"></i>
                        </button>
                        <button onclick="handleDeleteCard(this)" 
                                class="px-2 py-1.5 bg-red-600/80 hover:bg-red-700 rounded-lg text-xs font-semibold transition"
                                title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="p-4">
                    <div class="flex flex-wrap items-center gap-1.5 mb-2">
                        <span class="px-1.5 py-0.5 bg-pink-500/20 rounded text-xs text-pink-300 font-medium">
                            <i class="fas fa-cube text-xs"></i> 3D Model
                        </span>
                        <span class="px-1.5 py-0.5 bg-gray-700/30 rounded text-xs text-gray-300">
                            ${modelFormat}
                        </span>
                        <span class="px-1.5 py-0.5 bg-gray-700/30 rounded text-xs text-gray-300">
                            ${modelSize}
                        </span>
                    </div>
                    <p class="text-xs text-gray-400 mb-2">${truncatedPrompt}</p>
                    ${needsReadMore ? `
                    <button onclick="open3DDetailModal(this)" 
                            class="text-xs text-pink-400 hover:text-pink-300 transition mb-2 inline-flex items-center gap-1">
                        <span>Read more</span>
                        <i class="fas fa-chevron-right text-xs"></i>
                    </button>
                    ` : ''}
                    <div class="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
                        <span><i class="fas fa-calendar-alt mr-1 text-xs"></i> ${timestamp}</span>
                        <span class="text-yellow-400"><i class="fas fa-coins mr-1 text-xs"></i> ${creditsUsed.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
        return card;
    }
    
    // Create text/JSON output card
    function createTextOutputCard(textData, generationId = null, metadata = null) {
        const card = document.createElement('div');
        card.className = 'bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-green-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10 cursor-pointer';
        
        // Store generation ID and metadata
        if (generationId) {
            card.setAttribute('data-generation-id', generationId);
        }
        if (metadata) {
            card.setAttribute('data-metadata', JSON.stringify(metadata));
        }
        
        // Extract metadata for display
        const prompt = metadata?.prompt || 'Text generation';
        const modelName = metadata?.settings?.model || 'Unknown model';
        const creditsUsed = metadata?.creditsCost || 0;
        
        // Handle text or JSON output
        let displayText = '';
        let outputType = 'Text';
        
        if (typeof textData === 'string') {
            displayText = textData;
            outputType = 'Text';
        } else if (typeof textData === 'object') {
            displayText = JSON.stringify(textData, null, 2);
            outputType = 'JSON';
        } else if (textData.text) {
            displayText = textData.text;
            outputType = 'Text';
        } else if (textData.output) {
            displayText = typeof textData.output === 'object' 
                ? JSON.stringify(textData.output, null, 2) 
                : textData.output;
            outputType = textData.output_type || 'Text';
        }
        
        // Add click handler for detail view
        card.addEventListener('click', (e) => {
            // Don't open modal if clicking delete or copy button
            if (e.target.closest('button')) return;
            openTextDetailModal(card);
        });
        
        const timestamp = new Date().toLocaleString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Truncate text for card view
        const maxLength = 300;
        const truncatedText = displayText.length > maxLength ? displayText.substring(0, maxLength) + '...' : displayText;
        const needsReadMore = displayText.length > maxLength;
        const charCount = displayText.length;
        
        card.innerHTML = `
            <!-- Desktop: Full Width Layout -->
            <div class="hidden md:block">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                                <i class="fas fa-file-alt text-green-400 text-lg"></i>
                            </div>
                            <div>
                                <div class="flex items-center gap-2 mb-1">
                                    <div class="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-300 font-semibold">
                                        <i class="fas fa-file-alt mr-1"></i> ${outputType} Output
                                    </div>
                                    <div class="text-xs text-gray-400">
                                        ${charCount.toLocaleString()} characters
                                    </div>
                                </div>
                                <p class="text-xs text-gray-500">
                                    <i class="fas fa-robot mr-1"></i> ${modelName}
                                </p>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="copyTextToClipboard(this)" 
                                    class="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
                                    title="Copy to clipboard">
                                <i class="fas fa-copy mr-1"></i> Copy
                            </button>
                            <button onclick="downloadTextFile(this, '${outputType.toLowerCase()}')" 
                                    class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-lg">
                                <i class="fas fa-download mr-1"></i> Download
                            </button>
                            <button onclick="handleDeleteCard(this)" 
                                    class="px-3 py-1.5 bg-red-600/80 hover:bg-red-700 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
                                    title="Delete this result">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Prompt -->
                    <div class="mb-3 pb-3 border-b border-white/5">
                        <p class="text-xs text-gray-500 mb-1">Prompt:</p>
                        <p class="text-sm text-gray-300 leading-relaxed">${prompt}</p>
                    </div>
                    
                    <!-- Output Text -->
                    <div class="bg-black/30 rounded-lg p-4 border border-white/5">
                        <pre class="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto max-h-48 overflow-y-auto custom-scrollbar">${truncatedText}</pre>
                        ${needsReadMore ? `
                        <button onclick="openTextDetailModal(this)" 
                                class="mt-3 text-xs text-green-400 hover:text-green-300 transition inline-flex items-center gap-1">
                            <span>View full output</span>
                            <i class="fas fa-chevron-right text-xs"></i>
                        </button>
                        ` : ''}
                    </div>
                    
                    <div class="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-xs">
                        <span class="text-gray-500">
                            <i class="fas fa-calendar-alt mr-1"></i> ${timestamp}
                        </span>
                        <span class="text-yellow-400 font-semibold">
                            <i class="fas fa-coins mr-1"></i> ${creditsUsed.toFixed(2)} credits
                        </span>
                    </div>
                </div>
            </div>
            
            <!-- Mobile: Vertical Layout -->
            <div class="md:hidden">
                <div class="p-4">
                    <div class="flex items-center gap-2 mb-3">
                        <div class="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <i class="fas fa-file-alt text-green-400"></i>
                        </div>
                        <div class="flex-1">
                            <div class="px-1.5 py-0.5 bg-green-500/20 rounded text-xs text-green-300 font-medium inline-block">
                                <i class="fas fa-file-alt text-xs"></i> ${outputType}
                            </div>
                            <p class="text-xs text-gray-500 mt-1">${charCount.toLocaleString()} chars</p>
                        </div>
                        <div class="flex gap-1">
                            <button onclick="copyTextToClipboard(this)" 
                                    class="px-2 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-semibold transition">
                                <i class="fas fa-copy"></i>
                            </button>
                            <button onclick="downloadTextFile(this, '${outputType.toLowerCase()}')" 
                                    class="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-semibold transition">
                                <i class="fas fa-download"></i>
                            </button>
                            <button onclick="handleDeleteCard(this)" 
                                    class="px-2 py-1.5 bg-red-600/80 hover:bg-red-700 rounded-lg text-xs font-semibold transition"
                                    title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="bg-black/30 rounded-lg p-3 border border-white/5 mb-3">
                        <pre class="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto max-h-32 overflow-y-auto custom-scrollbar">${truncatedText}</pre>
                        ${needsReadMore ? `
                        <button onclick="openTextDetailModal(this)" 
                                class="mt-2 text-xs text-green-400 hover:text-green-300 transition inline-flex items-center gap-1">
                            <span>View full</span>
                            <i class="fas fa-chevron-right text-xs"></i>
                        </button>
                        ` : ''}
                    </div>
                    
                    <div class="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
                        <span><i class="fas fa-calendar-alt mr-1 text-xs"></i> ${timestamp}</span>
                        <span class="text-yellow-400"><i class="fas fa-coins mr-1 text-xs"></i> ${creditsUsed.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
        
        return card;
    }
    
    // Open audio detail modal
    function openAudioDetailModal(button) {
        const card = button.closest('[data-metadata]');
        if (!card) return;
        
        const metadata = JSON.parse(card.getAttribute('data-metadata'));
        const prompt = metadata?.prompt || 'Generated audio';
        const modelName = cleanModelName(metadata?.settings?.model) || 'Unknown model';
        const duration = metadata?.settings?.duration || 5;
        const creditsUsed = parseFloat(metadata?.creditsCost) || 0;
        const timestamp = metadata?.createdAt ? new Date(metadata?.createdAt).toLocaleString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'N/A';
        
        // Get additional settings if available
        const settings = metadata?.settings || {};
        const settingsHTML = Object.entries(settings)
            .filter(([key]) => !['model', 'duration'].includes(key))
            .map(([key, value]) => `
                <div class="flex justify-between py-2 border-b border-white/5">
                    <span class="text-gray-400 text-sm capitalize">${key.replace(/_/g, ' ')}:</span>
                    <span class="text-gray-200 text-sm font-medium">${typeof value === 'object' ? JSON.stringify(value) : value}</span>
                </div>
            `).join('');
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn';
        modal.innerHTML = `
            <div class="bg-gradient-to-br from-zinc-900 to-black rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl animate-scaleIn">
                <!-- Header -->
                <div class="sticky top-0 bg-gradient-to-r from-cyan-900/90 to-blue-900/90 backdrop-blur-md p-6 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h3 class="text-xl font-bold text-white mb-1 flex items-center gap-2">
                            <i class="fas fa-music text-cyan-400"></i>
                            Audio Generation Details
                        </h3>
                        <p class="text-sm text-gray-300">Complete metadata and settings</p>
                    </div>
                    <button onclick="this.closest('.fixed').remove()" 
                            class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center text-white">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <!-- Content -->
                <div class="p-6 space-y-6">
                    <!-- Prompt Section -->
                    <div class="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 rounded-xl p-5 border border-white/10">
                        <h4 class="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                            <i class="fas fa-pen-fancy"></i> Prompt
                        </h4>
                        <p class="text-gray-200 leading-relaxed whitespace-pre-wrap">${prompt}</p>
                    </div>
                    
                    <!-- Metadata Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Model Info -->
                        <div class="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 rounded-xl p-5 border border-white/10">
                            <h4 class="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                                <i class="fas fa-robot"></i> Model
                            </h4>
                            <p class="text-gray-200 font-mono text-sm break-all">${modelName}</p>
                        </div>
                        
                        <!-- Duration -->
                        <div class="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 rounded-xl p-5 border border-white/10">
                            <h4 class="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                                <i class="fas fa-clock"></i> Duration
                            </h4>
                            <p class="text-gray-200 font-semibold">${duration} seconds</p>
                        </div>
                        
                        <!-- Credits -->
                        <div class="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 rounded-xl p-5 border border-white/10">
                            <h4 class="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                                <i class="fas fa-coins"></i> Credits Used
                            </h4>
                            <p class="text-yellow-400 font-bold text-lg">${creditsUsed.toFixed(2)}</p>
                        </div>
                        
                        <!-- Timestamp -->
                        <div class="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 rounded-xl p-5 border border-white/10">
                            <h4 class="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                                <i class="fas fa-calendar-alt"></i> Generated At
                            </h4>
                            <p class="text-gray-200 text-sm">${timestamp}</p>
                        </div>
                    </div>
                    
                    <!-- Additional Settings (if any) -->
                    ${settingsHTML ? `
                    <div class="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 rounded-xl p-5 border border-white/10">
                        <h4 class="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                            <i class="fas fa-cog"></i> Additional Settings
                        </h4>
                        <div class="space-y-1">
                            ${settingsHTML}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Add click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        document.body.appendChild(modal);
    }
    
    // Update credits display
    function updateCreditsDisplay(newCredits) {
        const credits = parseFloat(newCredits);
        const formattedCredits = credits.toFixed(1);
        
        const creditsElements = document.querySelectorAll('[data-credits-display]');
        creditsElements.forEach(el => {
            el.textContent = formattedCredits;
        });
        
        // Also update the main credits badge
        const mainCredits = document.querySelector('.text-yellow-400.font-mono');
        if (mainCredits) {
            mainCredits.textContent = formattedCredits;
        }
        
    }
    
    // ✨ Translate error messages to user-friendly Bahasa Indonesia
    function translateErrorMessage(errorMessage) {
        const errorMap = {
            // Insufficient credits
            'insufficient credits': {
                pattern: /insufficient credits.*need ([\d.]+).*have ([\d.]+)/i,
                translate: (match) => `💳 Kredit tidak cukup! Anda membutuhkan ${match[1]} kredit, tetapi hanya memiliki ${match[2]} kredit. Silakan isi ulang kredit Anda.`
            },
            // Timeout errors
            'timeout': {
                pattern: /(image|video|music|tts|audio).*timeout.*(\d+)\s*detik/i,
                translate: (match) => {
                    const types = { image: 'Gambar', video: 'Video', music: 'Musik', tts: 'Suara', audio: 'Audio' };
                    return `⏱️ Waktu habis! Proses ${types[match[1]] || 'generasi'} melebihi batas waktu ${match[2]} detik. Model mungkin sedang sibuk, coba lagi.`;
                }
            },
            // Validation errors
            'validation': {
                pattern: /invalid parameters|validation/i,
                translate: () => `⚠️ Parameter tidak valid! Silakan periksa pengaturan Anda dan coba lagi.`
            },
            // Model not found
            'model not found': {
                pattern: /model not found|invalid model/i,
                translate: () => `❌ Model AI tidak ditemukan! Silakan pilih model yang berbeda.`
            },
            // User not found
            'user not found': {
                pattern: /user not found/i,
                translate: () => `❌ Sesi Anda telah berakhir. Silakan login kembali.`
            },
            // FAL.AI API errors
            'fal.ai': {
                pattern: /fal\.ai.*tidak merespons|fal\.ai.*error/i,
                translate: () => `🔌 Tidak dapat terhubung ke layanan AI. Silakan coba lagi dalam beberapa saat.`
            },
            // Network errors
            'network': {
                pattern: /network error|fetch failed|connection/i,
                translate: () => `🌐 Koneksi internet bermasalah! Periksa koneksi Anda dan coba lagi.`
            }
        };
        
        // Try to match and translate
        for (const [key, config] of Object.entries(errorMap)) {
            const match = errorMessage.match(config.pattern);
            if (match) {
                return config.translate(match);
            }
        }
        
        // Default: Clean up technical error message
        if (errorMessage.length > 100) {
            return `❌ Terjadi kesalahan: ${errorMessage.substring(0, 97)}...`;
        }
        
        return `❌ ${errorMessage}`;
    }
    
    // Show notification (improved)
    function showNotification(message, type = 'info') {
        // ✨ Translate error messages
        if (type === 'error') {
            message = translateErrorMessage(message);
        }
        
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            info: '<i class="fas fa-info-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>'
        };
        
        const notification = document.createElement('div');
        notification.className = `notification-toast ${type}`;
        notification.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="text-xl">${icons[type]}</div>
                <div class="flex-1">
                    <p class="font-semibold text-sm">${message}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="text-current opacity-70 hover:opacity-100 transition">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
    
    // Check user credits on load
    async function checkUserCredits() {
        try {
            const response = await fetch('/api/generate/credits');
            const data = await response.json();
            
            if (data.success && data.credits !== undefined) {
                const credits = parseFloat(data.credits);
                updateCreditsDisplay(credits);
                
                
                // Warn if low credits
                if (credits < 5) {
                    showNotification(`Low credits: ${credits.toFixed(1)} remaining`, 'warning');
                }
            }
        } catch (error) {
            console.error('Error checking credits:', error);
        }
    }
    
    // Image type change listener
    const imageTypeSelect = document.getElementById('image-type');
    if (imageTypeSelect) {
        imageTypeSelect.addEventListener('change', function() {
            calculateCreditCost();
        });
    }
    
    // Video type change listener
    const videoTypeSelect = document.getElementById('video-type');
    if (videoTypeSelect) {
        videoTypeSelect.addEventListener('change', function() {
            calculateCreditCost();
        });
    }
    
    // ========================================
    // Helper Functions for 3D and Text Outputs
    // ========================================
    
    // Open 3D detail modal
    window.open3DDetailModal = function(cardOrButton) {
        const card = cardOrButton.closest ? cardOrButton.closest('[data-metadata]') : cardOrButton;
        if (!card) return;
        
        const metadata = JSON.parse(card.getAttribute('data-metadata'));
        const modelViewer = card.querySelector('model-viewer');
        const modelUrl = modelViewer ? modelViewer.getAttribute('src') : '';
        const prompt = metadata?.prompt || 'Generated 3D model';
        const modelName = cleanModelName(metadata?.settings?.model) || 'Unknown model';
        const creditsUsed = parseFloat(metadata?.creditsCost) || 0;
        const timestamp = metadata?.createdAt ? new Date(metadata?.createdAt).toLocaleString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'N/A';
        
        // Get additional settings
        const settings = metadata?.settings || {};
        const settingsHTML = Object.entries(settings)
            .filter(([key]) => !['model'].includes(key))
            .map(([key, value]) => `
                <div class="flex justify-between py-2 border-b border-white/5">
                    <span class="text-gray-400 text-sm capitalize">${key.replace(/_/g, ' ')}:</span>
                    <span class="text-gray-200 text-sm font-medium">${typeof value === 'object' ? JSON.stringify(value) : value}</span>
                </div>
            `).join('');
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn';
        modal.innerHTML = `
            <div class="bg-gradient-to-br from-zinc-900 to-black rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl animate-scaleIn">
                <!-- Header -->
                <div class="sticky top-0 bg-gradient-to-r from-blue-900/90 to-cyan-900/90 backdrop-blur-md p-6 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h3 class="text-xl font-bold text-white mb-1 flex items-center gap-2">
                            <i class="fas fa-cube text-pink-400"></i>
                            3D Model Details
                        </h3>
                        <p class="text-sm text-gray-300">Complete metadata and interactive viewer</p>
                    </div>
                    <button onclick="this.closest('.fixed').remove()" 
                            class="w-10 h-10 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg flex items-center justify-center transition">
                        <i class="fas fa-times text-red-400"></i>
                    </button>
                </div>
                
                <!-- Content -->
                <div class="p-6 space-y-6">
                    <!-- 3D Model Viewer -->
                    <div class="bg-black rounded-xl overflow-hidden border border-white/10" style="height: 400px;">
                        <model-viewer 
                            src="${modelUrl}" 
                            alt="3D Model" 
                            auto-rotate 
                            camera-controls
                            shadow-intensity="1"
                            class="w-full h-full"
                            style="background-color: #000;">
                        </model-viewer>
                    </div>
                    
                    <!-- Prompt Section -->
                    <div class="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-xl p-4 border border-blue-500/20">
                        <h4 class="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
                            <i class="fas fa-comment-dots"></i>
                            Prompt
                        </h4>
                        <p class="text-gray-300 text-sm leading-relaxed">${prompt}</p>
                    </div>
                    
                    <!-- Metadata Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-zinc-800/50 rounded-xl p-4 border border-white/5">
                            <p class="text-xs text-gray-500 mb-1">Model</p>
                            <p class="text-white font-semibold">${modelName}</p>
                        </div>
                        <div class="bg-zinc-800/50 rounded-xl p-4 border border-white/5">
                            <p class="text-xs text-gray-500 mb-1">Credits Used</p>
                            <p class="text-yellow-400 font-semibold">${creditsUsed.toFixed(2)} credits</p>
                        </div>
                        <div class="bg-zinc-800/50 rounded-xl p-4 border border-white/5 md:col-span-2">
                            <p class="text-xs text-gray-500 mb-1">Generated At</p>
                            <p class="text-white font-semibold">${timestamp}</p>
                        </div>
                    </div>
                    
                    ${settingsHTML ? `
                    <!-- Settings -->
                    <div class="bg-zinc-800/50 rounded-xl p-4 border border-white/5">
                        <h4 class="text-sm font-semibold text-gray-300 mb-3">Generation Settings</h4>
                        <div class="space-y-1">
                            ${settingsHTML}
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <!-- Footer Actions -->
                <div class="sticky bottom-0 bg-zinc-900/90 backdrop-blur-md p-4 border-t border-white/10 flex gap-3">
                    <button onclick="downloadFile('${modelUrl}', 'model-${Date.now()}.glb')" 
                            class="flex-1 px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg font-semibold transition flex items-center justify-center gap-2">
                        <i class="fas fa-download"></i>
                        Download Model
                    </button>
                    <button onclick="this.closest('.fixed').remove()" 
                            class="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-semibold transition">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    };
    
    // Open text detail modal
    window.openTextDetailModal = function(cardOrButton) {
        const card = cardOrButton.closest ? cardOrButton.closest('[data-metadata]') : cardOrButton;
        if (!card) return;
        
        const metadata = JSON.parse(card.getAttribute('data-metadata'));
        const textElement = card.querySelector('pre');
        const fullText = textElement ? textElement.textContent : '';
        const prompt = metadata?.prompt || 'Text generation';
        const modelName = metadata?.settings?.model || 'Unknown model';
        const creditsUsed = metadata?.creditsCost || 0;
        const timestamp = metadata?.createdAt ? new Date(metadata?.createdAt).toLocaleString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'N/A';
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn';
        modal.innerHTML = `
            <div class="bg-gradient-to-br from-zinc-900 to-black rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl animate-scaleIn">
                <!-- Header -->
                <div class="sticky top-0 bg-gradient-to-r from-green-900/90 to-emerald-900/90 backdrop-blur-md p-6 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h3 class="text-xl font-bold text-white mb-1 flex items-center gap-2">
                            <i class="fas fa-file-alt text-green-400"></i>
                            Full Text Output
                        </h3>
                        <p class="text-sm text-gray-300">${fullText.length.toLocaleString()} characters</p>
                    </div>
                    <button onclick="this.closest('.fixed').remove()" 
                            class="w-10 h-10 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg flex items-center justify-center transition">
                        <i class="fas fa-times text-red-400"></i>
                    </button>
                </div>
                
                <!-- Content -->
                <div class="p-6 space-y-6">
                    <!-- Prompt -->
                    <div class="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl p-4 border border-green-500/20">
                        <h4 class="text-sm font-semibold text-green-300 mb-2 flex items-center gap-2">
                            <i class="fas fa-comment-dots"></i>
                            Prompt
                        </h4>
                        <p class="text-gray-300 text-sm leading-relaxed">${prompt}</p>
                    </div>
                    
                    <!-- Full Text Output -->
                    <div class="bg-black/50 rounded-xl p-6 border border-white/5">
                        <h4 class="text-sm font-semibold text-gray-300 mb-3">Full Output</h4>
                        <pre class="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto max-h-96 overflow-y-auto custom-scrollbar">${fullText}</pre>
                    </div>
                    
                    <!-- Metadata -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-zinc-800/50 rounded-xl p-4 border border-white/5">
                            <p class="text-xs text-gray-500 mb-1">Model</p>
                            <p class="text-white font-semibold">${modelName}</p>
                        </div>
                        <div class="bg-zinc-800/50 rounded-xl p-4 border border-white/5">
                            <p class="text-xs text-gray-500 mb-1">Credits Used</p>
                            <p class="text-yellow-400 font-semibold">${creditsUsed.toFixed(2)} credits</p>
                        </div>
                        <div class="bg-zinc-800/50 rounded-xl p-4 border border-white/5 md:col-span-2">
                            <p class="text-xs text-gray-500 mb-1">Generated At</p>
                            <p class="text-white font-semibold">${timestamp}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Footer Actions -->
                <div class="sticky bottom-0 bg-zinc-900/90 backdrop-blur-md p-4 border-t border-white/10 flex gap-3">
                    <button onclick="navigator.clipboard.writeText(\`${fullText.replace(/`/g, '\\`')}\`).then(() => showNotification('Copied to clipboard!', 'success'))" 
                            class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition flex items-center justify-center gap-2">
                        <i class="fas fa-copy"></i>
                        Copy Text
                    </button>
                    <button onclick="this.closest('.fixed').remove()" 
                            class="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-semibold transition">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    };
    
    // Copy text to clipboard
    window.copyTextToClipboard = function(button) {
        const card = button.closest('[data-metadata]');
        if (!card) return;
        
        const textElement = card.querySelector('pre');
        const text = textElement ? textElement.textContent : '';
        
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Copied to clipboard!', 'success');
            button.innerHTML = '<i class="fas fa-check mr-1"></i> Copied';
            setTimeout(() => {
                button.innerHTML = '<i class="fas fa-copy mr-1"></i> Copy';
            }, 2000);
        }).catch(() => {
            showNotification('Failed to copy', 'error');
        });
    };
    
    // Download text file
    window.downloadTextFile = function(button, type) {
        const card = button.closest('[data-metadata]');
        if (!card) return;
        
        const textElement = card.querySelector('pre');
        const text = textElement ? textElement.textContent : '';
        const extension = type === 'json' ? 'json' : 'txt';
        
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `output-${Date.now()}.${extension}`;
        a.click();
        URL.revokeObjectURL(url);
        
        showNotification('Download started', 'success');
    };
    
    // Fullscreen 3D viewer (attach to btn-fullscreen-3d buttons)
    document.addEventListener('click', (e) => {
        if (e.target.closest('.btn-fullscreen-3d')) {
            const btn = e.target.closest('.btn-fullscreen-3d');
            const modelUrl = btn.getAttribute('data-url');
            const prompt = btn.getAttribute('data-prompt');
            const modelName = btn.getAttribute('data-model');
            
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black z-[100] flex flex-col animate-fadeIn';
            modal.innerHTML = `
                <!-- Header -->
                <div class="bg-zinc-900/95 backdrop-blur-md px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <div class="flex-1">
                        <h3 class="text-white font-bold text-lg flex items-center gap-2">
                            <i class="fas fa-cube text-pink-400"></i>
                            3D Model Viewer
                        </h3>
                        <p class="text-sm text-gray-400 line-clamp-1">${prompt}</p>
                    </div>
                    <button onclick="this.closest('.fixed').remove()" 
                            class="w-10 h-10 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg flex items-center justify-center transition">
                        <i class="fas fa-times text-red-400"></i>
                    </button>
                </div>
                
                <!-- 3D Viewer -->
                <div class="flex-1 relative">
                    <model-viewer 
                        src="${modelUrl}" 
                        alt="3D Model Fullscreen" 
                        auto-rotate 
                        camera-controls
                        shadow-intensity="1"
                        class="w-full h-full"
                        style="background-color: #000;">
                    </model-viewer>
                    
                    <!-- Controls Overlay -->
                    <div class="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-zinc-900/90 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 flex gap-4 items-center">
                        <span class="text-xs text-gray-400">
                            <i class="fas fa-mouse-pointer mr-1"></i> Drag to rotate
                        </span>
                        <span class="text-xs text-gray-400">
                            <i class="fas fa-search mr-1"></i> Scroll to zoom
                        </span>
                        <span class="text-xs text-gray-400">
                            <i class="fas fa-hand-paper mr-1"></i> Right-drag to pan
                        </span>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Close on ESC key
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    modal.remove();
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);
        }
    });
    
    // Load recent generations on page load
    async function loadRecentGenerations() {
        try {
            const response = await fetch('/api/generate/history?limit=10');
            const data = await response.json();
            
            if (data.success && data.data.length > 0) {
                
                // Show result display
                if (resultDisplay) {
                    resultDisplay.classList.remove('hidden');
                    resultDisplay.style.display = 'block';
                }
                
                // Update counter
                updateGenerationsCount();
                
                // ✅ FIX: Clear result display EXCEPT loading cards (preserve active generations)
                if (resultDisplay) {
                    // Preserve loading cards during refresh
                    const loadingCards = resultDisplay.querySelectorAll('[data-generation-loading="true"]');
                    resultDisplay.innerHTML = '';
                    
                    // Re-insert loading cards at the top
                    loadingCards.forEach(card => {
                        resultDisplay.insertBefore(card, resultDisplay.firstChild);
                    });
                    
                    console.log('🔄 [REFRESH] Preserved', loadingCards.length, 'loading cards');
                }
                
                // Render each generation
                data.data.forEach(gen => {
                    // Prepare metadata
                    const metadata = {
                        id: gen.id,
                        type: gen.generation_type,
                        subType: gen.sub_type,
                        prompt: gen.prompt,
                        settings: gen.settings,
                        creditsCost: gen.credits_cost,
                        status: gen.status,
                        createdAt: gen.created_at,
                        errorMessage: gen.error_message,
                        // Include Suno track info if available
                        track_index: gen.metadata?.track_index,
                        total_tracks: gen.metadata?.total_tracks,
                        track: gen.metadata?.track,  // ✅ FIX: Include full track object with duration
                        all_tracks: gen.metadata?.all_tracks
                    };
                    
                    if (gen.status === 'completed' && gen.result_url) {
                        // Success card
                        if (gen.generation_type === 'image') {
                            const urls = gen.result_url.split(',');
                            urls.forEach((url, index) => {
                                const imageCard = createImageCard({
                                    url: url.trim(),
                                    width: gen.settings?.width || 1024,
                                    height: gen.settings?.height || 1024
                                }, index, gen.id, metadata); // Pass metadata
                                resultDisplay.appendChild(imageCard);
                            });
                        } else if (gen.generation_type === 'video') {
                            const videoCard = createVideoCard({
                                url: gen.result_url,
                                width: gen.settings?.width || 1920,
                                height: gen.settings?.height || 1080,
                                duration: gen.settings?.duration || 5
                            }, gen.id, metadata); // Pass metadata
                            resultDisplay.appendChild(videoCard);
                        } else if (gen.generation_type === 'audio') {
                            // ✅ Try to get actual duration from metadata (Suno track), fallback to settings
                            let audioDuration = 5;
                            
                            // Try various possible duration field names from Suno API
                            if (gen.metadata?.track?.duration) {
                                audioDuration = Math.round(parseFloat(gen.metadata.track.duration));
                            } else if (gen.metadata?.track?.audio_length) {
                                audioDuration = Math.round(parseFloat(gen.metadata.track.audio_length));
                            } else if (gen.metadata?.track?.length) {
                                audioDuration = Math.round(parseFloat(gen.metadata.track.length));
                            } else if (gen.settings?.duration) {
                                audioDuration = gen.settings.duration;
                            }
                            
                            // ✅ CRITICAL: Always pass generation ID for audio cards
                            const audioCard = createAudioCard({
                                url: gen.result_url,
                                duration: audioDuration,
                                type: gen.sub_type || 'audio'
                            }, gen.id, metadata); // Pass metadata
                            
                            // ✅ Verify generation ID was set
                            const verifyId = audioCard.getAttribute('data-generation-id');
                            if (!verifyId) {
                                console.error('❌ WARNING: Audio card created without generation ID!', gen);
                            } else {
                            }
                            
                            resultDisplay.appendChild(audioCard);
                        }
                    } else if (gen.status === 'failed') {
                        // Failed card
                        const failedCard = createFailedCard(
                            gen.error_message || 'Generation failed',
                            gen.generation_type,
                            gen.id,
                            metadata // Pass metadata
                        );
                        resultDisplay.appendChild(failedCard);
                    }
                });
                
            } else {
            }
        } catch (error) {
            console.error('❌ Error loading recent generations:', error);
        }
    }
    
    // Initialize - Load models first (removed buggy initializeDefaultDuration and duplicate duration listener)
    // Default 5s sudah di-set di HTML dengan class "active"
    loadAvailableModels().then(() => {
        
        // ✨ Re-verify mode after models loaded
        setTimeout(() => {
            const finalMode = getCurrentMode();
            if (finalMode !== currentMode) {
                currentMode = finalMode;
            }
            
            // Now safe to calculate costs
            calculateCreditCost();
            checkUserCredits();
        }, 200);
        
        // Initialize counter and empty state on page load
        setTimeout(() => {
            updateGenerationsCount();
        }, 100);
        
        // Load recent generations on page load
        loadRecentGenerations();
        
        // ✨ AUTO-RESUME: Restore active jobs after page refresh
        resumeActiveGenerations();
        
        // Start automatic pricing sync check
        startPricingCheck();
    });
    
    /**
     * Resume active generations after page refresh
     */
    async function resumeActiveGenerations() {
        try {
            
            // Get active jobs from server
            const response = await fetch('/api/queue-generation/active');
            const data = await response.json();
            
            if (!data.success) {
                return;
            }
            
            const activeJobs = data.jobs || [];
            
            if (activeJobs.length === 0) {
                return;
            }
            
            
            // Get result container
            const resultDisplay = document.getElementById('result-display');
            if (!resultDisplay) {
                console.warn('⚠️ Result display container not found');
                return;
            }
            
            // For each active job, create loading card and start polling
            activeJobs.forEach(job => {
                
                // Create loading card
                const loadingCard = createLoadingCard(job.type);
                loadingCard.setAttribute('data-generation-loading', 'true');
                loadingCard.setAttribute('data-job-id', job.jobId);
                
                // Add to top of results
                resultDisplay.insertBefore(loadingCard, resultDisplay.firstChild);
                
                // Start polling for this job
                if (window.queueClient) {
                    window.queueClient.pollJobStatus(
                        job.jobId,
                        (updatedJob) => {
                            // onUpdate: Update progress
                            if (typeof updateLoadingProgress === 'function') {
                                updateLoadingProgress(loadingCard, updatedJob.progress);
                            }
                        },
                        (completedJob) => {
                            // onComplete: Show result
                            
                            // Complete loading animation
                            if (typeof completeLoading === 'function') {
                                completeLoading(loadingCard);
                            }
                            
                            // Remove loading card after delay
                            setTimeout(() => {
                                loadingCard.remove();
                                
                                // ✨ SOFT REFRESH: Fetch and display just the latest result
                                softRefreshNewResult(job.generation_type || 'image');
                                
                                // Update credits
                                checkUserCredits();
                                
                                // Show notification
                                if (typeof showNotification === 'function') {
                                    showNotification('Generation complete!', 'success');
                                }
                            }, 500);
                        },
                        (error) => {
                            // onError: Show error
                            console.error(`❌ Job ${job.jobId} failed:`, error);
                            
                            // Remove loading card
                            loadingCard.remove();
                            
                            // ✨ CRITICAL: Soft refresh result container IMMEDIATELY to show failed job
                            
                            // Use soft refresh for efficiency (only fetches latest 5)
                            setTimeout(() => {
                                softRefreshNewResult(job.generation_type || 'image');
                            }, 300);
                            
                            // ✨ Show user-friendly error notification
                            const errorMsg = error.errorMessage || error.error || error.message || 'Generation failed';
                            if (typeof showNotification === 'function') {
                                showNotification(errorMsg, 'error');
                            }
                        }
                    );
                } else if (window.generationPoller) {
                    // Fallback to generationPoller if queueClient not available
                    window.generationPoller.startPolling(
                        job.jobId,
                        (updatedJob) => {
                            if (typeof updateLoadingProgress === 'function') {
                                updateLoadingProgress(loadingCard, updatedJob.progress);
                            }
                        },
                        (completedJob) => {
                            if (typeof completeLoading === 'function') {
                                completeLoading(loadingCard);
                            }
                            setTimeout(() => {
                                loadingCard.remove();
                                
                                // ✨ SOFT REFRESH: Fetch and display just the latest result
                                softRefreshNewResult(job.generation_type || 'image');
                                
                                checkUserCredits();
                                if (typeof showNotification === 'function') {
                                    showNotification('Generation complete!', 'success');
                                }
                            }, 500);
                        },
                        (error) => {
                            console.error(`❌ Job ${job.jobId} failed:`, error);
                            loadingCard.remove();
                            
                            // ✨ Soft refresh to show failed job
                            setTimeout(() => {
                                softRefreshNewResult(job.generation_type || 'image');
                            }, 300);
                            
                            if (typeof showNotification === 'function') {
                                showNotification(error.message || 'Generation failed', 'error');
                            }
                        }
                    );
                }
            });
            
        } catch (error) {
            console.error('❌ Error resuming active generations:', error);
        }
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        stopPricingCheck();
        
        // ✨ Cleanup SSE connection
        if (window.queueClient) {
            window.queueClient.disconnectSSE();
        }
    });
    
    // Expose functions for external use
    window.getAvailableModels = () => availableModels;
    window.getSelectedModel = () => selectedModel;
    window.calculateCreditCost = calculateCreditCost; // Expose for external triggers
});

// Download file function (global)
function downloadFile(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Handle card deletion (global)
async function handleDeleteCard(buttonElement) {
    const card = buttonElement.closest('.bg-gradient-to-br');
    const generationId = card.getAttribute('data-generation-id');
    
    // Determine message based on whether it's a failed card
    const isFailed = card.classList.contains('border-red-500/30') || 
                     card.querySelector('.text-red-400');
    const confirmMsg = isFailed ? 
        '🗑️ Hapus hasil yang gagal ini?' : 
        '🗑️ Hapus hasil ini? Tindakan tidak dapat dibatalkan.';
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    // ⚠️ Check if this is a placeholder card (new, not yet in DB)
    const isPlaceholder = card.getAttribute('data-new') === 'true';
    
    // If no generation ID
    if (!generationId || generationId.trim() === '') {
        if (isPlaceholder) {
            // It's a placeholder card, safe to just remove from DOM
            card.remove();
            if (typeof showNotification === 'function') {
                showNotification('🗑️ Berhasil dihapus dari galeri', 'success');
            }
        } else {
            // ⚠️ This card should have a generation ID but doesn't - something is wrong
            console.error('❌ Cannot delete: Card is not a placeholder but has no generation ID');
            
            if (typeof showNotification === 'function') {
                showNotification('⚠️ Error: Card rusak. Memuat ulang halaman untuk memperbaiki...', 'warning');
            }
            
            // Reload page to get fresh data from database
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
        return;
    }
    
    // Delete from database
    try {
        const response = await fetch(`/api/generate/delete/${generationId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Remove from DOM with animation
            card.style.transition = 'all 0.3s ease-out';
            card.style.opacity = '0';
            card.style.transform = 'translateX(100px)';
            
            setTimeout(() => {
                card.remove();
            }, 300);
            
            // Show success notification (from dashboard-generation.js)
            if (typeof showNotification === 'function') {
                showNotification('🗑️ Berhasil dihapus dari galeri', 'success');
            }
        } else {
            console.error('❌ Failed to delete:', data.message);
            if (typeof showNotification === 'function') {
                showNotification(data.message || 'Gagal menghapus hasil', 'error');
            } else {
                alert(data.message || 'Gagal menghapus hasil');
            }
        }
    } catch (error) {
        console.error('❌ Delete error:', error);
        if (typeof showNotification === 'function') {
            showNotification('❌ Gagal menghapus: Terjadi kesalahan', 'error');
        } else {
            alert('Gagal menghapus: Terjadi kesalahan');
        }
    }
}

// Expose functions to window for mobile view cloned cards
window.downloadFile = downloadFile;
window.handleDeleteCard = handleDeleteCard;

