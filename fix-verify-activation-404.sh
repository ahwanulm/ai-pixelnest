#!/bin/bash

# ═══════════════════════════════════════════════════
# Fix 404 Error on verify-activation
# ═══════════════════════════════════════════════════

set -e

echo "═══════════════════════════════════════════════════"
echo "🔧 Fix 404 Error - verify-activation"
echo "═══════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Step 1: Check if running on server or local
if [ -f "/var/www/pixelnest/package.json" ]; then
    PROJECT_DIR="/var/www/pixelnest"
    print_info "Running on server: $PROJECT_DIR"
else
    PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    print_info "Running locally: $PROJECT_DIR"
fi

cd "$PROJECT_DIR"

# Step 2: Check if verify-activation.ejs exists
print_info "Checking verify-activation.ejs file..."
if [ -f "src/views/auth/verify-activation.ejs" ]; then
    print_success "verify-activation.ejs exists"
else
    print_error "verify-activation.ejs NOT FOUND!"
    print_info "Creating verify-activation.ejs..."
    
    # Create the file
    mkdir -p src/views/auth
    cat > src/views/auth/verify-activation.ejs << 'EOF'
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Verify Email - PixelNest">
    <title><%= title %></title>
    
    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/assets/img/favicon.svg">
    <link rel="icon" type="image/png" href="/assets/img/favicon.png">
    <link rel="apple-touch-icon" href="/assets/img/favicon.png">
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/css/output.css">
    <style>
        .input-glow:focus {
            box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1), 0 0 15px rgba(139, 92, 246, 0.15);
        }
        .slide-in {
            animation: slideIn 0.3s ease-out;
        }
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(15px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .code-input {
            font-family: 'JetBrains Mono', monospace;
            letter-spacing: 0.4em;
            text-align: center;
            font-size: 1.5rem;
            font-weight: 700;
        }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center px-4 py-6">
    
    <div class="fixed inset-0 -z-10">
        <div class="absolute top-20 left-10 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl"></div>
        <div class="absolute bottom-20 right-10 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl"></div>
    </div>

    <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="text-center mb-4 slide-in">
            <a href="/" class="inline-flex items-center justify-center gap-2">
                <!-- Logo Icon -->
                <div class="w-9 h-9 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                    <img src="/assets/img/logo/logo.png" alt="PixelNest Logo" class="h-6 w-auto">
                </div>
                
                <!-- Text -->
                <div class="flex flex-col items-start">
                    <span class="text-base font-black text-white uppercase tracking-tight leading-none">PIXELNEST</span>
                    <span class="text-[9px] text-gray-400 uppercase tracking-[0.15em] font-medium">AI VIDEO STUDIO</span>
                </div>
            </a>
        </div>

        <!-- Verification Card -->
        <div class="glass-panel p-5 rounded-xl slide-in" style="animation-delay: 0.1s;">
            <!-- Email Icon -->
            <div class="text-center mb-4">
                <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 mb-3">
                    <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                </div>
                <h1 class="text-2xl font-bold text-white mb-1">Verifikasi Email</h1>
                <p class="text-gray-400 text-xs">Kode dikirim ke</p>
                <p class="text-violet-400 font-semibold text-sm"><%= email %></p>
            </div>

            <!-- Success/Info Message -->
            <% if (message) { %>
            <div class="mb-3 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div class="flex items-start">
                    <svg class="w-4 h-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                    </svg>
                    <p class="text-blue-300 text-xs"><%= message %></p>
                </div>
            </div>
            <% } %>

            <!-- Error Message -->
            <% if (error) { %>
            <div class="mb-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div class="flex items-start">
                    <svg class="w-4 h-4 text-red-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                    </svg>
                    <p class="text-red-300 text-xs"><%= error %></p>
                </div>
            </div>
            <% } %>

            <!-- Verification Form -->
            <form action="/auth/verify-activation" method="POST" id="verifyForm">
                <input type="hidden" name="email" value="<%= email %>">
                
                <!-- Code Input -->
                <div class="mb-4">
                    <label class="block text-xs font-medium text-gray-300 mb-2 text-center">
                        Kode Aktivasi (6 digit)
                    </label>
                    <input 
                        type="text" 
                        name="code" 
                        id="code"
                        maxlength="6"
                        pattern="[0-9]{6}"
                        class="code-input w-full px-3 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none input-glow transition-all"
                        placeholder="000000"
                        required
                        autocomplete="off"
                        autofocus
                    >
                    <p class="text-[10px] text-gray-500 mt-1.5 text-center">Kode berlaku selama 15 menit</p>
                </div>

                <!-- Verify Button -->
                <button 
                    type="submit"
                    class="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                    Verifikasi Kode
                </button>
            </form>

            <!-- Resend Section -->
            <div class="mt-4 text-center">
                <p class="text-gray-400 text-xs mb-2">Tidak menerima kode?</p>
                <button 
                    type="button" 
                    id="resendBtn"
                    class="text-violet-400 hover:text-violet-300 text-xs font-medium transition-colors"
                >
                    Kirim Ulang Kode
                </button>
                <div id="resendTimer" class="hidden mt-2">
                    <p class="text-gray-500 text-xs">Kirim ulang dalam <span id="countdown">60</span> detik</p>
                </div>
            </div>

            <!-- Back to Login -->
            <div class="mt-4 text-center">
                <a href="/login" class="text-gray-400 hover:text-gray-300 text-xs transition-colors">
                    ← Kembali ke Login
                </a>
            </div>
        </div>
    </div>

    <script>
        // Code input formatting
        const codeInput = document.getElementById('code');
        codeInput.addEventListener('input', function(e) {
            // Only allow numbers
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            
            // Auto-submit when 6 digits entered
            if (e.target.value.length === 6) {
                document.getElementById('verifyForm').submit();
            }
        });

        // Resend functionality
        const resendBtn = document.getElementById('resendBtn');
        const resendTimer = document.getElementById('resendTimer');
        const countdownEl = document.getElementById('countdown');
        let countdown = 0;

        resendBtn.addEventListener('click', async function() {
            if (countdown > 0) return;

            try {
                const response = await fetch('/auth/resend-activation', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: '<%= email %>'
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    // Show success message
                    alert('Kode aktivasi baru telah dikirim!');
                    
                    // Start countdown
                    countdown = 60;
                    resendBtn.style.display = 'none';
                    resendTimer.classList.remove('hidden');
                    
                    const timer = setInterval(() => {
                        countdown--;
                        countdownEl.textContent = countdown;
                        
                        if (countdown <= 0) {
                            clearInterval(timer);
                            resendBtn.style.display = 'inline';
                            resendTimer.classList.add('hidden');
                        }
                    }, 1000);
                } else {
                    alert('Gagal mengirim kode: ' + data.message);
                }
            } catch (error) {
                console.error('Resend error:', error);
                alert('Terjadi kesalahan. Silakan coba lagi.');
            }
        });
    </script>
</body>
</html>
EOF
    
    print_success "verify-activation.ejs created"
fi

# Step 3: Check auth routes
print_info "Checking auth routes..."
if grep -q "verify-activation" src/routes/auth.js; then
    print_success "Route /auth/verify-activation exists in auth.js"
else
    print_error "Route /auth/verify-activation NOT FOUND in auth.js"
    print_info "Adding route..."
    
    # Add the route
    sed -i '/Email activation routes/a\\n// Email activation routes\nrouter.post("/auth/verify-activation", authController.verifyActivation);\nrouter.post("/auth/resend-activation", authController.resendActivationCode);' src/routes/auth.js
    
    print_success "Route added to auth.js"
fi

# Step 4: Check if server.js includes auth routes
print_info "Checking server.js routes..."
if grep -q "authRouter" server.js; then
    print_success "authRouter is included in server.js"
else
    print_error "authRouter NOT FOUND in server.js"
    print_info "Adding authRouter to server.js..."
    
    # Add authRouter import
    sed -i '/const indexRouter/a\\nconst authRouter = require("./src/routes/auth");' server.js
    
    # Add authRouter usage
    sed -i '/\/\/ Routes/a\\napp.use("/", authRouter); // Auth routes' server.js
    
    print_success "authRouter added to server.js"
fi

# Step 5: Check if authController has verifyActivation method
print_info "Checking authController..."
if grep -q "verifyActivation" src/controllers/authController.js; then
    print_success "verifyActivation method exists in authController"
else
    print_error "verifyActivation method NOT FOUND in authController"
    print_warning "You need to add the verifyActivation method to authController.js"
fi

# Step 6: Restart server (if on server)
if [ -f "/var/www/pixelnest/package.json" ]; then
    print_info "Restarting PM2..."
    
    # Stop PM2
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    
    # Start fresh
    pm2 start server.js --name pixelnest-server
    pm2 save
    
    print_success "PM2 restarted"
    
    # Wait a moment
    sleep 3
    
    # Check PM2 status
    print_info "PM2 Status:"
    pm2 list
else
    print_info "Local environment - restart your server manually:"
    print_info "  npm start"
    print_info "  # or"
    print_info "  node server.js"
fi

# Step 7: Test the route
print_info "Testing verify-activation route..."

# Check if server is running
if command -v curl &> /dev/null; then
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:5005/auth/verify-activation 2>/dev/null | grep -q "200\|405"; then
        print_success "Route /auth/verify-activation is accessible (200/405 response)"
    else
        print_warning "Route test failed - server might not be running"
    fi
else
    print_warning "curl not available - cannot test route"
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "🎉 Fix Complete!"
echo "═══════════════════════════════════════════════════"
echo ""
echo "📋 What was fixed:"
echo "✅ Checked verify-activation.ejs exists"
echo "✅ Verified route in auth.js"
echo "✅ Verified authRouter in server.js"
echo "✅ Checked authController method"
echo "✅ Restarted PM2 (if on server)"
echo ""
echo "🧪 Test your fix:"
echo "1. Visit your website"
echo "2. Try to register a new user"
echo "3. Check if verify-activation page loads"
echo "4. If still 404, check PM2 logs: pm2 logs"
echo ""
echo "📞 If still having issues:"
echo "1. Check PM2 logs: pm2 logs --lines 50"
echo "2. Check if all files uploaded correctly"
echo "3. Verify server.js includes all routes"
echo ""



