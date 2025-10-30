/**
 * ======================================
 * AI Generation Worker (pg-boss)
 * ======================================
 * 
 * Worker untuk memproses AI generation jobs
 * Berjalan terpisah dari main server
 */

const queueManager = require('../queue/pgBossQueue');
const { pool } = require('../config/database');
const falAiService = require('../services/falAiService');
const sunoService = require('../services/sunoService');
const videoStorage = require('../utils/videoStorage');
const fs = require('fs').promises;
const path = require('path');

// Try to load sharp, fallback if not available
let sharp;
try {
  sharp = require('sharp');
} catch (err) {
  console.warn('⚠️ Sharp not available, image processing will use fallback methods');
  sharp = null;
}

/**
 * Determine if error is permanent (should NOT retry) or transient (can retry)
 */
function isPermanentFailure(error) {
  const errorMessage = error.message?.toLowerCase() || '';
  const errorBody = error.body || {};
  
  // 1. Validation Errors (422) - Parameter issues, won't fix with retry
  if (error.status === 422 || errorMessage.includes('validation')) {
    console.log('   🔴 Type: Validation Error (permanent)');
    return true;
  }
  
  // 2. Invalid Parameters - Model constraints
  if (errorMessage.includes('invalid parameters') || 
      errorMessage.includes('unexpected value') ||
      errorMessage.includes('permitted:')) {
    console.log('   🔴 Type: Invalid Parameters (permanent)');
    return true;
  }
  
  // 3. Insufficient Credits - Won't change without user action
  if (errorMessage.includes('insufficient credits')) {
    console.log('   🔴 Type: Insufficient Credits (permanent)');
    return true;
  }
  
  // 4. Model Not Found - Database issue
  if (errorMessage.includes('model not found') || 
      errorMessage.includes('invalid model')) {
    console.log('   🔴 Type: Model Not Found (permanent)');
    return true;
  }
  
  // 5. User Not Found - Data integrity issue
  if (errorMessage.includes('user not found')) {
    console.log('   🔴 Type: User Not Found (permanent)');
    return true;
  }
  
  // 6. Missing Required Fields
  if (errorMessage.includes('missing required') || 
      errorMessage.includes('is required')) {
    console.log('   🔴 Type: Missing Fields (permanent)');
    return true;
  }
  
  // 7. Authorization/Authentication Errors (401, 403)
  if (error.status === 401 || error.status === 403 || 
      errorMessage.includes('unauthorized') || 
      errorMessage.includes('forbidden')) {
    console.log('   🔴 Type: Auth Error (permanent)');
    return true;
  }
  
  // 8. Invalid File/Image - Upload issues
  if (errorMessage.includes('invalid image') ||
      errorMessage.includes('invalid file') ||
      errorMessage.includes('unsupported format')) {
    console.log('   🔴 Type: Invalid File (permanent)');
    return true;
  }

  // 9. Timeout Errors - Don't retry aggressive timeouts
  if (errorMessage.includes('timeout') ||
      errorMessage.includes('tidak merespons')) {
    // For 3D models with long timeouts (10+ minutes), timeout means permanent issue
    if (errorMessage.includes('600 detik') || errorMessage.includes('600s') ||
        errorMessage.includes('10 minutes')) {
      console.log('   🔴 Type: Long Timeout (permanent - 3D model issue)');
      return true;
    }
    // For video models with 8+ minute timeouts, also permanent
    if (errorMessage.includes('480 detik') || errorMessage.includes('480s') ||
        errorMessage.includes('8 minutes')) {
      console.log('   🔴 Type: Long Timeout (permanent - video model issue)');
      return true;
    }
    // Regular timeouts (3 minutes) can be retried
    console.log('   🟡 Type: Short Timeout (transient - may retry)');
    return false;
  }

  // All other errors are considered transient (network, rate limit, etc)
  console.log('   🟡 Type: Transient Error (may retry)');
  return false;
}

/**
 * AI Generation Job Handler
 */
