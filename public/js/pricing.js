// ========================================
// Pricing Toggle (Monthly/Yearly)
// ========================================

const toggleButtons = document.querySelectorAll('.toggle-btn');
const pricingCards = document.querySelectorAll('.pricing-card');

toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        toggleButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        button.classList.add('active');
        
        // Get the selected period
        const period = button.getAttribute('data-period');
        
        // Update prices
        updatePrices(period);
    });
});

function updatePrices(period) {
    const priceElements = document.querySelectorAll('.pricing-price .price');
    
    priceElements.forEach(priceEl => {
        const monthlyPrice = parseFloat(priceEl.getAttribute('data-monthly'));
        const yearlyPrice = parseFloat(priceEl.getAttribute('data-yearly'));
        
        if (monthlyPrice && yearlyPrice) {
            if (period === 'yearly') {
                // Animate price change
                animateValue(priceEl, monthlyPrice, yearlyPrice, 300);
            } else {
                animateValue(priceEl, yearlyPrice || monthlyPrice, monthlyPrice, 300);
            }
        }
    });
}

function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            element.textContent = '$' + Math.round(end);
            clearInterval(timer);
        } else {
            element.textContent = '$' + Math.round(current);
        }
    }, 16);
}

// ========================================
// Pricing Card Hover Effect
// ========================================

pricingCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px)';
    });
    
    card.addEventListener('mouseleave', function() {
        if (this.classList.contains('popular')) {
            this.style.transform = 'scale(1.05)';
        } else {
            this.style.transform = 'translateY(0)';
        }
    });
});

// ========================================
// Plan Comparison Toggle
// ========================================

const comparisonToggle = document.getElementById('comparisonToggle');
const comparisonTable = document.getElementById('comparisonTable');

if (comparisonToggle && comparisonTable) {
    comparisonToggle.addEventListener('click', () => {
        comparisonTable.classList.toggle('visible');
        
        if (comparisonTable.classList.contains('visible')) {
            comparisonToggle.textContent = 'Hide Comparison';
        } else {
            comparisonToggle.textContent = 'Compare Plans';
        }
    });
}

// ========================================
// Plan Selection
// ========================================

const planButtons = document.querySelectorAll('.pricing-card .btn');

planButtons.forEach(button => {
    button.addEventListener('click', function(e) {
        const card = this.closest('.pricing-card');
        const planName = card.querySelector('h3').textContent;
        
        // Store selected plan in sessionStorage
        sessionStorage.setItem('selectedPlan', planName);
        
        // Add a visual feedback
        this.textContent = 'Selected ✓';
        this.style.background = '#10b981';
        
        setTimeout(() => {
            this.textContent = 'Get Started';
            this.style.background = '';
        }, 1500);
    });
});

// ========================================
// Pricing Calculator
// ========================================

const calculatorSlider = document.getElementById('userCount');
const calculatorOutput = document.getElementById('calculatedPrice');

if (calculatorSlider && calculatorOutput) {
    calculatorSlider.addEventListener('input', function() {
        const users = parseInt(this.value);
        const basePrice = 50;
        const pricePerUser = 10;
        const totalPrice = basePrice + (users * pricePerUser);
        
        calculatorOutput.textContent = '$' + totalPrice;
    });
}

// ========================================
// Auto-fill from URL params
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const planParam = urlParams.get('plan');
    
    if (planParam) {
        // Highlight the selected plan
        pricingCards.forEach(card => {
            const planName = card.querySelector('h3').textContent.toLowerCase();
            if (planName === planParam.toLowerCase()) {
                card.style.border = '2px solid #10b981';
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }
});

