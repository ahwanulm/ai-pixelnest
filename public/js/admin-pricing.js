/**
 * Admin Pricing Configuration Frontend with Realtime Preview
 */

// Store original model prices for realtime calculation
let originalPrices = [];

// Update credit price (IDR) preview
function updateCreditPricePreview(priceIDR) {
  const preview = document.getElementById('price_idr_preview');
  if (!preview) return;
  
  // Validate minimum
  const price = parseInt(priceIDR) || 1300;
  if (price < 1000) {
    showToast('⚠️ Minimum Rp 1,000 per credit', 'warning');
    document.getElementById('credit_price_idr').value = 1000;
    return;
  }
  
  // Update preview with Sora 2 example (9.5 credits)
  const soraCredits = 9.5;
  const totalPrice = Math.ceil(soraCredits * price);
  preview.textContent = `Rp ${totalPrice.toLocaleString('id-ID')}`;
}

// Realtime profit margin update (defined first for inline onclick handlers)
function updateProfitMargin(value, source) {
  const marginInput = document.getElementById('profit_margin_percent');
  const marginSlider = document.getElementById('profit_margin_slider');
  const profitPreview = document.getElementById('profit-preview');
  
  if (!marginInput || !marginSlider || !profitPreview) {
    console.warn('Profit margin elements not found yet');
    return;
  }
  
  // Sync slider and input
  if (source === 'slider') {
    marginInput.value = value;
  } else if (source === 'input') {
    // Only update slider if value is within range
    if (value >= 0 && value <= 100) {
      marginSlider.value = value;
    }
  }
  
  // Update preview badge
  profitPreview.textContent = `+${parseFloat(value).toFixed(1)}%`;
  
  // Recalculate all prices in realtime
  recalculateAllPrices();
  
  // Update test calculator
  calculateTestPrice();
}

// Make functions globally available
window.updateProfitMargin = updateProfitMargin;
window.updateCreditPricePreview = updateCreditPricePreview;

// Load prices on page load
document.addEventListener('DOMContentLoaded', () => {
  loadPrices();
  calculateTestPrice();
  
  // Initialize preview badge with current value
  const currentMargin = document.getElementById('profit_margin_percent');
  const profitPreview = document.getElementById('profit-preview');
  if (currentMargin && profitPreview) {
    profitPreview.textContent = `+${parseFloat(currentMargin.value || 20).toFixed(1)}%`;
  }
});

// Handle form submit
document.getElementById('pricing-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const data = {
    profit_margin_percent: parseFloat(document.getElementById('profit_margin_percent').value),
    base_credit_usd: parseFloat(document.getElementById('base_credit_usd').value),
    credit_rounding: parseFloat(document.getElementById('credit_rounding').value),
    minimum_credits: parseFloat(document.getElementById('minimum_credits').value)
  };
  
  try {
    const response = await fetch('/admin/api/pricing/config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      showToast('✓ Pricing configuration saved! All model prices updated.', 'success');
      setTimeout(() => {
        loadPrices(); // Reload prices to show new calculations
      }, 1000);
    } else {
      showToast(result.message || 'Failed to save configuration', 'error');
    }
  } catch (error) {
    console.error('Error saving config:', error);
    showToast('Error saving configuration', 'error');
  }
});

// Load model prices
async function loadPrices() {
  try {
    const response = await fetch('/admin/api/pricing/models');
    const data = await response.json();
    
    if (data.success) {
      originalPrices = data.prices; // Store for realtime calculation
      displayPrices(data.prices);
    } else {
      showToast('Failed to load prices', 'error');
    }
  } catch (error) {
    console.error('Error loading prices:', error);
    showToast('Error loading prices', 'error');
  }
}

