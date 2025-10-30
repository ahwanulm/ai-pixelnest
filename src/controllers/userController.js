const { pool } = require('../config/database');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const userController = {
  // ============ NOTIFICATIONS ============
  
  // Get user notifications
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      
      // Get notifications for this user only
      // Broadcast notifications are already inserted with user_id for each user
      const query = `
        SELECT 
          id,
          title,
          message,
          type,
          target_users,
          priority,
          action_url,
          expires_at,
          is_read,
          created_at
        FROM notifications 
        WHERE user_id = $1
        AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY 
          is_read ASC,
          CASE priority 
            WHEN 'high' THEN 1
            WHEN 'normal' THEN 2
            WHEN 'low' THEN 3
            ELSE 4
          END,
          created_at DESC
        LIMIT 50
      `;
      
      const result = await pool.query(query, [userId]);
      
      res.json({
        success: true,
        notifications: result.rows,
        unread_count: result.rows.filter(n => !n.is_read).length
      });
    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notifications'
      });
    }
  },
  
  // Mark notification as read
  async markNotificationRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const query = `
        UPDATE notifications 
        SET is_read = true 
        WHERE id = $1 
        AND (user_id = $2 OR target_users = 'all')
        RETURNING *
      `;
      
      const result = await pool.query(query, [id, userId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }
      
      res.json({
        success: true,
        notification: result.rows[0]
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read'
      });
    }
  },
  
  // Mark all notifications as read
  async markAllNotificationsRead(req, res) {
    try {
      const userId = req.user.id;
      
      const query = `
        UPDATE notifications 
        SET is_read = true 
        WHERE (user_id = $1 OR target_users = 'all')
        AND is_read = false
      `;
      
      await pool.query(query, [userId]);
      
      res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notifications as read'
      });
    }
  },
  
  // ============ PROMO CODES ============
  
  // Validate and apply promo code
  async validatePromoCode(req, res) {
    try {
      const { code } = req.body;
      const userId = req.user.id;
      
      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Promo code is required'
        });
      }
      
      // Get promo code
      const promoQuery = `
        SELECT * FROM promo_codes 
        WHERE UPPER(code) = UPPER($1)
        AND is_active = true
        AND (valid_from IS NULL OR valid_from <= NOW())
        AND (valid_until IS NULL OR valid_until >= NOW())
      `;
      
      const promoResult = await pool.query(promoQuery, [code]);
      
      if (promoResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Invalid or expired promo code'
        });
      }
      
      const promo = promoResult.rows[0];
      
      // Check max uses
      if (promo.max_uses && promo.uses_count >= promo.max_uses) {
        return res.status(400).json({
          success: false,
          message: 'This promo code has reached its usage limit'
        });
      }
      
      // Check if user already used this code in ANY way (promo OR claim)
      const anyUsageQuery = `
        SELECT transaction_type, description, created_at 
        FROM credit_transactions 
        WHERE user_id = $1 
        AND (
          description LIKE $2 
          OR description LIKE $3
          OR promo_code_id = $4
        )
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      const anyUsageResult = await pool.query(anyUsageQuery, [
        userId, 
        `%Promo code: ${promo.code}%`,
        `%Claim code: ${promo.code}%`,
        promo.id
      ]);
      
      if (anyUsageResult.rows.length > 0) {
        const prevUsage = anyUsageResult.rows[0];
        const usageType = prevUsage.transaction_type === 'claim_code' ? 'claimed sebagai free credits' : 'used as promo code';
        return res.status(400).json({
          success: false,
          message: `Kode "${promo.code}" sudah pernah ${usageType} sebelumnya. Setiap kode hanya bisa digunakan sekali.`
        });
      }
      
      // Return promo details
      res.json({
        success: true,
        promo: {
          id: promo.id,
          code: promo.code,
          description: promo.description,
          discount_type: promo.discount_type,
          discount_value: promo.discount_value,
          credits_bonus: promo.credits_bonus
        }
      });
    } catch (error) {
      console.error('Error validating promo code:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate promo code'
      });
    }
  },
  
  // Apply promo code (called after payment)
  async applyPromoCode(req, res) {
    try {
      const { code, transaction_id } = req.body;
      const userId = req.user.id;
      
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Get promo code
        const promoQuery = `
          SELECT * FROM promo_codes 
          WHERE UPPER(code) = UPPER($1)
          AND is_active = true
          FOR UPDATE
        `;
        
        const promoResult = await client.query(promoQuery, [code]);
        
        if (promoResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({
            success: false,
            message: 'Promo code not found'
          });
        }
        
        const promo = promoResult.rows[0];
        
        // Check if user already used this code in ANY way (promo OR claim)
        const anyUsageQuery = `
          SELECT transaction_type, description, created_at 
          FROM credit_transactions 
          WHERE user_id = $1 
          AND (
            description LIKE $2 
            OR description LIKE $3
            OR promo_code_id = $4
          )
          ORDER BY created_at DESC
          LIMIT 1
        `;
        
        const anyUsageResult = await client.query(anyUsageQuery, [
          userId, 
          `%Promo code: ${promo.code}%`,
          `%Claim code: ${promo.code}%`,
          promo.id
        ]);
        
        if (anyUsageResult.rows.length > 0) {
          await client.query('ROLLBACK');
          const prevUsage = anyUsageResult.rows[0];
          const usageType = prevUsage.transaction_type === 'claim_code' ? 'claimed sebagai free credits' : 'digunakan sebagai promo code';
          return res.status(400).json({
            success: false,
            message: `Kode "${promo.code}" sudah pernah ${usageType} sebelumnya. Setiap kode hanya bisa digunakan sekali.`
          });
        }
        
        // Increment uses count
        await client.query(
          'UPDATE promo_codes SET uses_count = uses_count + 1 WHERE id = $1',
          [promo.id]
        );
        
        // Add bonus credits if applicable
        if (promo.credits_bonus > 0) {
          // Update user credits
          await client.query(
            'UPDATE users SET credits = credits + $1 WHERE id = $2',
            [promo.credits_bonus, userId]
          );
          
          // Log transaction
          await client.query(
            `INSERT INTO credit_transactions 
            (user_id, amount, transaction_type, description, balance_after, promo_code_id)
            VALUES ($1, $2, 'promo_bonus', $3, (SELECT credits FROM users WHERE id = $1), $4)`,
            [
              userId,
              promo.credits_bonus,
              `Promo code bonus: ${promo.code}`,
              promo.id
            ]
          );
        }
        
        await client.query('COMMIT');
        
        res.json({
          success: true,
          message: 'Promo code applied successfully',
          bonus_credits: promo.credits_bonus
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error applying promo code:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to apply promo code'
      });
    }
  },

  // Claim free credits from claim code
  async claimCredits(req, res) {
    try {
      const { code } = req.body;
      const userId = req.user.id;
      
      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Claim code is required'
        });
      }
      
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Get claim code
        const claimQuery = `
          SELECT * FROM promo_codes 
          WHERE UPPER(code) = UPPER($1)
          AND code_type = 'claim'
          AND is_active = true
          AND (valid_from IS NULL OR valid_from <= NOW())
          AND (valid_until IS NULL OR valid_until >= NOW())
          FOR UPDATE
        `;
        
        const claimResult = await client.query(claimQuery, [code]);
        
        if (claimResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({
            success: false,
            message: 'Invalid or expired claim code'
          });
        }
        
        const claimCode = claimResult.rows[0];
        
        // Check usage limit
        if (claimCode.usage_limit && claimCode.uses_count >= claimCode.usage_limit) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: 'This claim code has reached its usage limit'
          });
        }
        
        // Check if user already used this code in ANY way (claim OR promo)
        const anyUsageQuery = `
          SELECT transaction_type, description, created_at 
          FROM credit_transactions 
          WHERE user_id = $1 
          AND (
            description LIKE $2 
            OR description LIKE $3
          )
          ORDER BY created_at DESC
          LIMIT 1
        `;
        
        const anyUsageResult = await client.query(anyUsageQuery, [
          userId, 
          `%Claim code: ${claimCode.code}%`,
          `%Promo code: ${claimCode.code}%`
        ]);
        
        if (anyUsageResult.rows.length > 0) {
          await client.query('ROLLBACK');
          const prevUsage = anyUsageResult.rows[0];
          const usageType = prevUsage.transaction_type === 'claim_code' ? 'claimed' : 'used as promo code';
          return res.status(400).json({
            success: false,
            message: `Kode "${claimCode.code}" sudah pernah ${usageType} sebelumnya. Setiap kode hanya bisa digunakan sekali.`
          });
        }
        
        // Additional check for single_use constraint (if applicable)
        if (claimCode.single_use) {
          const usageQuery = `
            SELECT * FROM credit_transactions 
            WHERE user_id = $1 
            AND description LIKE $2
            LIMIT 1
          `;
          
          const usageResult = await client.query(usageQuery, [userId, `%Claim code: ${claimCode.code}%`]);
          
          if (usageResult.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
              success: false,
              message: 'You have already claimed this code'
            });
          }
        }
        
        // Add credits to user
        await client.query(
          'UPDATE users SET credits = credits + $1 WHERE id = $2',
          [claimCode.credit_amount, userId]
        );
        
        // Get updated balance
        const balanceResult = await client.query(
          'SELECT credits FROM users WHERE id = $1',
          [userId]
        );
        const newBalance = balanceResult.rows[0].credits;
        
        // Log transaction
        await client.query(
          `INSERT INTO credit_transactions 
          (user_id, amount, transaction_type, description, balance_after)
          VALUES ($1, $2, 'claim_code', $3, $4)`,
          [
            userId,
            claimCode.credit_amount,
            `Claim code: ${claimCode.code} - ${claimCode.description}`,
            newBalance
          ]
        );
        
        // Increment uses count
        await client.query(
          'UPDATE promo_codes SET uses_count = uses_count + 1 WHERE id = $1',
          [claimCode.id]
        );
        
        await client.query('COMMIT');
        
        res.json({
          success: true,
          message: 'Credits claimed successfully!',
          credits_claimed: claimCode.credit_amount,
          new_balance: newBalance,
          description: claimCode.description
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error claiming credits:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to claim credits'
      });
    }
  },

  // ============ PROFILE MANAGEMENT ============
  
  // Update user profile
  async updateProfile(req, res) {
    try {
      const { name, email } = req.body;
      const userId = req.user.id;
      
      if (!name || !email) {
        return res.status(400).json({
          success: false,
          message: 'Name and email are required'
        });
      }
      
      // Check if email is already taken by another user
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );
      
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken'
        });
      }
      
      // Update user profile
      const updateQuery = `
        UPDATE users 
        SET name = $1, email = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING id, name, email
      `;
      
      const result = await pool.query(updateQuery, [name, email, userId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  },
  
  // Change password
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long'
        });
      }
      
      // Get current user password
      const userQuery = await pool.query(
        'SELECT password FROM users WHERE id = $1',
        [userId]
      );
      
      if (userQuery.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      const user = userQuery.rows[0];
      
      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      await pool.query(
        'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
        [hashedPassword, userId]
      );
      
      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password'
      });
    }
  },
  
  // Delete account
  async deleteAccount(req, res) {
    try {
      const { password } = req.body;
      const userId = req.user.id;
      
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required to delete account'
        });
      }
      
      // Get user password
      const userQuery = await pool.query(
        'SELECT password FROM users WHERE id = $1',
        [userId]
      );
      
      if (userQuery.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      const user = userQuery.rows[0];
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Password is incorrect'
        });
      }
      
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Delete user's generation history
        await client.query('DELETE FROM ai_generation_history WHERE user_id = $1', [userId]);
        
        // Delete user's credit transactions
        await client.query('DELETE FROM credit_transactions WHERE user_id = $1', [userId]);
        
        // Delete user's payment transactions
        await client.query('DELETE FROM transactions WHERE user_id = $1', [userId]);
        
        // Delete user's notifications
        await client.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
        
        // Finally, delete the user
        await client.query('DELETE FROM users WHERE id = $1', [userId]);
        
        await client.query('COMMIT');
        
        // Logout user
        req.logout((err) => {
          if (err) {
            console.error('Logout error after account deletion:', err);
          }
        });
        
        res.json({
          success: true,
          message: 'Account deleted successfully'
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete account'
      });
    }
  },

  // ============ AVATAR UPLOAD ============
  
  // Upload avatar
  async uploadAvatar(req, res) {
    try {
      const userId = req.user.id;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }
      
      // Get current user data to delete old avatar if exists
      const userQuery = await pool.query(
        'SELECT avatar_url FROM users WHERE id = $1',
        [userId]
      );
      
      const oldAvatarUrl = userQuery.rows[0]?.avatar_url;
      
      // Delete old avatar file if exists and is not a Google/external URL
      if (oldAvatarUrl && oldAvatarUrl.startsWith('/uploads/users/')) {
        const oldFilePath = path.join(__dirname, '../../public', oldAvatarUrl);
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch (err) {
            console.error('Error deleting old avatar:', err);
          }
        }
      }
      
      // Save new avatar URL to database
      const avatarUrl = `/uploads/users/${req.file.filename}`;
      
      const updateQuery = `
        UPDATE users 
        SET avatar_url = $1
        WHERE id = $2
        RETURNING id, name, email, avatar_url
      `;
      
      const result = await pool.query(updateQuery, [avatarUrl, userId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        avatarUrl: avatarUrl,
        user: result.rows[0]
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      
      // Delete uploaded file if database update fails
      if (req.file) {
        const filePath = path.join(__dirname, '../../public/uploads/users/', req.file.filename);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error('Error deleting uploaded file:', err);
          }
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to upload avatar'
      });
    }
  },
  
  // Delete avatar
  async deleteAvatar(req, res) {
    try {
      const userId = req.user.id;
      
      // Get current user data
      const userQuery = await pool.query(
        'SELECT avatar_url FROM users WHERE id = $1',
        [userId]
      );
      
      const avatarUrl = userQuery.rows[0]?.avatar_url;
      
      // Delete avatar file if exists and is not a Google/external URL
      if (avatarUrl && avatarUrl.startsWith('/uploads/users/')) {
        const filePath = path.join(__dirname, '../../public', avatarUrl);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error('Error deleting avatar file:', err);
          }
        }
      }
      
      // Remove avatar URL from database
      const updateQuery = `
        UPDATE users 
        SET avatar_url = NULL
        WHERE id = $1
        RETURNING id, name, email
      `;
      
      const result = await pool.query(updateQuery, [userId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Avatar removed successfully',
        user: result.rows[0]
      });
    } catch (error) {
      console.error('Error deleting avatar:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete avatar'
      });
    }
  }
};

module.exports = userController;

