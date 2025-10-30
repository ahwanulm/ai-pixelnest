const axios = require('axios');
const crypto = require('crypto');
const { pool } = require('../config/database');

/**
 * Tripay Payment Gateway Service
 * Dokumentasi: https://tripay.co.id/developer
 */

class TripayService {
  constructor() {
    this.config = null;
    this.initialized = false;
  }

  /**
   * Initialize Tripay configuration from database
   */
  async initialize(forceReload = false) {
    // Allow force reload to refresh config without restarting server
    if (this.initialized && !forceReload) return;

    try {
      // Try to read from api_configs first
      const query = `
        SELECT api_key, api_secret, endpoint_url, is_active, additional_config
        FROM api_configs
        WHERE service_name = 'TRIPAY'
        LIMIT 1
      `;
      const result = await pool.query(query);

      let config;
      let source = 'database';

      if (result.rows.length === 0) {
        // Fallback to .env if not in database
        console.log('⚠️  Tripay config not found in database, using .env fallback');
        
        if (!process.env.TRIPAY_API_KEY || !process.env.TRIPAY_PRIVATE_KEY) {
          throw new Error('Tripay configuration not found in database or .env file');
        }

        config = {
          api_key: process.env.TRIPAY_API_KEY,
          api_secret: process.env.TRIPAY_PRIVATE_KEY,
          endpoint_url: process.env.TRIPAY_ENDPOINT_URL || 'https://tripay.co.id/api',
          is_active: true,
          additional_config: {
            merchant_code: process.env.TRIPAY_MERCHANT_CODE || 'T41400',
            callback_url: process.env.TRIPAY_CALLBACK_URL
          }
        };
        source = '.env';
      } else {
        config = result.rows[0];
        
        if (!config.is_active) {
          throw new Error('Tripay service is not active in database');
        }
      }

      // Determine mode from endpoint URL if not explicitly set
      // Production: https://tripay.co.id/api
      // Sandbox: https://tripay.co.id/api-sandbox
      const isProduction = config.endpoint_url && 
                          config.endpoint_url.includes('tripay.co.id/api') && 
                          !config.endpoint_url.includes('sandbox');
      const mode = config.additional_config?.mode || (isProduction ? 'production' : 'sandbox');

      this.config = {
        apiKey: config.api_key,
        privateKey: config.api_secret,
        baseUrl: config.endpoint_url,
        merchantCode: config.additional_config?.merchant_code || 'T41400',
        callbackUrl: config.additional_config?.callback_url || process.env.TRIPAY_CALLBACK_URL,
        mode: mode
      };

      this.initialized = true;
      console.log(`✅ Tripay Service initialized from ${source}: ${this.config.mode} mode`);
    } catch (error) {
      console.error('❌ Failed to initialize Tripay Service:', error.message);
      throw error;
    }
  }

  /**
   * Generate signature untuk request ke Tripay
   * @param {Object} data - Data yang akan di-sign
   * @returns {string} Signature
   */
  generateSignature(data) {
    const signatureString = Object.keys(data)
      .sort()
      .map(key => `${key}=${data[key]}`)
      .join('&');
    
    return crypto
      .createHmac('sha256', this.config.privateKey)
      .update(signatureString)
      .digest('hex');
  }

  /**
   * Generate signature untuk transaksi (closed payment)
   * @param {string} merchantRef - Unique merchant reference
   * @param {number} amount - Amount in IDR
   */
  generateTransactionSignature(merchantRef, amount) {
    const signatureString = `${this.config.merchantCode}${merchantRef}${amount}`;
    return crypto
      .createHmac('sha256', this.config.privateKey)
      .update(signatureString)
      .digest('hex');
  }

  /**
   * Verify callback signature
   * @param {string} callbackSignature - Signature dari callback
   * @param {Object} callbackData - Data callback dari Tripay
   */
  verifyCallbackSignature(callbackSignature, callbackData) {
    const { merchant_ref, amount } = callbackData;
    const expectedSignature = this.generateTransactionSignature(merchant_ref, amount);
    return callbackSignature === expectedSignature;
  }

