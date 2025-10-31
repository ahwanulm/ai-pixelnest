const { pool } = require('../config/database');

const Admin = {
  // ============ USER MANAGEMENT ============
  
  // Get all users with pagination
  async getAllUsers(page = 1, limit = 20, search = '', filter = {}) {
    const offset = (page - 1) * limit;
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (filter.role) {
      whereConditions.push(`role = $${paramIndex}`);
      params.push(filter.role);
      paramIndex++;
    }

    if (filter.isActive !== undefined) {
      whereConditions.push(`is_active = $${paramIndex}`);
      params.push(filter.isActive);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const query = `
      SELECT id, name, email, role, credits, is_active, subscription_plan, 
             avatar_url, created_at, last_login, phone, province, city
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await pool.query(query, params);
    
    return {
      users: result.rows,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  },

  // Get user details with activity
  async getUserDetails(userId) {
    const userQuery = `
      SELECT id, name, email, role, credits, is_active, subscription_plan, 
             subscription_expires_at, avatar_url, created_at, last_login, 
             phone, province, city, address
      FROM users WHERE id = $1
    `;
    const userResult = await pool.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return null;
    }

    const activityQuery = `
      SELECT * FROM user_activity_logs 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 50
    `;
    const activityResult = await pool.query(activityQuery, [userId]);

    const creditsQuery = `
      SELECT * FROM credit_transactions 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 20
    `;
    const creditsResult = await pool.query(creditsQuery, [userId]);

    const generationsQuery = `
      SELECT * FROM ai_generation_history 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 20
    `;
    const generationsResult = await pool.query(generationsQuery, [userId]);

    return {
      user: userResult.rows[0],
      activities: activityResult.rows,
      creditHistory: creditsResult.rows,
      generations: generationsResult.rows
    };
  },

  // Update user
  async updateUser(userId, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = ['name', 'email', 'role', 'credits', 'is_active', 'subscription_plan', 'subscription_expires_at', 'phone', 'province', 'city', 'address'];
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        fields.push(`${field} = $${paramCount++}`);
        values.push(updates[field]);
      }
    }

    if (fields.length === 0) {
      return null;
    }

    values.push(userId);
    const query = `
      UPDATE users 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Add credits to user
  async addCredits(userId, amount, adminId, description = 'Admin credit adjustment') {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update user credits
      const updateQuery = `
        UPDATE users 
        SET credits = credits + $1 
        WHERE id = $2 
        RETURNING credits
      `;
      const updateResult = await client.query(updateQuery, [amount, userId]);
      
      if (updateResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const newBalance = updateResult.rows[0].credits;

      // Log transaction
      const logQuery = `
        INSERT INTO credit_transactions 
        (user_id, amount, transaction_type, description, balance_after, admin_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const logResult = await client.query(logQuery, [
        userId,
        amount,
        amount > 0 ? 'credit' : 'debit',
        description,
        newBalance,
        adminId
      ]);

      await client.query('COMMIT');
      return logResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Delete user
  async deleteUser(userId) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  },

  // ============ PROMO CODES ============
  
  // Get all promo codes
  async getAllPromoCodes() {
    const query = `
      SELECT * FROM promo_codes 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  // Create promo code
  async createPromoCode(data) {
    const query = `
      INSERT INTO promo_codes 
      (code, description, code_type, discount_type, discount_value, credit_amount, min_purchase, single_use, usage_limit, is_active, valid_from, valid_until)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    const values = [
      data.code.toUpperCase(),
      data.description,
      data.code_type || 'promo', // 'promo' or 'claim'
      data.discount_type || null, // Only required for promo codes
      data.discount_value || null, // Only required for promo codes
      data.credit_amount || 0, // Only for claim codes
      data.min_purchase || 0,
      data.single_use || false,
      data.usage_limit || null,
      data.is_active !== false,
      data.valid_from || null,
      data.valid_until || null
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Update promo code
  async updatePromoCode(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = ['code', 'description', 'code_type', 'discount_type', 'discount_value', 'credit_amount', 'min_purchase', 'single_use', 'usage_limit', 'is_active', 'valid_from', 'valid_until'];
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === 'code') {
          fields.push(`${field} = $${paramCount++}`);
          values.push(updates[field].toUpperCase());
        } else {
          fields.push(`${field} = $${paramCount++}`);
          values.push(updates[field]);
        }
      }
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);
    
    const query = `
      UPDATE promo_codes 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Delete promo code
  async deletePromoCode(id) {
    const query = 'DELETE FROM promo_codes WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // ============ API CONFIGS ============
  
  // Get all API configs
  async getAllApiConfigs() {
    const query = `
      SELECT id, service_name, api_key, api_secret, endpoint_url, is_active, rate_limit, additional_config, updated_at
      FROM api_configs 
      ORDER BY service_name
    `;
    const result = await pool.query(query);
    
    // Parse additional_config JSON if it's a string
    return result.rows.map(row => ({
      ...row,
      additional_config: typeof row.additional_config === 'string' 
        ? JSON.parse(row.additional_config) 
        : row.additional_config
    }));
  },

  // Get API config with keys (admin only)
  async getApiConfigWithKeys(idOrServiceName) {
    // Try to find by service_name first, then by id
    let query = 'SELECT * FROM api_configs WHERE service_name = $1';
    let result = await pool.query(query, [idOrServiceName]);
    
    if (result.rows.length === 0 && !isNaN(idOrServiceName)) {
      // If not found by service_name and idOrServiceName is numeric, try by id
      query = 'SELECT * FROM api_configs WHERE id = $1';
      result = await pool.query(query, [parseInt(idOrServiceName)]);
    }
    
    return result.rows[0];
  },

  // Create new API config
  async createApiConfig(data) {
    const {
      service_name,
      api_key,
      api_secret,
      endpoint_url,
      is_active = true,
      rate_limit = 100,
      additional_config
    } = data;

    const query = `
      INSERT INTO api_configs (
        service_name, api_key, api_secret, endpoint_url, 
        is_active, rate_limit, additional_config, 
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      service_name,
      api_key,
      api_secret || null,
      endpoint_url || null,
      is_active,
      rate_limit,
      additional_config ? JSON.stringify(additional_config) : null
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Get API config by service name (helper method)
  async getApiConfig(serviceName) {
    const query = 'SELECT * FROM api_configs WHERE service_name = $1';
    const result = await pool.query(query, [serviceName]);
    return result.rows[0];
  },

  // Update API config (accepts either service_name or id)
  async updateApiConfig(idOrServiceName, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = ['api_key', 'api_secret', 'endpoint_url', 'is_active', 'rate_limit', 'additional_config'];
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        // For additional_config, use JSONB merge to preserve existing keys
        if (field === 'additional_config' && updates[field]) {
          fields.push(`${field} = COALESCE(${field}, '{}'::jsonb) || $${paramCount++}::jsonb`);
          values.push(JSON.stringify(updates[field]));
        } else {
          fields.push(`${field} = $${paramCount++}`);
          values.push(updates[field]);
        }
      }
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push(`updated_at = NOW()`);
    values.push(idOrServiceName);
    
    // Try to update by service_name first
    let query = `
      UPDATE api_configs 
      SET ${fields.join(', ')} 
      WHERE service_name = $${paramCount}
      RETURNING *
    `;

    let result = await pool.query(query, values);
    
    // If not found by service_name and idOrServiceName is numeric, try by id
    if (result.rows.length === 0 && !isNaN(idOrServiceName)) {
      values[values.length - 1] = parseInt(idOrServiceName);
      query = `
        UPDATE api_configs 
        SET ${fields.join(', ')} 
        WHERE id = $${paramCount}
        RETURNING *
      `;
      result = await pool.query(query, values);
    }

    return result.rows[0];
  },

  // ============ NOTIFICATIONS ============
  
  // Get all notifications (unique, no duplicates for broadcast)
  async getAllNotifications(limit = 50) {
    const query = `
      WITH grouped_notifications AS (
        SELECT 
          MIN(n.id) as id,
          n.title, 
          n.message, 
          n.type, 
          n.target_users,
          n.priority,
          MIN(n.action_url) as action_url,
          MIN(n.expires_at) as expires_at,
          MIN(n.created_at) as created_at,
          COUNT(*) as recipient_count,
          MIN(u.name) as user_name,
          MIN(u.email) as user_email
        FROM notifications n
        LEFT JOIN users u ON n.user_id = u.id
        GROUP BY 
          n.title, 
          n.message, 
          n.type, 
          n.target_users, 
          n.priority,
          -- Group by timestamp truncated to second to group broadcast notifications
          DATE_TRUNC('second', n.created_at)
      )
      SELECT 
        id,
        title,
        message,
        type,
        target_users,
        priority,
        action_url,
        expires_at,
        created_at,
        recipient_count,
        user_name,
        user_email,
        false as is_read
      FROM grouped_notifications
      ORDER BY created_at DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  },

  // Create notification
  async createNotification(data) {
    const query = `
      INSERT INTO notifications 
      (title, message, type, target_users, user_id, priority, action_url, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      data.title,
      data.message,
      data.type || 'info',
      data.target_users || 'all',
      data.user_id || null,
      data.priority || 'normal',
      data.action_url || null,
      data.expires_at || null
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Broadcast notification to all users
  async broadcastNotification(data) {
    // Get all active users
    const usersQuery = 'SELECT id FROM users WHERE is_active = true';
    const usersResult = await pool.query(usersQuery);
    
    // Create notification for each user (necessary for individual read tracking)
    const notifications = [];
    for (const user of usersResult.rows) {
      const query = `
        INSERT INTO notifications 
        (title, message, type, target_users, user_id, priority, action_url, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const values = [
        data.title,
        data.message,
        data.type || 'info',
        'all',
        user.id,
        data.priority || 'normal',
        data.action_url || null,
        data.expires_at || null
      ];
      const result = await pool.query(query, values);
      notifications.push(result.rows[0]);
    }
    
    // Return only the first notification for display purposes
    return notifications[0] || null;
  },

  // Delete notification (and all duplicates for broadcast notifications)
  async deleteNotification(id) {
    // Delete all notifications that match the title, message, and created_at (truncated to second)
    // This uses the same grouping logic as getAllNotifications()
    // This ensures when admin deletes 1 grouped notification, ALL related notifications are deleted
    const deleteQuery = `
      WITH target_notification AS (
        SELECT 
          title, 
          message, 
          type, 
          target_users, 
          priority,
          DATE_TRUNC('second', created_at) as created_at_sec
        FROM notifications
        WHERE id = $1
        LIMIT 1
      )
      DELETE FROM notifications 
      WHERE (title, message, type, target_users, priority, DATE_TRUNC('second', created_at)) IN (
        SELECT title, message, type, target_users, priority, created_at_sec 
        FROM target_notification
      )
      RETURNING *
    `;
    
    const deleteResult = await pool.query(deleteQuery, [id]);
    
    if (deleteResult.rows.length === 0) {
      return null;
    }
    
    // Return count of deleted notifications for feedback
    return {
      success: true,
      deletedCount: deleteResult.rows.length,
      message: `Successfully deleted ${deleteResult.rows.length} notification${deleteResult.rows.length > 1 ? 's' : ''}`
    };
  },

  // Batch delete notifications
  async batchDeleteNotifications(ids) {
    if (!ids || ids.length === 0) {
      return { success: false, deletedCount: 0, message: 'No notification IDs provided' };
    }

    // Build the delete query with all IDs
    const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
    
    // Delete all notifications that match any of the provided IDs
    // This uses the same grouping logic as getAllNotifications() and deleteNotification()
    // This ensures consistent deletion behavior for grouped notifications
    const deleteQuery = `
      WITH target_notifications AS (
        SELECT DISTINCT 
          title, 
          message, 
          type, 
          target_users, 
          priority,
          DATE_TRUNC('second', created_at) as created_at_sec
        FROM notifications
        WHERE id IN (${placeholders})
      )
      DELETE FROM notifications 
      WHERE (title, message, type, target_users, priority, DATE_TRUNC('second', created_at)) IN (
        SELECT title, message, type, target_users, priority, created_at_sec 
        FROM target_notifications
      )
      RETURNING *
    `;
    
    try {
      const deleteResult = await pool.query(deleteQuery, ids);
      
      return {
        success: true,
        deletedCount: deleteResult.rows.length,
        message: `Successfully deleted ${deleteResult.rows.length} notification${deleteResult.rows.length > 1 ? 's' : ''}`
      };
    } catch (error) {
      console.error('Batch delete error:', error);
      return {
        success: false,
        deletedCount: 0,
        message: 'Failed to delete notifications: ' + error.message
      };
    }
  },

  // ============ ACTIVITY LOGS ============
  
  // Get all activity logs
  async getAllActivityLogs(page = 1, limit = 50, userId = null) {
    const offset = (page - 1) * limit;
    let whereClause = '';
    let params = [limit, offset];

    if (userId) {
      whereClause = 'WHERE user_id = $3';
      params.push(userId);
    }

    const query = `
      SELECT a.*, u.name as user_name, u.email as user_email
      FROM user_activity_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, params);
    return result.rows;
  },

  // ============ DASHBOARD STATS ============
  
  // Get dashboard statistics
  async getDashboardStats() {
    const stats = {};

    // Helper function to safely execute queries
    const safeQuery = async (query, defaultValue = 0) => {
      try {
        const result = await pool.query(query);
        if (result.rows && result.rows[0]) {
          const value = result.rows[0].total || result.rows[0].average || result.rows[0].paid || result.rows[0].amount_total || defaultValue;
          return typeof value === 'string' ? parseInt(value) || defaultValue : (value || defaultValue);
        }
        return defaultValue;
      } catch (error) {
        console.error('Dashboard stats query error:', error.message);
        return defaultValue;
      }
    };

    // Helper function for queries that return objects/arrays
    const safeQueryRows = async (query, defaultValue = []) => {
      try {
        const result = await pool.query(query);
        return result.rows || defaultValue;
      } catch (error) {
        console.error('Dashboard stats query error:', error.message);
        return defaultValue;
      }
    };

    // Total users
    stats.totalUsers = await safeQuery('SELECT COUNT(*) as total FROM users', 0);

    // Active users (logged in last 30 days)
    stats.activeUsers = await safeQuery(`
      SELECT COUNT(*) as total FROM users 
      WHERE last_login > NOW() - INTERVAL '30 days'
    `, 0);

    // New users this month
    stats.newUsersThisMonth = await safeQuery(`
      SELECT COUNT(*) as total FROM users 
      WHERE created_at > DATE_TRUNC('month', NOW())
    `, 0);

    // Total credits distributed
    stats.totalCredits = await safeQuery('SELECT COALESCE(SUM(credits), 0) as total FROM users', 0);

    // Total generations
    try {
      const generationsResult = await pool.query('SELECT COUNT(*) as total FROM ai_generation_history');
      stats.totalGenerations = parseInt(generationsResult.rows[0]?.total) || 0;
    } catch (error) {
      console.error('Error fetching total generations:', error.message);
      stats.totalGenerations = 0;
    }

    // Generations this month
    try {
      const monthGenerationsResult = await pool.query(`
        SELECT COUNT(*) as total FROM ai_generation_history 
        WHERE created_at > DATE_TRUNC('month', NOW())
      `);
      stats.generationsThisMonth = parseInt(monthGenerationsResult.rows[0]?.total) || 0;
    } catch (error) {
      console.error('Error fetching generations this month:', error.message);
      stats.generationsThisMonth = 0;
    }

    // Active promo codes
    try {
      const promoResult = await pool.query(`
        SELECT COUNT(*) as total FROM promo_codes 
        WHERE is_active = true AND (valid_until IS NULL OR valid_until > NOW())
      `);
      stats.activePromoCodes = parseInt(promoResult.rows[0]?.total) || 0;
    } catch (error) {
      console.error('Error fetching active promo codes:', error.message);
      stats.activePromoCodes = 0;
    }

    // Recent activities
    stats.recentActivities = await safeQueryRows(`
      SELECT a.*, u.name as user_name
      FROM user_activity_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 10
    `, []);

    // Total Revenue (from paid transactions)
    try {
      const totalRevenueResult = await pool.query(`
        SELECT COALESCE(SUM(amount_received), 0) as total 
        FROM payment_transactions 
        WHERE status = 'PAID'
      `);
      stats.totalRevenue = parseInt(totalRevenueResult.rows[0]?.total) || 0;
    } catch (error) {
      console.error('Error fetching total revenue:', error.message);
      stats.totalRevenue = 0;
    }

    // Revenue this month
    try {
      const revenueThisMonthResult = await pool.query(`
        SELECT COALESCE(SUM(amount_received), 0) as total 
        FROM payment_transactions 
        WHERE status = 'PAID' AND paid_at > DATE_TRUNC('month', NOW())
      `);
      stats.revenueThisMonth = parseInt(revenueThisMonthResult.rows[0]?.total) || 0;
    } catch (error) {
      console.error('Error fetching revenue this month:', error.message);
      stats.revenueThisMonth = 0;
    }

    // Total Transactions
    try {
      const totalTransactionsResult = await pool.query('SELECT COUNT(*) as total FROM payment_transactions');
      stats.totalTransactions = parseInt(totalTransactionsResult.rows[0]?.total) || 0;
    } catch (error) {
      console.error('Error fetching total transactions:', error.message);
      stats.totalTransactions = 0;
    }

    // Pending Payments - Count all UNPAID and PENDING transactions
    // Note: Includes both active and expired, as they still need to be paid or handled
    try {
      const pendingPaymentsResult = await pool.query(`
        SELECT 
          COUNT(*) as total, 
          COALESCE(SUM(amount_received), 0) as amount_total
        FROM payment_transactions 
        WHERE status IN ('UNPAID', 'PENDING')
      `);
      stats.pendingPaymentsCount = parseInt(pendingPaymentsResult.rows[0]?.total) || 0;
      stats.pendingPaymentsAmount = parseInt(pendingPaymentsResult.rows[0]?.amount_total) || 0;
      
      // Also get count of active (not expired) pending payments separately
      const activePendingResult = await pool.query(`
        SELECT COUNT(*) as total
        FROM payment_transactions 
        WHERE status IN ('UNPAID', 'PENDING')
          AND (expired_time IS NULL OR expired_time > NOW())
      `);
      stats.activePendingPaymentsCount = parseInt(activePendingResult.rows[0]?.total) || 0;
    } catch (error) {
      console.error('Error fetching pending payments:', error.message);
      // If table doesn't exist or other error, set to 0
      stats.pendingPaymentsCount = 0;
      stats.pendingPaymentsAmount = 0;
      stats.activePendingPaymentsCount = 0;
    }

    // Credit Transactions Today
    try {
      const creditTransactionsTodayResult = await pool.query(`
        SELECT COUNT(*) as total, COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as amount_total
        FROM credit_transactions 
        WHERE created_at >= CURRENT_DATE
      `);
      stats.creditTransactionsToday = parseInt(creditTransactionsTodayResult.rows[0]?.total) || 0;
      stats.creditsAddedToday = parseInt(creditTransactionsTodayResult.rows[0]?.amount_total) || 0;
    } catch (error) {
      console.error('Error fetching credit transactions today:', error.message);
      stats.creditTransactionsToday = 0;
      stats.creditsAddedToday = 0;
    }

    // Average Credits per User
    try {
      const avgCreditsResult = await pool.query(`
        SELECT COALESCE(AVG(credits), 0) as average 
        FROM users 
        WHERE credits > 0
      `);
      stats.averageCreditsPerUser = Math.round(parseFloat(avgCreditsResult.rows[0]?.average) || 0);
    } catch (error) {
      console.error('Error fetching average credits:', error.message);
      stats.averageCreditsPerUser = 0;
    }

    // Generations Today
    try {
      const generationsTodayResult = await pool.query(`
        SELECT COUNT(*) as total 
        FROM ai_generation_history 
        WHERE created_at >= CURRENT_DATE
      `);
      stats.generationsToday = parseInt(generationsTodayResult.rows[0]?.total) || 0;
    } catch (error) {
      console.error('Error fetching generations today:', error.message);
      stats.generationsToday = 0;
    }

    // Active Subscriptions
    try {
      const activeSubscriptionsResult = await pool.query(`
        SELECT COUNT(*) as total 
        FROM users 
        WHERE subscription_plan IS NOT NULL 
        AND (subscription_expires_at IS NULL OR subscription_expires_at > NOW())
      `);
      stats.activeSubscriptions = parseInt(activeSubscriptionsResult.rows[0]?.total) || 0;
    } catch (error) {
      console.error('Error fetching active subscriptions:', error.message);
      stats.activeSubscriptions = 0;
    }

    // Transactions this month
    try {
      const transactionsThisMonthResult = await pool.query(`
        SELECT COUNT(*) as total 
        FROM payment_transactions 
        WHERE created_at > DATE_TRUNC('month', NOW())
      `);
      stats.transactionsThisMonth = parseInt(transactionsThisMonthResult.rows[0]?.total) || 0;
    } catch (error) {
      console.error('Error fetching transactions this month:', error.message);
      stats.transactionsThisMonth = 0;
    }

    // Success Rate (paid vs total transactions)
    try {
      const successRateResult = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'PAID') as paid,
          COUNT(*) as total
        FROM payment_transactions
      `);
      const paidCount = parseInt(successRateResult.rows[0]?.paid) || 0;
      const totalCount = parseInt(successRateResult.rows[0]?.total) || 0;
      stats.paymentSuccessRate = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;
    } catch (error) {
      console.error('Error fetching payment success rate:', error.message);
      stats.paymentSuccessRate = 0;
    }

    return stats;
  },

  // ============ SETTINGS ============
  
  // Get all settings
  async getAllSettings() {
    const query = 'SELECT * FROM admin_settings ORDER BY setting_key';
    const result = await pool.query(query);
    return result.rows;
  },

  // Update setting
  async updateSetting(key, value, userId) {
    const query = `
      UPDATE admin_settings 
      SET setting_value = $1, updated_by = $2, updated_at = NOW()
      WHERE setting_key = $3
      RETURNING *
    `;
    const result = await pool.query(query, [value, userId, key]);
    return result.rows[0];
  }
};

module.exports = Admin;

