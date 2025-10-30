/**
 * Payment Modal Handler
 * Handles all payment/top-up modal functionality in dashboard
 */

// Global variables
let selectedCreditsAmount = 0;
let creditPriceIDR = 2000;
let selectedPaymentMethod = null;
let appliedPromo = null;

/**
 * Initialize payment modal
 */
function initPaymentModal() {
    console.log('💳 Payment Modal initialized');
    loadCreditPrice();
}

/**
 * Load credit price from API
 */
async function loadCreditPrice() {
    try {
        const response = await fetch('/api/payment/credit-price');
        const data = await response.json();
        
        if (data.success) {
            creditPriceIDR = parseInt(data.price);  // ✅ Fixed: use 'price' instead of 'credit_price_idr'
            console.log('💰 Credit price loaded:', creditPriceIDR);
            
            // Update quick select button prices
            updateQuickSelectPrices();
        }
    } catch (error) {
        console.error('Error loading credit price:', error);
        // Use default if fails
        creditPriceIDR = 2000;
    }
}

/**
 * Update prices on quick select buttons
 */
function updateQuickSelectPrices() {
    const amounts = [10, 20, 50, 100, 200];
    amounts.forEach(amount => {
        const priceElement = document.getElementById(`price-${amount}`);
        if (priceElement) {
            const price = amount * creditPriceIDR;
            priceElement.textContent = formatPrice(price);
        }
    });
}

/**
 * Format price to compact format (e.g., Rp 20K)
 */
