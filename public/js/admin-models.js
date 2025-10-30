/**
 * Admin Models Management Frontend
 * Handles CRUD operations for AI models
 */

let allModels = [];
let currentPage = 1;
const modelsPerPage = 10;

// Load models on page load
document.addEventListener('DOMContentLoaded', () => {
  loadModels();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  // Search
  document.getElementById('search-models').addEventListener('input', debounce(filterModels, 300));
  
  // Filters
  document.getElementById('filter-type').addEventListener('change', filterModels);
  document.getElementById('filter-status').addEventListener('change', filterModels);
  
  // Form submit
  document.getElementById('model-form').addEventListener('submit', handleSubmit);

  // ✅ 3D Category auto-configuration listener
  const categorySelect = document.getElementById('model-category');
  if (categorySelect) {
    categorySelect.addEventListener('change', function() {
      const selectedCategory = this.value;
      const promptRequiredCheckbox = document.getElementById('model-prompt-required');
      const modelIdInput = document.getElementById('model-id');

      if ((selectedCategory === 'Text-to-3D' || selectedCategory === 'Image-to-3D') && promptRequiredCheckbox) {
        // Auto-set checkbox based on category
        const shouldRequirePrompt = selectedCategory === 'Text-to-3D';
        promptRequiredCheckbox.checked = shouldRequirePrompt;

        // Add visual indicator
        const label = promptRequiredCheckbox.parentElement;
        if (label) {
          // Remove existing indicator
          const existingIndicator = label.querySelector('.auto-config-indicator');
          if (existingIndicator) existingIndicator.remove();

          // Add new indicator
          const indicator = document.createElement('span');
          indicator.className = 'auto-config-indicator text-xs text-cyan-400 ml-2';
          indicator.textContent = shouldRequirePrompt
            ? '(Auto: Prompt required for text-to-3D)'
            : '(Auto: No prompt needed for image-to-3D)';
          label.appendChild(indicator);

          console.log(`🎲 ${selectedCategory} category selected - auto-configured prompt_required: ${promptRequiredCheckbox.checked}`);
        }
      } else {
        // Remove indicator for non-3D categories
        const label = promptRequiredCheckbox?.parentElement;
        if (label) {
          const existingIndicator = label.querySelector('.auto-config-indicator');
          if (existingIndicator) existingIndicator.remove();
        }
      }
    });
  }

  // Also trigger when model ID changes (for real-time feedback)
  const modelIdInput = document.getElementById('model-id');
  if (modelIdInput) {
    modelIdInput.addEventListener('input', function() {
      const categorySelect = document.getElementById('model-category');
      if (categorySelect && categorySelect.value === '3D Generation') {
        // Re-trigger category change to update auto-config
        categorySelect.dispatchEvent(new Event('change'));
      }
    });
  }
  
  // ✨ Duration configuration listeners
  const modelTypeSelect = document.getElementById('model-type');
  if (modelTypeSelect) {
    modelTypeSelect.addEventListener('change', () => {
      const selectedType = modelTypeSelect.value;
      const durationSection = document.getElementById('duration-config-section');
      if (durationSection) {
        if (selectedType === 'video') {
          durationSection.style.display = 'block';
        } else {
          durationSection.style.display = 'none';
        }
      }
    });
  }
  
  const availableDurationsInput = document.getElementById('available-durations');
  if (availableDurationsInput) {
    availableDurationsInput.addEventListener('input', updateDurationPreview);
  }
  
  const pricePerSecondInput = document.getElementById('price-per-second-input');
  if (pricePerSecondInput) {
    pricePerSecondInput.addEventListener('input', updateDurationPreview);
  }
}

// ✨ Update duration preview
function updateDurationPreview() {
  const durationsInput = document.getElementById('available-durations')?.value.trim() || '';
  const pricePerSecond = parseFloat(document.getElementById('price-per-second-input')?.value) || 0;
  const previewDiv = document.getElementById('duration-preview');
  
  if (!previewDiv) return;
  
  if (!durationsInput) {
    previewDiv.innerHTML = '<p class="text-gray-500">Enter durations above to see preview...</p>';
    return;
  }
  
  const durations = durationsInput.split(',').map(d => d.trim()).filter(d => d);
  
  if (durations.length === 0) {
    previewDiv.innerHTML = '<p class="text-gray-500">No valid durations entered...</p>';
    return;
  }
  
  let html = '<div class="space-y-2">';
  
  durations.forEach((duration, idx) => {
    const durationNum = parseFloat(duration.replace('s', ''));
    const isValidNumber = !isNaN(durationNum);
    
    html += `<div class="flex items-center justify-between p-2 bg-gray-800/30 rounded">`;
    html += `<span class="font-mono text-white">${duration}</span>`;
    
    if (isValidNumber && pricePerSecond > 0) {
      const totalPrice = pricePerSecond * durationNum;
      const credits = Math.max(0.1, Math.round(totalPrice * 10 * 10) / 10); // ×10 formula
      html += `<span class="text-xs text-gray-400">$${totalPrice.toFixed(4)} = <span class="text-yellow-400 font-bold">${credits} cr</span></span>`;
    } else if (isValidNumber) {
      html += `<span class="text-xs text-gray-500">${durationNum}s (set price/s for calculation)</span>`;
    } else {
      html += `<span class="text-xs text-gray-500">Custom duration</span>`;
    }
    
    html += '</div>';
  });
  
  html += '</div>';
  
  if (durations.length > 0 && pricePerSecond > 0) {
    html += `<div class="mt-2 p-2 bg-cyan-900/20 border border-cyan-500/20 rounded text-xs text-cyan-300">`;
    html += `<i class="fas fa-calculator mr-1"></i> Auto-calculates credits based on duration × price per second`;
    html += `</div>`;
  }
  
  previewDiv.innerHTML = html;
}

// Update category options based on selected type
function updateCategoryOptions() {
  const typeSelect = document.getElementById('model-type');
  const categorySelect = document.getElementById('model-category');
  const selectedType = typeSelect.value;
  const currentCategory = categorySelect.value;
  
  // Get all category options
  const allOptions = Array.from(categorySelect.options);
  
  // Reset to show all options first
  allOptions.forEach(option => {
    option.style.display = '';
  });
  
  // If a type is selected, filter categories
  if (selectedType) {
    allOptions.forEach(option => {
      const optionType = option.getAttribute('data-type');
      
      // Hide options that don't match the selected type (except the default "Select Category" option)
      if (optionType && optionType !== selectedType) {
        option.style.display = 'none';
      }
    });
    
    // Reset category selection if current category doesn't match the type
    const currentCategoryOption = allOptions.find(opt => opt.value === currentCategory);
    if (currentCategoryOption) {
      const currentCategoryType = currentCategoryOption.getAttribute('data-type');
      if (currentCategoryType && currentCategoryType !== selectedType) {
        categorySelect.value = '';
      }
    }
  }
}

// Load models from API
async function loadModels() {
  // ✅ FIX: Prevent reload when modal is open (user is editing)
  const modalEl = document.getElementById('model-modal');
  if (modalEl && !modalEl.classList.contains('hidden')) {
    console.log('⏸️ Skipping reload - modal is open (preventing form reset)');
    return;
  }
  
  try {
    // Add cache-busting parameter with random to force refresh
    const cacheBuster = Date.now() + Math.random();
    const response = await fetch(`/admin/api/models?_=${cacheBuster}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    const data = await response.json();
    
    console.log(`🔄 Loaded ${data.models?.length || 0} models from API`);
    
    if (data.success) {
      allModels = data.models;
      console.log('📊 Models cost data:', allModels.slice(0, 5).map(m => ({id: m.id, name: m.name, cost: m.cost})));
      updateStats(data.stats);
      filterModels();
    } else {
      showToast('Failed to load models', 'error');
    }
  } catch (error) {
    console.error('Error loading models:', error);
    showToast('Error loading models', 'error');
  }
}

// Update statistics
function updateStats(stats) {
  document.getElementById('total-models').textContent = stats.total_models || 0;
  document.getElementById('image-models').textContent = stats.image_models || 0;
  document.getElementById('video-models').textContent = stats.video_models || 0;
  document.getElementById('audio-models').textContent = stats.audio_models || 0;
  document.getElementById('trending-models').textContent = stats.trending_models || 0;
}

// Filter and display models
function filterModels() {
  const searchTerm = document.getElementById('search-models').value.toLowerCase();
  const typeFilter = document.getElementById('filter-type').value;
  const statusFilter = document.getElementById('filter-status').value;
  
  let filtered = allModels.filter(model => {
    // Search filter
    const matchesSearch = !searchTerm || 
      model.name.toLowerCase().includes(searchTerm) ||
      model.provider?.toLowerCase().includes(searchTerm) ||
      model.description?.toLowerCase().includes(searchTerm) ||
      model.model_id.toLowerCase().includes(searchTerm);
    
    // Type filter
    const matchesType = !typeFilter || model.type === typeFilter;
    
    // Status filter
    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = model.is_active;
    else if (statusFilter === 'inactive') matchesStatus = !model.is_active;
    else if (statusFilter === 'trending') matchesStatus = model.trending;
    else if (statusFilter === 'viral') matchesStatus = model.viral;
    
    return matchesSearch && matchesType && matchesStatus;
  });
  
  displayModels(filtered);
}

// Display models in table
// Track selected models for bulk actions
let selectedModels = new Set();

function displayModels(models) {
  const tbody = document.getElementById('models-table-body');
  
  if (models.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="px-6 py-8 text-center text-gray-400">
          <i class="fas fa-search text-2xl mb-2"></i>
          <p>No models found</p>
        </td>
      </tr>
    `;
    return;
  }
  
  // Pagination
  const startIndex = (currentPage - 1) * modelsPerPage;
  const endIndex = startIndex + modelsPerPage;
  const paginatedModels = models.slice(startIndex, endIndex);
  
  tbody.innerHTML = paginatedModels.map(model => `
    <tr class="hover:bg-gray-800/30 transition">
      <td class="px-3 md:px-4 py-3 md:py-4">
        <input 
          type="checkbox" 
          class="model-checkbox w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800 cursor-pointer"
          data-model-id="${model.id}"
          ${selectedModels.has(model.id) ? 'checked' : ''}
          onchange="toggleModelSelection(${model.id}, this.checked)"
        >
      </td>
      <td class="px-3 md:px-6 py-3 md:py-4">
        <div class="flex items-center space-x-2 md:space-x-3">
          <div class="w-8 h-8 md:w-10 md:h-10 rounded-lg ${getTypeColor(model.type)} flex items-center justify-center flex-shrink-0">
            <i class="fas fa-${getTypeIcon(model.type)} text-white text-sm"></i>
          </div>
          <div class="min-w-0">
            <p class="font-semibold text-white text-sm truncate">${model.name}</p>
            <p class="text-xs text-gray-400 truncate">${model.provider || 'Unknown'}</p>
            <div class="sm:hidden flex flex-wrap gap-1 mt-1">
              <span class="px-2 py-0.5 rounded-full text-xs font-semibold ${getTypeBadgeColor(model.type)}">
                ${model.type === 'image' ? 'IMG' : model.type === 'video' ? 'VID' : model.type === 'audio' ? 'AUD' : model.type.toUpperCase().substring(0, 3)}
              </span>
              ${model.is_active ? '<span class="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">✓</span>' : ''}
              ${model.trending ? '<span class="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs">🔥</span>' : ''}
            </div>
          </div>
        </div>
      </td>
      <td class="px-3 md:px-6 py-3 md:py-4 hidden sm:table-cell">
        <span class="px-2 md:px-3 py-1 rounded-full text-xs font-semibold ${getTypeBadgeColor(model.type)}">
          ${model.type.toUpperCase()}
        </span>
      </td>
      <td class="px-3 md:px-6 py-3 md:py-4 hidden lg:table-cell">
        <span class="text-xs md:text-sm text-gray-300">${model.category}</span>
      </td>
      <td class="px-3 md:px-6 py-3 md:py-4 hidden md:table-cell">
        <div class="flex flex-wrap gap-1">
          ${model.is_active ? '<span class="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Active</span>' : '<span class="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs">Inactive</span>'}
          ${model.trending ? '<span class="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">🔥</span>' : ''}
          ${model.viral ? '<span class="px-2 py-1 bg-pink-500/20 text-pink-400 rounded text-xs">⚡</span>' : ''}
          ${model.is_custom ? '<span class="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">Custom</span>' : ''}
          ${model.fal_verified ? '<span class="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs" title="Verified with FAL.AI API">✓ FAL</span>' : ''}
        </div>
      </td>
      <td class="px-3 md:px-6 py-3 md:py-4 text-sm">
        <div class="text-gray-300">
          ${model.fal_price ? `$${parseFloat(model.fal_price).toFixed(3)}` : 'N/A'}
        </div>
        <div class="text-xs text-gray-500">
          ${model.fal_price ? `≈ Rp ${Math.ceil(model.fal_price * 16000).toLocaleString('id-ID')}` : ''}
        </div>
      </td>
      <td class="px-3 md:px-6 py-3 md:py-4">
        <div class="flex items-center gap-2">
          <span class="text-yellow-400 font-mono font-bold text-sm md:text-base" id="cost-display-${model.id}">${parseFloat(model.cost || 1).toFixed(1)}</span>
          <span class="text-gray-500 text-xs hidden md:inline">credits</span>
          <button 
            onclick="window.editCredits(${model.id}, ${parseFloat(model.cost || 1)})" 
            class="text-yellow-400 hover:text-yellow-300 transition text-xs"
            title="Edit Credits"
          >
            <i class="fas fa-edit"></i>
          </button>
          ${parseFloat(model.fal_price || 0) > 0 ? `
          <button 
            onclick="syncSinglePrice(${model.id}, '${model.name.replace(/'/g, "\\'")}')" 
            class="text-blue-400 hover:text-blue-300 transition text-xs"
            title="Sync Price from FAL.AI ($${parseFloat(model.fal_price || 0).toFixed(3)})"
          >
            <i class="fas fa-sync"></i>
          </button>
          ` : `
          <button 
            disabled
            class="text-gray-600 cursor-not-allowed transition text-xs"
            title="No FAL.AI price data available"
          >
            <i class="fas fa-ban"></i>
          </button>
          `}
        </div>
      </td>
      <td class="px-3 md:px-6 py-3 md:py-4">
        <div class="flex items-center gap-1 md:gap-2">
          <button 
            onclick="editModel(${model.id})" 
            class="px-2 md:px-3 py-1.5 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-xs md:text-sm"
            title="Edit"
          >
            <i class="fas fa-edit"></i>
          </button>
          <button 
            onclick="toggleModelStatus(${model.id}, ${model.is_active})" 
            class="px-2 md:px-3 py-1.5 md:py-2 ${model.is_active ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg transition text-xs md:text-sm"
            title="${model.is_active ? 'Disable' : 'Enable'}"
          >
            <i class="fas fa-${model.is_active ? 'eye-slash' : 'eye'}"></i>
          </button>
          ${model.is_custom ? `
            <button 
              onclick="deleteModel(${model.id})" 
              class="px-2 md:px-3 py-1.5 md:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-xs md:text-sm"
              title="Delete"
            >
              <i class="fas fa-trash"></i>
            </button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');
  
  renderPagination(models.length);
}

// Render pagination
function renderPagination(totalItems) {
  const totalPages = Math.ceil(totalItems / modelsPerPage);
  const pagination = document.getElementById('pagination');
  
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }
  
  let html = '';
  
  // Previous button
  html += `
    <button 
      onclick="changePage(${currentPage - 1})" 
      ${currentPage === 1 ? 'disabled' : ''}
      class="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <i class="fas fa-chevron-left"></i>
    </button>
  `;
  
  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      html += `
        <button 
          onclick="changePage(${i})" 
          class="px-4 py-2 ${i === currentPage ? 'bg-blue-600' : 'bg-gray-800'} text-white rounded-lg hover:bg-blue-700 transition"
        >
          ${i}
        </button>
      `;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      html += '<span class="px-2 text-gray-500">...</span>';
    }
  }
  
  // Next button
  html += `
    <button 
      onclick="changePage(${currentPage + 1})" 
      ${currentPage === totalPages ? 'disabled' : ''}
      class="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <i class="fas fa-chevron-right"></i>
    </button>
  `;
  
  pagination.innerHTML = html;
}

