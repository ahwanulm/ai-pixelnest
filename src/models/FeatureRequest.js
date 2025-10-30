const { pool } = require('../config/database');

const FeatureRequest = {
  /**
   * Create new feature request
   * @param {Object} requestData - { user_id, request_type, title, description, use_case }
   * @returns {Object} Created request
   */
  async create(requestData) {
    const { user_id, request_type, title, description, use_case } = requestData;
    
    const query = `
      INSERT INTO feature_requests 
        (user_id, request_type, title, description, use_case, status, reward_amount, created_at)
      VALUES ($1, $2, $3, $4, $5, 'pending', 0, NOW())
      RETURNING *
    `;
    
    const values = [user_id, request_type, title, description, use_case || null];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  /**
   * Check rate limit for user
   * Rate limit: Max 5 requests per 24 hours
   * @param {Number} userId
   * @returns {Object} { allowed: boolean, count: number, resetTime: Date }
   */
  async checkRateLimit(userId) {
    const MAX_REQUESTS_PER_DAY = 5;
    const WINDOW_HOURS = 24;
    
    // Get or create rate limit record
    const checkQuery = `
      SELECT 
        request_count,
        window_start,
        last_request_at,
        (window_start + INTERVAL '${WINDOW_HOURS} hours') as window_end,
        CASE 
          WHEN window_start + INTERVAL '${WINDOW_HOURS} hours' < NOW() THEN true
          ELSE false
        END as window_expired
      FROM feature_request_rate_limits
      WHERE user_id = $1
    `;
    
    const result = await pool.query(checkQuery, [userId]);
    
    // No record exists - first request
    if (result.rows.length === 0) {
      return { 
        allowed: true, 
        count: 0, 
        remaining: MAX_REQUESTS_PER_DAY,
        resetTime: new Date(Date.now() + WINDOW_HOURS * 60 * 60 * 1000)
      };
    }
    
    const record = result.rows[0];
    
    // Window expired - reset counter
    if (record.window_expired) {
      await pool.query(`
        UPDATE feature_request_rate_limits
        SET request_count = 0,
            window_start = NOW()
        WHERE user_id = $1
      `, [userId]);
      
      return { 
        allowed: true, 
        count: 0, 
        remaining: MAX_REQUESTS_PER_DAY,
        resetTime: new Date(Date.now() + WINDOW_HOURS * 60 * 60 * 1000)
      };
    }
    
    // Check if under limit
    const allowed = record.request_count < MAX_REQUESTS_PER_DAY;
    const remaining = MAX_REQUESTS_PER_DAY - record.request_count;
    
    return {
      allowed,
      count: record.request_count,
      remaining: remaining > 0 ? remaining : 0,
      resetTime: record.window_end
    };
  },

  /**
   * Increment rate limit counter
   * @param {Number} userId
   */
  async incrementRateLimit(userId) {
    const query = `
      INSERT INTO feature_request_rate_limits (user_id, request_count, window_start, last_request_at)
      VALUES ($1, 1, NOW(), NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        request_count = feature_request_rate_limits.request_count + 1,
        last_request_at = NOW()
      RETURNING *
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  },

  /**
   * Get all requests by user
   * @param {Number} userId
   * @returns {Array} User's requests
   */
  async findByUserId(userId) {
    const query = `
      SELECT 
        fr.*,
        u.name as user_name,
        u.email as user_email,
        admin.name as admin_name
      FROM feature_requests fr
      LEFT JOIN users u ON fr.user_id = u.id
      LEFT JOIN users admin ON fr.admin_id = admin.id
      WHERE fr.user_id = $1
      ORDER BY fr.created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  },

  /**
   * Get all requests (admin only)
   * @param {Object} filters - { status, request_type, limit, offset }
   * @returns {Object} { requests: [], total: number }
   */
  async findAll(filters = {}) {
    const { status, request_type, limit = 50, offset = 0 } = filters;
    
    let whereClause = [];
    let params = [];
    let paramCount = 1;
    
    if (status) {
      whereClause.push(`fr.status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }
    
    if (request_type) {
      whereClause.push(`fr.request_type = $${paramCount}`);
      params.push(request_type);
      paramCount++;
    }
    
    const whereString = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM feature_requests fr
      ${whereString}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    
    // Get requests
    const query = `
      SELECT 
        fr.*,
        u.name as user_name,
        u.email as user_email,
        admin.name as admin_name
      FROM feature_requests fr
      LEFT JOIN users u ON fr.user_id = u.id
      LEFT JOIN users admin ON fr.admin_id = admin.id
      ${whereString}
      ORDER BY 
        CASE fr.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'normal' THEN 3
          WHEN 'low' THEN 4
        END,
        fr.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    params.push(limit, offset);
    const result = await pool.query(query, params);
    
    return {
      requests: result.rows,
      total,
      limit,
      offset
    };
  },

  /**
   * Get request by ID
   * @param {Number} id
   * @returns {Object} Request
   */
  async findById(id) {
    const query = `
      SELECT 
        fr.*,
        u.name as user_name,
        u.email as user_email,
        u.avatar_url as user_avatar,
        admin.name as admin_name
      FROM feature_requests fr
      LEFT JOIN users u ON fr.user_id = u.id
      LEFT JOIN users admin ON fr.admin_id = admin.id
      WHERE fr.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  /**
   * Update request status (admin only)
   * @param {Number} id
   * @param {Object} updates - { status, priority, admin_response, admin_id }
   * @returns {Object} Updated request
   */
  async updateStatus(id, updates) {
    const { status, priority, admin_response, admin_id } = updates;
    
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    if (status) {
      fields.push(`status = $${paramCount++}`);
      values.push(status);
    }
    
    if (priority) {
      fields.push(`priority = $${paramCount++}`);
      values.push(priority);
    }
    
    if (admin_response !== undefined) {
      fields.push(`admin_response = $${paramCount++}`);
      values.push(admin_response);
    }
    
    if (admin_id) {
      fields.push(`admin_id = $${paramCount++}`);
      values.push(admin_id);
      fields.push(`reviewed_at = NOW()`);
    }
    
    if (fields.length === 0) {
      return null;
    }
    
    values.push(id);
    
    const query = `
      UPDATE feature_requests
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  /**
   * Delete request
   * @param {Number} id
   * @returns {Object} Deleted request
   */
  async delete(id) {
    const query = 'DELETE FROM feature_requests WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  /**
   * Get statistics
   * @returns {Object} Stats
   */
  async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'under_review') as under_review_count,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE status = 'implemented') as implemented_count,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
        COUNT(*) FILTER (WHERE request_type = 'ai_model') as ai_model_count,
        COUNT(*) FILTER (WHERE request_type = 'feature') as feature_count,
        COUNT(*) FILTER (WHERE request_type = 'bug') as bug_count,
        COUNT(*) FILTER (WHERE request_type = 'other') as other_count,
        COUNT(*) FILTER (WHERE reward_given = true) as rewarded_count,
        COALESCE(SUM(reward_amount) FILTER (WHERE reward_given = true), 0) as total_rewards_given,
        COUNT(DISTINCT user_id) as unique_users
      FROM feature_requests
    `;
    
    const result = await pool.query(query);
    return result.rows[0];
  },

  /**
   * Give reward to user for accepted request
   * @param {Number} requestId
   * @param {Number} rewardAmount
   * @returns {Object} Updated request
   */
  async giveReward(requestId, rewardAmount) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get request details
      const requestQuery = `
        SELECT user_id, reward_given, status, title
        FROM feature_requests 
        WHERE id = $1
      `;
      const requestResult = await client.query(requestQuery, [requestId]);
      const request = requestResult.rows[0];
      
      if (!request) {
        throw new Error('Request not found');
      }
      
      if (request.reward_given) {
        throw new Error('Reward already given');
      }
      
      // Update user credits
      const updateCreditsQuery = `
        UPDATE users 
        SET credits = credits + $1 
        WHERE id = $2
        RETURNING credits
      `;
      const creditsResult = await client.query(updateCreditsQuery, [rewardAmount, request.user_id]);
      const newBalance = creditsResult.rows[0].credits;
      
      // Log credit transaction
      const logQuery = `
        INSERT INTO credit_transactions 
        (user_id, amount, transaction_type, description, balance_after)
        VALUES ($1, $2, $3, $4, $5)
      `;
      await client.query(logQuery, [
        request.user_id,
        rewardAmount,
        'feature_reward',
        `Reward untuk: ${request.title}`,
        newBalance
      ]);
      
      // Create notification for user
      const notificationQuery = `
        INSERT INTO notifications 
        (user_id, type, title, message, action_url, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `;
      await client.query(notificationQuery, [
        request.user_id,
        'reward',
        '🎁 Reward Diterima!',
        `Selamat! Anda menerima reward ${rewardAmount} credits untuk request: "${request.title}"`,
        '/feature-request'
      ]);
      
      // Mark reward as given
      const updateRequestQuery = `
        UPDATE feature_requests
        SET reward_amount = $1,
            reward_given = true,
            reward_given_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
      const result = await client.query(updateRequestQuery, [rewardAmount, requestId]);
      
      await client.query('COMMIT');
      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Increment upvotes (for future enhancement)
   * @param {Number} id
   * @returns {Object} Updated request
   */
  async incrementUpvotes(id) {
    const query = `
      UPDATE feature_requests
      SET upvotes = upvotes + 1
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = FeatureRequest;