function formatPrice(price) {
    if (price >= 1000000) {
        return `Rp ${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
        return `Rp ${(price / 1000)}K`;
    }
    return `Rp ${price.toLocaleString('id-ID')}`;
}

/**
 * Open top-up modal
 */
async function openTopUpModal() {
    console.log('🔍 Checking pending transactions...');
    
    // Check pending transactions first
    try {
        const response = await fetch('/api/payment/check-pending');
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            console.error('❌ API error:', response.status, response.statusText);
            throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Pending data:', data);
        
        if (!data.can_create_new) {
            console.log('⛔ User blocked - showing warning');
            showPendingWarning(data);
            return;
        }
        
        // Show info if there are pending transactions (but less than 3)
        if (data.pending_count > 0) {
            console.log('ℹ️ User has pending, showing info:', data.pending_count);
            showPendingInfo(data);
        }
    } catch (error) {
        console.error('❌ Error checking pending transactions:', error);
        // Continue to open modal even if check fails
    }
    
    console.log('✅ Opening top-up modal');
    document.getElementById('topUpModal').classList.remove('hidden');
    document.getElementById('topUpModal').classList.add('flex');
    loadCreditPrice();
}

/**
 * Close top-up modal
 */
function closeTopUpModal() {
    document.getElementById('topUpModal').classList.add('hidden');
    document.getElementById('topUpModal').classList.remove('flex');
    resetForm();
}

/**
 * Close on backdrop click
 */
function closeTopUpModalOnBackdrop(event) {
    if (event.target.id === 'topUpModal') {
        closeTopUpModal();
    }
}

/**
 * Show pending warning (blocked from creating new transaction)
 */
function showPendingWarning(data) {
    const { pending_count, time_remaining, transactions } = data;
    
    // Create transaction list HTML
    let transactionListHTML = '';
    if (transactions && transactions.length > 0) {
        transactionListHTML = `
            <div class="mt-3 space-y-2">
                <p class="text-sm font-medium text-gray-300">Transaksi Pending:</p>
                ${transactions.slice(0, 3).map(tx => `
                    <div class="bg-white/5 rounded-lg p-3 border border-red-500/20">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="text-sm font-semibold text-white">${tx.credits_amount} Credits</p>
                                <p class="text-xs text-gray-400">${tx.payment_method}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-sm font-bold text-yellow-400">Rp ${parseInt(tx.amount).toLocaleString('id-ID')}</p>
                                <p class="text-xs text-gray-400">Exp: ${new Date(tx.expired_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Show warning modal
    const warningHTML = `
        <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4" id="pendingWarningModal">
            <div class="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl shadow-2xl w-full max-w-md border border-red-500/30 transform transition-all">
                <div class="p-6">
                    <!-- Warning Icon -->
                    <div class="flex justify-center mb-4">
                        <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                            <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                        </div>
                    </div>
                    
                    <!-- Title -->
                    <h3 class="text-xl font-bold text-white text-center mb-2">
                        Transaksi Pending Maksimal
                    </h3>
                    
                    <!-- Message -->
                    <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
                        <p class="text-sm text-gray-300 text-center leading-relaxed">
                            Anda memiliki <span class="font-bold text-red-400">${pending_count} transaksi</span> yang belum dibayar.
                        </p>
                        <p class="text-xs text-gray-400 text-center mt-2">
                            Silakan selesaikan pembayaran atau tunggu hingga transaksi kadaluarsa
                            ${time_remaining ? `(sekitar <span class="font-semibold text-yellow-400">${time_remaining}</span> lagi)` : ''}
                        </p>
                    </div>
                    
                    ${transactionListHTML}
                    
                    <!-- Actions -->
                    <div class="flex gap-3 mt-6">
                        <button onclick="closePendingWarning()" class="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-all font-medium">
                            Tutup
                        </button>
                        <a href="/billing" class="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white rounded-xl transition-all font-bold text-center shadow-lg shadow-red-500/20">
                            Lihat Transaksi
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing warning if any
    const existingWarning = document.getElementById('pendingWarningModal');
    if (existingWarning) existingWarning.remove();
    
    // Add to body
    document.body.insertAdjacentHTML('beforeend', warningHTML);
}

/**
 * Close pending warning
 */
function closePendingWarning() {
    const modal = document.getElementById('pendingWarningModal');
    if (modal) modal.remove();
}

/**
 * Show pending info (has pending but can still create new)
 */
function showPendingInfo(data) {
    const { pending_count } = data;
    
    // Show toast notification
    const toastHTML = `
        <div class="fixed top-20 right-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black rounded-xl shadow-2xl p-4 z-50 transform transition-all animate-slide-in-right max-w-sm" id="pendingInfoToast">
            <div class="flex items-start gap-3">
                <div class="flex-shrink-0">
                    <svg class="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <div class="flex-1">
                    <p class="font-bold text-sm">Info Transaksi</p>
                    <p class="text-xs mt-1">Anda memiliki ${pending_count} transaksi pending. Batas maksimal 3 transaksi.</p>
                </div>
                <button onclick="document.getElementById('pendingInfoToast').remove()" class="flex-shrink-0 text-black hover:text-white transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        </div>
    `;
    
    // Remove existing toast if any
    const existingToast = document.getElementById('pendingInfoToast');
    if (existingToast) existingToast.remove();
    
    // Add to body
    document.body.insertAdjacentHTML('beforeend', toastHTML);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        const toast = document.getElementById('pendingInfoToast');
        if (toast) {
            toast.style.transform = 'translateX(400px)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

/**
 * Select credits (quick buttons)
 */
function selectCredits(amount) {
    // Remove previous selection
    document.querySelectorAll('.credit-btn').forEach(btn => {
        btn.classList.remove('border-yellow-500', 'bg-yellow-500/10');
        btn.classList.add('border-white/10');
    });

    // Add selection to clicked button
    event.currentTarget.classList.add('border-yellow-500', 'bg-yellow-500/10');
    event.currentTarget.classList.remove('border-white/10');

    // Clear custom input
    document.getElementById('customCredits').value = '';

    // Set selected amount
    selectedCreditsAmount = amount;

    // Update summary
    updateSummary();
}

/**
 * Calculate price for custom input
 */
function calculatePrice() {
    const customInput = document.getElementById('customCredits');
    const amount = parseInt(customInput.value) || 0;

    // Remove selection from quick buttons
    document.querySelectorAll('.credit-btn').forEach(btn => {
        btn.classList.remove('border-yellow-500', 'bg-yellow-500/10');
        btn.classList.add('border-white/10');
    });

    // Set selected amount
    selectedCreditsAmount = amount;

    // Update summary
    updateSummary();
}

/**
 * Update price summary
 */
function updateSummary() {
    const summaryCredits = document.getElementById('summaryCredits');
    const summaryPricePerCredit = document.getElementById('summaryPricePerCredit');
    const summaryTotal = document.getElementById('summaryTotal');
    const proceedBtn = document.getElementById('proceedPaymentBtn');

    if (selectedCreditsAmount >= 1) {
        const subtotal = selectedCreditsAmount * creditPriceIDR;
        let discount = 0;
        
        // Apply promo discount if exists
        if (appliedPromo) {
            if (appliedPromo.type === 'percentage') {
                discount = Math.floor(subtotal * (appliedPromo.value / 100));
            } else if (appliedPromo.type === 'fixed') {
                discount = appliedPromo.value;
            }
        }
        
        const total = subtotal - discount;

        // Determine singular or plural
        const creditText = selectedCreditsAmount === 1 ? 'Credit' : 'Credits';
        summaryCredits.textContent = `${selectedCreditsAmount} ${creditText}`;
        summaryPricePerCredit.textContent = `Rp ${creditPriceIDR.toLocaleString('id-ID')}`;
        summaryTotal.textContent = `Rp ${total.toLocaleString('id-ID')}`;

        // Update summary display with discount if applicable
        const summaryContainer = document.querySelector('#priceSummary .space-y-1\\.5');
        if (summaryContainer && appliedPromo) {
            // Check if discount row already exists
            let discountRow = summaryContainer.querySelector('.discount-row');
            let separator = summaryContainer.querySelector('.separator');
            
            if (!discountRow) {
                // Create discount row
                discountRow = document.createElement('div');
                discountRow.className = 'flex justify-between text-sm discount-row';
                discountRow.innerHTML = `
                    <span class="text-gray-400">Diskon:</span>
                    <span class="text-green-400 font-semibold">-Rp ${discount.toLocaleString('id-ID')}</span>
                `;
                
                // Insert before separator or at end
                if (separator) {
                    summaryContainer.insertBefore(discountRow, separator);
                } else {
                    // Create separator if it doesn't exist
                    separator = document.createElement('div');
                    separator.className = 'h-px bg-white/10 my-2 separator';
                    summaryContainer.appendChild(separator);
                    summaryContainer.insertBefore(discountRow, separator);
                }
            } else {
                // Update existing discount row
                discountRow.querySelector('.text-green-400').textContent = `-Rp ${discount.toLocaleString('id-ID')}`;
            }
        }

        proceedBtn.disabled = false;
        proceedBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        summaryCredits.textContent = '0 Credits';
        summaryPricePerCredit.textContent = `Rp ${creditPriceIDR.toLocaleString('id-ID')}`;
        summaryTotal.textContent = 'Rp 0';
        proceedBtn.disabled = true;
        proceedBtn.classList.add('opacity-50', 'cursor-not-allowed');
        
        // Remove discount row if exists
        const discountRow = document.querySelector('.discount-row');
        if (discountRow) discountRow.remove();
    }
}

/**
 * Apply promo code
 */
async function applyPromoCode() {
    const input = document.getElementById('promoCode');
    const button = document.getElementById('applyPromoBtn');
    const code = input.value.trim().toUpperCase();

    console.log('🎫 Applying promo code:', code);
    console.log('💰 Selected credits:', selectedCreditsAmount);

    // Check if credits selected
    if (!selectedCreditsAmount || selectedCreditsAmount < 1) {
        showPromoMessage('❌ Pilih jumlah credits terlebih dahulu (minimal 1 credit)', 'error');
        return;
    }

    if (!code) {
        showPromoMessage('❌ Masukkan kode promo terlebih dahulu', 'error');
        return;
    }

    // Disable button
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Checking...';

    try {
        const amount = selectedCreditsAmount * creditPriceIDR;
        console.log('📤 Validating promo:', { code, amount, credits: selectedCreditsAmount });

        const response = await fetch('/api/payment/validate-promo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, amount })
        });

        const data = await response.json();
        console.log('📥 Promo validation response:', data);

        if (data.success) {
            appliedPromo = data.promo;
            showPromoMessage(`✅ ${data.message || 'Kode promo berhasil diterapkan!'}`, 'success');
            input.disabled = true;
            button.innerHTML = '<i class="fas fa-check mr-2"></i>Applied';
            updateSummary();

            // Add remove button
            const removeBtn = document.createElement('button');
            removeBtn.id = 'removePromoBtn';
            removeBtn.className = 'px-3 sm:px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm rounded-lg transition-all font-medium';
            removeBtn.innerHTML = '<i class="fas fa-times mr-1"></i>Hapus';
            removeBtn.onclick = function() { removePromoCode(); };
            button.parentElement.appendChild(removeBtn);
            button.style.display = 'none';
        } else {
            showPromoMessage(`❌ ${data.message || 'Kode promo tidak valid'}`, 'error');
            button.disabled = false;
            button.innerHTML = 'Terapkan';
        }
    } catch (error) {
        console.error('Error validating promo:', error);
        showPromoMessage('❌ Terjadi kesalahan saat memvalidasi kode promo', 'error');
        button.disabled = false;
        button.innerHTML = 'Terapkan';
    }
}

/**
 * Remove promo code
 */
function removePromoCode() {
    appliedPromo = null;
    const input = document.getElementById('promoCode');
    const button = document.getElementById('applyPromoBtn');
    const removeBtn = document.getElementById('removePromoBtn');

    input.value = '';
    input.disabled = false;
    button.disabled = false;
    button.innerHTML = 'Terapkan';
    button.style.display = '';
    
    if (removeBtn) removeBtn.remove();

    const discountRow = document.querySelector('.discount-row');
    if (discountRow) discountRow.remove();

    showPromoMessage('✅ Kode promo dihapus', 'success');
    updateSummary();
}

/**
 * Show promo message
 */
function showPromoMessage(message, type) {
    const messageDiv = document.getElementById('promoMessage');
    messageDiv.textContent = message;
    messageDiv.className = `mt-2 text-xs ${type === 'success' ? 'text-green-400' : 'text-red-400'}`;
    messageDiv.classList.remove('hidden');

    setTimeout(() => {
        messageDiv.classList.add('hidden');
    }, 5000);
}

/**
 * Show payment methods step
 */
function showPaymentMethodsStep() {
    if (selectedCreditsAmount < 1) {
        alert('Minimal 1 credit');
        return;
    }

    // Calculate final amount with promo
    let finalAmount = selectedCreditsAmount * creditPriceIDR;
    if (appliedPromo) {
        if (appliedPromo.type === 'percentage') {
            finalAmount -= Math.floor(finalAmount * (appliedPromo.value / 100));
        } else if (appliedPromo.type === 'fixed') {
            finalAmount -= appliedPromo.value;
        }
    }

    // Hide all steps first
    document.getElementById('creditsStep').classList.add('hidden');

    // Show payment methods step (will be implemented separately)
    alert('Payment method selection will be implemented in the next phase');
}

/**
 * Reset form
 */
function resetForm() {
    selectedCreditsAmount = 0;
    selectedPaymentMethod = null;
    appliedPromo = null;

    // Reset inputs
    document.getElementById('customCredits').value = '';
    document.getElementById('promoCode').value = '';
    document.getElementById('promoCode').disabled = false;

    // Reset buttons
    document.querySelectorAll('.credit-btn').forEach(btn => {
        btn.classList.remove('border-yellow-500', 'bg-yellow-500/10');
        btn.classList.add('border-white/10');
    });

    const applyBtn = document.getElementById('applyPromoBtn');
    if (applyBtn) {
        applyBtn.disabled = false;
        applyBtn.innerHTML = 'Terapkan';
        applyBtn.style.display = '';
    }

    const removeBtn = document.getElementById('removePromoBtn');
    if (removeBtn) removeBtn.remove();

    // Hide promo message
    document.getElementById('promoMessage').classList.add('hidden');

    // Reset summary
    updateSummary();

    // Show first step
    document.getElementById('creditsStep').classList.remove('hidden');
}

/**
 * Focus custom input
 */
function focusCustomInput() {
    document.getElementById('customCredits').focus();
    document.getElementById('customCredits').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPaymentModal);
} else {
    initPaymentModal();
}