// Change page
function changePage(page) {
  currentPage = page;
  filterModels();
}

// Open add modal
function openAddModal() {
  document.getElementById('modal-title').textContent = 'Add New Model';
  document.getElementById('model-form').reset();
  document.getElementById('model-edit-id').value = '';
  document.getElementById('model-active').checked = true;
  
  // Reset pricing structure to simple
  if (document.getElementById('pricing-structure-type')) {
    document.getElementById('pricing-structure-type').value = 'simple';
    switchPricingStructure();
  }
  
  document.getElementById('model-modal').classList.remove('hidden');
}

// Edit model
function editModel(id) {
  const model = allModels.find(m => m.id === id);
  if (!model) return;
  
  document.getElementById('modal-title').textContent = 'Edit Model';
  document.getElementById('model-edit-id').value = model.id;
  document.getElementById('model-id').value = model.model_id;
  document.getElementById('model-name').value = model.name;
  document.getElementById('model-provider').value = model.provider || '';
  document.getElementById('model-description').value = model.description || '';
  document.getElementById('model-type').value = model.type;
  document.getElementById('model-category').value = model.category;
  document.getElementById('model-speed').value = model.speed || '';
  document.getElementById('model-quality').value = model.quality || '';
  document.getElementById('model-cost').value = model.cost || 1;
  document.getElementById('model-trending').checked = model.trending;
  document.getElementById('model-viral').checked = model.viral;
  document.getElementById('model-active').checked = model.is_active;
  document.getElementById('model-prompt-required').checked = model.prompt_required !== false; // Default to true
  
  // Populate advanced configuration from metadata
  if (model.metadata) {
    const metadata = typeof model.metadata === 'string' ? JSON.parse(model.metadata) : model.metadata;
    
    // Aspect ratio style
    if (document.getElementById('aspect-ratio-style') && metadata.aspect_ratio_style) {
      document.getElementById('aspect-ratio-style').value = metadata.aspect_ratio_style;
    }
    
    // Duration format
    if (document.getElementById('duration-format-type') && metadata.duration_format) {
      document.getElementById('duration-format-type').value = metadata.duration_format;
    }
    
    // Feature flags
    if (document.getElementById('supports-i2v') && metadata.supports_i2v) {
      document.getElementById('supports-i2v').checked = metadata.supports_i2v;
    }
    
    if (document.getElementById('supports-multi-image') && metadata.supports_multi_image) {
      document.getElementById('supports-multi-image').checked = metadata.supports_multi_image;
    }
    
    // Custom parameters
    if (document.getElementById('custom-parameters') && metadata.custom_parameters) {
      document.getElementById('custom-parameters').value = JSON.stringify(metadata.custom_parameters, null, 2);
    }
    
    // Custom API endpoint
    if (document.getElementById('custom-api-endpoint') && metadata.custom_api_endpoint) {
      document.getElementById('custom-api-endpoint').value = metadata.custom_api_endpoint;
    }
  }
  
  // Determine pricing structure from model data
  let pricingStructure = 'simple';
  
  if (model.has_multi_tier_pricing || model.price_text_to_video_no_audio) {
    pricingStructure = 'multi_tier';
  } else if (model.price_per_pixel) {
    pricingStructure = 'per_pixel';
  } else if (model.price_per_megapixel) {
    pricingStructure = 'per_megapixel';
  } else if (model.base_3d_price) {
    pricingStructure = '3d_modeling';
  } else if (model.price_sd || model.price_hd || model.price_2k || model.price_4k) {
    pricingStructure = 'resolution_based';
  }
  
  // Set pricing structure
  if (document.getElementById('pricing-structure-type')) {
    document.getElementById('pricing-structure-type').value = pricingStructure;
    switchPricingStructure();
  }
  
  // Populate pricing fields based on structure
  if (pricingStructure === 'simple') {
    if (document.getElementById('model-fal-price')) {
      document.getElementById('model-fal-price').value = model.fal_price || '';
    }
    if (document.getElementById('model-pricing-type')) {
      document.getElementById('model-pricing-type').value = model.pricing_type || 'flat';
    }
    if (document.getElementById('model-duration')) {
      document.getElementById('model-duration').value = model.max_duration || '';
    }
  } else if (pricingStructure === 'per_pixel') {
    if (document.getElementById('price-per-pixel')) {
      document.getElementById('price-per-pixel').value = model.price_per_pixel || '';
    }
    if (document.getElementById('base-resolution')) {
      document.getElementById('base-resolution').value = model.base_resolution || '1920x1080';
    }
    if (document.getElementById('max-upscale-factor')) {
      document.getElementById('max-upscale-factor').value = model.max_upscale_factor || 4;
    }
  } else if (pricingStructure === 'per_megapixel') {
    if (document.getElementById('price-per-megapixel')) {
      document.getElementById('price-per-megapixel').value = model.price_per_megapixel || '';
    }
    if (document.getElementById('base-megapixels')) {
      document.getElementById('base-megapixels').value = model.base_megapixels || 1.0;
    }
    if (document.getElementById('max-megapixels')) {
      document.getElementById('max-megapixels').value = model.max_megapixels || 2.0;
    }
  } else if (pricingStructure === 'multi_tier') {
    if (document.getElementById('price-ttv-no-audio')) {
      document.getElementById('price-ttv-no-audio').value = model.price_text_to_video_no_audio || '';
    }
    if (document.getElementById('price-ttv-with-audio')) {
      document.getElementById('price-ttv-with-audio').value = model.price_text_to_video_with_audio || '';
    }
    if (document.getElementById('price-itv-no-audio')) {
      document.getElementById('price-itv-no-audio').value = model.price_image_to_video_no_audio || '';
    }
    if (document.getElementById('price-itv-with-audio')) {
      document.getElementById('price-itv-with-audio').value = model.price_image_to_video_with_audio || '';
    }
    if (document.getElementById('multi-tier-duration')) {
      document.getElementById('multi-tier-duration').value = model.max_duration || 8;
    }
  } else if (pricingStructure === '3d_modeling') {
    if (document.getElementById('3d-base-price')) {
      document.getElementById('3d-base-price').value = model.base_3d_price || '';
    }
    if (document.getElementById('3d-quality-multiplier')) {
      document.getElementById('3d-quality-multiplier').value = model.quality_multiplier || 1;
    }
  } else if (pricingStructure === 'resolution_based') {
    if (document.getElementById('price-sd')) {
      document.getElementById('price-sd').value = model.price_sd || '';
    }
    if (document.getElementById('price-hd')) {
      document.getElementById('price-hd').value = model.price_hd || '';
    }
    if (document.getElementById('price-2k')) {
      document.getElementById('price-2k').value = model.price_2k || '';
    }
    if (document.getElementById('price-4k')) {
      document.getElementById('price-4k').value = model.price_4k || '';
    }
  }
  
  // ✨ Populate duration fields
  if (document.getElementById('available-durations')) {
    if (model.available_durations && Array.isArray(model.available_durations)) {
      document.getElementById('available-durations').value = model.available_durations.join(',');
    } else if (typeof model.available_durations === 'string') {
      document.getElementById('available-durations').value = model.available_durations;
    } else {
      document.getElementById('available-durations').value = '';
    }
  }
  
  if (document.getElementById('price-per-second-input')) {
    document.getElementById('price-per-second-input').value = model.price_per_second || '';
  }
  
  // Show/hide duration section based on type
  const durationSection = document.getElementById('duration-config-section');
  if (durationSection) {
    if (model.type === 'video') {
      durationSection.style.display = 'block';
    } else {
      durationSection.style.display = 'none';
    }
  }
  
  // Update duration preview
  updateDurationPreview();
  
  // Trigger credit calculation
  setTimeout(() => autoCalculateCredits(), 100);
  
  document.getElementById('model-modal').classList.remove('hidden');
}

// Close modal
function closeModal() {
  document.getElementById('model-modal').classList.add('hidden');
  
  // ✅ Reload models after modal closes (safe now)
  setTimeout(() => loadModels(), 300);
}

