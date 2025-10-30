/**
 * FAL.AI Model Browser Frontend
 * Browse and import models from fal.ai
 */

// ===========================
// PRICING CALCULATOR (Type-Aware)
// ===========================

function calculateCost(falPrice, type) {
  if (!falPrice || falPrice <= 0) return type === 'image' ? '0.5' : '1.0';
  
  const config = {
    image: { profitMargin: 20, baseUsd: 0.05, minimum: 0.5, cheapThreshold: 0.01 },
    video: { profitMargin: 25, baseUsd: 0.08, minimum: 1.0, cheapThreshold: 0.05 }
  };
  
  const cfg = config[type] || config.video;
  
  if (falPrice < cfg.cheapThreshold) return cfg.minimum.toFixed(1);
  
  const calculated = (falPrice / cfg.baseUsd) * (1 + (cfg.profitMargin / 100));
  const rounded = Math.round(calculated / 0.5) * 0.5;
  
  return Math.max(rounded, cfg.minimum).toFixed(1);
}

let falModels = [];
let currentFilter = 'all';

// Open browse modal
function openBrowseModal() {
  document.getElementById('browse-modal').classList.remove('hidden');
  loadFalModels();
}

// Close browse modal
function closeBrowseModal() {
  document.getElementById('browse-modal').classList.add('hidden');
}

