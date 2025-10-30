const Referral = require('../models/Referral');

// ========== USER FUNCTIONS ==========

// Get referral dashboard data
exports.getReferralDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get payout settings untuk check is_active
    const settings = await Referral.getPayoutSettings();
    
    // Check if referral system is active
    if (!settings.is_active) {
      return res.render('auth/referral', {
        user: req.user,
        referralCode: null,
        referralLink: null,
        stats: {
          availableForPayout: 0,
          totalReferrals: 0,
          pendingPayout: 0,
          totalPaidOut: 0
        },
        transactions: [],
        referredUsers: [],
        settings,
        payoutRequests: [],
        title: 'Program Referral',
        systemInactive: true
      });
    }
    
    // Get referral code
    const referralCode = await Referral.getReferralCode(userId);
    
    // Get referral stats
    const stats = await Referral.getReferralStats(userId);
    
    // Get recent transactions
    const transactions = await Referral.getReferralTransactions(userId, 10);
    
    // Get referred users
    const referredUsers = await Referral.getReferredUsers(userId, 10);
    
    // Get recent payout requests
    const payoutRequests = await Referral.getUserPayoutRequests(userId, 5);
    
    const referralLink = `${req.protocol}://${req.get('host')}/register?ref=${referralCode}`;
    
    res.render('auth/referral', {
      user: req.user,
      referralCode,
      referralLink,
      stats,
      transactions,
      referredUsers,
      settings,
      payoutRequests,
      title: 'Program Referral',
      systemInactive: false
    });
  } catch (error) {
    console.error('Error getting referral dashboard:', error);
    res.status(500).render('error', { error: 'Gagal memuat dashboard referral' });
  }
};

// Get referral transactions (AJAX)
exports.getReferralTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const transactions = await Referral.getReferralTransactions(userId, limit, offset);
    
    res.json({ success: true, transactions });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat transaksi' });
  }
};

// Get referred users (AJAX)
exports.getReferredUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const users = await Referral.getReferredUsers(userId, limit, offset);
    
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error getting referred users:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat data referral' });
  }
};

// Request payout
exports.requestPayout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, payment_method, payment_details } = req.body;
    
    // Check if referral system is active
    const settings = await Referral.getPayoutSettings();
    if (!settings.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Sistem referral sedang tidak aktif. Silakan hubungi admin.'
      });
    }
    
    // Validate input
    if (!amount || !payment_method || !payment_details) {
      return res.status(400).json({
        success: false,
        message: 'Semua field harus diisi'
      });
    }
    
    const payoutAmount = parseFloat(amount);
    if (isNaN(payoutAmount) || payoutAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Jumlah payout tidak valid'
      });
    }
    
    // Request payout
    const payoutRequest = await Referral.requestPayout(
      userId,
      payoutAmount,
      payment_method,
      payment_details
    );
    
    res.json({
      success: true,
      message: 'Request payout berhasil dikirim',
      data: payoutRequest
    });
  } catch (error) {
    console.error('Error requesting payout:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Gagal request payout'
    });
  }
};

// Get payout history
exports.getPayoutHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    const payouts = await Referral.getUserPayoutRequests(userId, limit, offset);
    
    res.json({ success: true, payouts });
  } catch (error) {
    console.error('Error getting payout history:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat riwayat payout' });
  }
};

// ========== ADMIN FUNCTIONS ==========

// Get admin referral dashboard
exports.getAdminReferralDashboard = async (req, res) => {
  try {
    const stats = await Referral.getAdminReferralStats();
    const settings = await Referral.getPayoutSettings();
    
    // Get pending payout requests count
    const pendingCount = await Referral.countPayoutRequests('pending');
    const processingCount = await Referral.countPayoutRequests('processing');
    
    res.render('admin/referral-dashboard', {
      user: req.user,
      stats,
      settings,
      pendingCount,
      processingCount,
      title: 'Referral Management'
    });
  } catch (error) {
    console.error('Error getting admin referral dashboard:', error);
    res.status(500).render('error', { error: 'Gagal memuat dashboard referral' });
  }
};

// Get payout requests (admin)
exports.getPayoutRequests = async (req, res) => {
  try {
    const status = req.query.status || null;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const payouts = await Referral.getAllPayoutRequests(status, limit, offset);
    const totalCount = await Referral.countPayoutRequests(status);
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      res.json({ success: true, payouts, totalCount });
    } else {
      res.render('admin/payout-requests', {
        user: req.user,
        payouts,
        totalCount,
        currentStatus: status,
        title: 'Payout Requests'
      });
    }
  } catch (error) {
    console.error('Error getting payout requests:', error);
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      res.status(500).json({ success: false, message: 'Gagal memuat payout requests' });
    } else {
      res.status(500).render('error', { error: 'Gagal memuat payout requests' });
    }
  }
};

// Process payout request (approve/reject)
exports.processPayoutRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, admin_notes } = req.body;
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action tidak valid'
      });
    }
    
    const result = await Referral.processPayoutRequest(
      requestId,
      req.user.id,
      action,
      admin_notes || ''
    );
    
    res.json({
      success: true,
      message: action === 'approve' ? 'Payout disetujui' : 'Payout ditolak',
      data: result
    });
  } catch (error) {
    console.error('Error processing payout:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Gagal memproses payout'
    });
  }
};

// Complete payout request (mark as sent)
exports.completePayoutRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { admin_notes } = req.body;
    
    const result = await Referral.completePayoutRequest(
      requestId,
      req.user.id,
      admin_notes || ''
    );
    
    res.json({
      success: true,
      message: 'Payout berhasil diselesaikan',
      data: result
    });
  } catch (error) {
    console.error('Error completing payout:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Gagal menyelesaikan payout'
    });
  }
};

// Get payout settings
exports.getPayoutSettings = async (req, res) => {
  try {
    const settings = await Referral.getPayoutSettings();
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error getting payout settings:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat settings' });
  }
};

// Update payout settings
exports.updatePayoutSettings = async (req, res) => {
  try {
    const {
      minimum_payout,
      payout_cooldown_days,
      commission_rate,
      commission_per_signup,
      commission_per_purchase,
      is_active
    } = req.body;
    
    await Referral.updatePayoutSettings({
      minimum_payout: parseFloat(minimum_payout),
      payout_cooldown_days: parseInt(payout_cooldown_days),
      commission_rate: parseFloat(commission_rate),
      commission_per_signup: parseFloat(commission_per_signup),
      commission_per_purchase: parseFloat(commission_per_purchase),
      is_active: is_active === 'true' || is_active === true
    });
    
    res.json({
      success: true,
      message: 'Settings berhasil diupdate'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Gagal update settings'
    });
  }
};

