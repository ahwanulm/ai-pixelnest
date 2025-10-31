const { pool } = require('../config/database');
const Admin = require('../models/Admin');
const { syncApiConfigToEnv, checkSyncStatus, reloadEnv } = require('../utils/envSync');
const tripayService = require('../services/tripayService');
const falAiService = require('../services/falAiService');
const falAiRealtime = require('../services/falAiRealtime');
const sunoService = require('../services/sunoService');

const adminController = {
  // ============ DASHBOARD ============
  
  async getDashboard(req, res) {
    try {
      const stats = await Admin.getDashboardStats();
      
      res.render('admin/dashboard', {
        title: 'Admin Dashboard',
        pageTitle: 'Admin Dashboard',
        user: req.user,
        stats
      });
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to load dashboard',
        error: process.env.NODE_ENV === 'development' ? error : null,
        stack: process.env.NODE_ENV === 'development' ? error.stack : null
      });
    }
  },

  // ============ USER MANAGEMENT ============
  
  async getUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const search = req.query.search || '';
      const role = req.query.role || '';
      const isActive = req.query.isActive;

      const filter = {};
      if (role) filter.role = role;
      if (isActive !== undefined) filter.isActive = isActive === 'true';

      const result = await Admin.getAllUsers(page, 20, search, filter);
      
      res.render('admin/users', {
        title: 'User Management',
        pageTitle: 'User Management',
        user: req.user,
        users: result.users,
        pagination: result.pagination,
        search,
        filters: { role, isActive }
      });
    } catch (error) {
      console.error('Error loading users:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to load users',
        error: process.env.NODE_ENV === 'development' ? error : null,
        stack: process.env.NODE_ENV === 'development' ? error.stack : null
      });
    }
  },

  async getUserDetails(req, res) {
    try {
      const userId = req.params.id;
      const userDetails = await Admin.getUserDetails(userId);
      
      if (!userDetails) {
        return res.status(404).render('error', {
          title: 'User Not Found',
          message: 'The user you are looking for does not exist.',
          error: null,
          stack: null
        });
      }
      
      res.render('admin/user-details', {
        title: `User: ${userDetails.user.name}`,
        pageTitle: `User: ${userDetails.user.name}`,
        user: req.user,
        userDetails
      });
    } catch (error) {
      console.error('Error loading user details:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to load user details',
        error: process.env.NODE_ENV === 'development' ? error : null,
        stack: process.env.NODE_ENV === 'development' ? error.stack : null
      });
    }
  },

  async updateUser(req, res) {
    try {
      const userId = req.params.id;
      const updates = req.body;
      
      const user = await Admin.updateUser(userId, updates);
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      res.json({ success: true, message: 'User updated successfully', user });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
    }
  },

  async addCredits(req, res) {
    try {
      const userId = req.params.id;
      const { amount, description } = req.body;
      
      const transaction = await Admin.addCredits(
        userId, 
        parseInt(amount), 
        req.user.id, 
        description
      );
      
      res.json({ success: true, message: 'Credits added successfully', transaction });
    } catch (error) {
      console.error('Error adding credits:', error);
      res.status(500).json({ success: false, message: 'Failed to add credits', error: error.message });
    }
  },

  async deleteUser(req, res) {
    try {
      const userId = req.params.id;
      
      // Prevent admin from deleting themselves
      if (userId === req.user.id.toString()) {
        return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
      }
      
      const user = await Admin.deleteUser(userId);
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
    }
  },

  // ============ PROMO CODES ============
  
  async getPromoCodes(req, res) {
    try {
      const promoCodes = await Admin.getAllPromoCodes();
      
      res.render('admin/promo-codes', {
        title: 'Promo Code Management',
        pageTitle: 'Promo Code Management',
        user: req.user,
        promoCodes
      });
    } catch (error) {
      console.error('Error loading promo codes:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to load promo codes',
        error: process.env.NODE_ENV === 'development' ? error : null,
        stack: process.env.NODE_ENV === 'development' ? error.stack : null
      });
    }
  },

  async createPromoCode(req, res) {
    try {
      const promoCode = await Admin.createPromoCode(req.body);
      res.json({ success: true, message: 'Promo code created successfully', promoCode });
    } catch (error) {
      console.error('Error creating promo code:', error);
      res.status(500).json({ success: false, message: 'Failed to create promo code', error: error.message });
    }
  },

  async updatePromoCode(req, res) {
    try {
      const id = req.params.id;
      const promoCode = await Admin.updatePromoCode(id, req.body);
      
      if (!promoCode) {
        return res.status(404).json({ success: false, message: 'Promo code not found' });
      }
      
      res.json({ success: true, message: 'Promo code updated successfully', promoCode });
    } catch (error) {
      console.error('Error updating promo code:', error);
      res.status(500).json({ success: false, message: 'Failed to update promo code', error: error.message });
    }
  },

  async deletePromoCode(req, res) {
    try {
      const id = req.params.id;
      const promoCode = await Admin.deletePromoCode(id);
      
      if (!promoCode) {
        return res.status(404).json({ success: false, message: 'Promo code not found' });
      }
      
      res.json({ success: true, message: 'Promo code deleted successfully' });
    } catch (error) {
      console.error('Error deleting promo code:', error);
      res.status(500).json({ success: false, message: 'Failed to delete promo code', error: error.message });
    }
  },

  // Get promo code usage details (who used it)
  async getPromoCodeUsage(req, res) {
    try {
      const { id } = req.params;
      const { pool } = require('../config/database');
      
      // Get promo code details
      const promoQuery = 'SELECT * FROM promo_codes WHERE id = $1';
      const promoResult = await pool.query(promoQuery, [id]);
      
      if (promoResult.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Promo code not found' 
        });
      }
      
      const promoCode = promoResult.rows[0];
      
      // Get users who used this code (both claim and promo)
      const usageQuery = `
        SELECT 
          u.id as user_id,
          u.name as user_name,
          u.email as user_email,
          u.avatar_url,
          ct.transaction_type,
          ct.amount,
          ct.description,
          ct.created_at as used_at
        FROM credit_transactions ct
        JOIN users u ON u.id = ct.user_id
        WHERE ct.description LIKE $1 OR ct.description LIKE $2 OR ct.promo_code_id = $3
        ORDER BY ct.created_at DESC
      `;
      
      const usageResult = await pool.query(usageQuery, [
        `%Claim code: ${promoCode.code}%`,
        `%Promo code: ${promoCode.code}%`,
        promoCode.id
      ]);
      
      // Format the results
      const users = usageResult.rows.map(row => ({
        user_id: row.user_id,
        user_name: row.user_name,
        user_email: row.user_email,
        avatar_url: row.avatar_url,
        usage_type: row.transaction_type === 'claim_code' ? 'Claimed' : 'Promo Used',
        usage_type_badge: row.transaction_type === 'claim_code' ? 'success' : 'warning',
        amount: row.amount,
        description: row.description,
        used_at: row.used_at
      }));
      
      res.json({
        success: true,
        promo_code: {
          id: promoCode.id,
          code: promoCode.code,
          description: promoCode.description,
          code_type: promoCode.code_type,
          uses_count: promoCode.uses_count,
          usage_limit: promoCode.usage_limit
        },
        users: users,
        total_users: users.length
      });
      
    } catch (error) {
      console.error('Error getting promo code usage:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get usage details',
        error: error.message 
      });
    }
  },

  // ============ API CONFIGS ============
  
  async getApiConfigs(req, res) {
    try {
      const apiConfigs = await Admin.getAllApiConfigs();
      
      // Check sync status for each config
      const configsWithSync = apiConfigs.map(config => {
        const syncStatus = checkSyncStatus(config.service_name, config);
        return {
          ...config,
          syncStatus
        };
      });
      
      res.render('admin/api-configs', {
        title: 'API Configuration',
        pageTitle: 'API Configuration',
        user: req.user,
        apiConfigs: configsWithSync
      });
    } catch (error) {
      console.error('Error loading API configs:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to load API configs',
        error: process.env.NODE_ENV === 'development' ? error : null,
        stack: process.env.NODE_ENV === 'development' ? error.stack : null
      });
    }
  },

  async getApiConfigDetails(req, res) {
    try {
      const id = req.params.id;
      const apiConfig = await Admin.getApiConfigWithKeys(id);
      
      if (!apiConfig) {
        return res.status(404).json({ success: false, message: 'API config not found' });
      }
      
      res.json({ success: true, apiConfig });
    } catch (error) {
      console.error('Error loading API config:', error);
      res.status(500).json({ success: false, message: 'Failed to load API config', error: error.message });
    }
  },

  async createApiConfig(req, res) {
    try {
      const { service_name, api_key, api_secret, endpoint_url, is_active, additional_config } = req.body;
      
      // Validation
      if (!service_name) {
        return res.status(400).json({ success: false, message: 'Service name is required' });
      }
      
      if (!api_key) {
        return res.status(400).json({ success: false, message: 'API key is required' });
      }
      
      // Check if config already exists
      const existing = await Admin.getApiConfig(service_name);
      if (existing) {
        return res.status(409).json({ 
          success: false, 
          message: `API configuration for ${service_name} already exists. Please use update instead.` 
        });
      }
      
      // Create API config
      const apiConfig = await Admin.createApiConfig({
        service_name,
        api_key,
        api_secret,
        endpoint_url,
        is_active: is_active !== undefined ? is_active : true,
        rate_limit: 100, // Default rate limit
        additional_config
      });
      
      // Sync to .env file
      const syncSuccess = syncApiConfigToEnv(apiConfig.service_name, apiConfig);
      
      if (!syncSuccess) {
        console.warn(`⚠️  API config created in database but failed to sync to .env for ${apiConfig.service_name}`);
      }
      
      // Reload environment variables
      reloadEnv();
      
      // Check final sync status
      const syncStatus = checkSyncStatus(apiConfig.service_name, apiConfig);
      
      res.json({ 
        success: true, 
        message: `${service_name} configuration added successfully`, 
        apiConfig,
        envSynced: syncSuccess,
        syncStatus,
        warning: !syncSuccess ? 'Configuration saved but .env file may need manual update' : null
      });
    } catch (error) {
      console.error('Error creating API config:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create API config', 
        error: error.message 
      });
    }
  },

  async updateApiConfig(req, res) {
    try {
      const id = req.params.id;
      const updates = req.body;
      
      // Update in database
      const apiConfig = await Admin.updateApiConfig(id, updates);
      
      if (!apiConfig) {
        return res.status(404).json({ success: false, message: 'API config not found' });
      }
      
      // Sync to .env file
      const syncSuccess = syncApiConfigToEnv(apiConfig.service_name, apiConfig);
      
      if (!syncSuccess) {
        console.warn(`⚠️  API config updated in database but failed to sync to .env for ${apiConfig.service_name}`);
      }
      
      // Reload environment variables
      reloadEnv();
      
      // 🔥 CRITICAL FIX: Force reload TripayService if TRIPAY config is updated
      if (apiConfig.service_name === 'TRIPAY') {
        try {
          await tripayService.initialize(true); // Force reload config
          console.log('✅ TripayService configuration reloaded successfully');
        } catch (tripayError) {
          console.error('⚠️  Failed to reload TripayService:', tripayError.message);
          // Don't fail the request, just log the warning
        }
      }
      
      // Check final sync status
      const syncStatus = checkSyncStatus(apiConfig.service_name, apiConfig);
      
      res.json({ 
        success: true, 
        message: 'API config updated successfully', 
        apiConfig,
        envSynced: syncSuccess,
        syncStatus,
        warning: !syncSuccess ? 'Configuration saved but .env file may need manual update' : null
      });
    } catch (error) {
      console.error('Error updating API config:', error);
      res.status(500).json({ success: false, message: 'Failed to update API config', error: error.message });
    }
  },

  // ============ NOTIFICATIONS ============
  
  async getNotifications(req, res) {
    try {
      const notifications = await Admin.getAllNotifications();
      
      res.render('admin/notifications', {
        title: 'Notifications Management',
        pageTitle: 'Notifications Management',
        user: req.user,
        notifications
      });
    } catch (error) {
      console.error('Error loading notifications:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to load notifications',
        error: process.env.NODE_ENV === 'development' ? error : null,
        stack: process.env.NODE_ENV === 'development' ? error.stack : null
      });
    }
  },

  async createNotification(req, res) {
    try {
      const { target_users, ...notificationData } = req.body;
      
      let result;
      if (target_users === 'all') {
        result = await Admin.broadcastNotification(notificationData);
      } else {
        result = await Admin.createNotification(req.body);
      }
      
      res.json({ 
        success: true, 
        message: target_users === 'all' ? 'Notification broadcasted to all users' : 'Notification created successfully',
        notification: result 
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ success: false, message: 'Failed to create notification', error: error.message });
    }
  },

  async deleteNotification(req, res) {
    try {
      const id = req.params.id;
      const result = await Admin.deleteNotification(id);
      
      if (!result) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }
      
      res.json({ 
        success: true, 
        message: result.message || 'Notification deleted successfully',
        deletedCount: result.deletedCount || 1
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ success: false, message: 'Failed to delete notification', error: error.message });
    }
  },

  async batchDeleteNotifications(req, res) {
    try {
      const { ids } = req.body;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid request: ids array is required' 
        });
      }

      // Validate that all IDs are numbers
      const validIds = ids.filter(id => !isNaN(parseInt(id)));
      if (validIds.length !== ids.length) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid notification IDs provided' 
        });
      }

      const result = await Admin.batchDeleteNotifications(validIds);
      
      if (result.success) {
        res.json({
          success: true,
          deletedCount: result.deletedCount,
          message: result.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Error batch deleting notifications:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to delete notifications', 
        error: error.message 
      });
    }
  },

  // ============ ACTIVITY LOGS ============
  
  async getActivityLogs(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const userId = req.query.userId;
      
      const activities = await Admin.getAllActivityLogs(page, 50, userId);
      
      res.render('admin/activity-logs', {
        title: 'Activity Logs',
        pageTitle: 'Activity Logs',
        user: req.user,
        activities,
        page
      });
    } catch (error) {
      console.error('Error loading activity logs:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to load activity logs',
        error: process.env.NODE_ENV === 'development' ? error : null,
        stack: process.env.NODE_ENV === 'development' ? error.stack : null
      });
    }
  },

  // ============ SETTINGS ============
  
  async getSettings(req, res) {
    try {
      // Get registration settings from pricing_config table
      const settingsQuery = await pool.query(`
        SELECT config_key, config_value 
        FROM pricing_config 
        WHERE config_key IN ('give_default_credits', 'default_user_credits')
      `);
      
      const settings = {
        give_default_credits: true, // default
        default_user_credits: 100   // default
      };
      
      settingsQuery.rows.forEach(row => {
        if (row.config_key === 'give_default_credits') {
          settings.give_default_credits = parseFloat(row.config_value) === 1;
        } else if (row.config_key === 'default_user_credits') {
          settings.default_user_credits = parseFloat(row.config_value) || 100;
        }
      });
      
      res.render('admin/settings', {
        title: 'System Settings',
        pageTitle: 'System Settings',
        user: req.user,
        settings
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to load settings',
        error: process.env.NODE_ENV === 'development' ? error : null,
        stack: process.env.NODE_ENV === 'development' ? error.stack : null
      });
    }
  },

  // Get settings as JSON (API endpoint)
  async getSettingsAPI(req, res) {
    try {
      // Get ALL relevant settings from pricing_config table
      const settingsQuery = await pool.query(`
        SELECT config_key, config_value 
        FROM pricing_config 
        WHERE config_key IN (
          'give_default_credits', 
          'default_user_credits',
          'credit_price_idr',
          'base_credit_usd',
          'profit_margin_percent',
          'credit_rounding'
        )
      `);
      
      const settings = {
        give_default_credits: true,
        default_user_credits: 100,
        credit_price_idr: 1300,
        base_credit_usd: 0.05,
        profit_margin_percent: 25,
        credit_rounding: 0.5
      };
      
      settingsQuery.rows.forEach(row => {
        const value = parseFloat(row.config_value);
        
        if (row.config_key === 'give_default_credits') {
          settings.give_default_credits = value === 1;
        } else if (row.config_key === 'default_user_credits') {
          settings.default_user_credits = value || 100;
        } else if (row.config_key === 'credit_price_idr') {
          settings.credit_price_idr = value || 1300;
        } else if (row.config_key === 'base_credit_usd') {
          settings.base_credit_usd = value || 0.05;
        } else if (row.config_key === 'profit_margin_percent') {
          settings.profit_margin_percent = value || 25;
        } else if (row.config_key === 'credit_rounding') {
          settings.credit_rounding = value || 0.5;
        }
      });
      
      res.json({ 
        success: true, 
        settings 
      });
    } catch (error) {
      console.error('❌ Error loading settings API:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to load settings', 
        error: error.message 
      });
    }
  },

  async updateSetting(req, res) {
    try {
      const { key, value } = req.body;
      const setting = await Admin.updateSetting(key, value, req.user.id);
      
      if (!setting) {
        return res.status(404).json({ success: false, message: 'Setting not found' });
      }
      
      res.json({ success: true, message: 'Setting updated successfully', setting });
    } catch (error) {
      console.error('Error updating setting:', error);
      res.status(500).json({ success: false, message: 'Failed to update setting', error: error.message });
    }
  },

  // Get registration settings (API)
  async getRegistrationSettings(req, res) {
    try {
      const settingsQuery = await pool.query(`
        SELECT config_key, config_value 
        FROM pricing_config 
        WHERE config_key IN ('give_default_credits', 'default_user_credits')
      `);
      
      const settings = {
        give_default_credits: true,
        default_user_credits: 100
      };
      
      settingsQuery.rows.forEach(row => {
        if (row.config_key === 'give_default_credits') {
          settings.give_default_credits = parseFloat(row.config_value) === 1;
        } else if (row.config_key === 'default_user_credits') {
          settings.default_user_credits = parseFloat(row.config_value) || 100;
        }
      });
      
      res.json({ success: true, settings });
    } catch (error) {
      console.error('Error getting registration settings:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to load settings', 
        error: error.message 
      });
    }
  },

  // Update registration settings (API)
  async updateRegistrationSettings(req, res) {
    try {
      const { give_default_credits, default_user_credits } = req.body;
      
      console.log('📝 Updating registration settings:', {
        give_default_credits,
        default_user_credits
      });
      
      // Validate
      if (typeof give_default_credits !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'give_default_credits must be a boolean'
        });
      }
      
      if (typeof default_user_credits !== 'number' || default_user_credits < 0) {
        return res.status(400).json({
          success: false,
          message: 'default_user_credits must be a positive number'
        });
      }
      
      // Update give_default_credits (1 = true, 0 = false)
      await pool.query(`
        INSERT INTO pricing_config (config_key, config_value, description, updated_by)
        VALUES ('give_default_credits', $1, 'Give credits to new users on registration', $2)
        ON CONFLICT (config_key) 
        DO UPDATE SET config_value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
      `, [give_default_credits ? 1 : 0, req.user?.id]);
      
      // Update default_user_credits
      await pool.query(`
        INSERT INTO pricing_config (config_key, config_value, description, updated_by)
        VALUES ('default_user_credits', $1, 'Default credits amount for new users', $2)
        ON CONFLICT (config_key) 
        DO UPDATE SET config_value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
      `, [default_user_credits, req.user?.id]);
      
      console.log('✅ Registration settings updated successfully');
      
      res.json({ 
        success: true, 
        message: 'Registration settings updated successfully',
        settings: {
          give_default_credits,
          default_user_credits
        }
      });
    } catch (error) {
      console.error('Error updating registration settings:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update settings', 
        error: error.message 
      });
    }
  },

  // ============ FAL.AI BALANCE ============
  
  async getFalBalance(req, res) {
    try {
      const stats = await Admin.getDashboardStats();
      
      // Get FAL.AI API config
      const apiConfig = await Admin.getApiConfigWithKeys('FAL_AI');
      
      // Get recent generations
      const { pool } = require('../config/database');
      const recentQuery = `
        SELECT g.*, u.name as user_name
        FROM ai_generation_history g
        LEFT JOIN users u ON g.user_id = u.id
        ORDER BY g.created_at DESC
        LIMIT 20
      `;
      const recentResult = await pool.query(recentQuery);
      
      res.render('admin/fal-balance', {
        title: 'FAL.AI Balance & Usage',
        pageTitle: 'FAL.AI Balance & Usage',
        user: req.user,
        stats,
        apiConfig,
        recentGenerations: recentResult.rows
      });
    } catch (error) {
      console.error('Error loading FAL balance:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to load FAL balance',
        error: process.env.NODE_ENV === 'development' ? error : null,
        stack: process.env.NODE_ENV === 'development' ? error.stack : null
      });
    }
  },

  // ============ AI MODELS MANAGEMENT ============
  
  // Show models management page
  async getModels(req, res) {
    try {
      res.render('admin/models', {
        title: 'AI Models Management',
        pageTitle: 'AI Models Management',
        user: req.user,
        currentPath: req.path
      });
    } catch (error) {
      console.error('Error loading models page:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to load models page',
        error: process.env.NODE_ENV === 'development' ? error : null,
        stack: process.env.NODE_ENV === 'development' ? error.stack : null
      });
    }
  },

  // Get all models (API)
  async getModelsAPI(req, res) {
    try {
      const { pool } = require('../config/database');
      
      // Get all models
      const modelsResult = await pool.query(`
        SELECT * FROM ai_models
        ORDER BY 
          CASE WHEN viral THEN 0 ELSE 1 END,
          CASE WHEN trending THEN 0 ELSE 1 END,
          name ASC
      `);

      // Get stats
      const statsResult = await pool.query(`
        SELECT * FROM models_stats
      `);

      res.json({
        success: true,
        models: modelsResult.rows,
        stats: statsResult.rows[0]
      });
    } catch (error) {
      console.error('Error getting models:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving models'
      });
    }
  },

  // Add new model (API)
  async addModel(req, res) {
    try {
      const { pool } = require('../config/database');
      const {
        model_id,
        name,
        provider,
        description,
        category,
        type,
        trending,
        viral,
        speed,
        quality,
        max_duration,
        cost,
        fal_price,
        pricing_type,
        is_active,
        is_custom,
        prompt_required, // ✨ NEW: Whether model requires text prompt
        pricing_structure,
        metadata, // ✨ Advanced configuration metadata
        // ✨ Duration configuration
        available_durations,
        price_per_second,
        // Per-pixel pricing
        price_per_pixel,
        base_resolution,
        max_upscale_factor,
        // Per-megapixel pricing
        price_per_megapixel,
        base_megapixels,
        max_megapixels,
        // Multi-tier pricing
        has_multi_tier_pricing,
        price_text_to_video_no_audio,
        price_text_to_video_with_audio,
        price_image_to_video_no_audio,
        price_image_to_video_with_audio,
        // 3D modeling pricing
        base_3d_price,
        quality_multiplier,
        // Resolution-based pricing
        price_sd,
        price_hd,
        price_2k,
        price_4k,
        // ✨ NEW BADGE: Badge configuration
        show_new_badge,
        new_badge_until,
        // ✨ NEW PRICING TYPES - stored in metadata
        // Per Image pricing
        price_per_image,
        // Per Token pricing
        input_token_price,
        output_token_price,
        // Per Character pricing
        price_per_character,
        max_characters,
        // Per 1K Characters pricing
        price_per_1k_chars,
        min_chars_bulk,
        // Per Minute pricing
        price_per_minute,
        max_duration_minutes,
        // Per Request pricing
        price_per_request,
        includes_retries,
        // Per Duration pricing (tiered)
        price_4s,
        price_6s,
        price_8s,
        price_10s,
        price_15s,
        price_20s,
        // Tiered Usage pricing
        tier1_price,
        tier2_price,
        tier3_price,
        tier_unit_type
      } = req.body;

      // Validate required fields
      if (!model_id || !name || !category || !type) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Check if model already exists
      const existing = await pool.query(
        'SELECT id FROM ai_models WHERE model_id = $1',
        [model_id]
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Model with this ID already exists'
        });
      }

      // ===== PRICING VALIDATION (SMART SYSTEM) =====
      const { validatePricing } = require('../utils/pricingValidator');
      
      // Build enhanced metadata for new pricing types
      const enhancedMetadata = { ...(metadata || {}) };
      
      // Store new pricing fields in metadata based on pricing_structure
      if (pricing_structure === 'per_image' && price_per_image) {
        enhancedMetadata.price_per_image = parseFloat(price_per_image);
      } else if (pricing_structure === 'per_token' && (input_token_price || output_token_price)) {
        if (input_token_price) enhancedMetadata.input_token_price = parseFloat(input_token_price);
        if (output_token_price) enhancedMetadata.output_token_price = parseFloat(output_token_price);
      } else if (pricing_structure === 'per_character' && price_per_character) {
        enhancedMetadata.price_per_character = parseFloat(price_per_character);
        if (max_characters) enhancedMetadata.max_characters = parseInt(max_characters);
      } else if (pricing_structure === 'per_1k_chars' && price_per_1k_chars) {
        enhancedMetadata.price_per_1k_chars = parseFloat(price_per_1k_chars);
        if (min_chars_bulk) enhancedMetadata.min_chars_bulk = parseInt(min_chars_bulk);
      } else if (pricing_structure === 'per_minute' && price_per_minute) {
        enhancedMetadata.price_per_minute = parseFloat(price_per_minute);
        if (max_duration_minutes) enhancedMetadata.max_duration_minutes = parseInt(max_duration_minutes);
      } else if (pricing_structure === 'per_request' && price_per_request) {
        enhancedMetadata.price_per_request = parseFloat(price_per_request);
        if (includes_retries !== undefined) enhancedMetadata.includes_retries = Boolean(includes_retries);
      } else if (pricing_structure === 'per_duration' && (price_4s || price_6s || price_8s || price_10s || price_15s || price_20s)) {
        if (price_4s) enhancedMetadata.price_4s = parseFloat(price_4s);
        if (price_6s) enhancedMetadata.price_6s = parseFloat(price_6s);
        if (price_8s) enhancedMetadata.price_8s = parseFloat(price_8s);
        if (price_10s) enhancedMetadata.price_10s = parseFloat(price_10s);
        if (price_15s) enhancedMetadata.price_15s = parseFloat(price_15s);
        if (price_20s) enhancedMetadata.price_20s = parseFloat(price_20s);
      } else if (pricing_structure === 'tiered_usage' && (tier1_price || tier2_price || tier3_price)) {
        if (tier1_price) enhancedMetadata.tier1_price = parseFloat(tier1_price);
        if (tier2_price) enhancedMetadata.tier2_price = parseFloat(tier2_price);
        if (tier3_price) enhancedMetadata.tier3_price = parseFloat(tier3_price);
        if (tier_unit_type) enhancedMetadata.tier_unit_type = tier_unit_type;
      }
      
      const validation = validatePricing({
        name: name,
        type: type,
        fal_price: cost,
        max_duration: max_duration,
        pricing_type: req.body.pricing_type || 'flat',
        metadata: enhancedMetadata
      });
      
      // Log warnings to console for admin awareness
      if (validation.warnings.length > 0) {
        console.log('\n⚠️  PRICING WARNINGS for ' + name + ':');
        validation.warnings.forEach(w => console.log('   ' + w));
      }
      
      // Block if there are critical errors
      if (!validation.valid) {
        console.log('\n❌ PRICING ERRORS for ' + name + ':');
        validation.errors.forEach(e => console.log('   ' + e));
        
        return res.status(400).json({
          success: false,
          message: 'Pricing validation failed',
          errors: validation.errors,
          warnings: validation.warnings,
          suggestions: validation.suggestions,
          calculated: validation.calculated
        });
      }
      
      console.log('✅ Pricing validated for ' + name);
      if (validation.calculated) {
        console.log('   Credits:', validation.calculated.credits);
        console.log('   Profit:', validation.calculated.profitMargin);
      }

      // ===== FAL.AI API VERIFICATION =====
      let falVerification = {
        verified: false,
        message: 'Not verified with FAL.AI API',
        fal_price: null
      };

      try {
        console.log('🔌 Verifying model with FAL.AI API...');
        const falRealtime = require('../services/falAiRealtime');
        
        // Check if FAL.AI API is configured
        const apiStatus = await falRealtime.verifyApiConnection();
        
        if (apiStatus.connected) {
          // Try to verify model exists in FAL.AI
          try {
            const modelPricing = await falRealtime.fetchModelPricing(model_id);
            
            if (modelPricing && modelPricing.price) {
              falVerification = {
                verified: true,
                message: 'Verified with FAL.AI API',
                fal_price: modelPricing.price,
                pricing_type: modelPricing.type || 'flat',
                max_duration: modelPricing.max_duration || max_duration
              };
              console.log('✅ Model verified with FAL.AI API');
              console.log('   FAL Price: $' + modelPricing.price);
            } else {
              falVerification.message = 'Model not found in FAL.AI (custom model or new model)';
              console.log('⚠️  Model not found in FAL.AI - might be custom model');
            }
          } catch (modelError) {
            console.log('ℹ️  Could not fetch model pricing from FAL.AI:', modelError.message);
            falVerification.message = 'Could not verify model with FAL.AI API';
          }
        } else {
          console.log('⚠️  FAL.AI API not configured - skipping verification');
          falVerification.message = 'FAL.AI API not configured';
        }
      } catch (verifyError) {
        console.log('⚠️  FAL.AI verification error:', verifyError.message);
        falVerification.message = 'Verification failed: ' + verifyError.message;
      }

      // ✨ NEW BADGE: Calculate expiry date if badge is enabled
      let badgeExpiryDate = null;
      if (show_new_badge) {
        if (new_badge_until) {
          // Use provided expiry date
          badgeExpiryDate = new_badge_until;
        } else {
          // Set expiry to 30 days from now
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30);
          badgeExpiryDate = expiryDate.toISOString();
        }
        console.log('✨ NEW badge enabled for', name, 'until', badgeExpiryDate);
      }

      // Build dynamic insert query to handle all pricing structures
      const columns = [
        'model_id', 'name', 'provider', 'description', 'category', 'type',
        'trending', 'viral', 'speed', 'quality', 'max_duration', 'cost', 
        'fal_price', 'pricing_type', 'pricing_structure',
        'is_active', 'is_custom', 'prompt_required', 'added_by', 'fal_verified',
        'show_new_badge', 'new_badge_until'
      ];
      
      const values = [
        model_id,
        name,
        provider,
        description,
        category,
        type,
        trending || false,
        viral || false,
        speed,
        quality,
        falVerification.max_duration || max_duration,
        cost || 1,
        falVerification.fal_price || fal_price || null,
        falVerification.pricing_type || pricing_type || 'flat',
        pricing_structure || 'simple',
        is_active !== false,
        is_custom || true,
        prompt_required !== false, // Default to true
        req.user?.id || null,
        falVerification.verified,
        show_new_badge || false,
        badgeExpiryDate
      ];
      
      // ✨ Add metadata if provided (including enhanced pricing metadata)
      if (enhancedMetadata && Object.keys(enhancedMetadata).length > 0) {
        columns.push('metadata');
        // Ensure it's properly formatted as JSON
        const metadataJson = typeof enhancedMetadata === 'string' ? enhancedMetadata : JSON.stringify(enhancedMetadata);
        values.push(metadataJson);
      }
      
      // ✨ Add duration configuration (for video models)
      if (available_durations || price_per_second) {
        if (available_durations) {
          columns.push('available_durations');
          // Convert array to JSONB
          const durationsJson = Array.isArray(available_durations) 
            ? JSON.stringify(available_durations)
            : available_durations;
          values.push(durationsJson);
        }
        if (price_per_second) {
          columns.push('price_per_second');
          values.push(parseFloat(price_per_second));
        }
      }
      
      // Add pricing structure specific fields (database columns)
      if (pricing_structure === 'per_pixel') {
        columns.push('price_per_pixel', 'base_resolution', 'max_upscale_factor');
        values.push(price_per_pixel, base_resolution, max_upscale_factor);
      } else if (pricing_structure === 'per_megapixel') {
        columns.push('price_per_megapixel', 'base_megapixels', 'max_megapixels');
        values.push(price_per_megapixel, base_megapixels, max_megapixels);
      } else if (pricing_structure === 'multi_tier') {
        columns.push('has_multi_tier_pricing', 'price_text_to_video_no_audio', 'price_text_to_video_with_audio', 'price_image_to_video_no_audio', 'price_image_to_video_with_audio');
        values.push(true, price_text_to_video_no_audio, price_text_to_video_with_audio, price_image_to_video_no_audio, price_image_to_video_with_audio);
      } else if (pricing_structure === '3d_modeling') {
        columns.push('base_3d_price', 'quality_multiplier');
        values.push(base_3d_price, quality_multiplier);
      } else if (pricing_structure === 'resolution_based') {
        columns.push('price_sd', 'price_hd', 'price_2k', 'price_4k');
        values.push(price_sd, price_hd, price_2k, price_4k);
      }
      // Note: New pricing types (per_image, per_token, per_character, per_1k_chars, per_minute, per_request, per_duration, tiered_usage) are stored in metadata
      
      // Generate placeholders ($1, $2, $3, ...)
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      
      // Insert new model
      const result = await pool.query(`
        INSERT INTO ai_models (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `, values);

      res.json({
        success: true,
        message: 'Model added successfully',
        model: result.rows[0],
        fal_verification: falVerification
      });
    } catch (error) {
      console.error('Error adding model:', error);
      res.status(500).json({
        success: false,
        message: 'Error adding model'
      });
    }
  },

  // Update model (API)
  async updateModel(req, res) {
    try {
      const { pool } = require('../config/database');
      const { id } = req.params;
      
      // Check if model exists first
      const existing = await pool.query(
        'SELECT * FROM ai_models WHERE id = $1',
        [id]
      );

      if (existing.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Model not found'
        });
      }

      const currentModel = existing.rows[0];
      
      // Handle partial updates (e.g., just updating cost/credits)
      if (Object.keys(req.body).length === 1 && req.body.cost !== undefined) {
        const newCost = parseFloat(req.body.cost) || 1;
        
        console.log(`🔄 Updating model ${id} cost: ${currentModel.cost} → ${newCost}`);
        
        // Quick credit update
      const result = await pool.query(`
        UPDATE ai_models SET
            cost = $1,
          updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        RETURNING *
        `, [newCost, id]);

        console.log(`✅ Updated model cost in DB:`, result.rows[0]?.cost);

        return res.json({
          success: true,
          message: 'Credits updated successfully',
          model: result.rows[0],
          debug: {
            oldCost: currentModel.cost,
            newCost: newCost,
            updatedCost: result.rows[0]?.cost
          }
        });
      }

      // Full model update
      const {
        model_id,
        name,
        provider,
        description,
        category,
        type,
        trending,
        viral,
        speed,
        quality,
        max_duration,
        cost,
        fal_price,
        is_active,
        prompt_required, // ✨ NEW: Whether model requires text prompt
        metadata, // ✨ Advanced configuration metadata
        // Pricing fields
        pricing_type,
        pricing_structure,
        has_multi_tier_pricing,
        // ✨ Duration configuration
        available_durations,
        price_per_second,
        // Multi-tier pricing fields
        price_text_to_video_no_audio,
        price_text_to_video_with_audio,
        price_image_to_video_no_audio,
        price_image_to_video_with_audio,
        // Per-pixel pricing
        price_per_pixel,
        base_resolution,
        max_upscale_factor,
        // Per-megapixel pricing
        price_per_megapixel,
        base_megapixels,
        max_megapixels,
        // 3D modeling pricing
        base_3d_price,
        quality_multiplier,
        // Resolution-based pricing
        price_sd,
        price_hd,
        price_2k,
        price_4k,
        // ✨ NEW BADGE: Badge configuration  
        show_new_badge,
        new_badge_until,
        // ✨ NEW PRICING TYPES - stored in metadata
        // Per Image pricing
        price_per_image,
        // Per Token pricing
        input_token_price,
        output_token_price,
        // Per Character pricing
        price_per_character,
        max_characters,
        // Per 1K Characters pricing
        price_per_1k_chars,
        min_chars_bulk,
        // Per Minute pricing
        price_per_minute,
        max_duration_minutes,
        // Per Request pricing
        price_per_request,
        includes_retries,
        // Per Duration pricing (tiered)
        price_4s,
        price_6s,
        price_8s,
        price_10s,
        price_15s,
        price_20s,
        // Tiered Usage pricing
        tier1_price,
        tier2_price,
        tier3_price,
        tier_unit_type
      } = req.body;

      // Build dynamic update query
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (model_id !== undefined) {
        fields.push(`model_id = $${paramCount}`);
        values.push(model_id);
        paramCount++;
      }
      if (name !== undefined) {
        fields.push(`name = $${paramCount}`);
        values.push(name);
        paramCount++;
      }
      if (provider !== undefined) {
        fields.push(`provider = $${paramCount}`);
        values.push(provider);
        paramCount++;
      }
      if (description !== undefined) {
        fields.push(`description = $${paramCount}`);
        values.push(description);
        paramCount++;
      }
      if (category !== undefined) {
        fields.push(`category = $${paramCount}`);
        values.push(category);
        paramCount++;
      }
      if (type !== undefined) {
        fields.push(`type = $${paramCount}`);
        values.push(type);
        paramCount++;
      }
      if (trending !== undefined) {
        fields.push(`trending = $${paramCount}`);
        values.push(trending || false);
        paramCount++;
      }
      if (viral !== undefined) {
        fields.push(`viral = $${paramCount}`);
        values.push(viral || false);
        paramCount++;
      }
      if (prompt_required !== undefined) {
        fields.push(`prompt_required = $${paramCount}`);
        values.push(prompt_required !== false); // Default to true
        paramCount++;
      }

      // ✨ NEW BADGE: Handle badge updates
      if (show_new_badge !== undefined) {
        fields.push(`show_new_badge = $${paramCount}`);
        values.push(show_new_badge);
        paramCount++;
        
        // Handle expiry date logic
        if (show_new_badge && !new_badge_until) {
          // If enabling badge without expiry date, set 30 days from now
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30);
          fields.push(`new_badge_until = $${paramCount}`);
          values.push(expiryDate.toISOString());
          paramCount++;
          console.log('✨ NEW badge enabled for model', id, 'until', expiryDate.toISOString());
        } else if (!show_new_badge) {
          // If disabling badge, clear expiry date
          fields.push(`new_badge_until = $${paramCount}`);
          values.push(null);
          paramCount++;
          console.log('✨ NEW badge disabled for model', id);
        }
      }
      
      if (new_badge_until !== undefined && show_new_badge) {
        fields.push(`new_badge_until = $${paramCount}`);
        values.push(new_badge_until);
        paramCount++;
        console.log('✨ NEW badge expiry updated for model', id, 'until', new_badge_until);
      }

      if (speed !== undefined) {
        fields.push(`speed = $${paramCount}`);
        values.push(speed);
        paramCount++;
      }
      if (quality !== undefined) {
        fields.push(`quality = $${paramCount}`);
        values.push(quality);
        paramCount++;
      }
      if (max_duration !== undefined) {
        fields.push(`max_duration = $${paramCount}`);
        values.push(max_duration);
        paramCount++;
      }
      if (cost !== undefined) {
        fields.push(`cost = $${paramCount}`);
        values.push(parseFloat(cost) || 1);
        paramCount++;
      }
      if (fal_price !== undefined) {
        fields.push(`fal_price = $${paramCount}`);
        values.push(parseFloat(fal_price) || null);
        paramCount++;
      }
      if (is_active !== undefined) {
        fields.push(`is_active = $${paramCount}`);
        values.push(is_active !== false);
        paramCount++;
      }
      
      // ===== PRICING FIELDS =====
      if (pricing_type !== undefined) {
        fields.push(`pricing_type = $${paramCount}`);
        values.push(pricing_type);
        paramCount++;
      }
      if (pricing_structure !== undefined) {
        fields.push(`pricing_structure = $${paramCount}`);
        values.push(pricing_structure);
        paramCount++;
      }
      if (has_multi_tier_pricing !== undefined) {
        fields.push(`has_multi_tier_pricing = $${paramCount}`);
        values.push(has_multi_tier_pricing || false);
        paramCount++;
      }
      
      // ✨ Duration configuration
      if (available_durations !== undefined) {
        fields.push(`available_durations = $${paramCount}`);
        // Convert array to JSONB
        const durationsJson = Array.isArray(available_durations) 
          ? JSON.stringify(available_durations)
          : (available_durations === null ? null : available_durations);
        values.push(durationsJson);
        paramCount++;
      }
      if (price_per_second !== undefined) {
        fields.push(`price_per_second = $${paramCount}`);
        values.push(price_per_second === null ? null : parseFloat(price_per_second));
        paramCount++;
      }
      
      // Multi-tier pricing
      if (price_text_to_video_no_audio !== undefined) {
        fields.push(`price_text_to_video_no_audio = $${paramCount}`);
        values.push(parseFloat(price_text_to_video_no_audio) || null);
        paramCount++;
      }
      if (price_text_to_video_with_audio !== undefined) {
        fields.push(`price_text_to_video_with_audio = $${paramCount}`);
        values.push(parseFloat(price_text_to_video_with_audio) || null);
        paramCount++;
      }
      if (price_image_to_video_no_audio !== undefined) {
        fields.push(`price_image_to_video_no_audio = $${paramCount}`);
        values.push(parseFloat(price_image_to_video_no_audio) || null);
        paramCount++;
      }
      if (price_image_to_video_with_audio !== undefined) {
        fields.push(`price_image_to_video_with_audio = $${paramCount}`);
        values.push(parseFloat(price_image_to_video_with_audio) || null);
        paramCount++;
      }
      
      // Per-pixel pricing
      if (price_per_pixel !== undefined) {
        fields.push(`price_per_pixel = $${paramCount}`);
        values.push(parseFloat(price_per_pixel) || null);
        paramCount++;
      }
      if (base_resolution !== undefined) {
        fields.push(`base_resolution = $${paramCount}`);
        values.push(base_resolution);
        paramCount++;
      }
      if (max_upscale_factor !== undefined) {
        fields.push(`max_upscale_factor = $${paramCount}`);
        values.push(parseFloat(max_upscale_factor) || null);
        paramCount++;
      }
      
      // Per-megapixel pricing
      if (price_per_megapixel !== undefined) {
        fields.push(`price_per_megapixel = $${paramCount}`);
        values.push(parseFloat(price_per_megapixel) || null);
        paramCount++;
      }
      if (base_megapixels !== undefined) {
        fields.push(`base_megapixels = $${paramCount}`);
        values.push(parseFloat(base_megapixels) || null);
        paramCount++;
      }
      if (max_megapixels !== undefined) {
        fields.push(`max_megapixels = $${paramCount}`);
        values.push(parseFloat(max_megapixels) || null);
        paramCount++;
      }
      
      // 3D modeling pricing
      if (base_3d_price !== undefined) {
        fields.push(`base_3d_price = $${paramCount}`);
        values.push(parseFloat(base_3d_price) || null);
        paramCount++;
      }
      if (quality_multiplier !== undefined) {
        fields.push(`quality_multiplier = $${paramCount}`);
        values.push(parseFloat(quality_multiplier) || null);
        paramCount++;
      }
      
      // Resolution-based pricing
      if (price_sd !== undefined) {
        fields.push(`price_sd = $${paramCount}`);
        values.push(parseFloat(price_sd) || null);
        paramCount++;
      }
      if (price_hd !== undefined) {
        fields.push(`price_hd = $${paramCount}`);
        values.push(parseFloat(price_hd) || null);
        paramCount++;
      }
      if (price_2k !== undefined) {
        fields.push(`price_2k = $${paramCount}`);
        values.push(parseFloat(price_2k) || null);
        paramCount++;
      }
      if (price_4k !== undefined) {
        fields.push(`price_4k = $${paramCount}`);
        values.push(parseFloat(price_4k) || null);
        paramCount++;
      }
      
      // ✨ Build enhanced metadata for new pricing types
      let enhancedMetadata = null;
      if (metadata !== undefined || pricing_structure) {
        enhancedMetadata = { ...(currentModel.metadata || {}), ...(metadata || {}) };
        
        // Store new pricing fields in metadata based on pricing_structure
        if (pricing_structure === 'per_image' && price_per_image !== undefined) {
          enhancedMetadata.price_per_image = price_per_image ? parseFloat(price_per_image) : null;
        } else if (pricing_structure === 'per_token' && (input_token_price !== undefined || output_token_price !== undefined)) {
          if (input_token_price !== undefined) enhancedMetadata.input_token_price = input_token_price ? parseFloat(input_token_price) : null;
          if (output_token_price !== undefined) enhancedMetadata.output_token_price = output_token_price ? parseFloat(output_token_price) : null;
        } else if (pricing_structure === 'per_character' && price_per_character !== undefined) {
          enhancedMetadata.price_per_character = price_per_character ? parseFloat(price_per_character) : null;
          if (max_characters !== undefined) enhancedMetadata.max_characters = max_characters ? parseInt(max_characters) : null;
        } else if (pricing_structure === 'per_1k_chars' && price_per_1k_chars !== undefined) {
          enhancedMetadata.price_per_1k_chars = price_per_1k_chars ? parseFloat(price_per_1k_chars) : null;
          if (min_chars_bulk !== undefined) enhancedMetadata.min_chars_bulk = min_chars_bulk ? parseInt(min_chars_bulk) : null;
        } else if (pricing_structure === 'per_minute' && price_per_minute !== undefined) {
          enhancedMetadata.price_per_minute = price_per_minute ? parseFloat(price_per_minute) : null;
          if (max_duration_minutes !== undefined) enhancedMetadata.max_duration_minutes = max_duration_minutes ? parseInt(max_duration_minutes) : null;
        } else if (pricing_structure === 'per_request' && price_per_request !== undefined) {
          enhancedMetadata.price_per_request = price_per_request ? parseFloat(price_per_request) : null;
          if (includes_retries !== undefined) enhancedMetadata.includes_retries = Boolean(includes_retries);
        } else if (pricing_structure === 'per_duration' && (price_4s !== undefined || price_6s !== undefined || price_8s !== undefined || price_10s !== undefined || price_15s !== undefined || price_20s !== undefined)) {
          if (price_4s !== undefined) enhancedMetadata.price_4s = price_4s ? parseFloat(price_4s) : null;
          if (price_6s !== undefined) enhancedMetadata.price_6s = price_6s ? parseFloat(price_6s) : null;
          if (price_8s !== undefined) enhancedMetadata.price_8s = price_8s ? parseFloat(price_8s) : null;
          if (price_10s !== undefined) enhancedMetadata.price_10s = price_10s ? parseFloat(price_10s) : null;
          if (price_15s !== undefined) enhancedMetadata.price_15s = price_15s ? parseFloat(price_15s) : null;
          if (price_20s !== undefined) enhancedMetadata.price_20s = price_20s ? parseFloat(price_20s) : null;
        } else if (pricing_structure === 'tiered_usage' && (tier1_price !== undefined || tier2_price !== undefined || tier3_price !== undefined)) {
          if (tier1_price !== undefined) enhancedMetadata.tier1_price = tier1_price ? parseFloat(tier1_price) : null;
          if (tier2_price !== undefined) enhancedMetadata.tier2_price = tier2_price ? parseFloat(tier2_price) : null;
          if (tier3_price !== undefined) enhancedMetadata.tier3_price = tier3_price ? parseFloat(tier3_price) : null;
          if (tier_unit_type !== undefined) enhancedMetadata.tier_unit_type = tier_unit_type || null;
        }
        
        // Update metadata in database
        fields.push(`metadata = $${paramCount}`);
        const metadataJson = enhancedMetadata === null ? null : (typeof enhancedMetadata === 'string' ? enhancedMetadata : JSON.stringify(enhancedMetadata));
        values.push(metadataJson);
        paramCount++;
      }

      // Always update timestamp
      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      
      // Add ID for WHERE clause
      values.push(id);
      const whereParam = `$${paramCount}`;

      if (fields.length === 1) {
        // Only timestamp update, no actual changes
        return res.json({
          success: true,
          message: 'No changes made',
          model: currentModel
        });
      }

      const query = `
        UPDATE ai_models SET
          ${fields.join(', ')}
        WHERE id = ${whereParam}
        RETURNING *
      `;

      const result = await pool.query(query, values);

      res.json({
        success: true,
        message: 'Model updated successfully',
        model: result.rows[0]
      });
      
    } catch (error) {
      console.error('Error updating model:', error);
      console.error('Request body:', req.body);
      console.error('Model ID:', req.params.id);
      
      res.status(500).json({
        success: false,
        message: 'Error updating model: ' + error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  // Toggle model status (API)
  async toggleModelStatus(req, res) {
    try {
      const { pool } = require('../config/database');
      const { id } = req.params;

      const result = await pool.query(`
        UPDATE ai_models 
        SET is_active = NOT is_active,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Model not found'
        });
      }

      res.json({
        success: true,
        message: 'Model status updated',
        model: result.rows[0]
      });
    } catch (error) {
      console.error('Error toggling model status:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating status'
      });
    }
  },

  // Add Suno models with custom pricing (API)
  async addSunoModelsCustom(req, res) {
    try {
      const { pool } = require('../config/database');
      const { models } = req.body;

      if (!models || !Array.isArray(models)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid models data. Expected array of models.'
        });
      }

      let added = 0;
      let updated = 0;
      let skipped = 0;
      const errors = [];

      for (const model of models) {
        try {
          // Check if model exists
          const existing = await pool.query(
            'SELECT id FROM ai_models WHERE model_id = $1',
            [model.model_id]
          );

          if (existing.rows.length > 0) {
            // Update existing
            const updateQuery = `
              UPDATE ai_models SET
                name = $1, provider = $2, description = $3, category = $4,
                type = $5, trending = $6, viral = $7, speed = $8,
                quality = $9, max_duration = $10, cost = $11, fal_price = $12,
                pricing_type = $13, is_active = $14, is_custom = $15,
                metadata = $16, updated_at = NOW()
              WHERE model_id = $17
            `;
            
            await pool.query(updateQuery, [
              model.name, model.provider, model.description, model.category,
              model.type, model.trending, model.viral, model.speed,
              model.quality, model.max_duration, model.cost, model.fal_price,
              model.pricing_type, model.is_active, model.is_custom,
              JSON.stringify(model.metadata), model.model_id
            ]);
            
            updated++;
          } else {
            // Insert new
            const insertQuery = `
              INSERT INTO ai_models (
                model_id, name, provider, description, category, type,
                trending, viral, speed, quality, max_duration, cost,
                fal_price, pricing_type, is_active, is_custom, metadata,
                created_at, updated_at
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW()
              )
            `;
            
            await pool.query(insertQuery, [
              model.model_id, model.name, model.provider, model.description,
              model.category, model.type, model.trending, model.viral,
              model.speed, model.quality, model.max_duration, model.cost,
              model.fal_price, model.pricing_type, model.is_active, model.is_custom,
              JSON.stringify(model.metadata)
            ]);
            
            added++;
          }
        } catch (error) {
          console.error(`Error with model ${model.model_id}:`, error.message);
          errors.push({ model_id: model.model_id, error: error.message });
          skipped++;
        }
      }

      res.json({
        success: true,
        message: `Suno models added with custom pricing`,
        added,
        updated,
        skipped,
        total: models.length,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      console.error('Error adding Suno models with custom pricing:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to add Suno models'
      });
    }
  },

  // Add Suno models (API) - Legacy endpoint
  async addSunoModels(req, res) {
    try {
      const { pool } = require('../config/database');
      const sunoModels = require('../data/sunoModels');
      
      let added = 0;
      let updated = 0;
      let skipped = 0;
      const errors = [];

      for (const model of sunoModels) {
        try {
          // Check if model exists
          const existing = await pool.query(
            'SELECT id FROM ai_models WHERE model_id = $1',
            [model.model_id]
          );

          if (existing.rows.length > 0) {
            // Update existing
            const updateQuery = `
              UPDATE ai_models SET
                name = $1, provider = $2, description = $3, category = $4,
                type = $5, trending = $6, viral = $7, speed = $8,
                quality = $9, max_duration = $10, cost = $11, fal_price = $12,
                pricing_type = $13, is_active = $14, is_custom = $15,
                metadata = $16, updated_at = NOW()
              WHERE model_id = $17
            `;
            
            await pool.query(updateQuery, [
              model.name, model.provider, model.description, model.category,
              model.type, model.trending, model.viral, model.speed,
              model.quality, model.max_duration, model.cost, model.fal_price,
              model.pricing_type, model.is_active, model.is_custom,
              JSON.stringify(model.metadata), model.model_id
            ]);
            
            updated++;
          } else {
            // Insert new
            const insertQuery = `
              INSERT INTO ai_models (
                model_id, name, provider, description, category, type,
                trending, viral, speed, quality, max_duration, cost,
                fal_price, pricing_type, is_active, is_custom, metadata,
                created_at, updated_at
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW()
              )
            `;
            
            await pool.query(insertQuery, [
              model.model_id, model.name, model.provider, model.description,
              model.category, model.type, model.trending, model.viral,
              model.speed, model.quality, model.max_duration, model.cost,
              model.fal_price, model.pricing_type, model.is_active, model.is_custom,
              JSON.stringify(model.metadata)
            ]);
            
            added++;
          }
        } catch (error) {
          console.error(`Error with model ${model.model_id}:`, error.message);
          errors.push({ model_id: model.model_id, error: error.message });
          skipped++;
        }
      }

      res.json({
        success: true,
        message: `Suno models populated successfully`,
        added,
        updated,
        skipped,
        total: sunoModels.length,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      console.error('Error adding Suno models:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to add Suno models'
      });
    }
  },

  // Delete model (API)
  async deleteModel(req, res) {
    try {
      const { pool } = require('../config/database');
      const { id } = req.params;
      const { force } = req.query; // Allow force delete with ?force=true

      // Get model details
      const model = await pool.query(
        'SELECT id, name, is_custom FROM ai_models WHERE id = $1',
        [id]
      );

      if (model.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Model not found'
        });
      }

      const modelData = model.rows[0];

      // Check if it's a custom model or force delete is enabled
      if (!modelData.is_custom && force !== 'true') {
        return res.status(400).json({
          success: false,
          message: 'This is a default FAL.AI model. Please deactivate instead of deleting, or use force delete.',
          is_custom: false,
          model_name: modelData.name
        });
      }

      // Delete the model
      await pool.query('DELETE FROM ai_models WHERE id = $1', [id]);

      console.log(`🗑️ Model deleted: ${modelData.name} (ID: ${id}, Custom: ${modelData.is_custom})`);

      res.json({
        success: true,
        message: `Model "${modelData.name}" deleted successfully`,
        was_custom: modelData.is_custom
      });
    } catch (error) {
      console.error('Error deleting model:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting model: ' + error.message
      });
    }
  },

  // ============ FAL.AI MODEL BROWSER ============

  // Test FAL.AI API connection
  async testFalApiConnection(req, res) {
    try {
      const falRealtime = require('../services/falAiRealtime');
      const apiStatus = await falRealtime.verifyApiConnection();
      
      res.json({
        success: true,
        ...apiStatus
      });
    } catch (error) {
      console.error('Error testing FAL.AI API connection:', error);
      res.status(500).json({
        success: false,
        connected: false,
        error: error.message,
        message: 'Failed to test API connection'
      });
    }
  },

  // Browse models from fal.ai (Real-time API)
  async browseFalModels(req, res) {
    try {
      const falRealtime = require('../services/falAiRealtime');
      const { query, type, limit, source } = req.query;
      
      // source: 'curated' (default, 100+ models) or 'all' (curated + scraped)
      // Note: 'all' requires cheerio package for web scraping
      const modelSource = source || 'curated';

      let models;
      if (query && query.trim()) {
        // Search models with query
        models = await falRealtime.searchModels(query, type, parseInt(limit) || 50);
      } else {
        if (type && type !== 'all') {
          // Filter by type
          models = await falRealtime.searchModels('', type, parseInt(limit) || 50);
        } else {
          // Get all models (curated or all)
          models = await falRealtime.fetchAllModels(false, modelSource);
          if (limit) {
            models = models.slice(0, parseInt(limit));
          }
        }
      }

      // Get API connection status
      const apiStatus = await falRealtime.getApiStatus();
      
      // Check if cheerio is available for scraping
      let cheerioAvailable = false;
      try {
        require.resolve('cheerio');
        cheerioAvailable = true;
      } catch (e) {
        cheerioAvailable = false;
      }

      res.json({
        success: true,
        count: models.length,
        models,
        source: modelSource,
        is_curated: modelSource === 'curated',
        total_available: modelSource === 'curated' ? '100+' : models.length,
        last_sync: new Date().toISOString(),
        api_status: apiStatus,
        scraping_available: cheerioAvailable,
        scraping_note: !cheerioAvailable ? 'Install cheerio package to enable web scraping: npm install cheerio' : null
      });
    } catch (error) {
      console.error('Error browsing fal.ai models:', error);
      res.status(500).json({
        success: false,
        message: 'Error browsing models: ' + error.message
      });
    }
  },

  // Get model details from fal.ai (Real-time)
  async getFalModelDetails(req, res) {
    try {
      const falRealtime = require('../services/falAiRealtime');
      const { modelId } = req.params;

      const model = await falRealtime.getModelDetails(modelId);

      res.json({
        success: true,
        model,
        source: 'real-time FAL.AI API'
      });
    } catch (error) {
      console.error('Error getting fal.ai model details:', error);
      res.status(500).json({
          success: false,
        message: error.message === `Model ${req.params.modelId} not found` ? 'Model not found' : 'Error getting model details'
      });
    }
  },

  // Sync FAL.AI models to database with AUTO PRICE VERIFICATION
  async syncFalModels(req, res) {
    try {
      const falRealtime = require('../services/falAiRealtime');
      const { pool } = require('../config/database');
      
      console.log('🔄 Starting FAL.AI sync with auto-pricing verification...');
      
      // Step 1: Sync models from FAL.AI
      const result = await falRealtime.syncToDatabase();
      console.log(`✅ Synced ${result.synced}/${result.total} models`);

      // Step 2: AUTO VERIFY & FIX PRICING
      console.log('🔍 Verifying pricing for all models...');
      
      // Simple pricing formula: Credits = Price × 10
      function calculateCorrectCredits(falPriceUSD) {
        if (!falPriceUSD || falPriceUSD <= 0) return 0.1;
        return Math.max(0.1, Math.round(falPriceUSD * 10 * 10) / 10);
      }
      
      // Get all models and check pricing
      const modelsResult = await pool.query(`
        SELECT id, name, fal_price, cost, type 
        FROM ai_models 
        WHERE fal_price IS NOT NULL AND fal_price > 0
        ORDER BY id
      `);
      
      let pricingFixed = 0;
      let pricingChecked = modelsResult.rows.length;
      const updates = [];
      
      for (const model of modelsResult.rows) {
        const currentCredits = parseFloat(model.cost) || 1;
        const correctCredits = calculateCorrectCredits(parseFloat(model.fal_price));
        
        // Check if pricing is significantly off (more than 0.1 credits difference)
        const difference = Math.abs(currentCredits - correctCredits);
        
        if (difference > 0.1) {
          // Fix the pricing
          await pool.query(
            'UPDATE ai_models SET cost = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [correctCredits, model.id]
          );
          
          pricingFixed++;
          updates.push({
            name: model.name,
            old: currentCredits.toFixed(1),
            new: correctCredits.toFixed(1)
          });
          
          console.log(`💰 Fixed: ${model.name} - $${parseFloat(model.fal_price).toFixed(3)} → ${correctCredits} credits (was ${currentCredits})`);
        }
      }

      console.log(`✅ Pricing verification complete: ${pricingFixed} models updated`);

      res.json({
        success: true,
        message: `Synced ${result.synced} models and verified pricing`,
        synced: result.synced,
        errors: result.errors,
        total: result.total,
        pricing: {
          checked: pricingChecked,
          fixed: pricingFixed,
          updates: updates.slice(0, 10) // Return first 10 for display
        }
      });
    } catch (error) {
      console.error('Error syncing FAL.AI models:', error);
      res.status(500).json({
        success: false,
        message: 'Error syncing models: ' + error.message
      });
    }
  },

  // Sync price for a single model from FAL.AI
  async syncModelPrice(req, res) {
    try {
      const { pool } = require('../config/database');
      const { id } = req.params;
      
      console.log(`🔄 Syncing price for model ID: ${id}`);
      
      // Get model with fal_price
      const modelResult = await pool.query(
        'SELECT id, name, fal_price, cost FROM ai_models WHERE id = $1',
        [id]
      );
      
      if (modelResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Model not found'
        });
      }
      
      const model = modelResult.rows[0];
      const falPrice = parseFloat(model.fal_price);
      
      if (!falPrice || falPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Model has no valid FAL.AI price to sync from'
        });
      }
      
      // Calculate correct credits using SIMPLE formula: Credits = Price × 10
      const correctCredits = Math.max(0.1, Math.round(falPrice * 10 * 10) / 10);
      const oldCredits = parseFloat(model.cost) || 1;
      
      // Update the model
      await pool.query(
        'UPDATE ai_models SET cost = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [correctCredits, id]
      );
      
      console.log(`✅ Price synced: ${model.name}`);
      console.log(`   FAL Price: $${falPrice.toFixed(3)}`);
      console.log(`   Old Credits: ${oldCredits}`);
      console.log(`   New Credits: ${correctCredits}`);
      
      res.json({
        success: true,
        message: `Price synced from FAL.AI: $${falPrice.toFixed(3)} → ${correctCredits} credits`,
        model: {
          id: model.id,
          name: model.name,
          fal_price: falPrice,
          old_cost: oldCredits,
          new_cost: correctCredits
        }
      });
    } catch (error) {
      console.error('Error syncing model price:', error);
      res.status(500).json({
        success: false,
        message: 'Error syncing price: ' + error.message
      });
    }
  },

  // Verify and update pricing using new formula
  async verifyPricing(req, res) {
    try {
      const { verifyAndUpdatePricing } = require('../scripts/updateModelPricing');
      
      // Run verification without auto-update (just analysis)
      const { pool } = require('../config/database');
      const IDR_PER_CREDIT = 500;
      const USD_TO_IDR = 16000;
      const MAX_REASONABLE_CREDITS = 20;

      function calculateCorrectCredits(falPriceUSD) {
        if (!falPriceUSD || falPriceUSD <= 0) return 1;
        const priceIDR = falPriceUSD * USD_TO_IDR;
        const credits = Math.max(0.5, Math.ceil(priceIDR / IDR_PER_CREDIT * 10) / 10);
        return Math.min(credits, MAX_REASONABLE_CREDITS);
      }

      function analyzePricing(currentCredits, falPrice) {
        const correctCredits = calculateCorrectCredits(falPrice);
        const difference = currentCredits - correctCredits;
        const percentDifference = correctCredits > 0 ? (difference / correctCredits * 100) : 0;
        
        return {
          currentCredits,
          correctCredits,
          difference,
          percentDifference: Math.round(percentDifference),
          shouldUpdate: Math.abs(percentDifference) > 20 || currentCredits > MAX_REASONABLE_CREDITS
        };
      }

      // Get all models
      const result = await pool.query(`
        SELECT id, model_id, name, provider, type, cost, fal_price, is_active
        FROM ai_models 
        ORDER BY cost DESC, name ASC
      `);

      const models = result.rows;
      const analysis = {
        total: models.length,
        overpriced: [],
        needsUpdate: [],
        acceptable: []
      };

      for (const model of models) {
        const pricing = analyzePricing(
          parseFloat(model.cost) || 0,
          parseFloat(model.fal_price) || 0
        );

        const modelWithAnalysis = {
          ...model,
          analysis: pricing
        };

        if (pricing.currentCredits > MAX_REASONABLE_CREDITS) {
          analysis.overpriced.push(modelWithAnalysis);
        } else if (pricing.shouldUpdate) {
          analysis.needsUpdate.push(modelWithAnalysis);
        } else {
          analysis.acceptable.push(modelWithAnalysis);
        }
      }

      res.json({
        success: true,
        analysis,
        summary: {
          total: analysis.total,
          overpriced: analysis.overpriced.length,
          needsUpdate: analysis.needsUpdate.length,
          acceptable: analysis.acceptable.length
        },
        formula: {
          idr_per_credit: IDR_PER_CREDIT,
          usd_to_idr: USD_TO_IDR,
          max_credits: MAX_REASONABLE_CREDITS
        }
      });

    } catch (error) {
      console.error('Error verifying pricing:', error);
      res.status(500).json({
        success: false,
        message: 'Error verifying pricing: ' + error.message
      });
    }
  },

  // Update pricing for all models using SIMPLE formula
  async updatePricing(req, res) {
    try {
      const { pool } = require('../config/database');

      // Constants
      const MAX_REASONABLE_CREDITS = 100;

      // SIMPLE FORMULA: Credits = Price × 10
      // $0.01 = 0.1 credits
      // $1.00 = 10.0 credits
      function calculateCorrectCredits(falPriceUSD) {
        if (!falPriceUSD || falPriceUSD <= 0) return 0.1;
        const credits = Math.max(0.1, Math.round(falPriceUSD * 10 * 10) / 10);
        return credits;
      }

      // Get models that need updating
      const result = await pool.query(`
        SELECT id, model_id, name, cost, fal_price
        FROM ai_models 
        WHERE fal_price IS NOT NULL AND fal_price > 0
      `);

      let updated = 0;
      let errors = 0;
      const updates = [];

      for (const model of result.rows) {
        try {
          const currentCredits = parseFloat(model.cost) || 0;
          const correctCredits = calculateCorrectCredits(parseFloat(model.fal_price));
          
          if (Math.abs(currentCredits - correctCredits) > 0.1 || currentCredits > MAX_REASONABLE_CREDITS) {
            await pool.query(
              'UPDATE ai_models SET cost = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
              [correctCredits, model.id]
            );
            
            updates.push({
              name: model.name,
              old: currentCredits,
              new: correctCredits
            });
            updated++;
          }
        } catch (error) {
          console.error(`Failed to update ${model.name}:`, error);
          errors++;
        }
      }

      res.json({
        success: true,
        message: `Pricing updated successfully`,
        updated,
        errors,
        updates: updates.slice(0, 10), // Show first 10 updates
        total_updates: updates.length
      });

    } catch (error) {
      console.error('Error updating pricing:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating pricing: ' + error.message
      });
    }
  },

  // Quick import model from fal.ai
  async quickImportModel(req, res) {
    try {
      const { pool } = require('../config/database');
      const falBrowser = require('../services/falAiBrowser');
      const { modelId } = req.body;

      // Validate modelId
      if (!modelId) {
        return res.status(400).json({
          success: false,
          message: 'Model ID is required'
        });
      }

      console.log('📥 Importing model:', modelId);

      // Get model from fal.ai browser
      const falModel = falBrowser.getModelById(modelId);

      if (!falModel) {
        console.log('❌ Model not found in catalog:', modelId);
        return res.status(404).json({
          success: false,
          message: 'Model not found in fal.ai catalog'
        });
      }

      console.log('✅ Found model:', falModel.name);

      // Check if model already exists
      const existing = await pool.query(
        'SELECT id, name FROM ai_models WHERE model_id = $1',
        [falModel.id]
      );

      if (existing.rows.length > 0) {
        console.log('⚠️ Model already exists:', existing.rows[0].name);
        return res.status(400).json({
          success: false,
          message: `Model "${existing.rows[0].name}" already exists in your database`
        });
      }

      // Prepare and insert with fal_price and auto-calculated cost
      const modelData = falBrowser.prepareForImport(falModel);
      
      // Calculate cost using type-aware pricing function
      const fal_price = falModel.fal_price || 0;
      const max_duration = falModel.max_duration || null;
      const pricing_type = falModel.pricing_type || 'flat';
      const costResult = await pool.query(
        'SELECT calculate_credits_typed($1, $2, $3, $4, $5) as cost',
        [0, falModel.type, fal_price, max_duration, pricing_type]
      );
      const calculated_cost = costResult.rows[0].cost;

      const result = await pool.query(`
        INSERT INTO ai_models (
          model_id, name, provider, description, category, type,
          trending, viral, speed, quality, max_duration, fal_price, cost,
          is_active, is_custom, added_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `, [
        modelData.model_id,
        modelData.name,
        modelData.provider,
        modelData.description,
        modelData.category,
        modelData.type,
        modelData.trending,
        modelData.viral,
        modelData.speed,
        modelData.quality,
        modelData.max_duration,
        fal_price,
        calculated_cost,
        modelData.is_active,
        modelData.is_custom,
        req.user?.id || null
      ]);

      console.log('✅ Model imported successfully:', result.rows[0].name);

      res.json({
        success: true,
        message: 'Model imported successfully from fal.ai',
        model: result.rows[0]
      });
    } catch (error) {
      console.error('❌ Error importing model:', error.message);
      console.error('Stack:', error.stack);
      res.status(500).json({
        success: false,
        message: `Error importing model: ${error.message}`
      });
    }
  },

  // ============ PRICING SETTINGS ============

  // Update credit price (SIMPLE endpoint)
  async updateCreditPrice(req, res) {
    try {
      const { credit_price_idr } = req.body;

      if (!credit_price_idr || credit_price_idr < 1000) {
        return res.status(400).json({
          success: false,
          message: 'Minimum Rp 1,000 per credit'
        });
      }

      // Update credit price
      await pool.query(`
        INSERT INTO pricing_config (config_key, config_value, description)
        VALUES ('credit_price_idr', $1, 'Harga 1 credit dalam Rupiah (user pays)')
        ON CONFLICT (config_key) 
        DO UPDATE SET config_value = $1, updated_at = CURRENT_TIMESTAMP
      `, [credit_price_idr]);

      console.log(`✅ Credit price updated to Rp ${parseInt(credit_price_idr).toLocaleString('id-ID')}`);

      res.json({
        success: true,
        message: 'Credit price updated successfully',
        credit_price_idr: credit_price_idr
      });

    } catch (error) {
      console.error('❌ Error updating credit price:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Fix base credit USD (emergency fix for inflated prices)
  async fixBaseCreditUSD(req, res) {
    try {
      console.log('🔧 Starting base_credit_usd fix...');
      
      // Check current values
      const currentResult = await pool.query(`
        SELECT config_key, config_value 
        FROM pricing_config 
        WHERE config_key IN ('base_credit_usd', 'video_base_credit_usd', 'image_base_credit_usd')
      `);
      
      const oldValues = {};
      currentResult.rows.forEach(row => {
        oldValues[row.config_key] = parseFloat(row.config_value);
      });
      
      console.log('📊 Old values:', oldValues);
      
      // Fix video base credit (0.008 → 0.08)
      await pool.query(`
        UPDATE pricing_config 
        SET config_value = 0.08, updated_at = CURRENT_TIMESTAMP
        WHERE config_key = 'video_base_credit_usd'
      `);
      
      // Fix image base credit
      await pool.query(`
        INSERT INTO pricing_config (config_key, config_value, description)
        VALUES ('image_base_credit_usd', 0.05, 'Base credit USD for images')
        ON CONFLICT (config_key) 
        DO UPDATE SET config_value = 0.05, updated_at = CURRENT_TIMESTAMP
      `);
      
      console.log('✅ Base credit values fixed!');
      
      // Recalculate credits
      const recalcResult = await pool.query(`
        UPDATE ai_models 
        SET cost = calculate_credits_typed(
          id, 
          type, 
          fal_price, 
          max_duration, 
          COALESCE(pricing_type, 'flat')
        )
        WHERE fal_price IS NOT NULL AND fal_price > 0
        RETURNING name, fal_price, cost
      `);
      
      console.log(`✅ Recalculated ${recalcResult.rows.length} models`);
      
      const samples = recalcResult.rows.slice(0, 5);
      
      res.json({
        success: true,
        message: 'Base credit USD fixed!',
        details: {
          oldValues,
          newValues: { video_base_credit_usd: 0.08, image_base_credit_usd: 0.05 },
          modelsUpdated: recalcResult.rows.length,
          samples: samples.map(m => ({
            name: m.name,
            fal_price: parseFloat(m.fal_price),
            credits: parseFloat(m.cost)
          }))
        }
      });

    } catch (error) {
      console.error('❌ Error fixing base credit:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get SIMPLE pricing settings page (new simplified version)
  async getSimplePricingSettings(req, res) {
    try {
      const { pool } = require('../config/database');
      
      // Get only essential configs
      const configResult = await pool.query(`
        SELECT config_key, config_value 
        FROM pricing_config 
        WHERE config_key IN (
          'credit_price_idr',
          'video_base_credit_usd',
          'video_profit_margin',
          'image_base_credit_usd',
          'image_profit_margin',
          'credit_rounding'
        )
      `);
      
      const config = {};
      configResult.rows.forEach(row => {
        config[row.config_key] = parseFloat(row.config_value);
      });
      
      // Set defaults if not exists
      config.credit_price_idr = config.credit_price_idr || 1500;
      config.video_base_credit_usd = config.video_base_credit_usd || 0.08;
      config.video_profit_margin = config.video_profit_margin || 25;
      config.image_base_credit_usd = config.image_base_credit_usd || 0.05;
      config.image_profit_margin = config.image_profit_margin || 20;
      config.credit_rounding = config.credit_rounding || 0.1;
      
      res.render('admin/pricing-simple', {
        title: 'Pricing Settings',
        pageTitle: 'Pricing Settings',
        user: req.user,
        config: config
      });
      
    } catch (error) {
      console.error('Error loading pricing settings:', error);
      res.status(500).send('Error loading pricing settings');
    }
  },

  // ============ REAL-TIME FAL.AI PRICING ============
  
  // Get real-time FAL.AI pricing page (NEW)
  async getRealtimePricing(req, res) {
    try {
      res.render('admin/pricing-realtime', {
        title: 'Real-time FAL.AI Pricing',
        pageTitle: 'Real-time FAL.AI Pricing',
        user: req.user,
        currentPath: req.path
      });
    } catch (error) {
      console.error('Error loading real-time pricing page:', error);
      res.status(500).render('error', {
        message: 'Error loading real-time pricing page',
        error: process.env.NODE_ENV === 'development' ? error : {}
      });
    }
  },

  // REMOVED: getPricingSettings - Use getRealtimePricing instead
  
  // OLD Pricing Settings (Legacy)
  async getPricingSettingsOld(req, res) {
    try {
      const { pool } = require('../config/database');
      
      // Get current config
      const configResult = await pool.query(`
        SELECT config_key, config_value 
        FROM pricing_config
        ORDER BY config_key
      `);
      
      // Convert to object
      const config = {};
      configResult.rows.forEach(row => {
        config[row.config_key] = parseFloat(row.config_value);
      });
      
      res.render('admin/pricing-settings', {
        title: 'Pricing Configuration (Old)',
        pageTitle: 'Pricing Configuration (Old)',
        user: req.user,
        currentPath: req.path,
        config
      });
    } catch (error) {
      console.error('Error loading pricing settings:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to load pricing settings',
        error: process.env.NODE_ENV === 'development' ? error : null
      });
    }
  },

  // Get pricing config (API)
  async getPricingConfig(req, res) {
    try {
      const { pool } = require('../config/database');
      
      const result = await pool.query(`
        SELECT config_key, config_value, description
        FROM pricing_config
        ORDER BY config_key
      `);
      
      res.json({
        success: true,
        config: result.rows
      });
    } catch (error) {
      console.error('Error getting pricing config:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving pricing configuration'
      });
    }
  },

  // Update pricing config (API)
  async updatePricingConfig(req, res) {
    try {
      const { pool } = require('../config/database');
      const { 
        profit_margin_percent,
        base_credit_usd,
        credit_rounding,
        minimum_credits,
        credit_price_idr, // NEW: Credit price in Rupiah
        // Type-aware configs (if provided)
        image_profit_margin,
        video_profit_margin,
        image_base_credit_usd,
        video_base_credit_usd,
        image_minimum_credits,
        video_minimum_credits
      } = req.body;

      console.log('📊 Updating pricing config:', req.body);
      
      // Validate credit_price_idr if provided
      if (credit_price_idr) {
        const priceIDR = parseInt(credit_price_idr);
        if (isNaN(priceIDR) || priceIDR < 1000) {
          return res.status(400).json({
            success: false,
            message: 'Credit price must be at least Rp 1,000'
          });
        }
      }

      // Use type-specific values if provided, otherwise use general values
      const imageMargin = image_profit_margin !== undefined ? parseFloat(image_profit_margin) : parseFloat(profit_margin_percent);
      const videoMargin = video_profit_margin !== undefined ? parseFloat(video_profit_margin) : parseFloat(profit_margin_percent);
      const imageBaseCredit = image_base_credit_usd !== undefined ? parseFloat(image_base_credit_usd) : parseFloat(base_credit_usd);
      const videoBaseCredit = video_base_credit_usd !== undefined ? parseFloat(video_base_credit_usd) : parseFloat(base_credit_usd);
      const imageMinCredits = image_minimum_credits !== undefined ? parseFloat(image_minimum_credits) : parseFloat(minimum_credits);
      const videoMinCredits = video_minimum_credits !== undefined ? parseFloat(video_minimum_credits) : parseFloat(minimum_credits);
      const roundingValue = parseFloat(credit_rounding);

      // Validate
      if (isNaN(imageMargin) || isNaN(videoMargin)) {
        return res.status(400).json({
          success: false,
          message: 'Profit margin is required'
        });
      }

      // Update type-specific configs
      await pool.query(`
        INSERT INTO pricing_config (config_key, config_value, description, updated_by)
        VALUES ('image_profit_margin', $1, 'Profit margin for image models', $2)
        ON CONFLICT (config_key) 
        DO UPDATE SET config_value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
      `, [imageMargin, req.user?.id]);

      await pool.query(`
        INSERT INTO pricing_config (config_key, config_value, description, updated_by)
        VALUES ('video_profit_margin', $1, 'Profit margin for video models', $2)
        ON CONFLICT (config_key) 
        DO UPDATE SET config_value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
      `, [videoMargin, req.user?.id]);

      await pool.query(`
        INSERT INTO pricing_config (config_key, config_value, description, updated_by)
        VALUES ('image_base_credit_usd', $1, 'Base credit USD for image models', $2)
        ON CONFLICT (config_key) 
        DO UPDATE SET config_value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
      `, [imageBaseCredit, req.user?.id]);

      await pool.query(`
        INSERT INTO pricing_config (config_key, config_value, description, updated_by)
        VALUES ('video_base_credit_usd', $1, 'Base credit USD for video models', $2)
        ON CONFLICT (config_key) 
        DO UPDATE SET config_value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
      `, [videoBaseCredit, req.user?.id]);

      await pool.query(`
        INSERT INTO pricing_config (config_key, config_value, description, updated_by)
        VALUES ('image_minimum_credits', $1, 'Minimum credits for image models', $2)
        ON CONFLICT (config_key) 
        DO UPDATE SET config_value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
      `, [imageMinCredits, req.user?.id]);

      await pool.query(`
        INSERT INTO pricing_config (config_key, config_value, description, updated_by)
        VALUES ('video_minimum_credits', $1, 'Minimum credits for video models', $2)
        ON CONFLICT (config_key) 
        DO UPDATE SET config_value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
      `, [videoMinCredits, req.user?.id]);

      await pool.query(`
        INSERT INTO pricing_config (config_key, config_value, description, updated_by)
        VALUES ('credit_rounding', $1, 'Round credits to nearest value', $2)
        ON CONFLICT (config_key) 
        DO UPDATE SET config_value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
      `, [roundingValue, req.user?.id]);
      
      // Update credit_price_idr if provided
      if (credit_price_idr) {
        await pool.query(`
          INSERT INTO pricing_config (config_key, config_value, description, updated_by)
          VALUES ('credit_price_idr', $1, 'Harga 1 credit dalam Rupiah (minimum Rp 1,000)', $2)
          ON CONFLICT (config_key) 
          DO UPDATE SET config_value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
        `, [credit_price_idr, req.user?.id]);
        console.log(`✅ Credit price IDR updated: Rp ${parseInt(credit_price_idr).toLocaleString('id-ID')}`);
      }

      console.log('✅ Pricing configs saved, recalculating credits...');

      // Recalculate all model credits with type-aware pricing
      const updateResult = await pool.query(`
        UPDATE ai_models 
        SET cost = calculate_credits_typed(
          id, 
          type, 
          fal_price, 
          max_duration, 
          COALESCE(pricing_type, 'flat')
        )
        WHERE fal_price IS NOT NULL AND fal_price > 0
      `);

      console.log(`✅ Updated ${updateResult.rowCount} models`);

      res.json({
        success: true,
        message: `Pricing configuration updated successfully. ${updateResult.rowCount} model prices recalculated.`
      });
    } catch (error) {
      console.error('❌ Error updating pricing config:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating pricing configuration: ' + error.message
      });
    }
  },

  // Get model pricing (API)
  async getModelPricing(req, res) {
    try {
      const { pool } = require('../config/database');
      
      const result = await pool.query(`
        SELECT * FROM model_pricing
        ORDER BY usd_price DESC
      `);
      
      res.json({
        success: true,
        prices: result.rows
      });
    } catch (error) {
      console.error('Error getting model pricing:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving model pricing'
      });
    }
  },

  // ============ PRICING SYNC FROM FAL.AI ============

  // Sync pricing from FAL.AI (API)
  async syncFalPricing(req, res) {
    try {
      const falPricingSync = require('../services/falPricingSync');
      const { pool } = require('../config/database');
      const { dryRun = false, forceUpdate = false } = req.body;
      
      console.log('\n╔══════════════════════════════════════════════════════════╗');
      console.log('║   FAL.AI PRICING SYNC REQUEST                           ║');
      console.log('╚══════════════════════════════════════════════════════════╝');
      console.log(`🔄 Mode: ${dryRun ? 'DRY RUN (preview)' : 'LIVE (will update database)'}`);
      console.log(`🔄 Force Update: ${forceUpdate}`);
      console.log(`👤 User: ${req.user?.email || req.user?.name || 'admin'}`);
      console.log('');
      
      // Perform sync
      const results = await falPricingSync.syncAllPricing({
        dryRun,
        forceUpdate,
        changedBy: req.user?.email || req.user?.name || 'admin'
      });
      
      // If not dry run and models were updated, touch pricing_config to notify users
      if (!dryRun && results.updated > 0) {
        await pool.query(`
          INSERT INTO pricing_config (config_key, config_value, description, updated_by)
          VALUES ('last_fal_sync', $1, 'Last FAL.AI pricing sync timestamp', $2)
          ON CONFLICT (config_key)
          DO UPDATE SET config_value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
        `, [Date.now().toString(), req.user?.id]);
        
        console.log('📢 User dashboards will be notified of pricing changes');
      }
      
      console.log('\n✅ Sync completed successfully');
      console.log(`📊 Results: ${results.updated} updated, ${results.unchanged} unchanged, ${results.errors} errors\n`);
      
      res.json({
        success: true,
        message: dryRun 
          ? 'Pricing sync preview completed (no changes saved)'
          : 'Pricing sync completed successfully',
        results
      });
      
    } catch (error) {
      console.error('\n❌ ERROR syncing FAL.AI pricing:', error);
      console.error('Stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Error syncing pricing from FAL.AI',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  // Get pricing change history (API)
  async getPricingHistory(req, res) {
    try {
      const falPricingSync = require('../services/falPricingSync');
      const limit = parseInt(req.query.limit) || 50;
      
      const history = await falPricingSync.getPricingHistory(limit);
      
      res.json({
        success: true,
        history
      });
      
    } catch (error) {
      console.error('Error getting pricing history:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving pricing history',
        error: error.message
      });
    }
  },

  // Get all models with current pricing (API)
  async getAllModelsPricing(req, res) {
    try {
      const falPricingSync = require('../services/falPricingSync');
      
      const models = await falPricingSync.getAllModels();
      
      res.json({
        success: true,
        total: models.length,
        models
      });
      
    } catch (error) {
      console.error('Error getting models:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving models',
        error: error.message
      });
    }
  },

  // Update single model pricing manually (API)
  async updateSingleModelPricing(req, res) {
    try {
      const falPricingSync = require('../services/falPricingSync');
      const { modelId } = req.params;
      const { newPrice, reason } = req.body;
      
      if (!newPrice || newPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid price is required'
        });
      }
      
      // Get current price
      const models = await falPricingSync.getAllModels();
      const model = models.find(m => m.model_id === modelId);
      
      if (!model) {
        return res.status(404).json({
          success: false,
          message: 'Model not found'
        });
      }
      
      const oldPrice = parseFloat(model.fal_price) || 0;
      
      // Update pricing
      const result = await falPricingSync.updateModelPricing(
        modelId,
        parseFloat(newPrice),
        oldPrice,
        reason || `Manual update by ${req.user?.email || 'admin'}`
      );
      
      res.json({
        success: true,
        message: 'Model pricing updated successfully',
        result
      });
      
    } catch (error) {
      console.error('Error updating model pricing:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating model pricing',
        error: error.message
      });
    }
  },

  // ============ PAYMENT TRANSACTIONS ============
  
  // Check and update expired payment transactions
  async checkAndUpdateExpiredPayments() {
    try {
      // First, find expired unpaid transactions
      const findExpiredQuery = `
        SELECT 
          id, reference, user_id, amount, credits_amount, 
          payment_method, expired_time, created_at
        FROM payment_transactions 
        WHERE status IN ('PENDING', 'UNPAID') 
          AND expired_time < NOW()
        ORDER BY expired_time ASC
      `;
      
      const expiredResult = await pool.query(findExpiredQuery);
      const expiredTransactions = expiredResult.rows;
      
      if (expiredTransactions.length > 0) {
        // Update expired transactions to EXPIRED status
        const updateQuery = `
          UPDATE payment_transactions 
          SET status = 'EXPIRED', updated_at = NOW() 
          WHERE status IN ('PENDING', 'UNPAID') 
            AND expired_time < NOW()
        `;
        
        const updateResult = await pool.query(updateQuery);
        
        console.log(`✅ Updated ${updateResult.rowCount} expired payment transactions to EXPIRED status`);
        
        return {
          success: true,
          updatedCount: updateResult.rowCount,
          expiredTransactions: expiredTransactions
        };
      }
      
      return {
        success: true,
        updatedCount: 0,
        expiredTransactions: []
      };
      
    } catch (error) {
      console.error('❌ Error checking expired payments:', error);
      return {
        success: false,
        error: error.message,
        updatedCount: 0,
        expiredTransactions: []
      };
    }
  },
  
  // Get all payment transactions
  async getPaymentTransactions(req, res) {
    try {
      // First check and update any expired payments
      const expiredCheck = await adminController.checkAndUpdateExpiredPayments();
      
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const status = req.query.status || null;
      const search = req.query.search || '';
      const offset = (page - 1) * limit;

      // Build query
      let query = `
        SELECT 
          pt.*,
          u.name as user_name,
          u.email as user_email
        FROM payment_transactions pt
        LEFT JOIN users u ON pt.user_id = u.id
        WHERE 1=1
      `;
      const params = [];
      let paramIndex = 1;

      // Add filters
      if (status && status !== 'all') {
        query += ` AND pt.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (search) {
        query += ` AND (
          pt.reference ILIKE $${paramIndex} OR
          pt.merchant_ref ILIKE $${paramIndex} OR
          u.name ILIKE $${paramIndex} OR
          u.email ILIKE $${paramIndex}
        )`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Get total count
      const countQuery = query.replace(/SELECT[\s\S]*FROM/, 'SELECT COUNT(*) FROM');
      const countResult = await pool.query(countQuery, params);
      const totalTransactions = parseInt(countResult.rows[0].count);

      // Add pagination
      query += ` ORDER BY pt.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Get statistics
      const statsQuery = `
        SELECT 
          COUNT(*) as total_transactions,
          COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid_count,
          COUNT(CASE WHEN status = 'UNPAID' THEN 1 END) as unpaid_count,
          COUNT(CASE WHEN status = 'EXPIRED' THEN 1 END) as expired_count,
          COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount_received ELSE 0 END), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN status = 'PAID' THEN credits_amount ELSE 0 END), 0) as total_credits_sold
        FROM payment_transactions
      `;
      const statsResult = await pool.query(statsQuery);
      const stats = statsResult.rows[0];

      res.render('admin/payment-transactions', {
        title: 'Payment Transactions',
        pageTitle: 'Payment Transactions',
        user: req.user,
        transactions: result.rows,
        stats,
        expiredCheck: expiredCheck, // Pass expired check results to view
        pagination: {
          page,
          limit,
          total: totalTransactions,
          totalPages: Math.ceil(totalTransactions / limit)
        },
        filters: {
          status: status || 'all',
          search
        }
      });
    } catch (error) {
      console.error('Error loading payment transactions:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to load payment transactions',
        error: process.env.NODE_ENV === 'development' ? error : null
      });
    }
  },

  // Get payment transaction detail (API)
  async getPaymentTransactionDetail(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          pt.*,
          u.name as user_name,
          u.email as user_email,
          u.phone as user_phone
        FROM payment_transactions pt
        LEFT JOIN users u ON pt.user_id = u.id
        WHERE pt.id = $1
      `;
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error getting payment transaction detail:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get transaction detail'
      });
    }
  },

  // Sync payment channels from Tripay
  async syncPaymentChannels(req, res) {
    try {
      const tripayService = require('../services/tripayService');
      const result = await tripayService.syncPaymentChannels();

      res.json({
        success: true,
        message: `Successfully synced ${result.count} payment channels`,
        data: result
      });
    } catch (error) {
      console.error('Error syncing payment channels:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to sync payment channels'
      });
    }
  },

  // Manual API endpoint to check and update expired payments
  async updateExpiredPayments(req, res) {
    try {
      const result = await adminController.checkAndUpdateExpiredPayments();
      
      if (result.success) {
        res.json({
          success: true,
          message: result.updatedCount > 0 
            ? `Successfully updated ${result.updatedCount} expired payment(s) to EXPIRED status`
            : 'No expired payments found',
          data: {
            updatedCount: result.updatedCount,
            expiredTransactions: result.expiredTransactions
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: `Error checking expired payments: ${result.error}`
        });
      }
    } catch (error) {
      console.error('Error in updateExpiredPayments API:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update expired payments'
      });
    }
  },

  // ============ CREDIT PRICE MANAGEMENT ============
  
  // Get credit price
  async getCreditPrice(req, res) {
    try {
      const query = `
        SELECT config_value 
        FROM pricing_config 
        WHERE config_key = 'credit_price_idr'
      `;
      const result = await pool.query(query);
      const price = parseInt(result.rows[0]?.config_value || 2000);

      res.json({
        success: true,
        price
      });
    } catch (error) {
      console.error('Error getting credit price:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get credit price'
      });
    }
  },

  // Update credit price
  async updateCreditPrice(req, res) {
    try {
      const { price } = req.body;

      if (!price || price < 1000) {
        return res.status(400).json({
          success: false,
          message: 'Price must be at least Rp 1.000'
        });
      }

      // Check if config exists
      const checkQuery = `
        SELECT * FROM pricing_config 
        WHERE config_key = 'credit_price_idr'
      `;
      const checkResult = await pool.query(checkQuery);

      if (checkResult.rows.length > 0) {
        // Update existing
        const updateQuery = `
          UPDATE pricing_config 
          SET config_value = $1, updated_at = CURRENT_TIMESTAMP
          WHERE config_key = 'credit_price_idr'
        `;
        await pool.query(updateQuery, [price.toString()]);
      } else {
        // Insert new
        const insertQuery = `
          INSERT INTO pricing_config (config_key, config_value, description)
          VALUES ('credit_price_idr', $1, 'Harga per 1 credit dalam Rupiah (untuk top-up)')
        `;
        await pool.query(insertQuery, [price.toString()]);
      }

      // Log activity
      await pool.query(`
        INSERT INTO user_activity_logs (user_id, activity_type, description, metadata)
        VALUES ($1, $2, $3, $4)
      `, [
        req.user.id,
        'update_credit_price',
        `Updated credit price to Rp ${price.toLocaleString('id-ID')}`,
        JSON.stringify({ old_price: checkResult.rows[0]?.config_value, new_price: price })
      ]);

      res.json({
        success: true,
        message: 'Credit price updated successfully',
        price
      });
    } catch (error) {
      console.error('Error updating credit price:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update credit price'
      });
    }
  },

  // Sync pricing from FAL.AI
  async syncFalPricing(req, res) {
    try {
      const scraper = require('../services/falAiScraper');
      
      console.log('💰 Starting pricing sync from FAL.AI...');
      
      const result = await scraper.syncPricingToDatabase();
      
      res.json({
        success: true,
        message: 'Pricing sync completed successfully',
        updated: result.updated,
        errors: result.errors,
        total: result.total
      });
      
    } catch (error) {
      console.error('Error syncing FAL.AI pricing:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync pricing: ' + error.message
      });
    }
  },
  
  // ============ MODEL CONNECTION TESTING ============

  // Get model test page
  async getModelTest(req, res) {
    try {
      res.render('admin/model-test', {
        title: 'Model Connection Test',
        pageTitle: 'Model Connection Test',
        user: req.user,
      });
    } catch (error) {
      console.error('Error loading model test page:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to load model test page',
        error: process.env.NODE_ENV === 'development' ? error : null,
        stack: process.env.NODE_ENV === 'development' ? error.stack : null
      });
    }
  },

  // Test FAL.AI connection
  async testFalConnection(req, res) {
    try {
      console.log('🧪 Testing FAL.AI connection...');
      
      // Use the existing FalAiRealtime service to test connection (already instantiated)
      const connectionResult = await falAiRealtime.verifyApiConnection();
      
      console.log('FAL.AI connection result:', connectionResult);
      
      res.json({
        success: true,
        connected: connectionResult.connected,
        message: connectionResult.message,
        error: connectionResult.error,
        status: connectionResult.status,
        api_key_valid: connectionResult.api_key_valid
      });
    } catch (error) {
      console.error('Error testing FAL.AI connection:', error);
      res.json({
        success: false,
        connected: false,
        error: error.message,
        message: 'Failed to test FAL.AI connection'
      });
    }
  },

  // Test Suno API connection
  async testSunoConnection(req, res) {
    try {
      console.log('🧪 Testing Suno connection...');
      
      // Check if Suno API key is configured
      const result = await pool.query(
        "SELECT api_key FROM api_configs WHERE service_name = 'SUNO' AND is_active = true LIMIT 1"
      );
      
      if (result.rows.length === 0 || !result.rows[0].api_key) {
        return res.json({
          success: true,
          connected: false,
          error: 'No API key configured',
          message: 'Please configure Suno API key in API Config page'
        });
      }

      // Test connection with a simple status check (no generation)
      try {
        const testResult = await sunoService.testConnection();
        
        res.json({
          success: true,
          connected: testResult.success || false,
          message: testResult.message || 'Suno API connection test completed',
          credits_available: testResult.credits_available,
          api_status: testResult.status
        });
      } catch (sunoError) {
        console.error('Suno connection test failed:', sunoError);
        res.json({
          success: true,
          connected: false,
          error: sunoError.message,
          message: 'Suno API connection failed'
        });
      }
    } catch (error) {
      console.error('Error testing Suno connection:', error);
      res.json({
        success: false,
        connected: false,
        error: error.message,
        message: 'Failed to test Suno connection'
      });
    }
  },

  // Test database connection
  async testDbConnection(req, res) {
    try {
      console.log('🧪 Testing database connection...');
      
      // Test basic database connectivity
      const testQuery = await pool.query('SELECT NOW() as current_time');
      
      // Get some basic stats
      const modelsResult = await pool.query('SELECT COUNT(*) as count FROM ai_models');
      const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
      
      res.json({
        success: true,
        connected: true,
        message: 'Database connection successful',
        models_count: parseInt(modelsResult.rows[0].count),
        users_count: parseInt(usersResult.rows[0].count),
        server_time: testQuery.rows[0].current_time
      });
    } catch (error) {
      console.error('Error testing database connection:', error);
      res.json({
        success: false,
        connected: false,
        error: error.message,
        message: 'Database connection failed'
      });
    }
  },

  // Test specific model connection
  async testModelConnection(req, res) {
    try {
      const { model_id, test_type, prompt } = req.body;
      
      console.log(`🧪 Testing model connection: ${model_id} (${test_type})`);
      
      if (!model_id) {
        return res.json({
          success: false,
          error: 'Model ID is required'
        });
      }

      // Get model details from database
      const modelResult = await pool.query(
        'SELECT model_id, name, type, provider, is_active FROM ai_models WHERE model_id = $1',
        [model_id]
      );

      if (modelResult.rows.length === 0) {
        return res.json({
          success: false,
          error: 'Model not found in database'
        });
      }

      const model = modelResult.rows[0];
      const startTime = Date.now();

      let testResult = {
        model_id: model.model_id,
        model_name: model.name,
        model_type: model.type,
        provider: model.provider,
        is_active: model.is_active
      };

      try {
        switch (test_type) {
          case 'availability':
            // Test if model endpoint exists (without generation)
            if (model.provider === 'FAL' || !model.provider) {
              const balanceCheck = await falAiService.checkBalance();
              testResult.model_available = balanceCheck.apiKeyValid || false;
              testResult.api_accessible = balanceCheck.success;
            } else if (model.provider === 'SUNO') {
              const sunoTest = await sunoService.testConnection();
              testResult.model_available = sunoTest.success || false;
              testResult.api_accessible = sunoTest.success;
            } else {
              testResult.model_available = true; // Assume available for other providers
              testResult.api_accessible = true;
            }
            break;

          case 'parameters':
            // Test parameter validation (without actual generation)
            testResult.parameters_valid = true;
            testResult.test_prompt = prompt;
            
            // Basic parameter validation
            if (model.type === 'image' && (!prompt || prompt.trim().length < 3)) {
              testResult.parameters_valid = false;
              testResult.validation_error = 'Image models require prompt with at least 3 characters';
            } else if (model.type === 'video' && (!prompt || prompt.trim().length < 5)) {
              testResult.parameters_valid = false;
              testResult.validation_error = 'Video models require prompt with at least 5 characters';
            }
            break;

          case 'dry-run':
            // Perform a dry run test (simulate request without generation)
            testResult.dry_run_successful = true;
            testResult.estimated_cost = 0; // No actual generation
            testResult.test_prompt = prompt;
            
            // Simulate request validation
            if (model.provider === 'FAL' || !model.provider) {
              const configCheck = await falAiService.checkBalance();
              testResult.api_configured = configCheck.success;
            } else if (model.provider === 'SUNO') {
              const sunoCheck = await sunoService.testConnection();
              testResult.api_configured = sunoCheck.success;
            }
            break;

          default:
            return res.json({
              success: false,
              error: 'Invalid test type. Use: availability, parameters, or dry-run'
            });
        }

        const responseTime = Date.now() - startTime;
        testResult.response_time = `${responseTime}ms`;

        res.json({
          success: true,
          message: `Model test completed: ${test_type}`,
          model_available: testResult.model_available !== false,
          parameters_valid: testResult.parameters_valid !== false,
          response_time: testResult.response_time,
          details: testResult
        });

      } catch (modelTestError) {
        console.error('Model test error:', modelTestError);
        const responseTime = Date.now() - startTime;
        
        res.json({
          success: false,
          error: modelTestError.message,
          model_available: false,
          parameters_valid: false,
          response_time: `${responseTime}ms`,
          details: testResult
        });
      }

    } catch (error) {
      console.error('Error testing model connection:', error);
      res.json({
        success: false,
        error: error.message,
        message: 'Failed to test model connection'
      });
    }
  },

  // Get models for testing (API endpoint)
  async getModelsForTesting(req, res) {
    try {
      const result = await pool.query(`
        SELECT model_id, name, type, provider, is_active, cost
        FROM ai_models 
        WHERE is_active = true 
        ORDER BY type, name
      `);

      res.json({
        success: true,
        models: result.rows
      });
    } catch (error) {
      console.error('Error fetching models for testing:', error);
      res.json({
        success: false,
        error: error.message,
        models: []
      });
    }
  },

};

module.exports = adminController;

