const pool = require('../config/database');
const bcrypt = require('bcrypt');

const User = {
  // Find user by Google ID
  async findByGoogleId(googleId) {
    const query = 'SELECT * FROM users WHERE google_id = $1';
    const result = await pool.query(query, [googleId]);
    const user = result.rows[0];
    
    // Parse credits from DECIMAL (string) to number
    if (user && user.credits) {
      user.credits = parseFloat(user.credits);
    }
    if (user && user.referral_earnings) {
      user.referral_earnings = parseFloat(user.referral_earnings);
    }
    
    return user;
  },

  // Find user by ID
  async findById(id) {
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await pool.query(query, [id]);
      const user = result.rows[0];
      
      if (!user) {
        return null;
      }
      
      // Parse credits from DECIMAL (string) to number
      if (user.credits) {
        user.credits = parseFloat(user.credits);
      }
      if (user.referral_earnings) {
        user.referral_earnings = parseFloat(user.referral_earnings);
      }
      
      return user;
    } catch (error) {
      console.error('Error in User.findById:', error.message);
      throw error;
    }
  },

  // Find user by email
  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  },

  // Create new user from Google OAuth
  async createFromGoogle(profile, referralCode = null) {
    // Get default credits settings
    const defaultCredits = await this.getDefaultCredits();
    
    const query = `
      INSERT INTO users (
        google_id, 
        email, 
        name, 
        avatar_url,
        credits,
        is_active,
        created_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
      RETURNING *
    `;
    
    const values = [
      profile.id,
      profile.emails[0].value,
      profile.displayName,
      profile.photos[0]?.value || null,
      defaultCredits,
      true // Google OAuth users are auto-activated
    ];
    
    const result = await pool.query(query, values);
    const newUser = result.rows[0];
    
    // Handle referral code if provided
    if (referralCode) {
      const Referral = require('./Referral');
      try {
        const success = await Referral.setReferredBy(newUser.id, referralCode);
        if (success) {
          console.log(`✅ Referral code ${referralCode} applied to user ${newUser.email} (Google OAuth)`);
        } else {
          console.log(`⚠️ Invalid referral code ${referralCode} for user ${newUser.email}`);
        }
      } catch (referralError) {
        console.error('❌ Error applying referral code:', referralError);
        // Continue registration even if referral fails
      }
    }
    
    return newUser;
  },

  // Create new user with email and password (with activation)
  async createWithPassword(userData) {
    const { name, email, password, phone, province, city, address, activationCode, activationExpiry } = userData;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Get default credits settings
    const defaultCredits = await this.getDefaultCredits();
    
    const query = `
      INSERT INTO users (
        name,
        email, 
        password_hash,
        phone,
        province,
        city,
        address,
        credits,
        is_active,
        activation_code,
        activation_code_expires_at,
        created_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) 
      RETURNING id, name, email, phone, province, city, address, avatar_url, credits, is_active, created_at
    `;
    
    const values = [
      name,
      email,
      hashedPassword,
      phone || null,
      province || null,
      city || null,
      address || null,
      defaultCredits,
      false, // is_active - starts as false, needs activation
      activationCode,
      activationExpiry
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Get default credits from settings
  async getDefaultCredits() {
    try {
      const settingsQuery = await pool.query(`
        SELECT config_key, config_value 
        FROM pricing_config 
        WHERE config_key IN ('give_default_credits', 'default_user_credits')
      `);
      
      let giveCredits = true; // default
      let creditsAmount = 100; // default
      
      settingsQuery.rows.forEach(row => {
        if (row.config_key === 'give_default_credits') {
          giveCredits = parseFloat(row.config_value) === 1;
        } else if (row.config_key === 'default_user_credits') {
          creditsAmount = parseFloat(row.config_value) || 100;
        }
      });
      
      // If admin disabled giving credits, return 0
      if (!giveCredits) {
        console.log('ℹ️ Default credits disabled by admin - new user gets 0 credits');
        return 0;
      }
      
      console.log(`🎁 New user will receive ${creditsAmount} credits (from admin settings)`);
      return creditsAmount;
    } catch (error) {
      console.error('Error getting default credits settings:', error);
      // Fallback to 100 credits if error
      return 100;
    }
  },

  // Verify password
  async verifyPassword(email, password) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    const user = result.rows[0];
    
    if (!user || !user.password_hash) {
      return null;
    }
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return null;
    }
    
    // Parse credits from DECIMAL (string) to number
    if (user.credits) {
      user.credits = parseFloat(user.credits);
    }
    if (user.referral_earnings) {
      user.referral_earnings = parseFloat(user.referral_earnings);
    }
    
    // Don't return password hash
    delete user.password_hash;
    return user;
  },

  // Update user last login
  async updateLastLogin(id) {
    const query = 'UPDATE users SET last_login = NOW() WHERE id = $1';
    await pool.query(query, [id]);
  },

  // Update user profile
  async updateProfile(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    if (updates.name) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.phone !== undefined) {
      fields.push(`phone = $${paramCount++}`);
      values.push(updates.phone);
    }
    if (updates.province !== undefined) {
      fields.push(`province = $${paramCount++}`);
      values.push(updates.province);
    }
    if (updates.city !== undefined) {
      fields.push(`city = $${paramCount++}`);
      values.push(updates.city);
    }
    if (updates.address !== undefined) {
      fields.push(`address = $${paramCount++}`);
      values.push(updates.address);
    }
    if (updates.avatar_url) {
      fields.push(`avatar_url = $${paramCount++}`);
      values.push(updates.avatar_url);
    }
    
    if (fields.length === 0) {
      return null;
    }
    
    values.push(id);
    const query = `
      UPDATE users 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, name, email, phone, province, city, address, avatar_url, created_at, last_login
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Get all users (admin only)
  async findAll() {
    const query = 'SELECT id, email, name, avatar_url, created_at, last_login FROM users ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  },

  // Delete user
  async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Verify activation code
  async verifyActivationCode(email, code) {
    const query = `
      SELECT * FROM users 
      WHERE email = $1 
      AND activation_code = $2 
      AND activation_code_expires_at > NOW()
      AND is_active = FALSE
    `;
    const result = await pool.query(query, [email, code]);
    return result.rows[0];
  },

  // Activate user account
  async activateAccount(userId) {
    const query = `
      UPDATE users 
      SET is_active = TRUE,
          activated_at = NOW(),
          activation_code = NULL,
          activation_code_expires_at = NULL,
          activation_attempts = 0
      WHERE id = $1
      RETURNING id, name, email, is_active, activated_at
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  },

  // Increment activation attempts
  async incrementActivationAttempts(email) {
    const query = `
      UPDATE users 
      SET activation_attempts = activation_attempts + 1
      WHERE email = $1
      RETURNING activation_attempts
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0]?.activation_attempts || 0;
  },

  // Resend activation code
  async updateActivationCode(email, newCode, newExpiry) {
    const query = `
      UPDATE users 
      SET activation_code = $2,
          activation_code_expires_at = $3,
          activation_attempts = 0,
          resend_count = COALESCE(resend_count, 0) + 1,
          last_resend_at = NOW()
      WHERE email = $1
      RETURNING id, email, name, resend_count
    `;
    const result = await pool.query(query, [email, newCode, newExpiry]);
    return result.rows[0];
  },

  // Check resend limit (max 4x, then 24h delay)
  async checkResendLimit(email) {
    const query = `
      SELECT 
        email,
        resend_count,
        last_resend_at,
        resend_locked_until,
        is_active
      FROM users 
      WHERE email = $1
    `;
    const result = await pool.query(query, [email]);
    
    if (result.rows.length === 0) {
      return { allowed: false, reason: 'USER_NOT_FOUND' };
    }
    
    const user = result.rows[0];
    
    // If already active, no need to resend
    if (user.is_active) {
      return { allowed: false, reason: 'ALREADY_ACTIVE' };
    }
    
    // Check if locked (1 day delay)
    if (user.resend_locked_until) {
      const now = new Date();
      const lockedUntil = new Date(user.resend_locked_until);
      
      if (now < lockedUntil) {
        const hoursLeft = Math.ceil((lockedUntil - now) / (1000 * 60 * 60));
        return { 
          allowed: false, 
          reason: 'LOCKED',
          hoursLeft,
          lockedUntil 
        };
      } else {
        // Lock expired, reset count
        await pool.query(`
          UPDATE users 
          SET resend_count = 0, resend_locked_until = NULL 
          WHERE email = $1
        `, [email]);
        return { allowed: true, resendCount: 0 };
      }
    }
    
    // Check if exceeded limit (4x)
    const currentCount = user.resend_count || 0;
    if (currentCount >= 4) {
      // Lock for 24 hours
      const lockedUntil = new Date();
      lockedUntil.setHours(lockedUntil.getHours() + 24);
      
      await pool.query(`
        UPDATE users 
        SET resend_locked_until = $1 
        WHERE email = $2
      `, [lockedUntil, email]);
      
      return { 
        allowed: false, 
        reason: 'LIMIT_EXCEEDED',
        resendCount: currentCount,
        lockedUntil 
      };
    }
    
    // Allowed to resend
    return { 
      allowed: true, 
      resendCount: currentCount,
      remainingAttempts: 4 - currentCount
    };
  },

  // Reset resend count after successful activation
  async resetResendCount(email) {
    const query = `
      UPDATE users 
      SET resend_count = 0,
          last_resend_at = NULL,
          resend_locked_until = NULL
      WHERE email = $1
    `;
    await pool.query(query, [email]);
  },

  // Check if user is active
  async isUserActive(email) {
    const query = 'SELECT is_active FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0]?.is_active || false;
  },

  // Get user activation status
  async getActivationStatus(email) {
    const query = `
      SELECT email, is_active, activation_attempts, 
             activation_code_expires_at,
             CASE 
               WHEN activation_code_expires_at > NOW() THEN true 
               ELSE false 
             END as code_is_valid
      FROM users 
      WHERE email = $1
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0];
  },

  // ========== PASSWORD RESET METHODS ==========

  // Set password reset code
  async setPasswordResetCode(email, resetCode, expiresAt) {
    const query = `
      UPDATE users 
      SET password_reset_code = $2,
          password_reset_expires_at = $3,
          password_reset_attempts = 0
      WHERE email = $1
      RETURNING id, email, name
    `;
    const result = await pool.query(query, [email, resetCode, expiresAt]);
    return result.rows[0];
  },

  // Verify password reset code
  async verifyPasswordResetCode(email, resetCode) {
    const query = `
      SELECT * FROM users 
      WHERE email = $1 
      AND password_reset_code = $2 
      AND password_reset_expires_at > NOW()
      AND is_active = TRUE
    `;
    const result = await pool.query(query, [email, resetCode]);
    return result.rows[0];
  },

  // Reset password with code verification
  async resetPassword(email, resetCode, newPassword) {
    // First verify the reset code
    const user = await this.verifyPasswordResetCode(email, resetCode);
    if (!user) {
      return null;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset code
    const query = `
      UPDATE users 
      SET password_hash = $2,
          password_reset_code = NULL,
          password_reset_expires_at = NULL,
          password_reset_attempts = 0
      WHERE email = $1
      RETURNING id, email, name
    `;
    const result = await pool.query(query, [email, hashedPassword]);
    return result.rows[0];
  },

  // Increment password reset attempts
  async incrementPasswordResetAttempts(email) {
    const query = `
      UPDATE users 
      SET password_reset_attempts = password_reset_attempts + 1
      WHERE email = $1
      RETURNING password_reset_attempts
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0]?.password_reset_attempts || 0;
  },

  // Check if password reset code is valid
  async getPasswordResetStatus(email) {
    const query = `
      SELECT email, password_reset_attempts, 
             password_reset_expires_at,
             CASE 
               WHEN password_reset_expires_at > NOW() THEN true 
               ELSE false 
             END as code_is_valid
      FROM users 
      WHERE email = $1
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }
};

module.exports = User;

