/**
 * Public Gallery Interactions
 * Handles likes, bookmarks, views, and detail modal
 */

// ✨ Helper function to clean model names (remove fal.ai and fal.id references)
function cleanModelName(modelName) {
    if (!modelName) return '';
    
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

// Handle like
async function handleLike(sharedId) {
    const button = document.querySelector(`[data-generation-id="${sharedId}"][data-liked]`);
    if (!button) return;
    
    const isLiked = button.getAttribute('data-liked') === 'true';
    
    try {
        const response = await fetch('/api/public-gallery/like', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sharedId: parseInt(sharedId) })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Toggle like state
            if (data.action === 'liked') {
                button.setAttribute('data-liked', 'true');
                button.classList.add('text-red-400');
                button.classList.remove('text-white');
            } else {
                button.setAttribute('data-liked', 'false');
                button.classList.remove('text-red-400');
                button.classList.add('text-white');
            }
            
            // Update like count in card
            updateLikeCount(sharedId, data.action === 'liked' ? 1 : -1);
        }
    } catch (error) {
        console.error('Error liking generation:', error);
        showNotification('Failed to like generation', 'error');
    }
}

// Handle bookmark
async function handleBookmark(sharedId) {
    const button = document.querySelector(`[data-generation-id="${sharedId}"][data-bookmarked]`);
    if (!button) return;
    
    const isBookmarked = button.getAttribute('data-bookmarked') === 'true';
    
    try {
        const response = await fetch('/api/public-gallery/bookmark', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sharedId: parseInt(sharedId) })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Toggle bookmark state
            if (data.action === 'bookmarked') {
                button.setAttribute('data-bookmarked', 'true');
                button.classList.add('text-yellow-400');
                button.classList.remove('text-white');
                showNotification('Added to bookmarks', 'success');
            } else {
                button.setAttribute('data-bookmarked', 'false');
                button.classList.remove('text-yellow-400');
                button.classList.add('text-white');
                showNotification('Removed from bookmarks', 'success');
            }
        }
    } catch (error) {
        console.error('Error bookmarking generation:', error);
        showNotification('Failed to bookmark generation', 'error');
    }
}

// Update like count in card
function updateLikeCount(sharedId, delta) {
    const card = document.querySelector(`[onclick*="openDetailModal('${sharedId}')"]`);
    if (!card) return;
    
    const likeCountSpan = card.querySelector('.fa-heart').closest('span');
    if (likeCountSpan) {
        const currentCount = parseInt(likeCountSpan.textContent.trim().split(' ')[1] || '0');
        const newCount = Math.max(0, currentCount + delta);
        likeCountSpan.innerHTML = `<i class="fas fa-heart mr-1"></i> ${newCount}`;
    }
}

// Increment view when opening detail modal
async function incrementView(sharedId) {
    try {
        await fetch('/api/public-gallery/view', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sharedId: parseInt(sharedId) })
        });
    } catch (error) {
    }
}

