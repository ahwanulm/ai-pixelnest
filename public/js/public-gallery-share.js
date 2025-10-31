/**
 * Public Gallery Share Functionality
 * Handles sharing generations to public gallery
 */

// Show notification
function showNotification(message, type = 'info') {
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

// Open share modal
function openShareModal(buttonElement) {
    const card = buttonElement.closest('[data-generation-id]');
    if (!card) {
        console.error('❌ Generation card not found');
        showNotification('Tidak dapat membagikan: Data tidak ditemukan', 'error');
        return;
    }
    
    const generationId = card.getAttribute('data-generation-id');
    if (!generationId) {
        console.error('❌ Generation ID not found');
        showNotification('Tidak dapat membagikan: ID tidak valid', 'error');
        return;
    }
    
    // Show modal
    const modal = document.getElementById('share-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.setAttribute('data-sharing-generation-id', generationId);
        document.body.style.overflow = 'hidden';
        
        // Reset state first
        const alreadySharedDiv = document.getElementById('already-shared-message');
        if (alreadySharedDiv) {
            alreadySharedDiv.style.display = 'none';
        }
        
        // Check if already shared (this will update UI if needed)
        checkIfShared(generationId);
    }
}

// Close share modal
function closeShareModal() {
    const modal = document.getElementById('share-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.removeAttribute('data-sharing-generation-id');
        document.body.style.overflow = 'auto';
        
        // Reset form
        const form = document.getElementById('share-form');
        const alreadySharedDiv = document.getElementById('already-shared-message');
        
        if (form) {
            form.style.display = 'block';
            document.getElementById('share-display-name').value = '';
            document.getElementById('share-anonymous').checked = false;
            document.getElementById('share-display-name').disabled = false;
            
            // Reset submit button text
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-share-alt mr-1"></i> Bagikan';
            }
        }
        
        if (alreadySharedDiv) {
            alreadySharedDiv.style.display = 'none';
        }
    }
}

// Toggle display name input based on anonymous checkbox
function toggleAnonymous() {
    const anonymousCheckbox = document.getElementById('share-anonymous');
    const displayNameInput = document.getElementById('share-display-name');
    
    if (anonymousCheckbox && displayNameInput) {
        displayNameInput.disabled = anonymousCheckbox.checked;
        if (anonymousCheckbox.checked) {
            displayNameInput.value = '';
        }
    }
}

// Check if generation is already shared
async function checkIfShared(generationId) {
    try {
        const response = await fetch(`/api/public-gallery/check-shared?generationId=${generationId}`);
        const data = await response.json();
        
        if (data.success && data.isShared) {
            // Already shared, show unshare option
            showAlreadySharedMessage(data.sharedData);
        }
    } catch (error) {
        console.error('Error checking shared status:', error);
    }
}

// Show already shared message
function showAlreadySharedMessage(sharedData) {
    const modal = document.getElementById('share-modal');
    const form = document.getElementById('share-form');
    const alreadySharedDiv = document.getElementById('already-shared-message');
    
    if (modal && form && alreadySharedDiv) {
        // Show both form and already-shared message
        form.style.display = 'block';
        alreadySharedDiv.style.display = 'block';
        
        const displayText = sharedData.is_anonymous 
            ? 'Anonymous' 
            : (sharedData.display_name || 'Your Name');
        
        alreadySharedDiv.querySelector('.shared-as-text').textContent = displayText;
        
        // Pre-fill the form with existing values
        document.getElementById('share-anonymous').checked = sharedData.is_anonymous;
        if (!sharedData.is_anonymous && sharedData.display_name) {
            document.getElementById('share-display-name').value = sharedData.display_name;
        }
        document.getElementById('share-display-name').disabled = sharedData.is_anonymous;
        
        // Update submit button text
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save mr-1"></i> Perbarui';
        }
    }
}

