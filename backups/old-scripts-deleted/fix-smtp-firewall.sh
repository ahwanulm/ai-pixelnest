#!/bin/bash

# ═══════════════════════════════════════════════════
# Fix SMTP Firewall - Buka Port SMTP untuk Email
# ═══════════════════════════════════════════════════

set -e

echo "═══════════════════════════════════════════════════"
echo "🔥 Fix SMTP Firewall - ETIMEDOUT Error"
echo "═══════════════════════════════════════════════════"
echo ""

# Step 1: Test current SMTP connectivity
echo "1️⃣  Testing Current SMTP Connectivity..."
echo "───────────────────────────────────────────────────"
echo ""

echo "Testing Gmail SMTP ports..."
echo ""

# Test port 587 (TLS)
echo -n "Port 587 (TLS): "
if timeout 5 bash -c "cat < /dev/null > /dev/tcp/smtp.gmail.com/587" 2>/dev/null; then
    echo "✅ OPEN"
    PORT_587_OPEN=true
else
    echo "❌ BLOCKED"
    PORT_587_OPEN=false
fi

# Test port 465 (SSL)
echo -n "Port 465 (SSL): "
if timeout 5 bash -c "cat < /dev/null > /dev/tcp/smtp.gmail.com/465" 2>/dev/null; then
    echo "✅ OPEN"
    PORT_465_OPEN=true
else
    echo "❌ BLOCKED"
    PORT_465_OPEN=false
fi

echo ""

# If both ports are blocked
if [ "$PORT_587_OPEN" = false ] && [ "$PORT_465_OPEN" = false ]; then
    echo "🚨 PROBLEM: Both SMTP ports are BLOCKED!"
    echo ""
    echo "This is why email cannot be sent (ETIMEDOUT error)."
    echo ""
    echo "═══════════════════════════════════════════════════"
    echo "🔧 Solutions"
    echo "═══════════════════════════════════════════════════"
    echo ""
    
    echo "OPTION 1: Open Firewall Ports (If you have root access)"
    echo "───────────────────────────────────────────────────"
    echo ""
    
    # Detect firewall type
    if command -v ufw &> /dev/null; then
        echo "Detected: UFW firewall"
        echo ""
        echo "Run these commands:"
        echo ""
        echo "  sudo ufw allow 587/tcp"
        echo "  sudo ufw allow 465/tcp"
        echo "  sudo ufw reload"
        echo ""
    elif command -v firewall-cmd &> /dev/null; then
        echo "Detected: Firewalld"
        echo ""
        echo "Run these commands:"
        echo ""
        echo "  sudo firewall-cmd --permanent --add-port=587/tcp"
        echo "  sudo firewall-cmd --permanent --add-port=465/tcp"
        echo "  sudo firewall-cmd --reload"
        echo ""
    elif command -v iptables &> /dev/null; then
        echo "Detected: iptables"
        echo ""
        echo "Run these commands:"
        echo ""
        echo "  sudo iptables -A OUTPUT -p tcp --dport 587 -j ACCEPT"
        echo "  sudo iptables -A OUTPUT -p tcp --dport 465 -j ACCEPT"
        echo "  sudo service iptables save"
        echo ""
    else
        echo "Could not detect firewall type."
        echo ""
        echo "Common commands to try:"
        echo "  sudo ufw allow 587/tcp"
        echo "  sudo ufw allow 465/tcp"
        echo ""
    fi
    
    echo "OPTION 2: Contact Your Hosting Provider"
    echo "───────────────────────────────────────────────────"
    echo ""
    echo "Many cloud providers (DigitalOcean, AWS, etc) block SMTP"
    echo "ports by default to prevent spam. You need to:"
    echo ""
    echo "  1. Open support ticket"
    echo "  2. Request to unblock ports 587 and 465"
    echo "  3. Explain it's for transactional emails (activation codes)"
    echo ""
    
    echo "OPTION 3: Use SMTP Relay Service (RECOMMENDED)"
    echo "───────────────────────────────────────────────────"
    echo ""
    echo "If ports cannot be opened, use an SMTP relay service:"
    echo ""
    echo "  • SendGrid (12,000 free emails/month)"
    echo "    https://sendgrid.com"
    echo ""
    echo "  • Mailgun (5,000 free emails/month)"
    echo "    https://mailgun.com"
    echo ""
    echo "  • Amazon SES (62,000 free emails/month)"
    echo "    https://aws.amazon.com/ses/"
    echo ""
    echo "  • Brevo (formerly Sendinblue) (300 free emails/day)"
    echo "    https://brevo.com"
    echo ""
    echo "These services provide SMTP credentials that work even"
    echo "when ports 587/465 are blocked."
    echo ""
    
    echo "═══════════════════════════════════════════════════"
    echo ""
    read -p "Do you want to open firewall ports now? (y/n): " -n 1 -r
    echo ""
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔧 Opening firewall ports..."
        echo ""
        
        if command -v ufw &> /dev/null; then
            sudo ufw allow 587/tcp
            sudo ufw allow 465/tcp
            sudo ufw reload
            echo "✅ UFW firewall updated"
        elif command -v firewall-cmd &> /dev/null; then
            sudo firewall-cmd --permanent --add-port=587/tcp
            sudo firewall-cmd --permanent --add-port=465/tcp
            sudo firewall-cmd --reload
            echo "✅ Firewalld updated"
        elif command -v iptables &> /dev/null; then
            sudo iptables -A OUTPUT -p tcp --dport 587 -j ACCEPT
            sudo iptables -A OUTPUT -p tcp --dport 465 -j ACCEPT
            echo "✅ iptables updated"
        else
            echo "❌ Could not update firewall automatically"
            echo "   Please open ports manually"
        fi
        
        echo ""
        echo "Testing connection again..."
        sleep 2
        
        echo -n "Port 587 (TLS): "
        if timeout 5 bash -c "cat < /dev/null > /dev/tcp/smtp.gmail.com/587" 2>/dev/null; then
            echo "✅ NOW OPEN!"
        else
            echo "❌ Still blocked (may need provider to unblock)"
        fi
        
        echo -n "Port 465 (SSL): "
        if timeout 5 bash -c "cat < /dev/null > /dev/tcp/smtp.gmail.com/465" 2>/dev/null; then
            echo "✅ NOW OPEN!"
        else
            echo "❌ Still blocked (may need provider to unblock)"
        fi
    else
        echo "Skipped firewall configuration."
    fi
    
elif [ "$PORT_587_OPEN" = true ] || [ "$PORT_465_OPEN" = true ]; then
    echo "✅ At least one SMTP port is accessible!"
    echo ""
    echo "Email should work. If still not working, check:"
    echo "  1. Gmail App Password is correct"
    echo "  2. EMAIL_USER and EMAIL_PASSWORD in .env"
    echo "  3. Server has been restarted: pm2 restart all"
else
    echo "⚠️  Unexpected state. Please run manual tests."
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "📝 Next Steps"
echo "═══════════════════════════════════════════════════"
echo ""
echo "After opening ports or configuring SMTP relay:"
echo ""
echo "1. Restart PM2:"
echo "   pm2 restart all"
echo ""
echo "2. Test email connection:"
echo "   node test-email-connection.js"
echo ""
echo "3. Try user registration again"
echo ""
echo "═══════════════════════════════════════════════════"
echo ""