// Open detail modal
function openDetailModal(sharedId) {
    // Find the generation data from the card
    const card = document.querySelector(`[onclick*="openDetailModal('${sharedId}')"]`);
    if (!card) return;
    
    // Increment view count
    incrementView(sharedId);
    
    // Extract data from card with better selectors
    const mediaElement = card.querySelector('video, img');
    const mediaUrl = mediaElement ? mediaElement.src : '';
    const isVideo = mediaElement && mediaElement.tagName === 'VIDEO';
    
    // Get prompt from hover overlay or metadata bar
    const promptElement = card.querySelector('.gallery-overlay .line-clamp-3, .line-clamp-2');
    const prompt = promptElement?.textContent.trim() || 'Tidak ada deskripsi';
    
    // Get creator info from metadata bar - improved detection
    const metadataBar = card.querySelector('.absolute.bottom-0');
    const creatorContainer = metadataBar?.querySelector('.flex.items-center.gap-1\\.5.min-w-0');
    
    // Check if anonymous (has user-secret icon)
    const isAnonymous = creatorContainer?.querySelector('.fa-user-secret') !== null;
    
    let creator = 'Anonymous';
    if (!isAnonymous) {
        // Get creator name from span (not anonymous)
        const creatorSpan = creatorContainer?.querySelector('.text-gray-300.text-\\[10px\\]');
        creator = creatorSpan?.textContent.trim() || 'Anonymous';
    }
    
    // Get stats from metadata bar - more robust extraction
    let views = '0';
    let likes = '0';
    
    // Find the stats container (right side of metadata bar)
    const statsContainer = metadataBar?.querySelector('.flex.items-center.gap-2.text-gray-400');
    
    if (statsContainer) {
        // Get all stat items (views and likes)
        const statItems = statsContainer.querySelectorAll('span.flex.items-center');
        
        statItems?.forEach(item => {
            const icon = item.querySelector('i');
            const valueSpan = item.querySelector('span:last-child');
            const value = valueSpan?.textContent.trim() || '0';
            
            if (icon) {
                if (icon.classList.contains('fa-eye')) {
                    views = value;
                } else if (icon.classList.contains('fa-heart')) {
                    likes = value;
                }
            }
        });
    }
    
    
    // Get model info
    const modelBadge = card.querySelector('.bg-blue-500\\/20');
    const rawModel = modelBadge?.textContent.trim() || '';
    const model = cleanModelName(rawModel); // Clean model name from fal.ai/fal.id references
    
    // Get dimensions
    const dimensionBadge = card.querySelector('.bg-blue-500\\/20');
    const dimensions = dimensionBadge?.textContent.trim() || '';
    
    const type = isVideo ? 'VIDEO' : 'GAMBAR';
    
    // Create modal content - Instagram Style
    const modal = document.getElementById('detail-modal');
    if (!modal) return;
    
    modal.innerHTML = `
        <div class="bg-black rounded-none lg:rounded-2xl max-w-6xl w-full h-screen lg:h-[90vh] overflow-hidden flex flex-col lg:flex-row shadow-2xl animate-fade-in" onclick="event.stopPropagation()">
            
            <!-- Left: Media Container (Instagram Style - Black Background) -->
            <div class="relative flex-1 bg-black flex items-center justify-center h-[60vh] lg:h-auto">
                <!-- Close Button (Top Right - Mobile & Desktop) -->
                <button id="close-modal-btn" class="absolute top-3 right-3 z-50 w-10 h-10 bg-black/60 backdrop-blur-md hover:bg-black/80 rounded-full flex items-center justify-center transition-all active:scale-90 border border-white/20">
                    <i class="fas fa-times text-white text-lg"></i>
                </button>
                
                <!-- Media Content -->
                <div class="relative w-full h-full flex items-center justify-center p-0">
                    ${isVideo ? `
                        <video 
                            src="${mediaUrl}" 
                            controls 
                            autoplay 
                            loop 
                            class="w-full h-full object-contain"
                            style="max-height: 100%;">
                            Browser tidak mendukung video.
                        </video>
                    ` : `
                        <img 
                            src="${mediaUrl}" 
                            alt="${prompt}" 
                            class="w-full h-full object-contain select-none"
                            style="max-height: 100%;">
                    `}
                </div>
                
                <!-- Navigation Arrows (Desktop Only) -->
                <button class="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/60 backdrop-blur-md hover:bg-black/80 rounded-full items-center justify-center transition-all active:scale-90 border border-white/20 opacity-0 hover:opacity-100">
                    <i class="fas fa-chevron-left text-white text-xl"></i>
                </button>
                <button class="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/60 backdrop-blur-md hover:bg-black/80 rounded-full items-center justify-center transition-all active:scale-90 border border-white/20 opacity-0 hover:opacity-100">
                    <i class="fas fa-chevron-right text-white text-xl"></i>
                </button>
            </div>
            
            <!-- Right: Info Panel (Instagram Style) -->
            <div class="w-full lg:w-[400px] bg-zinc-950 flex flex-col border-t lg:border-t-0 lg:border-l border-zinc-800 max-h-[40vh] lg:max-h-none">
                
                <!-- Header: Creator Info (Compact for Mobile) -->
                <div class="flex items-center justify-between px-3 lg:px-4 py-2 lg:py-3 border-b border-zinc-800">
                    <div class="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
                        ${!isAnonymous ? `
                            <div class="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-xs lg:text-sm font-bold flex-shrink-0">
                                ${creator.charAt(0).toUpperCase()}
                            </div>
                            <div class="min-w-0">
                                <p class="text-white font-semibold text-xs lg:text-sm truncate">${creator}</p>
                                <p class="text-gray-400 text-[10px] lg:text-xs">Creator</p>
                            </div>
                        ` : `
                            <div class="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-user-secret text-gray-400 text-xs"></i>
                            </div>
                            <div>
                                <p class="text-white font-semibold text-xs lg:text-sm">Anonymous</p>
                                <p class="text-gray-400 text-[10px] lg:text-xs">Creator</p>
                            </div>
                        `}
                    </div>
                    <button class="text-violet-400 hover:text-violet-300 text-xs font-semibold transition-colors hidden lg:block">
                        • • •
                    </button>
                </div>
                
                <!-- Scrollable Content Area -->
                <div class="flex-1 overflow-y-auto" style="scrollbar-width: thin; scrollbar-color: rgba(139, 92, 246, 0.3) transparent;">
                    
                    <!-- Prompt Section (Compact for Mobile) -->
                    <div class="px-3 lg:px-4 py-3 lg:py-4 border-b border-zinc-800">
                        <div class="flex items-start gap-2 lg:gap-3">
                            ${!isAnonymous ? `
                                <div class="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-[10px] lg:text-xs font-bold flex-shrink-0">
                                    ${creator.charAt(0).toUpperCase()}
                                </div>
                            ` : `
                                <div class="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                    <i class="fas fa-user-secret text-gray-400 text-[10px] lg:text-xs"></i>
                                </div>
                            `}
                            <div class="flex-1 min-w-0">
                                <p class="text-white text-xs lg:text-sm leading-relaxed">
                                    <span class="font-semibold">${isAnonymous ? 'Anonymous' : creator}</span> 
                                    <span id="prompt-text" class="text-gray-300" data-full-prompt="${prompt.replace(/"/g, '&quot;')}">
                                        ${prompt.length > 150 ? prompt.substring(0, 150) + '...' : prompt}
                                    </span>
                                    ${prompt.length > 150 ? `
                                        <button id="show-more-btn" class="text-violet-400 hover:text-violet-300 font-medium ml-1 transition-colors text-xs lg:text-sm">
                                            more
                                        </button>
                                    ` : ''}
                                </p>
                                <button id="copy-prompt-caption-btn" data-prompt="${prompt.replace(/"/g, '&quot;')}" class="mt-1.5 lg:mt-2 text-[10px] lg:text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1">
                                    <i class="far fa-copy text-xs"></i> Copy prompt
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Technical Details (Compact for Mobile) -->
                    <div class="px-3 lg:px-4 py-3 lg:py-4 space-y-2 lg:space-y-3 border-b border-zinc-800">
                        <h3 class="text-[10px] lg:text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 lg:gap-2">
                            <i class="fas fa-cog text-xs"></i> Technical Details
                        </h3>
                        <div class="space-y-1.5 lg:space-y-2">
                            ${model ? `
                                <div class="flex items-center justify-between py-1.5 lg:py-2 px-2 lg:px-3 bg-zinc-900/50 rounded-lg">
                                    <span class="text-[10px] lg:text-xs text-gray-400">Model</span>
                                    <span class="text-[10px] lg:text-xs text-white font-semibold truncate max-w-[150px] lg:max-w-none">${model}</span>
                                </div>
                            ` : ''}
                            ${dimensions ? `
                                <div class="flex items-center justify-between py-1.5 lg:py-2 px-2 lg:px-3 bg-zinc-900/50 rounded-lg">
                                    <span class="text-[10px] lg:text-xs text-gray-400">Dimensions</span>
                                    <span class="text-[10px] lg:text-xs text-white font-semibold">${dimensions}</span>
                                </div>
                            ` : ''}
                            <div class="flex items-center justify-between py-1.5 lg:py-2 px-2 lg:px-3 bg-zinc-900/50 rounded-lg">
                                <span class="text-[10px] lg:text-xs text-gray-400">Type</span>
                                <span class="text-[10px] lg:text-xs text-white font-semibold">${type}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Stats Section (Compact for Mobile) -->
                    <div class="px-3 lg:px-4 py-3 lg:py-4 border-b border-zinc-800">
                        <div class="flex items-center justify-around">
                            <div class="text-center">
                                <p id="likes-count" class="text-white font-bold text-base lg:text-lg">${likes.toLocaleString()}</p>
                                <p class="text-gray-400 text-[10px] lg:text-xs">Likes</p>
                            </div>
                            <div class="w-px h-8 lg:h-10 bg-zinc-800"></div>
                            <div class="text-center">
                                <p id="views-count" class="text-white font-bold text-base lg:text-lg">${views.toLocaleString()}</p>
                                <p class="text-gray-400 text-[10px] lg:text-xs">Views</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Footer: Action Buttons (Instagram Style - Compact for Mobile) -->
                <div class="px-3 lg:px-4 py-2.5 lg:py-3 border-t border-zinc-800 bg-zinc-950 space-y-2 lg:space-y-3">
                    <!-- Like, Comment, Share Row -->
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3 lg:gap-4">
                            <!-- Like Button -->
                            <button id="floating-like-btn" data-shared-id="${sharedId}" data-likes="${likes}" class="group transition-all duration-200 active:scale-90">
                                <i class="far fa-heart text-white text-xl lg:text-2xl group-hover:scale-110 transition-transform"></i>
                            </button>
                            
                            <!-- Comment Button (Disabled for now) -->
                            <button class="group transition-all duration-200 active:scale-90 hidden lg:block" disabled>
                                <i class="far fa-comment text-gray-600 text-xl lg:text-2xl"></i>
                            </button>
                            
                            <!-- Share Button -->
                            <button id="copy-prompt-btn" data-prompt="${prompt.replace(/"/g, '&quot;')}" class="group transition-all duration-200 active:scale-90">
                                <i class="far fa-paper-plane text-white text-xl lg:text-2xl group-hover:scale-110 transition-transform"></i>
                            </button>
                        </div>
                        
                        <!-- Bookmark Button -->
                        <button id="floating-bookmark-btn" data-shared-id="${sharedId}" class="group transition-all duration-200 active:scale-90">
                            <i class="far fa-bookmark text-white text-xl lg:text-2xl group-hover:scale-110 transition-transform"></i>
                        </button>
                    </div>
                    
                    <!-- Action Buttons Row -->
                    <div class="grid grid-cols-2 gap-2">
                        ${window.location.pathname !== '/dashboard' ? `
                            <a href="/dashboard" class="px-3 lg:px-4 py-2 lg:py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-center rounded-lg text-xs lg:text-sm font-semibold transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-1.5 lg:gap-2">
                                <i class="fas fa-magic text-xs lg:text-sm"></i> 
                                <span class="hidden sm:inline">Create Similar</span>
                                <span class="sm:hidden">Create</span>
                            </a>
                        ` : `
                            <button id="copy-prompt-btn-2" data-prompt="${prompt.replace(/"/g, '&quot;')}" class="px-3 lg:px-4 py-2 lg:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs lg:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 lg:gap-2 active:scale-95">
                                <i class="fas fa-copy text-xs lg:text-sm"></i> 
                                <span class="hidden sm:inline">Copy Prompt</span>
                                <span class="sm:hidden">Copy</span>
                            </button>
                        `}
                        
                        <a href="${mediaUrl}" download class="px-3 lg:px-4 py-2 lg:py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg text-xs lg:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 lg:gap-2 active:scale-95">
                            <i class="fas fa-download text-xs lg:text-sm"></i> Download
                        </a>
                    </div>
                    
                    <!-- Report Button (Hidden on Mobile for space) -->
                    <button id="report-btn" data-shared-id="${sharedId}" class="hidden lg:block w-full px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-gray-400 hover:text-red-400 rounded-lg text-xs font-medium transition-all border border-zinc-800 active:scale-95">
                        <i class="fas fa-flag mr-1"></i> Report Content
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    
    // Attach event listeners after modal is created
    setTimeout(() => {
        const closeBtn = document.getElementById('close-modal-btn');
        const copyBtn = document.getElementById('copy-prompt-btn');
        const copyBtn2 = document.getElementById('copy-prompt-btn-2');
        const copyCaptionBtn = document.getElementById('copy-prompt-caption-btn');
        const reportBtn = document.getElementById('report-btn');
        const floatingLikeBtn = document.getElementById('floating-like-btn');
        const floatingBookmarkBtn = document.getElementById('floating-bookmark-btn');
        const showMoreBtn = document.getElementById('show-more-btn');
        const promptText = document.getElementById('prompt-text');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                closeDetailModal();
            });
        }
        
        if (copyBtn) {
            copyBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                const promptText = this.getAttribute('data-prompt');
                copyPrompt(promptText);
            });
        }
        
        if (copyBtn2) {
            copyBtn2.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                const promptText = this.getAttribute('data-prompt');
                copyPrompt(promptText);
            });
        }
        
        if (copyCaptionBtn) {
            copyCaptionBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                const promptText = this.getAttribute('data-prompt');
                copyPrompt(promptText);
            });
        }
        
        // Show More/Less button for prompt
        if (showMoreBtn && promptText) {
            let isExpanded = false;
            const fullPrompt = promptText.getAttribute('data-full-prompt');
            const truncatedPrompt = fullPrompt.substring(0, 150) + '...';
            
            showMoreBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                
                isExpanded = !isExpanded;
                
                if (isExpanded) {
                    // Show full prompt
                    promptText.textContent = fullPrompt;
                    showMoreBtn.textContent = 'less';
                    promptText.style.transition = 'all 0.3s ease';
                } else {
                    // Show truncated prompt
                    promptText.textContent = truncatedPrompt;
                    showMoreBtn.textContent = 'more';
                }
            });
        }
        
        if (reportBtn) {
            reportBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                const sharedId = this.getAttribute('data-shared-id');
                reportGeneration(sharedId);
            });
        }
        
        if (floatingLikeBtn) {
            floatingLikeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                const sharedId = this.getAttribute('data-shared-id');
                toggleLikeInstagramStyle(this, sharedId);
            });
        }
        
        if (floatingBookmarkBtn) {
            floatingBookmarkBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                const sharedId = this.getAttribute('data-shared-id');
                toggleBookmarkInstagramStyle(this, sharedId);
            });
        }
    }, 50);
}

// Close detail modal with smooth animation
function closeDetailModal() {
    const modal = document.getElementById('detail-modal');
    if (modal) {
        // Add fade-out animation
        const modalContent = modal.querySelector('div');
        if (modalContent) {
            modalContent.style.animation = 'fade-out 0.2s ease-out';
        }
        
        // Hide modal after animation
        setTimeout(() => {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
            
            // Stop any playing video
            const video = modal.querySelector('video');
            if (video) {
                video.pause();
                video.currentTime = 0;
            }
            
            // Clear modal content
            modal.innerHTML = '';
        }, 200);
    }
}

// Make functions globally available
window.closeDetailModal = closeDetailModal;

// Copy prompt to clipboard
function copyPrompt(prompt) {
    
    // Decode HTML entities if present
    const decodedPrompt = prompt.replace(/&quot;/g, '"')
                                .replace(/&#39;/g, "'")
                                .replace(/&amp;/g, "&");
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(decodedPrompt).then(() => {
            showNotification('✅ Prompt berhasil disalin!', 'success');
        }).catch((err) => {
            console.error('❌ Clipboard error:', err);
            // Fallback method
            fallbackCopyToClipboard(decodedPrompt);
        });
    } else {
        // Fallback for older browsers
        fallbackCopyToClipboard(decodedPrompt);
    }
}

// Fallback copy method for older browsers
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('✅ Prompt berhasil disalin!', 'success');
        } else {
            console.error('❌ Fallback copy failed');
            showNotification('Gagal menyalin prompt', 'error');
        }
    } catch (err) {
        console.error('❌ Fallback error:', err);
        showNotification('Gagal menyalin prompt', 'error');
    }
    
    document.body.removeChild(textArea);
}

// Report generation
async function reportGeneration(sharedId) {
    const reason = prompt('Harap sebutkan alasan pelaporan konten ini:');
    if (!reason) return;
    
    try {
        const response = await fetch('/api/public-gallery/report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sharedId: parseInt(sharedId),
                reason: reason,
                description: ''
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('✅ Laporan berhasil dikirim', 'success');
            closeDetailModal();
        } else {
            showNotification(data.message || 'Gagal mengirim laporan', 'error');
        }
    } catch (error) {
        console.error('Error reporting generation:', error);
        showNotification('Gagal mengirim laporan', 'error');
    }
}

// Toggle Like - Instagram Style (for new modal)
async function toggleLikeInstagramStyle(button, sharedId) {
    try {
        const response = await fetch('/api/public-gallery/like', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sharedId: parseInt(sharedId)
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const isLiked = data.action === 'liked';
            const icon = button.querySelector('i');
            
            // Animate icon
            if (icon) {
                if (isLiked) {
                    // Change to filled heart with red color
                    icon.classList.remove('far');
                    icon.classList.add('fas', 'text-red-500');
                    icon.style.animation = 'heartBeat 0.5s ease';
                } else {
                    // Change to outline heart with white color
                    icon.classList.remove('fas', 'text-red-500');
                    icon.classList.add('far', 'text-white');
                }
                
                // Remove animation after it's done
                setTimeout(() => {
                    icon.style.animation = '';
                }, 500);
            }
            
            // Update like count
            const currentLikes = parseInt(button.getAttribute('data-likes') || '0');
            const newLikes = isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
            button.setAttribute('data-likes', newLikes);
            
            // Update likes count in modal
            const likesCountEl = document.getElementById('likes-count');
            if (likesCountEl) {
                likesCountEl.textContent = newLikes.toLocaleString();
                likesCountEl.parentElement.classList.add('scale-110');
                setTimeout(() => {
                    likesCountEl.parentElement.classList.remove('scale-110');
                }, 200);
            }
            
            // Show subtle notification
            if (isLiked) {
                showNotification('❤️ Liked', 'success');
            }
        } else {
            showNotification(data.message || 'Failed to like', 'error');
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        showNotification('Failed to like', 'error');
    }
}

// Toggle Bookmark - Instagram Style (for new modal)
async function toggleBookmarkInstagramStyle(button, sharedId) {
    try {
        const response = await fetch('/api/public-gallery/bookmark', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sharedId: parseInt(sharedId)
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const isBookmarked = data.action === 'bookmarked';
            const icon = button.querySelector('i');
            
            // Animate icon
            if (icon) {
                if (isBookmarked) {
                    // Change to filled bookmark
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                    icon.style.animation = 'heartBeat 0.3s ease';
                } else {
                    // Change to outline bookmark
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                }
                
                // Remove animation after it's done
                setTimeout(() => {
                    icon.style.animation = '';
                }, 300);
            }
            
            // Show subtle notification
            if (isBookmarked) {
                showNotification('🔖 Saved', 'success');
            } else {
                showNotification('Removed from saved', 'info');
            }
        } else {
            showNotification(data.message || 'Failed to bookmark', 'error');
        }
    } catch (error) {
        console.error('Error toggling bookmark:', error);
        showNotification('Failed to bookmark', 'error');
    }
}

// Toggle Like (Legacy - for gallery cards)
async function toggleLike(button, sharedId) {
    
    try {
        const response = await fetch('/api/public-gallery/like', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sharedId: parseInt(sharedId)
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Get current like count from button or modal
            const currentLikes = parseInt(button.getAttribute('data-likes') || '0');
            const isLiked = data.action === 'liked'; // Assuming API returns action
            const newLikes = isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
            
            // Update button data attribute
            button.setAttribute('data-likes', newLikes);
            
            // Update likes count in modal (desktop)
            const likesCountEl = document.getElementById('likes-count');
            if (likesCountEl) {
                likesCountEl.textContent = newLikes.toLocaleString();
                // Add pulse animation to count
                likesCountEl.classList.add('animate-pulse', 'scale-110');
                setTimeout(() => {
                    likesCountEl.classList.remove('animate-pulse', 'scale-110');
                }, 500);
            }
            
            // Update likes count in mobile stats bar
            const mobileLikesCountEl = document.getElementById('mobile-likes-count');
            if (mobileLikesCountEl) {
                mobileLikesCountEl.textContent = newLikes.toLocaleString();
                // Add pulse animation to mobile count
                mobileLikesCountEl.classList.add('animate-pulse', 'scale-110');
                setTimeout(() => {
                    mobileLikesCountEl.classList.remove('animate-pulse', 'scale-110');
                }, 500);
            }
            
            // Update badge count (Instagram style)
            const badgeEl = document.getElementById('like-count-badge');
            if (badgeEl) {
                if (newLikes > 0) {
                    badgeEl.textContent = newLikes > 999 ? '999+' : newLikes.toLocaleString();
                    badgeEl.classList.remove('hidden');
                } else {
                    badgeEl.classList.add('hidden');
                }
            } else if (newLikes > 0) {
                // Create badge if it doesn't exist (Instagram style)
                const badgeHTML = `<span id="like-count-badge" class="text-white text-sm font-semibold drop-shadow-lg bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20">${newLikes > 999 ? '999+' : newLikes.toLocaleString()}</span>`;
                button.insertAdjacentHTML('beforeend', badgeHTML);
            }
            
            // Button animation (Instagram style - subtle)
            const heartIcon = button.querySelector('i');
            if (heartIcon && isLiked) {
                // Heart fill animation
                heartIcon.classList.add('animate-ping');
                setTimeout(() => heartIcon.classList.remove('animate-ping'), 300);
            }
            
            // Show notification
            if (isLiked) {
                showNotification('❤️ Liked!', 'success');
            } else {
                showNotification('💔 Unliked', 'info');
            }
            
        } else {
            showNotification(data.message || 'Gagal like', 'error');
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        showNotification('Gagal like', 'error');
    }
}

// Toggle Bookmark
async function toggleBookmark(button, sharedId) {
    
    try {
        const response = await fetch('/api/public-gallery/bookmark', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sharedId: parseInt(sharedId)
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const isBookmarked = data.action === 'bookmarked'; // Assuming API returns action
            
            // Update button icon (Instagram style - subtle)
            const icon = button.querySelector('i');
            if (icon) {
                if (isBookmarked) {
                    // Filled bookmark with animation
                    icon.classList.remove('fa-bookmark');
                    icon.classList.add('fa-bookmark', 'fas');
                    icon.classList.add('animate-ping');
                    setTimeout(() => icon.classList.remove('animate-ping'), 300);
                } else {
                    // Outlined bookmark
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                }
            }
            
            // Show notification with icon
            if (isBookmarked) {
                showNotification('🔖 Bookmarked!', 'success');
            } else {
                showNotification('📝 Unbookmarked', 'info');
            }
            
        } else {
            showNotification(data.message || 'Gagal bookmark', 'error');
        }
    } catch (error) {
        console.error('Error toggling bookmark:', error);
        showNotification('Gagal bookmark', 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-[10000] px-6 py-4 rounded-xl shadow-2xl ${
        type === 'success' ? 'bg-emerald-600' :
        type === 'error' ? 'bg-red-600' :
        'bg-blue-600'
    } text-white font-semibold animate-slide-in-right`;
    
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Profile dropdown toggle
document.addEventListener('DOMContentLoaded', function() {
    const profileBtn = document.getElementById('profile-btn-header');
    const profileDropdown = document.getElementById('profile-dropdown-header');
    
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('hidden');
        });
        
        document.addEventListener('click', function(e) {
            if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.add('hidden');
            }
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        const modal = document.getElementById('detail-modal');
        if (!modal.classList.contains('hidden') && e.key === 'Escape') {
            closeDetailModal();
        }
    });
});