// Display prices in separate tables
function displayPrices(prices) {
  const imageTbody = document.getElementById('image-prices-table');
  const videoTbody = document.getElementById('video-prices-table');
  
  if (!imageTbody || !videoTbody) {
    console.warn('⚠️ Price tables not found in DOM');
    return;
  }
  
  // Separate image and video models
  const imageModels = prices.filter(p => p.type === 'image');
  const videoModels = prices.filter(p => p.type === 'video');
  
  // Display image models
  if (imageModels.length === 0) {
    imageTbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-4 py-8 text-center text-gray-400">
          No image models found
        </td>
      </tr>
    `;
  } else {
    imageTbody.innerHTML = imageModels.map(price => `
      <tr class="hover:bg-gray-800/30 transition">
        <td class="px-4 py-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <i class="fas fa-image text-blue-400"></i>
            </div>
            <p class="text-sm font-semibold text-white">${price.name}</p>
          </div>
        </td>
        <td class="px-4 py-3">
          <p class="text-sm text-gray-300">${price.provider || 'Unknown'}</p>
        </td>
        <td class="px-4 py-3 text-right">
          <span class="text-sm font-mono text-blue-400">$${parseFloat(price.usd_price).toFixed(4)}</span>
        </td>
        <td class="px-4 py-3 text-right">
          <span class="text-base font-bold font-mono text-yellow-400">${parseFloat(price.credits).toFixed(1)}</span>
        </td>
        <td class="px-4 py-3 text-right">
          <span class="text-sm font-mono text-green-400">Rp ${parseInt(price.our_price_idr || 0).toLocaleString('id-ID')}</span>
        </td>
        <td class="px-4 py-3 text-right">
          <span class="text-sm font-mono font-semibold ${parseFloat(price.profit_margin_actual) >= 0 ? 'text-green-400' : 'text-red-400'}">
            +${parseFloat(price.profit_margin_actual).toFixed(1)}%
          </span>
        </td>
      </tr>
    `).join('');
  }
  
  // Display video models
  if (videoModels.length === 0) {
    videoTbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-4 py-8 text-center text-gray-400">
          No video models found
        </td>
      </tr>
    `;
  } else {
    videoTbody.innerHTML = videoModels.map(price => `
      <tr class="hover:bg-gray-800/30 transition">
        <td class="px-4 py-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
              <i class="fas fa-video text-pink-400"></i>
            </div>
            <p class="text-sm font-semibold text-white">${price.name}</p>
          </div>
        </td>
        <td class="px-4 py-3">
          <p class="text-sm text-gray-300">${price.provider || 'Unknown'}</p>
        </td>
        <td class="px-4 py-3 text-center">
          <span class="px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-semibold">
            ${price.max_duration ? price.max_duration + 's' : 'N/A'}
          </span>
        </td>
        <td class="px-4 py-3 text-right">
          <span class="text-sm font-mono text-blue-400">$${parseFloat(price.usd_price).toFixed(4)}</span>
        </td>
        <td class="px-4 py-3 text-right">
          <span class="text-base font-bold font-mono text-yellow-400">${parseFloat(price.credits).toFixed(1)}</span>
        </td>
        <td class="px-4 py-3 text-right">
          <span class="text-sm font-mono text-green-400">Rp ${parseInt(price.our_price_idr || 0).toLocaleString('id-ID')}</span>
        </td>
        <td class="px-4 py-3 text-right">
          <span class="text-sm font-mono font-semibold ${parseFloat(price.profit_margin_actual) >= 0 ? 'text-green-400' : 'text-red-400'}">
            +${parseFloat(price.profit_margin_actual).toFixed(1)}%
          </span>
        </td>
      </tr>
    `).join('');
  }
  
  // Update summary stats
  updatePricingSummary(prices);
  
  // Show summary
  console.log(`📊 Pricing loaded: ${imageModels.length} image models, ${videoModels.length} video models`);
}

