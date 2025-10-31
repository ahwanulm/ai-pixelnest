const User = require('../models/User');
const Referral = require('../models/Referral');
const emailService = require('../services/emailService');
const pool = require('../config/database');

// Show login page
exports.showLogin = (req, res) => {
  res.render('auth/login', {
    title: 'Login - PixelNest',
    error: req.query.error || null,
    success: req.query.success || null,
    referralCode: req.query.ref || null
  });
};

// Show register page with referral code (for direct links)
exports.showRegister = (req, res) => {
  const referralCode = req.query.ref || '';
  
  // Redirect to login with referral code preserved
  // Users will enter their email and be directed to register page
  if (referralCode) {
    return res.redirect(`/login?ref=${referralCode}`);
  }
  
  // If no referral code, just redirect to login
  res.redirect('/login');
};

// Check email and route to password or register
exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const referralCode = req.query.ref || req.body.referralCode || '';
    
    if (!email) {
      return res.redirect('/login?error=' + encodeURIComponent('Email is required'));
    }
    
    // Validate Gmail only for new registrations
    const isGmail = email.toLowerCase().endsWith('@gmail.com');
    
    // Check if user exists
    const user = await User.findByEmail(email);
    
    if (user) {
      // Check if user is active
      if (!user.is_active) {
        // User registered but not activated - resend activation
        console.log(`✅ Rendering verification page (checkEmail) for email: ${email}`); // DEBUG
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        return res.render('auth/verify-activation-compact', {
          title: 'Aktivasi Akun - PixelNest',
          email: email,
          message: 'Akun Anda belum diaktivasi. Silakan cek email atau kirim ulang kode aktivasi.',
          error: null
        });
      }
      
      // User exists and active - show password page
      res.render('auth/password', {
        title: 'Enter Password - PixelNest',
        email: email,
        error: null
      });
    } else {
      // User doesn't exist - validate Gmail for registration
      if (!isGmail) {
        return res.redirect('/login?error=' + encodeURIComponent('Hanya email Gmail yang dapat digunakan untuk registrasi'));
      }
      
      // Show register page
      res.render('auth/register', {
        title: 'Create Account - PixelNest',
        email: email,
        referralCode: referralCode,
        error: null
      });
    }
  } catch (error) {
    console.error('Check email error:', error);
    res.redirect('/login?error=' + encodeURIComponent('An error occurred. Please try again.'));
  }
};

// Handle password login
exports.loginWithPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.render('auth/password', {
        title: 'Enter Password - PixelNest',
        email: email || '',
        error: 'Email and password are required'
      });
    }
    
    // Check if user is active
    const user = await User.findByEmail(email);
    if (user && !user.is_active) {
      console.log(`✅ Rendering verification page (loginWithPassword) for email: ${email}`); // DEBUG
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      return res.render('auth/verify-activation', {
        title: 'Aktivasi Akun - PixelNest',
        email: email,
        message: 'Akun Anda belum diaktivasi. Silakan verifikasi email Anda terlebih dahulu.',
        error: null
      });
    }
    
    // Verify credentials
    const verifiedUser = await User.verifyPassword(email, password);
    
    if (!verifiedUser) {
      return res.render('auth/password', {
        title: 'Enter Password - PixelNest',
        email: email,
        error: 'Password tidak valid. Silakan coba lagi.'
      });
    }
    
    // Update last login
    await User.updateLastLogin(verifiedUser.id);
    
    // Create session
    req.login(verifiedUser, (err) => {
      if (err) {
        console.error('Login error:', err);
        return res.redirect('/login?error=' + encodeURIComponent('An error occurred during login'));
      }
      res.redirect('/dashboard');
    });
  } catch (error) {
    console.error('Login error:', error);
    res.render('auth/password', {
      title: 'Enter Password - PixelNest',
      email: req.body.email || '',
      error: 'An error occurred. Please try again.'
    });
  }
};

