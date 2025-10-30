const sgMail = require('@sendgrid/mail');
const { pool } = require('../config/database');
require('dotenv').config();

class EmailService {
  constructor() {
    this.config = null;
    this.isConfigured = false;
    this.initialized = false;
  }

  /**
   * Initialize SendGrid configuration from database
   */
  async initialize(forceReload = false) {
    // Allow force reload to refresh config without restarting server
    if (this.initialized && !forceReload) return;

    try {
      // Try to read from api_configs database first
      const query = `
        SELECT api_key, endpoint_url, is_active, additional_config
        FROM api_configs
        WHERE service_name = 'SENDGRID'
        LIMIT 1
      `;
      const result = await pool.query(query);

      let config;
      let source = 'database';

      if (result.rows.length === 0) {
        // Fallback to .env if not in database
        console.log('⚠️  SendGrid config not found in database, using .env fallback');
        
        if (!process.env.SENDGRID_API_KEY) {
          console.warn('⚠️  SendGrid not configured in database or .env file');
          console.warn('    Get your API key from: https://app.sendgrid.com/settings/api_keys');
          this.isConfigured = false;
          this.initialized = true;
          return;
        }

        config = {
          api_key: process.env.SENDGRID_API_KEY,
          endpoint_url: 'https://api.sendgrid.com/v3',
          is_active: true,
          additional_config: {
            email_from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@pixelnest.com',
            email_from_name: 'PixelNest'
          }
        };
        source = '.env';
      } else {
        config = result.rows[0];
        
        if (!config.is_active) {
          console.warn('⚠️  SendGrid service is not active in database');
          this.isConfigured = false;
          this.initialized = true;
          return;
        }
      }

      // Setup SendGrid with config
      if (config.api_key) {
        sgMail.setApiKey(config.api_key);
        this.config = {
          apiKey: config.api_key,
          endpointUrl: config.endpoint_url || 'https://api.sendgrid.com/v3',
          emailFrom: config.additional_config?.email_from || 'noreply@pixelnest.com',
          emailFromName: config.additional_config?.email_from_name || 'PixelNest',
          isActive: config.is_active
        };
        this.isConfigured = true;
        console.log('✅ SendGrid API initialized from', source);
        console.log(`📧 Email from: ${this.config.emailFrom}`);
      } else {
        console.warn('⚠️  SendGrid API key is empty');
        this.isConfigured = false;
      }

      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize SendGrid:', error);
      this.isConfigured = false;
      this.initialized = true;
    }
  }

  /**
   * Generate random 6-digit activation code
   */
  generateActivationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * ✅ OPTIMIZED: Send activation code email (NON-BLOCKING)
   * Use this for faster user registration experience
   */
  async sendActivationCodeAsync(email, name, activationCode) {
    await this.initialize();
    
    if (!this.isConfigured) {
      console.warn('⚠️  SendGrid not configured, skipping email send');
      return { queued: false, code: activationCode, error: 'SendGrid not configured' };
    }

    const msg = {
      to: email,
      from: {
        email: this.config.emailFrom,
        name: this.config.emailFromName
      },
      subject: 'Kode Aktivasi Akun PixelNest',
      html: this._getActivationEmailHtml(name, activationCode)
    };

    // ✅ Fire-and-forget: Don't wait for email to be sent
    sgMail.send(msg)
      .then((response) => {
        console.log('✅ Activation email sent to:', email);
        console.log('📧 SendGrid Response:', response[0].statusCode);
      })
      .catch((error) => {
        console.error('❌ Failed to send activation email:', error);
        if (error.response) {
          console.error('   SendGrid Error:', error.response.body);
        }
      });

    // Return immediately
    console.log(`📨 Activation email queued for: ${email}`);
    return { queued: true, code: activationCode };
  }

