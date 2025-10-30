const tripayService = require('../services/tripayService');
const { pool } = require('../config/database');
const Referral = require('../models/Referral');

/**
 * Payment Controller
 * Menangani semua logic terkait payment dan top-up credits
 */

const PaymentController = {
  /**
   * Render billing & transaction history page
   * GET /billing
   */
  async renderBillingPage(req, res) {
    try {
      const userId = req.user.id;

      // Get user info
      const userQuery = 'SELECT id, name, email, credits, avatar_url, role FROM users WHERE id = $1';
      const userResult = await pool.query(userQuery, [userId]);
      const user = userResult.rows[0];
      
      // Parse credits from DECIMAL (string) to number
      if (user && user.credits) {
        user.credits = parseFloat(user.credits);
      }

      // Get all transactions for this user
      const transactionsQuery = `
        SELECT 
          id, reference, merchant_ref, payment_method, payment_name,
          amount, amount_received, fee_customer, total_fee,
          credits_amount, credit_price_idr,
          pay_code, pay_url, checkout_url, qr_url,
          status, created_at, expired_time, paid_at
        FROM payment_transactions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 50
      `;
      const transactionsResult = await pool.query(transactionsQuery, [userId]);

      // Calculate statistics
      const stats = {
        total: transactionsResult.rows.length,
        paid: transactionsResult.rows.filter(tx => tx.status === 'PAID').length,
        unpaid: transactionsResult.rows.filter(tx => tx.status === 'UNPAID').length,
        totalAmount: transactionsResult.rows
          .filter(tx => tx.status === 'PAID')
          .reduce((sum, tx) => sum + (tx.amount_received || tx.amount), 0)
      };

      // Get recent credit activity (both top-ups and usage)
      const recentActivityQuery = `
        SELECT 
          'topup' as type,
          credits_amount as credits,
          'Top-up via ' || payment_name as description,
          created_at
        FROM payment_transactions
        WHERE user_id = $1 AND status = 'PAID'
        
        UNION ALL
        
        SELECT 
          'usage' as type,
          -credits_cost as credits,
          'Used for ' || generation_type || ' (' || sub_type || ')' as description,
          created_at
        FROM ai_generation_history
        WHERE user_id = $1 AND status = 'completed'
        
        ORDER BY created_at DESC
        LIMIT 10
      `;
      const recentActivityResult = await pool.query(recentActivityQuery, [userId]);

      res.render('auth/billing', {
        title: 'Billing & History',
        user,
        transactions: transactionsResult.rows,
        stats,
        recentActivity: recentActivityResult.rows,
        isAuthenticated: true,
        isAdmin: user.role === 'admin',
        currentPath: '/billing'
      });
    } catch (error) {
      console.error('Error rendering billing page:', error);
      res.status(500).render('error', {
        title: 'Error - Billing',
        message: 'Failed to load billing page',
        error: process.env.NODE_ENV === 'development' ? error : {},
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  /**
   * Get credit price (API)
   * GET /api/payment/credit-price
   */
  async getCreditPrice(req, res) {
    try {
      const priceQuery = `
        SELECT config_value 
        FROM pricing_config 
        WHERE config_key = 'credit_price_idr'
      `;
      const priceResult = await pool.query(priceQuery);
      const creditPriceIDR = parseInt(priceResult.rows[0]?.config_value || 2000);

      res.json({
        success: true,
        price: creditPriceIDR
      });
    } catch (error) {
      console.error('Error getting credit price:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get credit price',
        price: 2000 // Default fallback
      });
    }
  },

  /**
   * Render halaman top-up credits
   */
  async renderTopUpPage(req, res) {
    try {
      const userId = req.user.id;
      const creditsParam = parseInt(req.query.credits) || null;

      // Get user info dan credit price dari database
      const userQuery = 'SELECT id, name, email, credits, avatar_url, role FROM users WHERE id = $1';
      const userResult = await pool.query(userQuery, [userId]);
      const user = userResult.rows[0];
      
      // Parse credits from DECIMAL (string) to number
      if (user && user.credits) {
        user.credits = parseFloat(user.credits);
      }

      // Get credit price IDR dari pricing_config
      const priceQuery = `
        SELECT config_value 
        FROM pricing_config 
        WHERE config_key = 'credit_price_idr'
      `;
      const priceResult = await pool.query(priceQuery);
      const creditPriceIDR = parseInt(priceResult.rows[0]?.config_value || 2000);

      // Calculate amount if credits provided
      const preselectedAmount = creditsParam ? creditsParam * creditPriceIDR : null;

      // Get payment channels grouped
      const paymentChannels = await tripayService.getPaymentChannelsGrouped();

      // Get user's payment history
      const historyQuery = `
        SELECT 
          reference, payment_method, payment_name,
          amount, credits_amount, status,
          created_at, paid_at
        FROM payment_transactions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 10
      `;
      const historyResult = await pool.query(historyQuery, [userId]);

      res.render('auth/top-up', {
        user,
        creditPriceIDR,
        paymentChannels,
        paymentHistory: historyResult.rows,
        preselectedCredits: creditsParam,
        preselectedAmount,
        title: 'Top Up Credits'
      });
    } catch (error) {
      console.error('Error rendering top-up page:', error);
      res.status(500).render('error', {
        message: 'Failed to load top-up page',
        error: process.env.NODE_ENV === 'development' ? error : {}
      });
    }
  },

  /**
   * Get payment channels
   * GET /api/payment/channels
   */
  async getPaymentChannels(req, res) {
    try {
      const channels = await tripayService.getPaymentChannelsGrouped();
      res.json({
        success: true,
        data: channels
      });
    } catch (error) {
      console.error('Error getting payment channels:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment channels'
      });
    }
  },

  /**
   * Calculate payment fee
   * POST /api/payment/calculate-fee
   */
  async calculateFee(req, res) {
    try {
      const { amount, paymentMethod } = req.body;

      if (!amount || !paymentMethod) {
        return res.status(400).json({
          success: false,
          message: 'Amount and payment method are required'
        });
      }

      // Get credit price
      const priceQuery = `
        SELECT config_value 
        FROM pricing_config 
        WHERE config_key = 'credit_price_idr'
      `;
      const priceResult = await pool.query(priceQuery);
      const creditPriceIDR = parseInt(priceResult.rows[0]?.config_value || 1300);

      // Calculate credits
      const creditsAmount = Math.floor(amount / creditPriceIDR);

      // Get fee from Tripay
      const feeData = await tripayService.calculateFee(amount, paymentMethod);

      res.json({
        success: true,
        data: {
          amount: parseInt(amount),
          creditPriceIDR,
          creditsAmount,
          fee: {
            merchant: feeData.fee_merchant || 0,
            customer: feeData.fee_customer || 0,
            total: feeData.total_fee || 0
          },
          totalAmount: feeData.amount_received || amount
        }
      });
    } catch (error) {
      console.error('Error calculating fee:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate fee'
      });
    }
  },

  /**
   * Create payment transaction
   * POST /api/payment/create
   */
  async createPayment(req, res) {
    const client = await pool.connect();
    
    try {
      const { amount, credits, paymentMethod, promoCode } = req.body;
      const userId = req.user.id;
      const user = req.user;

      // Validasi input
      if (!amount || !paymentMethod) {
        return res.status(400).json({
          success: false,
          message: 'Amount and payment method are required'
        });
      }

      // Check pending transactions limit (max 3 active pending)
      const pendingCheckQuery = `
        SELECT 
          COUNT(*) as pending_count,
          MIN(expired_time) as earliest_expiry
        FROM payment_transactions 
        WHERE user_id = $1 
          AND status IN ('PENDING', 'UNPAID')
          AND expired_time > NOW()
      `;
      const pendingResult = await pool.query(pendingCheckQuery, [userId]);
      const pendingCount = parseInt(pendingResult.rows[0]?.pending_count || 0);
      const earliestExpiry = pendingResult.rows[0]?.earliest_expiry;

      if (pendingCount >= 3) {
        const expiryDate = new Date(earliestExpiry);
        const now = new Date();
        const diffMs = expiryDate - now;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        let timeRemaining = '';
        if (diffHours > 0) {
          timeRemaining = `${diffHours} jam ${diffMinutes} menit`;
        } else {
          timeRemaining = `${diffMinutes} menit`;
        }

        return res.status(429).json({
          success: false,
          message: `Anda memiliki ${pendingCount} transaksi yang belum dibayar. Silakan selesaikan pembayaran atau tunggu hingga transaksi kadaluarsa (sekitar ${timeRemaining} lagi).`,
          pending_count: pendingCount,
          earliest_expiry: earliestExpiry
        });
      }

      // Get credit price
      const priceQuery = `
        SELECT config_value 
        FROM pricing_config 
        WHERE config_key = 'credit_price_idr'
      `;
      const priceResult = await pool.query(priceQuery);
      const creditPriceIDR = parseInt(priceResult.rows[0]?.config_value || 2000);

      // Validate minimum amount (must be at least price of 1 credit)
      if (amount < creditPriceIDR) {
        return res.status(400).json({
          success: false,
          message: `Minimum pembelian 1 credit (Rp ${creditPriceIDR.toLocaleString('id-ID')})`
        });
      }

      // Calculate credits (use provided credits or calculate from amount)
      const creditsAmount = credits || Math.floor(amount / creditPriceIDR);

      // Safety check
      if (creditsAmount < 1) {
        return res.status(400).json({
          success: false,
          message: `Minimum pembelian 1 credit (Rp ${creditPriceIDR.toLocaleString('id-ID')})`
        });
      }

      // Generate unique merchant reference
      const merchantRef = `PIXELNEST-${userId}-${Date.now()}`;

      // Create transaction via Tripay
      const tripayTransaction = await tripayService.createTransaction({
        method: paymentMethod,
        merchantRef,
        amount: parseInt(amount),
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: user.phone || '081234567890',
        orderItems: [{
          name: `Top Up ${creditsAmount} Credits`,
          price: parseInt(amount),
          quantity: 1
        }],
        returnUrl: `${req.protocol}://${req.get('host')}/dashboard`,
        expiredTime: 24 // 24 hours
      });

      // Save to database
      await client.query('BEGIN');

      const insertQuery = `
        INSERT INTO payment_transactions (
          user_id, reference, merchant_ref,
          payment_method, payment_name,
          amount, fee_merchant, fee_customer, total_fee, amount_received,
          credits_amount, credit_price_idr,
          pay_code, pay_url, checkout_url, qr_url, qr_string,
          status, expired_time, payment_instructions, promo_code
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        ) RETURNING id, reference
      `;

      const values = [
        userId,
        tripayTransaction.reference,
        merchantRef,
        tripayTransaction.payment_method,
        tripayTransaction.payment_name,
        tripayTransaction.amount,
        tripayTransaction.fee_merchant || 0,
        tripayTransaction.fee_customer || 0,
        tripayTransaction.total_fee || 0,
        tripayTransaction.amount_received,
        creditsAmount,
        creditPriceIDR,
        tripayTransaction.pay_code || null,
        tripayTransaction.pay_url || null,
        tripayTransaction.checkout_url || null,
        tripayTransaction.qr_url || null,
        tripayTransaction.qr_string || null,
        'UNPAID',
        new Date(tripayTransaction.expired_time * 1000),
        JSON.stringify(tripayTransaction.instructions || []),
        promoCode ? promoCode.toUpperCase() : null
      ];

      const insertResult = await client.query(insertQuery, values);

      await client.query('COMMIT');

      // Log activity
      await pool.query(`
        INSERT INTO user_activity_logs (user_id, activity_type, description, metadata)
        VALUES ($1, $2, $3, $4)
      `, [
        userId,
        'payment_created',
        `Created payment for ${creditsAmount} credits`,
        JSON.stringify({
          reference: tripayTransaction.reference,
          amount,
          paymentMethod
        })
      ]);

      res.json({
        success: true,
        message: 'Payment created successfully',
        data: {
          id: insertResult.rows[0].id,
          reference: tripayTransaction.reference,
          merchantRef,
          paymentMethod: tripayTransaction.payment_method,
          paymentName: tripayTransaction.payment_name,
          amount: tripayTransaction.amount,
          creditsAmount,
          fee: {
            merchant: tripayTransaction.fee_merchant || 0,
            customer: tripayTransaction.fee_customer || 0,
            total: tripayTransaction.total_fee || 0
          },
          amountReceived: tripayTransaction.amount_received,
          payCode: tripayTransaction.pay_code,
          payUrl: tripayTransaction.pay_url,
          checkoutUrl: tripayTransaction.checkout_url,
          qrUrl: tripayTransaction.qr_url,
          qrString: tripayTransaction.qr_string,
          instructions: tripayTransaction.instructions,
          expiredTime: tripayTransaction.expired_time
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating payment:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create payment'
      });
    } finally {
      client.release();
    }
  },

  /**
   * Get payment detail
   * GET /api/payment/:reference
   */
  async getPaymentDetail(req, res) {
    try {
      const { reference } = req.params;
      const userId = req.user.id;

      const query = `
        SELECT 
          id, user_id, reference, merchant_ref,
          payment_method, payment_name,
          amount, fee_merchant, fee_customer, total_fee, amount_received,
          credits_amount, credit_price_idr,
          pay_code, pay_url, checkout_url, qr_url, qr_string,
          status, paid_at, expired_time,
          payment_instructions, created_at
        FROM payment_transactions
        WHERE reference = $1 AND user_id = $2
      `;

      const result = await pool.query(query, [reference, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      const payment = result.rows[0];

      res.json({
        success: true,
        data: payment
      });
    } catch (error) {
      console.error('Error getting payment detail:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment detail'
      });
    }
  },

  /**
   * Check payment status
   * GET /api/payment/:reference/status
   */
  async checkPaymentStatus(req, res) {
    try {
      const { reference } = req.params;
      const userId = req.user.id;

      // Get from database first
      const dbQuery = `
        SELECT status, paid_at
        FROM payment_transactions
        WHERE reference = $1 AND user_id = $2
      `;
      const dbResult = await pool.query(dbQuery, [reference, userId]);

      if (dbResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      const dbPayment = dbResult.rows[0];

      // If already paid, return immediately
      if (dbPayment.status === 'PAID') {
        return res.json({
          success: true,
          data: {
            status: 'PAID',
            paidAt: dbPayment.paid_at
          }
        });
      }

      // Check with Tripay API
      const tripayTransaction = await tripayService.getTransactionDetail(reference);

      // Update database if status changed
      if (tripayTransaction.status !== dbPayment.status) {
        await pool.query(`
          UPDATE payment_transactions
          SET status = $1, paid_at = $2, updated_at = CURRENT_TIMESTAMP
          WHERE reference = $3
        `, [
          tripayTransaction.status,
          tripayTransaction.status === 'PAID' ? new Date() : null,
          reference
        ]);
      }

      res.json({
        success: true,
        data: {
          status: tripayTransaction.status,
          paidAt: tripayTransaction.paid_at
        }
      });
    } catch (error) {
      console.error('Error checking payment status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check payment status'
      });
    }
  },

  /**
   * Handle payment callback from Tripay
   * POST /api/payment/callback
   */
  async handleCallback(req, res) {
    const client = await pool.connect();
    
    try {
      const callbackData = req.body;
      const callbackSignature = req.headers['x-callback-signature'] || req.get('X-Callback-Signature');

      console.log('📥 Received callback from Tripay:', {
        reference: callbackData.reference,
        status: callbackData.status
      });

      // Verify signature
      const isValid = tripayService.verifyCallbackSignature(callbackSignature, callbackData);
      
      if (!isValid) {
        console.error('❌ Invalid callback signature');
        return res.status(400).json({
          success: false,
          message: 'Invalid signature'
        });
      }

      // Get transaction from database
      const query = `
        SELECT id, user_id, credits_amount, status
        FROM payment_transactions
        WHERE reference = $1
      `;
      const result = await pool.query(query, [callbackData.reference]);

      if (result.rows.length === 0) {
        console.error('❌ Transaction not found:', callbackData.reference);
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      const transaction = result.rows[0];

      // Check if already processed
      if (transaction.status === 'PAID') {
        console.log('✅ Transaction already processed:', callbackData.reference);
        return res.json({
          success: true,
          message: 'Transaction already processed'
        });
      }

      // Update transaction status
      await client.query('BEGIN');

      await client.query(`
        UPDATE payment_transactions
        SET 
          status = $1,
          paid_at = $2,
          callback_received = true,
          callback_data = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE reference = $4
      `, [
        callbackData.status,
        callbackData.status === 'PAID' ? new Date() : null,
        JSON.stringify(callbackData),
        callbackData.reference
      ]);

      // If payment is successful, add credits to user
      if (callbackData.status === 'PAID') {
        // Add credits
        const updateCreditsQuery = `
          UPDATE users
          SET credits = credits + $1
          WHERE id = $2
          RETURNING credits
        `;
        const creditsResult = await client.query(updateCreditsQuery, [
          transaction.credits_amount,
          transaction.user_id
        ]);

        const newBalance = creditsResult.rows[0].credits;

        // Log credit transaction
        await client.query(`
          INSERT INTO credit_transactions (
            user_id, amount, transaction_type, description, balance_after, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          transaction.user_id,
          transaction.credits_amount,
          'credit',
          `Top up via ${callbackData.payment_name} - ${callbackData.reference}`,
          newBalance,
          JSON.stringify({
            payment_reference: callbackData.reference,
            payment_method: callbackData.payment_method
          })
        ]);

        // Log activity
        await client.query(`
          INSERT INTO user_activity_logs (user_id, activity_type, description, metadata)
          VALUES ($1, $2, $3, $4)
        `, [
          transaction.user_id,
          'payment_success',
          `Payment successful: ${transaction.credits_amount} credits added`,
          JSON.stringify({
            reference: callbackData.reference,
            amount: callbackData.amount
          })
        ]);

        // Add referral commission if user was referred
        try {
          await Referral.addPurchaseCommission(transaction.user_id, callbackData.amount);
        } catch (referralError) {
          console.error('Error adding referral commission:', referralError);
          // Continue even if referral commission fails
        }

        console.log(`✅ Credits added to user ${transaction.user_id}: +${transaction.credits_amount} credits, new balance: ${newBalance}`);
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Callback processed successfully'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error processing callback:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process callback'
      });
    } finally {
      client.release();
    }
  },

  /**
   * Manual sync payment status from Tripay
   * POST /api/payment/sync/:reference
   */
  async syncPaymentStatus(req, res) {
    const client = await pool.connect();
    
    try {
      const { reference } = req.params;
      const userId = req.user.id;

      console.log('🔄 Manual sync requested for:', reference);

      // Get transaction from database
      const dbQuery = `
        SELECT id, user_id, credits_amount, status, merchant_ref
        FROM payment_transactions
        WHERE reference = $1 AND user_id = $2
      `;
      const dbResult = await pool.query(dbQuery, [reference, userId]);

      if (dbResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      const transaction = dbResult.rows[0];

      // Already processed
      if (transaction.status === 'PAID') {
        return res.json({
          success: true,
          message: 'Transaction already paid',
          data: { status: 'PAID' }
        });
      }

      // Check with Tripay API
      console.log('📡 Fetching status from Tripay API...');
      const tripayData = await tripayService.getTransactionDetail(reference);

      console.log('📊 Tripay status:', tripayData.status);

      // Update if status changed
      if (tripayData.status !== transaction.status) {
        await client.query('BEGIN');

        // Update transaction status
        await client.query(`
          UPDATE payment_transactions
          SET 
            status = $1,
            paid_at = $2,
            updated_at = CURRENT_TIMESTAMP
          WHERE reference = $3
        `, [
          tripayData.status,
          tripayData.status === 'PAID' ? new Date() : null,
          reference
        ]);

        // If paid, add credits to user
        if (tripayData.status === 'PAID') {
          // Add credits
          const updateCreditsQuery = `
            UPDATE users
            SET credits = credits + $1
            WHERE id = $2
            RETURNING credits
          `;
          const creditsResult = await client.query(updateCreditsQuery, [
            transaction.credits_amount,
            transaction.user_id
          ]);

          const newBalance = creditsResult.rows[0].credits;

          // Log credit transaction
          await client.query(`
            INSERT INTO credit_transactions (
              user_id, amount, transaction_type, description, balance_after, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            transaction.user_id,
            transaction.credits_amount,
            'credit',
            `Top up via manual sync - ${reference}`,
            newBalance,
            JSON.stringify({
              payment_reference: reference,
              synced_manually: true
            })
          ]);

          // Log activity
          await client.query(`
            INSERT INTO user_activity_logs (user_id, activity_type, description, metadata)
            VALUES ($1, $2, $3, $4)
          `, [
            transaction.user_id,
            'payment_success',
            `Payment synced: ${transaction.credits_amount} credits added`,
            JSON.stringify({
              reference: reference,
              synced_manually: true
            })
          ]);

          console.log(`✅ Credits added to user ${transaction.user_id}: +${transaction.credits_amount} credits`);
        }

        await client.query('COMMIT');

        res.json({
          success: true,
          message: `Status updated to ${tripayData.status}`,
          data: {
            oldStatus: transaction.status,
            newStatus: tripayData.status,
            creditsAdded: tripayData.status === 'PAID' ? transaction.credits_amount : 0
          }
        });
      } else {
        res.json({
          success: true,
          message: 'Status unchanged',
          data: { status: transaction.status }
        });
      }

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error syncing payment status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync payment status: ' + error.message
      });
    } finally {
      client.release();
    }
  },

  /**
   * Check pending transactions count
   * GET /api/payment/check-pending
   */
  async checkPendingTransactions(req, res) {
    try {
      const userId = req.user.id;

      const query = `
        SELECT 
          COUNT(*) as pending_count,
          MIN(expired_time) as earliest_expiry,
          ARRAY_AGG(
            JSON_BUILD_OBJECT(
              'id', id,
              'amount', amount,
              'credits_amount', credits_amount,
              'payment_method', payment_method,
              'expired_time', expired_time,
              'created_at', created_at
            ) ORDER BY created_at DESC
          ) as pending_transactions
        FROM payment_transactions 
        WHERE user_id = $1 
          AND status IN ('PENDING', 'UNPAID')
          AND expired_time > NOW()
      `;
      
      const result = await pool.query(query, [userId]);
      const pendingCount = parseInt(result.rows[0]?.pending_count || 0);
      const earliestExpiry = result.rows[0]?.earliest_expiry;
      const transactions = result.rows[0]?.pending_transactions || [];

      let canCreateNew = pendingCount < 3;
      let timeRemaining = '';
      
      if (earliestExpiry) {
        const expiryDate = new Date(earliestExpiry);
        const now = new Date();
        const diffMs = expiryDate - now;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (diffHours > 0) {
          timeRemaining = `${diffHours} jam ${diffMinutes} menit`;
        } else {
          timeRemaining = `${diffMinutes} menit`;
        }
      }

      res.json({
        success: true,
        pending_count: pendingCount,
        can_create_new: canCreateNew,
        earliest_expiry: earliestExpiry,
        time_remaining: timeRemaining,
        transactions: transactions,
        message: pendingCount >= 3 
          ? `Anda memiliki ${pendingCount} transaksi pending. Tunggu ${timeRemaining} atau selesaikan pembayaran terlebih dahulu.`
          : pendingCount > 0
          ? `Anda memiliki ${pendingCount} transaksi pending`
          : 'Tidak ada transaksi pending'
      });
    } catch (error) {
      console.error('Error checking pending transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check pending transactions'
      });
    }
  },

  /**
   * Get payment history for current user
   * GET /api/payment/history
   */
  async getPaymentHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, status = null } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          reference, merchant_ref, payment_method, payment_name,
          amount, fee_customer, amount_received,
          credits_amount, credit_price_idr,
          status, created_at, paid_at, expired_time
        FROM payment_transactions
        WHERE user_id = $1
      `;
      const params = [userId];

      if (status) {
        query += ` AND status = $${params.length + 1}`;
        params.push(status);
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM payment_transactions WHERE user_id = $1';
      const countParams = [userId];
      if (status) {
        countQuery += ' AND status = $2';
        countParams.push(status);
      }
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting payment history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment history'
      });
    }
  },

  /**
   * Validate promo code
   * POST /api/payment/validate-promo
   */
  async validatePromoCode(req, res) {
    try {
      const { code, amount } = req.body;
      const userId = req.user.id;

      console.log('🎟️ Validating promo code:', { code, amount, userId }); // Debug log

      if (!code) {
        console.log('❌ Error: No code provided');
        return res.status(400).json({
          success: false,
          message: 'Kode promo wajib diisi'
        });
      }

      if (!amount || amount < 0) {
        console.log('❌ Error: Invalid amount');
        return res.status(400).json({
          success: false,
          message: 'Jumlah pembelian tidak valid'
        });
      }

      // First check if promo code exists (for better error messages)
      const checkPromoQuery = `SELECT * FROM promo_codes WHERE code = $1`;
      const checkResult = await pool.query(checkPromoQuery, [code.toUpperCase()]);

      console.log('📊 Query result:', { rowCount: checkResult.rows.length });

      if (checkResult.rows.length === 0) {
        console.log('❌ Promo not found in database');
        return res.status(404).json({
          success: false,
          message: 'Kode promo tidak ditemukan'
        });
      }

      const promo = checkResult.rows[0];
      console.log('✅ Promo found:', {
        code: promo.code,
        is_active: promo.is_active,
        valid_from: promo.valid_from,
        valid_until: promo.valid_until,
        min_purchase: promo.min_purchase,
        single_use: promo.single_use,
        usage_limit: promo.usage_limit
      });

      // Check if promo is active
      if (!promo.is_active) {
        console.log('❌ Promo not active');
        return res.status(400).json({
          success: false,
          message: 'Kode promo tidak aktif'
        });
      }

      // Check if promo has started
      if (promo.valid_from && new Date(promo.valid_from) > new Date()) {
        console.log('❌ Promo not yet valid:', { valid_from: promo.valid_from, now: new Date() });
        return res.status(400).json({
          success: false,
          message: 'Kode promo belum dapat digunakan'
        });
      }

      // Check if promo has expired
      if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
        console.log('❌ Promo expired:', { valid_until: promo.valid_until, now: new Date() });
        return res.status(400).json({
          success: false,
          message: 'Kode promo sudah kadaluarsa'
        });
      }

      // Check minimum purchase requirement
      if (promo.min_purchase && amount < promo.min_purchase) {
        console.log('❌ Min purchase not met:', { amount, min_purchase: promo.min_purchase });
        return res.status(400).json({
          success: false,
          message: `Minimum pembelian Rp ${promo.min_purchase.toLocaleString('id-ID')} untuk menggunakan kode promo ini`
        });
      }

      // Check if user has already used this promo
      if (promo.single_use) {
        const usageQuery = `
          SELECT COUNT(*) as count
          FROM payment_transactions
          WHERE user_id = $1
            AND promo_code = $2
            AND status = 'PAID'
        `;
        const usageResult = await pool.query(usageQuery, [userId, code.toUpperCase()]);
        console.log('🔍 Single use check:', { userId, code, usageCount: usageResult.rows[0].count });
        
        if (parseInt(usageResult.rows[0].count) > 0) {
          console.log('❌ User already used this promo');
          return res.status(400).json({
            success: false,
            message: 'Anda sudah menggunakan kode promo ini sebelumnya'
          });
        }
      }

      // Check usage limit
      if (promo.usage_limit) {
        const totalUsageQuery = `
          SELECT COUNT(*) as count
          FROM payment_transactions
          WHERE promo_code = $1
            AND status = 'PAID'
        `;
        const totalUsageResult = await pool.query(totalUsageQuery, [code.toUpperCase()]);
        console.log('🔍 Usage limit check:', { totalUsage: totalUsageResult.rows[0].count, limit: promo.usage_limit });
        
        if (parseInt(totalUsageResult.rows[0].count) >= promo.usage_limit) {
          console.log('❌ Usage limit reached');
          return res.status(400).json({
            success: false,
            message: 'Kode promo ini sudah mencapai batas penggunaan'
          });
        }
      }

      // Return promo details
      console.log('✅ Promo valid:', promo.code);
      res.json({
        success: true,
        message: 'Kode promo valid',
        promo: {
          code: promo.code,
          type: promo.discount_type, // 'percentage' or 'fixed'
          value: parseFloat(promo.discount_value),
          description: promo.description
        }
      });
    } catch (error) {
      console.error('❌ Error validating promo code:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat memvalidasi kode promo'
      });
    }
  }
};

module.exports = PaymentController;