async function processAIGeneration(jobData, job) {
  // Safety check: Ensure jobData exists
  if (!jobData || typeof jobData !== 'object') {
    console.error('❌ Worker received invalid jobData:', jobData);
    const skipError = new Error('Invalid job data received. This may be an old/corrupted job.');
    skipError.expireJob = true; // Don't retry invalid data
    throw skipError;
  }

  const { userId, jobId, generationType, subType, prompt, settings, uploadedFiles } = jobData;
  
  const startTime = Date.now();
  
  // ✨ Progress monitoring - detect stuck jobs
  let lastProgress = 0;
  let lastProgressTime = Date.now();
  const PROGRESS_STAGNATION_TIMEOUT = 120000; // 2 minutes without progress = stuck
  
  const progressMonitor = setInterval(async () => {
    try {
      const jobCheck = await pool.query(
        'SELECT progress FROM ai_generation_history WHERE job_id = $1',
        [jobId]
      );
      
      if (jobCheck.rows.length > 0) {
        const currentProgress = jobCheck.rows[0].progress;
        const timeSinceLastProgress = Date.now() - lastProgressTime;
        
        // If progress hasn't changed in 2 minutes, job might be stuck
        if (currentProgress === lastProgress && timeSinceLastProgress > PROGRESS_STAGNATION_TIMEOUT) {
          console.error(`⚠️ Job ${jobId} stuck at ${currentProgress}% for ${timeSinceLastProgress/1000}s`);
          // Don't throw here, just log - let timeout handle it
        } else if (currentProgress > lastProgress) {
          lastProgress = currentProgress;
          lastProgressTime = Date.now();
        }
      }
    } catch (err) {
      // Ignore errors in progress monitoring
    }
  }, 30000); // Check every 30 seconds

  console.log('═══════════════════════════════════════════════');
  console.log(`🎨 [${new Date().toISOString()}] Processing AI Generation`);
  console.log(`   Job ID: ${jobId || 'N/A'}`);
  console.log(`   User ID: ${userId || 'N/A'}`);
  console.log(`   Type: ${generationType || 'N/A'} - ${subType || 'N/A'}`);
  console.log(`   Prompt: ${prompt ? prompt.substring(0, 60) + '...' : 'N/A'}`);
  console.log(`   ⚡ CONCURRENT JOB - May process alongside other jobs`);
  
  if (uploadedFiles && Object.keys(uploadedFiles).length > 0) {
    console.log(`   📁 Uploaded files:`, Object.keys(uploadedFiles));
  }
  console.log('═══════════════════════════════════════════════');

  try {
    // ✨ PRE-FLIGHT CHECK: Verify job is still valid and not already processed
    const jobCheck = await pool.query(
      `SELECT status, created_at, error_message 
       FROM ai_generation_history 
       WHERE job_id = $1`,
      [jobId]
    );

    if (jobCheck.rows.length === 0) {
      console.error('⚠️ Job not found in database - may have been deleted or not yet committed');
      console.error('   Job ID:', jobId);
      console.error('   This may indicate a race condition - worker started before DB commit');
      console.error('   Consider increasing delay in generationQueueController.js');
      const skipError = new Error('Job not found in database');
      skipError.expireJob = true;
      throw skipError;
    }

    const currentStatus = jobCheck.rows[0].status;
    const createdAt = new Date(jobCheck.rows[0].created_at);
    const ageInMinutes = (Date.now() - createdAt.getTime()) / 1000 / 60;

    // ✨ SKIP if already completed or failed
    if (currentStatus === 'completed') {
      console.log('✅ Job already completed - skipping');
      const skipError = new Error('Job already completed');
      skipError.expireJob = true;
      throw skipError;
    }

    if (currentStatus === 'failed') {
      console.log('❌ Job already failed - skipping retry');
      const skipError = new Error('Job already marked as failed');
      skipError.expireJob = true;
      throw skipError;
    }

    // ✨ SKIP if job is too old (orphaned) - 2 hours to be less aggressive
    if (ageInMinutes > 120) { // 2 hours (was 1 hour - less aggressive)
      console.log(`🕐 Job is ${ageInMinutes.toFixed(0)} minutes old - marking as expired`);
      await pool.query(
        `UPDATE ai_generation_history 
         SET status = 'failed', 
             error_message = 'Job expired (older than 2 hours)',
             completed_at = NOW()
         WHERE job_id = $1`,
        [jobId]
      );
      const skipError = new Error('Job expired (too old)');
      skipError.expireJob = true;
      throw skipError;
    }

    // ✨ Log job age for monitoring
    console.log(`   ⏱️  Job age: ${ageInMinutes.toFixed(1)} minutes`);

    // 0. Validate input
    if (!userId || !jobId || !generationType || !prompt) {
      const validationError = new Error(`Missing required fields: userId=${userId}, jobId=${jobId}, generationType=${generationType}, prompt=${prompt ? 'exists' : 'missing'}`);
      validationError.expireJob = true; // Don't retry missing fields
      throw validationError;
    }

    if (!settings || !settings.modelId) {
      const validationError = new Error('Missing model ID in settings');
      validationError.expireJob = true;
      throw validationError;
    }

    // 1. Update status to 'processing'
    await updateJobStatus(jobId, 'processing', 0);

    // 2. Check user credits
    const user = await getUserById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // 3. Calculate required credits
    const modelId = settings.modelId;
    // Pass subType for accurate cost calculation (image-to-video vs text-to-video)
    const costSettings = {
      ...settings,
      type: subType, // Add subType for video type multiplier
      subType: subType
    };
    const creditsCost = await calculateCreditsCost(modelId, costSettings);

    if (user.credits < creditsCost) {
      throw new Error(`Insufficient credits. Need ${creditsCost}, have ${user.credits}`);
    }

    // 4. Update progress - Starting generation
    await updateJobStatus(jobId, 'processing', 10);

    // 5. Call FAL.AI API based on type
    let result;
    
    if (generationType === 'image') {
      result = await generateImage(modelId, prompt, settings, uploadedFiles, jobId); // ✅ Pass uploadedFiles!
    } else if (generationType === 'video') {
      result = await generateVideo(modelId, prompt, settings, uploadedFiles, jobId);
    } else if (generationType === 'audio') {
      result = await generateAudio(modelId, prompt, settings, subType, jobId);
    } else {
      throw new Error(`Unsupported generation type: ${generationType}`);
    }

    // 6. Download and store result
    await updateJobStatus(jobId, 'processing', 80);
    
    const storedUrl = await storeResult(userId, result, generationType);

    // 7. Deduct credits
    await deductUserCredits(userId, creditsCost);

    // 8. Update job status
    if (storedUrl === null) {
      // Callback-based: save as processing
      await pool.query(`
        UPDATE ai_generation_history
        SET
          status = 'processing',
          progress = 50,
          metadata = $1,
          cost_credits = $2
        WHERE job_id = $3
      `, [JSON.stringify(result), creditsCost, jobId]);

      console.log('💾 Processing - awaiting callback');
    } else {
      // ✅ Handle different storedUrl formats (string for most types, object for 3D)
      let resultUrl, metadata;

      if (typeof storedUrl === 'object' && storedUrl.url) {
        // 3D models: store local URL in result_url, model data in metadata
        resultUrl = storedUrl.url;
        metadata = JSON.stringify({
          ...result,
          model: storedUrl.model // Include model data for frontend
        });
      } else {
        // Regular types: store URL directly
        resultUrl = storedUrl;
        metadata = null;
      }

      // Direct result: mark completed
      await pool.query(`
        UPDATE ai_generation_history
        SET
          status = 'completed',
          progress = 100,
          result_url = $1,
          metadata = $2,
          cost_credits = $3,
          completed_at = NOW()
        WHERE job_id = $4
      `, [resultUrl, metadata, creditsCost, jobId]);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // ✨ Clear progress monitor on success
    clearInterval(progressMonitor);
    
    const finalStatus = storedUrl === null ? 'Processing (Awaiting Callback)' : 'Completed Successfully';
    console.log('═══════════════════════════════════════════════');
    console.log(`✅ [${new Date().toISOString()}] Generation ${finalStatus}`);
    console.log(`   Job ID: ${jobId}`);
    console.log(`   User ID: ${userId}`);
    if (storedUrl) {
      console.log(`   Result: ${storedUrl}`);
    } else {
      console.log(`   Task ID: ${result.taskId || result.audio_id}`);
      console.log(`   Status: Awaiting callback`);
    }
    console.log(`   Credits: ${creditsCost}`);
    console.log(`   Duration: ${duration}s`);
    console.log('═══════════════════════════════════════════════');

    // 9. Publish event
    if (storedUrl !== null) {
      // Completed immediately
      await queueManager.publish('generation.completed', {
        userId,
        jobId,
        resultUrl: storedUrl,
        type: generationType,
        creditsCost,
        duration: parseFloat(duration)
      });
    } else {
      // Processing via callback
      await queueManager.publish('generation.processing', {
        userId,
        jobId,
        taskId: result.taskId || result.audio_id,
        type: generationType,
        message: 'Awaiting callback'
      });
    }

    return {
      success: true,
      jobId,
      resultUrl: storedUrl,
      creditsCost,
      isProcessing: storedUrl === null,
      taskId: storedUrl === null ? (result.taskId || result.audio_id) : null,
      duration: parseFloat(duration)
    };

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // ✨ Clear progress monitor on error
    clearInterval(progressMonitor);
    
    console.log('═══════════════════════════════════════════════');
    console.error(`❌ [${new Date().toISOString()}] Generation Failed`);
    console.error(`   Job ID: ${jobId}`);
    console.error(`   User ID: ${userId}`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Duration: ${duration}s`);
    console.log('═══════════════════════════════════════════════');

    // Update job as failed
    await pool.query(`
      UPDATE ai_generation_history
      SET 
        status = 'failed',
        error_message = $1,
        completed_at = NOW()
      WHERE job_id = $2
    `, [error.message, jobId]);

    // Publish failure event
    await queueManager.publish('generation.failed', {
      userId,
      jobId,
      error: error.message,
    });

    // ✨ SMART RETRY: Detect permanent errors (should NOT retry)
    const isPermanentError = isPermanentFailure(error);
    
    if (isPermanentError) {
      console.log('🚫 Permanent error detected - NOT retrying');
      // Create custom error that tells pg-boss to NOT retry
      const noRetryError = new Error(error.message);
      noRetryError.name = 'PermanentError';
      noRetryError.expireJob = true; // pg-boss will expire job immediately
      throw noRetryError;
    } else {
      console.log('🔄 Transient error - may retry');
      throw error; // Allow retry for network/timeout errors
    }
  } finally {
    // ✨ CLEANUP: Clear progress monitor (safety net)
    if (progressMonitor) {
      clearInterval(progressMonitor);
    }
    
    // ✨ CLEANUP: Delete temporary uploaded files
    await cleanupUploadedFiles(uploadedFiles);
  }
}

/**
 * ======================================
 * Helper Functions for Image Processing
 * ======================================
 */

/**
 * Convert image file to Data URI (base64)
 * FAL.AI requires HTTPS URLs or Data URIs, not HTTP localhost
 */
async function convertImageToDataUri(imagePath) {
  const imageBuffer = await fs.readFile(imagePath);
  const mimeType = getMimeType(imagePath);
  const base64 = imageBuffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Get MIME type from file extension
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif'
  };
  return mimeTypes[ext] || 'image/jpeg';
}

/**
 * Get image dimensions using sharp (with fallback)
 */
async function getImageDimensions(imagePath) {
  if (sharp) {
    try {
      const metadata = await sharp(imagePath).metadata();
      return {
        width: metadata.width,
        height: metadata.height
      };
    } catch (err) {
      console.warn('⚠️ Sharp failed to read image metadata:', err.message);
    }
  }
  
  // Fallback: return default dimensions
  console.log('📐 Using fallback dimensions (1920x1080)');
  return { width: 1920, height: 1080 };
}

/**
 * Detect aspect ratio from image dimensions
 * Returns closest standard aspect ratio
 */
function detectAspectRatio(width, height) {
  const ratio = width / height;
  
  // Define standard aspect ratios with tolerance
  const aspectRatios = [
    { value: '1:1', ratio: 1.0, tolerance: 0.1 },
    { value: '4:3', ratio: 4/3, tolerance: 0.1 },
    { value: '3:4', ratio: 3/4, tolerance: 0.1 },
    { value: '16:9', ratio: 16/9, tolerance: 0.1 },
    { value: '9:16', ratio: 9/16, tolerance: 0.1 },
    { value: '21:9', ratio: 21/9, tolerance: 0.1 }
  ];
  
  // Find closest match
  for (const ar of aspectRatios) {
    if (Math.abs(ratio - ar.ratio) <= ar.tolerance) {
      return ar.value;
    }
  }
  
  // Default to closest between landscape/portrait
  return ratio > 1 ? '16:9' : '9:16';
}

/**
 * Generate Image (with quantity support)
 */
async function generateImage(modelId, prompt, settings, uploadedFiles, jobId) {
  // Get model details
  const modelQuery = await pool.query(
    'SELECT model_id, name, type FROM ai_models WHERE model_id = $1',
    [modelId]
  );

  if (modelQuery.rows.length === 0) {
    throw new Error('Model not found');
  }

  const { model_id, name, type } = modelQuery.rows[0];

  // Validate model type
  if (type !== 'image' && type !== 'text-to-image') {
    throw new Error(`Invalid model type for image generation: ${type}`);
  }

  const quantity = parseInt(settings.quantity) || 1;
  console.log(`🎨 Generating ${quantity} image(s) with ${name}`);

  // ✅ CRITICAL: Handle multiple images for edit-multi (batch processing)
  if (uploadedFiles && uploadedFiles.multiImages && uploadedFiles.multiImages.length > 0) {
    console.log(`🎨 Edit-Multi: Processing ${uploadedFiles.multiImages.length} images in batch`);
    
    const results = [];
    const totalImages = uploadedFiles.multiImages.length;
    
    for (let i = 0; i < totalImages; i++) {
      const imageFile = uploadedFiles.multiImages[i];
      console.log(`   Processing image ${i + 1}/${totalImages}: ${imageFile.filename}`);
      
      try {
        // Convert image to Data URI
        const imageDataUri = await convertImageToDataUri(imageFile.fullPath);
        const batchSettings = { ...settings, image_url: imageDataUri };
        
        // Process image with model
        const result = await falAiService.generateImage(model_id, prompt, batchSettings);
        results.push(result);
        
        // Update progress incrementally
        const progress = 30 + ((i + 1) / totalImages) * 40; // 30-70%
        await updateJobStatus(jobId, 'processing', Math.round(progress));
        
        console.log(`   ✅ Image ${i + 1}/${totalImages} processed successfully`);
      } catch (err) {
        console.error(`   ❌ Failed to process image ${i + 1}:`, err.message);
        // Continue with other images even if one fails
      }
    }
    
    if (results.length === 0) {
      throw new Error('Failed to process any images in batch');
    }
    
    // Combine all results
    const combinedResult = {
      images: results.flatMap(r => r.images || [])
    };
    
    console.log(`✅ Batch processing complete: ${combinedResult.images.length} images generated`);
    await updateJobStatus(jobId, 'processing', 70);
    return combinedResult;
  }
  
  // ✅ CRITICAL: Handle single uploaded image for edit/inpainting operations
  const enhancedSettings = { ...settings };
  
  if (uploadedFiles && (uploadedFiles.startImagePath || uploadedFiles.startImageUrl)) {
    if (uploadedFiles.startImagePath || uploadedFiles.startImageFullPath) {
      // Convert local image to Data URI for FAL.AI (required for edit operations)
      const imagePath = uploadedFiles.startImageFullPath || path.join(__dirname, '../../public', uploadedFiles.startImagePath);
      try {
        const imageDataUri = await convertImageToDataUri(imagePath);
        enhancedSettings.image_url = imageDataUri;
        console.log('🖼️ Edit image detected - converted to Data URI (base64)');
      } catch (err) {
        console.error('⚠️ Failed to convert image to Data URI:', err);
        // Fallback to URL (may not work with localhost)
        enhancedSettings.image_url = uploadedFiles.startImageUrl || `${process.env.BASE_URL || 'http://localhost:3000'}${uploadedFiles.startImagePath}`;
        console.log('🖼️ Fallback: Using URL:', enhancedSettings.image_url);
      }
    } else if (uploadedFiles.startImageUrl) {
      enhancedSettings.image_url = uploadedFiles.startImageUrl;
      console.log('🔗 Edit image detected (from URL):', enhancedSettings.image_url);
    }
  }

  // Update progress - Calling FAL.AI
  await updateJobStatus(jobId, 'processing', 30);

  // ✨ Handle quantity
  if (quantity > 1) {
    // Generate multiple images
    const results = [];
    for (let i = 0; i < quantity; i++) {
      console.log(`   Generating image ${i + 1}/${quantity}...`);
      
      const result = await falAiService.generateImage(model_id, prompt, enhancedSettings);
      results.push(result);
      
      // Update progress incrementally
      const progress = 30 + ((i + 1) / quantity) * 40; // 30-70%
      await updateJobStatus(jobId, 'processing', Math.round(progress));
    }
    
    // Combine results
    const combinedResult = {
      images: results.flatMap(r => r.images || [])
    };
    
    console.log(`✅ Generated ${combinedResult.images.length} images`);
    await updateJobStatus(jobId, 'processing', 70);
    return combinedResult;
    
  } else {
    // Single image generation
    const result = await falAiService.generateImage(model_id, prompt, enhancedSettings);
    await updateJobStatus(jobId, 'processing', 70);
    return result;
  }
}

/**
 * Generate Video (with validation and error handling)
 */
async function generateVideo(modelId, prompt, settings, uploadedFiles, jobId) {
  const modelQuery = await pool.query(
    'SELECT model_id, name, type, max_duration FROM ai_models WHERE model_id = $1',
    [modelId]
  );

  if (modelQuery.rows.length === 0) {
    throw new Error('Model not found');
  }

  const { model_id, name, type, max_duration } = modelQuery.rows[0];

  // Validate model type
  if (type !== 'video' && type !== 'text-to-video') {
    throw new Error(`Invalid model type for video generation: ${type}`);
  }
  
  // Validate image-to-video requirements
  const videoType = settings.type || settings.subType || settings.videoType;
  if (videoType === 'image-to-video' || videoType === 'image-to-video-end') {
    if (!uploadedFiles || (!uploadedFiles.startImagePath && !uploadedFiles.startImageFullPath && !uploadedFiles.startImageUrl)) {
      throw new Error('Image-to-video requires an uploaded image');
    }
    console.log(`📸 Image-to-video mode: ${videoType}`);
    
    if (videoType === 'image-to-video-end') {
      if (!uploadedFiles.endImagePath && !uploadedFiles.endImageFullPath && !uploadedFiles.endImageUrl) {
        throw new Error('Image-to-video (end frame) requires both start and end images');
      }
    }
  }

  // Validate duration
  const requestedDuration = parseInt(settings.duration) || 5;
  const maxDur = parseInt(max_duration) || 20;
  if (requestedDuration > maxDur) {
    throw new Error(`Requested duration (${requestedDuration}s) exceeds model maximum (${maxDur}s)`);
  }

  console.log(`🎬 Generating ${requestedDuration}s video with ${name}`);

  // Update progress
  await updateJobStatus(jobId, 'processing', 30);

  // ✨ Merge uploadedFiles into settings for FAL.AI
  const enhancedSettings = { ...settings };
  
  if (uploadedFiles) {
    // Convert local image files to Data URI for FAL.AI
    if (uploadedFiles.startImagePath || uploadedFiles.startImageFullPath) {
      const imagePath = uploadedFiles.startImageFullPath || path.join(__dirname, '../../public', uploadedFiles.startImagePath);
      try {
        const imageDataUri = await convertImageToDataUri(imagePath);
        enhancedSettings.image_url = imageDataUri;
        console.log('🖼️ Converted start image to Data URI (base64)');
        
        // Auto-detect aspect ratio from image
        const { width, height } = await getImageDimensions(imagePath);
        const detectedRatio = detectAspectRatio(width, height);
        enhancedSettings.aspect_ratio = detectedRatio;
        console.log(`📐 Auto-detected aspect ratio: ${detectedRatio} (${width}x${height})`);
      } catch (err) {
        console.error('⚠️ Failed to convert image to Data URI:', err);
        // Fallback to URL
        enhancedSettings.image_url = uploadedFiles.startImageUrl || `${process.env.BASE_URL || 'http://localhost:3000'}${uploadedFiles.startImagePath}`;
      }
    } else if (uploadedFiles.startImageUrl) {
      enhancedSettings.image_url = uploadedFiles.startImageUrl;
      console.log('🔗 Using start image URL:', enhancedSettings.image_url);
    }
    
    if (uploadedFiles.endImagePath || uploadedFiles.endImageFullPath) {
      const imagePath = uploadedFiles.endImageFullPath || path.join(__dirname, '../../public', uploadedFiles.endImagePath);
      try {
        const imageDataUri = await convertImageToDataUri(imagePath);
        enhancedSettings.end_image_url = imageDataUri;
        console.log('🖼️ Converted end image to Data URI (base64)');
      } catch (err) {
        console.error('⚠️ Failed to convert end image to Data URI:', err);
        // Fallback to URL
        enhancedSettings.end_image_url = uploadedFiles.endImageUrl || `${process.env.BASE_URL || 'http://localhost:3000'}${uploadedFiles.endImagePath}`;
      }
    } else if (uploadedFiles.endImageUrl) {
      enhancedSettings.end_image_url = uploadedFiles.endImageUrl;
      console.log('🔗 Using end image URL:', enhancedSettings.end_image_url);
    }
  }

  // Call FAL.AI with retry logic
  let retries = 0;
  const maxRetries = 2;
  let result;

  while (retries <= maxRetries) {
    try {
      result = await falAiService.generateVideo(model_id, prompt, enhancedSettings);
      break; // Success, exit loop
    } catch (error) {
      retries++;
      if (retries > maxRetries) {
        throw error; // Max retries reached
      }
      
      console.warn(`⚠️ FAL.AI error, retrying (${retries}/${maxRetries}):`, error.message);
      await new Promise(resolve => setTimeout(resolve, 5000 * retries)); // Backoff delay
    }
  }

  await updateJobStatus(jobId, 'processing', 70);

  return result;
}

/**
 * Generate Audio (TTS, Music, SFX)
 */
async function generateAudio(modelId, prompt, settings, subType, jobId) {
  const modelQuery = await pool.query(
    'SELECT model_id, name, type, provider, metadata FROM ai_models WHERE model_id = $1',
    [modelId]
  );

  if (modelQuery.rows.length === 0) {
    throw new Error('Model not found');
  }

  const { model_id, name, type, provider, metadata } = modelQuery.rows[0];

  // Validate model type
  if (type !== 'audio') {
    throw new Error(`Invalid model type for audio generation: ${type}`);
  }

  console.log(`🎵 Generating audio (${subType}) with ${name} [Provider: ${provider}]`);
  console.log(`   Prompt: ${prompt.substring(0, 60)}...`);
  
  // Log advanced options if present
  if (settings.advanced) {
    console.log(`   🎨 Advanced Options:`, JSON.stringify(settings.advanced, null, 2));
  }

  // Update progress
  await updateJobStatus(jobId, 'processing', 30);

  let result;

  // ========================================
  // ROUTE BASED ON PROVIDER
  // ========================================
  
  if (provider === 'SUNO' && subType === 'text-to-music') {
    // ========== SUNO MUSIC GENERATION ==========
    console.log('🎼 Routing to Suno API...');
    
    // Extract model version from metadata or model_id
    const modelVersion = metadata?.version || model_id.replace('suno-', '');
    
    // Prepare Suno-specific parameters
    const sunoParams = {
      prompt: prompt,
      model: modelVersion,
      make_instrumental: settings.advanced?.make_instrumental || false,
      custom_mode: settings.advanced?.custom_mode || false,
      title: settings.advanced?.title || '',
      tags: settings.advanced?.tags || '',
      weirdness: settings.advanced?.weirdness || 0.5,
      style_weight: settings.advanced?.style_weight || 0.7,
      wait_audio: true
    };
    
    // Add vocal_gender if provided and not instrumental
    if (!sunoParams.make_instrumental && settings.advanced?.vocal_gender) {
      sunoParams.vocal_gender = settings.advanced.vocal_gender;
    }
    
    // Add tempo if provided (convert to tags/style description)
    if (settings.advanced?.tempo) {
      const tempo = parseInt(settings.advanced.tempo);
      let tempoDesc = '';
      
      if (tempo < 90) {
        tempoDesc = 'slow tempo';
      } else if (tempo > 140) {
        tempoDesc = 'fast tempo';
      } else {
        tempoDesc = 'medium tempo';
      }
      
      // Add tempo to tags/style
      if (sunoParams.tags) {
        sunoParams.tags += `, ${tempoDesc}`;
      } else {
        sunoParams.tags = tempoDesc;
      }
      
      console.log(`   🎵 Tempo: ${tempo} BPM (${tempoDesc})`);
    }
    
    console.log(`   🎵 Suno Model: ${modelVersion}`);
    console.log(`   🎨 Custom Mode: ${sunoParams.custom_mode}`);
    console.log(`   🎹 Instrumental: ${sunoParams.make_instrumental}`);
    
    const sunoResponse = await sunoService.generateMusic(sunoParams);
    
    console.log('📦 Suno API response received');
    
    // SunoService.generateMusic() returns:
    // - Array of 2 tracks: [{ audio_url, ... }, { audio_url, ... }]
    // - Or single track: { audio_url, ... }
    
    // Handle callback-based response (Suno uses callbacks)
    if (sunoResponse.callback_based) {
      console.log('📞 Callback-based: taskId saved, awaiting webhook update');
      result = {
        audio_url: null, // Pending callback
        audio_id: sunoResponse.taskId,
        status: 'processing',
        taskId: sunoResponse.taskId,
        message: 'Awaiting Suno callback (~30-60s)',
        metadata: sunoResponse
      };
      // ✅ DON'T return early - let the code flow continue to deduct credits
      // The cost will be persisted in the main flow (line 301)
    } else {
    
      const tracks = Array.isArray(sunoResponse) ? sunoResponse : [sunoResponse];
      
      console.log(`   🎵 Received ${tracks.length} track(s) from Suno`);
      
      // Validate at least one track
      if (tracks.length === 0 || !tracks[0]?.audio_url) {
        console.error('❌ Invalid Suno response:', sunoResponse);
        throw new Error('Invalid Suno API response: no audio_url found');
      }
      
      // Use first track as primary result for database
      result = {
        audio_url: tracks[0].audio_url,
        audio_id: tracks[0].audio_id,
        video_url: tracks[0].video_url,
        image_url: tracks[0].image_url,
        metadata: {
          ...(tracks[0].metadata || tracks[0]),
          all_tracks: tracks // Store all tracks in metadata
        }
      };
      
      console.log(`   ✅ Primary audio: ${result.audio_url?.substring(0, 80)}...`);
      if (tracks.length > 1) {
        console.log(`   ✅ Additional audio: ${tracks[1].audio_url?.substring(0, 80)}...`);
      }
    }
    
  } else if (provider === 'FAL' || !provider) {
    // ========== FAL.AI GENERATION ==========
    console.log('🎼 Routing to Fal.ai...');
    
    // Prepare options for FAL.AI service
    const audioOptions = {
      prompt: prompt,
      model: model_id,
      duration: parseInt(settings.duration) || undefined
    };

    // Add advanced options for music generation
    if (settings.advanced) {
      audioOptions.advanced = settings.advanced;
    }

    // Call appropriate FAL.AI method based on subType
    if (subType === 'text-to-speech') {
      console.log('🗣️ Generating speech...');
      result = await falAiService.generateTextToSpeech(audioOptions);
    } else if (subType === 'text-to-music') {
      console.log('🎼 Generating music...');
      
      // Log if lyrics are provided
      if (settings.advanced?.lyrics) {
        console.log(`   📝 With lyrics (${settings.advanced.lyrics.length} chars)`);
      }
      
      result = await falAiService.generateMusic(audioOptions);
    } else if (subType === 'text-to-audio') {
      console.log('🔊 Generating sound effect...');
      result = await falAiService.generateSoundEffect(audioOptions);
    } else {
      throw new Error(`Unknown audio subType: ${subType}`);
    }
    
  } else {
    throw new Error(`Unsupported provider "${provider}" for subType "${subType}"`);
  }

  await updateJobStatus(jobId, 'processing', 70);

  return result;
}

/**
 * Store result (download and save to disk)
 * Handles both single and multiple images
 */
async function storeResult(userId, result, type) {
  // ✅ Special handling for 3D models (they return a model object, not images)
  if (result.model) {
    console.log('🎲 Processing 3D model result');

    const modelData = result.model;
    const modelUrl = modelData.url;

    if (!modelUrl) {
      console.error('❌ No 3D model URL found in result:', JSON.stringify(result, null, 2));
      throw new Error('No 3D model URL in result');
    }

    console.log(`📥 Downloading 3D model: ${modelData.file_name || 'model.zip'} (${(modelData.file_size / 1024 / 1024).toFixed(2)} MB)`);
    const storedPath = await videoStorage.downloadAndStoreModel(modelUrl, userId, modelData.file_name || 'model.zip');
    console.log(`✅ 3D model stored: ${storedPath}`);

    // ✅ For 3D models, return the model data object instead of just URL
    // This allows frontend to display the model directly
    return {
      url: storedPath, // Local path for database
      model: modelData  // Model data for frontend display
    };
  }

  if (type === 'image') {
    // Handle multiple images
    if (result.images && result.images.length > 0) {
      const storedPaths = [];
      
      for (let i = 0; i < result.images.length; i++) {
        const image = result.images[i];
        // Handle multiple possible URL formats
        const imageUrl = image.url || image.image_url || image.content_url;
        
        if (!imageUrl) {
          console.warn(`⚠️ Skipping image ${i + 1}: no URL`);
          continue;
        }

        console.log(`📥 Downloading image ${i + 1}/${result.images.length}...`);
        const storedPath = await videoStorage.downloadAndStoreImage(imageUrl, userId);
        storedPaths.push(storedPath);
      }

      if (storedPaths.length === 0) {
        throw new Error('Failed to store any images');
      }

      console.log(`✅ Stored ${storedPaths.length} image(s)`);
      
      // Return first image path as primary, store others in metadata
      return storedPaths[0];
    }
    
    // Fallback for single image with multiple possible formats
    const image = result.image || result.output?.image || result.output;
    const imageUrl = image?.url || image?.image_url || image?.content_url;
    
    if (!imageUrl) {
      console.error('❌ No image URL found in result:', JSON.stringify(result, null, 2));
      throw new Error('No image URL in result');
    }
    
    console.log(`📥 Downloading image from:`, imageUrl.substring(0, 100) + '...');
    const storedPath = await videoStorage.downloadAndStoreImage(imageUrl, userId);
    console.log(`✅ Image stored: ${storedPath}`);
    return storedPath;

  } else if (type === 'video') {
    // Handle multiple possible FAL.AI response formats
    // Try various paths where video data might be
    let video = null;
    let videoUrl = null;
    
    // Format 1: Direct video object
    if (result.video) {
      video = result.video;
      videoUrl = video.url || video.video_url || video.content_url;
    }
    // Format 2: In output.video
    else if (result.output?.video) {
      video = result.output.video;
      videoUrl = video.url || video.video_url || video.content_url;
    }
    // Format 3: output itself is video object
    else if (result.output) {
      video = result.output;
      videoUrl = video.url || video.video_url || video.content_url;
    }
    // Format 4: Direct URL in data
    else if (result.data?.video_url || result.data?.url) {
      videoUrl = result.data.video_url || result.data.url;
      video = result.data;
    }
    // Format 5: URL directly in result
    else if (result.url || result.video_url) {
      videoUrl = result.url || result.video_url;
      video = result;
    }
    
    if (!videoUrl) {
      console.error('❌ No video URL found in result');
      console.error('   Result structure:', Object.keys(result));
      console.error('   Full result:', JSON.stringify(result, null, 2));
      throw new Error('No video URL in result');
    }

    console.log(`📥 Downloading video from:`, videoUrl.substring(0, 100) + '...');
    const storedPath = await videoStorage.downloadAndStoreVideo(videoUrl, userId);
    console.log(`✅ Video stored: ${storedPath}`);
    return storedPath;
    
  } else if (type === 'audio') {
    let audioUrl = result.audio_url || 
                   result.url || 
                   result.audio?.url || 
                   result.output?.audio_url ||
                   result.output?.url;
    
    // Handle object-wrapped URL
    if (audioUrl && typeof audioUrl === 'object' && audioUrl.url) {
      audioUrl = audioUrl.url;
    }
    
    // Check if callback-based (no URL yet)
    if (!audioUrl || typeof audioUrl !== 'string') {
      if (result.status === 'processing' || result.callback_based || result.taskId) {
        console.log('⏳ Callback-based generation - awaiting webhook');
        console.log('   Task ID:', result.taskId || result.audio_id);
        return null; // Will be updated by callback
      }
      
      console.error('❌ No valid audio URL:', JSON.stringify(result, null, 2));
      throw new Error('No valid audio URL in result');
    }

    console.log(`📥 Downloading audio:`, audioUrl.substring(0, 80) + '...');
    const storedPath = await videoStorage.downloadAndStoreAudio(audioUrl, userId);
    console.log(`✅ Audio stored: ${storedPath}`);
    return storedPath;
  }

  throw new Error(`Unknown type: ${type}`);
}

/**
 * Helper: Update job status
 */
async function updateJobStatus(jobId, status, progress) {
  await pool.query(`
    UPDATE ai_generation_history
    SET status = $1, progress = $2
    WHERE job_id = $3
  `, [status, progress, jobId]);
}

/**
 * Helper: Get user by ID
 */
async function getUserById(userId) {
  const result = await pool.query(
    'SELECT id, name, email, credits FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0];
}

/**
 * Helper: Calculate credits cost (FULL IMPLEMENTATION)
 */
async function calculateCreditsCost(modelId, settings) {
  // Query model pricing with all necessary fields
  const result = await pool.query(`
    SELECT 
      name,
      type,
      cost,
      max_duration,
      metadata
    FROM ai_models
    WHERE model_id = $1
  `, [modelId]);

  if (result.rows.length === 0) {
    throw new Error('Model not found');
  }

  const { name, type, cost, max_duration, metadata } = result.rows[0];
  
  // Get pricing_type from metadata if it exists, otherwise default to 'flat'
  const pricing_type = metadata?.pricing_type || 'flat';
  
  let baseCost = parseFloat(cost);
  const quantity = parseInt(settings.quantity) || 1;
  let costMultiplier = 1.0;

  console.log(`💰 Calculating cost for: ${name}`);
  console.log(`   Base cost: ${baseCost} credits`);
  console.log(`   Type: ${type}, Pricing: ${pricing_type}`);

  // 1. VIDEO DURATION PRICING
  if (type === 'video' && settings.duration) {
    const maxDur = parseInt(max_duration) || 20;
    const requestedDur = parseInt(settings.duration);

    if (pricing_type === 'per_second') {
      // Per-second: baseCost is credits per second (stored in DB)
      // Calculate total cost for requested duration
      const creditsPerSecond = baseCost;
      baseCost = creditsPerSecond * requestedDur;
      costMultiplier = 1.0; // Already calculated exact cost
      console.log(`   📹 Per-second video: ${creditsPerSecond.toFixed(2)} cr/s × ${requestedDur}s = ${baseCost.toFixed(2)} cr`);
    } else if (pricing_type === 'proportional') {
      // Proportional (legacy): baseCost is for max duration
      // Calculate proportional cost for requested duration
      costMultiplier = Math.min(requestedDur / maxDur, 1.0);
      console.log(`   📹 Proportional video: ${requestedDur}s / ${maxDur}s = ${costMultiplier.toFixed(2)}x`);
    }
    // else: flat rate, no adjustment needed
  }

  // 1B. AUDIO DURATION PRICING
  if (type === 'audio' && settings.duration) {
    const requestedDur = parseInt(settings.duration);

    if (pricing_type === 'per_second') {
      // Per-second: baseCost is credits per second (stored in DB)
      // Calculate total cost for requested duration
      const creditsPerSecond = baseCost;
      baseCost = creditsPerSecond * requestedDur;
      costMultiplier = 1.0; // Already calculated exact cost
      console.log(`   🎵 Per-second audio: ${creditsPerSecond.toFixed(2)} cr/s × ${requestedDur}s = ${baseCost.toFixed(2)} cr`);
    } else if (pricing_type === 'proportional') {
      // Proportional (legacy): baseCost is for max duration
      // Calculate proportional cost for requested duration
      const maxDur = parseInt(max_duration) || 240;
      costMultiplier = Math.min(requestedDur / maxDur, 1.0);
      console.log(`   🎵 Proportional audio: ${requestedDur}s / ${maxDur}s = ${costMultiplier.toFixed(2)}x`);
    }
    // else: flat rate, no adjustment needed
  }

  // 2. IMAGE-TO-VIDEO TYPE MULTIPLIER
  // Check both settings.videoType and settings.type (sub_type from job)
  if (type === 'video') {
    const videoSubType = settings.videoType || settings.type || settings.subType;
    
    const typeMultiplier = {
      'text-to-video': 1.0,
      'image-to-video': 1.2,       // 20% markup
      'image-to-video-end': 1.4    // 40% markup
    }[videoSubType] || 1.0;

    if (typeMultiplier > 1.0) {
      costMultiplier *= typeMultiplier;
      console.log(`   🎬 Type multiplier: ${typeMultiplier}x (${videoSubType})`);
    }
  }

  // 3. AUDIO PRICING (Additional cost)
  if (settings.hasAudio === true || settings.hasAudio === 'true') {
    const audioMultiplier = 1.3; // 30% more for audio
    costMultiplier *= audioMultiplier;
    console.log(`   🎵 Audio multiplier: ${audioMultiplier}x`);
  }

  // 4. QUANTITY MULTIPLIER
  const totalCost = baseCost * costMultiplier * quantity;
  
  // Keep decimal precision (database uses DECIMAL(10,2))
  // Round to 2 decimal places for consistency
  const finalCost = Math.round(totalCost * 100) / 100;
  
  console.log(`   🔢 Quantity: ${quantity}x`);
  console.log(`   💰 Calculated cost: ${totalCost.toFixed(2)} credits`);
  console.log(`   ✅ Final cost: ${finalCost.toFixed(2)} credits`);

  return finalCost;
}

/**
 * Helper: Deduct user credits
 */
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
 * Helper: Cleanup temporary uploaded files
 */
async function cleanupUploadedFiles(uploadedFiles) {
  if (!uploadedFiles || Object.keys(uploadedFiles).length === 0) {
    return; // No files to cleanup
  }

  // Delete start image if it was uploaded (not URL)
  if (uploadedFiles.startImageFullPath) {
    try {
      await fs.unlink(uploadedFiles.startImageFullPath);
      console.log('🗑️ Cleaned up temp file:', uploadedFiles.startImageFullPath);
    } catch (err) {
      // Ignore error if file already deleted or doesn't exist
      if (err.code !== 'ENOENT') {
        console.error('⚠️ Error deleting temp file:', err.message);
      }
    }
  }

  // Delete end image if it was uploaded (not URL)
  if (uploadedFiles.endImageFullPath) {
    try {
      await fs.unlink(uploadedFiles.endImageFullPath);
      console.log('🗑️ Cleaned up temp file:', uploadedFiles.endImageFullPath);
    } catch (err) {
      // Ignore error if file already deleted or doesn't exist
      if (err.code !== 'ENOENT') {
        console.error('⚠️ Error deleting temp file:', err.message);
      }
    }
  }
}

/**
 * Periodic cleanup of expired and orphaned jobs
 */
let cleanupInterval = null;

async function periodicCleanup() {
  try {
    console.log('\n🧹 Running periodic cleanup...');
    
    // 1. Cleanup orphaned jobs (stuck in 'processing' > 1 hour - less aggressive)
    const orphanedResult = await pool.query(`
      UPDATE ai_generation_history
      SET 
        status = 'failed',
        error_message = 'Job orphaned (stuck in processing > 1 hour)',
        completed_at = NOW()
      WHERE 
        status = 'processing' 
        AND created_at < NOW() - INTERVAL '1 hour'
        AND completed_at IS NULL
      RETURNING job_id
    `);
    
    if (orphanedResult.rowCount > 0) {
      console.log(`   🧹 Cleaned ${orphanedResult.rowCount} orphaned jobs`);
    }
    
    // 2. Cleanup very old pending jobs (> 2 hours, never started - less aggressive)
    const oldPendingResult = await pool.query(`
      UPDATE ai_generation_history
      SET 
        status = 'failed',
        error_message = 'Job expired (pending > 2 hours)',
        completed_at = NOW()
      WHERE 
        status = 'pending' 
        AND created_at < NOW() - INTERVAL '2 hours'
        AND completed_at IS NULL
      RETURNING job_id
    `);
    
    if (oldPendingResult.rowCount > 0) {
      console.log(`   🧹 Cleaned ${oldPendingResult.rowCount} expired pending jobs`);
    }
    
    // 3. Run external cleanup script if available
    try {
      const { cleanupExpiredJobs } = require('../scripts/cleanupExpiredJobs');
      await cleanupExpiredJobs({ dryRun: false, verbose: false });
    } catch (err) {
      // Script might not exist, that's ok
    }
    
    console.log('   ✅ Periodic cleanup complete\n');
    
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  }
}

/**
 * Start worker
 */
async function startWorker() {
  console.log('🚀 Starting AI Generation Worker...');

  try {
    // Initialize queue
    await queueManager.initialize();

    // Create queue (required in pg-boss v11+)
    console.log('📦 Creating ai-generation queue...');
    await queueManager.boss.createQueue('ai-generation', {
      retryLimit: 1, // ✨ Reduced from 2 to 1 (smart retry handles permanent errors)
      retryDelay: 60, // ✨ Increased from 30 to 60 seconds (better backoff)
      expireInSeconds: 60 * 30 // 30 minutes
    });
    console.log('✅ Queue created with smart retry logic');

    // Register worker
    await queueManager.registerWorker(
      'ai-generation', 
      processAIGeneration,
      {
        teamSize: 1, // ✨ Single worker instance (one server)
        teamConcurrency: 5, // ✨ Process 5 jobs concurrently (increased for better throughput)
        batchSize: 5, // ✨ CRITICAL: Fetch 5 jobs at once - ensures all simultaneous jobs are picked up
        pollingIntervalSeconds: 1, // ✨ Check for new jobs every 1 second (faster polling)
        newJobCheckInterval: 500, // ✨ Check more frequently (500ms)
        timeout: 360000, // ✨ REDUCED: 6 minutes (was 15 min) - Faster failure detection
        // Image: 2min, Video: 5min, Audio: 3min max in FAL.AI service
        // This worker timeout is a safety net above those
      }
    );

    console.log('✅ AI Generation Worker is running');
    console.log('⏳ Waiting for jobs...');
    
    // ✨ Setup periodic cleanup (every 30 minutes - balanced approach)
    console.log('🧹 Setting up periodic cleanup (every 30 minutes)...');
    cleanupInterval = setInterval(periodicCleanup, 30 * 60 * 1000);
    
    // Run initial cleanup after 10 seconds (give worker time to start)
    setTimeout(periodicCleanup, 10000);

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
  
  // Clear cleanup interval
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    console.log('✅ Cleanup interval stopped');
  }
  
  await queueManager.shutdown();
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