// Handle form submit
async function handleSubmit(e) {
  e.preventDefault();
  
  const editId = document.getElementById('model-edit-id').value;
  const isEdit = editId !== '';
  
  const structureType = document.getElementById('pricing-structure-type')?.value || 'simple';
  
  const modelId = document.getElementById('model-id').value;
  const category = document.getElementById('model-category').value;

  // ✅ Auto-handle prompt_required for 3D models
  let promptRequired = document.getElementById('model-prompt-required').checked;

  // For 3D categories, auto-determine prompt_required based on category
  if (category === 'Text-to-3D') {
    // Text-to-3D models ALWAYS need prompt
    promptRequired = true;
    console.log(`🎲 Text-to-3D Model auto-configured: prompt_required = true`);
  } else if (category === 'Image-to-3D') {
    // Image-to-3D models NEVER need prompt (they use uploaded image)
    promptRequired = false;
    console.log(`🎲 Image-to-3D Model auto-configured: prompt_required = false`);
  }

  const modelData = {
    model_id: modelId,
    name: document.getElementById('model-name').value,
    provider: document.getElementById('model-provider').value,
    description: document.getElementById('model-description').value,
    type: document.getElementById('model-type').value,
    category: category,
    speed: document.getElementById('model-speed').value,
    quality: document.getElementById('model-quality').value,
    cost: parseFloat(document.getElementById('model-cost').value),
    trending: document.getElementById('model-trending').checked,
    viral: document.getElementById('model-viral').checked,
    is_active: document.getElementById('model-active').checked,
    prompt_required: promptRequired,
    is_custom: true,
    pricing_structure: structureType
  };
  
  // ✨ Add duration configuration (for video models)
  const availableDurationsInput = document.getElementById('available-durations')?.value.trim();
  if (availableDurationsInput) {
    // Convert comma-separated string to array
    const durationsArray = availableDurationsInput.split(',').map(d => d.trim()).filter(d => d);
    modelData.available_durations = durationsArray;
  } else {
    modelData.available_durations = null;
  }
  
  const pricePerSecondInput = document.getElementById('price-per-second-input')?.value;
  if (pricePerSecondInput) {
    modelData.price_per_second = parseFloat(pricePerSecondInput);
  } else {
    modelData.price_per_second = null;
  }
  
  // ✨ Build metadata object with advanced configuration
  const metadata = {};
  
  // Aspect ratio style
  const aspectRatioStyle = document.getElementById('aspect-ratio-style')?.value;
  if (aspectRatioStyle) {
    metadata.aspect_ratio_style = aspectRatioStyle;
  }
  
  // Duration format
  const durationFormat = document.getElementById('duration-format-type')?.value;
  if (durationFormat) {
    metadata.duration_format = durationFormat;
  }
  
  // Feature flags
  metadata.supports_i2v = document.getElementById('supports-i2v')?.checked || false;
  metadata.supports_multi_image = document.getElementById('supports-multi-image')?.checked || false;
  
  // Custom parameters (parse JSON)
  const customParamsInput = document.getElementById('custom-parameters')?.value.trim();
  if (customParamsInput) {
    try {
      const customParams = JSON.parse(customParamsInput);
      metadata.custom_parameters = customParams;
    } catch (e) {
      alert('Invalid JSON in Custom Parameters field. Please check the format.');
      return;
    }
  }
  
  // Custom API endpoint
  const customEndpoint = document.getElementById('custom-api-endpoint')?.value.trim();
  if (customEndpoint) {
    metadata.custom_api_endpoint = customEndpoint;
  }
  
  // Add metadata to modelData if not empty
  if (Object.keys(metadata).length > 0) {
    modelData.metadata = metadata;
  }
  
  // Add pricing fields based on structure type
  if (structureType === 'simple') {
    modelData.fal_price = document.getElementById('model-fal-price').value ? parseFloat(document.getElementById('model-fal-price').value) : null;
    modelData.pricing_type = document.getElementById('model-pricing-type').value || 'flat';
    modelData.max_duration = document.getElementById('model-duration').value ? parseInt(document.getElementById('model-duration').value) : null;
  } else if (structureType === 'per_pixel') {
    modelData.price_per_pixel = parseFloat(document.getElementById('price-per-pixel').value) || 0;
    modelData.base_resolution = document.getElementById('base-resolution').value || '1920x1080';
    modelData.max_upscale_factor = parseFloat(document.getElementById('max-upscale-factor').value) || 4;
    modelData.pricing_type = 'per_pixel';
  } else if (structureType === 'per_megapixel') {
    modelData.price_per_megapixel = parseFloat(document.getElementById('price-per-megapixel').value) || 0;
    modelData.base_megapixels = parseFloat(document.getElementById('base-megapixels').value) || 1.0;
    modelData.max_megapixels = parseFloat(document.getElementById('max-megapixels').value) || 2.0;
    modelData.pricing_type = 'per_megapixel';
  } else if (structureType === 'multi_tier') {
    modelData.has_multi_tier_pricing = true;
    modelData.price_text_to_video_no_audio = parseFloat(document.getElementById('price-ttv-no-audio').value) || 0;
    modelData.price_text_to_video_with_audio = parseFloat(document.getElementById('price-ttv-with-audio').value) || 0;
    modelData.price_image_to_video_no_audio = parseFloat(document.getElementById('price-itv-no-audio').value) || 0;
    modelData.price_image_to_video_with_audio = parseFloat(document.getElementById('price-itv-with-audio').value) || 0;
    modelData.max_duration = parseInt(document.getElementById('multi-tier-duration').value) || 8;
    modelData.pricing_type = 'multi_tier';
  } else if (structureType === '3d_modeling') {
    modelData.base_3d_price = parseFloat(document.getElementById('3d-base-price').value) || 0;
    modelData.quality_multiplier = parseFloat(document.getElementById('3d-quality-multiplier').value) || 1;
    modelData.pricing_type = '3d_modeling';
  } else if (structureType === 'resolution_based') {
    modelData.price_sd = parseFloat(document.getElementById('price-sd').value) || 0;
    modelData.price_hd = parseFloat(document.getElementById('price-hd').value) || 0;
    modelData.price_2k = parseFloat(document.getElementById('price-2k').value) || 0;
    modelData.price_4k = parseFloat(document.getElementById('price-4k').value) || 0;
    modelData.pricing_type = 'resolution_based';
  }
  
  try {
    const url = isEdit ? `/admin/api/models/${editId}` : '/admin/api/models';
    const method = isEdit ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(modelData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      let successMessage = isEdit ? 'Model updated successfully' : 'Model added successfully';
      
      // Show FAL.AI verification status for new models
      if (!isEdit && data.fal_verification) {
        const verification = data.fal_verification;
        
        if (verification.verified) {
          successMessage += '\n\n✅ FAL.AI Verification: VERIFIED';
          successMessage += '\n💰 FAL Price: $' + verification.fal_price;
          console.log('✅ Model verified with FAL.AI API');
        } else {
          successMessage += '\n\n⚠️ FAL.AI Verification: ' + verification.message;
          console.log('⚠️ Model not verified:', verification.message);
        }
      }
      
      showToast(successMessage, 'success');
      closeModal();
      loadModels();
    } else {
      // Check if this is a pricing validation error
      if (data.errors || data.warnings) {
        let errorMessage = data.message || 'Pricing validation failed';
        
        // Show validation errors
        if (data.errors && data.errors.length > 0) {
          errorMessage += '\n\nErrors:\n' + data.errors.join('\n');
        }
        
        // Show warnings
        if (data.warnings && data.warnings.length > 0) {
          errorMessage += '\n\nWarnings:\n' + data.warnings.join('\n');
        }
        
        // Show suggestions
        if (data.suggestions && data.suggestions.length > 0) {
          errorMessage += '\n\nSuggestions:\n' + data.suggestions.join('\n');
        }
        
        // Show calculated values if available
        if (data.calculated) {
          errorMessage += '\n\nCalculated:\n';
          errorMessage += `Credits: ${data.calculated.credits}\n`;
          errorMessage += `User Price: ${data.calculated.userPriceIDR}\n`;
          errorMessage += `Profit: ${data.calculated.profitMargin}`;
        }
        
        alert(errorMessage);
      } else {
        showToast(data.message || 'Operation failed', 'error');
      }
    }
  } catch (error) {
    console.error('Error:', error);
    showToast('An error occurred', 'error');
  }
}