// Load models from fal.ai
async function loadFalModels(query = '') {
  try {
    const url = `/admin/api/fal/browse?${new URLSearchParams({
      query,
      type: currentFilter !== 'all' ? currentFilter : ''
    })}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.success) {
      falModels = data.models;
      displayFalModels(falModels);
    } else {
      showToast('Failed to load models', 'error');
    }
  } catch (error) {
    console.error('Error loading fal.ai models:', error);
    showToast('Error loading models', 'error');
  }
}

// Display models in grid
function displayFalModels(models) {
  const grid = document.getElementById('fal-models-grid');

  if (models.length === 0) {
    grid.innerHTML = `
      <!-- ⚠️ PRICING WARNING BANNER -->
      <div class="col-span-full mb-4">
        <div class="glass-card p-4 rounded-xl border-2 border-yellow-500/30 bg-yellow-500/5">
          <div class="flex items-start gap-3">
            <div class="text-yellow-400 text-2xl">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="flex-1">
              <h4 class="text-yellow-400 font-bold mb-2">⚠️ PRICING ACCURACY WARNING</h4>
              <p class="text-sm text-gray-300 mb-2">
                Prices shown are from our database and <strong>may be outdated</strong>. 
                FAL.AI does not provide a pricing API, so prices must be verified manually.
              </p>
              <div class="text-xs text-gray-400 space-y-1">
                <p>• <strong>Always verify prices</strong> on <a href="https://fal.ai/models" target="_blank" class="text-blue-400 hover:underline">https://fal.ai/models</a> before adding models</p>
                <p>• Outdated prices can cause <strong>profit loss</strong> if FAL.AI prices have increased</p>
                <p>• Run monthly verification: <code class="bg-gray-800 px-2 py-1 rounded text-yellow-400">node verify-fal-pricing.js</code></p>
              </div>
              <a href="/docs/FAL_PRICING_ACCURACY_GUIDE.md" target="_blank" class="text-xs text-blue-400 hover:underline mt-2 inline-block">
                📖 Read Full Pricing Guide
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-span-full text-center py-12 text-gray-400">
        <i class="fas fa-search text-3xl mb-3 opacity-50"></i>
        <p class="text-lg">No models found</p>
        <p class="text-sm mt-2">Try a different search term</p>
      </div>
    `;
    return;
  }

  // ⚠️ PRICING WARNING BANNER (show once at top)
  const warningBanner = `
    <div class="col-span-full mb-4">
      <div class="glass-card p-4 rounded-xl border-2 border-yellow-500/30 bg-yellow-500/5">
        <div class="flex items-start gap-3">
          <div class="text-yellow-400 text-xl flex-shrink-0">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="flex-1">
            <h4 class="text-yellow-400 font-bold mb-2 text-sm">⚠️ PRICING ACCURACY WARNING</h4>
            <p class="text-xs text-gray-300 mb-2">
              Prices shown <strong>may be outdated</strong>. Always verify on 
              <a href="https://fal.ai/models" target="_blank" class="text-blue-400 hover:underline font-semibold">fal.ai/models</a> 
              before importing.
            </p>
            <div class="flex gap-2 text-xs">
              <button onclick="window.open('https://fal.ai/models', '_blank')" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition">
                <i class="fas fa-external-link-alt mr-1"></i> Verify Prices
              </button>
              <a href="#" onclick="alert('Run: node verify-fal-pricing.js\\n\\nThis checks all model prices against verified data.'); return false;" class="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition">
                <i class="fas fa-info-circle mr-1"></i> How to Verify
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  grid.innerHTML = warningBanner + models.map(model => `
    <div class="glass-card p-4 rounded-xl hover:border-blue-500/50 transition-all cursor-pointer">
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <div class="w-8 h-8 rounded-lg ${model.type === 'image' ? 'bg-blue-500/20' : 'bg-pink-500/20'} flex items-center justify-center">
              <i class="fas fa-${model.type === 'image' ? 'image' : 'video'} ${model.type === 'image' ? 'text-blue-400' : 'text-pink-400'} text-sm"></i>
            </div>
            <h4 class="font-bold text-white text-sm">${model.name}</h4>
          </div>
          <p class="text-xs text-gray-500">${model.provider}</p>
        </div>
        <div class="flex gap-1">
          ${model.viral ? '<span class="px-2 py-1 bg-pink-500/20 text-pink-400 rounded text-xs">🔥 Viral</span>' : ''}
          ${model.trending ? '<span class="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">⚡</span>' : ''}
        </div>
      </div>

      <p class="text-sm text-gray-400 mb-3 line-clamp-2">${model.description}</p>

      <div class="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span class="flex items-center gap-1">
          <i class="fas fa-gauge-high"></i> ${model.speed || 'medium'}
        </span>
        <span class="flex items-center gap-1">
          <i class="fas fa-star"></i> ${model.quality || 'good'}
        </span>
        ${model.maxDuration ? `
          <span class="flex items-center gap-1">
            <i class="fas fa-clock"></i> ${model.maxDuration}s
          </span>
        ` : ''}
      </div>
      
      <div class="flex items-center justify-between text-xs mb-3">
        <div>
          ${model.fal_price ? `
            <div class="text-gray-600">
              <span class="text-gray-500">FAL:</span> 
              <span class="font-mono">$${model.fal_price.toFixed(4)}</span>
            </div>
          ` : ''}
        </div>
        <div class="text-yellow-400 font-bold">
          <i class="fas fa-coins"></i> ${calculateCost(model.fal_price, model.type)} credits
        </div>
      </div>

      <div class="flex gap-2">
        <button 
          onclick="quickImportModel('${model.id}')" 
          class="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition text-sm font-medium"
        >
          <i class="fas fa-download mr-1"></i> Import
        </button>
        <button 
          onclick="viewModelDetails('${model.id}')" 
          class="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition text-sm"
        >
          <i class="fas fa-info-circle"></i>
        </button>
      </div>

      <div class="mt-2 text-xs text-gray-600 font-mono truncate">
        ${model.id}
      </div>
    </div>
  `).join('');
}

// Filter models by type
function filterFalModels(type) {
  currentFilter = type;

  // Update active button
  document.querySelectorAll('.fal-filter-btn').forEach(btn => {
    btn.classList.remove('active', 'bg-blue-600', 'text-white');
    btn.classList.add('bg-gray-800', 'text-gray-400');
  });

  const activeBtn = document.querySelector(`[data-filter="${type}"]`);
  activeBtn.classList.remove('bg-gray-800', 'text-gray-400');
  activeBtn.classList.add('active', 'bg-blue-600', 'text-white');

  // Reload with filter
  const searchQuery = document.getElementById('fal-search').value;
  loadFalModels(searchQuery);
}

// Quick import model
async function quickImportModel(modelId) {
  if (!confirm(`Import this model to your database?\n\nModel ID: ${modelId}`)) {
    return;
  }

  try {
    const response = await fetch('/admin/api/fal/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ modelId })
    });

    const data = await response.json();

    if (data.success) {
      showToast('✓ Model imported successfully!', 'success');
      closeBrowseModal();
      loadModels(); // Reload main models list
    } else {
      showToast(data.message || 'Import failed', 'error');
    }
  } catch (error) {
    console.error('Error importing model:', error);
    showToast('Error importing model', 'error');
  }
}

