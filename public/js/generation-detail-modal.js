/**
 * Generation Detail Modal Handler
 * 
 * Handles the display of generation metadata in a beautiful modal popup
 * Shows: prompt, settings, status, credits cost, and preview
 * 
 * Usage: Click on any generation card to view its details
 */

// ✨ Helper function to escape HTML (prevent XSS)
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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

// Open generation detail modal
function openGenerationDetailModal(card) {
    const modal = document.getElementById('generation-detail-modal');
    const content = document.getElementById('generation-detail-content');
    const typeLabel = document.getElementById('modal-generation-type');
    
    try {
        // Get metadata from card
        const metadataStr = card.getAttribute('data-metadata');
        if (!metadataStr) {
            console.warn('⚠️ No metadata found on card');
            return;
        }
        
        const metadata = JSON.parse(metadataStr);
        
        // Update type label
        const typeIcon = metadata.type === 'video' ? '🎥' : '🖼️';
        typeLabel.textContent = `${typeIcon} ${metadata.type.charAt(0).toUpperCase() + metadata.type.slice(1)} Generation`;
        
        // Build content HTML
        content.innerHTML = buildModalContent(card, metadata);
        
        // Show modal with animation
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // Add body scroll lock
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('❌ Error opening detail modal:', error);
    }
}

// Build modal content HTML
function buildModalContent(card, metadata) {
    let html = '';
    
    // Preview Section
    html += buildPreviewSection(card, metadata);
    
    // Prompt Section
    html += buildPromptSection(metadata);
    
    // Settings Section
    html += buildSettingsSection(metadata);
    
    // Status & Info Section
    html += buildStatusSection(metadata);
    
    // Error Section (if failed)
    if (metadata.status === 'failed' && metadata.errorMessage) {
        html += buildErrorSection(metadata);
    }
    
    return html;
}

// Build preview section
function buildPreviewSection(card, metadata) {
    if (metadata.status !== 'completed') {
        return '';
    }
    
    const resultUrl = card.querySelector('img')?.src || card.querySelector('video')?.src;
    if (!resultUrl) {
        return '';
    }
    
    const mediaElement = metadata.type === 'video' ? 
        `<video src="${resultUrl}" controls playsinline class="w-full max-h-48 sm:max-h-64 object-contain">
            Your browser does not support the video tag.
        </video>` :
        `<img src="${resultUrl}" alt="Generated content" class="w-full max-h-48 sm:max-h-64 object-contain">`;
    
    return `
        <div class="mb-4">
            <h3 class="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                Preview
            </h3>
            <div class="bg-black/20 rounded-lg overflow-hidden border border-white/10">
                ${mediaElement}
            </div>
        </div>
    `;
}

// Build prompt section
function buildPromptSection(metadata) {
    
    const promptText = metadata.prompt || 'No prompt available';
    const originalPrompt = metadata.originalPrompt || metadata.settings?.originalPrompt || null;
    const wasEnhanced = originalPrompt && originalPrompt !== promptText && promptText !== 'No prompt available';
    
    
    let html = `<div class="mb-4">
            <div class="flex items-center justify-between mb-2">
                <h3 class="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
                    </svg>
                    Prompt
                    ${wasEnhanced ? '<span class="px-1.5 py-0.5 bg-gradient-to-r from-orange-500/20 to-violet-500/20 border border-orange-500/30 text-orange-300 text-[9px] rounded-full ml-1.5"><i class="fas fa-wand-magic-sparkles mr-0.5"></i>Auto-Enhanced</span>' : ''}
                </h3>
                ${promptText !== 'No prompt available' ? `
                    <button onclick="copyPromptToClipboard('${promptText.replace(/'/g, "\\'")}', this)" 
                            class="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-xs font-medium text-blue-300 transition-all duration-200 hover:scale-105 group">
                        <svg class="w-3.5 h-3.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                        </svg>
                        <span>Copy</span>
                    </button>
                ` : ''}
            </div>`;
    
    // Show original prompt if enhanced
    if (wasEnhanced) {
        html += `
            <div class="mb-2 p-2.5 bg-white/5 border-l-2 border-orange-500/50 rounded-lg">
                <p class="text-[10px] text-gray-400 mb-1 font-semibold flex items-center gap-1">
                    <i class="fas fa-pen text-orange-400"></i>
                    Original Prompt:
                </p>
                <p class="text-xs text-gray-300 leading-relaxed">${escapeHtml(originalPrompt)}</p>
            </div>
            <div class="mb-1.5 flex items-center gap-1.5 text-orange-400">
                <i class="fas fa-arrow-down text-[10px]"></i>
                <p class="text-[10px] font-semibold">Enhanced by AI:</p>
            </div>`;
    }
    
    html += `
            <div class="bg-white/5 border border-white/10 rounded-lg p-3">
                <p class="text-xs text-gray-300 leading-relaxed ${wasEnhanced ? 'font-medium' : ''}">${escapeHtml(promptText)}</p>
            </div>
        </div>`;
    
    return html;
}

