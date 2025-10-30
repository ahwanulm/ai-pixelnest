const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

/**
 * Video Storage Utility
 * Handles secure video downloads and storage per user
 */

const VideoStorage = {
  /**
   * Get user's video directory path
   * @param {number} userId - User ID
   * @returns {string} - Path to user's video folder
   */
  getUserVideoDir(userId) {
    return path.join(__dirname, '../../public/videos', userId.toString());
  },

  /**
   * Ensure user's video directory exists
   * @param {number} userId - User ID
   */
  async ensureUserVideoDir(userId) {
    const dir = this.getUserVideoDir(userId);
    await fs.mkdir(dir, { recursive: true });
    return dir;
  },

  /**
   * Download video from URL and save to user's folder
   * @param {string} videoUrl - External video URL (from fal.ai)
   * @param {number} userId - User ID
   * @param {object} metadata - Video metadata (duration, resolution, etc)
   * @returns {Promise<string>} - Local file path (relative to public/)
   */
  async downloadAndSaveVideo(videoUrl, userId, metadata = {}) {
    try {
      console.log('📥 Downloading video from:', videoUrl);
      console.log('👤 User ID:', userId);

      // Ensure directory exists
      const userDir = await this.ensureUserVideoDir(userId);

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `video-${timestamp}.mp4`;
      const filepath = path.join(userDir, filename);

      // Download video with optimized retry logic for large files
      await this.downloadFileWithRetry(videoUrl, filepath, 2); // Only 2 retries for videos

      // Return relative path (from public folder)
      const relativePath = `/videos/${userId}/${filename}`;
      console.log('✅ Video saved successfully:', relativePath);

      return relativePath;
    } catch (error) {
      console.error('❌ Error downloading video:', error);
      throw new Error(`Failed to save video: ${error.message}`);
    }
  },

  /**
   * Download file from URL to local path
   * @param {string} url - File URL
   * @param {string} filepath - Destination file path
   */
  downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;

      const file = require('fs').createWriteStream(filepath);
      let downloadedBytes = 0;
      let isFinished = false; // ✨ Flag to prevent race condition
      
      // ✨ SMART TIMEOUT: Detect file type from URL for better timeout estimation
      const isLikelySmallFile = url.includes('image') || url.includes('thumbnail') || 
                               url.includes('.jpg') || url.includes('.png') || 
                               url.includes('.gif') || url.includes('.webp') ||
                               url.includes('.jpeg') || url.includes('.bmp');
      
      const isVideoFile = url.includes('video') || url.includes('.mp4') || 
                         url.includes('.mov') || url.includes('.avi') || 
                         url.includes('.mkv') || url.includes('.webm');
      
      // ✨ VIDEO-OPTIMIZED TIMEOUTS: Longer timeouts for videos, but not too long
      let DOWNLOAD_TIMEOUT, SOCKET_TIMEOUT;
      
      // ✨ INCREASED TIMEOUTS: FAL.AI servers can be slow even for small files
      if (isLikelySmallFile) {
        DOWNLOAD_TIMEOUT = 60000; // 60s for small files (2x increase - FAL.AI can be slow)
        SOCKET_TIMEOUT = 30000;   // 30s for small files (2x increase)
      } else if (isVideoFile) {
        DOWNLOAD_TIMEOUT = 600000; // 10 minutes for videos
        SOCKET_TIMEOUT = 120000;   // 2 minutes for videos
      } else {
        DOWNLOAD_TIMEOUT = 300000; // 5 minutes for other large files
        SOCKET_TIMEOUT = 60000;    // 1 minute for other large files
      }
      
      const fileType = isLikelySmallFile ? 'small file' : (isVideoFile ? 'video file' : 'large file');
      console.log(`📥 Starting download (${fileType} mode, timeout: ${DOWNLOAD_TIMEOUT/1000}s, socket: ${SOCKET_TIMEOUT/1000}s)`);
      
      const timeout = setTimeout(() => {
        if (isFinished) return; // ✨ Prevent timeout if already finished
        isFinished = true;
        file.close();
        fs.unlink(filepath).catch(() => {});
        reject(new Error(`Download timeout after ${DOWNLOAD_TIMEOUT/1000}s`));
      }, DOWNLOAD_TIMEOUT);
      
      const request = protocol.get(url, {
        timeout: SOCKET_TIMEOUT, // Dynamic socket timeout
        headers: {
          'User-Agent': 'PixelNest/1.0',
          'Connection': 'keep-alive', // Reuse connections
          'Accept-Encoding': 'gzip, deflate' // Enable compression
        },
        // ✨ CONNECTION OPTIMIZATION: Different strategies for different file types
        agent: (() => {
          if (isLikelySmallFile) {
            // Small files: More sockets, faster connections
            return new (protocol.Agent)({ 
              keepAlive: true, 
              maxSockets: 10,
              maxFreeSockets: 5,
              timeout: SOCKET_TIMEOUT
            });
          } else if (isVideoFile) {
            // Videos: Fewer sockets but longer timeouts, more stable
            return new (protocol.Agent)({ 
              keepAlive: true, 
              maxSockets: 3, // Fewer concurrent video downloads
              maxFreeSockets: 1,
              timeout: SOCKET_TIMEOUT,
              keepAliveMsecs: 30000 // Keep alive for 30s
            });
          } else {
            // Other large files: Balanced approach
            return new (protocol.Agent)({ 
              keepAlive: true, 
              maxSockets: 5,
              maxFreeSockets: 2,
              timeout: SOCKET_TIMEOUT
            });
          }
        })()
      }, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Follow redirect
          if (isFinished) return;
          isFinished = true;
          clearTimeout(timeout);
          file.close();
          fs.unlink(filepath).catch(() => {});
          this.downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
          return;
        }
        
        if (response.statusCode !== 200) {
          if (isFinished) return;
          isFinished = true;
          clearTimeout(timeout);
          file.close();
          fs.unlink(filepath).catch(() => {});
          reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
          return;
        }

        const totalBytes = parseInt(response.headers['content-length'] || '0');
        const fileSizeMB = (totalBytes / 1024 / 1024).toFixed(2);
        const isSmallFile = totalBytes < 5 * 1024 * 1024; // < 5MB
        const isVideoFile = url.includes('video') || url.includes('.mp4') || 
                           url.includes('.mov') || url.includes('.avi') || 
                           url.includes('.mkv') || url.includes('.webm');
        
        console.log(`📊 Downloading ${fileSizeMB} MB...`);

        response.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          if (totalBytes > 0) {
            const progress = ((downloadedBytes / totalBytes) * 100).toFixed(1);
            
            // ✨ CRITICAL: Clear timeout early if download is almost complete (prevents race condition)
            if (downloadedBytes >= totalBytes * 0.99 && !isFinished) { // 99% complete
              clearTimeout(timeout);
            }
            
            // ✨ SMART LOGGING: Different strategies for different file types
            if (isSmallFile) {
              // For small files: log every 10% or every 100KB
              if (downloadedBytes % (100 * 1024) < chunk.length || 
                  Math.floor(progress) % 10 === 0) {
                console.log(`   📥 Download progress: ${progress}% (${(downloadedBytes / 1024).toFixed(1)} KB)`);
              }
            } else if (isVideoFile) {
              // For videos: log every 2MB or every 10%
              if (downloadedBytes % (2 * 1024 * 1024) < chunk.length || 
                  Math.floor(progress) % 10 === 0) {
                console.log(`   📥 Video progress: ${progress}% (${(downloadedBytes / 1024 / 1024).toFixed(1)} MB)`);
              }
            } else {
              // For other large files: log every 5MB
              if (downloadedBytes % (5 * 1024 * 1024) < chunk.length) {
                console.log(`   📥 Download progress: ${progress}%`);
              }
            }
          }
        });

        // ✨ VIDEO OPTIMIZATION: Use highWaterMark for better video streaming
        if (isVideoFile) {
          // For videos: Use larger buffer for better streaming performance
          response.pipe(file, { highWaterMark: 64 * 1024 }); // 64KB buffer
        } else {
          // For other files: Use default buffer
          response.pipe(file);
        }

        file.on('finish', () => {
          // ✨ CRITICAL: Clear timeout immediately to prevent race condition
          if (isFinished) return;
          isFinished = true;
          clearTimeout(timeout);
          request.destroy(); // Destroy request to prevent socket timeout from firing
          file.close();
          console.log(`✅ Download complete: ${(downloadedBytes / 1024 / 1024).toFixed(2)} MB`);
          resolve();
        });

        file.on('error', (err) => {
          if (isFinished) return;
          isFinished = true;
          clearTimeout(timeout);
          file.close();
          fs.unlink(filepath).catch(() => {}); // Delete incomplete file
          console.error(`❌ File write error:`, err.message);
          reject(err);
        });
      }).on('error', (err) => {
        if (isFinished) return;
        isFinished = true;
        clearTimeout(timeout);
        file.close();
        fs.unlink(filepath).catch(() => {}); // Delete incomplete file
        console.error(`❌ Download request error:`, err.message);
        reject(err);
      });
      
      request.on('timeout', () => {
        if (isFinished) return; // ✨ Prevent timeout if already finished
        isFinished = true;
        console.warn('⚠️ Socket timeout reached, destroying request...');
        clearTimeout(timeout);
        request.destroy();
        file.close();
        fs.unlink(filepath).catch(() => {});
        reject(new Error('Socket timeout - connection hung'));
      });
      
      // Set socket timeout (dynamic based on file size)
      request.setTimeout(SOCKET_TIMEOUT);
    });
  },
  
  /**
   * Download file with retry logic
   */
  async downloadFileWithRetry(url, filepath, maxRetries = 3) {
    let lastError;
    
    // ✨ SMART RETRY: Different strategies for different file types
    const isLikelySmallFile = url.includes('image') || url.includes('thumbnail') || 
                             url.includes('.jpg') || url.includes('.png') || 
                             url.includes('.gif') || url.includes('.webp');
    
    const isVideoFile = url.includes('video') || url.includes('.mp4') || 
                       url.includes('.mov') || url.includes('.avi') || 
                       url.includes('.mkv') || url.includes('.webm');
    
    let actualMaxRetries, fileType;
    if (isLikelySmallFile) {
      actualMaxRetries = 2; // Only 2 retries for small files
      fileType = 'small file';
    } else if (isVideoFile) {
      actualMaxRetries = 2; // Only 2 retries for videos (they're large, don't waste time)
      fileType = 'video file';
    } else {
      actualMaxRetries = maxRetries; // Full retries for other large files
      fileType = 'large file';
    }
    
    console.log(`📥 Download with ${actualMaxRetries} retries (${fileType} mode)`);
    
    for (let attempt = 1; attempt <= actualMaxRetries; attempt++) {
      try {
        console.log(`📥 Download attempt ${attempt}/${actualMaxRetries}...`);
        await this.downloadFile(url, filepath);
        console.log(`✅ Download successful on attempt ${attempt}`);
        return; // Success!
      } catch (error) {
        lastError = error;
        console.error(`❌ Download attempt ${attempt} failed:`, error.message);
        
        // Don't retry on permanent errors
        if (error.message.includes('HTTP 4') || 
            error.message.includes('HTTP 5') ||
            error.message.includes('Failed to download')) {
          console.log('🚫 Permanent error detected, not retrying');
          break;
        }
        
        // ✨ SMART DELAY: Different delays for different file types
        if (attempt < actualMaxRetries) {
          let baseDelay, maxDelay;
          
          if (isLikelySmallFile) {
            baseDelay = 500; // 500ms for small files
            maxDelay = 2000; // Max 2s for small files
          } else if (isVideoFile) {
            baseDelay = 2000; // 2s for videos (they're large, need more time)
            maxDelay = 5000; // Max 5s for videos
          } else {
            baseDelay = 1000; // 1s for other large files
            maxDelay = 10000; // Max 10s for other large files
          }
          
          const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
          console.log(`⏳ Retrying in ${delay/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Download failed after ${actualMaxRetries} attempts: ${lastError.message}`);
  },

  /**
   * Download image from URL and save to user's folder
   * @param {string} imageUrl - External image URL
   * @param {number} userId - User ID
   * @returns {Promise<string>} - Local file path (relative to public/)
   */
  async downloadAndSaveImage(imageUrl, userId) {
    try {
      console.log('📥 Downloading image from:', imageUrl);
      console.log('👤 User ID:', userId);

      // Create images folder for user
      const userDir = path.join(__dirname, '../../public/images', userId.toString());
      await fs.mkdir(userDir, { recursive: true });

      // Generate unique filename
      const timestamp = Date.now();
      const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
      const filename = `image-${timestamp}${ext}`;
      const filepath = path.join(userDir, filename);

      // Download image with retry logic (3 attempts)
      await this.downloadFileWithRetry(imageUrl, filepath, 3);

      // Return relative path
      const relativePath = `/images/${userId}/${filename}`;
      console.log('✅ Image saved successfully:', relativePath);

      return relativePath;
    } catch (error) {
      console.error('❌ Error downloading image:', error);
      throw new Error(`Failed to save image: ${error.message}`);
    }
  },

  /**
   * Download audio from URL and save to user's folder
   * @param {string} audioUrl - External audio URL (from fal.ai)
   * @param {number} userId - User ID
   * @returns {Promise<string>} - Local file path (relative to public/)
   */
  async downloadAndSaveAudio(audioUrl, userId) {
    try {
      console.log('📥 Downloading audio from:', audioUrl);
      console.log('👤 User ID:', userId);

      // Create audio folder for user
      const userDir = path.join(__dirname, '../../public/audio', userId.toString());
      await fs.mkdir(userDir, { recursive: true });

      // Generate unique filename
      const timestamp = Date.now();
      const ext = path.extname(new URL(audioUrl).pathname) || '.mp3';
      const filename = `audio-${timestamp}${ext}`;
      const filepath = path.join(userDir, filename);

      // Download audio with retry logic (3 attempts)
      await this.downloadFileWithRetry(audioUrl, filepath, 3);

      // Return relative path
      const relativePath = `/audio/${userId}/${filename}`;
      console.log('✅ Audio saved successfully:', relativePath);

      return relativePath;
    } catch (error) {
      console.error('❌ Error downloading audio:', error);
      throw new Error(`Failed to save audio: ${error.message}`);
    }
  },

  /**
   * Delete video file
   * @param {string} relativePath - Relative path from public folder
   * @param {number} userId - User ID (for security check)
   */
  async deleteVideo(relativePath, userId) {
    try {
      // Security check: ensure path belongs to user
      const expectedPrefix = `/videos/${userId}/`;
      if (!relativePath.startsWith(expectedPrefix)) {
        throw new Error('Unauthorized: Cannot delete video from other users');
      }

      const fullPath = path.join(__dirname, '../../public', relativePath);
      await fs.unlink(fullPath);
      console.log('🗑️ Deleted video:', relativePath);
      return true;
    } catch (error) {
      console.error('❌ Error deleting video:', error);
      return false;
    }
  },

  /**
   * Check if user owns a video
   * @param {string} relativePath - Relative path from public folder
   * @param {number} userId - User ID
   * @returns {boolean}
   */
  userOwnsVideo(relativePath, userId) {
    const expectedPrefix = `/videos/${userId}/`;
    return relativePath.startsWith(expectedPrefix);
  },

  /**
   * Get video file stats
   * @param {string} relativePath - Relative path from public folder
   */
  async getVideoStats(relativePath) {
    try {
      const fullPath = path.join(__dirname, '../../public', relativePath);
      const stats = await fs.stat(fullPath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      return null;
    }
  },

  // ============ ALIASES FOR WORKER COMPATIBILITY ============
  
  /**
   * Alias for downloadAndSaveVideo (used by worker)
   */
  async downloadAndStoreVideo(videoUrl, userId, metadata) {
    return this.downloadAndSaveVideo(videoUrl, userId, metadata);
  },

  /**
   * Alias for downloadAndSaveImage (used by worker)
   */
  async downloadAndStoreImage(imageUrl, userId) {
    return this.downloadAndSaveImage(imageUrl, userId);
  },

  /**
   * Alias for downloadAndSaveAudio (used by worker)
   */
  async downloadAndStoreAudio(audioUrl, userId) {
    return this.downloadAndSaveAudio(audioUrl, userId);
  }
};

module.exports = VideoStorage;

