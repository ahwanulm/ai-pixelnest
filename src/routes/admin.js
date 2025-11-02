const express = require('express');
const router = express.Router();
const multer = require('multer');
const adminController = require('../controllers/adminController');
const { ensureAdmin, logAdminActivity } = require('../middleware/admin');

// Configure multer for SQL file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.sql') || file.originalname.endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error('Only .sql or .txt files are allowed'));
    }
  }
});

// Apply admin middleware to all routes
router.use(ensureAdmin);

// ============ DASHBOARD ============
router.get('/', adminController.getDashboard);
router.get('/dashboard', adminController.getDashboard);

// ============ USER MANAGEMENT ============
router.get('/users', adminController.getUsers);
router.post('/users', logAdminActivity('create_user'), adminController.createUser);
router.get('/users/backup', logAdminActivity('backup_users'), adminController.backupUsers);
router.post('/users/import', upload.single('sqlFile'), logAdminActivity('import_users'), adminController.importUsers);
router.get('/users/:id', adminController.getUserDetails);
router.put('/users/:id', logAdminActivity('update_user'), adminController.updateUser);
router.post('/users/:id/credits', logAdminActivity('add_credits'), adminController.addCredits);
router.delete('/users/:id', logAdminActivity('delete_user'), adminController.deleteUser);

// ============ PROMO CODES ============
router.get('/promo-codes', adminController.getPromoCodes);
router.post('/promo-codes', logAdminActivity('create_promo_code'), adminController.createPromoCode);
router.put('/promo-codes/:id', logAdminActivity('update_promo_code'), adminController.updatePromoCode);
router.delete('/promo-codes/:id', logAdminActivity('delete_promo_code'), adminController.deletePromoCode);
router.get('/promo-codes/:id/usage', adminController.getPromoCodeUsage);

// ============ API CONFIGS ============
router.get('/api-configs', adminController.getApiConfigs);
router.post('/api-configs', logAdminActivity('create_api_config'), adminController.createApiConfig);
router.get('/api-configs/:id', adminController.getApiConfigDetails);
router.put('/api-configs/:id', logAdminActivity('update_api_config'), adminController.updateApiConfig);

// ============ NOTIFICATIONS ============
router.get('/notifications', adminController.getNotifications);
router.post('/notifications', logAdminActivity('create_notification'), adminController.createNotification);
// IMPORTANT: Static routes must come BEFORE dynamic parameter routes
router.delete('/notifications/batch-delete', logAdminActivity('batch_delete_notifications'), adminController.batchDeleteNotifications);
router.delete('/notifications/:id', logAdminActivity('delete_notification'), adminController.deleteNotification);

// ============ ACTIVITY LOGS ============
router.get('/activity-logs', adminController.getActivityLogs);

// ============ SETTINGS ============
router.get('/settings', adminController.getSettings);
router.get('/api/settings', adminController.getSettingsAPI); // NEW: API endpoint for settings
router.put('/settings', logAdminActivity('update_setting'), adminController.updateSetting);
router.get('/api/settings/registration', adminController.getRegistrationSettings);
router.post('/api/settings/registration', logAdminActivity('update_registration_settings'), adminController.updateRegistrationSettings);

// ============ FAL.AI BALANCE ============
router.get('/fal-balance', adminController.getFalBalance);

// ============ AI MODELS MANAGEMENT ============
router.get('/models', adminController.getModels);
router.get('/api/models', adminController.getModelsAPI);
router.post('/api/models', logAdminActivity('add_model'), adminController.addModel);
router.post('/api/models/add-suno', logAdminActivity('add_suno_models'), adminController.addSunoModels);
router.post('/api/models/add-suno-custom', logAdminActivity('add_suno_models_custom'), adminController.addSunoModelsCustom);
router.put('/api/models/:id', logAdminActivity('update_model'), adminController.updateModel);
router.patch('/api/models/:id/toggle', logAdminActivity('toggle_model'), adminController.toggleModelStatus);
router.delete('/api/models/:id', logAdminActivity('delete_model'), adminController.deleteModel);

// ============ FAL.AI MODEL BROWSER (Real-time) ============
router.get('/api/fal/test-connection', adminController.testFalApiConnection);
router.get('/api/fal/browse', adminController.browseFalModels);
router.get('/api/fal/model/:modelId', adminController.getFalModelDetails);
router.post('/api/fal/sync', logAdminActivity('sync_fal_models'), adminController.syncFalModels);
router.post('/api/fal/sync-pricing', logAdminActivity('sync_fal_pricing'), adminController.syncFalPricing);
router.post('/api/fal/import', logAdminActivity('import_model'), adminController.quickImportModel);
router.get('/api/pricing/verify', adminController.verifyPricing);
router.post('/api/pricing/update-all', logAdminActivity('update_all_pricing'), adminController.updatePricing);
router.post('/api/models/:id/sync-price', logAdminActivity('sync_model_price'), adminController.syncModelPrice);

