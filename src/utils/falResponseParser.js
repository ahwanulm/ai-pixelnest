/**
 * FAL.AI Response Parser Utility
 * 
 * Handles multiple possible response formats from FAL.AI API
 * to ensure consistent and robust URL extraction
 * 
 * Date: October 27, 2025
 * Author: PixelNest Team
 */

/**
 * Extract image URL from FAL.AI response
 * Handles multiple possible formats:
 * - result.images[] (multiple images)
 * - result.image (single image)
 * - result.output.images[] or result.output.image
 * - Various URL field names (url, image_url, content_url)
 * 
 * @param {Object} result - FAL.AI API response
 * @param {number} index - Image index (for multiple images, default: 0)
 * @returns {Object} { url: string, images: array, metadata: object }
 */
function extractImageUrl(result, index = 0) {
  // Handle multiple images array
  const images = result.images || 
                 result.output?.images ||
                 (result.image ? [result.image] : null) ||
                 (result.output?.image ? [result.output.image] : null);
  
  if (!images || images.length === 0) {
    console.error('❌ No images found in FAL.AI response:', JSON.stringify(result, null, 2));
    throw new Error('No images in FAL.AI response');
  }
  
  // Extract URLs from all images
  const imageUrls = images.map((img, idx) => {
    const url = img.url || img.image_url || img.content_url;
    
    if (!url) {
      console.warn(`⚠️ No URL found for image ${idx + 1}`);
      return null;
    }
    
    return {
      url: url,
      width: img.width,
      height: img.height,
      content_type: img.content_type || img.type,
      index: idx
    };
  }).filter(Boolean);
  
  if (imageUrls.length === 0) {
    throw new Error('No valid image URLs found');
  }
  
  console.log(`✅ Extracted ${imageUrls.length} image URL(s) from FAL.AI response`);
  
  return {
    url: imageUrls[index]?.url || imageUrls[0].url, // Primary URL
    images: imageUrls, // All images with metadata
    metadata: {
      seed: result.seed,
      prompt: result.prompt,
      has_nsfw_concepts: result.has_nsfw_concepts,
      timings: result.timings
    }
  };
}

/**
 * Extract video URL from FAL.AI response
 * Handles multiple possible formats:
 * - result.video
 * - result.output.video
 * - result.output (direct)
 * - Various URL field names (url, video_url, content_url)
 * 
 * @param {Object} result - FAL.AI API response
 * @returns {Object} { url: string, metadata: object }
 */
function extractVideoUrl(result) {
  // Handle video object
  const video = result.video || 
                result.output?.video ||
                result.output;
  
  if (!video) {
    console.error('❌ No video found in FAL.AI response:', JSON.stringify(result, null, 2));
    throw new Error('No video in FAL.AI response');
  }
  
  // Extract URL with multiple possible field names
  const videoUrl = video.url || video.video_url || video.content_url;
  
  if (!videoUrl) {
    console.error('❌ No video URL found in video object:', JSON.stringify(video, null, 2));
    throw new Error('No video URL in FAL.AI response');
  }
  
  console.log('✅ Video URL extracted:', videoUrl.substring(0, 100) + '...');
  
  return {
    url: videoUrl,
    metadata: {
      width: video.width,
      height: video.height,
      duration: video.duration,
      fps: video.fps,
      prompt: result.prompt,
      timings: result.timings
    }
  };
}

/**
 * Extract audio URL from FAL.AI response
 * Handles multiple possible formats:
 * - result.audio_url
 * - result.url
 * - result.audio.url
 * - result.output.audio_url or result.output.url
 * 
 * @param {Object} result - FAL.AI API response
 * @returns {Object} { url: string, metadata: object }
 */
function extractAudioUrl(result) {
  // Handle multiple possible formats
  const audioUrl = result.audio_url || 
                   result.url || 
                   result.audio?.url || 
                   result.output?.audio_url ||
                   result.output?.url;
  
  if (!audioUrl) {
    console.error('❌ No audio URL found in FAL.AI response:', JSON.stringify(result, null, 2));
    throw new Error('No audio URL in FAL.AI response');
  }
  
  console.log('✅ Audio URL extracted:', audioUrl.substring(0, 100) + '...');
  
  return {
    url: audioUrl,
    metadata: {
      duration: result.duration || result.audio?.duration,
      prompt: result.prompt,
      language: result.language,
      timings: result.timings,
      // Additional metadata
      ...(result.metadata || result.audio?.metadata || {})
    }
  };
}

/**
 * Generic content URL extractor
 * Auto-detects content type and extracts URL accordingly
 * 
 * @param {Object} result - FAL.AI API response
 * @param {string} type - Expected content type ('image', 'video', 'audio')
 * @param {number} imageIndex - Image index for multiple images (default: 0)
 * @returns {Object} { url: string, type: string, metadata: object, allUrls?: array }
 */
function extractContentUrl(result, type, imageIndex = 0) {
  try {
    switch (type) {
      case 'image':
        return {
          ...extractImageUrl(result, imageIndex),
          type: 'image'
        };
      
      case 'video':
        return {
          ...extractVideoUrl(result),
          type: 'video'
        };
      
      case 'audio':
        return {
          ...extractAudioUrl(result),
          type: 'audio'
        };
      
      default:
        throw new Error(`Unknown content type: ${type}`);
    }
  } catch (error) {
    console.error(`Failed to extract ${type} URL:`, error);
    throw error;
  }
}

/**
 * Validate FAL.AI response
 * Checks if response is valid and contains expected data
 * 
 * @param {Object} result - FAL.AI API response
 * @param {string} type - Expected content type
 * @returns {boolean} - true if valid
 */
function validateFalResponse(result, type) {
  if (!result || typeof result !== 'object') {
    return false;
  }
  
  try {
    extractContentUrl(result, type);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get all URLs from multi-image response
 * Useful for bulk operations
 * 
 * @param {Object} result - FAL.AI API response
 * @returns {Array<string>} - Array of image URLs
 */
function getAllImageUrls(result) {
  try {
    const extracted = extractImageUrl(result);
    return extracted.images.map(img => img.url);
  } catch (error) {
    console.error('Failed to extract all image URLs:', error);
    return [];
  }
}

/**
 * Format response for consistent API return
 * Normalizes FAL.AI response to standard format
 * 
 * @param {Object} result - FAL.AI API response
 * @param {string} type - Content type
 * @param {Object} options - Additional options
 * @returns {Object} - Normalized response
 */
function formatFalResponse(result, type, options = {}) {
  const extracted = extractContentUrl(result, type, options.imageIndex);
  
  return {
    success: true,
    type: type,
    url: extracted.url,
    urls: extracted.images?.map(img => img.url) || [extracted.url],
    metadata: extracted.metadata,
    raw: options.includeRaw ? result : undefined
  };
}

/**
 * Safe URL extraction with fallback
 * Returns null instead of throwing error
 * 
 * @param {Object} result - FAL.AI API response
 * @param {string} type - Content type
 * @returns {string|null} - URL or null
 */
function safeExtractUrl(result, type) {
  try {
    const extracted = extractContentUrl(result, type);
    return extracted.url;
  } catch (error) {
    console.warn(`Safe extract failed for ${type}:`, error.message);
    return null;
  }
}

module.exports = {
  // Main extractors
  extractImageUrl,
  extractVideoUrl,
  extractAudioUrl,
  extractContentUrl,
  
  // Utilities
  validateFalResponse,
  getAllImageUrls,
  formatFalResponse,
  safeExtractUrl
};

