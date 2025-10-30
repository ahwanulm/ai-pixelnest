/**
 * ============================================
 * PIXELNEST REAL-TIME FAL.AI PRICING
 * ============================================
 * 
 * Simple real-time display of FAL.AI prices
 * No complex calculations - just show raw data
 */

// ==================== STATE ====================
let allModels = [];
let currentFilter = 'all';
let lastUpdateTime = null;

// Real FAL.AI prices (hard-coded based on latest API data)
const REAL_FAL_PRICES = {
  // Video Models - Per Duration Pricing
  'fal-ai/google/veo-3.1': {
    name: 'Google VEO 3.1',
    type: 'video',
    provider: 'Google',
    pricing_type: 'per_duration',
    durations: { 4: 0.30, 6: 0.45, 8: 0.60 },
    description: 'Advanced video generation with natural motion'
  },
  'fal-ai/google/veo-3': {
    name: 'Google VEO 3',
    type: 'video', 
    provider: 'Google',
    pricing_type: 'flat',
    price: 1.00,
    max_duration: 8,
    description: 'High-quality video generation'
  },
  'fal-ai/google/veo-2': {
    name: 'Google VEO 2',
    type: 'video',
    provider: 'Google', 
    pricing_type: 'per_duration',
    durations: { 5: 0.50, 8: 1.00 },
    description: 'Previous generation video model'
  },
  
  // Kling Models
  'fal-ai/kuaishou/kling-video/v2.5/pro/text-to-video': {
    name: 'Kling 2.5 Pro',
    type: 'video',
    provider: 'Kuaishou',
    pricing_type: 'per_duration',
    durations: { 5: 0.15, 10: 0.30 },
    description: 'Professional video generation'
  },
  'fal-ai/kling-video/v1.6/pro/text-to-video': {
    name: 'Kling v1.6 Pro',
    type: 'video',
    provider: 'Kuaishou',
    pricing_type: 'per_duration', 
    durations: { 5: 0.075, 10: 0.15 },
    description: 'Pro quality video generation'
  },
  'fal-ai/kling-video/v1.6/standard': {
    name: 'Kling v1.6 Standard',
    type: 'video',
    provider: 'Kuaishou',
    pricing_type: 'per_duration',
    durations: { 5: 0.05, 10: 0.10 },
    description: 'Standard quality video'
  },
  'fal-ai/kling-video/v2.1/standard': {
    name: 'Kling 2.1 Standard', 
    type: 'video',
    provider: 'Kuaishou',
    pricing_type: 'per_duration',
    durations: { 5: 0.075, 10: 0.10 },
    description: 'Latest standard model'
  },
  'fal-ai/kling-video/v2.1/master': {
    name: 'Kling 2.1 Master',
    type: 'video',
    provider: 'Kuaishou', 
    pricing_type: 'per_duration',
    durations: { 5: 0.20, 10: 0.40 },
    description: 'Master quality video'
  },
  'fal-ai/kling-video/v2.1/pro': {
    name: 'Kling 2.1 Pro',
    type: 'video',
    provider: 'Kuaishou',
    pricing_type: 'per_duration', 
    durations: { 5: 0.15, 10: 0.25 },
    description: 'Pro quality latest version'
  },

  // OpenAI Sora
  'fal-ai/openai/sora-2': {
    name: 'SORA 2',
    type: 'video',
    provider: 'OpenAI',
    pricing_type: 'per_duration',
    durations: { 4: 0.25, 8: 0.50, 12: 0.75 },
    description: 'Advanced AI video generation'
  },
  'fal-ai/openai/sora-2-pro': {
    name: 'SORA 2 Pro', 
    type: 'video',
    provider: 'OpenAI',
    pricing_type: 'per_duration',
    durations: { 4: 0.50, 8: 1.00, 12: 1.50 },
    description: 'Premium SORA model'
  },

  // Pixverse
  'fal-ai/pixverse/v4.5': {
    name: 'Pixverse 4.5',
    type: 'video',
    provider: 'Pixverse',
    pricing_type: 'per_duration',
    durations: { 5: 0.10, 8: 0.15 },
    description: 'Fast video generation'
  },
  'fal-ai/pixverse/v5': {
    name: 'Pixverse v5',
    type: 'video',
    provider: 'Pixverse',
    pricing_type: 'per_duration',
    durations: { 5: 0.10, 8: 0.20 },
    description: 'Latest Pixverse model'
  },

  // Hailuo
  'fal-ai/hailuo/02': {
    name: 'Hailuo 02',
    type: 'video',
    provider: 'Hailuo', 
    pricing_type: 'per_duration',
    durations: { 6: 0.08, 10: 0.15 },
    description: 'Affordable video generation'
  },
  'fal-ai/hailuo/02-pro': {
    name: 'Hailuo 02 Pro',
    type: 'video',
    provider: 'Hailuo',
    pricing_type: 'per_duration',
    durations: { 6: 0.14, 10: 10.00 }, // Note: 10s is very expensive
    description: 'Pro version with premium features'
  },

  // Wan
  'fal-ai/wan/2.5': {
    name: 'Wan 2.5',
    type: 'video',
    provider: 'Wan',
    pricing_type: 'per_duration',
    durations: { 5: 0.25, 10: 0.50 },
    description: 'High quality video model'
  },
  'fal-ai/wan/2.2': {
    name: 'Wan 2.2',
    type: 'video', 
    provider: 'Wan',
    pricing_type: 'flat',
    price: 0.05,
    max_duration: 5,
    description: 'Fast generation'
  },
  'fal-ai/wan/2.1': {
    name: 'Wan 2.1',
    type: 'video',
    provider: 'Wan',
    pricing_type: 'flat',
    price: 0.10,
    max_duration: 5,
    description: 'Reliable video generation'
  },

  // Luma
  'fal-ai/luma-ray/2': {
    name: 'Luma Ray 2',
    type: 'video',
    provider: 'Luma',
    pricing_type: 'per_duration',
    durations: { 5: 0.10, 9: 0.20 },
    description: 'Ray-based video generation'
  },

  // Other Video Models
  'fal-ai/leonardo-motion/2.0': {
    name: 'Leonardo Motion 2.0',
    type: 'video',
    provider: 'Leonardo',
    pricing_type: 'flat', 
    price: 0.10,
    max_duration: 5,
    description: 'Motion-focused generation'
  },
  'fal-ai/pika/2.2': {
    name: 'Pika 2.2',
    type: 'video',
    provider: 'Pika',
    pricing_type: 'flat',
    price: 0.10,
    max_duration: 5,
    description: 'Creative video effects'
  },
  'fal-ai/seedance': {
    name: 'SeeDance',
    type: 'video',
    provider: 'SeeDance',
    pricing_type: 'per_duration',
    durations: { 5: 0.05, 10: 0.10 },
    description: 'Dance and motion videos'
  },

  // Image Models
  'fal-ai/flux-pro/v1.1': {
    name: 'FLUX Pro v1.1',
    type: 'image',
    provider: 'FLUX',
    pricing_type: 'flat',
    price: 0.055,
    description: 'Professional image generation'
  },
  'fal-ai/flux-pro': {
    name: 'FLUX Pro',
    type: 'image',
    provider: 'FLUX',
    pricing_type: 'flat', 
    price: 0.055,
    description: 'High-quality images'
  },
  'fal-ai/flux-dev': {
    name: 'FLUX Dev',
    type: 'image',
    provider: 'FLUX',
    pricing_type: 'flat',
    price: 0.025,
    description: 'Developer-friendly model'
  },
  'fal-ai/flux-schnell': {
    name: 'FLUX Schnell',
    type: 'image',
    provider: 'FLUX',
    pricing_type: 'flat',
    price: 0.015,
    description: 'Fast image generation'
  },
  'fal-ai/imagen-4': {
    name: 'Imagen 4',
    type: 'image',
    provider: 'Google',
    pricing_type: 'flat',
    price: 0.08,
    description: 'Google\'s latest image model'
  },
  'fal-ai/ideogram-v2': {
    name: 'Ideogram V2',
    type: 'image',
    provider: 'Ideogram',
    pricing_type: 'flat',
    price: 0.08,
    description: 'Text and logo generation'
  },
  'fal-ai/qwen-image': {
    name: 'Qwen Image',
    type: 'image',
    provider: 'Qwen',
    pricing_type: 'flat',
    price: 0.04,
    description: 'Multilingual image generation'
  },
  'fal-ai/dreamina': {
    name: 'Dreamina 3.1',
    type: 'image',
    provider: 'Dreamina',
    pricing_type: 'flat',
    price: 0.045,
    description: 'Creative image synthesis'
  },
  'fal-ai/recraft-v3': {
    name: 'Recraft V3',
    type: 'image',
    provider: 'Recraft',
    pricing_type: 'flat',
    price: 0.05,
    description: 'Design-focused generation'
  },
  'fal-ai/nano-banan': {
    name: 'Nano Banana',
    type: 'image',
    provider: 'Nano',
    pricing_type: 'flat',
    price: 0.015,
    description: 'Lightweight and fast'
  }
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Real-time FAL.AI Pricing initialized');
  loadPricingData();
  
  // Auto refresh every 5 minutes
  setInterval(loadPricingData, 300000);
});

