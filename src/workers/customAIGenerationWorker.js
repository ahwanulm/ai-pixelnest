/**
 * ======================================
 * AI Generation Worker (Custom Queue)
 * ======================================
 * 
 * Worker menggunakan custom queue system
 * dengan FOR UPDATE SKIP LOCKED + LISTEN/NOTIFY
 */

const customQueue = require('../queue/customQueue');
const { pool } = require('../config/database');
const falAiService = require('../services/falAiService');
const videoStorage = require('../utils/videoStorage');

/**
 * Determine if error is permanent (should NOT retry) or transient (can retry)
 */
function isPermanentFailure(error) {
  const errorMessage = error.message?.toLowerCase() || '';
  
  // Validation Errors, Invalid Parameters, Insufficient Credits, etc.
  if (error.status === 422 || 
      errorMessage.includes('validation') ||
      errorMessage.includes('invalid parameters') ||
      errorMessage.includes('unexpected value') ||
      errorMessage.includes('permitted:') ||
      errorMessage.includes('insufficient credits') ||
      errorMessage.includes('model not found') ||
      errorMessage.includes('user not found') ||
      errorMessage.includes('missing required') ||
      errorMessage.includes('is required') ||
      error.status === 401 || error.status === 403 ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('forbidden') ||
      errorMessage.includes('invalid image') ||
      errorMessage.includes('invalid file') ||
      errorMessage.includes('unsupported format')) {
    console.log('   🔴 Permanent error - NOT retrying');
    return true;
  }
  
  console.log('   🟡 Transient error - may retry');
  return false;
}

/**
 * AI Generation Job Handler
 */
async function processAIGeneration(payload, job) {
  const { userId, jobId, generationType, subType, prompt, settings } = payload;

  console.log(`🎨 Processing AI generation for user ${userId}`);
  console.log(`📝 Type: ${generationType} - ${subType}`);

  try {
    // ✨ PRE-FLIGHT CHECK: Verify job is still valid
    const jobCheck = await pool.query(
      `SELECT status, created_at FROM ai_generation_history WHERE job_id = $1`,
      [jobId]
    );

    if (jobCheck.rows.length === 0) {
      const skipError = new Error('Job not found in database');
      skipError.permanent = true;
      throw skipError;
    }

    const currentStatus = jobCheck.rows[0].status;
    const ageInMinutes = (Date.now() - new Date(jobCheck.rows[0].created_at).getTime()) / 1000 / 60;

    // Skip if already completed/failed
    if (currentStatus === 'completed' || currentStatus === 'failed') {
      console.log(`✅ Job already ${currentStatus} - skipping`);
      const skipError = new Error(`Job already ${currentStatus}`);
      skipError.permanent = true;
      throw skipError;
    }

    // Skip if too old (orphaned) - 2 hours to be less aggressive
    if (ageInMinutes > 120) {
      console.log(`🕐 Job expired (${ageInMinutes.toFixed(0)} min old)`);
      await pool.query(
        `UPDATE ai_generation_history 
         SET status = 'failed', error_message = 'Job expired (older than 2 hours)', completed_at = NOW()
         WHERE job_id = $1`,
        [jobId]
      );
      const skipError = new Error('Job expired');
      skipError.permanent = true;
      throw skipError;
    }

    console.log(`   ⏱️  Job age: ${ageInMinutes.toFixed(1)} minutes`);

    // 1. Update status to 'processing'
    await updateJobStatus(jobId, 'processing', 0);
    await customQueue.updateProgress(job.jobId, 10);

    // 2. Check user credits
    const user = await getUserById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // 3. Calculate required credits
    const modelId = settings.modelId;
    const creditsCost = await calculateCreditsCost(modelId, settings);

    if (user.credits < creditsCost) {
      throw new Error(`Insufficient credits. Need ${creditsCost}, have ${user.credits}`);
    }

    // 4. Update progress
    await updateJobStatus(jobId, 'processing', 10);
    await customQueue.updateProgress(job.jobId, 20);

    // 5. Call FAL.AI API
    let result;
    
    if (generationType === 'image') {
      result = await generateImage(modelId, prompt, settings, job.jobId);
    } else if (generationType === 'video') {
      result = await generateVideo(modelId, prompt, settings, job.jobId);
    } else {
      throw new Error(`Unsupported generation type: ${generationType}`);
    }

    // 6. Download and store result
    await updateJobStatus(jobId, 'processing', 80);
    await customQueue.updateProgress(job.jobId, 85);
    
    const storedUrl = await storeResult(userId, result, generationType);

    // 7. Deduct credits
    await deductUserCredits(userId, creditsCost);

    // 8. Update job as completed
    await pool.query(`
      UPDATE ai_generation_history
      SET 
        status = 'completed',
        progress = 100,
        result_url = $1,
        cost_credits = $2,
        completed_at = NOW()
      WHERE job_id = $3
    `, [storedUrl, creditsCost, jobId]);

    await customQueue.updateProgress(job.jobId, 100);

    console.log(`✅ Generation completed for job ${jobId}`);

    // 9. Send NOTIFY to user's SSE connection
    await notifyUser(userId, 'job-completed', {
      jobId,
      resultUrl: storedUrl,
      type: generationType,
    });

    return {
      success: true,
      jobId,
      resultUrl: storedUrl,
      creditsCost,
    };

  } catch (error) {
    console.error(`❌ Generation failed for job ${jobId}:`, error.message);

    // Update job as failed
    await pool.query(`
      UPDATE ai_generation_history
      SET 
        status = 'failed',
        error_message = $1,
        completed_at = NOW()
      WHERE job_id = $2
    `, [error.message, jobId]);

    // Notify user
    await notifyUser(userId, 'job-failed', {
      jobId,
      error: error.message,
    });

    // ✨ SMART RETRY: Detect permanent errors (should NOT retry)
    const isPermanentError = isPermanentFailure(error);
    
    if (isPermanentError) {
      console.log('🚫 Permanent error - NOT retrying');
      // Mark job to not retry in custom queue
      error.permanent = true;
    }

    throw error;
  }
}

