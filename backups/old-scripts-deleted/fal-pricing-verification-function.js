// ADD THIS TO public/js/admin-models.js

/**
 * Verify FAL.AI Pricing Accuracy
 * Compares database prices with manually verified prices from fal.ai website
 */
async function verifyFalPricing() {
  try {
    // Show loading toast
    showToast('🔍 Verifying FAL.AI pricing...', 'info');
    
    // Call API
    const response = await fetch('/admin/api/fal-pricing/verify');
    const data = await response.json();
    
    if (!data.success) {
      showToast('❌ Verification failed: ' + data.message, 'error');
      return;
    }
    
    const { summary, mismatches, unverified, outdated } = data;
    
    // Build results HTML
    let html = `
      <div class="space-y-4">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-gray-700 pb-3">
          <h3 class="text-xl font-bold text-white">FAL.AI Pricing Verification</h3>
          <div class="px-3 py-1 rounded-lg text-sm font-semibold ${
            summary.risk === 'critical' ? 'bg-red-500/20 text-red-400' :
            summary.risk === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-green-500/20 text-green-400'
          }">
            ${summary.risk.toUpperCase()}
          </div>
        </div>
        
        <!-- Summary -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <div class="text-2xl font-bold text-white">${summary.total}</div>
            <div class="text-xs text-gray-400">Total Models</div>
          </div>
          <div class="bg-green-500/10 rounded-lg p-3 border border-green-500/30">
            <div class="text-2xl font-bold text-green-400">${summary.matching}</div>
            <div class="text-xs text-gray-400">✅ Matching</div>
          </div>
          <div class="bg-red-500/10 rounded-lg p-3 border border-red-500/30">
            <div class="text-2xl font-bold text-red-400">${summary.mismatches}</div>
            <div class="text-xs text-gray-400">❌ Mismatches</div>
          </div>
          <div class="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/30">
            <div class="text-2xl font-bold text-yellow-400">${summary.unverified}</div>
            <div class="text-xs text-gray-400">⚠️ Unverified</div>
          </div>
        </div>
        
        ${summary.mismatches > 0 ? `
          <!-- Critical: Mismatches -->
          <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <h4 class="text-red-400 font-bold mb-3 flex items-center gap-2">
              <i class="fas fa-exclamation-triangle"></i>
              Critical: Price Mismatches (${summary.mismatches})
            </h4>
            <div class="space-y-2 max-h-64 overflow-y-auto">
              ${mismatches.slice(0, 10).map(m => `
                <div class="bg-gray-800/50 rounded-lg p-3 text-sm">
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex-1">
                      <div class="font-semibold text-white">${m.name}</div>
                      <div class="text-xs text-gray-500 font-mono">${m.model_id}</div>
                    </div>
                    ${m.isLoss ? `
                      <span class="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-bold">
                        💸 LOSS RISK
                      </span>
                    ` : `
                      <span class="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                        ✅ Profit
                      </span>
                    `}
                  </div>
                  <div class="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span class="text-gray-500">DB:</span>
                      <span class="text-gray-300 font-mono">$${m.dbPrice.toFixed(3)}</span>
                    </div>
                    <div>
                      <span class="text-gray-500">Real:</span>
                      <span class="text-white font-mono font-bold">$${m.verifiedPrice.toFixed(3)}</span>
                    </div>
                    <div>
                      <span class="text-gray-500">Diff:</span>
                      <span class="${m.difference > 0 ? 'text-red-400' : 'text-green-400'} font-mono font-bold">
                        ${m.difference > 0 ? '+' : ''}$${m.difference.toFixed(3)}
                      </span>
                    </div>
                  </div>
                  <div class="mt-2 text-xs text-gray-500">
                    <a href="${m.notes}" target="_blank" class="text-blue-400 hover:underline">
                      <i class="fas fa-external-link-alt mr-1"></i>Verify on fal.ai
                    </a>
                  </div>
                </div>
              `).join('')}
            </div>
            
            ${summary.mismatches > 0 ? `
              <div class="mt-4 flex gap-2">
                <button 
                  onclick="applyFalPricingFixes(${JSON.stringify(mismatches.map(m => m.model_id))})"
                  class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition"
                >
                  <i class="fas fa-wrench mr-2"></i>Apply Fixes (${summary.mismatches})
                </button>
                <button 
                  onclick="window.open('https://fal.ai/models', '_blank')"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
                >
                  <i class="fas fa-external-link-alt mr-2"></i>Check fal.ai
                </button>
              </div>
            ` : ''}
          </div>
        ` : ''}
        
        ${summary.unverified > 0 ? `
          <!-- Warning: Unverified -->
          <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <h4 class="text-yellow-400 font-bold mb-3 flex items-center gap-2">
              <i class="fas fa-info-circle"></i>
              Unverified Models (${summary.unverified})
            </h4>
            <p class="text-sm text-gray-400 mb-2">
              These models are not in the verified price list. Please verify manually at
              <a href="https://fal.ai/models" target="_blank" class="text-blue-400 hover:underline">fal.ai/models</a>
            </p>
            <div class="space-y-1 max-h-32 overflow-y-auto">
              ${unverified.slice(0, 5).map(m => `
                <div class="text-sm text-gray-300">
                  • ${m.name} <span class="text-gray-500">($${m.dbPrice.toFixed(3)})</span>
                </div>
              `).join('')}
              ${summary.unverified > 5 ? `
                <div class="text-sm text-gray-500 italic">
                  ... and ${summary.unverified - 5} more
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}
        
        ${summary.outdated > 0 ? `
          <!-- Info: Outdated -->
          <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h4 class="text-blue-400 font-bold mb-2 flex items-center gap-2">
              <i class="fas fa-clock"></i>
              Outdated Verifications (${summary.outdated})
            </h4>
            <p class="text-sm text-gray-400">
              ${summary.outdated} model(s) have verification older than 30 days. Consider re-verifying.
            </p>
          </div>
        ` : ''}
        
        ${summary.mismatches === 0 && summary.unverified === 0 ? `
          <!-- Success -->
          <div class="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
            <div class="text-4xl mb-2">✅</div>
            <div class="text-green-400 font-bold">All Verified Prices Match!</div>
            <div class="text-sm text-gray-400 mt-1">Your pricing is accurate.</div>
          </div>
        ` : ''}
        
        <!-- Footer -->
        <div class="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-400">
          <div class="flex items-center gap-2 mb-2">
            <i class="fas fa-info-circle text-blue-400"></i>
            <span class="font-semibold text-gray-300">Important Notes:</span>
          </div>
          <ul class="list-disc list-inside space-y-1 ml-6">
            <li>FAL.AI does NOT provide a pricing API - all prices must be verified manually</li>
            <li>Run verification monthly (first day of each month recommended)</li>
            <li>Always verify prices on <a href="https://fal.ai/models" target="_blank" class="text-blue-400 hover:underline">https://fal.ai/models</a> before adding new models</li>
            <li>Update <code class="text-yellow-400 bg-gray-900 px-1 rounded">VERIFIED_FAL_PRICES</code> in <code class="text-yellow-400 bg-gray-900 px-1 rounded">src/routes/falPricing.js</code> when you verify</li>
          </ul>
        </div>
      </div>
    `;
    
    // Show results in modal
    showCustomModal('FAL.AI Pricing Verification', html, {
      size: 'large',
      showClose: true
    });
    
  } catch (error) {
    console.error('Error verifying FAL pricing:', error);
    showToast('❌ Error: ' + error.message, 'error');
  }
}

/**
 * Apply pricing fixes for mismatched models
 */
async function applyFalPricingFixes(modelIds) {
  if (!confirm(`Apply verified prices for ${modelIds.length} model(s)?\n\nThis will update FAL prices in the database.`)) {
    return;
  }
  
  try {
    showToast('🔧 Applying pricing fixes...', 'info');
    
    const response = await fetch('/admin/api/fal-pricing/apply-fixes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelIds })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast(`✅ ${data.message}`, 'success');
      // Reload models to show updated prices
      setTimeout(() => {
        loadModels();
        verifyFalPricing(); // Re-run verification to show new status
      }, 1000);
    } else {
      showToast('❌ ' + data.message, 'error');
    }
    
  } catch (error) {
    console.error('Error applying fixes:', error);
    showToast('❌ Error: ' + error.message, 'error');
  }
}

/**
 * Show custom modal (helper function)
 */
function showCustomModal(title, content, options = {}) {
  const { size = 'medium', showClose = true } = options;
  
  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
    xlarge: 'max-w-6xl'
  };
  
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4';
  modal.innerHTML = `
    <div class="bg-gray-900 rounded-xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-700">
      <div class="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 class="text-xl font-bold text-white">${title}</h2>
        ${showClose ? `
          <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white transition">
            <i class="fas fa-times text-xl"></i>
          </button>
        ` : ''}
      </div>
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
        ${content}
      </div>
    </div>
  `;
  
  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
  
  // Close on ESC key
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
  
  document.body.appendChild(modal);
}

