/**
 * FAL.AI Response Parser - Practical Examples
 * 
 * This file contains real-world examples of using the FAL Response Parser utility
 * 
 * Date: October 27, 2025
 */

const {
  extractImageUrl,
  extractVideoUrl,
  extractAudioUrl,
  extractContentUrl,
  validateFalResponse,
  getAllImageUrls,
  formatFalResponse,
  safeExtractUrl
} = require('../src/utils/falResponseParser');

// ============================================
// EXAMPLE 1: IMAGE GENERATION (Single Image)
// ============================================

console.log('\n📸 Example 1: Single Image Generation\n');

const singleImageResponse = {
  images: [{
    url: 'https://fal.media/files/lion/abc123.jpeg',
    width: 1024,
    height: 1024,
    content_type: 'image/jpeg'
  }],
  seed: 42,
  prompt: 'A beautiful sunset over the ocean',
  has_nsfw_concepts: []
};

try {
  const { url, images, metadata } = extractImageUrl(singleImageResponse);
  console.log('✅ Primary URL:', url);
  console.log('✅ Total Images:', images.length);
  console.log('✅ Seed:', metadata.seed);
  console.log('✅ Prompt:', metadata.prompt);
} catch (error) {
  console.error('❌ Error:', error.message);
}

// ============================================
// EXAMPLE 2: IMAGE GENERATION (Multiple Images)
// ============================================

console.log('\n📸 Example 2: Multiple Images Generation\n');

const multipleImagesResponse = {
  images: [
    { url: 'https://fal.media/files/lion/img1.jpeg', width: 1024, height: 1024 },
    { url: 'https://fal.media/files/lion/img2.jpeg', width: 1024, height: 1024 },
    { url: 'https://fal.media/files/lion/img3.jpeg', width: 1024, height: 1024 },
    { url: 'https://fal.media/files/lion/img4.jpeg', width: 1024, height: 1024 }
  ],
  seed: 123
};

try {
  // Get primary image
  const { url, images } = extractImageUrl(multipleImagesResponse);
  console.log('✅ Primary Image:', url);
  console.log('✅ Total Images:', images.length);
  
  // Get all URLs
  const allUrls = getAllImageUrls(multipleImagesResponse);
  console.log('✅ All URLs:', allUrls);
  
  // Get specific image by index
  const { url: secondImage } = extractImageUrl(multipleImagesResponse, 1);
  console.log('✅ Second Image:', secondImage);
} catch (error) {
  console.error('❌ Error:', error.message);
}

// ============================================
// EXAMPLE 3: IMAGE WITH ALTERNATIVE FORMAT
// ============================================

console.log('\n📸 Example 3: Alternative Image Format\n');

const alternativeImageResponse = {
  output: {
    image: {
      image_url: 'https://cdn.fal.ai/files/elephant/output.png',
      width: 512,
      height: 512
    }
  }
};

try {
  const { url } = extractImageUrl(alternativeImageResponse);
  console.log('✅ Extracted URL:', url);
} catch (error) {
  console.error('❌ Error:', error.message);
}

// ============================================
// EXAMPLE 4: VIDEO GENERATION
// ============================================

console.log('\n🎬 Example 4: Video Generation\n');

const videoResponse = {
  video: {
    url: 'https://fal.media/files/tiger/video123.mp4',
    width: 1920,
    height: 1080,
    duration: 5,
    fps: 30
  },
  prompt: 'A cat playing piano',
  timings: {
    inference: 45.2
  }
};

try {
  const { url, metadata } = extractVideoUrl(videoResponse);
  console.log('✅ Video URL:', url);
  console.log('✅ Duration:', metadata.duration, 'seconds');
  console.log('✅ Resolution:', `${metadata.width}x${metadata.height}`);
  console.log('✅ FPS:', metadata.fps);
} catch (error) {
  console.error('❌ Error:', error.message);
}

// ============================================
// EXAMPLE 5: AUDIO GENERATION (TTS)
// ============================================

console.log('\n🎵 Example 5: Text-to-Speech\n');

const ttsResponse = {
  audio_url: 'https://fal.media/files/zebra/speech.mp3',
  duration: 15,
  prompt: 'Welcome to PixelNest AI platform'
};

try {
  const { url, metadata } = extractAudioUrl(ttsResponse);
  console.log('✅ Audio URL:', url);
  console.log('✅ Duration:', metadata.duration, 'seconds');
  console.log('✅ Prompt:', metadata.prompt);
} catch (error) {
  console.error('❌ Error:', error.message);
}

// ============================================
// EXAMPLE 6: AUDIO WITH ALTERNATIVE FORMAT
// ============================================

console.log('\n🎵 Example 6: Alternative Audio Format\n');

const alternativeAudioResponse = {
  output: {
    url: 'https://cdn.fal.ai/files/rabbit/music.mp3'
  },
  duration: 30
};

try {
  const { url } = extractAudioUrl(alternativeAudioResponse);
  console.log('✅ Extracted URL:', url);
} catch (error) {
  console.error('❌ Error:', error.message);
}

// ============================================
// EXAMPLE 7: GENERIC CONTENT EXTRACTION
// ============================================

console.log('\n🔧 Example 7: Generic Content Extraction\n');

const responses = [
  { type: 'image', data: singleImageResponse },
  { type: 'video', data: videoResponse },
  { type: 'audio', data: ttsResponse }
];