// Calculate test price
function calculateTestPrice() {
  const falPrice = parseFloat(document.getElementById('test-price').value) || 0;
  const baseCredit = parseFloat(document.getElementById('base_credit_usd').value) || 0.05;
  const margin = parseFloat(document.getElementById('profit_margin_percent').value) || 20;
  const rounding = parseFloat(document.getElementById('credit_rounding').value) || 0.5;
  const minCredits = parseFloat(document.getElementById('minimum_credits').value) || 0.5;
  
  // Calculate credits
  let credits = falPrice / baseCredit;
  credits = credits * (1 + (margin / 100));
  credits = Math.round(credits / rounding) * rounding;
  
  if (credits < minCredits) {
    credits = minCredits;
  }
  
  // Calculate our USD price
  const ourPrice = credits * baseCredit;
  
  // Calculate profit
  const profit = ourPrice - falPrice;
  const profitPercent = falPrice > 0 ? ((profit / falPrice) * 100) : 0;
  
  // Get credit price IDR for display
  const creditPriceIDR = parseFloat(document.getElementById('credit_price_idr')?.value) || 1300;
  const ourPriceIDR = Math.ceil(credits * creditPriceIDR);
  
  // Update display (show IDR now, not USD)
  document.getElementById('calc-credits').textContent = credits.toFixed(1);
  document.getElementById('calc-usd').textContent = ourPriceIDR.toLocaleString('id-ID');
  document.getElementById('calc-profit').textContent = `$${profit.toFixed(4)} (${profitPercent.toFixed(1)}%)`;
}

// Auto-calculate when inputs change
document.addEventListener('DOMContentLoaded', () => {
  const baseCreditInput = document.getElementById('base_credit_usd');
  const roundingSelect = document.getElementById('credit_rounding');
  const minimumInput = document.getElementById('minimum_credits');
  
  if (baseCreditInput) {
    baseCreditInput.addEventListener('input', () => {
      calculateTestPrice();
      recalculateAllPrices();
    });
  }
  
  if (roundingSelect) {
    roundingSelect.addEventListener('change', () => {
      calculateTestPrice();
      recalculateAllPrices();
    });
  }
  
  if (minimumInput) {
    minimumInput.addEventListener('input', () => {
      calculateTestPrice();
      recalculateAllPrices();
    });
  }
});

// Calculate credits using type-aware logic (matches database function)
function calculateCreditsTyped(falPrice, modelType) {
  // Get type-specific config
  let margin, baseCredit, minCredits, cheapThreshold;
  const rounding = parseFloat(document.getElementById('credit_rounding')?.value) || 0.5;
  
  if (modelType === 'image') {
    margin = parseFloat(document.getElementById('image_profit_margin')?.value) || 20;
    baseCredit = parseFloat(document.getElementById('image_base_credit_usd')?.value) || 0.05;
    minCredits = parseFloat(document.getElementById('image_minimum_credits')?.value) || 0.5;
    cheapThreshold = parseFloat(document.getElementById('image_cheap_threshold')?.value) || 0.01;
  } else {
    margin = parseFloat(document.getElementById('video_profit_margin')?.value) || 25;
    baseCredit = parseFloat(document.getElementById('video_base_credit_usd')?.value) || 0.08;
    minCredits = parseFloat(document.getElementById('video_minimum_credits')?.value) || 1.0;
    cheapThreshold = parseFloat(document.getElementById('video_cheap_threshold')?.value) || 0.05;
  }
  
  // Handle edge cases
  if (!falPrice || falPrice <= 0) {
    return minCredits;
  }
  
  // If very cheap, use minimum (matches database logic)
  if (falPrice < cheapThreshold) {
    return minCredits;
  }
  
  // Calculate with profit margin
  let calculated = (falPrice / baseCredit) * (1 + (margin / 100));
  
  // Round to nearest
  let finalCredits = Math.round(calculated / rounding) * rounding;
  
  // Ensure minimum
  if (finalCredits < minCredits) {
    finalCredits = minCredits;
  }
  
  return finalCredits;
}