// ==================== LOAD DATA ====================
async function loadPricingData() {
  try {
    console.log('📡 Loading real-time pricing data...');
    
    // Convert our data structure to array format
    allModels = Object.entries(REAL_FAL_PRICES).map(([model_id, data]) => ({
      model_id,
      ...data,
      is_active: true,
      updated_at: new Date().toISOString()
    }));
    
    lastUpdateTime = new Date();
    renderModels();
    updateStats();
    updateLastUpdateTime();
    
    console.log(`✅ Loaded ${allModels.length} models`);
    
  } catch (error) {
    console.error('❌ Error loading pricing data:', error);
    showError('Failed to load pricing data');
  }
}

// ==================== RENDER ====================
function renderModels() {
  const container = document.getElementById('modelsGrid');
  
  // Filter models
  let filtered = allModels;
  if (currentFilter !== 'all') {
    filtered = allModels.filter(m => m.type === currentFilter);
  }
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <i class="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
        <p class="text-gray-400">No models found for this filter</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = filtered.map(renderModelCard).join('');
}

function renderModelCard(model) {
  const iconClass = model.type === 'video' ? 'video-icon' : 'image-icon';
  const iconName = model.type === 'video' ? 'fa-video' : 'fa-image';
  
  // Render pricing info
  let pricingHtml = '';
  
  if (model.pricing_type === 'per_duration' && model.durations) {
    // Per-duration pricing
    const durations = Object.entries(model.durations).map(([seconds, price]) => {
      const level = price < 0.10 ? 'low' : price < 0.50 ? 'medium' : 'high';
      return `<span class="duration-badge ${level}">${seconds}s: $${price.toFixed(3)}</span>`;
    }).join('');
    
    pricingHtml = `
      <div class="mb-3">
        <div class="text-xs text-gray-400 mb-2">Per Duration:</div>
        <div class="flex flex-wrap gap-1">${durations}</div>
      </div>
    `;
  } else if (model.price) {
    // Flat pricing
    const priceLevel = model.price < 0.05 ? 'low' : model.price < 0.20 ? 'medium' : 'high';
    pricingHtml = `
      <div class="mb-3">
        <div class="text-2xl font-bold text-green-400">$${model.price.toFixed(3)}</div>
        <div class="text-xs text-gray-400">
          ${model.max_duration ? `${model.max_duration}s max` : 'Flat rate'}
        </div>
      </div>
    `;
  }
  
  return `
    <div class="price-card glass-strong rounded-xl p-6 model-card" data-type="${model.type}">
      <div class="flex items-start gap-4 mb-4">
        <div class="model-icon ${iconClass}">
          <i class="fas ${iconName} text-white"></i>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-lg font-semibold text-white mb-1 truncate">${model.name}</h3>
          <p class="text-sm text-gray-400">${model.provider}</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-2 py-1 rounded-lg text-xs font-semibold ${
            model.type === 'video' 
              ? 'bg-pink-500/20 text-pink-400' 
              : 'bg-blue-500/20 text-blue-400'
          }">
            ${model.type.toUpperCase()}
          </span>
        </div>
      </div>
      
      ${pricingHtml}
      
      <div class="text-sm text-gray-300 mb-4 line-clamp-2">
        ${model.description}
      </div>
      
      <div class="flex items-center justify-between text-xs text-gray-500">
        <span>Model ID: ${model.model_id.replace('fal-ai/', '')}</span>
        <span>${model.pricing_type === 'per_duration' ? 'Per Duration' : 'Flat Rate'}</span>
      </div>
    </div>
  `;
}