// Toggle model status
async function toggleModelStatus(id, currentStatus) {
  try {
    const response = await fetch(`/admin/api/models/${id}/toggle`, {
      method: 'PATCH'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast(`Model ${currentStatus ? 'disabled' : 'enabled'} successfully`, 'success');
      loadModels();
    } else {
      showToast(data.message || 'Operation failed', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showToast('An error occurred', 'error');
  }
}

// Delete model
async function deleteModel(id) {
  if (!confirm('Are you sure you want to delete this model? This action cannot be undone.')) {
    return;
  }
  
  try {
    const response = await fetch(`/admin/api/models/${id}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast('Model deleted successfully', 'success');
      loadModels();
    } else {
      showToast(data.message || 'Delete failed', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showToast('An error occurred', 'error');
  }
}

// Toggle multi-tier pricing UI
// Toggle pricing help display
function togglePricingHelp() {
  const helpDiv = document.getElementById('pricing-help');
  if (helpDiv) {
    helpDiv.classList.toggle('hidden');
  }
}

// Switch pricing structure display
function switchPricingStructure() {
  const structureType = document.getElementById('pricing-structure-type')?.value || 'simple';
  
  // Hide all sections first
  document.getElementById('simple-pricing-section')?.classList.add('hidden');
  document.getElementById('per-pixel-pricing-section')?.classList.add('hidden');
  document.getElementById('per-megapixel-pricing-section')?.classList.add('hidden');
  document.getElementById('multi-tier-pricing-section')?.classList.add('hidden');
  document.getElementById('3d-modeling-pricing-section')?.classList.add('hidden');
  document.getElementById('resolution-based-pricing-section')?.classList.add('hidden');
  
  // Show selected section
  if (structureType === 'simple') {
    document.getElementById('simple-pricing-section')?.classList.remove('hidden');
  } else if (structureType === 'per_pixel') {
    document.getElementById('per-pixel-pricing-section')?.classList.remove('hidden');
  } else if (structureType === 'per_megapixel') {
    document.getElementById('per-megapixel-pricing-section')?.classList.remove('hidden');
  } else if (structureType === 'multi_tier') {
    document.getElementById('multi-tier-pricing-section')?.classList.remove('hidden');
  } else if (structureType === '3d_modeling') {
    document.getElementById('3d-modeling-pricing-section')?.classList.remove('hidden');
  } else if (structureType === 'resolution_based') {
    document.getElementById('resolution-based-pricing-section')?.classList.remove('hidden');
  }
  
  autoCalculateCredits();
}

// Legacy function for backward compatibility
function toggleMultiTierPricing() {
  switchPricingStructure();
}

// Auto-calculate credits based on FAL.AI pricing
function autoCalculateCredits() {
  // Support both old (credits-calculation) and new (pricing-info-display) div IDs
  const previewDiv = document.getElementById('pricing-info-display') || document.getElementById('credits-calculation');
  
  if (!previewDiv) {
    console.warn('⚠️ No pricing display div found (pricing-info-display or credits-calculation)');
    return;
  }
  
  const structureType = document.getElementById('pricing-structure-type')?.value || 'simple';
  
  // SIMPLE PRICING (Flat or Per-Second)
  if (structureType === 'simple') {
    const falPrice = parseFloat(document.getElementById('model-fal-price')?.value) || 0;
    const pricingType = document.getElementById('model-pricing-type')?.value || 'flat';
    const modelType = document.getElementById('model-type')?.value || 'image';
    const maxDuration = parseInt(document.getElementById('model-duration')?.value) || 10;
    
    if (!falPrice || falPrice <= 0) {
      previewDiv.innerHTML = '<p class="text-gray-500">Enter FAL price...</p>';
      document.getElementById('model-cost').value = 1;
      return;
    }
    
    let html = '';
    if (modelType === 'video' && pricingType === 'per_second') {
      // Per-second: Store credits PER SECOND (×10 formula)
      const creditsPerSecond = Math.max(0.1, Math.round(falPrice * 10 * 10) / 10);
      html = `<p class="text-xs text-cyan-300 font-semibold">⚡ Per-Second</p><p class="text-sm mt-1">$${falPrice}/s = <span class="text-yellow-400 font-bold">${creditsPerSecond} cr/s</span><br><span class="text-xs text-gray-400">Example: ${maxDuration}s video = ${(creditsPerSecond * maxDuration).toFixed(1)} cr</span></p>`;
      document.getElementById('model-cost').value = creditsPerSecond;
    } else {
      // Flat rate: ×10 formula
      const credits = Math.max(0.1, Math.round(falPrice * 10 * 10) / 10);
      html = `<p class="text-xs text-cyan-300 font-semibold">💎 Flat Rate</p><p class="text-sm mt-1">$${falPrice.toFixed(3)} = <span class="text-yellow-400 font-bold">${credits} cr</span></p>`;
      document.getElementById('model-cost').value = credits;
    }
    previewDiv.innerHTML = html;
  }
  
  // PER-PIXEL PRICING (Upscaling)
  else if (structureType === 'per_pixel') {
    const pricePerPixel = parseFloat(document.getElementById('price-per-pixel')?.value) || 0;
    const baseResolution = document.getElementById('base-resolution')?.value || '1920x1080';
    const upscaleFactor = parseFloat(document.getElementById('max-upscale-factor')?.value) || 4;
    
    if (!pricePerPixel || pricePerPixel <= 0) {
      previewDiv.innerHTML = '<p class="text-gray-500">Enter price per pixel...</p>';
      document.getElementById('model-cost').value = 1;
      return;
    }
    
    const [width, height] = baseResolution.split('x').map(v => parseInt(v) || 1920);
    const basePixels = width * height;
    const upscaledPixels = basePixels * (upscaleFactor * upscaleFactor);
    const totalPrice = pricePerPixel * upscaledPixels;
    // For per-pixel (upscaling), use ×2 multiplier due to high base costs
    const credits = Math.max(0.5, Math.round(totalPrice * 2 * 10) / 10); // ×2 formula (rounded to 1 decimal)
    
    const html = `
      <p class="text-xs text-green-300 font-semibold">🔍 Per-Pixel (Upscaling)</p>
      <p class="text-sm mt-1">${baseResolution} → ${width * upscaleFactor}x${height * upscaleFactor} (${upscaleFactor}x)</p>
      <p class="text-sm">$${pricePerPixel.toFixed(7)}/px × ${upscaledPixels.toLocaleString()} px = $${totalPrice.toFixed(2)} = <span class="text-yellow-400 font-bold">${credits} cr</span></p>
    `;
    previewDiv.innerHTML = html;
    document.getElementById('model-cost').value = credits;
  }
  
  // PER-MEGAPIXEL PRICING (FLUX)
  else if (structureType === 'per_megapixel') {
    const pricePerMP = parseFloat(document.getElementById('price-per-megapixel')?.value) || 0;
    const baseMP = parseFloat(document.getElementById('base-megapixels')?.value) || 1.0;
    
    if (!pricePerMP || pricePerMP <= 0) {
      previewDiv.innerHTML = '<p class="text-gray-500">Enter price per megapixel...</p>';
      document.getElementById('model-cost').value = 1;
      return;
    }
    
    const totalPrice = pricePerMP * baseMP;
    const credits = Math.max(0.1, Math.round(totalPrice * 10 * 10) / 10); // ×10 formula
    
    const html = `
      <p class="text-xs text-indigo-300 font-semibold">📐 Per-Megapixel</p>
      <p class="text-sm mt-1">$${pricePerMP.toFixed(3)}/MP × ${baseMP} MP = <span class="text-yellow-400 font-bold">${credits} cr</span></p>
    `;
    previewDiv.innerHTML = html;
    document.getElementById('model-cost').value = credits;
  }
  
  // MULTI-TIER PRICING (Veo)
  else if (structureType === 'multi_tier') {
    const priceTTVNoAudio = parseFloat(document.getElementById('price-ttv-no-audio')?.value) || 0;
    const priceTTVWithAudio = parseFloat(document.getElementById('price-ttv-with-audio')?.value) || 0;
    const priceITVNoAudio = parseFloat(document.getElementById('price-itv-no-audio')?.value) || 0;
    const priceITVWithAudio = parseFloat(document.getElementById('price-itv-with-audio')?.value) || 0;
    const maxDuration = parseInt(document.getElementById('multi-tier-duration')?.value) || 8;
    
    if (!priceTTVNoAudio && !priceTTVWithAudio && !priceITVNoAudio && !priceITVWithAudio) {
      previewDiv.innerHTML = '<p class="text-gray-500">Enter at least one price...</p>';
      document.getElementById('model-cost').value = 1;
      return;
    }
    
    let html = `<p class="text-xs text-blue-300 font-semibold">📊 Multi-Tier</p><div class="text-xs mt-1 space-y-1">`;
    const allPrices = [];
    
    if (priceTTVNoAudio > 0) {
      const totalPrice = priceTTVNoAudio * maxDuration;
      const credits = Math.max(0.1, Math.round(totalPrice * 10 * 10) / 10); // ×10 formula
      html += `<p>• T2V (No Audio): <span class="text-yellow-400 font-bold">${credits} cr</span></p>`;
      allPrices.push(credits);
    }
    if (priceTTVWithAudio > 0) {
      const totalPrice = priceTTVWithAudio * maxDuration;
      const credits = Math.max(0.1, Math.round(totalPrice * 10 * 10) / 10); // ×10 formula
      html += `<p>• T2V (Audio): <span class="text-yellow-400 font-bold">${credits} cr</span></p>`;
      allPrices.push(credits);
    }
    if (priceITVNoAudio > 0) {
      const totalPrice = priceITVNoAudio * maxDuration;
      const credits = Math.max(0.1, Math.round(totalPrice * 10 * 10) / 10); // ×10 formula
      html += `<p>• I2V (No Audio): <span class="text-yellow-400 font-bold">${credits} cr</span></p>`;
      allPrices.push(credits);
    }
    if (priceITVWithAudio > 0) {
      const totalPrice = priceITVWithAudio * maxDuration;
      const credits = Math.max(0.1, Math.round(totalPrice * 10 * 10) / 10); // ×10 formula
      html += `<p>• I2V (Audio): <span class="text-yellow-400 font-bold">${credits} cr</span></p>`;
      allPrices.push(credits);
    }
    
    html += `</div>`;
    previewDiv.innerHTML = html;
    document.getElementById('model-cost').value = Math.max(...allPrices);
  }
  
  // 3D MODELING PRICING
  else if (structureType === '3d_modeling') {
    const basePrice = parseFloat(document.getElementById('3d-base-price')?.value) || 0;
    const qualityMultiplier = parseFloat(document.getElementById('3d-quality-multiplier')?.value) || 1;
    
    if (!basePrice || basePrice <= 0) {
      previewDiv.innerHTML = '<p class="text-gray-500">Enter base price...</p>';
      document.getElementById('model-cost').value = 1;
      return;
    }
    
    const totalPrice = basePrice * qualityMultiplier;
    const credits = Math.max(0.1, Math.round(totalPrice * 10 * 10) / 10); // ×10 formula
    
    const html = `
      <p class="text-xs text-amber-300 font-semibold">🎲 3D Modeling</p>
      <p class="text-sm mt-1">$${basePrice} × ${qualityMultiplier}x quality = <span class="text-yellow-400 font-bold">${credits} cr</span></p>
    `;
    previewDiv.innerHTML = html;
    document.getElementById('model-cost').value = credits;
  }
  
  // RESOLUTION-BASED PRICING
  else if (structureType === 'resolution_based') {
    const priceSD = parseFloat(document.getElementById('price-sd')?.value) || 0;
    const priceHD = parseFloat(document.getElementById('price-hd')?.value) || 0;
    const price2K = parseFloat(document.getElementById('price-2k')?.value) || 0;
    const price4K = parseFloat(document.getElementById('price-4k')?.value) || 0;
    
    if (!priceSD && !priceHD && !price2K && !price4K) {
      previewDiv.innerHTML = '<p class="text-gray-500">Enter at least one resolution price...</p>';
      document.getElementById('model-cost').value = 1;
      return;
    }
    
    let html = `<p class="text-xs text-teal-300 font-semibold">📏 Resolution-Based</p><div class="text-xs mt-1 space-y-0.5">`;
    const allCredits = [];
    
    if (priceSD > 0) {
      const credits = Math.max(0.1, Math.round(priceSD * 10 * 10) / 10); // ×10 formula
      html += `<p>• SD (512x512): <span class="text-yellow-400 font-bold">${credits} cr</span></p>`;
      allCredits.push(credits);
    }
    if (priceHD > 0) {
      const credits = Math.max(0.1, Math.round(priceHD * 10 * 10) / 10); // ×10 formula
      html += `<p>• HD (1024x1024): <span class="text-yellow-400 font-bold">${credits} cr</span></p>`;
      allCredits.push(credits);
    }
    if (price2K > 0) {
      const credits = Math.max(0.1, Math.round(price2K * 10 * 10) / 10); // ×10 formula
      html += `<p>• 2K (2048x2048): <span class="text-yellow-400 font-bold">${credits} cr</span></p>`;
      allCredits.push(credits);
    }
    if (price4K > 0) {
      const credits = Math.max(0.1, Math.round(price4K * 10 * 10) / 10); // ×10 formula
      html += `<p>• 4K (4096x4096): <span class="text-yellow-400 font-bold">${credits} cr</span></p>`;
      allCredits.push(credits);
    }
    
    html += `</div>`;
    previewDiv.innerHTML = html;
    document.getElementById('model-cost').value = Math.max(...allCredits);
  }
}

// Helper functions
function getTypeColor(type) {
  if (type === 'image') return 'bg-blue-500/20';
  if (type === 'video') return 'bg-pink-500/20';
  if (type === 'audio') return 'bg-cyan-500/20';
  return 'bg-gray-500/20';
}

function getTypeBadgeColor(type) {
  if (type === 'image') return 'bg-blue-500/20 text-blue-400';
  if (type === 'video') return 'bg-pink-500/20 text-pink-400';
  if (type === 'audio') return 'bg-cyan-500/20 text-cyan-400';
  return 'bg-gray-500/20 text-gray-400';
}

function getTypeIcon(type) {
  if (type === 'image') return 'image';
  if (type === 'video') return 'video';
  if (type === 'audio') return 'music';
  return 'robot';
}

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

// Toast notification (reuse from admin panel)
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

// ==================== FAL.AI INTEGRATION ====================

// ✅ PRICING FORMULA (IDR-based comparison with FAL.AI)
// Simple pricing: Credits = FAL Price (USD) × 10
// Example:
// - $0.01 FAL = 0.1 credits
// - $0.10 FAL = 1.0 credits  
// - $1.00 FAL = 10.0 credits
const USD_TO_IDR = 16000; // For display reference only
const IDR_PER_CREDIT = 500; // For display reference only

// Calculate credits from FAL price (simple ×10 formula)
function calculateCreditsFromFalPrice(falPriceUSD) {
  if (!falPriceUSD || falPriceUSD <= 0) return 0.1;
  
  // Simple: Credits = Price × 10
  const credits = Math.max(0.1, Math.round(falPriceUSD * 10 * 10) / 10); // Round to 1 decimal
  
  console.log(`💰 Price calculation: $${falPriceUSD} → ${credits} credits (×10)`);
  return credits;
}

// FAL.AI Model Browser State
let falModels = [];
let currentFalFilter = 'all';
let searchTimeout = null;

// Open browse modal
function openBrowseModal() {
  document.getElementById('browse-fal-modal').classList.remove('hidden');
  loadFalModels();
}

// Model source state
let currentModelSource = 'curated'; // 'curated' or 'all'

// Close browse modal
function closeBrowseModal() {
  document.getElementById('browse-fal-modal').classList.add('hidden');
}

// Switch between curated and all models
async function switchModelSource(source) {
  currentModelSource = source;
  
  // Update button states
  const curatedBtn = document.getElementById('source-curated');
  const allBtn = document.getElementById('source-all');
  
  if (source === 'curated') {
    curatedBtn.classList.add('bg-blue-600', 'text-white');
    curatedBtn.classList.remove('text-gray-400');
    allBtn.classList.remove('bg-blue-600', 'text-white');
    allBtn.classList.add('text-gray-400');
  } else {
    allBtn.classList.add('bg-blue-600', 'text-white');
    allBtn.classList.remove('text-gray-400');
    curatedBtn.classList.remove('bg-blue-600', 'text-white');
    curatedBtn.classList.add('text-gray-400');
  }
  
  // Reload models with new source
  await loadFalModels();
}

// Sync pricing from FAL.AI
async function syncPricingFromFal() {
  if (!confirm('Sync all model pricing from FAL.AI? This may take a few minutes.')) {
    return;
  }
  
  try {
    showToast('Starting pricing sync...', 'info');
    
    const response = await fetch('/admin/api/fal/sync-pricing', {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast(`✅ Pricing synced! Updated: ${data.updated}, Errors: ${data.errors}`, 'success');
      // Reload models table
      await loadModels();
    } else {
      showToast('Failed to sync pricing: ' + data.message, 'error');
    }
  } catch (error) {
    console.error('Error syncing pricing:', error);
    showToast('Error syncing pricing', 'error');
  }
}

// Load models from FAL.AI real-time API
async function loadFalModels(query = '') {
  try {
    console.log('🔄 loadFalModels called with query:', query, 'source:', currentModelSource);
    
    const loadingEl = document.getElementById('fal-loading');
    const countEl = document.getElementById('fal-search-count');
    const syncEl = document.getElementById('fal-last-sync');
    
    console.log('📌 Elements found:', { loadingEl: !!loadingEl, countEl: !!countEl, syncEl: !!syncEl });
    
    if (loadingEl) loadingEl.style.display = 'block';
    if (countEl) countEl.textContent = '-';
    
    const params = new URLSearchParams();
    if (query && query.trim()) {
      params.set('query', query.trim());
    }
    if (currentFalFilter && currentFalFilter !== 'all') {
      params.set('type', currentFalFilter);
    }
    params.set('limit', '200'); // Increased limit for all models
    params.set('source', currentModelSource); // Pass source parameter

    console.log('🌐 Fetching from /admin/api/fal/browse?', params.toString());
    const response = await fetch(`/admin/api/fal/browse?${params}`);
    const data = await response.json();
    
    console.log('📦 Received data:', data);

    if (data.success) {
      falModels = data.models;
      console.log('✅ Loaded', falModels.length, 'models from API');
      console.log('📋 Sample model:', falModels[0]);
      
      displayFalModels(falModels);
      
      if (countEl) countEl.textContent = data.count;
      if (syncEl) syncEl.textContent = new Date().toLocaleTimeString();
      
      // Update API status
      const statusEl = document.getElementById('fal-api-status');
      if (statusEl && data.api_status) {
        if (data.api_status.connected) {
          statusEl.innerHTML = '<i class="fas fa-check-circle text-green-400 mr-2"></i><span class="text-green-400">API Connected</span>';
        } else {
          statusEl.innerHTML = '<i class="fas fa-exclamation-triangle text-yellow-400 mr-2"></i><span class="text-yellow-400">API: ' + (data.api_status.message || 'Not configured') + '</span>';
        }
      }
      
      // Show warning if scraping not available
      if (!data.scraping_available && currentModelSource === 'all') {
        showToast('⚠️ Web scraping disabled. Install cheerio: npm install cheerio', 'warning');
        // Auto switch back to curated
        currentModelSource = 'curated';
        switchModelSource('curated');
      }
      
      // Update source info text
      const sourceInfo = document.getElementById('source-info');
      if (sourceInfo && !data.scraping_available) {
        sourceInfo.innerHTML = '<strong class="text-yellow-400">⚠️ Note:</strong> Web scraping requires cheerio package. Run <code class="text-xs bg-gray-800 px-1 rounded">npm install cheerio</code> to enable "All Models" feature.';
      }
    } else {
      console.error('❌ API returned error:', data.message);
      showToast('Failed to load FAL.AI models: ' + data.message, 'error');
      
      // Update API status to error
      const statusEl = document.getElementById('fal-api-status');
      if (statusEl) {
        statusEl.innerHTML = '<i class="fas fa-times-circle text-red-400 mr-2"></i><span class="text-red-400">API Error</span>';
      }
    }
  } catch (error) {
    console.error('❌ Error loading FAL.AI models:', error);
    showToast('Error connecting to FAL.AI', 'error');
  } finally {
    const loadingEl = document.getElementById('fal-loading');
    if (loadingEl) loadingEl.style.display = 'none';
  }
}

// Test FAL.AI API Connection
async function testFalConnection() {
  try {
    const statusEl = document.getElementById('fal-api-status');
    if (statusEl) {
      statusEl.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i><span class="text-gray-400">Testing API...</span>';
    }
    
    const response = await fetch('/admin/api/fal/test-connection');
    const data = await response.json();
    
    if (statusEl) {
      if (data.connected) {
        statusEl.innerHTML = '<i class="fas fa-check-circle text-green-400 mr-2"></i><span class="text-green-400">' + data.message + '</span>';
        showToast('FAL.AI API connection successful!', 'success');
      } else {
        statusEl.innerHTML = '<i class="fas fa-exclamation-triangle text-yellow-400 mr-2"></i><span class="text-yellow-400">' + data.message + '</span>';
        showToast('FAL.AI API: ' + data.message, 'warning');
      }
    }
  } catch (error) {
    console.error('Error testing FAL.AI connection:', error);
    const statusEl = document.getElementById('fal-api-status');
    if (statusEl) {
      statusEl.innerHTML = '<i class="fas fa-times-circle text-red-400 mr-2"></i><span class="text-red-400">Connection test failed</span>';
    }
    showToast('Failed to test API connection', 'error');
  }
}

// Search FAL models (client-side filtering)
function searchFalModels() {
  const query = document.getElementById('fal-search').value.toLowerCase().trim();
  
  let filtered = falModels;
  
  // Apply type filter
  if (currentFalFilter && currentFalFilter !== 'all') {
    filtered = filtered.filter(m => m.type === currentFalFilter);
  }
  
  // Apply search filter
  if (query) {
    filtered = filtered.filter(m => 
      m.name.toLowerCase().includes(query) ||
      m.provider.toLowerCase().includes(query) ||
      (m.description && m.description.toLowerCase().includes(query))
    );
  }
  
  // Update count and display
  document.getElementById('fal-search-count').textContent = filtered.length;
  displayFalModels(filtered);
}

// Filter FAL models by type
function filterFalModels(type) {
  currentFalFilter = type;
  
  // Update filter buttons
  document.querySelectorAll('.fal-filter-btn').forEach(btn => {
    if (btn.dataset.type === type) {
      btn.className = 'fal-filter-btn active px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium';
    } else {
      btn.className = 'fal-filter-btn px-4 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition text-sm font-medium';
    }
  });
  
  const query = document.getElementById('fal-search').value;
  loadFalModels(query);
}

// Display FAL models in grid
function displayFalModels(models) {
  const grid = document.getElementById('fal-models-grid');
  
  console.log('📊 displayFalModels called with', models.length, 'models');
  console.log('🎯 Grid element:', grid);
  
  if (!grid) {
    console.error('❌ Grid element #fal-models-grid not found!');
    return;
  }
  
  if (models.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-8 text-gray-400">
        <i class="fas fa-search text-2xl mb-2"></i>
        <p>No models found</p>
      </div>
    `;
    return;
  }

  console.log('🔨 Rendering', models.length, 'model cards...');
  
  try {
    const cardsHTML = models.map((model, index) => {
      try {
        const credits = calculateCreditsFromFalPrice(model.fal_price);
        const priceIDR = (model.fal_price || 0) * USD_TO_IDR;
        const safeModelId = (model.id || '').replace(/'/g, "\\'");
        const safeModelName = (model.name || 'Unknown').replace(/'/g, "\\'");
        const safeProvider = (model.provider || 'Unknown').replace(/'/g, "\\'");
        const safeDescription = (model.description || 'No description').replace(/'/g, "\\'");
        
        return `
          <div class="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-blue-500/50 transition-all">
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-8 h-8 rounded-lg ${model.type === 'video' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'} flex items-center justify-center text-sm">
                    <i class="fas fa-${model.type === 'video' ? 'video' : 'image'}"></i>
                  </div>
                  <div class="min-w-0 flex-1">
                    <h4 class="font-semibold text-white text-sm truncate">${safeModelName}</h4>
                    <p class="text-xs text-gray-400 truncate">${safeProvider}</p>
                  </div>
                </div>
                ${model.source ? `
                <div class="flex gap-1 mt-1">
                  ${model.source === 'curated' ? 
                    '<span class="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-medium rounded"><i class="fas fa-star mr-0.5"></i>Verified</span>' : 
                    '<span class="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] font-medium rounded"><i class="fas fa-globe mr-0.5"></i>Scraped</span>'
                  }
                  ${!model.has_pricing ? '<span class="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-[10px] font-medium rounded">Est. Price</span>' : ''}
                </div>
                ` : ''}
              </div>
            </div>
            
            <p class="text-xs text-gray-400 mb-3 line-clamp-2">${safeDescription}</p>
            
            <div class="space-y-2 mb-3">
              <div class="flex justify-between text-xs">
                <span class="text-gray-500">FAL Price:</span>
                <span class="text-green-400 font-mono">$${(model.fal_price || 0).toFixed(3)}</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-gray-500">IDR:</span>
                <span class="text-yellow-400 font-mono">Rp ${Math.ceil(priceIDR).toLocaleString('id-ID')}</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-gray-500">Credits:</span>
                <span class="text-blue-400 font-bold">${credits.toFixed(1)}</span>
              </div>
            </div>

            <div class="flex gap-2">
              <button 
                onclick="importFalModel('${safeModelId}')" 
                class="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition text-sm font-medium"
              >
                <i class="fas fa-download mr-1"></i> Import
              </button>
              <button 
                onclick="previewFalModel('${safeModelId}')" 
                class="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition text-sm"
                title="Preview"
              >
                <i class="fas fa-eye"></i>
              </button>
            </div>

            <div class="mt-2 text-xs text-gray-600 font-mono truncate" title="${safeModelId}">
              ${safeModelId}
            </div>
          </div>
        `;
      } catch (cardError) {
        console.error(`❌ Error rendering card ${index}:`, cardError, model);
        return `<div class="col-span-full text-red-400 p-4">Error rendering model ${index}</div>`;
      }
    }).join('');
    
    console.log('✅ Cards HTML generated, length:', cardsHTML.length);
    grid.innerHTML = cardsHTML;
    console.log('✅ Cards inserted into grid');
  } catch (renderError) {
    console.error('❌ Error in displayFalModels:', renderError);
    grid.innerHTML = `
      <div class="col-span-full text-center py-8 text-red-400">
        <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
        <p>Error rendering models</p>
        <p class="text-xs mt-2">${renderError.message}</p>
      </div>
    `;
  }
}

// Import individual FAL model
async function importFalModel(modelId) {
  try {
    const model = falModels.find(m => m.id === modelId);
    if (!model) {
      showToast('Model not found', 'error');
      return;
    }

    const credits = calculateCreditsFromFalPrice(model.fal_price);

    const modelPayload = {
      model_id: model.id,
      name: model.name,
      provider: model.provider,
      description: model.description,
      type: model.type,
      category: model.type === 'video' ? 'video-generation' : 'image-generation',
      cost: credits,
      fal_price: model.fal_price,
      max_duration: model.max_duration || (model.type === 'video' ? 10 : null),
      is_active: true,
      trending: false,
      viral: false
    };

    const response = await fetch('/admin/api/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(modelPayload)
    });

    const result = await response.json();
    if (result.success) {
      showToast(`${model.name} imported successfully!`, 'success');
      loadModels(); // Reload main table
    } else {
      showToast(`Import failed: ${result.message}`, 'error');
    }
  } catch (error) {
    console.error('Error importing model:', error);
    showToast('Error importing model', 'error');
  }
}

// Preview FAL model details
function previewFalModel(modelId) {
  const model = falModels.find(m => m.id === modelId);
  if (!model) return;

  const credits = calculateCreditsFromFalPrice(model.fal_price);
  const priceIDR = (model.fal_price || 0) * USD_TO_IDR;

  alert(`🔍 Model Preview

📝 Name: ${model.name}
🏢 Provider: ${model.provider}  
🎯 Type: ${model.type.toUpperCase()}
💰 FAL Price: $${(model.fal_price || 0).toFixed(3)}
💸 IDR: Rp ${Math.ceil(priceIDR).toLocaleString('id-ID')}
⭐ Credits: ${credits.toFixed(1)}
📄 Description: ${model.description || 'No description'}
🆔 ID: ${model.id}`);
}

// Refresh FAL models
function refreshFalModels() {
  const query = document.getElementById('fal-search').value;
  loadFalModels(query);
}

// Sync all FAL models to database
async function syncFalModels() {
  if (!confirm('This will sync all available models from FAL.AI. Continue?')) {
    return;
  }

  try {
    showToast('Syncing with FAL.AI...', 'info');

    const response = await fetch('/admin/api/fal/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    if (result.success) {
      showToast(`${result.message} (${result.synced}/${result.total})`, 'success');
      loadModels(); // Reload main table
    } else {
      showToast(`Sync failed: ${result.message}`, 'error');
    }
  } catch (error) {
    console.error('Error syncing FAL models:', error);
    showToast('Error syncing with FAL.AI', 'error');
  }
}

// Verify and fix pricing
async function verifyPricing() {
  try {
    showToast('Analyzing model pricing...', 'info');

    // First, get pricing analysis
    const verifyResponse = await fetch('/admin/api/pricing/verify');
    const analysis = await verifyResponse.json();

    if (analysis.success) {
      const { summary } = analysis;
      
      let message = `📊 Pricing Analysis Results:\n\n`;
      message += `🚨 Overpriced models: ${summary.overpriced}\n`;
      message += `⚠️ Need updates: ${summary.needsUpdate}\n`;
      message += `✅ Acceptable: ${summary.acceptable}\n`;
      message += `📝 Total models: ${summary.total}\n\n`;
      
      if (summary.overpriced > 0 || summary.needsUpdate > 0) {
        message += `💰 New Formula: IDR 1,000 = 2 Credits\n`;
        message += `🔧 Would you like to fix pricing automatically?`;
        
        if (confirm(message)) {
          showToast('Updating pricing with new formula...', 'info');
          
          const updateResponse = await fetch('/admin/api/pricing/update-all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          const updateResult = await updateResponse.json();
          
          if (updateResult.success) {
            showToast(`✅ Pricing Updated! ${updateResult.updated} models fixed`, 'success');
            loadModels(); // Reload main table
            
            // Show some examples of updates
            if (updateResult.updates && updateResult.updates.length > 0) {
              console.log('🔄 Pricing Updates Applied:');
              updateResult.updates.forEach(update => {
                console.log(`   ${update.name}: ${update.old} → ${update.new} credits`);
              });
            }
          } else {
            showToast(`Update failed: ${updateResult.message}`, 'error');
          }
        }
      } else {
        message += `✅ All pricing is already correct!`;
        alert(message);
      }
    } else {
      showToast(`Analysis failed: ${analysis.message}`, 'error');
    }
  } catch (error) {
    console.error('Error verifying pricing:', error);
    showToast('Error analyzing pricing', 'error');
  }
}

// Edit credits for a model
async function editCredits(modelId, currentCredits) {
  console.log(`🎯 editCredits called with modelId: ${modelId}, currentCredits: ${currentCredits}`);
  
  // Ensure values are valid
  if (!modelId || modelId == 'undefined') {
    console.error('❌ Invalid modelId:', modelId);
    showToast('Error: Invalid model ID', 'error');
    return;
  }
  
  const currentCost = parseFloat(currentCredits) || 1;
  const newCredits = prompt(`Edit credits for model (current: ${currentCost}):`, currentCost);
  
  if (!newCredits || newCredits === null || newCredits.trim() === '') {
    console.log('❌ Edit cancelled or empty input');
    return;
  }
  
  const parsedCredits = parseFloat(newCredits);
  if (isNaN(parsedCredits) || parsedCredits <= 0) {
    showToast('Please enter a valid positive number', 'error');
    return;
  }
  
  console.log(`🔄 Updating model ${modelId}: ${currentCost} → ${parsedCredits}`);
  
  try {
    const response = await fetch(`/admin/api/models/${modelId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cost: parsedCredits })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📊 Update response:', data);
    
    if (data.success) {
      console.log('✅ Database updated, new cost:', data.model?.cost);
      
      // Update the display immediately without waiting for full reload
      const costDisplay = document.getElementById(`cost-display-${modelId}`);
      if (costDisplay) {
        const newCost = parseFloat(data.model?.cost || parsedCredits).toFixed(1);
        costDisplay.textContent = newCost;
        console.log(`✅ UI updated: cost-display-${modelId} → ${newCost}`);
      } else {
        console.log(`❌ Element not found: cost-display-${modelId}`);
      }
      
      // Update the model in our local array
      const modelIndex = allModels.findIndex(m => m.id == modelId);
      if (modelIndex !== -1) {
        allModels[modelIndex].cost = data.model?.cost || parsedCredits;
        console.log(`✅ Local array updated for model index ${modelIndex}`);
      }
      
      showToast(`Credits updated: ${currentCost} → ${parseFloat(data.model?.cost || parsedCredits).toFixed(1)}`, 'success');
      
      // Also reload models to ensure consistency (with a delay)
      setTimeout(() => {
        console.log('🔄 Reloading models for consistency...');
        loadModels();
      }, 500);
    } else {
      console.error('❌ Update failed:', data.message);
      showToast(data.message || 'Failed to update credits', 'error');
    }
  } catch (error) {
    console.error('❌ Error updating credits:', error);
    showToast(`Error updating credits: ${error.message}`, 'error');
  }
}

// ==================== BULK ACTIONS ====================

// Toggle single model selection
function toggleModelSelection(modelId, isChecked) {
  if (isChecked) {
    selectedModels.add(modelId);
  } else {
    selectedModels.delete(modelId);
  }
  updateBulkActionsBar();
  updateSelectAllCheckbox();
}

// Toggle select all
function toggleSelectAll(checkbox) {
  const modelCheckboxes = document.querySelectorAll('.model-checkbox');
  
  if (checkbox.checked) {
    // Select all visible models
    modelCheckboxes.forEach(cb => {
      const modelId = parseInt(cb.getAttribute('data-model-id'));
      selectedModels.add(modelId);
      cb.checked = true;
    });
  } else {
    // Deselect all
    selectedModels.clear();
    modelCheckboxes.forEach(cb => {
      cb.checked = false;
    });
  }
  
  updateBulkActionsBar();
}

// Update select-all checkbox state
function updateSelectAllCheckbox() {
  const selectAllCheckbox = document.getElementById('select-all-checkbox');
  const modelCheckboxes = document.querySelectorAll('.model-checkbox');
  
  if (modelCheckboxes.length === 0) {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
    return;
  }
  
  const checkedCount = Array.from(modelCheckboxes).filter(cb => cb.checked).length;
  
  if (checkedCount === 0) {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
  } else if (checkedCount === modelCheckboxes.length) {
    selectAllCheckbox.checked = true;
    selectAllCheckbox.indeterminate = false;
  } else {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = true;
  }
}

// Update bulk actions bar visibility and count
function updateBulkActionsBar() {
  const bulkActionsBar = document.getElementById('bulk-actions-bar');
  const selectedCount = document.getElementById('selected-count');
  
  if (selectedModels.size > 0) {
    bulkActionsBar.classList.remove('hidden');
    selectedCount.textContent = `${selectedModels.size} model${selectedModels.size > 1 ? 's' : ''} selected`;
  } else {
    bulkActionsBar.classList.add('hidden');
  }
}

// Clear selection
function clearSelection() {
  selectedModels.clear();
  document.querySelectorAll('.model-checkbox').forEach(cb => {
    cb.checked = false;
  });
  updateBulkActionsBar();
  updateSelectAllCheckbox();
}

// Activate selected models
async function activateSelected() {
  if (selectedModels.size === 0) {
    showToast('No models selected', 'error');
    return;
  }
  
  if (!confirm(`Activate ${selectedModels.size} model(s)?`)) {
    return;
  }
  
  const modelIds = Array.from(selectedModels);
  let successCount = 0;
  let failCount = 0;
  
  for (const modelId of modelIds) {
    try {
      const response = await fetch(`/admin/api/models/${modelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true })
      });
      
      const data = await response.json();
      if (data.success) {
        successCount++;
      } else {
        failCount++;
      }
    } catch (error) {
      console.error(`Error activating model ${modelId}:`, error);
      failCount++;
    }
  }
  
  // Clear selection and reload
  clearSelection();
  await loadModels();
  
  // Show result
  if (failCount === 0) {
    showToast(`✅ Successfully activated ${successCount} model(s)`, 'success');
  } else {
    showToast(`⚠️ Activated ${successCount}, Failed ${failCount}`, 'warning');
  }
}

// Deactivate selected models
async function deactivateSelected() {
  if (selectedModels.size === 0) {
    showToast('No models selected', 'error');
    return;
  }
  
  if (!confirm(`Deactivate ${selectedModels.size} model(s)?`)) {
    return;
  }
  
  const modelIds = Array.from(selectedModels);
  let successCount = 0;
  let failCount = 0;
  
  for (const modelId of modelIds) {
    try {
      const response = await fetch(`/admin/api/models/${modelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: false })
      });
      
      const data = await response.json();
      if (data.success) {
        successCount++;
      } else {
        failCount++;
      }
    } catch (error) {
      console.error(`Error deactivating model ${modelId}:`, error);
      failCount++;
    }
  }
  
  // Clear selection and reload
  clearSelection();
  await loadModels();
  
  // Show result
  if (failCount === 0) {
    showToast(`✅ Successfully deactivated ${successCount} model(s)`, 'success');
  } else {
    showToast(`⚠️ Deactivated ${successCount}, Failed ${failCount}`, 'warning');
  }
}

// ==================== REFRESH PRICING FROM FAL.AI ====================

// Refresh all model prices from FAL.AI database
async function refreshAllPricing() {
  if (!confirm('Refresh ALL model prices from FAL.AI database?\n\nThis will update pricing for all models based on the latest FAL.AI prices.')) {
    return;
  }
  
  try {
    showToast('🔄 Refreshing prices from FAL.AI...', 'info');
    
    // Simple formula: Credits = Price × 10
    const updateCount = allModels.filter(m => m.fal_price && m.fal_price > 0).length;
    let updated = 0;
    let failed = 0;
    
    for (const model of allModels) {
      if (!model.fal_price || model.fal_price <= 0) continue;
      
      try {
        // Calculate correct credits: Price × 10
        const correctCredits = Math.max(0.1, Math.round(model.fal_price * 10 * 10) / 10);
        
        // Only update if different
        if (Math.abs(parseFloat(model.cost) - correctCredits) > 0.05) {
          const response = await fetch(`/admin/api/models/${model.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cost: correctCredits })
          });
          
          if (response.ok) {
            updated++;
            // Update local data
            model.cost = correctCredits;
          } else {
            failed++;
          }
        }
      } catch (error) {
        console.error(`Error updating ${model.name}:`, error);
        failed++;
      }
    }
    
    // Reload models to reflect changes
    await loadModels();
    
    if (failed === 0) {
      showToast(`✅ Successfully updated ${updated} model prices from FAL.AI!`, 'success');
    } else {
      showToast(`⚠️ Updated ${updated} models, ${failed} failed`, 'warning');
    }
    
  } catch (error) {
    console.error('Error refreshing pricing:', error);
    showToast('Error refreshing prices: ' + error.message, 'error');
  }
}

// Delete selected models (with smart confirmation)
async function deleteSelectedModels() {
  if (selectedModels.size === 0) {
    showToast('No models selected', 'error');
    return;
  }
  
  const count = selectedModels.size;
  const selectedModelsList = Array.from(selectedModels).map(id => {
    return allModels.find(m => m.id === id);
  }).filter(Boolean);
  
  const customModels = selectedModelsList.filter(m => m.is_custom);
  const defaultModels = selectedModelsList.filter(m => !m.is_custom);
  
  const modelNames = selectedModelsList.slice(0, 5).map(m => m.name).join(', ');
  const moreText = count > 5 ? ` and ${count - 5} more` : '';
  
  // Build confirmation message
  let confirmMessage = `🗑️ DELETE ${count} model(s)?\n\n${modelNames}${moreText}\n\n`;
  
  if (defaultModels.length > 0) {
    confirmMessage += `⚠️ WARNING: ${defaultModels.length} FAL.AI default model(s) selected!\n`;
    confirmMessage += `These are from FAL.AI database.\n\n`;
    confirmMessage += `RECOMMENDATION: Use "Deactivate" instead of Delete.\n\n`;
    confirmMessage += `Delete anyway? (Cannot be undone!)`;
  } else {
    confirmMessage += `These are custom models.\n\n`;
    confirmMessage += `⚠️ This action CANNOT be undone!`;
  }
  
  if (!confirm(confirmMessage)) {
    return;
  }
  
  let deleted = 0;
  let deactivated = 0;
  let failed = 0;
  const failedModels = [];
  
  for (const modelId of Array.from(selectedModels)) {
    const model = allModels.find(m => m.id === modelId);
    
    try {
      // Try to delete with force for default models
      const response = await fetch(`/admin/api/models/${modelId}?force=true`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        deleted++;
        console.log(`✅ Deleted: ${model?.name || modelId}`);
      } else if (response.status === 400 && data.is_custom === false) {
        // If still can't delete, deactivate instead
        const deactivateResponse = await fetch(`/admin/api/models/${modelId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: false })
        });
        
        if (deactivateResponse.ok) {
          deactivated++;
          console.log(`⚠️ Deactivated instead: ${model?.name || modelId}`);
        } else {
          failed++;
          failedModels.push(model?.name || `ID ${modelId}`);
        }
      } else {
        failed++;
        failedModels.push(model?.name || `ID ${modelId}`);
        console.error(`❌ Failed to delete: ${model?.name || modelId}`, data);
      }
    } catch (error) {
      console.error(`Error processing model ${modelId}:`, error);
      failed++;
      failedModels.push(model?.name || `ID ${modelId}`);
    }
  }
  
  // Clear selection and reload
  clearSelection();
  await loadModels();
  
  // Show appropriate message
  let message = '';
  if (deleted > 0) message += `Deleted: ${deleted}`;
  if (deactivated > 0) message += `${message ? ', ' : ''}Deactivated: ${deactivated}`;
  if (failed > 0) message += `${message ? ', ' : ''}Failed: ${failed}`;
  
  if (failed === 0) {
    showToast(`✅ ${message}`, 'success');
  } else {
    showToast(`⚠️ ${message}\nFailed: ${failedModels.slice(0, 3).join(', ')}`, 'warning');
  }
}

// Sync price for a single model from FAL.AI
async function syncSinglePrice(modelId, modelName) {
  // Check if model has fal_price first
  const model = allModels.find(m => m.id === modelId);
  const falPrice = parseFloat(model?.fal_price || 0);
  
  if (!falPrice || falPrice <= 0) {
    showToast(`❌ Cannot sync: ${modelName} has no FAL.AI price data`, 'error');
    console.error(`Model ${modelName} (ID: ${modelId}) has no valid fal_price:`, model?.fal_price);
    return;
  }
  
  if (!confirm(`🔄 Sync price from FAL.AI?\n\nModel: ${modelName}\nCurrent FAL Price: $${falPrice.toFixed(3)}\n\nThis will update the credit price based on FAL.AI pricing.`)) {
    return;
  }
  
  try {
    const response = await fetch(`/admin/api/models/${modelId}/sync-price`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      showToast(`✅ ${data.message}`, 'success');
      
      // Update display immediately
      const costDisplay = document.getElementById(`cost-display-${modelId}`);
      if (costDisplay) {
        costDisplay.textContent = data.model.new_cost.toFixed(1);
      }
      
      // Update local array
      if (model) {
        model.cost = data.model.new_cost;
      }
      
      console.log(`✅ Price synced: ${modelName}`);
      console.log(`   FAL Price: $${data.model.fal_price.toFixed(3)}`);
      console.log(`   Old: ${data.model.old_cost} → New: ${data.model.new_cost} credits`);
      
      // Reload after a short delay
      setTimeout(() => loadModels(), 500);
    } else {
      // Show backend error message
      const errorMsg = data.message || 'Unknown error';
      showToast(`❌ Sync failed: ${errorMsg}`, 'error');
      console.error(`Sync failed for ${modelName}:`, data);
    }
  } catch (error) {
    console.error('Error syncing price:', error);
    showToast('Error syncing price: ' + error.message, 'error');
  }
}

// Sync prices for selected models
async function syncSelectedPrices() {
  if (selectedModels.size === 0) {
    showToast('No models selected', 'error');
    return;
  }
  
  const count = selectedModels.size;
  const selectedModelsList = Array.from(selectedModels).map(id => {
    return allModels.find(m => m.id === id);
  }).filter(Boolean);
  
  const modelNames = selectedModelsList.slice(0, 3).map(m => m.name).join(', ');
  const moreText = count > 3 ? ` and ${count - 3} more` : '';
  
  if (!confirm(`🔄 Sync prices from FAL.AI for ${count} model(s)?\n\n${modelNames}${moreText}\n\nThis will update credit prices based on current FAL.AI prices.`)) {
    return;
  }
  
  let synced = 0;
  let failed = 0;
  const updates = [];
  
  for (const modelId of Array.from(selectedModels)) {
    const model = allModels.find(m => m.id === modelId);
    
    try {
      const response = await fetch(`/admin/api/models/${modelId}/sync-price`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        synced++;
        updates.push({
          name: model?.name || `ID ${modelId}`,
          old: data.model.old_cost,
          new: data.model.new_cost
        });
        console.log(`✅ Synced: ${model?.name || modelId} - ${data.model.old_cost} → ${data.model.new_cost} credits`);
      } else {
        failed++;
        console.error(`❌ Failed: ${model?.name || modelId}`, data.message);
      }
    } catch (error) {
      console.error(`Error syncing model ${modelId}:`, error);
      failed++;
    }
  }
  
  // Clear selection and reload
  clearSelection();
  await loadModels();
  
  // Show results
  if (failed === 0) {
    showToast(`✅ Synced ${synced} price(s) from FAL.AI`, 'success');
    
    // Show examples in console
    if (updates.length > 0) {
      console.log('💰 Price Updates:');
      updates.slice(0, 10).forEach(update => {
        console.log(`   ${update.name}: ${update.old} → ${update.new} credits`);
      });
    }
  } else {
    showToast(`⚠️ Synced: ${synced}, Failed: ${failed}`, 'warning');
  }
}

// ===========================
// MODEL TEMPLATES
// ===========================

// Pre-configured templates for popular models
const MODEL_TEMPLATES = {
  'flux-pro': {
    name: 'FLUX Pro',
    provider: 'Black Forest Labs',
    category: 'Text-to-Image',
    type: 'image',
    speed: 'fast',
    quality: 'excellent',
    aspect_ratio_style: 'image_size',
    custom_parameters: {
      safety_tolerance: '2',
      output_format: 'jpeg'
    },
    description: 'State-of-the-art text-to-image model with exceptional quality'
  },
  'kling-video': {
    name: 'Kling Video Pro',
    provider: 'Kuaishou',
    category: 'Text-to-Video',
    type: 'video',
    speed: 'medium',
    quality: 'excellent',
    aspect_ratio_style: 'aspect_ratio',
    duration_format: 'string',
    available_durations: ['5', '10', '15'],
    supports_i2v: true,
    description: 'High-quality video generation with 15s max duration'
  },
  'veo-3': {
    name: 'Google Veo 3.1',
    provider: 'Google',
    category: 'Text-to-Video',
    type: 'video',
    speed: 'fast',
    quality: 'excellent',
    aspect_ratio_style: 'aspect_ratio',
    duration_format: 'number',
    available_durations: [4, 6, 8],
    description: 'Cinema-quality video generation from Google'
  },
  'imagen-4': {
    name: 'Imagen 4',
    provider: 'Google',
    category: 'Text-to-Image',
    type: 'image',
    speed: 'fast',
    quality: 'excellent',
    aspect_ratio_style: 'aspect_ratio',
    supports_multi_image: true,
    description: 'Photorealistic AI image generation from Google'
  },
  'ideogram-v2': {
    name: 'Ideogram v2',
    provider: 'Ideogram',
    category: 'Text-to-Image',
    type: 'image',
    speed: 'fast',
    quality: 'very-good',
    aspect_ratio_style: 'aspect_ratio',
    custom_parameters: {
      magic_prompt_option: 'AUTO'
    },
    description: 'Best for text-in-image generation'
  },
  'recraft-v3': {
    name: 'Recraft V3',
    provider: 'Recraft',
    category: 'Text-to-Image',
    type: 'image',
    speed: 'fast',
    quality: 'excellent',
    aspect_ratio_style: 'size',
    custom_parameters: {
      style: 'realistic_image'
    },
    description: 'High-quality realistic image generation'
  }
};

// Load model template
function loadModelTemplate() {
  const modelId = document.getElementById('model-id')?.value.trim().toLowerCase();
  
  // Try to find template based on model_id
  let selectedTemplate = null;
  let templateKey = null;
  
  for (const [key, template] of Object.entries(MODEL_TEMPLATES)) {
    if (modelId.includes(key)) {
      selectedTemplate = template;
      templateKey = key;
      break;
    }
  }
  
  // If not found, show template picker
  if (!selectedTemplate) {
    showTemplatePicker();
    return;
  }
  
  // Apply template
  applyTemplate(selectedTemplate, templateKey);
}

// Show template picker modal
function showTemplatePicker() {
  const templatesHTML = Object.entries(MODEL_TEMPLATES).map(([key, template]) => `
    <button 
      onclick="applyTemplateByKey('${key}')" 
      class="w-full text-left p-4 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-purple-500 rounded-lg transition"
    >
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-lg ${template.type === 'video' ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'} flex items-center justify-center">
          <i class="fas fa-${template.type === 'video' ? 'video' : 'image'}"></i>
        </div>
        <div class="flex-1">
          <h4 class="font-semibold text-white mb-1">${template.name}</h4>
          <p class="text-xs text-gray-400 mb-2">${template.provider} • ${template.category}</p>
          <p class="text-xs text-gray-500">${template.description}</p>
          ${template.custom_parameters ? `
            <div class="mt-2 flex flex-wrap gap-1">
              ${Object.keys(template.custom_parameters).map(param => 
                `<span class="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">${param}</span>`
              ).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    </button>
  `).join('');
  
  const modalHTML = `
    <div class="space-y-3">
      <p class="text-sm text-gray-400">Select a template to auto-fill configuration:</p>
      <div class="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
        ${templatesHTML}
      </div>
    </div>
  `;
  
  showCustomModal('Load Model Template', modalHTML, { size: 'medium' });
}

// Apply template by key
function applyTemplateByKey(key) {
  const template = MODEL_TEMPLATES[key];
  if (template) {
    applyTemplate(template, key);
    // Close the template picker modal
    const modals = document.querySelectorAll('.fixed.inset-0');
    modals.forEach(modal => {
      if (modal.querySelector('h2')?.textContent === 'Load Model Template') {
        modal.remove();
      }
    });
  }
}

// Apply template to form
function applyTemplate(template, templateKey) {
  // Basic info
  if (template.name && !document.getElementById('model-name').value) {
    document.getElementById('model-name').value = template.name;
  }
  if (template.provider) {
    document.getElementById('model-provider').value = template.provider;
  }
  if (template.description) {
    document.getElementById('model-description').value = template.description;
  }
  if (template.type) {
    document.getElementById('model-type').value = template.type;
    updateCategoryOptions();
  }
  if (template.category) {
    document.getElementById('model-category').value = template.category;
  }
  if (template.speed) {
    document.getElementById('model-speed').value = template.speed;
  }
  if (template.quality) {
    document.getElementById('model-quality').value = template.quality;
  }
  
  // Advanced configuration
  if (template.aspect_ratio_style && document.getElementById('aspect-ratio-style')) {
    document.getElementById('aspect-ratio-style').value = template.aspect_ratio_style;
  }
  
  if (template.duration_format && document.getElementById('duration-format-type')) {
    document.getElementById('duration-format-type').value = template.duration_format;
  }
  
  if (template.available_durations && document.getElementById('available-durations')) {
    if (Array.isArray(template.available_durations)) {
      document.getElementById('available-durations').value = template.available_durations.join(',');
    } else {
      document.getElementById('available-durations').value = template.available_durations;
    }
  }
  
  if (template.supports_i2v !== undefined && document.getElementById('supports-i2v')) {
    document.getElementById('supports-i2v').checked = template.supports_i2v;
  }
  
  if (template.supports_multi_image !== undefined && document.getElementById('supports-multi-image')) {
    document.getElementById('supports-multi-image').checked = template.supports_multi_image;
  }
  
  if (template.custom_parameters && document.getElementById('custom-parameters')) {
    document.getElementById('custom-parameters').value = JSON.stringify(template.custom_parameters, null, 2);
  }
  
  showToast(`✅ Template "${template.name}" loaded successfully!`, 'success');
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

// Validate JSON in real-time
function validateJSON(textarea) {
  const value = textarea.value.trim();
  const statusEl = document.getElementById('json-validation-status');
  
  if (!value) {
    statusEl.classList.add('hidden');
    textarea.classList.remove('border-red-500', 'border-green-500');
    textarea.classList.add('border-gray-700');
    return;
  }
  
  try {
    JSON.parse(value);
    statusEl.classList.remove('hidden');
    statusEl.innerHTML = '<span class="text-green-400"><i class="fas fa-check-circle mr-1"></i>Valid JSON</span>';
    textarea.classList.remove('border-red-500', 'border-gray-700');
    textarea.classList.add('border-green-500');
  } catch (e) {
    statusEl.classList.remove('hidden');
    statusEl.innerHTML = `<span class="text-red-400"><i class="fas fa-exclamation-circle mr-1"></i>Invalid JSON: ${e.message}</span>`;
    textarea.classList.remove('border-green-500', 'border-gray-700');
    textarea.classList.add('border-red-500');
  }
}

// Clone model
async function cloneModel(id) {
  const model = allModels.find(m => m.id === id);
  if (!model) return;
  
  const newName = prompt(`Clone "${model.name}"?\n\nEnter new model name:`, `${model.name} (Copy)`);
  if (!newName || newName.trim() === '') return;
  
  const newModelId = prompt(`Enter model ID for the cloned model:`, `${model.model_id}-copy`);
  if (!newModelId || newModelId.trim() === '') return;
  
  try {
    showToast('Cloning model...', 'info');
    
    // Prepare cloned model data
    const clonedData = {
      model_id: newModelId,
      name: newName,
      provider: model.provider,
      description: `${model.description} (Cloned)`,
      type: model.type,
      category: model.category,
      speed: model.speed,
      quality: model.quality,
      cost: model.cost,
      fal_price: model.fal_price,
      pricing_type: model.pricing_type,
      pricing_structure: model.pricing_structure,
      trending: false,
      viral: false,
      is_active: false, // Start as inactive
      is_custom: true,
      max_duration: model.max_duration,
      available_durations: model.available_durations,
      price_per_second: model.price_per_second,
      // Copy all pricing fields
      price_per_pixel: model.price_per_pixel,
      base_resolution: model.base_resolution,
      max_upscale_factor: model.max_upscale_factor,
      price_per_megapixel: model.price_per_megapixel,
      base_megapixels: model.base_megapixels,
      max_megapixels: model.max_megapixels,
      has_multi_tier_pricing: model.has_multi_tier_pricing,
      price_text_to_video_no_audio: model.price_text_to_video_no_audio,
      price_text_to_video_with_audio: model.price_text_to_video_with_audio,
      price_image_to_video_no_audio: model.price_image_to_video_no_audio,
      price_image_to_video_with_audio: model.price_image_to_video_with_audio,
      base_3d_price: model.base_3d_price,
      quality_multiplier: model.quality_multiplier,
      price_sd: model.price_sd,
      price_hd: model.price_hd,
      price_2k: model.price_2k,
      price_4k: model.price_4k,
      metadata: model.metadata
    };
    
    const response = await fetch('/admin/api/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clonedData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast(`✅ Model cloned successfully: ${newName}`, 'success');
      await loadModels();
    } else {
      showToast(`❌ Clone failed: ${data.message}`, 'error');
    }
  } catch (error) {
    console.error('Error cloning model:', error);
    showToast('Error cloning model', 'error');
  }
}

// Preview API Request
function previewAPIRequest() {
  const modelId = document.getElementById('model-id')?.value;
  const modelType = document.getElementById('model-type')?.value;
  const aspectRatioStyle = document.getElementById('aspect-ratio-style')?.value;
  const customParamsInput = document.getElementById('custom-parameters')?.value.trim();
  const durationFormat = document.getElementById('duration-format-type')?.value;
  const availableDurations = document.getElementById('available-durations')?.value;
  
  if (!modelId) {
    alert('Please enter a Model ID first');
    return;
  }
  
  // Build sample request
  let sampleRequest = {
    prompt: "A beautiful sunset over the ocean"
  };
  
  // Add aspect ratio based on style
  if (aspectRatioStyle === 'aspect_ratio') {
    sampleRequest.aspect_ratio = "16:9";
  } else if (aspectRatioStyle === 'image_size') {
    sampleRequest.image_size = "landscape_16_9";
  } else if (aspectRatioStyle === 'size') {
    sampleRequest.size = "1024x1024";
  }
  
  // Add duration for video
  if (modelType === 'video' && availableDurations) {
    const durations = availableDurations.split(',').map(d => d.trim()).filter(d => d);
    if (durations.length > 0) {
      const firstDuration = durations[0].replace('s', '');
      if (durationFormat === 'string') {
        sampleRequest.duration = firstDuration;
      } else {
        sampleRequest.duration = parseInt(firstDuration) || 5;
      }
    }
  }
  
  // Add custom parameters
  if (customParamsInput) {
    try {
      const customParams = JSON.parse(customParamsInput);
      sampleRequest = { ...sampleRequest, ...customParams };
    } catch (e) {
      // Ignore invalid JSON
    }
  }
  
  const previewHTML = `
    <div class="space-y-4">
      <div class="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <p class="text-sm text-gray-400 mb-2">📡 API Endpoint:</p>
        <code class="text-green-400 text-sm">POST https://fal.run/${modelId}</code>
      </div>
      
      <div class="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <p class="text-sm text-gray-400 mb-2">📦 Request Body (Sample):</p>
        <pre class="text-xs text-white font-mono overflow-x-auto">${JSON.stringify(sampleRequest, null, 2)}</pre>
      </div>
      
      <div class="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg text-xs">
        <i class="fas fa-info-circle text-blue-400 mr-1"></i>
        <span class="text-gray-300">This is a sample request. Actual requests may vary based on user input.</span>
      </div>
      
      <button onclick="copyToClipboard(${JSON.stringify(JSON.stringify(sampleRequest))})" class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
        <i class="fas fa-copy mr-2"></i>Copy Request JSON
      </button>
    </div>
  `;
  
  showCustomModal(`API Request Preview: ${modelId}`, previewHTML, { size: 'medium' });
}

// Export Model Configuration
function exportModelConfig() {
  const modelName = document.getElementById('model-name')?.value || 'model';
  
  const config = {
    model_id: document.getElementById('model-id')?.value,
    name: document.getElementById('model-name')?.value,
    provider: document.getElementById('model-provider')?.value,
    description: document.getElementById('model-description')?.value,
    type: document.getElementById('model-type')?.value,
    category: document.getElementById('model-category')?.value,
    speed: document.getElementById('model-speed')?.value,
    quality: document.getElementById('model-quality')?.value,
    fal_price: parseFloat(document.getElementById('model-fal-price')?.value) || null,
    pricing_type: document.getElementById('model-pricing-type')?.value,
    max_duration: parseInt(document.getElementById('model-duration')?.value) || null,
    available_durations: document.getElementById('available-durations')?.value,
    price_per_second: parseFloat(document.getElementById('price-per-second-input')?.value) || null,
    metadata: {
      aspect_ratio_style: document.getElementById('aspect-ratio-style')?.value,
      duration_format: document.getElementById('duration-format-type')?.value,
      supports_i2v: document.getElementById('supports-i2v')?.checked,
      supports_multi_image: document.getElementById('supports-multi-image')?.checked,
      custom_parameters: null,
      custom_api_endpoint: document.getElementById('custom-api-endpoint')?.value
    }
  };
  
  // Parse custom parameters
  const customParamsInput = document.getElementById('custom-parameters')?.value.trim();
  if (customParamsInput) {
    try {
      config.metadata.custom_parameters = JSON.parse(customParamsInput);
    } catch (e) {
      // Ignore
    }
  }
  
  // Create download
  const dataStr = JSON.stringify(config, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  const exportFileDefaultName = `${modelName.toLowerCase().replace(/\s+/g, '-')}-config.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
  
  showToast(`✅ Configuration exported: ${exportFileDefaultName}`, 'success');
}

// Open FAL.AI Documentation
function openFalDocs() {
  const modelId = document.getElementById('model-id')?.value;
  
  if (!modelId) {
    window.open('https://fal.ai/models', '_blank');
  } else {
    // Try to construct the model page URL
    const cleanId = modelId.replace('fal-ai/', '');
    window.open(`https://fal.ai/models/${cleanId}`, '_blank');
  }
}

// Copy to clipboard helper
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('✅ Copied to clipboard!', 'success');
  }).catch(err => {
    console.error('Failed to copy:', err);
    showToast('❌ Failed to copy', 'error');
  });
}

// Make functions globally available
window.validateJSON = validateJSON;
window.cloneModel = cloneModel;
window.previewAPIRequest = previewAPIRequest;
window.exportModelConfig = exportModelConfig;
window.openFalDocs = openFalDocs;
window.copyToClipboard = copyToClipboard;
window.loadModelTemplate = loadModelTemplate;
window.applyTemplateByKey = applyTemplateByKey;
window.editCredits = editCredits;
window.syncSinglePrice = syncSinglePrice;
window.openBrowseModal = openBrowseModal;
window.closeBrowseModal = closeBrowseModal;
window.filterFalModels = filterFalModels;
window.searchFalModels = searchFalModels;
window.importFalModel = importFalModel;
window.previewFalModel = previewFalModel;
window.refreshFalModels = refreshFalModels;
window.syncFalModels = syncFalModels;
window.verifyPricing = verifyPricing;
window.refreshAllPricing = refreshAllPricing;
window.deleteSelectedModels = deleteSelectedModels;
window.toggleModelSelection = toggleModelSelection;
window.toggleSelectAll = toggleSelectAll;
window.activateSelected = activateSelected;
window.deactivateSelected = deactivateSelected;
window.clearSelection = clearSelection;
window.updateCategoryOptions = updateCategoryOptions;
window.syncSelectedPrices = syncSelectedPrices;
window.testFalConnection = testFalConnection;
window.toggleMultiTierPricing = toggleMultiTierPricing;
window.autoCalculateCredits = autoCalculateCredits;
window.openAddModal = openAddModal;
window.editModel = editModel;
window.closeModal = closeModal;
window.toggleModelStatus = toggleModelStatus;
window.deleteModel = deleteModel;
window.verifyFalPricing = verifyFalPricing;

// ===========================
// FAL.AI PRICING VERIFICATION
// ===========================

/**
 * Verify FAL.AI Pricing Accuracy
 * Compares database prices with manually verified prices from fal.ai website
 */
async function verifyFalPricing() {
  try {
    showToast('🔍 Verifying FAL.AI pricing...', 'info');
    
    const response = await fetch('/admin/api/fal-pricing/verify');
    const data = await response.json();
    
    if (!data.success) {
      showToast('❌ Verification failed: ' + data.message, 'error');
      return;
    }
    
    const { summary, mismatches, unverified } = data;
    
    // Build results HTML
    let html = `
      <div class="space-y-4">
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
          <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <h4 class="text-red-400 font-bold mb-3">❌ Price Mismatches (${summary.mismatches})</h4>
            <div class="space-y-2 max-h-64 overflow-y-auto">
              ${mismatches.slice(0, 10).map(m => `
                <div class="bg-gray-800/50 rounded-lg p-3 text-sm">
                  <div class="font-semibold text-white">${m.name}</div>
                  <div class="text-xs text-gray-500 font-mono mb-2">${m.model_id}</div>
                  <div class="grid grid-cols-3 gap-2 text-xs">
                    <div><span class="text-gray-500">DB:</span> <span class="text-white">$${m.dbPrice.toFixed(3)}</span></div>
                    <div><span class="text-gray-500">Real:</span> <span class="text-green-400 font-bold">$${m.verifiedPrice.toFixed(3)}</span></div>
                    <div><span class="text-gray-500">Diff:</span> <span class="${m.difference > 0 ? 'text-red-400' : 'text-green-400'} font-bold">${m.difference > 0 ? '+' : ''}$${m.difference.toFixed(3)}</span></div>
                  </div>
                  ${m.isLoss ? '<div class="mt-2 text-xs text-red-400 font-bold">💸 LOSS RISK!</div>' : ''}
                </div>
              `).join('')}
            </div>
            <button onclick="applyFalPricingFixes(${JSON.stringify(mismatches.map(m => m.model_id))})" class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition">
              <i class="fas fa-wrench mr-2"></i>Apply Fixes (${summary.mismatches})
            </button>
          </div>
        ` : ''}
        
        ${summary.unverified > 0 ? `
          <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <h4 class="text-yellow-400 font-bold mb-2">⚠️ Unverified Models (${summary.unverified})</h4>
            <p class="text-sm text-gray-400 mb-2">Verify at <a href="https://fal.ai/models" target="_blank" class="text-blue-400">fal.ai/models</a></p>
          </div>
        ` : ''}
        
        ${summary.mismatches === 0 && summary.unverified === 0 ? `
          <div class="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
            <div class="text-4xl mb-2">✅</div>
            <div class="text-green-400 font-bold">All Verified Prices Match!</div>
          </div>
        ` : ''}
        
        <div class="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-400">
          <strong>Note:</strong> Update VERIFIED_FAL_PRICES in src/routes/falPricing.js when you verify prices.
        </div>
      </div>
    `;
    
    showCustomModal('FAL.AI Pricing Verification', html, { size: 'large' });
    
  } catch (error) {
    console.error('Error:', error);
    showToast('❌ Error: ' + error.message, 'error');
  }
}

async function applyFalPricingFixes(modelIds) {
  if (!confirm(`Apply verified prices for ${modelIds.length} model(s)?`)) return;
  
  try {
    showToast('🔧 Applying fixes...', 'info');
    const response = await fetch('/admin/api/fal-pricing/apply-fixes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelIds })
    });
    const data = await response.json();
    
    if (data.success) {
      showToast(`✅ ${data.message}`, 'success');
      setTimeout(() => { loadModels(); verifyFalPricing(); }, 1000);
    } else {
      showToast('❌ ' + data.message, 'error');
    }
  } catch (error) {
    showToast('❌ Error: ' + error.message, 'error');
  }
}

function showCustomModal(title, content, options = {}) {
  const { size = 'medium' } = options;
  const sizeMap = { small: 'max-w-md', medium: 'max-w-2xl', large: 'max-w-4xl' };
  
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4';
  modal.innerHTML = `
    <div class="bg-gray-900 rounded-xl ${sizeMap[size]} w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-700">
      <div class="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 class="text-xl font-bold text-white">${title}</h2>
        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">${content}</div>
    </div>
  `;
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  document.body.appendChild(modal);
}

// ============ SUNO MODELS ============

/**
 * Suno models data with default pricing
 */
const SUNO_MODELS_DATA = [
  {
    model_id: 'suno-v5',
    name: 'Suno V5',
    provider: 'SUNO',
    description: 'Cutting-edge model with enhanced quality and capabilities. Our newest offering for advanced music generation.',
    category: 'Music',
    type: 'audio',
    trending: true,
    viral: true,
    speed: 'fast',
    quality: 'best',
    max_duration: 120,
    cost: 0.5, // Default: 0.5 credits (IDR 1,000)
    fal_price: null,
    pricing_type: 'flat',
    is_active: true,
    is_custom: false,
    metadata: { model_tier: 'premium', version: 'v5' }
  },
  {
    model_id: 'suno-v4_5PLUS',
    name: 'Suno V4.5 PLUS',
    provider: 'SUNO',
    description: 'Enhanced model with richer tones and improved audio fidelity for professional-grade music generation.',
    category: 'Music',
    type: 'audio',
    trending: true,
    viral: false,
    speed: 'fast',
    quality: 'high',
    max_duration: 120,
    cost: 0.5, // Default: 0.5 credits (IDR 1,000)
    fal_price: null,
    pricing_type: 'flat',
    is_active: true,
    is_custom: false,
    metadata: { model_tier: 'pro', version: 'v4_5PLUS' }
  },
  {
    model_id: 'suno-v4_5',
    name: 'Suno V4.5',
    provider: 'SUNO',
    description: 'Smart prompt interpretation model. Understands complex musical descriptions and creates accordingly.',
    category: 'Music',
    type: 'audio',
    trending: false,
    viral: false,
    speed: 'fast',
    quality: 'high',
    max_duration: 120,
    cost: 0.5, // Default: 0.5 credits (IDR 1,000)
    fal_price: null,
    pricing_type: 'flat',
    is_active: true,
    is_custom: false,
    metadata: { version: 'v4_5' }
  },
  {
    model_id: 'suno-v4',
    name: 'Suno V4',
    provider: 'SUNO',
    description: 'Improved vocal quality and better instrument separation. Great balance of quality and speed.',
    category: 'Music',
    type: 'audio',
    trending: false,
    viral: false,
    speed: 'medium',
    quality: 'good',
    max_duration: 120,
    cost: 0.5, // Default: 0.5 credits (IDR 1,000)
    fal_price: null,
    pricing_type: 'flat',
    is_active: true,
    is_custom: false,
    metadata: { version: 'v4' }
  },
  {
    model_id: 'suno-v3_5',
    name: 'Suno V3.5',
    provider: 'SUNO',
    description: 'Better song structure and coherence. Reliable model for consistent results at lower cost.',
    category: 'Music',
    type: 'audio',
    trending: false,
    viral: false,
    speed: 'medium',
    quality: 'good',
    max_duration: 120,
    cost: 0.5, // Default: 0.5 credits (IDR 1,000)
    fal_price: null,
    pricing_type: 'flat',
    is_active: true,
    is_custom: false,
    metadata: { version: 'v3_5' }
  },
  {
    model_id: 'suno-lyrics',
    name: 'Suno Lyrics',
    provider: 'SUNO',
    description: 'AI-powered lyrics generation. Create creative song lyrics with customizable themes and styles. FREE to use!',
    category: 'Lyrics',
    type: 'audio',
    trending: false,
    viral: false,
    speed: 'fast',
    quality: 'high',
    max_duration: null,
    cost: 0, // FREE
    fal_price: null,
    pricing_type: 'flat',
    is_active: true,
    is_custom: false,
    metadata: { is_free: true }
  },
  {
    model_id: 'suno-extend',
    name: 'Suno Extension',
    provider: 'SUNO',
    description: 'Extend existing music tracks with AI-powered continuation. Maintain musical coherence and style while making tracks longer.',
    category: 'Extension',
    type: 'audio',
    trending: false,
    viral: false,
    speed: 'medium',
    quality: 'high',
    max_duration: 300,
    cost: 0.5, // Default: 0.5 credits (IDR 1,000)
    fal_price: null,
    pricing_type: 'flat',
    is_active: true,
    is_custom: false,
    metadata: { extension_type: 'audio_continuation' }
  }
];

/**
 * Open Suno pricing adjustment modal
 */
function openSunoPricingModal() {
  const modal = document.getElementById('suno-pricing-modal');
  const listContainer = document.getElementById('suno-models-list');
  
  // Build models list HTML
  let html = '';
  SUNO_MODELS_DATA.forEach((model, index) => {
    const isFree = model.cost === 0;
    html += `
      <div class="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-pink-500/50 transition">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <h4 class="font-bold text-white">${model.name}</h4>
              ${model.trending ? '<span class="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full">🔥 Trending</span>' : ''}
              ${isFree ? '<span class="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">FREE</span>' : ''}
            </div>
            <p class="text-sm text-gray-400 mb-3">${model.description}</p>
            <div class="flex flex-wrap gap-2 text-xs">
              <span class="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">Quality: ${model.quality}</span>
              <span class="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">Speed: ${model.speed}</span>
              ${model.max_duration ? `<span class="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded">Max: ${model.max_duration}s</span>` : ''}
            </div>
          </div>
          <div class="w-32 flex-shrink-0">
            <label class="block text-xs text-gray-400 mb-1">
              <i class="fas fa-coins text-yellow-400 mr-1"></i>
              Credits Cost
            </label>
            <input 
              type="number" 
              id="suno-price-${index}"
              min="0" 
              step="0.1" 
              value="${model.cost}"
              ${isFree ? 'disabled' : ''}
              class="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-center font-bold focus:outline-none focus:border-yellow-500 ${isFree ? 'opacity-50 cursor-not-allowed' : ''}"
              placeholder="0"
            >
            <p class="text-xs text-gray-500 mt-1 text-center">
              ≈ IDR ${(model.cost * 2000).toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>
    `;
  });
  
  listContainer.innerHTML = html;
  modal.classList.remove('hidden');
}

/**
 * Close Suno pricing modal
 */
function closeSunoPricingModal() {
  const modal = document.getElementById('suno-pricing-modal');
  modal.classList.add('hidden');
}

/**
 * Save Suno models with custom pricing
 */
async function saveSunoModelsWithPricing() {
  try {
    // Collect custom prices from inputs
    const modelsWithCustomPricing = SUNO_MODELS_DATA.map((model, index) => {
      const priceInput = document.getElementById(`suno-price-${index}`);
      const customCost = priceInput ? parseInt(priceInput.value) || model.cost : model.cost;
      
      return {
        ...model,
        cost: customCost
      };
    });
    
    // Confirm with user
    const totalModels = modelsWithCustomPricing.length;
    const paidModels = modelsWithCustomPricing.filter(m => m.cost > 0);
    const freeModels = modelsWithCustomPricing.filter(m => m.cost === 0);
    
    const confirmMsg = `Add ${totalModels} Suno models to database?\n\n` +
                      `Paid models: ${paidModels.length}\n` +
                      `Free models: ${freeModels.length}\n\n` +
                      `Pricing summary:\n` +
                      modelsWithCustomPricing.map(m => 
                        `- ${m.name}: ${m.cost} credits${m.cost > 0 ? ` (≈ IDR ${(m.cost * 2000).toLocaleString('id-ID')})` : ' (FREE)'}`
                      ).join('\n');
    
    if (!confirm(confirmMsg)) {
      return;
    }
    
    showToast('🎵 Adding Suno models with custom pricing...', 'info');
    
    // Send to backend
    const response = await fetch('/admin/api/models/add-suno-custom', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ models: modelsWithCustomPricing })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast(`✅ ${data.message}`, 'success');
      showToast(`Added: ${data.added}, Updated: ${data.updated}`, 'info');
      
      closeSunoPricingModal();
      
      // Reload models
      setTimeout(() => {
        loadModels();
      }, 1500);
    } else {
      showToast('❌ ' + data.message, 'error');
    }
  } catch (error) {
    console.error('Error adding Suno models:', error);
    showToast('❌ Error: ' + error.message, 'error');
  }
}

// Make functions globally available
window.openSunoPricingModal = openSunoPricingModal;
window.closeSunoPricingModal = closeSunoPricingModal;
window.saveSunoModelsWithPricing = saveSunoModelsWithPricing;

// Debug: Log when functions are available
console.log('🚀 admin-models.js loaded:', {
  editCredits: typeof window.editCredits,
  openBrowseModal: typeof window.openBrowseModal,
  syncFalModels: typeof window.syncFalModels,
  verifyFalPricing: typeof verifyFalPricing,
  addSunoModels: typeof window.addSunoModels,
  pricingFormula: 'IDR 1,000 = 2 Credits (1 credit = IDR 500)'
});