/**
 * Generate Image
 */
async function generateImage(modelId, prompt, settings, queueJobId) {
  const modelQuery = await pool.query(
    'SELECT model_id, name FROM ai_models WHERE model_id = $1',
    [modelId]
  );

  if (modelQuery.rows.length === 0) {
    throw new Error('Model not found');
  }

  const { model_id } = modelQuery.rows[0];

  await customQueue.updateProgress(queueJobId, 30);

  const result = await falAiService.generateImage(model_id, prompt, settings);

  await customQueue.updateProgress(queueJobId, 70);

  return result;
}

/**
 * Generate Video
 */
async function generateVideo(modelId, prompt, settings, queueJobId) {
  const modelQuery = await pool.query(
    'SELECT model_id, name FROM ai_models WHERE model_id = $1',
    [modelId]
  );

  if (modelQuery.rows.length === 0) {
    throw new Error('Model not found');
  }

  const { model_id } = modelQuery.rows[0];

  await customQueue.updateProgress(queueJobId, 30);

  const result = await falAiService.generateVideo(model_id, prompt, settings);

  await customQueue.updateProgress(queueJobId, 70);

  return result;
}

/**
 * Store result
 */
async function storeResult(userId, result, type) {
  if (type === 'image') {
    const imageUrl = result.images?.[0]?.url || result.image?.url;
    
    if (!imageUrl) {
      throw new Error('No image URL in result');
    }

    const storedPath = await videoStorage.downloadAndStoreImage(imageUrl, userId);
    return storedPath;

  } else if (type === 'video') {
    const videoUrl = result.video?.url;
    
    if (!videoUrl) {
      throw new Error('No video URL in result');
    }

    const storedPath = await videoStorage.downloadAndStoreVideo(videoUrl, userId);
    return storedPath;
  }

  throw new Error(`Unknown type: ${type}`);
}

/**
 * Helper functions
 */
async function updateJobStatus(jobId, status, progress) {
  await pool.query(`
    UPDATE ai_generation_history
    SET status = $1, progress = $2
    WHERE job_id = $3
  `, [status, progress, jobId]);
}

async function getUserById(userId) {
  const result = await pool.query(
    'SELECT id, name, email, credits FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0];
}

async function calculateCreditsCost(modelId, settings) {
  const result = await pool.query(`
    SELECT cost FROM ai_models WHERE model_id = $1
  `, [modelId]);

  if (result.rows.length === 0) {
    throw new Error('Model not found');
  }

  // Keep decimal precision (database uses DECIMAL(10,2))
  // Round to 2 decimal places for consistency
  const cost = Math.round(parseFloat(result.rows[0].cost) * 100) / 100;
  
  console.log(`💰 Model cost: ${cost} credits`);
  return cost;
}

async function deductUserCredits(userId, amount) {
  // Keep decimal precision (database credits column is DECIMAL(10,2))
  // Round to 2 decimal places for consistency
  const creditsToDeduct = Math.round(parseFloat(amount) * 100) / 100;
  
  console.log(`💳 Deducting ${creditsToDeduct} credits from user ${userId}`);
  
  await pool.query(`
    UPDATE users
    SET credits = credits - $1
    WHERE id = $2
  `, [creditsToDeduct, userId]);
}

/**
 * Send notification via Postgres NOTIFY
 */
async function notifyUser(userId, event, data) {
  try {
    const payload = JSON.stringify({ event, data });
    await pool.query(
      `NOTIFY generation_updates_${userId}, $1`,
      [payload]
    );
  } catch (error) {
    console.error('Failed to send NOTIFY:', error);
  }
}

/**
 * Start worker
 */
async function startWorker() {
  console.log('🚀 Starting AI Generation Worker (Custom Queue)...');

  try {
    // Initialize custom queue
    await customQueue.initialize();

    // Register worker
    await customQueue.registerWorker(
      'ai-generation',
      processAIGeneration,
      {
        concurrency: 3, // ✨ Process 3 jobs concurrently (matches frontend limit)
        pollingInterval: 2000, // Poll every 2 seconds
      }
    );

    console.log('✅ AI Generation Worker is running');
    console.log('⏳ Waiting for jobs...');

  } catch (error) {
    console.error('❌ Failed to start worker:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
async function shutdown() {
  console.log('🛑 Shutting down worker...');
  await customQueue.shutdown();
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start if run directly
if (require.main === module) {
  startWorker();
}

module.exports = { startWorker, processAIGeneration };

