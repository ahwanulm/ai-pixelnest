/**
 * Generation Loading Card Handler
 * 
 * Creates beautiful loading cards with pixel art animation and real-time progress
 * Shows percentage, status updates, and cool animations
 * 
 * Usage: Call createLoadingCard() when generation starts
 */

// Create loading card with pixel animation
function createLoadingCard(generationType = 'image', options = {}) {
    const card = document.createElement('div');
    card.className = 'loading-card bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-sm rounded-xl overflow-hidden border border-blue-500/50 transition-all duration-300 shadow-lg shadow-blue-500/20';
    card.setAttribute('data-loading', 'true');
    
    // Check if auto-prompt is active
    const isAutoPromptActive = options.autoPromptActive || false;
    
    // ✨ Support untuk semua tipe: image, video, audio
    let iconSvg, typeText;
    if (generationType === 'video') {
        iconSvg = '<img src="/assets/icons/generation-video.svg" alt="Video" class="w-full h-full">';
        typeText = 'Video';
    } else if (generationType === 'audio') {
        iconSvg = '<img src="/assets/icons/generation-audio.svg" alt="Audio" class="w-full h-full">';
        typeText = 'Audio';
    } else {
        iconSvg = '<img src="/assets/icons/generation-image.svg" alt="Image" class="w-full h-full">';
        typeText = 'Image';
    }
    
    card.innerHTML = `
        <!-- Desktop Layout -->
        <div class="hidden md:grid md:grid-cols-[350px_1fr] h-[200px]">
            <!-- Left: Pixel Animation -->
            <div class="relative bg-black/30 flex items-center justify-center overflow-hidden">
                <!-- Animated Pixel Grid Background -->
                <div class="absolute inset-0 pixel-grid-bg opacity-20"></div>
                
                <!-- Main Animation Container -->
                <div class="relative z-10 flex flex-col items-center justify-center">
                    <!-- Rotating Pixel Icon -->
                    <div class="pixel-spinner mb-4">
                        <div class="pixel-box"></div>
                    </div>
                    
                    <!-- Loading Text -->
                    <div class="text-blue-400 font-semibold text-sm mb-2 animate-pulse">
                        Generating...
                    </div>
                    
                    <!-- Percentage -->
                    <div class="text-3xl font-bold text-white loading-percentage">0%</div>
                </div>
                
                <!-- Floating Particles -->
                <div class="absolute inset-0 pointer-events-none">
                    <div class="particle particle-1"></div>
                    <div class="particle particle-2"></div>
                    <div class="particle particle-3"></div>
                </div>
            </div>
            
            <!-- Right: Info & Progress -->
            <div class="p-6 flex flex-col justify-between">
                <div>
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                            ${iconSvg}
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-white">Generating ${typeText}</h3>
                            <p class="text-sm text-gray-400 loading-status">Initializing...</p>
                        </div>
                    </div>
                    
                    <!-- Progress Bar -->
                    <div class="mb-4">
                        <div class="flex items-center justify-between text-xs text-gray-400 mb-2">
                            <span class="loading-step">Step 1 of 3</span>
                            <span class="loading-time">Est. 10s</span>
                        </div>
                        <div class="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                            <div class="loading-progress-bar h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-pink-500 rounded-full transition-all duration-500 ease-out" style="width: 0%"></div>
                        </div>
                    </div>
                    
                    <!-- Info Tags -->
                    <div class="flex flex-wrap gap-2">
                        ${isAutoPromptActive ? `
                        <span class="px-3 py-1 bg-gradient-to-r from-orange-500/20 to-violet-500/20 border border-orange-500/30 rounded-full text-xs text-orange-300 relative overflow-hidden">
                            <span class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></span>
                            <i class="fas fa-wand-magic-sparkles mr-1 animate-pulse"></i> 
                            <span class="relative z-10">Auto-Enhanced Prompt</span>
                        </span>` : ''}
                        <span class="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs text-blue-300">
                            <i class="fas fa-magic mr-1"></i> AI Processing
                        </span>
                        <span class="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs text-blue-300">
                            <i class="fas fa-cloud mr-1"></i> Cloud Render
                        </span>
                    </div>
                </div>
                
                <!-- Bottom Info -->
                <div class="flex items-center justify-between text-xs text-gray-500">
                    <span><i class="fas fa-clock mr-1"></i> Started ${new Date().toLocaleTimeString('id-ID')}</span>
                    <span class="loading-eta">Processing...</span>
                </div>
            </div>
        </div>
        
        <!-- Mobile Layout -->
        <div class="md:hidden">
            <!-- Pixel Animation Area -->
            <div class="relative h-48 bg-black/30 flex items-center justify-center overflow-hidden">
                <!-- Animated Pixel Grid Background -->
                <div class="absolute inset-0 pixel-grid-bg opacity-20"></div>
                
                <!-- Main Animation -->
                <div class="relative z-10 flex flex-col items-center justify-center">
                    <div class="pixel-spinner mb-3">
                        <div class="pixel-box"></div>
                    </div>
                    <div class="text-blue-400 font-semibold text-sm mb-2 animate-pulse">
                        Generating...
                    </div>
                    <div class="text-2xl font-bold text-white loading-percentage">0%</div>
                </div>
                
                <!-- Floating Particles -->
                <div class="absolute inset-0 pointer-events-none">
                    <div class="particle particle-1"></div>
                    <div class="particle particle-2"></div>
                    <div class="particle particle-3"></div>
                </div>
            </div>
            
            <!-- Info Section -->
            <div class="p-4">
                <div class="flex items-center gap-2 mb-3">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                        ${iconSvg}
                    </div>
                    <div class="flex-1">
                        <h3 class="text-sm font-bold text-white">Generating ${typeText}</h3>
                        <p class="text-xs text-gray-400 loading-status">Initializing...</p>
                    </div>
                </div>
                
                <!-- Progress Bar -->
                <div class="mb-3">
                    <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span class="loading-step">Step 1 of 3</span>
                        <span class="loading-time">Est. 10s</span>
                    </div>
                    <div class="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                        <div class="loading-progress-bar h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-pink-500 rounded-full transition-all duration-500 ease-out" style="width: 0%"></div>
                    </div>
                </div>
                
                <!-- Tags -->
                <div class="flex gap-2 text-xs">
                    <span class="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300">
                        <i class="fas fa-magic mr-1"></i> AI
                    </span>
                    <span class="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300">
                        <i class="fas fa-cloud mr-1"></i> Cloud
                    </span>
                    <span class="loading-eta text-gray-500 ml-auto">Processing...</span>
                </div>
            </div>
        </div>
    `;
    
    // Start animation
    startPixelAnimation(card);
    
    return card;
}