// Handle share submission
async function handleShareSubmit(event) {
    event.preventDefault();
    
    const modal = document.getElementById('share-modal');
    const generationId = modal.getAttribute('data-sharing-generation-id');
    
    if (!generationId) {
        showNotification('Tidak dapat membagikan: ID tidak valid', 'error');
        return;
    }
    
    const isAnonymous = document.getElementById('share-anonymous').checked;
    const displayName = document.getElementById('share-display-name').value.trim();
    
    // Show loading
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Membagikan...';
    
    try {
        const response = await fetch('/api/public-gallery/share', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                generationId: parseInt(generationId),
                isAnonymous,
                displayName: isAnonymous ? null : (displayName || null)
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Always show the same success message
            showNotification('✨ Berhasil dibagikan ke Galeri Publik!', 'success');
            closeShareModal();
            
            // Update button to show it's shared
            updateShareButton(generationId, true);
        } else {
            showNotification(data.message || 'Gagal membagikan', 'error');
        }
    } catch (error) {
        console.error('Error sharing generation:', error);
        showNotification('Gagal membagikan ke galeri publik', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Handle unshare
async function handleUnshare() {
    const modal = document.getElementById('share-modal');
    const generationId = modal.getAttribute('data-sharing-generation-id');
    
    if (!generationId) {
        showNotification('Tidak dapat menghapus: ID tidak valid', 'error');
        return;
    }
    
    if (!confirm('Yakin ingin menghapus dari galeri publik?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/public-gallery/unshare', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                generationId: parseInt(generationId)
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('✅ Berhasil dihapus dari Galeri Publik', 'success');
            closeShareModal();
            
            // Update button to show it's not shared
            updateShareButton(generationId, false);
        } else {
            showNotification(data.message || 'Gagal menghapus', 'error');
        }
    } catch (error) {
        console.error('Error unsharing generation:', error);
        showNotification('Gagal menghapus dari galeri publik', 'error');
    }
}

// Update share button appearance
function updateShareButton(generationId, isShared) {
    
    const card = document.querySelector(`[data-generation-id="${generationId}"]`);
    if (!card) {
        console.error('❌ Card not found for generation:', generationId);
        return;
    }
    
    const shareBtn = card.querySelector('.btn-share');
    const sharedBadge = card.querySelector('.shared-badge');
    
    if (!shareBtn) {
        console.error('❌ Share button not found in card');
        return;
    }
    
    if (isShared) {
        // Change to unshare button (red X)
        shareBtn.classList.remove('bg-emerald-600', 'hover:bg-emerald-700');
        shareBtn.classList.add('bg-red-600/80', 'hover:bg-red-700');
        shareBtn.innerHTML = '<i class="fas fa-times"></i>';
        shareBtn.title = 'Batal Bagikan';
        shareBtn.onclick = function(e) {
            e.stopPropagation();
            if (confirm('Yakin ingin batalkan share?')) {
                handleUnshareFromCard(generationId);
            }
        };
        
        // Show shared badge
        if (sharedBadge) {
            sharedBadge.classList.remove('hidden');
        }
    } else {
        // Reset to share button
        shareBtn.classList.remove('bg-red-600/80', 'hover:bg-red-700');
        shareBtn.classList.add('bg-emerald-600', 'hover:bg-emerald-700');
        shareBtn.innerHTML = '<i class="fas fa-share-alt"></i>';
        shareBtn.title = 'Bagikan ke Galeri Publik';
        shareBtn.onclick = function(e) {
            e.stopPropagation();
            openShareModal(shareBtn);
        };
        
        // Hide shared badge
        if (sharedBadge) {
            sharedBadge.classList.add('hidden');
        }
    }
    
}

// Handle unshare from card
async function handleUnshareFromCard(generationId) {
    
    try {
        const response = await fetch('/api/public-gallery/unshare', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                generationId: parseInt(generationId)
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('✅ Berhasil dibatalkan dari Galeri Publik', 'success');
            updateShareButton(generationId, false);
        } else {
            console.error('❌ Unshare failed:', data.message);
            showNotification(data.message || 'Gagal membatalkan', 'error');
        }
    } catch (error) {
        console.error('❌ Error unsharing:', error);
        showNotification('Gagal membatalkan share', 'error');
    }
}

// Make functions globally available
window.showNotification = showNotification;
window.openShareModal = openShareModal;
window.closeShareModal = closeShareModal;
window.handleUnshare = handleUnshare;
window.handleUnshareFromCard = handleUnshareFromCard;
window.updateShareButton = updateShareButton;
window.checkGenerationSharedStatus = checkGenerationSharedStatus;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for anonymous checkbox
    const anonymousCheckbox = document.getElementById('share-anonymous');
    if (anonymousCheckbox) {
        anonymousCheckbox.addEventListener('change', toggleAnonymous);
    }
    
    // Add event listener for share form
    const shareForm = document.getElementById('share-form');
    if (shareForm) {
        shareForm.addEventListener('submit', handleShareSubmit);
    }
    
    // Check shared status for all visible generations
    const generationCards = document.querySelectorAll('[data-generation-id]');
    generationCards.forEach(card => {
        const genId = card.getAttribute('data-generation-id');
        if (genId) {
            checkGenerationSharedStatus(genId);
        }
    });
});

// Check and update button for a specific generation
async function checkGenerationSharedStatus(generationId) {
    try {
        const response = await fetch(`/api/public-gallery/check-shared?generationId=${generationId}`);
        const data = await response.json();
        
        if (data.success && data.isShared) {
            updateShareButton(generationId, true);
        }
    } catch (error) {
        // Silently fail - not critical
    }
}