// View model details
function viewModelDetails(modelId) {
  const model = falModels.find(m => m.id === modelId);
  if (!model) return;

  const detailsHTML = `
    <div class="p-6">
      <div class="flex items-start gap-4 mb-4">
        <div class="w-16 h-16 rounded-xl ${model.type === 'image' ? 'bg-blue-500/20' : 'bg-pink-500/20'} flex items-center justify-center">
          <i class="fas fa-${model.type === 'image' ? 'image' : 'video'} ${model.type === 'image' ? 'text-blue-400' : 'text-pink-400'} text-2xl"></i>
        </div>
        <div class="flex-1">
          <h3 class="text-2xl font-bold text-white mb-1">${model.name}</h3>
          <p class="text-gray-400">${model.provider}</p>
          <div class="flex gap-2 mt-2">
            ${model.viral ? '<span class="px-2 py-1 bg-pink-500/20 text-pink-400 rounded text-xs">🔥 Viral</span>' : ''}
            ${model.trending ? '<span class="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">⚡ Trending</span>' : ''}
            <span class="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">${model.type === 'image' ? '🖼️ Image' : '🎬 Video'}</span>
          </div>
        </div>
      </div>

      <div class="space-y-3 mb-4">
        <div>
          <label class="text-sm text-gray-400">Description:</label>
          <p class="text-white">${model.description}</p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          ${model.fal_price ? `
            <div>
              <label class="text-sm text-gray-400">FAL Price:</label>
              <p class="text-blue-400 font-mono">$${model.fal_price.toFixed(4)}</p>
            </div>
          ` : ''}
          <div>
            <label class="text-sm text-gray-400">Credits:</label>
            <p class="text-yellow-400 font-bold font-mono">${model.cost?.toFixed(1) || '1.0'}</p>
          </div>
          <div>
            <label class="text-sm text-gray-400">Category:</label>
            <p class="text-white">${model.category}</p>
          </div>
          <div>
            <label class="text-sm text-gray-400">Speed:</label>
            <p class="text-white capitalize">${model.speed || 'medium'}</p>
          </div>
          <div>
            <label class="text-sm text-gray-400">Quality:</label>
            <p class="text-white capitalize">${model.quality || 'good'}</p>
          </div>
          ${model.maxDuration ? `
            <div>
              <label class="text-sm text-gray-400">Max Duration:</label>
              <p class="text-white">${model.maxDuration}s</p>
            </div>
          ` : ''}
        </div>

        <div>
          <label class="text-sm text-gray-400">Model ID:</label>
          <code class="block mt-1 px-3 py-2 bg-gray-800 rounded text-sm text-cyan-400 font-mono">${model.id}</code>
        </div>
      </div>

      <button 
        onclick="quickImportModel('${model.id}')" 
        class="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition font-medium"
      >
        <i class="fas fa-download mr-2"></i> Import This Model
      </button>
    </div>
  `;

  // Show in a simple alert (you can make this prettier)
  const detailModal = document.createElement('div');
  detailModal.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4';
  detailModal.innerHTML = `
    <div class="glass-strong rounded-2xl max-w-2xl w-full">
      <div class="flex justify-end p-4 border-b border-gray-700">
        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>
      ${detailsHTML}
    </div>
  `;
  document.body.appendChild(detailModal);
}

// Setup search listener
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('fal-search');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        loadFalModels(e.target.value);
      }, 500);
    });
  }
});

// Add CSS for filter buttons
const style = document.createElement('style');
style.textContent = `
  .fal-filter-btn {
    background: var(--glass-bg, rgba(31, 41, 55, 0.8));
    color: rgb(156, 163, 175);
  }
  .fal-filter-btn.active {
    background: rgb(37, 99, 235);
    color: white;
  }
  .fal-filter-btn:hover {
    background: rgb(55, 65, 81);
  }
  .fal-filter-btn.active:hover {
    background: rgb(29, 78, 216);
  }
  .glass-card {
    background: rgba(31, 41, 55, 0.5);
    border: 1px solid rgba(75, 85, 99, 0.3);
  }
  .glass-card:hover {
    background: rgba(31, 41, 55, 0.7);
    border-color: rgba(59, 130, 246, 0.5);
  }
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;
document.head.appendChild(style);