// ============ PRICING SETTINGS ============
router.get('/pricing', adminController.getRealtimePricing); // NEW: Real-time FAL.AI pricing
router.get('/pricing-realtime', adminController.getRealtimePricing); // NEW: Real-time FAL.AI pricing
router.get('/pricing-simple', adminController.getSimplePricingSettings);
router.post('/api/pricing/credit-price', logAdminActivity('update_credit_price'), adminController.updateCreditPrice);
router.post('/api/pricing/fix-base-credit', logAdminActivity('fix_base_credit_usd'), adminController.fixBaseCreditUSD);
// router.get('/pricing-settings', adminController.getPricingSettings); // REMOVED - Use /pricing instead
router.get('/pricing-settings-old', adminController.getPricingSettingsOld);
router.get('/api/pricing/config', adminController.getPricingConfig);
router.put('/api/pricing/config', logAdminActivity('update_pricing'), adminController.updatePricingConfig);
router.get('/api/pricing/models', adminController.getModelPricing);

// ============ PRICING SYNC FROM FAL.AI ============
router.post('/api/pricing/sync', logAdminActivity('sync_fal_pricing'), adminController.syncFalPricing);
router.get('/api/pricing/history', adminController.getPricingHistory);
router.get('/api/pricing/all-models', adminController.getAllModelsPricing);
router.put('/api/pricing/models/:modelId', logAdminActivity('update_model_pricing'), adminController.updateSingleModelPricing);

// ============ PAYMENT TRANSACTIONS (Tripay) ============
router.get('/payment-transactions', adminController.getPaymentTransactions);
router.get('/api/payment-transactions/:id', adminController.getPaymentTransactionDetail);
router.post('/api/payment-channels/sync', logAdminActivity('sync_payment_channels'), adminController.syncPaymentChannels);
router.post('/api/payment-transactions/update-expired', logAdminActivity('update_expired_payments'), adminController.updateExpiredPayments);

// ============ CREDIT PRICE MANAGEMENT ============
router.get('/api/credit-price', adminController.getCreditPrice);
router.put('/api/credit-price', logAdminActivity('update_credit_price'), adminController.updateCreditPrice);

// ============ MODEL CONNECTION TESTING ============
router.get('/model-test', adminController.getModelTest);
router.post('/api/test-fal-connection', adminController.testFalConnection);
router.post('/api/test-suno-connection', adminController.testSunoConnection);
router.post('/api/test-db-connection', adminController.testDbConnection);
router.post('/api/test-model-connection', adminController.testModelConnection);
router.get('/api/models', adminController.getModelsForTesting); // Already exists, reusing

// ============ FAL.AI PRICING VERIFICATION (NEW!) ============
const falPricingRouter = require('./falPricing');
router.use('/api/fal-pricing', falPricingRouter);

// ============ GENERATION JOBS MANAGEMENT ============
const adminJobsController = require('../controllers/adminJobsController');
router.get('/jobs', adminJobsController.showJobsPage);
router.get('/api/jobs/:id', adminJobsController.getJobDetails);
router.post('/api/jobs/:id/cancel', logAdminActivity('cancel_job'), adminJobsController.cancelJob);
router.delete('/api/jobs/:id', logAdminActivity('delete_job'), adminJobsController.deleteJob);
router.post('/api/jobs/bulk-cancel', logAdminActivity('bulk_cancel_jobs'), adminJobsController.bulkCancelJobs);
router.post('/api/jobs/bulk-delete', logAdminActivity('bulk_delete_jobs'), adminJobsController.bulkDeleteJobs);
router.post('/api/jobs/cleanup', logAdminActivity('run_cleanup'), adminJobsController.runCleanup);
router.get('/api/jobs/statistics', adminJobsController.getStatistics);

// ============ BLOG MANAGEMENT ============
const adminBlogController = require('../controllers/adminBlogController');
// View routes
router.get('/blog', adminBlogController.getBlogManagementPage);
router.get('/blog/generate', adminBlogController.getAIGeneratorPage);
router.get('/blog/edit/:id', adminBlogController.getEditPage);
// API routes
router.post('/api/blog/generate', logAdminActivity('generate_blog_article'), adminBlogController.generateArticle);
router.get('/api/blog', adminBlogController.getAllPosts);
router.get('/api/blog/:id', adminBlogController.getPost);
router.post('/api/blog', logAdminActivity('create_blog_post'), adminBlogController.createPost);
router.put('/api/blog/:id', logAdminActivity('update_blog_post'), adminBlogController.updatePost);
router.delete('/api/blog/:id', logAdminActivity('delete_blog_post'), adminBlogController.deletePost);
router.patch('/api/blog/:id/publish', logAdminActivity('toggle_blog_publish'), adminBlogController.togglePublish);
router.post('/api/blog/upload-image', logAdminActivity('upload_blog_image'), adminBlogController.uploadImage);

module.exports = router;