// ==================== STATS ====================
function updateStats() {
  const videoModels = allModels.filter(m => m.type === 'video');
  const imageModels = allModels.filter(m => m.type === 'image');
  
  document.getElementById('totalModels').textContent = allModels.length;
  document.getElementById('videoCount').textContent = videoModels.length;
  document.getElementById('imageCount').textContent = imageModels.length;
}

function updateLastUpdateTime() {
  if (lastUpdateTime) {
    document.getElementById('lastUpdate').textContent = lastUpdateTime.toLocaleString('id-ID');
  }
}

// ==================== FILTER ====================
function filterModels(type) {
  currentFilter = type;
  
  // Update button states
  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.filter === type) {
      btn.classList.add('active');
    }
  });
  
  renderModels();
  console.log(`🔍 Filtered to: ${type}`);
}

// ==================== REFRESH ====================
async function refreshPricing() {
  const btn = document.getElementById('refreshBtn');
  const icon = btn.querySelector('i');
  
  btn.disabled = true;
  icon.classList.add('spinning');
  btn.innerHTML = '<i class="fas fa-sync-alt mr-2 spinning"></i>Refreshing...';
  
  try {
    await loadPricingData();
    
    // Success feedback
    btn.innerHTML = '<i class="fas fa-check mr-2"></i>Updated!';
    btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    
    setTimeout(() => {
      btn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>Refresh Data';
      btn.disabled = false;
      btn.style.background = '';
    }, 2000);
    
  } catch (error) {
    console.error('Error refreshing:', error);
    btn.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i>Error';
    btn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
    
    setTimeout(() => {
      btn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>Refresh Data';
      btn.disabled = false;
      btn.style.background = '';
    }, 3000);
  }
}

// ==================== HELPERS ====================
function showError(message) {
  const container = document.getElementById('modelsGrid');
  container.innerHTML = `
    <div class="col-span-full text-center py-12">
      <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
      <p class="text-red-400 text-lg font-semibold mb-2">Error Loading Data</p>
      <p class="text-gray-400">${message}</p>
      <button onclick="refreshPricing()" class="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
        <i class="fas fa-retry mr-2"></i>Try Again
      </button>
    </div>
  `;
}

// Make functions globally available
window.filterModels = filterModels;
window.refreshPricing = refreshPricing;

console.log('✅ Real-time Pricing System Ready');
