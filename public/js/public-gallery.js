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
        console.log('Could not increment view count');
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
    
    // Get creator info from metadata bar
    const metadataBar = card.querySelector('.absolute.bottom-0');
    const creatorSpan = metadataBar?.querySelector('.text-gray-300');
    const creator = creatorSpan?.textContent.trim() || 'Anonymous';
    
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
    
    console.log('📊 Extracted stats - Likes:', likes, 'Views:', views);
    
    // Get model info
    const modelBadge = card.querySelector('.bg-blue-500\\/20');
    const rawModel = modelBadge?.textContent.trim() || '';
    const model = cleanModelName(rawModel); // Clean model name from fal.ai/fal.id references
    
    // Get dimensions
    const dimensionBadge = card.querySelector('.bg-blue-500\\/20');
    const dimensions = dimensionBadge?.textContent.trim() || '';
    
    const type = isVideo ? 'VIDEO' : 'GAMBAR';
    
    // Create modal content
    const modal = document.getElementById('detail-modal');
    if (!modal) return;
    
    modal.innerHTML = `
        <div class="bg-zinc-900 rounded-xl max-w-4xl w-full max-h-[95vh] overflow-hidden border border-white/10 shadow-2xl flex flex-col" onclick="event.stopPropagation()">
            <!-- Header (Compact) -->
            <div class="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-zinc-900/50 flex-shrink-0">
                <div class="flex items-center gap-1.5 flex-wrap min-w-0">
                    <div class="px-1.5 py-0.5 ${isVideo ? 'bg-fuchsia-500/20 border-fuchsia-500/30' : 'bg-blue-500/20 border-blue-500/30'} border rounded text-[9px] font-semibold">
                        <i class="fas fa-${isVideo ? 'video' : 'image'} ${isVideo ? 'text-fuchsia-400' : 'text-blue-400'} mr-0.5"></i> ${type}
                    </div>
                    ${model ? `<div class="px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded text-[9px] font-semibold text-blue-300 uppercase">${model.substring(0, 15)}</div>` : ''}
                    ${dimensions ? `<div class="px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded text-[9px] font-semibold text-blue-300">${dimensions}</div>` : ''}
                    <span class="text-gray-400 text-[10px] truncate">by <span class="text-white font-semibold">${creator.substring(0, 12)}</span></span>
                </div>
                <button id="close-modal-btn" class="w-7 h-7 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 active:scale-95 z-10">
                    <i class="fas fa-times text-gray-400 text-xs"></i>
                </button>
            </div>
            
            <!-- Content (Scrollable) -->
            <div class="flex flex-col lg:flex-row overflow-hidden flex-1 min-h-0 relative">
                <!-- Media Side -->
                <div class="lg:w-2/3 bg-black flex items-center justify-center p-2 lg:p-4 flex-shrink-0 lg:flex-shrink relative">
                    ${isVideo ? `
                        <video src="${mediaUrl}" controls autoplay loop class="max-w-full max-h-[40vh] lg:max-h-[70vh] rounded-lg shadow-2xl">
                            Browser tidak mendukung video.
                        </video>
                    ` : `
                        <img src="${mediaUrl}" alt="${prompt}" class="max-w-full max-h-[40vh] lg:max-h-[70vh] object-contain rounded-lg shadow-2xl">
                    `}
                    
                    <!-- Floating Stats Bar (Mobile Only - Top - Instagram Style) -->
                    <div class="lg:hidden absolute top-4 left-4 right-4 flex items-center justify-center gap-2 z-10">
                        <div class="flex items-center gap-3 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/20 shadow-lg">
                            <!-- Like Count -->
                            <div class="flex items-center gap-1.5">
                                <i class="fas fa-heart text-white text-xs drop-shadow-lg"></i>
                                <span id="mobile-likes-count" class="text-white font-semibold text-xs">${likes.toLocaleString()}</span>
                            </div>
                            
                            <!-- Divider -->
                            <div class="w-px h-3 bg-white/30"></div>
                            
                            <!-- View Count -->
                            <div class="flex items-center gap-1.5">
                                <i class="fas fa-eye text-white text-xs drop-shadow-lg"></i>
                                <span id="mobile-views-count" class="text-white font-semibold text-xs">${views.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Floating Action Buttons (Mobile Only - Instagram Style) -->
                    <div class="lg:hidden absolute bottom-4 left-4 flex items-center gap-4 z-10">
                        <!-- Like Button (Instagram Style) -->
                        <button id="floating-like-btn" data-shared-id="${sharedId}" data-likes="${likes}" class="group flex items-center gap-2 transition-all duration-200 active:scale-90">
                            <div class="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 group-active:bg-black/60 transition-all">
                                <i class="fas fa-heart text-white text-base drop-shadow-lg"></i>
                            </div>
                            ${likes > 0 ? `
                                <span id="like-count-badge" class="text-white text-sm font-semibold drop-shadow-lg bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20">${likes > 999 ? '999+' : likes.toLocaleString()}</span>
                            ` : ''}
                        </button>
                        
                        <!-- Bookmark Button (Instagram Style) -->
                        <button id="floating-bookmark-btn" data-shared-id="${sharedId}" class="group transition-all duration-200 active:scale-90">
                            <div class="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 group-active:bg-black/60 transition-all">
                                <i class="fas fa-bookmark text-white text-sm drop-shadow-lg"></i>
                            </div>
                        </button>
                    </div>
                </div>
                
                <!-- Info Side (Scrollable) -->
                <div class="lg:w-1/3 p-3 space-y-3 overflow-y-auto bg-zinc-900/30 flex-1">
                    <!-- Stats (Compact & Inline - Desktop Only) -->
                    <div class="hidden lg:flex items-center justify-center gap-4 bg-white/5 rounded-lg p-2 mb-3 border border-white/10">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-heart text-red-400 text-sm"></i>
                            <div>
                                <span id="likes-count" class="text-white font-bold text-sm">${likes.toLocaleString()}</span>
                                <span class="text-gray-400 text-xs ml-1">likes</span>
                            </div>
                        </div>
                        <div class="w-px h-4 bg-white/20"></div>
                        <div class="flex items-center gap-2">
                            <i class="fas fa-eye text-blue-400 text-sm"></i>
                            <div>
                                <span id="views-count" class="text-white font-bold text-sm">${views.toLocaleString()}</span>
                                <span class="text-gray-400 text-xs ml-1">views</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Prompt (Smaller & Scrollable) -->
                    <div>
                        <h3 class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Prompt</h3>
                        <p class="text-xs text-white leading-relaxed max-h-32 overflow-y-auto pr-2" style="scrollbar-width: thin; scrollbar-color: rgba(139, 92, 246, 0.5) transparent;">${prompt}</p>
                    </div>
                    
                    <!-- Actions (Responsive) -->
                    <div class="pt-2 border-t border-white/10 space-y-2">
                        ${window.location.pathname !== '/dashboard' ? `
                            <a href="/dashboard" class="block w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-center rounded-lg text-xs font-semibold transition-all hover:scale-105 shadow-lg">
                                <i class="fas fa-magic mr-1"></i> Buat Serupa
                            </a>
                        ` : ''}
                        
                        <div class="grid grid-cols-2 gap-2">
                            <button id="copy-prompt-btn" data-prompt="${prompt.replace(/"/g, '&quot;')}" class="px-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 active:scale-95">
                                <i class="fas fa-copy"></i> Salin
                            </button>
                            
                            <a href="${mediaUrl}" download class="px-2 py-2 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 active:scale-95">
                                <i class="fas fa-download"></i> Unduh
                            </a>
                        </div>
                        
                        <button id="report-btn" data-shared-id="${sharedId}" class="w-full px-2 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-semibold transition-all border border-red-500/30 active:scale-95">
                            <i class="fas fa-flag mr-1"></i> Laporkan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    console.log('📱 Modal opened with z-index 10020');
    
    // Attach event listeners after modal is created
    setTimeout(() => {
        const closeBtn = document.getElementById('close-modal-btn');
        const copyBtn = document.getElementById('copy-prompt-btn');
        const reportBtn = document.getElementById('report-btn');
        const floatingLikeBtn = document.getElementById('floating-like-btn');
        const floatingBookmarkBtn = document.getElementById('floating-bookmark-btn');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                console.log('❌ Close button clicked');
                closeDetailModal();
            });
            console.log('✅ Close button listener attached');
        }
        
        if (copyBtn) {
            copyBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                const promptText = this.getAttribute('data-prompt');
                console.log('📋 Copying prompt:', promptText);
                copyPrompt(promptText);
            });
            console.log('✅ Copy button listener attached');
        }
        
        if (reportBtn) {
            reportBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                const sharedId = this.getAttribute('data-shared-id');
                console.log('🚩 Reporting:', sharedId);
                reportGeneration(sharedId);
            });
            console.log('✅ Report button listener attached');
        }
        
        if (floatingLikeBtn) {
            floatingLikeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                const sharedId = this.getAttribute('data-shared-id');
                console.log('❤️ Like button clicked:', sharedId);
                toggleLike(this, sharedId);
            });
            console.log('✅ Floating like button listener attached');
        }
        
        if (floatingBookmarkBtn) {
            floatingBookmarkBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                const sharedId = this.getAttribute('data-shared-id');
                console.log('🔖 Bookmark button clicked:', sharedId);
                toggleBookmark(this, sharedId);
            });
            console.log('✅ Floating bookmark button listener attached');
        }
    }, 50);
}

// Close detail modal
function closeDetailModal() {
    console.log('🚪 Closing detail modal...');
    
    const modal = document.getElementById('detail-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        
        // Stop any playing video
        const video = modal.querySelector('video');
        if (video) {
            video.pause();
            video.src = '';
        }
        
        // Clear modal content after animation
        setTimeout(() => {
            modal.innerHTML = '';
        }, 300);
        
        console.log('✅ Modal closed');
    }
}

// Make functions globally available
window.closeDetailModal = closeDetailModal;

// Copy prompt to clipboard
function copyPrompt(prompt) {
    console.log('🔄 Attempting to copy prompt...');
    
    // Decode HTML entities if present
    const decodedPrompt = prompt.replace(/&quot;/g, '"')
                                .replace(/&#39;/g, "'")
                                .replace(/&amp;/g, "&");
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(decodedPrompt).then(() => {
            console.log('✅ Prompt copied successfully');
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
            console.log('✅ Fallback copy successful');
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

// Toggle Like
async function toggleLike(button, sharedId) {
    console.log('❤️ Toggling like for:', sharedId);
    
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
            
            console.log('✅ Like toggled successfully, new count:', newLikes);
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
    console.log('🔖 Toggling bookmark for:', sharedId);
    
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
            
            console.log('✅ Bookmark toggled successfully');
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

// Animation for slide in
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
`;
document.head.appendChild(style);

