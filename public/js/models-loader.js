// Models Loader for Dashboard
// Loads FAL.AI models with search functionality

document.addEventListener('DOMContentLoaded', async function() {
    let imageModels = [];
    let videoModels = [];
    let allImageModels = []; // Store all image models for filtering
    let allVideoModels = []; // Store all video models for filtering
    let currentImageSearchTerm = '';
    let currentVideoSearchTerm = '';
    
    // Type to category mapping
    const TYPE_CATEGORY_MAP = {
        // Image types
        'text-to-image': 'Text-to-Image',
        'edit-image': 'Image Editing',
        'edit-multi': 'Image Editing',
        'upscale': 'Upscaling',
        'remove-bg': 'Background Removal', // Updated to use specific category
        'text-to-3d': 'Text-to-3D', // ✅ Separate category for text-to-3d
        'image-to-3d': 'Image-to-3D', // ✅ Separate category for image-to-3d
        // Video types  
        'text-to-video': 'Text-to-Video',
        'image-to-video': 'Image-to-Video',
        'image-to-video-end': 'Image-to-Video', // Same category as image-to-video
        'edit-video': 'Video Editing',
        'enhance-video': 'Video Enhancement',
        'upscale-video': 'Video Upscaling',
        'video-effects': 'Video Effects',
        'animation': 'Animation'
    };
    
    // Load models from API with optional category filtering
    async function loadModels(imageCategory = null, videoCategory = null) {
        try {
            
            // Build image models URL
            let imageUrl = '/api/models/dashboard?type=image&limit=100';
            if (imageCategory) {
                imageUrl += `&category=${encodeURIComponent(imageCategory)}`;
            }
            
            // Load image models
            const imageResponse = await fetch(imageUrl);
            const imageData = await imageResponse.json();
            
            if (imageData.success) {
                imageModels = imageData.models;
                if (!imageCategory) {
                    allImageModels = imageData.models; // Store all for later filtering
                }
                populateImageModels(imageModels);
            }
            
            // Build video models URL
            let videoUrl = '/api/models/dashboard?type=video&limit=100';
            if (videoCategory) {
                videoUrl += `&category=${encodeURIComponent(videoCategory)}`;
            }
            
            // Load video models
            const videoResponse = await fetch(videoUrl);
            const videoData = await videoResponse.json();
            
            if (videoData.success) {
                videoModels = videoData.models;
                if (!videoCategory) {
                    allVideoModels = videoData.models; // Store all for later filtering
                }
                populateVideoModels(videoModels);
            }
            
            // Share models with dashboard-generation.js
            window.allLoadedModels = [...imageModels, ...videoModels];
            
        } catch (error) {
            console.error('❌ Error loading models:', error);
            showFallbackModels();
        }
    }
    
    // Reload image models based on selected type
    async function reloadImageModels(selectedType) {
        const category = TYPE_CATEGORY_MAP[selectedType];
        
        if (!category) {
            populateImageModels(allImageModels);
            return;
        }
        
        
        try {
            const url = `/api/models/dashboard?type=image&category=${encodeURIComponent(category)}&limit=100`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success) {
                imageModels = data.models;
                populateImageModels(imageModels);
                
                // Update shared models
                window.allLoadedModels = [...imageModels, ...videoModels];
            }
        } catch (error) {
            console.error('❌ Error reloading image models:', error);
        }
    }
    
    // Reload video models based on selected type
    async function reloadVideoModels(selectedType) {
        const category = TYPE_CATEGORY_MAP[selectedType];
        
        if (!category) {
            populateVideoModels(allVideoModels);
            return;
        }
        
        
        try {
            const url = `/api/models/dashboard?type=video&category=${encodeURIComponent(category)}&limit=100`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success) {
                videoModels = data.models;
                populateVideoModels(videoModels);
                
                // Update shared models
                window.allLoadedModels = [...imageModels, ...videoModels];
            }
        } catch (error) {
            console.error('❌ Error reloading video models:', error);
        }
    }
    
    // Populate image models dropdown
    function populateImageModels(models) {
        const select = document.getElementById('image-model-select');
        if (!select) return;
        
        select.innerHTML = '';
        
        if (models.length === 0) {
            select.innerHTML = '<option value="">No models found</option>';
            return;
        }
        
        models.forEach((model, index) => {
            const option = document.createElement('option');
            option.value = model.model_id; // ✅ Use FAL.AI model_id, not database ID
            const cost = parseFloat(model.cost || 1).toFixed(1);
            option.textContent = `${model.name}${model.viral ? ' 🔥' : model.trending ? ' ⭐' : ''} - ${cost} credits`;
            option.dataset.modelData = JSON.stringify(model);
            option.dataset.dbId = model.id; // Store DB ID for cost calculation
            
            if (index === 0) {
                option.selected = true;
            }
            
            select.appendChild(option);
        });
        
        // ✨ RESTORE PREVIOUSLY SELECTED MODEL FROM LOCALSTORAGE
        // Wait for dashboard state to be fully restored first
        function tryRestoreImageModel() {
            // ✅ ONLY restore if currently on IMAGE tab
            const activeTab = document.querySelector('.creation-tab.active');
            const currentMode = activeTab ? activeTab.getAttribute('data-mode') : 'image';
            
            if (currentMode !== 'image') {
                return;
            }
            
            const savedModelId = localStorage.getItem('selected_image_model_id');
            if (savedModelId) {
                const savedOption = Array.from(select.options).find(opt => opt.dataset.dbId == savedModelId);
                if (savedOption) {
                    select.value = savedOption.value;
                    select.dispatchEvent(new Event('change'));
                    return;
                }
            }
            
            // Fallback: Show info for first model and trigger change event (only if on image tab)
            updateModelInfo('image', models[0]);
            if (models.length > 0) {
                select.dispatchEvent(new Event('change'));
            }
        }
        
        // ✅ IMPROVED: Check multiple times for faster response
        let checkCount = 0;
        const maxChecks = 20; // 20 * 50ms = 1 second max wait
        
        function checkAndRestore() {
            if (window.dashboardStateRestored) {
                tryRestoreImageModel();
                return;
            }
            
            checkCount++;
            if (checkCount < maxChecks) {
                setTimeout(checkAndRestore, 50); // Check every 50ms
            } else {
                console.warn('⚠️ Max wait time reached, forcing image model restore');
                tryRestoreImageModel(); // Force restore after timeout
            }
        }
        
        // Start checking immediately
        setTimeout(checkAndRestore, 10);
        
    }
    
    // Populate video models dropdown
    function populateVideoModels(models) {
        const select = document.getElementById('video-model-select');
        if (!select) return;
        
        select.innerHTML = '';
        
        if (models.length === 0) {
            select.innerHTML = '<option value="">No models found</option>';
            return;
        }
        
        models.forEach((model, index) => {
            const option = document.createElement('option');
            option.value = model.model_id; // ✅ Use FAL.AI model_id, not database ID
            const cost = parseFloat(model.cost || 3);
            const duration = model.max_duration || 5;
            const costPerSecond = (cost / duration).toFixed(2);
            
            // Show both full cost and per-second cost for clarity
            option.textContent = `${model.name}${model.viral ? ' 🔥' : model.trending ? ' ⭐' : ''} - ${cost.toFixed(1)} credits (max ${duration}s) • ${costPerSecond}cr/s`;
            option.dataset.modelData = JSON.stringify(model);
            option.dataset.dbId = model.id; // Store DB ID for cost calculation
            
            if (index === 0) {
                option.selected = true;
            }
            
            select.appendChild(option);
        });
        
        // ✨ RESTORE PREVIOUSLY SELECTED MODEL FROM LOCALSTORAGE
        // Wait for dashboard state to be fully restored first
        function tryRestoreVideoModel() {
            // ✅ ONLY restore if currently on VIDEO tab
            const activeTab = document.querySelector('.creation-tab.active');
            const currentMode = activeTab ? activeTab.getAttribute('data-mode') : 'image';
            
            if (currentMode !== 'video') {
                return;
            }
            
            const savedModelId = localStorage.getItem('selected_video_model_id');
            if (savedModelId) {
                const savedOption = Array.from(select.options).find(opt => opt.dataset.dbId == savedModelId);
                if (savedOption) {
                    select.value = savedOption.value;
                    select.dispatchEvent(new Event('change'));
                    return;
                }
            }
            
            // Fallback: Show info for first model and trigger change event (only if on video tab)
            updateModelInfo('video', models[0]);
            if (models.length > 0) {
                select.dispatchEvent(new Event('change'));
            }
        }
        
        // ✅ IMPROVED: Check multiple times for faster response
        let checkCount = 0;
        const maxChecks = 20; // 20 * 50ms = 1 second max wait
        
        function checkAndRestore() {
            if (window.dashboardStateRestored) {
                tryRestoreVideoModel();
                return;
            }
            
            checkCount++;
            if (checkCount < maxChecks) {
                setTimeout(checkAndRestore, 50); // Check every 50ms
            } else {
                console.warn('⚠️ Max wait time reached, forcing video model restore');
                tryRestoreVideoModel(); // Force restore after timeout
            }
        }
        
        // Start checking immediately
        setTimeout(checkAndRestore, 10);
        
    }
    
    // Update model info display
    function updateModelInfo(type, model) {
        if (!model) return;
        
        const infoDiv = document.getElementById(`${type}-model-info`);
        const nameEl = document.getElementById(`${type}-model-name`);
        const descEl = document.getElementById(`${type}-model-desc`);
        const badgeEl = document.getElementById(`${type}-model-badge`);
        
        if (!infoDiv) return;
        
        infoDiv.classList.remove('hidden');
        nameEl.textContent = `${model.name} • ${model.provider || 'AI Model'}`;
        
        // Description with pricing info
        const cost = parseFloat(model.cost || (type === 'image' ? 1 : 3)).toFixed(1);
        const falPrice = model.fal_price ? ` • FAL: $${parseFloat(model.fal_price).toFixed(4)}` : '';
        const duration = type === 'video' && model.max_duration ? ` • Max: ${model.max_duration}s` : '';
        
        descEl.innerHTML = `
            <div class="mb-1">${model.description || 'High-quality AI generation'}</div>
            <div class="text-xs font-mono font-semibold mt-1">
                <span class="text-yellow-400">💰 ${cost} credits</span> per ${type === 'image' ? 'image' : 'video'}${duration}${falPrice}
            </div>
        `;
        
        // Badge
        if (model.viral) {
            badgeEl.textContent = '⚡ VIRAL';
            badgeEl.className = 'text-xs px-2 py-1 rounded bg-pink-500/20 text-pink-300 font-semibold';
        } else if (model.trending) {
            badgeEl.textContent = '🔥 TRENDING';
            badgeEl.className = 'text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-300 font-semibold';
        } else {
            badgeEl.textContent = (model.quality || 'good').toUpperCase();
            badgeEl.className = 'text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-300 font-semibold';
        }
    }
    
    // Search models
    async function searchModels(query, type) {
        if (!query || query.length < 2) {
            // Reset to original models
            if (type === 'image') {
                populateImageModels(imageModels);
            } else {
                populateVideoModels(videoModels);
            }
            return;
        }
        
        try {
            const response = await fetch(`/api/models/search?q=${encodeURIComponent(query)}&type=${type}&limit=10`);
            const data = await response.json();
            
            if (data.success) {
                if (type === 'image') {
                    populateImageModels(data.models);
                } else {
                    populateVideoModels(data.models);
                }
            }
        } catch (error) {
            console.error('Error searching models:', error);
        }
    }
    
    // Debounce function
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
    
    // Image model search
    const imageSearchInput = document.getElementById('image-model-search');
    if (imageSearchInput) {
        const debouncedImageSearch = debounce((query) => {
            currentImageSearchTerm = query;
            searchModels(query, 'image');
        }, 300);
        
        imageSearchInput.addEventListener('input', (e) => {
            debouncedImageSearch(e.target.value.trim());
        });
    }
    
    // Video model search
    const videoSearchInput = document.getElementById('video-model-search');
    if (videoSearchInput) {
        const debouncedVideoSearch = debounce((query) => {
            currentVideoSearchTerm = query;
            searchModels(query, 'video');
        }, 300);
        
        videoSearchInput.addEventListener('input', (e) => {
            debouncedVideoSearch(e.target.value.trim());
        });
    }
    
    // Image model select change
    const imageModelSelect = document.getElementById('image-model-select');
    if (imageModelSelect) {
        // Trigger change event on first real user interaction
        let isFirstChange = true;
        
        imageModelSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            
            if (selectedOption && selectedOption.dataset.modelData) {
                const model = JSON.parse(selectedOption.dataset.modelData);
                
                updateModelInfo('image', model);
                
                // Notify generation script with retry
                const notifyGeneration = () => {
                    if (window.updateSelectedModel) {
                        if (window.addModelIfMissing) {
                            window.addModelIfMissing(model);
                        }
                        window.updateSelectedModel(model.id);
                        isFirstChange = false;
                    } else {
                        console.warn('⚠️ updateSelectedModel not available yet, retrying...');
                        setTimeout(notifyGeneration, 50);
                    }
                };
                notifyGeneration();
            }
        });
        
        // Auto-select first model ONLY if current mode is image
        // This happens AFTER page load, triggered by user opening the page
        setTimeout(() => {
            const currentMode = document.querySelector('.creation-tab.active')?.getAttribute('data-mode');
            if (currentMode === 'image' && imageModelSelect.options.length > 0) {
                imageModelSelect.dispatchEvent(new Event('change'));
            }
        }, 300);
    }
    
    // Video model select change
    const videoModelSelect = document.getElementById('video-model-select');
    if (videoModelSelect) {
        videoModelSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            
            if (selectedOption && selectedOption.dataset.modelData) {
                const model = JSON.parse(selectedOption.dataset.modelData);
                
                updateModelInfo('video', model);
                
                // Notify generation script with retry
                const notifyGeneration = () => {
                    if (window.updateSelectedModel) {
                        if (window.addModelIfMissing) {
                            window.addModelIfMissing(model);
                        }
                        window.updateSelectedModel(model.id);
                    } else {
                        console.warn('⚠️ updateSelectedModel not available yet, retrying...');
                        setTimeout(notifyGeneration, 50);
                    }
                };
                notifyGeneration();
            }
        });
    }
    
    // ===== SMART FILTER: Image Type Change =====
    const imageTypeSelect = document.getElementById('image-type');
    if (imageTypeSelect) {
        imageTypeSelect.addEventListener('change', function() {
            const selectedType = this.value;
            
            // Clear search when type changes
            if (imageSearchInput) {
                imageSearchInput.value = '';
                currentImageSearchTerm = '';
            }
            
            // Reload models based on type
            reloadImageModels(selectedType);
        });
        
        // ✅ IMPROVED: Wait for dashboard restoration, then load models
        function loadInitialImageModels() {
            const initialImageType = imageTypeSelect.value;
            if (initialImageType) {
                reloadImageModels(initialImageType);
            } else {
                console.warn('⚠️ No image type selected, loading all models');
                reloadImageModels('text-to-image'); // Default
            }
        }
        
        // Wait for dashboard restoration
        if (window.dashboardStateRestored) {
            setTimeout(loadInitialImageModels, 100);
        } else {
            window.addEventListener('dashboard-restored', function() {
                setTimeout(loadInitialImageModels, 100);
            }, { once: true });
            
            // Fallback timeout
            setTimeout(loadInitialImageModels, 500);
        }
    }
    
    // ===== SMART FILTER: Video Type Change =====
    const videoTypeSelect = document.getElementById('video-type');
    if (videoTypeSelect) {
        videoTypeSelect.addEventListener('change', function() {
            const selectedType = this.value;
            
            // Clear search when type changes
            if (videoSearchInput) {
                videoSearchInput.value = '';
                currentVideoSearchTerm = '';
            }
            
            // Reload models based on type
            reloadVideoModels(selectedType);
        });
        
        // ✅ IMPROVED: Wait for dashboard restoration, then load models
        function loadInitialVideoModels() {
            const initialVideoType = videoTypeSelect.value;
            if (initialVideoType) {
                reloadVideoModels(initialVideoType);
            } else {
                console.warn('⚠️ No video type selected, loading all models');
                reloadVideoModels('text-to-video'); // Default
            }
        }
        
        // Wait for dashboard restoration
        if (window.dashboardStateRestored) {
            setTimeout(loadInitialVideoModels, 100);
        } else {
            window.addEventListener('dashboard-restored', function() {
                setTimeout(loadInitialVideoModels, 100);
            }, { once: true });
            
            // Fallback timeout
            setTimeout(loadInitialVideoModels, 500);
        }
    }
    
    // Fallback models if API fails
    function showFallbackModels() {
        const imageSelect = document.getElementById('image-model-select');
        const videoSelect = document.getElementById('video-model-select');
        
        if (imageSelect) {
            imageSelect.innerHTML = `
                <option value="fal-ai/flux-pro">FLUX Pro 🔥</option>
                <option value="fal-ai/flux-realism">FLUX Realism 🔥</option>
                <option value="fal-ai/ideogram-v2">Ideogram v2 ⭐</option>
                <option value="fal-ai/recraft-v3">Recraft V3 🔥</option>
                <option value="fal-ai/stable-diffusion-xl">Stable Diffusion XL</option>
            `;
        }
        
        if (videoSelect) {
            videoSelect.innerHTML = `
                <option value="fal-ai/kling-video/v1/standard/text-to-video">Kling AI v1 🔥</option>
                <option value="fal-ai/minimax-video">MiniMax Video 🔥</option>
                <option value="fal-ai/runway-gen3">Runway Gen-3 ⭐</option>
                <option value="fal-ai/luma-dream-machine">Luma Dream Machine 🔥</option>
                <option value="fal-ai/pika-labs">Pika Labs ⭐</option>
            `;
        }
    }
    
    // Load models on page load
    await loadModels();
    
});