// Start pixel animation
function startPixelAnimation(card) {
    // Clear any existing interval to avoid duplicates
    if (card.dataset.progressInterval) {
        clearInterval(parseInt(card.dataset.progressInterval));
    }
    
    // Simulate progress
    let progress = 0;
    const progressBar = card.querySelector('.loading-progress-bar');
    const percentage = card.querySelectorAll('.loading-percentage');
    const status = card.querySelectorAll('.loading-status');
    const step = card.querySelectorAll('.loading-step');
    const eta = card.querySelectorAll('.loading-eta');
    
    const stages = [
        { progress: 15, status: 'Sending to AI...', step: 'Step 1 of 3', eta: '~8s remaining' },
        { progress: 30, status: 'AI Processing...', step: 'Step 2 of 3', eta: '~6s remaining' },
        { progress: 50, status: 'Rendering pixels...', step: 'Step 2 of 3', eta: '~4s remaining' },
        { progress: 70, status: 'Applying effects...', step: 'Step 3 of 3', eta: '~2s remaining' },
        { progress: 85, status: 'Finalizing...', step: 'Step 3 of 3', eta: '~1s remaining' },
        { progress: 95, status: 'Almost done...', step: 'Step 3 of 3', eta: 'Almost there!' }
    ];
    
    let stageIndex = 0;
    
    const interval = setInterval(() => {
        if (stageIndex < stages.length) {
            const stage = stages[stageIndex];
            progress = stage.progress;
            
            // Update UI
            if (progressBar) progressBar.style.width = `${progress}%`;
            percentage.forEach(el => el.textContent = `${progress}%`);
            status.forEach(el => el.textContent = stage.status);
            step.forEach(el => el.textContent = stage.step);
            eta.forEach(el => el.textContent = stage.eta);
            
            stageIndex++;
        }
    }, 1500);
    
    // Store interval for cleanup
    card.dataset.progressInterval = interval;
}

// Update loading progress (can be called from external source)
function updateLoadingProgress(card, progress, statusText = null, stepText = null) {
    const progressBar = card.querySelector('.loading-progress-bar');
    const percentage = card.querySelectorAll('.loading-percentage');
    const status = card.querySelectorAll('.loading-status');
    const step = card.querySelectorAll('.loading-step');
    
    if (progressBar) progressBar.style.width = `${progress}%`;
    percentage.forEach(el => el.textContent = `${progress}%`);
    if (statusText) status.forEach(el => el.textContent = statusText);
    if (stepText) step.forEach(el => el.textContent = stepText);
}

// Remove loading card with animation
function removeLoadingCard(card) {
    // Clear interval
    if (card.dataset.progressInterval) {
        clearInterval(parseInt(card.dataset.progressInterval));
    }
    
    // Fade out animation
    card.style.transition = 'all 0.5s ease-out';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        card.remove();
    }, 500);
}

// Complete loading (transition to success)
function completeLoading(card) {
    const progressBar = card.querySelector('.loading-progress-bar');
    const percentage = card.querySelectorAll('.loading-percentage');
    const status = card.querySelectorAll('.loading-status');
    const eta = card.querySelectorAll('.loading-eta');
    
    // Update to 100%
    if (progressBar) progressBar.style.width = '100%';
    percentage.forEach(el => {
        el.textContent = '100%';
        el.classList.add('text-green-400');
    });
    status.forEach(el => {
        el.textContent = '✅ Complete!';
        el.classList.add('text-green-400');
    });
    eta.forEach(el => el.textContent = 'Done!');
    
    // Change border color to green
    card.classList.remove('border-blue-500/50');
    card.classList.add('border-green-500/50', 'shadow-green-500/20');
    
    // Remove after short delay
    setTimeout(() => {
        removeLoadingCard(card);
    }, 1000);
}

// Make functions globally available
window.createLoadingCard = createLoadingCard;
window.startPixelAnimation = startPixelAnimation;
window.updateLoadingProgress = updateLoadingProgress;
window.removeLoadingCard = removeLoadingCard;
window.completeLoading = completeLoading;

console.log('✅ Generation Loading Card handler loaded');