  /**
   * Send activation code email (BLOCKING - for backward compatibility)
   * Consider using sendActivationCodeAsync() for better performance
   */
  async sendActivationCode(email, name, activationCode) {
    await this.initialize();
    
    if (!this.isConfigured) {
      console.warn('⚠️  SendGrid not configured, skipping email send');
      throw new Error('SendGrid not configured');
    }

    const msg = {
      to: email,
      from: {
        email: this.config.emailFrom,
        name: this.config.emailFromName
      },
      subject: 'Kode Aktivasi Akun PixelNest',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: #000000;
      padding: 40px 30px;
      text-align: center;
      border-bottom: 1px solid #e5e5e5;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 8px 0 0 0;
      font-size: 13px;
      color: #999999;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 20px;
      font-weight: 500;
    }
    .message {
      color: #4b5563;
      margin-bottom: 30px;
      font-size: 15px;
    }
    .code-container {
      background: #f9fafb;
      border: 2px solid #000000;
      border-radius: 8px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    .code-label {
      color: #6b7280;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
    .code {
      font-size: 48px;
      font-weight: 700;
      color: #000000;
      letter-spacing: 8px;
      margin: 10px 0;
      font-family: 'Courier New', monospace;
    }
    .expiry {
      color: #dc2626;
      font-size: 14px;
      margin-top: 15px;
      font-weight: 500;
    }
    .instructions {
      background: #f9fafb;
      border-left: 4px solid #000000;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .instructions p {
      margin: 8px 0;
      color: #4b5563;
      font-size: 14px;
    }
    .instructions strong {
      color: #1f2937;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
      font-size: 14px;
      color: #92400e;
    }
    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 30px 0;
    }
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 5px 0;
      color: #6b7280;
      font-size: 13px;
    }
    .footer strong {
      color: #1f2937;
    }
    .footer a {
      color: #000000;
      text-decoration: none;
      border-bottom: 1px solid #000000;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PIXELNEST</h1>
      <p>AI Automation Platform</p>
    </div>
    
    <div class="content">
      <div class="greeting">
        Halo, <strong>${name}</strong>
      </div>
      
      <div class="message">
        Gunakan kode berikut untuk mengaktifkan akun PixelNest Anda:
      </div>
      
      <div class="code-container">
        <div class="code-label">Kode Aktivasi</div>
        <div class="code">${activationCode}</div>
        <div class="expiry">⏱ Berlaku 15 menit</div>
      </div>
      
      <div class="instructions">
        <p><strong>Cara Aktivasi:</strong></p>
        <p>1. Masukkan kode 6 digit di atas</p>
        <p>2. Klik "Aktivasi Akun"</p>
        <p>3. Selesai! Akun Anda aktif</p>
      </div>
      
      <div class="warning">
        <strong>⚠️ Penting:</strong> Kode hanya dapat digunakan sekali dan kadaluarsa dalam 15 menit.
      </div>
    </div>
    
    <div class="footer">
      <p><strong>PIXELNEST</strong></p>
      <p>© ${new Date().getFullYear()} PixelNest - AI Automation Platform</p>
    </div>
  </div>
</body>
</html>
      `
    };

    try {
      const response = await sgMail.send(msg);
      console.log('✅ Activation email sent to:', email);
      console.log('📧 SendGrid Response:', response[0].statusCode);
      return { success: true, statusCode: response[0].statusCode };
    } catch (error) {
      console.error('❌ Failed to send activation email:', error);
      if (error.response) {
        console.error('   SendGrid Error:', error.response.body);
      }
      throw new Error('Gagal mengirim email aktivasi. Silakan coba lagi.');
    }
  }

  /**
   * ✅ OPTIMIZED: Send welcome email (NON-BLOCKING)
   */
  async sendWelcomeEmailAsync(email, name) {
    await this.initialize();
    
    if (!this.isConfigured) {
      console.warn('⚠️  SendGrid not configured, skipping email send');
      return { queued: false, error: 'SendGrid not configured' };
    }

    const msg = {
      to: email,
      from: {
        email: this.config.emailFrom,
        name: this.config.emailFromName
      },
      subject: 'Selamat Datang di PixelNest',
      html: this._getWelcomeEmailHtml(name)
    };

    // Fire-and-forget
    sgMail.send(msg)
      .then((response) => {
        console.log('✅ Welcome email sent to:', email);
        console.log('📧 SendGrid Response:', response[0].statusCode);
      })
      .catch((error) => {
        console.error('❌ Failed to send welcome email:', error);
        if (error.response) {
          console.error('   SendGrid Error:', error.response.body);
        }
      });

    console.log(`📨 Welcome email queued for: ${email}`);
    return { queued: true };
  }

  /**
   * Send welcome email after successful activation (BLOCKING)
   */
  async sendWelcomeEmail(email, name) {
    await this.initialize();
    
    if (!this.isConfigured) {
      console.warn('⚠️  SendGrid not configured, skipping email send');
      return; // Don't throw error for welcome email, it's not critical
    }

    const msg = {
      to: email,
      from: {
        email: this.config.emailFrom,
        name: this.config.emailFromName
      },
      subject: 'Selamat Datang di PixelNest',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: #000000;
      padding: 40px 30px;
      text-align: center;
      border-bottom: 1px solid #e5e5e5;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 8px 0 0 0;
      font-size: 13px;
      color: #999999;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 20px;
      font-weight: 500;
    }
    .message {
      color: #4b5563;
      margin-bottom: 30px;
      font-size: 15px;
    }
    .features {
      background: #f9fafb;
      border-left: 4px solid #000000;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .features h3 {
      margin: 0 0 16px 0;
      color: #1f2937;
      font-size: 16px;
      font-weight: 600;
    }
    .features ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .features li {
      color: #4b5563;
      font-size: 14px;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .features li:last-child {
      border-bottom: none;
    }
    .features li strong {
      color: #1f2937;
      display: block;
      margin-bottom: 4px;
    }
    .button {
      display: inline-block;
      background: #000000;
      color: #ffffff;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 600;
      margin: 20px 0;
      transition: transform 0.2s;
    }
    .button:hover {
      background: #1a1a1a;
      transform: translateY(-2px);
    }
    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 30px 0;
    }
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 5px 0;
      color: #6b7280;
      font-size: 13px;
    }
    .footer strong {
      color: #1f2937;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PIXELNEST</h1>
      <p>AI Automation Platform</p>
    </div>
    
    <div class="content">
      <div class="greeting">
        Selamat Datang, <strong>${name}!</strong>
      </div>
      
      <div class="message">
        Akun PixelNest Anda telah aktif. Anda sekarang dapat menggunakan semua fitur AI generation kami dan mulai menghasilkan uang melalui program referral!
      </div>
      
      <div class="features">
        <h3>🎨 Fitur AI Generation:</h3>
        <ul>
          <li><strong>AI Image Generation</strong> - Generate gambar dengan berbagai model AI terbaik</li>
          <li><strong>AI Video Creation</strong> - Buat video dengan teknologi AI canggih</li>
          <li><strong>AI Audio Studio</strong> - Text-to-speech dengan berbagai voice dan bahasa</li>
          <li><strong>Multiple AI Models</strong> - Akses berbagai model AI terkini</li>
          <li><strong>Credit Management</strong> - Kelola credit Anda dengan mudah</li>
        </ul>
      </div>
      
      <div class="features" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-left: 4px solid #8b5cf6;">
        <h3 style="color: #ffffff;">💰 Program Referral - Dapatkan Penghasilan!</h3>
        <ul>
          <li style="color: #f3f4f6; border-bottom-color: rgba(255,255,255,0.2);"><strong style="color: #ffffff;">Link Referral Unik</strong> - Bagikan link Anda dan ajak teman bergabung</li>
          <li style="color: #f3f4f6; border-bottom-color: rgba(255,255,255,0.2);"><strong style="color: #ffffff;">Komisi 5% dari Pembelian</strong> - Dapatkan komisi setiap teman Anda melakukan top-up (maksimal 2x pembelian per referral)</li>
          <li style="color: #f3f4f6; border-bottom-color: rgba(255,255,255,0.2);"><strong style="color: #ffffff;">Minimum Payout Rp 25.000</strong> - Cairkan penghasilan Anda dengan mudah</li>
          <li style="color: #f3f4f6; border-bottom: none;"><strong style="color: #ffffff;">Dashboard Tracking</strong> - Pantau penghasilan real-time di halaman referral</li>
        </ul>
      </div>
      
      <center>
        <a href="${process.env.BASE_URL || 'http://localhost:5005'}/dashboard" class="button">
          MULAI SEKARANG
        </a>
      </center>
      
      <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
        <p style="margin: 0; color: #92400e; font-size: 14px;">
          <strong style="color: #78350f;">💡 Tips:</strong> Kunjungi halaman <strong>Referral Dashboard</strong> untuk mendapatkan link referral unik Anda dan mulai menghasilkan uang!
        </p>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>PIXELNEST</strong></p>
      <p>© ${new Date().getFullYear()} PixelNest - AI Automation Platform</p>
    </div>
  </div>
</body>
</html>
      `
    };

    try {
      const response = await sgMail.send(msg);
      console.log('✅ Welcome email sent to:', email);
      console.log('📧 SendGrid Response:', response[0].statusCode);
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      if (error.response) {
        console.error('   SendGrid Error:', error.response.body);
      }
      // Don't throw error for welcome email, it's not critical
    }
  }