// Recalculate all model prices with new margin
function recalculateAllPrices() {
  if (originalPrices.length === 0) {
    console.log('⏳ Waiting for prices to load...');
    return;
  }
  
  // Recalculate prices for all models using type-aware logic
  const recalculatedPrices = originalPrices.map(model => {
    const falPrice = parseFloat(model.usd_price);
    const modelType = model.type || 'image';
    
    // Use type-aware calculation (matches database)
    const credits = calculateCreditsTyped(falPrice, modelType);
    
    // Get base credit for this type
    const baseCredit = modelType === 'image' 
      ? (parseFloat(document.getElementById('image_base_credit_usd')?.value) || 0.05)
      : (parseFloat(document.getElementById('video_base_credit_usd')?.value) || 0.08);
    
    // Calculate our USD price
    const ourPrice = credits * baseCredit;
    
    // Calculate actual profit margin
    const actualMargin = falPrice > 0 ? (((ourPrice - falPrice) / falPrice) * 100) : 0;
    
    return {
      ...model,
      credits: credits,
      our_price_usd: ourPrice,
      profit_margin_actual: actualMargin
    };
  });
  
  // Update display
  displayPrices(recalculatedPrices);
  
  // Update summary stats
  updatePricingSummary(recalculatedPrices);
  
  // Log update
  const imageMargin = parseFloat(document.getElementById('image_profit_margin')?.value) || 20;
  const videoMargin = parseFloat(document.getElementById('video_profit_margin')?.value) || 25;
  console.log(`✅ Recalculated ${recalculatedPrices.length} models (Image: ${imageMargin.toFixed(1)}%, Video: ${videoMargin.toFixed(1)}%)`);
}

// Update pricing summary statistics
function updatePricingSummary(prices) {
  const imageModels = prices.filter(p => p.type === 'image');
  const videoModels = prices.filter(p => p.type === 'video');
  
  // Calculate averages
  const avgImageProfit = imageModels.length > 0 
    ? imageModels.reduce((sum, m) => sum + parseFloat(m.profit_margin_actual), 0) / imageModels.length
    : 0;
  const avgVideoProfit = videoModels.length > 0
    ? videoModels.reduce((sum, m) => sum + parseFloat(m.profit_margin_actual), 0) / videoModels.length
    : 0;
  const avgTotalProfit = prices.length > 0
    ? prices.reduce((sum, m) => sum + parseFloat(m.profit_margin_actual), 0) / prices.length
    : 0;
  
  // Update UI
  document.getElementById('total-models').textContent = prices.length;
  document.getElementById('image-count').textContent = imageModels.length;
  document.getElementById('video-count').textContent = videoModels.length;
  document.getElementById('avg-profit').textContent = `+${avgTotalProfit.toFixed(1)}%`;
  
  console.log(`📊 Realtime Update: ${imageModels.length} image (avg +${avgImageProfit.toFixed(1)}%), ${videoModels.length} video (avg +${avgVideoProfit.toFixed(1)}%)`);
}

// Reset to defaults
function resetToDefaults() {
  if (!confirm('Reset all pricing settings to defaults?\n\nDefault values:\n- Profit Margin: 20%\n- Base Credit: $0.05\n- Rounding: 0.5\n- Minimum: 0.5 credits')) {
    return;
  }
  
  document.getElementById('profit_margin_percent').value = 20;
  document.getElementById('profit_margin_slider').value = 20;
  document.getElementById('base_credit_usd').value = 0.05;
  document.getElementById('credit_rounding').value = 0.5;
  document.getElementById('minimum_credits').value = 0.5;
  
  updateProfitMargin(20, 'input');
  calculateTestPrice();
  showToast('Settings reset to defaults. Click Save to apply.', 'info');
}

// Refresh prices
function refreshPrices() {
  loadPrices();
  showToast('Prices refreshed', 'info');
}

// Toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white z-50 ${
    type === 'success' ? 'bg-green-600' :
    type === 'error' ? 'bg-red-600' :
    'bg-blue-600'
  }`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ===================================================================
// FAL.AI PRICING SYNC FUNCTIONS
// ===================================================================

/**
 * Sync pricing from FAL.AI
 * @param {boolean} dryRun - If true, preview changes without saving
 */
async function syncFalPricing(dryRun = false) {
  console.log(`🔄 syncFalPricing called with dryRun=${dryRun}`);
  
  const button = event.target.closest('button');
  if (!button) {
    console.error('❌ Button not found in event target');
    return;
  }
  
  const originalHtml = button.innerHTML;
  
  // Disable button and show loading
  button.disabled = true;
  button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Syncing...';
  
  console.log('📡 Sending sync request to /admin/api/pricing/sync...');
  
  try {
    const response = await fetch('/admin/api/pricing/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        dryRun,
        forceUpdate: false 
      })
    });
    
    console.log(`📥 Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response not OK:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('📊 Sync response:', data);
    
    if (data.success) {
      const results = data.results;
      
      console.log(`✅ Sync successful: ${results.updated} updated, ${results.unchanged} unchanged, ${results.errors} errors`);
      
      // Show results
      displaySyncResults(results, dryRun);
      
      // Show toast
      showToast(
        dryRun 
          ? `Preview: ${results.updated} models would be updated` 
          : `✅ Successfully synced ${results.updated} model prices!`,
        dryRun ? 'info' : 'success'
      );
      
      // If not dry run, reload prices
      if (!dryRun) {
        console.log('🔄 Reloading page in 2 seconds...');
        setTimeout(() => {
          location.reload();
        }, 2000);
      }
    } else {
      throw new Error(data.message || 'Sync failed');
    }
    
  } catch (error) {
    console.error('❌ Sync error:', error);
    showToast('❌ Sync error: ' + error.message, 'error');
    
    // Show error details in results div
    const resultsDiv = document.getElementById('sync-results');
    const resultsContent = document.getElementById('sync-results-content');
    if (resultsDiv && resultsContent) {
      resultsContent.innerHTML = `
        <div class="bg-red-500/10 border border-red-500/30 rounded p-3">
          <p class="text-red-400 font-semibold mb-2">❌ Sync Failed</p>
          <p class="text-sm text-gray-300">${error.message}</p>
          <p class="text-xs text-gray-500 mt-2">Check browser console (F12) for details</p>
        </div>
      `;
      resultsDiv.classList.remove('hidden');
    }
  } finally {
    button.disabled = false;
    button.innerHTML = originalHtml;
    console.log('🔄 Sync button re-enabled');
  }
}

/**
 * Display sync results in the UI
 */