// Build settings section
function buildSettingsSection(metadata) {
    const settings = metadata.settings || {};
    
    let settingsHTML = '';
    
    // Type
    settingsHTML += `
        <div class="bg-white/5 border border-white/10 rounded-lg p-2.5">
            <p class="text-[10px] text-gray-500 mb-0.5">Type</p>
            <p class="text-xs font-semibold text-white">${metadata.subType || 'N/A'}</p>
        </div>
    `;
    
    // Duration (video only)
    if (metadata.type === 'video') {
        settingsHTML += `
            <div class="bg-white/5 border border-white/10 rounded-lg p-2.5">
                <p class="text-[10px] text-gray-500 mb-0.5">Duration</p>
                <p class="text-xs font-semibold text-white">${settings.duration || '5'}s</p>
            </div>
        `;
    }
    
    // Aspect Ratio
    settingsHTML += `
        <div class="bg-white/5 border border-white/10 rounded-lg p-2.5">
            <p class="text-[10px] text-gray-500 mb-0.5">Aspect Ratio</p>
            <p class="text-xs font-semibold text-white">${settings.aspectRatio || settings.aspect_ratio || '16:9'}</p>
        </div>
    `;
    
    // Model (display clean name without tooltip)
    if (settings.model) {
        const cleanedModelName = cleanModelName(settings.model);
        settingsHTML += `
            <div class="bg-white/5 border border-white/10 rounded-lg p-2.5 col-span-2">
                <p class="text-[10px] text-gray-500 mb-0.5">Model</p>
                <p class="text-xs font-semibold text-white truncate">${cleanedModelName}</p>
            </div>
        `;
    }
    
    // Quantity (image only)
    if (settings.quantity && metadata.type === 'image') {
        settingsHTML += `
            <div class="bg-white/5 border border-white/10 rounded-lg p-2.5">
                <p class="text-[10px] text-gray-500 mb-0.5">Quantity</p>
                <p class="text-xs font-semibold text-white">${settings.quantity}</p>
            </div>
        `;
    }
    
    return `
        <div class="mb-4">
            <h3 class="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Settings
            </h3>
            <div class="grid grid-cols-2 gap-2">
                ${settingsHTML}
            </div>
        </div>
    `;
}

// Build status section
function buildStatusSection(metadata) {
    const createdDate = new Date(metadata.createdAt).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const statusColor = metadata.status === 'completed' ? 'green' : 
                       metadata.status === 'failed' ? 'red' : 'yellow';
    const statusIcon = metadata.status === 'completed' ? '✅' : 
                      metadata.status === 'failed' ? '❌' : '⏳';
    
    return `
        <div class="grid grid-cols-3 gap-2 mb-3">
            <div class="bg-${statusColor}-500/10 border border-${statusColor}-500/30 rounded-lg p-2.5">
                <p class="text-[10px] text-gray-500 mb-0.5">Status</p>
                <p class="text-xs font-semibold text-${statusColor}-400">${statusIcon} ${metadata.status.charAt(0).toUpperCase() + metadata.status.slice(1)}</p>
            </div>
            <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2.5">
                <p class="text-[10px] text-gray-500 mb-0.5">Credits</p>
                <p class="text-xs font-semibold text-yellow-400">${metadata.creditsCost || 0}</p>
            </div>
            <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2.5">
                <p class="text-[10px] text-gray-500 mb-0.5">ID</p>
                <p class="text-xs font-semibold text-blue-400">#${metadata.id || 'N/A'}</p>
            </div>
        </div>
        
        <div class="bg-white/5 border border-white/10 rounded-lg p-2.5">
            <div class="flex items-center gap-1.5 text-[10px] text-gray-500 mb-0.5">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Created
            </div>
            <p class="text-xs text-gray-300">${createdDate}</p>
        </div>
    `;
}

// Build error section
function buildErrorSection(metadata) {
    return `
        <div class="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg p-2.5">
            <div class="flex items-center gap-1.5 mb-1">
                <svg class="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-[10px] text-red-400 font-semibold">Error Message</p>
            </div>
            <p class="text-xs text-red-300">${metadata.errorMessage}</p>
        </div>
    `;
}

// Close generation detail modal
function closeGenerationDetailModal(event) {
    const modal = document.getElementById('generation-detail-modal');
    
    // If event is provided, check if clicking outside
    if (event && event.target.id !== 'generation-detail-modal') {
        return;
    }
    
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    
    // Remove body scroll lock
    document.body.style.overflow = '';
}

// Copy prompt to clipboard (global function)
function copyPromptToClipboard(promptText, buttonElement) {
    // Decode HTML entities if needed
    const textarea = document.createElement('textarea');
    textarea.innerHTML = promptText;
    const decodedText = textarea.value;
    
    // Copy to clipboard
    navigator.clipboard.writeText(decodedText).then(() => {
        // Visual feedback - change button text temporarily
        const originalHTML = buttonElement.innerHTML;
        buttonElement.innerHTML = `
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <span>Copied!</span>
        `;
        buttonElement.classList.remove('bg-blue-600/20', 'hover:bg-blue-600/30', 'border-blue-500/30', 'text-blue-300');
        buttonElement.classList.add('bg-green-600/20', 'border-green-500/30', 'text-green-300');
        
        // Reset after 2 seconds
        setTimeout(() => {
            buttonElement.innerHTML = originalHTML;
            buttonElement.classList.remove('bg-green-600/20', 'border-green-500/30', 'text-green-300');
            buttonElement.classList.add('bg-blue-600/20', 'hover:bg-blue-600/30', 'border-blue-500/30', 'text-blue-300');
        }, 2000);
        
        // Show notification if available
        if (typeof showNotification === 'function') {
            showNotification('Prompt copied to clipboard!', 'success');
        }
    }).catch(err => {
        console.error('❌ Failed to copy prompt:', err);
        
        // Fallback: select text method
        try {
            const textArea = document.createElement('textarea');
            textArea.value = decodedText;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (typeof showNotification === 'function') {
                showNotification('Prompt copied!', 'success');
            }
        } catch (fallbackErr) {
            console.error('❌ Fallback copy also failed:', fallbackErr);
            if (typeof showNotification === 'function') {
                showNotification('Failed to copy prompt', 'error');
            }
        }
    });
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('generation-detail-modal');
        if (modal && !modal.classList.contains('hidden')) {
            closeGenerationDetailModal();
        }
    }
});