  /**
   * Make API request to Tripay
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {Object} data - Request data
   */
  async makeRequest(endpoint, method = 'GET', data = null) {
    await this.initialize();

    const url = `${this.config.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json'
    };

    try {
      const config = {
        method,
        url,
        headers,
        ...(data && { data })
      };

      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error('❌ Tripay API Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Tripay API request failed');
    }
  }

  /**
   * Get list of available payment channels
   * https://tripay.co.id/developer?tab=merchant-payment-channel
   */
  async getPaymentChannels() {
    const response = await this.makeRequest('/merchant/payment-channel', 'GET');
    return response.data || [];
  }

  /**
   * Calculate payment fee
   * https://tripay.co.id/developer?tab=merchant-fee-calculator
   * @param {number} amount - Amount in IDR
   * @param {string} code - Payment channel code
   */
  async calculateFee(amount, code) {
    const response = await this.makeRequest(
      `/merchant/fee-calculator?amount=${amount}&code=${code}`,
      'GET'
    );
    return response.data || {};
  }

  /**
   * Get payment instructions for a channel
   * https://tripay.co.id/developer?tab=payment-instruction
   * @param {string} code - Payment channel code
   * @param {string} payCode - Payment code (optional, for VA)
   * @param {number} amount - Amount (optional)
   */
  async getPaymentInstructions(code, payCode = null, amount = null) {
    let endpoint = `/payment/instruction?code=${code}`;
    if (payCode) endpoint += `&pay_code=${payCode}`;
    if (amount) endpoint += `&amount=${amount}`;
    
    const response = await this.makeRequest(endpoint, 'GET');
    return response.data || [];
  }

  /**
   * Create closed payment transaction
   * https://tripay.co.id/developer?tab=transaction-create
   * @param {Object} params - Transaction parameters
   */
  async createTransaction(params) {
    // ✅ Ensure initialized before accessing config
    await this.initialize();
    
    const {
      method,
      merchantRef,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      orderItems,
      returnUrl = null,
      expiredTime = 24 // hours
    } = params;

    // Generate signature
    const signature = this.generateTransactionSignature(merchantRef, amount);

    // Prepare request data
    const data = {
      method,
      merchant_ref: merchantRef,
      amount,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      order_items: orderItems,
      return_url: returnUrl,
      expired_time: Math.floor(Date.now() / 1000) + (expiredTime * 3600),
      signature
    };

    if (this.config.callbackUrl) {
      data.callback_url = this.config.callbackUrl;
    }

    const response = await this.makeRequest('/transaction/create', 'POST', data);
    return response.data || {};
  }

  /**
   * Get transaction detail
   * https://tripay.co.id/developer?tab=transaction-detail
   * @param {string} reference - Tripay reference
   */
  async getTransactionDetail(reference) {
    const response = await this.makeRequest(`/transaction/detail?reference=${reference}`, 'GET');
    return response.data || {};
  }

  /**
   * Check transaction status (by merchant reference)
   * @param {string} merchantRef - Merchant reference
   */
  async checkTransactionStatus(merchantRef) {
    const response = await this.makeRequest(
      `/merchant/transactions?reference=${merchantRef}`,
      'GET'
    );
    return response.data || {};
  }

  /**
   * Get list of merchant transactions
   * https://tripay.co.id/developer?tab=merchant-transactions
   * @param {Object} params - Query parameters
   */
  async getMerchantTransactions(params = {}) {
    const {
      page = 1,
      perPage = 10,
      sort = 'desc',
      reference = null,
      merchantRef = null,
      method = null,
      status = null
    } = params;

    let endpoint = `/merchant/transactions?page=${page}&per_page=${perPage}&sort=${sort}`;
    if (reference) endpoint += `&reference=${reference}`;
    if (merchantRef) endpoint += `&merchant_ref=${merchantRef}`;
    if (method) endpoint += `&method=${method}`;
    if (status) endpoint += `&status=${status}`;

    const response = await this.makeRequest(endpoint, 'GET');
    return response.data || {};
  }

  /**
   * Sync payment channels to database
   * Update database dengan channel terbaru dari Tripay
   */
  async syncPaymentChannels() {
    try {
      const channels = await this.getPaymentChannels();
      
      const client = await pool.connect();
      let inserted = 0;
      let updated = 0;
      
      try {
        await client.query('BEGIN');

        for (const channel of channels) {
          // Check if channel exists
          const checkResult = await client.query(
            'SELECT code FROM payment_channels WHERE code = $1',
            [channel.code]
          );
          
          const exists = checkResult.rows.length > 0;
          
          const query = `
            INSERT INTO payment_channels (
              code, name, group_channel,
              fee_merchant_flat, fee_merchant_percent,
              fee_customer_flat, fee_customer_percent,
              minimum_amount, maximum_amount,
              icon_url, is_active, settings
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (code) 
            DO UPDATE SET
              name = EXCLUDED.name,
              group_channel = EXCLUDED.group_channel,
              fee_merchant_flat = EXCLUDED.fee_merchant_flat,
              fee_merchant_percent = EXCLUDED.fee_merchant_percent,
              fee_customer_flat = EXCLUDED.fee_customer_flat,
              fee_customer_percent = EXCLUDED.fee_customer_percent,
              minimum_amount = EXCLUDED.minimum_amount,
              maximum_amount = EXCLUDED.maximum_amount,
              icon_url = EXCLUDED.icon_url,
              is_active = EXCLUDED.is_active,
              settings = EXCLUDED.settings,
              updated_at = CURRENT_TIMESTAMP
          `;

          await client.query(query, [
            channel.code,
            channel.name,
            channel.group,
            channel.fee_merchant?.flat || 0,
            channel.fee_merchant?.percent || 0,
            channel.fee_customer?.flat || 0,
            channel.fee_customer?.percent || 0,
            channel.minimum_amount || 1000,  // ✅ FIX: Use minimum_amount, not minimum_fee
            channel.maximum_amount || 0,     // ✅ FIX: Use maximum_amount, not maximum_fee
            channel.icon_url || null,
            channel.active || true,
            JSON.stringify({
              total_fee: channel.total_fee,
              active: channel.active
            })
          ]);
          
          if (exists) {
            updated++;
          } else {
            inserted++;
          }
        }

        await client.query('COMMIT');
        console.log(`✅ Synced ${channels.length} payment channels`);
        return { 
          success: true, 
          processed: channels.length,
          inserted: inserted,
          updated: updated
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Failed to sync payment channels:', error);
      throw error;
    }
  }

  /**
   * Get payment channels from database (grouped)
   */
  async getPaymentChannelsGrouped() {
    const query = `
      SELECT 
        code, name, group_channel,
        fee_merchant_flat, fee_merchant_percent,
        fee_customer_flat, fee_customer_percent,
        minimum_amount, maximum_amount,
        icon_url, is_active
      FROM payment_channels
      WHERE is_active = true
      ORDER BY group_channel, name
    `;

    const result = await pool.query(query);
    const channels = result.rows;

    // Group by channel type
    const grouped = {};
    channels.forEach(channel => {
      if (!grouped[channel.group_channel]) {
        grouped[channel.group_channel] = [];
      }
      grouped[channel.group_channel].push(channel);
    });

    return grouped;
  }
}

// Export singleton instance
module.exports = new TripayService();

