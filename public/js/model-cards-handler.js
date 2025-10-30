/**
 * Model Cards Handler
 * Handles visual model cards rendering with loading states
 * Consistent with generation card animations
 */

(function() {
    'use strict';

    // State management
    let imageModels = [];
    let videoModels = [];
    let selectedImageModel = null;
    let selectedVideoModel = null;
    
    // Loading templates (Compact)
    const LOADING_SKELETON = `
        <div class="space-y-1.5">
            ${Array(6).fill(0).map(() => `
                <div class="w-full p-3 rounded-lg border border-white/10 bg-white/5 animate-pulse">
                    <div class="flex items-center gap-2.5">
                        <div class="w-10 h-10 bg-white/10 rounded-lg flex-shrink-0"></div>
                        <div class="flex-1 space-y-1.5">
                            <div class="h-3.5 bg-white/10 rounded w-3/4"></div>
                            <div class="h-2.5 bg-white/10 rounded w-full"></div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    const EMPTY_STATE = (type) => `
        <div class="text-center py-12">
            <div class="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center">
                <i class="fas fa-search text-gray-400 text-3xl"></i>
            </div>
            <p class="text-sm font-semibold text-gray-300 mb-1">No ${type} models found</p>
            <p class="text-xs text-gray-500">Try different search terms or filters</p>
        </div>
    `;
    
    const ERROR_STATE = `
        <div class="text-center py-12">
            <div class="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-red-900/30 to-red-800/30 rounded-full flex items-center justify-center">
                <i class="fas fa-exclamation-triangle text-red-400 text-3xl"></i>
            </div>
            <p class="text-sm font-semibold text-red-300 mb-1">Failed to load models</p>
            <p class="text-xs text-gray-500 mb-4">Please refresh the page or try again later</p>
            <button onclick="location.reload()" class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-semibold transition-colors">
                <i class="fas fa-redo mr-2"></i>Retry
            </button>
        </div>
    `;
    
    /**
     * Render model card (Compact & Dark)
     */
    function createModelCard(model, type = 'image') {
        const iconClass = type === 'image' ? 'fa-image' : 'fa-video';
        const isSelected = (type === 'image' && selectedImageModel?.id === model.id) || 
                          (type === 'video' && selectedVideoModel?.id === model.id);
        const isPinned = model.is_pinned || false;
        
        // Solid dark colors instead of gradients
        let bgColor = 'bg-blue-600';
        if (model.viral) {
            bgColor = 'bg-pink-600';
        } else if (model.trending || model.featured) {
            bgColor = 'bg-yellow-600';
        }
        
        // Cost display - Show minimum price (cheapest option)
        let cost;
        
        // For video models, show cost from database
        if (type === 'video') {
            // Check if multi-tier pricing (multiple price variants)
            if (model.has_multi_tier_pricing) {
                // ⚠️ WARNING: DO NOT RECALCULATE!
                // Admin already calculated and stored in model.cost
                // Just use the stored value to show base price
                cost = parseFloat(model.cost_credits || model.cost || 0.5).toFixed(1);
            } else if (model.pricing_type === 'per_second') {
                // Per-second pricing: show credits per second
                const baseCost = parseFloat(model.cost_credits || model.cost || 0.5);
                cost = baseCost.toFixed(1);
            } else {
                // Flat rate: show full cost
                cost = parseFloat(model.cost_credits || model.cost || 0.5).toFixed(1);
            }
        } else {
            // Image models: show base cost
            cost = parseFloat(model.cost_credits || model.cost || 0.5).toFixed(1);
        }
        
        return `
            <div class="relative group/card">
                <button type="button" 
                        class="model-card ${isSelected ? 'selected' : ''} ${isPinned ? 'pinned-model' : ''} w-full p-3 rounded-lg border border-white/10 hover:border-blue-500/50 bg-white/5 text-left transition-all" 
                        data-model-id="${model.id}"
                        data-model-type="${type}"
                        onclick="window.selectModelCard('${model.id}', '${type}')">
                    <div class="flex items-center gap-2.5">
                        <!-- Icon (Compact) -->
                        <div class="w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center flex-shrink-0 relative">
                            <i class="fas ${iconClass} text-white text-sm"></i>
                            ${isPinned ? '<div class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-500 rounded-full flex items-center justify-center"><i class="fas fa-thumbtack text-white text-[6px]"></i></div>' : ''}
                        </div>
                        
                        <!-- Content (Compact) -->
                        <div class="flex-1 min-w-0">
                            <!-- Title Row -->
                            <div class="flex items-center gap-1.5 mb-0.5">
                                <p class="text-sm font-semibold text-white line-clamp-1 flex-1">${escapeHtml(model.name)}</p>
                                ${isPinned ? '<i class="fas fa-thumbtack text-yellow-400 text-xs"></i>' : ''}
                                ${model.viral ? '<i class="fas fa-fire text-pink-400 text-xs"></i>' : ''}
                                ${model.trending ? '<i class="fas fa-star text-yellow-400 text-xs"></i>' : ''}
                            </div>
                            
                            <!-- Badges (Compact) -->
                            <div class="flex items-center gap-1.5">
                                <span class="text-xs px-1.5 py-0.5 rounded bg-white/10 text-gray-300 font-medium">
                                    ${escapeHtml(model.category || 'General')}
                                </span>
                                <span class="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-semibold flex items-center gap-1">
                                    <i class="fas fa-coins text-xs"></i>
                                    <span>${model.pricing_type === 'per_second' ? cost + ' cr/s' : (model.has_multi_tier_pricing ? 'from ' + cost : cost)}</span>
                                </span>
                            </div>
                        </div>
                        
                        <!-- Check Icon (Small) -->
                        <i class="fas fa-check text-blue-400 text-sm ${isSelected ? 'opacity-100' : 'opacity-0'} transition-opacity"></i>
                    </div>
                </button>
                
                <!-- Pin Button (Hover) -->
                <button type="button" 
                        class="pin-btn absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/80 hover:bg-yellow-500/20 border border-white/10 hover:border-yellow-500/50 flex items-center justify-center transition-all opacity-0 group-hover/card:opacity-100 z-10"
                        data-model-id="${model.id}"
                        data-is-pinned="${isPinned}"
                        onclick="event.stopPropagation(); window.togglePin('${model.id}', '${type}', this)"
                        title="${isPinned ? 'Unpin model' : 'Pin model (max 3)'}">
                    <i class="fas fa-thumbtack text-xs ${isPinned ? 'text-yellow-400' : 'text-gray-400'} transition-colors"></i>
                </button>
            </div>
        `;
    }
    
    /**
     * Render model cards
     */
    function renderModelCards(models, containerId, type = 'image') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container ${containerId} not found`);
            return;
        }
        
        // Show empty state
        if (!models || models.length === 0) {
            container.innerHTML = EMPTY_STATE(type);
            return;
        }
        
        // Render cards
        const cardsHTML = models.map(model => createModelCard(model, type)).join('');
        container.innerHTML = cardsHTML;
        
        console.log(`✅ Rendered ${models.length} ${type} model cards`);
    }
    
    /**
     * Show loading state
     */
    function showLoading(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = LOADING_SKELETON;
        }
    }
    
    /**
     * Show error state
     */
    function showError(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = ERROR_STATE;
        }
    }
    
    /**
     * Select model card
     * @param {string} modelId - Model ID to select
     * @param {string} type - Model type (image/video)
     * @param {boolean} shouldCollapse - Whether to collapse after selection (default: true)
     */
    window.selectModelCard = function(modelId, type, shouldCollapse = true) {
        console.log(`🎯 Selecting ${type} model:`, modelId);
        
        const models = type === 'image' ? imageModels : videoModels;
        const model = models.find(m => m.id == modelId);
        
        if (!model) {
            console.error('Model not found:', modelId);
            return;
        }
        
        // Update selected state
        if (type === 'image') {
            selectedImageModel = model;
        } else {
            selectedVideoModel = model;
        }
        
        // ✨ SAVE TO LOCALSTORAGE FOR PERSISTENCE
        try {
            localStorage.setItem(`selected_${type}_model_id`, modelId);
            localStorage.setItem(`selected_${type}_model`, JSON.stringify(model));
            console.log(`💾 Saved ${type} model to localStorage:`, model.name);
        } catch (e) {
            console.warn('Failed to save model to localStorage:', e);
        }
        
        // Update UI - remove all selected states
        const allCards = document.querySelectorAll(`.model-card[data-model-type="${type}"]`);
        allCards.forEach(card => {
            card.classList.remove('selected');
            const checkIcon = card.querySelector('.fa-check');
            if (checkIcon) {
                checkIcon.style.opacity = '0';
            }
        });
        
        // Add selected state to clicked card
        const selectedCard = document.querySelector(`[data-model-id="${modelId}"][data-model-type="${type}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
            const checkIcon = selectedCard.querySelector('.fa-check');
            if (checkIcon) {
                checkIcon.style.opacity = '1';
            }
        }
        
        // Update hidden select for compatibility
        const selectId = type === 'image' ? 'image-model-select' : 'video-model-select';
        const select = document.getElementById(selectId);
        if (select) {
            select.value = model.model_id;
            select.dispatchEvent(new Event('change'));
        }
        
        // Update model info display
        updateModelInfoDisplay(model, type);
        
        // Notify other scripts
        if (window.updateSelectedModel) {
            window.updateSelectedModel(model.id);
        }
        
        // Collapse model cards after selection (only if shouldCollapse = true)
        if (shouldCollapse) {
            collapseModelCards(type);
        }
        
        console.log(`✅ Selected ${type} model:`, model.name, `(${model.cost_credits || model.cost} credits)`, shouldCollapse ? '(collapsed)' : '(expanded)');
    };
    
    /**
     * Collapse model cards container
     */
    function collapseModelCards(type) {
        console.log('🔽 collapseModelCards() called for type:', type);
        
        const cardsId = type === 'image' ? 'image-model-cards' : 
                       type === 'video' ? 'video-model-cards' : 
                       'audio-model-cards';
        const searchId = type === 'image' ? 'image-search-container' : 
                        type === 'video' ? 'video-search-container' : 
                        'audio-search-container';
        const expandBtnId = type === 'image' ? 'expand-image-models' : 
                           type === 'video' ? 'expand-video-models' : 
                           'expand-audio-models';
        
        console.log('🔍 Looking for elements:', { cardsId, searchId, expandBtnId });
        
        const cardsContainer = document.getElementById(cardsId);
        const searchContainer = document.getElementById(searchId);
        const expandBtn = document.getElementById(expandBtnId);
        
        console.log('🔍 Elements found:', { 
            cards: !!cardsContainer, 
            search: !!searchContainer, 
            expandBtn: !!expandBtn 
        });
        
        if (cardsContainer) {
            cardsContainer.style.maxHeight = '0';
            cardsContainer.style.opacity = '0';
            cardsContainer.style.overflow = 'hidden';
            cardsContainer.style.marginBottom = '0';
            console.log('✅ Cards container collapsed');
        } else {
            console.warn('⚠️ Cards container not found:', cardsId);
        }
        
        if (searchContainer) {
            searchContainer.style.display = 'none';
            console.log('✅ Search container hidden');
        } else {
            console.warn('⚠️ Search container not found:', searchId);
        }
        
        if (expandBtn) {
            expandBtn.classList.remove('hidden');
            console.log('✅ Expand button shown');
        } else {
            console.warn('⚠️ Expand button not found:', expandBtnId);
        }
    }
    
    /**
     * Expand model cards container
     */
    function expandModelCards(type) {
        const cardsId = type === 'image' ? 'image-model-cards' : 
                       type === 'video' ? 'video-model-cards' : 
                       'audio-model-cards';
        const searchId = type === 'image' ? 'image-search-container' : 
                        type === 'video' ? 'video-search-container' : 
                        'audio-search-container';
        const expandBtnId = type === 'image' ? 'expand-image-models' : 
                           type === 'video' ? 'expand-video-models' : 
                           'expand-audio-models';
        
        const cardsContainer = document.getElementById(cardsId);
        const searchContainer = document.getElementById(searchId);
        const expandBtn = document.getElementById(expandBtnId);
        
        if (cardsContainer) {
            cardsContainer.style.maxHeight = '24rem'; // max-h-96
            cardsContainer.style.opacity = '1';
            cardsContainer.style.overflow = 'auto';
            cardsContainer.style.marginBottom = '';
        }
        
        if (searchContainer) {
            searchContainer.style.display = 'block';
        }
        
        if (expandBtn) {
            expandBtn.classList.add('hidden');
        }
    }
    
    // Export collapse/expand functions
    window.collapseModelCards = collapseModelCards;
    window.expandModelCards = expandModelCards;
    
    /**
     * Update model info display
     */
    function updateModelInfoDisplay(model, type) {
        const infoDiv = document.getElementById(`${type}-model-info`);
        const nameEl = document.getElementById(`${type}-model-name`);
        const descEl = document.getElementById(`${type}-model-desc`);
        const badgeEl = document.getElementById(`${type}-model-badge`);
        const costEl = document.getElementById(`${type}-model-cost`);
        
        if (!infoDiv) return;
        
        infoDiv.classList.remove('hidden');
        
        if (nameEl) {
            nameEl.textContent = model.name;
        }
        
        if (descEl) {
            descEl.textContent = model.description || 'AI model for generation';
        }
        
        if (badgeEl) {
            if (model.viral) {
                badgeEl.textContent = '🔥 VIRAL';
                badgeEl.className = 'text-xs px-2 py-1 rounded-full bg-pink-500/20 text-pink-300 font-semibold';
            } else if (model.trending) {
                badgeEl.textContent = '⭐ TRENDING';
                badgeEl.className = 'text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-300 font-semibold';
            } else {
                badgeEl.textContent = model.category || 'General';
                badgeEl.className = 'text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 font-semibold';
            }
        }
        
        if (costEl) {
            const cost = parseFloat(model.cost_credits || model.cost || 0.5).toFixed(1);
            const costSpan = costEl.querySelector('span');
            if (costSpan) {
                costSpan.textContent = `${cost} credits`;
            }
        }
    }
    
    /**
     * Load and render image models
     * @param {string} category - Category to filter by
     * @param {boolean} shouldCollapse - Whether to collapse after selection (default: true)
     */
    async function loadImageModels(category = null, shouldCollapse = true) {
        const container = document.getElementById('image-model-cards');
        if (!container) return;
        
        showLoading('image-model-cards');
        
        try {
            let url = '/api/models/dashboard?type=image&limit=100';
            if (category) {
                url += `&category=${encodeURIComponent(category)}`;
            }
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success && data.models) {
                imageModels = data.models;
                renderModelCards(imageModels, 'image-model-cards', 'image');
                
                // Also populate hidden select for compatibility
                populateHiddenSelect(imageModels, 'image-model-select');
                
                // Auto-select first model (always select top model when type changes)
                if (imageModels.length > 0) {
                    setTimeout(() => {
                        window.selectModelCard(imageModels[0].id, 'image', shouldCollapse);
                    }, 100);
                }
            } else {
                showError('image-model-cards');
            }
        } catch (error) {
            console.error('❌ Error loading image models:', error);
            showError('image-model-cards');
        }
    }
    
    /**
     * Load and render video models
     * @param {string} category - Category to filter by
     * @param {boolean} shouldCollapse - Whether to collapse after selection (default: true)
     */
    async function loadVideoModels(category = null, shouldCollapse = true) {
        const container = document.getElementById('video-model-cards');
        if (!container) return;
        
        showLoading('video-model-cards');
        
        try {
            let url = '/api/models/dashboard?type=video&limit=100';
            if (category) {
                url += `&category=${encodeURIComponent(category)}`;
            }
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success && data.models) {
                videoModels = data.models;
                renderModelCards(videoModels, 'video-model-cards', 'video');
                
                // Also populate hidden select for compatibility
                populateHiddenSelect(videoModels, 'video-model-select');
                
                // Auto-select first model (always select top model when type changes)
                if (videoModels.length > 0) {
                    setTimeout(() => {
                        window.selectModelCard(videoModels[0].id, 'video', shouldCollapse);
                    }, 100);
                }
            } else {
                showError('video-model-cards');
            }
        } catch (error) {
            console.error('❌ Error loading video models:', error);
            showError('video-model-cards');
        }
    }
    
    /**
     * Populate hidden select for compatibility
     */
    function populateHiddenSelect(models, selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        select.innerHTML = '';
        models.forEach((model, index) => {
            const option = document.createElement('option');
            option.value = model.model_id;
            option.textContent = model.name;
            option.dataset.modelData = JSON.stringify(model);
            option.dataset.dbId = model.id;
            
            if (index === 0) {
                option.selected = true;
            }
            
            select.appendChild(option);
        });
    }
    
    /**
     * Search models
     */
    function searchModels(query, type) {
        const models = type === 'image' ? imageModels : videoModels;
        const containerId = type === 'image' ? 'image-model-cards' : 'video-model-cards';
        
        if (!query || query.trim().length === 0) {
            renderModelCards(models, containerId, type);
            return;
        }
        
        const filtered = models.filter(model => 
            model.name.toLowerCase().includes(query.toLowerCase()) ||
            (model.description && model.description.toLowerCase().includes(query.toLowerCase())) ||
            (model.category && model.category.toLowerCase().includes(query.toLowerCase()))
        );
        
        renderModelCards(filtered, containerId, type);
    }
    
    /**
     * Debounce function
     */
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
    
    /**
     * Escape HTML
     */
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
    
    /**
     * Toggle Pin Model
     */
    window.togglePin = async function(modelId, type, buttonElement) {
        try {
            console.log('🔄 Toggle pin for model:', modelId);
            
            const isPinned = buttonElement.dataset.isPinned === 'true';
            const action = isPinned ? 'unpin' : 'pin';
            
            // Show loading state
            const icon = buttonElement.querySelector('i');
            const originalIconClass = icon.className;
            icon.className = 'fas fa-spinner fa-spin text-xs text-gray-400';
            buttonElement.disabled = true;
            
            // Call API
            const response = await fetch(`/api/models/pin/toggle/${modelId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                // Show error notification
                if (response.status === 400 && data.message.includes('Maximum')) {
                    showNotification('You can only pin up to 3 models!', 'warning');
                } else if (response.status === 401) {
                    showNotification('Please login to pin models', 'error');
                } else {
                    showNotification(data.message || 'Failed to pin model', 'error');
                }
                
                // Restore button state
                icon.className = originalIconClass;
                buttonElement.disabled = false;
                return;
            }
            
            // Update button state
            const newPinStatus = data.action === 'pinned';
            buttonElement.dataset.isPinned = newPinStatus;
            icon.className = `fas fa-thumbtack text-xs ${newPinStatus ? 'text-yellow-400' : 'text-gray-400'} transition-colors`;
            buttonElement.title = newPinStatus ? 'Unpin model' : 'Pin model (max 3)';
            buttonElement.disabled = false;
            
            // Update model card styling
            const modelCard = buttonElement.closest('.relative').querySelector('.model-card');
            if (newPinStatus) {
                modelCard.classList.add('pinned-model');
            } else {
                modelCard.classList.remove('pinned-model');
            }
            
            // Update model data
            const models = type === 'image' ? imageModels : videoModels;
            const model = models.find(m => m.id == modelId);
            if (model) {
                model.is_pinned = newPinStatus;
            }
            
            // Show success notification
            showNotification(
                newPinStatus ? '📌 Model pinned successfully!' : '✓ Model unpinned',
                'success'
            );
            
            // Reload models to reorder (pinned models first) WITHOUT collapsing
            setTimeout(() => {
                if (type === 'image') {
                    const imageTypeSelect = document.getElementById('image-type');
                    if (imageTypeSelect && imageTypeSelect.value) {
                        loadImageModels(getCategoryFromType(imageTypeSelect.value), false); // false = don't collapse
                    }
                } else {
                    const videoTypeSelect = document.getElementById('video-type');
                    if (videoTypeSelect && videoTypeSelect.value) {
                        loadVideoModels(getCategoryFromType(videoTypeSelect.value), false); // false = don't collapse
                    }
                }
            }, 500);
            
        } catch (error) {
            console.error('Error toggling pin:', error);
            showNotification('Failed to update pin status', 'error');
            
            // Restore button
            const icon = buttonElement.querySelector('i');
            icon.className = `fas fa-thumbtack text-xs ${buttonElement.dataset.isPinned === 'true' ? 'text-yellow-400' : 'text-gray-400'}`;
            buttonElement.disabled = false;
        }
    };
    
    /**
     * Show notification toast
     */
    function showNotification(message, type = 'info') {
        // Check if notification container exists
        let container = document.getElementById('pin-notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'pin-notification-container';
            container.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-2';
            document.body.appendChild(container);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        const bgColors = {
            success: 'bg-green-500/90',
            error: 'bg-red-500/90',
            warning: 'bg-yellow-500/90',
            info: 'bg-blue-500/90'
        };
        
        notification.className = `${bgColors[type] || bgColors.info} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in-right`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : type === 'warning' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span class="text-sm font-medium">${message}</span>
        `;
        
        container.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    /**
     * Get category from type
     */
    function getCategoryFromType(type) {
        const categoryMap = {
            'text-to-image': 'Text-to-Image',
            'edit-image': 'Image Editing',
            'edit-multi': 'Image Editing',
            'upscale': 'Upscaling',
            'remove-bg': 'Background Removal',
            'text-to-3d': 'Text-to-3D', // ✅ Separate category
            'image-to-3d': 'Image-to-3D', // ✅ Separate category
            'text-to-video': 'Text-to-Video',
            'image-to-video': 'Image-to-Video',
            'image-to-video-end': 'Image-to-Video'
        };
        return categoryMap[type];
    }
    
    /**
     * Initialize
     */
    function init() {
        console.log('🎨 Model Cards Handler initialized');
        
        // DON'T auto-load models - wait for type selection
        // loadImageModels();
        // loadVideoModels();
        
        // Setup expand buttons
        const expandImageBtn = document.getElementById('expand-image-models');
        if (expandImageBtn) {
            expandImageBtn.addEventListener('click', function() {
                expandModelCards('image');
            });
        }
        
        const expandVideoBtn = document.getElementById('expand-video-models');
        if (expandVideoBtn) {
            expandVideoBtn.addEventListener('click', function() {
                expandModelCards('video');
            });
        }
        
        // Setup search handlers
        const imageSearch = document.getElementById('image-model-search');
        if (imageSearch) {
            const debouncedSearch = debounce((query) => {
                searchModels(query, 'image');
            }, 300);
            
            imageSearch.addEventListener('input', (e) => {
                const query = e.target.value;
                debouncedSearch(query);
                
                // Show/hide clear button
                const clearBtn = document.getElementById('clear-search');
                if (clearBtn) {
                    if (query) {
                        clearBtn.classList.remove('hidden');
                    } else {
                        clearBtn.classList.add('hidden');
                    }
                }
            });
        }
        
        const videoSearch = document.getElementById('video-model-search');
        if (videoSearch) {
            const debouncedSearch = debounce((query) => {
                searchModels(query, 'video');
            }, 300);
            
            videoSearch.addEventListener('input', (e) => {
                debouncedSearch(e.target.value);
            });
        }
        
        // Handle type changes - Load models on first change
        const imageTypeSelect = document.getElementById('image-type');
        let imageModelsLoaded = false;
        
        if (imageTypeSelect) {
            imageTypeSelect.addEventListener('change', function() {
                const type = this.value;
                console.log('🔄 Image type changed:', type);
                
                // Map type to category
                const categoryMap = {
                    'text-to-image': 'Text-to-Image',
                    'edit-image': 'Image Editing',
                    'edit-multi': 'Image Editing',
                    'upscale': 'Upscaling',
                    'remove-bg': 'Background Removal',
                    'text-to-3d': 'Text-to-3D', // ✅ Separate category for text-to-3d
                    'image-to-3d': 'Image-to-3D' // ✅ Separate category for image-to-3d
                };
                
                const category = categoryMap[type];
                console.log('📂 Category mapping:', { type, category });

                if (category) {
                    console.log('🔍 Loading models for category:', category);
                    loadImageModels(category);
                } else {
                    console.log('⚠️ No category found, loading all models');
                    loadImageModels();
                }
                
                imageModelsLoaded = true;
            });
            
            // DON'T auto-load - wait for user selection
            // User must select type first
        }
        
        const videoTypeSelect = document.getElementById('video-type');
        let videoModelsLoaded = false;
        
        if (videoTypeSelect) {
            videoTypeSelect.addEventListener('change', function() {
                const type = this.value;
                console.log('🔄 Video type changed:', type);
                
                // Map type to category
                const categoryMap = {
                    'text-to-video': 'Text-to-Video',
                    'image-to-video': 'Image-to-Video',
                    'image-to-video-end': 'Image-to-Video'
                };
                
                const category = categoryMap[type];
                if (category) {
                    loadVideoModels(category);
                } else {
                    loadVideoModels();
                }
                
                videoModelsLoaded = true;
            });
            
            // DON'T auto-load - wait for user selection
            // User must select type first
        }
    }
    
    // Export functions
    window.modelCardsHandler = {
        loadImageModels,
        loadVideoModels,
        renderModelCards,
        searchModels,
        showLoading,
        showError
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