  /**
   * Send password reset code email
   */
  async sendPasswordResetCode(email, name, resetCode) {
    await this.initialize();
    
    if (!this.isConfigured) {
      console.warn('⚠️  SendGrid not configured, skipping email send');
      throw new Error('SendGrid not configured');
    }

    const msg = {
      to: email,
      from: {
        email: this.config.emailFrom,
        name: this.config.emailFromName
      },
      subject: 'Reset Password - PixelNest',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: #000000;
      padding: 40px 30px;
      text-align: center;
      border-bottom: 1px solid #e5e5e5;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 8px 0 0 0;
      font-size: 13px;
      color: #999999;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 20px;
      font-weight: 500;
    }
    .message {
      color: #4b5563;
      margin-bottom: 30px;
      font-size: 15px;
    }
    .code-container {
      background: #f9fafb;
      border: 2px solid #000000;
      border-radius: 8px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    .code-label {
      color: #6b7280;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
    .code {
      font-size: 48px;
      font-weight: 700;
      color: #000000;
      letter-spacing: 8px;
      margin: 10px 0;
      font-family: 'Courier New', monospace;
    }
    .expiry {
      color: #dc2626;
      font-size: 14px;
      margin-top: 15px;
      font-weight: 500;
    }
    .instructions {
      background: #f9fafb;
      border-left: 4px solid #000000;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .instructions p {
      margin: 8px 0;
      color: #4b5563;
      font-size: 14px;
    }
    .instructions strong {
      color: #1f2937;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
      font-size: 14px;
      color: #92400e;
    }
    .security-note {
      background: #fee2e2;
      border-left: 4px solid #dc2626;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
      font-size: 14px;
      color: #991b1b;
    }
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 5px 0;
      color: #6b7280;
      font-size: 13px;
    }
    .footer strong {
      color: #1f2937;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PIXELNEST</h1>
      <p>AI Automation Platform</p>
    </div>
    
    <div class="content">
      <div class="greeting">
        Halo, <strong>${name}</strong>
      </div>
      
      <div class="message">
        Kami menerima permintaan untuk mereset password akun PixelNest Anda. Gunakan kode berikut untuk melanjutkan:
      </div>
      
      <div class="code-container">
        <div class="code-label">Kode Reset Password</div>
        <div class="code">${resetCode}</div>
        <div class="expiry">⏱ Berlaku 15 menit</div>
      </div>
      
      <div class="instructions">
        <p><strong>Cara Reset Password:</strong></p>
        <p>1. Masukkan kode 6 digit di atas pada halaman reset password</p>
        <p>2. Buat password baru yang aman (minimal 8 karakter)</p>
        <p>3. Konfirmasi password baru Anda</p>
        <p>4. Klik "Reset Password"</p>
      </div>
      
      <div class="warning">
        <strong>⚠️ Penting:</strong> Kode hanya dapat digunakan sekali dan kadaluarsa dalam 15 menit.
      </div>
      
      <div class="security-note">
        <strong>🔒 Catatan Keamanan:</strong> Jika Anda tidak meminta reset password, abaikan email ini dan segera hubungi kami. Akun Anda tetap aman.
      </div>
    </div>
    
    <div class="footer">
      <p><strong>PIXELNEST</strong></p>
      <p>© ${new Date().getFullYear()} PixelNest - AI Automation Platform</p>
    </div>
  </div>
</body>
</html>
      `
    };

    try {
      const response = await sgMail.send(msg);
      console.log('✅ Password reset email sent to:', email);
      console.log('📧 SendGrid Response:', response[0].statusCode);
      return { success: true, statusCode: response[0].statusCode };
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      if (error.response) {
        console.error('   SendGrid Error:', error.response.body);
      }
      throw new Error('Gagal mengirim email reset password. Silakan coba lagi.');
    }
  }

  /**
   * Helper method to get activation email HTML (avoid duplication)
   */
  _getActivationEmailHtml(name, activationCode) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: #000000;
      padding: 40px 30px;
      text-align: center;
      border-bottom: 1px solid #e5e5e5;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 8px 0 0 0;
      font-size: 13px;
      color: #999999;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 20px;
      font-weight: 500;
    }
    .message {
      color: #4b5563;
      margin-bottom: 30px;
      font-size: 15px;
    }
    .code-container {
      background: #f9fafb;
      border: 2px solid #000000;
      border-radius: 8px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    .code-label {
      color: #6b7280;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
    .code {
      font-size: 48px;
      font-weight: 700;
      color: #000000;
      letter-spacing: 8px;
      margin: 10px 0;
      font-family: 'Courier New', monospace;
    }
    .expiry {
      color: #dc2626;
      font-size: 14px;
      margin-top: 15px;
      font-weight: 500;
    }
    .instructions {
      background: #f9fafb;
      border-left: 4px solid #000000;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .instructions p {
      margin: 8px 0;
      color: #4b5563;
      font-size: 14px;
    }
    .instructions strong {
      color: #1f2937;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
      font-size: 14px;
      color: #92400e;
    }
    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 30px 0;
    }
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 5px 0;
      color: #6b7280;
      font-size: 13px;
    }
    .footer strong {
      color: #1f2937;
    }
    .footer a {
      color: #000000;
      text-decoration: none;
      border-bottom: 1px solid #000000;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PIXELNEST</h1>
      <p>AI Automation Platform</p>
    </div>
    
    <div class="content">
      <div class="greeting">
        Halo, <strong>${name}</strong>
      </div>
      
      <div class="message">
        Gunakan kode berikut untuk mengaktifkan akun PixelNest Anda:
      </div>
      
      <div class="code-container">
        <div class="code-label">Kode Aktivasi</div>
        <div class="code">${activationCode}</div>
        <div class="expiry">⏱ Berlaku 15 menit</div>
      </div>
      
      <div class="instructions">
        <p><strong>Cara Aktivasi:</strong></p>
        <p>1. Masukkan kode 6 digit di atas</p>
        <p>2. Klik "Aktivasi Akun"</p>
        <p>3. Selesai! Akun Anda aktif</p>
      </div>
      
      <div class="warning">
        <strong>⚠️ Penting:</strong> Kode hanya dapat digunakan sekali dan kadaluarsa dalam 15 menit.
      </div>
    </div>
    
    <div class="footer">
      <p><strong>PIXELNEST</strong></p>
      <p>© ${new Date().getFullYear()} PixelNest - AI Automation Platform</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Helper method to get welcome email HTML (avoid duplication)
   */
  _getWelcomeEmailHtml(name) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: #000000;
      padding: 40px 30px;
      text-align: center;
      border-bottom: 1px solid #e5e5e5;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 8px 0 0 0;
      font-size: 13px;
      color: #999999;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 20px;
      font-weight: 500;
    }
    .message {
      color: #4b5563;
      margin-bottom: 30px;
      font-size: 15px;
    }
    .features {
      background: #f9fafb;
      border-left: 4px solid #000000;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .features h3 {
      margin: 0 0 16px 0;
      color: #1f2937;
      font-size: 16px;
      font-weight: 600;
    }
    .features ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .features li {
      color: #4b5563;
      font-size: 14px;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .features li:last-child {
      border-bottom: none;
    }
    .features li strong {
      color: #1f2937;
      display: block;
      margin-bottom: 4px;
    }
    .button {
      display: inline-block;
      background: #000000;
      color: #ffffff;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 600;
      margin: 20px 0;
      transition: transform 0.2s;
    }
    .button:hover {
      background: #1a1a1a;
      transform: translateY(-2px);
    }
    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 30px 0;
    }
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 5px 0;
      color: #6b7280;
      font-size: 13px;
    }
    .footer strong {
      color: #1f2937;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PIXELNEST</h1>
      <p>AI Automation Platform</p>
    </div>
    
    <div class="content">
      <div class="greeting">
        Selamat Datang, <strong>${name}!</strong>
      </div>
      
      <div class="message">
        Akun PixelNest Anda telah aktif. Anda sekarang dapat menggunakan semua fitur AI generation kami dan mulai menghasilkan uang melalui program referral!
      </div>
      
      <div class="features">
        <h3>🎨 Fitur AI Generation:</h3>
        <ul>
          <li><strong>AI Image Generation</strong> - Generate gambar dengan berbagai model AI terbaik</li>
          <li><strong>AI Video Creation</strong> - Buat video dengan teknologi AI canggih</li>
          <li><strong>AI Audio Studio</strong> - Text-to-speech dengan berbagai voice dan bahasa</li>
          <li><strong>Multiple AI Models</strong> - Akses berbagai model AI terkini</li>
          <li><strong>Credit Management</strong> - Kelola credit Anda dengan mudah</li>
        </ul>
      </div>
      
      <div class="features" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-left: 4px solid #8b5cf6;">
        <h3 style="color: #ffffff;">💰 Program Referral - Dapatkan Penghasilan!</h3>
        <ul>
          <li style="color: #f3f4f6; border-bottom-color: rgba(255,255,255,0.2);"><strong style="color: #ffffff;">Link Referral Unik</strong> - Bagikan link Anda dan ajak teman bergabung</li>
          <li style="color: #f3f4f6; border-bottom-color: rgba(255,255,255,0.2);"><strong style="color: #ffffff;">Komisi 5% dari Pembelian</strong> - Dapatkan komisi setiap teman Anda melakukan top-up (maksimal 2x pembelian per referral)</li>
          <li style="color: #f3f4f6; border-bottom-color: rgba(255,255,255,0.2);"><strong style="color: #ffffff;">Minimum Payout Rp 25.000</strong> - Cairkan penghasilan Anda dengan mudah</li>
          <li style="color: #f3f4f6; border-bottom: none;"><strong style="color: #ffffff;">Dashboard Tracking</strong> - Pantau penghasilan real-time di halaman referral</li>
        </ul>
      </div>
      
      <center>
        <a href="${process.env.BASE_URL || 'http://localhost:5005'}/dashboard" class="button">
          MULAI SEKARANG
        </a>
      </center>
      
      <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
        <p style="margin: 0; color: #92400e; font-size: 14px;">
          <strong style="color: #78350f;">💡 Tips:</strong> Kunjungi halaman <strong>Referral Dashboard</strong> untuk mendapatkan link referral unik Anda dan mulai menghasilkan uang!
        </p>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>PIXELNEST</strong></p>
      <p>© ${new Date().getFullYear()} PixelNest - AI Automation Platform</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Verify email service configuration
   */
  async verifyConnection() {
    await this.initialize();
    
    if (!this.isConfigured) {
      console.error('❌ SendGrid not configured');
      return false;
    }
    
    try {
      // SendGrid doesn't have a verify method, so we just check if API key is set
      console.log('✅ SendGrid is configured and ready to send messages');
      return true;
    } catch (error) {
      console.error('❌ SendGrid configuration error:', error);
      return false;
    }
  }

  /**
   * Close email service (cleanup - not needed for SendGrid API)
   */
  close() {
    // SendGrid uses REST API, no connections to close
    console.log('📧 SendGrid service cleanup (no action needed)');
  }
}

// Export singleton instance
const emailServiceInstance = new EmailService();
module.exports = emailServiceInstance;

