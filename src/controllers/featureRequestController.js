const FeatureRequest = require('../models/FeatureRequest');

// ========================================
// USER ENDPOINTS
// ========================================

/**
 * Get feature request page (user view)
 */
exports.getRequestPage = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's requests
    const userRequests = await FeatureRequest.findByUserId(userId);
    
    // Check rate limit status
    const rateLimit = await FeatureRequest.checkRateLimit(userId);
    
    res.render('auth/feature-request', {
      title: 'Request AI Model atau Fitur',
      user: req.user,
      isAuthenticated: true,
      isAdmin: req.user.is_admin,
      currentPath: '/feature-request',
      requests: userRequests,
      rateLimit
    });
  } catch (error) {
    console.error('Error loading feature request page:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Terjadi kesalahan saat memuat halaman',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

/**
 * Create new feature request
 * POST /api/feature-request/create
 */
exports.createRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { request_type, title, description, use_case } = req.body;
    
    // Validate input
    if (!request_type || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi'
      });
    }
    
    // Validate request type
    if (!['ai_model', 'feature', 'bug', 'other'].includes(request_type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipe request tidak valid'
      });
    }
    
    // Validate length
    if (title.length < 5 || title.length > 255) {
      return res.status(400).json({
        success: false,
        message: 'Judul harus 5-255 karakter'
      });
    }
    
    if (description.length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Deskripsi minimal 20 karakter'
      });
    }
    
    // Check rate limit
    const rateLimit = await FeatureRequest.checkRateLimit(userId);
    
    if (!rateLimit.allowed) {
      const resetDate = new Date(rateLimit.resetTime);
      const hoursRemaining = Math.ceil((resetDate - new Date()) / (1000 * 60 * 60));
      
      return res.status(429).json({
        success: false,
        message: `Anda sudah mencapai batas maksimal request (5 per 24 jam). Coba lagi dalam ${hoursRemaining} jam.`,
        rateLimit: {
          limit: 5,
          current: rateLimit.count,
          resetTime: rateLimit.resetTime
        }
      });
    }
    
    // Create request
    const newRequest = await FeatureRequest.create({
      user_id: userId,
      request_type,
      title: title.trim(),
      description: description.trim(),
      use_case: use_case ? use_case.trim() : null
    });
    
    // Increment rate limit
    await FeatureRequest.incrementRateLimit(userId);
    
    // Get updated rate limit
    const updatedRateLimit = await FeatureRequest.checkRateLimit(userId);
    
    res.json({
      success: true,
      message: 'Request berhasil dibuat! Tim kami akan segera meninjau request Anda.',
      request: newRequest,
      rateLimit: updatedRateLimit
    });
    
  } catch (error) {
    console.error('Error creating feature request:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat request'
    });
  }
};

/**
 * Get user's requests
 * GET /api/feature-request/my-requests
 */
exports.getMyRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const requests = await FeatureRequest.findByUserId(userId);
    
    res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('Error fetching user requests:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data'
    });
  }
};

/**
 * Check rate limit status
 * GET /api/feature-request/rate-limit
 */
exports.checkRateLimit = async (req, res) => {
  try {
    const userId = req.user.id;
    const rateLimit = await FeatureRequest.checkRateLimit(userId);
    
    res.json({
      success: true,
      rateLimit
    });
  } catch (error) {
    console.error('Error checking rate limit:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memeriksa rate limit'
    });
  }
};

// ========================================
// ADMIN ENDPOINTS
// ========================================

/**
 * Get admin feature requests page
 * GET /admin/feature-requests
 */
exports.getAdminPage = async (req, res) => {
  try {
    const { status, type, page = 1 } = req.query;
    const limit = 20;
    const offset = (page - 1) * limit;
    
    const filters = {
      limit,
      offset
    };
    
    if (status) filters.status = status;
    if (type) filters.request_type = type;
    
    const { requests, total } = await FeatureRequest.findAll(filters);
    const stats = await FeatureRequest.getStats();
    
    const totalPages = Math.ceil(total / limit);
    
    res.render('admin/feature-requests', {
      title: 'Feature Requests Management',
      user: req.user,
      isAuthenticated: true,
      isAdmin: true,
      requests,
      stats,
      filters: { status, type },
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Error loading admin feature requests page:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Terjadi kesalahan saat memuat halaman',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

/**
 * Get all requests (API)
 * GET /admin/api/feature-requests
 */
exports.getAllRequests = async (req, res) => {
  try {
    const { status, type, limit = 50, offset = 0 } = req.query;
    
    const filters = {
      limit: parseInt(limit),
      offset: parseInt(offset)
    };
    
    if (status) filters.status = status;
    if (type) filters.request_type = type;
    
    const result = await FeatureRequest.findAll(filters);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error fetching feature requests:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data'
    });
  }
};

/**
 * Get request by ID
 * GET /admin/api/feature-requests/:id
 */
exports.getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await FeatureRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      request
    });
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data'
    });
  }
};

/**
 * Update request status
 * PUT /admin/api/feature-requests/:id
 */
exports.updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, admin_response } = req.body;
    const adminId = req.user.id;
    
    // Validate status
    if (status && !['pending', 'under_review', 'approved', 'rejected', 'implemented'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid'
      });
    }
    
    // Validate priority
    if (priority && !['low', 'normal', 'high', 'urgent'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Priority tidak valid'
      });
    }
    
    const updates = {
      admin_id: adminId
    };
    
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (admin_response !== undefined) updates.admin_response = admin_response;
    
    const updatedRequest = await FeatureRequest.updateStatus(id, updates);
    
    if (!updatedRequest) {
      return res.status(404).json({
        success: false,
        message: 'Request tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      message: 'Request berhasil diupdate',
      request: updatedRequest
    });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengupdate request'
    });
  }
};

/**
 * Delete request
 * DELETE /admin/api/feature-requests/:id
 */
exports.deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedRequest = await FeatureRequest.delete(id);
    
    if (!deletedRequest) {
      return res.status(404).json({
        success: false,
        message: 'Request tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      message: 'Request berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus request'
    });
  }
};

/**
 * Get statistics
 * GET /admin/api/feature-requests/stats
 */
exports.getStats = async (req, res) => {
  try {
    const stats = await FeatureRequest.getStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil statistik'
    });
  }
};

/**
 * Give reward to user for accepted request
 * POST /admin/api/feature-requests/:id/reward
 */
exports.giveReward = async (req, res) => {
  try {
    const { id } = req.params;
    const { reward_amount } = req.body;
    
    // Validate reward amount
    if (!reward_amount || reward_amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Reward amount harus lebih dari 0'
      });
    }
    
    // Give reward
    const updatedRequest = await FeatureRequest.giveReward(id, reward_amount);
    
    res.json({
      success: true,
      message: `Reward ${reward_amount} credits berhasil diberikan!`,
      request: updatedRequest
    });
  } catch (error) {
    console.error('Error giving reward:', error);
    
    if (error.message === 'Request not found') {
      return res.status(404).json({
        success: false,
        message: 'Request tidak ditemukan'
      });
    }
    
    if (error.message === 'Reward already given') {
      return res.status(400).json({
        success: false,
        message: 'Reward sudah pernah diberikan'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memberikan reward'
    });
  }
};

