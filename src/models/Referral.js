const { query } = require('../config/database');

class Referral {
  
  // Generate unique referral code
  static async generateReferralCode(userId) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    let isUnique = false;
    
    while (!isUnique) {
      code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      const existing = await query('SELECT id FROM users WHERE referral_code = $1', [code]);
      if (existing.rows.length === 0) {
        isUnique = true;
      }
    }
    
    await query('UPDATE users SET referral_code = $1 WHERE id = $2', [code, userId]);
    return code;
  }
  
  // Get referral code by user ID
  static async getReferralCode(userId) {
    const result = await query('SELECT referral_code FROM users WHERE id = $1', [userId]);
    if (result.rows.length > 0 && result.rows[0].referral_code) {
      return result.rows[0].referral_code;
    }
    // Generate if not exists
    return await this.generateReferralCode(userId);
  }
  
  // Validate and get referrer by referral code
  static async getReferrerByCode(referralCode) {
    const result = await query(
      'SELECT id, name, email FROM users WHERE referral_code = $1',
      [referralCode]
    );
    return result.rows[0] || null;
  }
  
  // Set referred_by when user signs up
  static async setReferredBy(userId, referralCode) {
    const referrer = await this.getReferrerByCode(referralCode);
    if (referrer) {
      await query(
        'UPDATE users SET referred_by = $1 WHERE id = $2',
        [referrer.id, userId]
      );
      
      // NOTE: No signup bonus - earnings only from purchases
      return true;
    }
    return false;
  }
  
  // NOTE: Signup bonus removed - earnings only from purchases
  // Users earn commission ONLY when referred user makes a purchase
  
  // Add commission when referred user makes a purchase
  // LIMIT: Max 2 purchases per referred user
  static async addPurchaseCommission(userId, purchaseAmount) {
    const result = await query('SELECT referred_by FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length > 0 && result.rows[0].referred_by) {
      const referrerId = result.rows[0].referred_by;
      
      // Check how many times this referred user has generated commission
      const commissionCount = await query(
        `SELECT COUNT(*) as count 
         FROM referral_transactions 
         WHERE referred_user_id = $1 AND transaction_type = 'purchase_commission'`,
        [userId]
      );
      
      const purchaseCount = parseInt(commissionCount.rows[0].count);
      
      // LIMIT: Only first 2 purchases are eligible for commission
      if (purchaseCount >= 2) {
        console.log(`❌ Referral commission limit reached for user ${userId} (${purchaseCount}/2 purchases)`);
        return; // Skip commission
      }
      
      const settings = await this.getPayoutSettings();
      const commissionRate = parseFloat(settings.commission_per_purchase) / 100;
      const commissionAmount = purchaseAmount * commissionRate;
      
      // Add to referrer's earnings
      await query(
        'UPDATE users SET referral_earnings = referral_earnings + $1 WHERE id = $2',
        [commissionAmount, referrerId]
      );
      
      // Log transaction
      await query(
        `INSERT INTO referral_transactions 
         (referrer_id, referred_user_id, transaction_type, amount, description, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          referrerId,
          userId,
          'purchase_commission',
          commissionAmount,
          `Komisi pembelian ke-${purchaseCount + 1} (Rp ${purchaseAmount.toLocaleString('id-ID')})`,
          JSON.stringify({ 
            purchase_amount: purchaseAmount,
            purchase_number: purchaseCount + 1,
            max_eligible: 2
          })
        ]
      );
      
      // Send notification to referrer
      const remainingPurchases = 2 - (purchaseCount + 1);
      await this.sendReferralNotification(referrerId, 'purchase', commissionAmount, remainingPurchases);
      
      console.log(`✅ Referral commission awarded: Rp ${commissionAmount.toLocaleString('id-ID')} (Purchase ${purchaseCount + 1}/2)`);
    }
  }
  
  // Get referral statistics for a user
  static async getReferralStats(userId) {
    // Total referrals
    const referralsResult = await query(
      'SELECT COUNT(*) as total_referrals FROM users WHERE referred_by = $1',
      [userId]
    );
    
    // Total earnings
    const earningsResult = await query(
      'SELECT referral_earnings FROM users WHERE id = $1',
      [userId]
    );
    
    // Total transactions
    const transactionsResult = await query(
      'SELECT COUNT(*) as total_transactions, SUM(amount) as total_amount FROM referral_transactions WHERE referrer_id = $1',
      [userId]
    );
    
    // Total paid out
    const payoutsResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total_paid 
       FROM payout_requests 
       WHERE user_id = $1 AND status = 'completed'`,
      [userId]
    );
    
    // Pending payout
    const pendingResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as pending_amount 
       FROM payout_requests 
       WHERE user_id = $1 AND status = 'pending'`,
      [userId]
    );
    
    return {
      totalReferrals: parseInt(referralsResult.rows[0].total_referrals),
      currentEarnings: parseFloat(earningsResult.rows[0]?.referral_earnings || 0),
      totalTransactions: parseInt(transactionsResult.rows[0].total_transactions || 0),
      totalEarned: parseFloat(transactionsResult.rows[0].total_amount || 0),
      totalPaidOut: parseFloat(payoutsResult.rows[0].total_paid || 0),
      pendingPayout: parseFloat(pendingResult.rows[0].pending_amount || 0),
      availableForPayout: parseFloat(earningsResult.rows[0]?.referral_earnings || 0)
    };
  }
  
  // Get referral transactions history
  static async getReferralTransactions(userId, limit = 50, offset = 0) {
    const result = await query(
      `SELECT rt.*, 
              u.name as referred_user_name,
              u.email as referred_user_email
       FROM referral_transactions rt
       JOIN users u ON u.id = rt.referred_user_id
       WHERE rt.referrer_id = $1
       ORDER BY rt.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    return result.rows;
  }
  
  // Get referred users list with purchase count
  static async getReferredUsers(userId, limit = 50, offset = 0) {
    const result = await query(
      `SELECT 
         u.id, 
         u.name, 
         u.email, 
         u.avatar_url, 
         u.created_at,
         COALESCE(COUNT(rt.id), 0) as purchase_count
       FROM users u
       LEFT JOIN referral_transactions rt ON rt.referred_user_id = u.id AND rt.transaction_type = 'purchase_commission'
       WHERE u.referred_by = $1
       GROUP BY u.id, u.name, u.email, u.avatar_url, u.created_at
       ORDER BY u.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    return result.rows.map(row => ({
      ...row,
      purchase_count: parseInt(row.purchase_count),
      is_eligible: parseInt(row.purchase_count) < 2
    }));
  }
  
  // Request payout
  static async requestPayout(userId, amount, paymentMethod, paymentDetails) {
    const settings = await this.getPayoutSettings();
    const user = await query('SELECT referral_earnings FROM users WHERE id = $1', [userId]);
    const currentEarnings = parseFloat(user.rows[0].referral_earnings);
    
    // Validate minimum payout
    if (amount < parseFloat(settings.minimum_payout)) {
      throw new Error(`Minimum payout adalah Rp ${parseFloat(settings.minimum_payout).toLocaleString('id-ID')}`);
    }
    
    // Validate available balance
    if (amount > currentEarnings) {
      throw new Error('Saldo tidak mencukupi');
    }
    
    // Check cooldown period
    const lastPayout = await query(
      `SELECT created_at FROM payout_requests 
       WHERE user_id = $1 AND status IN ('pending', 'completed')
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    
    if (lastPayout.rows.length > 0) {
      const daysSinceLastPayout = Math.floor(
        (Date.now() - new Date(lastPayout.rows[0].created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastPayout < settings.payout_cooldown_days) {
        const daysRemaining = settings.payout_cooldown_days - daysSinceLastPayout;
        throw new Error(`Anda bisa request payout lagi dalam ${daysRemaining} hari`);
      }
    }
    
    // Create payout request
    const result = await query(
      `INSERT INTO payout_requests 
       (user_id, amount, payment_method, payment_details, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, amount, paymentMethod, JSON.stringify(paymentDetails), 'pending']
    );
    
    // Deduct from user's earnings (will be returned if rejected)
    await query(
      'UPDATE users SET referral_earnings = referral_earnings - $1 WHERE id = $2',
      [amount, userId]
    );
    
    // Send notification to user
    await query(
      `INSERT INTO notifications (user_id, title, message, type, priority)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        '🎉 Request Payout Diterima',
        `Request payout sebesar Rp ${amount.toLocaleString('id-ID')} sedang diproses. Kami akan mengirimkan update dalam 1-3 hari kerja.`,
        'payout',
        'high'
      ]
    );
    
    return result.rows[0];
  }
  
  // Get payout requests for user
  static async getUserPayoutRequests(userId, limit = 20, offset = 0) {
    const result = await query(
      `SELECT pr.*, 
              u.name as processed_by_name
       FROM payout_requests pr
       LEFT JOIN users u ON u.id = pr.processed_by
       WHERE pr.user_id = $1
       ORDER BY pr.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    return result.rows;
  }
  
  // ========== ADMIN FUNCTIONS ==========
  
  // Get all payout requests (admin)
  static async getAllPayoutRequests(status = null, limit = 50, offset = 0) {
    let sql = `
      SELECT pr.*, 
             u.name as user_name,
             u.email as user_email,
             u.phone as user_phone,
             admin.name as processed_by_name
      FROM payout_requests pr
      JOIN users u ON u.id = pr.user_id
      LEFT JOIN users admin ON admin.id = pr.processed_by
    `;
    
    const params = [];
    if (status) {
      sql += ' WHERE pr.status = $1';
      params.push(status);
    }
    
    sql += ' ORDER BY pr.created_at DESC';
    params.push(limit, offset);
    sql += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
    
    const result = await query(sql, params);
    return result.rows;
  }
  
  // Count payout requests by status
  static async countPayoutRequests(status = null) {
    let sql = 'SELECT COUNT(*) as total FROM payout_requests';
    const params = [];
    
    if (status) {
      sql += ' WHERE status = $1';
      params.push(status);
    }
    
    const result = await query(sql, params);
    return parseInt(result.rows[0].total);
  }
  
  // Process payout request (approve/reject)
  static async processPayoutRequest(requestId, adminId, action, adminNotes = '') {
    const payoutRequest = await query(
      'SELECT * FROM payout_requests WHERE id = $1',
      [requestId]
    );
    
    if (payoutRequest.rows.length === 0) {
      throw new Error('Payout request tidak ditemukan');
    }
    
    const payout = payoutRequest.rows[0];
    
    if (payout.status !== 'pending') {
      throw new Error('Payout request sudah diproses');
    }
    
    let newStatus = action === 'approve' ? 'processing' : 'rejected';
    let notificationTitle = '';
    let notificationMessage = '';
    let notificationType = 'payout';
    
    if (action === 'approve') {
      notificationTitle = '✅ Payout Disetujui';
      notificationMessage = `Payout sebesar Rp ${payout.amount.toLocaleString('id-ID')} telah disetujui dan sedang diproses. Dana akan dikirim dalam 1-3 hari kerja.`;
    } else {
      // Return money to user if rejected
      await query(
        'UPDATE users SET referral_earnings = referral_earnings + $1 WHERE id = $2',
        [payout.amount, payout.user_id]
      );
      
      notificationTitle = '❌ Payout Ditolak';
      notificationMessage = `Payout sebesar Rp ${payout.amount.toLocaleString('id-ID')} ditolak. ${adminNotes ? 'Alasan: ' + adminNotes : ''} Dana telah dikembalikan ke saldo Anda.`;
      notificationType = 'warning';
    }
    
    // Update payout request
    await query(
      `UPDATE payout_requests 
       SET status = $1, admin_notes = $2, processed_by = $3, processed_at = NOW(), updated_at = NOW()
       WHERE id = $4`,
      [newStatus, adminNotes, adminId, requestId]
    );
    
    // Send notification to user
    await query(
      `INSERT INTO notifications (user_id, title, message, type, priority)
       VALUES ($1, $2, $3, $4, $5)`,
      [payout.user_id, notificationTitle, notificationMessage, notificationType, 'high']
    );
    
    return { success: true, status: newStatus };
  }
  
  // Mark payout as completed (after transfer done)
  static async completePayoutRequest(requestId, adminId, adminNotes = '') {
    const payoutRequest = await query(
      'SELECT * FROM payout_requests WHERE id = $1',
      [requestId]
    );
    
    if (payoutRequest.rows.length === 0) {
      throw new Error('Payout request tidak ditemukan');
    }
    
    const payout = payoutRequest.rows[0];
    
    // Update payout request
    await query(
      `UPDATE payout_requests 
       SET status = 'completed', admin_notes = $1, processed_by = $2, processed_at = NOW(), updated_at = NOW()
       WHERE id = $3`,
      [adminNotes, adminId, requestId]
    );
    
    // Send notification to user
    await query(
      `INSERT INTO notifications (user_id, title, message, type, priority)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        payout.user_id,
        '💰 Payout Selesai',
        `Payout sebesar Rp ${payout.amount.toLocaleString('id-ID')} telah berhasil dikirim ke rekening Anda. Terima kasih!`,
        'success',
        'high'
      ]
    );
    
    return { success: true };
  }
  
  // Get payout settings
  static async getPayoutSettings() {
    const result = await query('SELECT * FROM payout_settings LIMIT 1');
    if (result.rows.length === 0) {
      // Create default if not exists
      await query(`
        INSERT INTO payout_settings (minimum_payout, payout_cooldown_days, commission_rate, commission_per_signup, commission_per_purchase)
        VALUES (50000.00, 7, 10.00, 5000.00, 5.00)
      `);
      return await this.getPayoutSettings();
    }
    return result.rows[0];
  }
  
  // Update payout settings (admin)
  static async updatePayoutSettings(settings) {
    await query(
      `UPDATE payout_settings 
       SET minimum_payout = $1, 
           payout_cooldown_days = $2, 
           commission_rate = $3,
           commission_per_signup = $4,
           commission_per_purchase = $5,
           is_active = $6,
           updated_at = NOW()
       WHERE id = 1`,
      [
        settings.minimum_payout,
        settings.payout_cooldown_days,
        settings.commission_rate,
        settings.commission_per_signup,
        settings.commission_per_purchase,
        settings.is_active
      ]
    );
  }
  
  // Get referral statistics for admin dashboard
  static async getAdminReferralStats() {
    // Total referral earnings paid out
    const totalPaidOut = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payout_requests WHERE status = 'completed'`
    );
    
    // Pending payouts
    const pendingPayouts = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payout_requests WHERE status = 'pending'`
    );
    
    // Total users with referrals
    const activeReferrers = await query(
      `SELECT COUNT(DISTINCT referred_by) as total FROM users WHERE referred_by IS NOT NULL`
    );
    
    // Total referred users
    const totalReferred = await query(
      `SELECT COUNT(*) as total FROM users WHERE referred_by IS NOT NULL`
    );
    
    return {
      totalPaidOut: parseFloat(totalPaidOut.rows[0].total),
      pendingPayouts: parseFloat(pendingPayouts.rows[0].total),
      activeReferrers: parseInt(activeReferrers.rows[0].total),
      totalReferred: parseInt(totalReferred.rows[0].total)
    };
  }
  
  // Send referral notification
  static async sendReferralNotification(userId, type, amount, remainingPurchases = null) {
    let title = '';
    let message = '';
    
    // Only purchase commission now (no signup bonus)
    if (type === 'purchase') {
      title = '💰 Komisi Referral!';
      message = `Anda mendapat komisi Rp ${amount.toLocaleString('id-ID')} dari pembelian user yang Anda referensikan.`;
      
      // Add info about remaining eligible purchases
      if (remainingPurchases !== null) {
        if (remainingPurchases > 0) {
          message += ` Tersisa ${remainingPurchases}x pembelian lagi yang eligible untuk komisi.`;
        } else {
          message += ` User ini sudah mencapai limit 2x pembelian untuk komisi referral.`;
        }
      }
    } else {
      return; // Skip other notification types
    }
    
    await query(
      `INSERT INTO notifications (user_id, title, message, type, priority)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, title, message, 'referral', 'medium']
    );
  }
}

module.exports = Referral;