function displaySyncResults(results, dryRun) {
  const resultsDiv = document.getElementById('sync-results');
  const resultsContent = document.getElementById('sync-results-content');
  
  if (!resultsDiv || !resultsContent) return;
  
  let html = `
    <div class="mb-3">
      <p class="text-white font-semibold mb-2">${dryRun ? '🔍 Preview Results:' : '✅ Sync Complete:'}</p>
      <div class="grid grid-cols-4 gap-2 text-xs">
        <div class="bg-green-500/10 border border-green-500/30 rounded p-2 text-center">
          <div class="text-2xl font-bold text-green-400">${results.updated}</div>
          <div class="text-gray-400 mt-1">Updated</div>
        </div>
        <div class="bg-blue-500/10 border border-blue-500/30 rounded p-2 text-center">
          <div class="text-2xl font-bold text-blue-400">${results.unchanged}</div>
          <div class="text-gray-400 mt-1">Unchanged</div>
        </div>
        <div class="bg-red-500/10 border border-red-500/30 rounded p-2 text-center">
          <div class="text-2xl font-bold text-red-400">${results.errors}</div>
          <div class="text-gray-400 mt-1">Errors</div>
        </div>
        <div class="bg-blue-500/10 border border-blue-500/30 rounded p-2 text-center">
          <div class="text-2xl font-bold text-blue-400">${results.total}</div>
          <div class="text-gray-400 mt-1">Total</div>
        </div>
      </div>
    </div>
  `;
  
  // Show changes if any
  if (results.changes && results.changes.length > 0) {
    html += `<div class="mt-3 max-h-60 overflow-y-auto">
      <p class="text-white font-semibold mb-2">📊 Price Changes:</p>
      <div class="space-y-2">`;
    
    results.changes.slice(0, 10).forEach(change => {
      const priceChangeColor = change.priceChange > 0 ? 'text-red-400' : 'text-green-400';
      html += `
        <div class="bg-gray-800/30 rounded p-2 text-xs">
          <div class="flex justify-between items-center">
            <span class="text-white font-semibold">${change.modelName}</span>
            <span class="${priceChangeColor}">${change.priceChange > 0 ? '+' : ''}${change.priceChange}%</span>
          </div>
          <div class="text-gray-400 mt-1">
            Price: $${change.oldPrice.toFixed(4)} → $${change.newPrice.toFixed(4)} | 
            Credits: ${change.newCredits.toFixed(1)}
          </div>
        </div>
      `;
    });
    
    html += `</div></div>`;
    
    if (results.changes.length > 10) {
      html += `<p class="text-gray-400 text-xs mt-2">... and ${results.changes.length - 10} more changes</p>`;
    }
  }
  
  resultsContent.innerHTML = html;
  resultsDiv.classList.remove('hidden');
}

/**
 * View pricing change history
 */
async function viewPricingHistory() {
  try {
    const response = await fetch('/admin/api/pricing/history?limit=50');
    const data = await response.json();
    
    if (data.success) {
      showPricingHistoryModal(data.history);
    } else {
      throw new Error(data.message || 'Failed to load history');
    }
  } catch (error) {
    console.error('History error:', error);
    showToast('❌ ' + error.message, 'error');
  }
}

/**
 * Show pricing history modal
 */
function showPricingHistoryModal(history) {
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50';
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
  
  let historyHtml = history.length === 0 
    ? '<p class="text-gray-400 text-center py-8">No pricing history yet</p>'
    : history.map(item => {
        const date = new Date(item.changed_at).toLocaleString();
        const priceChange = ((item.new_price - item.old_price) / item.old_price * 100).toFixed(1);
        const changeColor = priceChange > 0 ? 'text-red-400' : 'text-green-400';
        
        return `
          <div class="bg-gray-800/50 rounded-lg p-3 mb-2">
            <div class="flex justify-between items-start mb-1">
              <span class="text-white font-semibold">${item.model_name}</span>
              <span class="text-xs text-gray-500">${date}</span>
            </div>
            <div class="text-sm text-gray-400">
              Price: $${item.old_price ? item.old_price.toFixed(4) : '0.0000'} → $${item.new_price.toFixed(4)} 
              <span class="${changeColor}">(${priceChange > 0 ? '+' : ''}${priceChange}%)</span>
            </div>
            <div class="text-xs text-gray-500 mt-1">
              Credits: ${item.old_credits ? item.old_credits.toFixed(1) : '0.0'} → ${item.new_credits.toFixed(1)}
            </div>
            ${item.change_reason ? `<div class="text-xs text-gray-500 mt-1 italic">${item.change_reason}</div>` : ''}
          </div>
        `;
      }).join('');
  
  modal.innerHTML = `
    <div class="bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-white">📜 Pricing Change History</h3>
        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="overflow-y-auto flex-1">
        ${historyHtml}
      </div>
      <div class="mt-4 pt-4 border-t border-gray-700">
        <button onclick="this.closest('.fixed').remove()" class="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition">
          Close
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Make functions globally available
window.syncFalPricing = syncFalPricing;
window.viewPricingHistory = viewPricingHistory;