// Handle registration
exports.register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone, province, city, address, terms, referralCode } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.render('auth/register', {
        title: 'Create Account - PixelNest',
        email: email || '',
        referralCode: referralCode || '',
        error: 'Nama, email, dan password wajib diisi'
      });
    }
    
    // Validate Gmail only
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      return res.render('auth/register', {
        title: 'Create Account - PixelNest',
        email: email || '',
        referralCode: referralCode || '',
        error: 'Hanya email Gmail yang dapat digunakan untuk registrasi'
      });
    }
    
    // Validate password match
    if (password !== confirmPassword) {
      return res.render('auth/register', {
        title: 'Create Account - PixelNest',
        email: email || '',
        referralCode: referralCode || '',
        error: 'Password tidak cocok'
      });
    }
    
    // Validate password length
    if (password.length < 8) {
      return res.render('auth/register', {
        title: 'Create Account - PixelNest',
        email: email || '',
        referralCode: referralCode || '',
        error: 'Password minimal 8 karakter'
      });
    }
    
    // Check terms agreement
    if (!terms) {
      return res.render('auth/register', {
        title: 'Create Account - PixelNest',
        email: email || '',
        referralCode: referralCode || '',
        error: 'Anda harus menyetujui Terms of Service dan Privacy Policy'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.render('auth/register', {
        title: 'Create Account - PixelNest',
        email: email || '',
        referralCode: referralCode || '',
        error: 'Email sudah terdaftar. Silakan login.'
      });
    }
    
    // Generate activation code (6 digits)
    const activationCode = emailService.generateActivationCode();
    const activationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    // Create new user with activation code
    const newUser = await User.createWithPassword({
      name,
      email,
      password,
      phone,
      province,
      city,
      address,
      activationCode,
      activationExpiry
    });
    
    // Send activation email (NON-BLOCKING for faster response)
    try {
      // ✅ Use async method - don't wait for email to be sent
      emailService.sendActivationCodeAsync(email, name, activationCode);
      console.log(`📨 Activation email queued for ${email} with code: ${activationCode}`);
    } catch (emailError) {
      console.error('Failed to queue activation email:', emailError);
      // Don't fail registration if email fails
    }
    
    // Handle referral code if provided
    if (referralCode) {
      try {
        const success = await Referral.setReferredBy(newUser.id, referralCode);
        if (success) {
          console.log(`✅ Referral code ${referralCode} applied to user ${email} (Email/Password)`);
        } else {
          console.log(`⚠️ Invalid referral code ${referralCode} for user ${email}`);
        }
      } catch (referralError) {
        console.error('❌ Error applying referral code:', referralError);
        // Continue registration even if referral fails
      }
    }
    
    // Redirect to verification page (don't auto-login yet)
    console.log(`✅ Rendering verification page for email: ${email}`); // DEBUG
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.render('auth/verify-activation', {
      title: 'Verifikasi Email - PixelNest',
      email: email,
      message: `Kode aktivasi telah dikirim ke ${email}. Silakan cek inbox atau spam folder Anda.`,
      error: null
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.render('auth/register', {
      title: 'Create Account - PixelNest',
      email: req.body.email || '',
      referralCode: req.body.referralCode || '',
      error: 'Terjadi kesalahan saat registrasi. Silakan coba lagi.'
    });
  }
};

// Show dashboard
exports.showDashboard = (req, res) => {
  res.render('auth/dashboard', {
    title: 'Dashboard - PixelNest',
    user: req.user || {},
    creditsRemaining: 3
  });
};

// Profile Page
exports.showProfile = (req, res) => {
  res.render('auth/profile', {
    title: 'My Profile - PixelNest',
    user: req.user || {}
  });
};

// Tutorial Page
exports.showTutorial = (req, res) => {
  res.render('auth/tutorial', {
    title: 'Tutorial - PixelNest AI Video Studio',
    user: req.user || {}
  });
};

// Audio Studio Page - DEPRECATED: Audio now integrated in dashboard.ejs
// exports.showAudioStudio = (req, res) => {
//   res.render('auth/audio', {
//     title: 'Audio Studio - PixelNest AI',
//     user: req.user || {}
//   });
// };

// Usage Statistics Page
exports.showUsage = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get overall statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_generations,
        COALESCE(SUM(cost_credits), 0) as credits_used,
        COUNT(CASE WHEN type = 'image' THEN 1 END) as images_created,
        COUNT(CASE WHEN type = 'video' THEN 1 END) as videos_created
      FROM ai_generation_history
      WHERE user_id = $1
    `;
    
    const statsResult = await pool.query(statsQuery, [userId]);
    const stats = {
      totalGenerations: parseInt(statsResult.rows[0].total_generations) || 0,
      creditsUsed: parseFloat(statsResult.rows[0].credits_used) || 0,
      imagesCreated: parseInt(statsResult.rows[0].images_created) || 0,
      videosCreated: parseInt(statsResult.rows[0].videos_created) || 0
    };
    
    // Get usage by model
    const modelUsageQuery = `
      SELECT 
        model_name,
        COUNT(*) as count,
        COALESCE(SUM(cost_credits), 0) as total_cost
      FROM ai_generation_history
      WHERE user_id = $1
      GROUP BY model_name
      ORDER BY count DESC
      LIMIT 10
    `;
    
    const modelUsageResult = await pool.query(modelUsageQuery, [userId]);
    const modelUsage = modelUsageResult.rows.map(row => ({
      model_name: row.model_name,
      count: parseInt(row.count),
      total_cost: parseFloat(row.total_cost)
    }));
    
    // Get recent activity
    const recentActivityQuery = `
      SELECT 
        id,
        type,
        generation_type,
        model_name,
        cost_credits,
        status,
        created_at
      FROM ai_generation_history
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `;
    
    const recentActivityResult = await pool.query(recentActivityQuery, [userId]);
    const recentActivity = recentActivityResult.rows.map(row => ({
      ...row,
      cost_credits: parseFloat(row.cost_credits) || 0
    }));
    
    res.render('auth/usage', {
      title: 'Usage Statistics - PixelNest',
      user: req.user || {},
      stats,
      modelUsage,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching usage statistics:', error);
    res.render('auth/usage', {
      title: 'Usage Statistics - PixelNest',
      user: req.user || {},
      stats: {
        totalGenerations: 0,
        creditsUsed: 0,
        imagesCreated: 0,
        videosCreated: 0
      },
      modelUsage: [],
      recentActivity: []
    });
  }
};

// Verify activation code
exports.verifyActivation = async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.render('auth/verify-activation', {
        title: 'Verifikasi Email - PixelNest',
        email: email || '',
        message: null,
        error: 'Email dan kode aktivasi wajib diisi'
      });
    }
    
    // Check attempts
    const status = await User.getActivationStatus(email);
    if (status && status.activation_attempts >= 5) {
      return res.render('auth/verify-activation', {
        title: 'Verifikasi Email - PixelNest',
        email: email,
        message: null,
        error: 'Terlalu banyak percobaan gagal. Silakan minta kode baru.'
      });
    }
    
    // Verify activation code
    const user = await User.verifyActivationCode(email, code.trim());
    
    if (!user) {
      // Increment failed attempts
      await User.incrementActivationAttempts(email);
      
      return res.render('auth/verify-activation', {
        title: 'Verifikasi Email - PixelNest',
        email: email,
        message: null,
        error: 'Kode aktivasi tidak valid atau sudah kadaluarsa. Silakan coba lagi atau minta kode baru.'
      });
    }
    
    // Activate the account
    await User.activateAccount(user.id);
    
    // Send welcome email (NON-BLOCKING)
    try {
      // ✅ Use async method if available, fallback to sync
      if (emailService.sendWelcomeEmailAsync) {
        emailService.sendWelcomeEmailAsync(user.email, user.name);
      } else {
        await emailService.sendWelcomeEmail(user.email, user.name);
      }
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }
    
    // Auto login after activation
    req.login(user, (err) => {
      if (err) {
        console.error('Auto-login after activation error:', err);
        return res.redirect('/login?success=' + encodeURIComponent('Akun berhasil diaktivasi! Silakan login.'));
      }
      res.redirect('/dashboard?welcome=true');
    });
    
  } catch (error) {
    console.error('Activation verification error:', error);
    res.render('auth/verify-activation', {
      title: 'Verifikasi Email - PixelNest',
      email: req.body.email || '',
      message: null,
      error: 'Terjadi kesalahan. Silakan coba lagi.'
    });
  }
};

// Resend activation code
exports.resendActivationCode = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email wajib diisi' 
      });
    }
    
    // Check resend limit FIRST
    const limitCheck = await User.checkResendLimit(email);
    
    if (!limitCheck.allowed) {
      if (limitCheck.reason === 'USER_NOT_FOUND') {
        return res.status(404).json({ 
          success: false, 
          message: 'Email tidak ditemukan' 
        });
      }
      
      if (limitCheck.reason === 'ALREADY_ACTIVE') {
        return res.status(400).json({ 
          success: false, 
          message: 'Akun sudah aktif. Silakan login.' 
        });
      }
      
      if (limitCheck.reason === 'LOCKED') {
        return res.status(429).json({ 
          success: false, 
          locked: true,
          message: `Anda telah mencapai batas maksimal kirim ulang kode (4x). Silakan coba lagi dalam ${limitCheck.hoursLeft} jam atau gunakan opsi ganti email.`,
          hoursLeft: limitCheck.hoursLeft,
          lockedUntil: limitCheck.lockedUntil
        });
      }
      
      if (limitCheck.reason === 'LIMIT_EXCEEDED') {
        return res.status(429).json({ 
          success: false, 
          locked: true,
          message: 'Anda telah mencapai batas maksimal kirim ulang kode (4x). Silakan coba lagi dalam 24 jam atau gunakan opsi ganti email.',
          hoursLeft: 24,
          lockedUntil: limitCheck.lockedUntil
        });
      }
    }
    
    // Find user
    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Email tidak ditemukan' 
      });
    }
    
    // Generate new activation code
    const newActivationCode = emailService.generateActivationCode();
    const newExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    // Update activation code (akan increment resend_count)
    const updated = await User.updateActivationCode(email, newActivationCode, newExpiry);
    
    // Send new activation email (use async for better performance and timeout handling)
    emailService.sendActivationCodeAsync(email, user.name, newActivationCode);
    
    const remainingAttempts = 4 - (updated.resend_count || 0);
    console.log(`✅ Resent activation code to ${email}: ${newActivationCode} (Resend count: ${updated.resend_count}, Remaining: ${remainingAttempts})`);
    
    res.json({ 
      success: true, 
      message: `Kode aktivasi baru telah dikirim ke email Anda. ${remainingAttempts > 0 ? `Sisa kesempatan kirim ulang: ${remainingAttempts}x` : 'Ini adalah kirim ulang terakhir Anda.'}`,
      resendCount: updated.resend_count,
      remainingAttempts,
      note: 'Email sedang dikirim. Harap tunggu beberapa saat.'
    });
    
  } catch (error) {
    console.error('Resend activation code error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal mengirim kode aktivasi. Silakan coba lagi.' 
    });
  }
};

// Logout
exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
      res.redirect('/');
    });
  });
};

// ========== FORGOT PASSWORD FUNCTIONALITY ==========

// Show forgot password page
exports.showForgotPassword = (req, res) => {
  res.render('auth/forgot-password', {
    title: 'Lupa Password - PixelNest',
    error: req.query.error || null,
    success: req.query.success || null,
    email: req.query.email || ''
  });
};

// Handle forgot password request
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.render('auth/forgot-password', {
        title: 'Lupa Password - PixelNest',
        error: 'Email wajib diisi',
        success: null,
        email: ''
      });
    }
    
    // Check if user exists and is active
    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.render('auth/forgot-password', {
        title: 'Lupa Password - PixelNest',
        error: 'Email tidak terdaftar',
        success: null,
        email: email
      });
    }
    
    if (!user.is_active) {
      return res.render('auth/forgot-password', {
        title: 'Lupa Password - PixelNest',
        error: 'Akun Anda belum diaktivasi. Silakan aktivasi akun terlebih dahulu.',
        success: null,
        email: email
      });
    }
    
    // Check if user has password (not Google-only account)
    if (!user.password_hash) {
      return res.render('auth/forgot-password', {
        title: 'Lupa Password - PixelNest',
        error: 'Akun Anda terdaftar melalui Google. Silakan login dengan Google.',
        success: null,
        email: email
      });
    }
    
    // Generate reset code (6 digits)
    const resetCode = emailService.generateActivationCode();
    const resetExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    // Save reset code to database
    await User.setPasswordResetCode(email, resetCode, resetExpiry);
    
    // Send reset code email
    try {
      await emailService.sendPasswordResetCode(email, user.name, resetCode);
      console.log(`✅ Password reset email sent to ${email} with code: ${resetCode}`);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      return res.render('auth/forgot-password', {
        title: 'Lupa Password - PixelNest',
        error: 'Gagal mengirim email. Silakan coba lagi.',
        success: null,
        email: email
      });
    }
    
    // Redirect to reset password page
    res.render('auth/reset-password', {
      title: 'Reset Password - PixelNest',
      email: email,
      message: `Kode reset password telah dikirim ke ${email}. Silakan cek inbox atau spam folder Anda.`,
      error: null
    });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.render('auth/forgot-password', {
      title: 'Lupa Password - PixelNest',
      error: 'Terjadi kesalahan. Silakan coba lagi.',
      success: null,
      email: req.body.email || ''
    });
  }
};

// Show reset password page
exports.showResetPassword = (req, res) => {
  const email = req.query.email || '';
  
  if (!email) {
    return res.redirect('/forgot-password?error=' + encodeURIComponent('Email tidak valid'));
  }
  
  res.render('auth/reset-password', {
    title: 'Reset Password - PixelNest',
    email: email,
    message: null,
    error: null
  });
};

// Handle reset password
exports.resetPassword = async (req, res) => {
  try {
    const { email, resetCode, newPassword, confirmPassword } = req.body;
    
    if (!email || !resetCode || !newPassword || !confirmPassword) {
      return res.render('auth/reset-password', {
        title: 'Reset Password - PixelNest',
        email: email || '',
        message: null,
        error: 'Semua field wajib diisi'
      });
    }
    
    // Validate password match
    if (newPassword !== confirmPassword) {
      return res.render('auth/reset-password', {
        title: 'Reset Password - PixelNest',
        email: email,
        message: null,
        error: 'Password tidak cocok'
      });
    }
    
    // Validate password length
    if (newPassword.length < 8) {
      return res.render('auth/reset-password', {
        title: 'Reset Password - PixelNest',
        email: email,
        message: null,
        error: 'Password minimal 8 karakter'
      });
    }
    
    // Check reset attempts
    const status = await User.getPasswordResetStatus(email);
    if (status && status.password_reset_attempts >= 5) {
      return res.render('auth/reset-password', {
        title: 'Reset Password - PixelNest',
        email: email,
        message: null,
        error: 'Terlalu banyak percobaan gagal. Silakan minta kode baru.'
      });
    }
    
    // Reset password
    const user = await User.resetPassword(email, resetCode.trim(), newPassword);
    
    if (!user) {
      // Increment failed attempts
      await User.incrementPasswordResetAttempts(email);
      
      return res.render('auth/reset-password', {
        title: 'Reset Password - PixelNest',
        email: email,
        message: null,
        error: 'Kode reset tidak valid atau sudah kadaluarsa. Silakan coba lagi atau minta kode baru.'
      });
    }
    
    // Success - redirect to login
    res.redirect('/login?success=' + encodeURIComponent('Password berhasil direset! Silakan login dengan password baru Anda.'));
    
  } catch (error) {
    console.error('Reset password error:', error);
    res.render('auth/reset-password', {
      title: 'Reset Password - PixelNest',
      email: req.body.email || '',
      message: null,
      error: 'Terjadi kesalahan. Silakan coba lagi.'
    });
  }
};

// Resend password reset code
exports.resendResetCode = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email wajib diisi' 
      });
    }
    
    // Find user
    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Email tidak ditemukan' 
      });
    }
    
    if (!user.is_active) {
      return res.status(400).json({ 
        success: false, 
        message: 'Akun belum diaktivasi' 
      });
    }
    
    // Generate new reset code
    const newResetCode = emailService.generateActivationCode();
    const newExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    // Update reset code
    await User.setPasswordResetCode(email, newResetCode, newExpiry);
    
    // Send new reset email
    await emailService.sendPasswordResetCode(email, user.name, newResetCode);
    
    console.log(`✅ Resent password reset code to ${email}: ${newResetCode}`);
    
    res.json({ 
      success: true, 
      message: 'Kode reset baru telah dikirim ke email Anda.'
    });
    
  } catch (error) {
    console.error('Resend reset code error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal mengirim kode reset. Silakan coba lagi.' 
    });
  }
};