responses.forEach(({ type, data }) => {
  try {
    const content = extractContentUrl(data, type);
    console.log(`✅ ${type.toUpperCase()} - URL:`, content.url);
  } catch (error) {
    console.error(`❌ ${type.toUpperCase()} - Error:`, error.message);
  }
});

// ============================================
// EXAMPLE 8: RESPONSE VALIDATION
// ============================================

console.log('\n✔️  Example 8: Response Validation\n');

const testResponses = [
  { name: 'Valid Image', type: 'image', data: singleImageResponse },
  { name: 'Valid Video', type: 'video', data: videoResponse },
  { name: 'Valid Audio', type: 'audio', data: ttsResponse },
  { name: 'Invalid', type: 'image', data: { invalid: 'data' } }
];

testResponses.forEach(({ name, type, data }) => {
  const isValid = validateFalResponse(data, type);
  console.log(`${isValid ? '✅' : '❌'} ${name}:`, isValid ? 'Valid' : 'Invalid');
});

// ============================================
// EXAMPLE 9: SAFE EXTRACTION (No Throw)
// ============================================

console.log('\n🛡️  Example 9: Safe Extraction\n');

const riskyResponses = [
  { invalid: 'data' },
  { images: [] },
  null,
  undefined
];

riskyResponses.forEach((data, index) => {
  const url = safeExtractUrl(data, 'image');
  console.log(`Response ${index + 1}:`, url ? `✅ ${url}` : '❌ No URL found');
});

// ============================================
// EXAMPLE 10: FORMAT FOR API RESPONSE
// ============================================

console.log('\n📤 Example 10: Format for API Response\n');

const apiResponses = [
  { type: 'image', data: singleImageResponse },
  { type: 'video', data: videoResponse },
  { type: 'audio', data: ttsResponse }
];

apiResponses.forEach(({ type, data }) => {
  const formatted = formatFalResponse(data, type);
  console.log(`\n${type.toUpperCase()} API Response:`);
  console.log(JSON.stringify(formatted, null, 2));
});

// ============================================
// EXAMPLE 11: ERROR HANDLING PATTERN
// ============================================

console.log('\n⚠️  Example 11: Error Handling Pattern\n');

function processImageGeneration(result) {
  try {
    // Attempt to extract URL
    const { url, images, metadata } = extractImageUrl(result);
    
    console.log('✅ Processing successful');
    console.log('   URL:', url);
    console.log('   Images:', images.length);
    
    return {
      success: true,
      url: url,
      count: images.length
    };
    
  } catch (error) {
    console.error('❌ Processing failed:', error.message);
    
    // Log the problematic response for debugging
    console.error('   Response:', JSON.stringify(result, null, 2));
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Test with valid and invalid data
console.log('Valid Response:');
processImageGeneration(singleImageResponse);

console.log('\nInvalid Response:');
processImageGeneration({ invalid: 'data' });

// ============================================
// EXAMPLE 12: REAL-WORLD SERVICE IMPLEMENTATION
// ============================================

console.log('\n🚀 Example 12: Service Layer Implementation\n');

async function generateImageService(options) {
  console.log('🔄 Calling FAL.AI API...');
  
  // Simulate FAL.AI API call
  const falResult = {
    images: [
      { url: 'https://fal.media/output1.jpg', width: 1024, height: 1024 },
      { url: 'https://fal.media/output2.jpg', width: 1024, height: 1024 }
    ],
    seed: 999,
    prompt: options.prompt
  };
  
  try {
    // Use parser utility
    const { url, images, metadata } = extractImageUrl(falResult);
    
    console.log('✅ Generation successful');
    console.log('   Primary URL:', url);
    console.log('   Total Images:', images.length);
    
    // Return normalized response
    return {
      success: true,
      images: images,
      metadata: {
        seed: metadata.seed,
        prompt: metadata.prompt
      }
    };
    
  } catch (error) {
    console.error('❌ Generation failed:', error.message);
    throw new Error(`Image generation failed: ${error.message}`);
  }
}

// Test service
generateImageService({ prompt: 'A beautiful landscape' })
  .then(result => {
    console.log('\n📦 Service Result:');
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error('Service Error:', error);
  });

// ============================================
// EXAMPLE 13: WORKER IMPLEMENTATION
// ============================================

console.log('\n⚙️  Example 13: Worker Implementation\n');

async function workerStoreResult(userId, result, type) {
  try {
    // Generic extraction based on type
    const { url } = extractContentUrl(result, type);
    
    console.log(`✅ Extracted ${type} URL for user ${userId}`);
    console.log('   URL:', url.substring(0, 50) + '...');
    
    // Simulate storage
    const storedPath = `/users/${userId}/${type}/${Date.now()}.${type === 'audio' ? 'mp3' : type === 'video' ? 'mp4' : 'jpg'}`;
    console.log('   Stored:', storedPath);
    
    return storedPath;
    
  } catch (error) {
    console.error(`❌ Failed to store ${type}:`, error.message);
    throw error;
  }
}

// Test worker with different types
Promise.all([
  workerStoreResult('user123', singleImageResponse, 'image'),
  workerStoreResult('user123', videoResponse, 'video'),
  workerStoreResult('user123', ttsResponse, 'audio')
]).then(() => {
  console.log('\n✅ All storage operations completed');
});

console.log('\n' + '='.repeat(60));
console.log('✅ All examples completed successfully!');
console.log('='.repeat(60) + '\n');