// Animations for Instagram-style effects
const style = document.createElement('style');
style.textContent = `
    @keyframes slide-in-right {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    .animate-slide-in-right {
        animation: slide-in-right 0.3s ease-out;
    }
    
    @keyframes fade-in {
        from {
            opacity: 0;
            transform: scale(0.95);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
    
    @keyframes fade-out {
        from {
            opacity: 1;
            transform: scale(1);
        }
        to {
            opacity: 0;
            transform: scale(0.95);
        }
    }
    
    .animate-fade-in {
        animation: fade-in 0.2s ease-out;
    }
    
    .animate-fade-out {
        animation: fade-out 0.2s ease-out;
    }
    
    @keyframes heartBeat {
        0% {
            transform: scale(1);
        }
        25% {
            transform: scale(1.3);
        }
        50% {
            transform: scale(1.1);
        }
        75% {
            transform: scale(1.25);
        }
        100% {
            transform: scale(1);
        }
    }
    
    @keyframes pulse {
        0%, 100% {
            opacity: 1;
        }
        50% {
            opacity: 0.5;
        }
    }
    
    .scale-110 {
        transition: transform 0.2s ease;
        transform: scale(1.1);
    }
    
    /* Instagram-style scrollbar */
    ::-webkit-scrollbar {
        width: 6px;
    }
    
    ::-webkit-scrollbar-track {
        background: transparent;
    }
    
    ::-webkit-scrollbar-thumb {
        background: rgba(139, 92, 246, 0.3);
        border-radius: 3px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
        background: rgba(139, 92, 246, 0.5);
    }
`;
document.head.appendChild(style);

