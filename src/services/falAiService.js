const fal = require("@fal-ai/serverless-client");
const { pool } = require('../config/database');

// ✨ Helper function to clean model names for user-friendly display
function cleanModelName(modelName) {
  if (!modelName) return 'Unknown Model';
  
  // Remove common fal.ai and fal.id prefixes and patterns
  let cleaned = modelName
    .replace(/^fal-ai\//gi, '')      // Remove fal-ai/ prefix
    .replace(/^fal\.ai\//gi, '')     // Remove fal.ai/ prefix
    .replace(/^fal\.id\//gi, '')     // Remove fal.id/ prefix
    .replace(/^fal-id\//gi, '')      // Remove fal-id/ prefix
    .replace(/\/text-to-image\/byok$/gi, '')  // Remove /text-to-image/byok suffix
    .replace(/\/image-to-video\/byok$/gi, '') // Remove /image-to-video/byok suffix
    .replace(/\/text-to-video\/byok$/gi, '')  // Remove /text-to-video/byok suffix
    .replace(/\(fal\.ai\)/gi, '')    // Remove (fal.ai) suffix
    .replace(/\(fal\.id\)/gi, '')    // Remove (fal.id) suffix
    .replace(/\[fal\.ai\]/gi, '')    // Remove [fal.ai] suffix
    .replace(/\[fal\.id\]/gi, '')    // Remove [fal.id] suffix
    .replace(/- fal\.ai$/gi, '')     // Remove - fal.ai suffix
    .replace(/- fal\.id$/gi, '')     // Remove - fal.id suffix
    .replace(/by fal\.ai/gi, '')     // Remove by fal.ai
    .replace(/by fal\.id/gi, '')     // Remove by fal.id
    .trim();
  
  // Make model name more user-friendly
  cleaned = cleaned
    .replace(/[-_]/g, ' ')           // Replace - and _ with spaces
    .replace(/\s+/g, ' ')            // Remove multiple spaces
    .trim();
  
  // Capitalize first letter of each word
  cleaned = cleaned.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return cleaned || modelName; // Return original if cleaning results in empty string
}

// Configure fal.ai client
async function configureFalAi() {
  try {
    const result = await pool.query(
      "SELECT api_key FROM api_configs WHERE service_name = 'FAL_AI' AND is_active = true LIMIT 1"
    );
    
    if (result.rows.length > 0 && result.rows[0].api_key) {
      fal.config({
        credentials: result.rows[0].api_key
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error configuring fal.ai:', error);
    return false;
  }
}

const FalAiService = {
  // ============ IMAGE GENERATION ============
  
  /**
   * Extract 3D model format from filename or URL
   */
  extractModelFormat(filenameOrUrl) {
    const filename = filenameOrUrl.toLowerCase();

    if (filename.includes('.glb')) return 'GLB';
    if (filename.includes('.gltf')) return 'GLTF';
    if (filename.includes('.obj')) return 'OBJ';
    if (filename.includes('.fbx')) return 'FBX';
    if (filename.includes('.ply')) return 'PLY';
    if (filename.includes('.stl')) return 'STL';

    // Default to GLB if zip file (common for 3D models)
    if (filename.includes('.zip')) return 'GLB';

    return 'Unknown';
  },

  /**
   * Generate image from text
   */
  async generateImage(modelOrOptions, prompt, settings) {
    await configureFalAi();
    
    // Handle both calling formats:
    // 1. generateImage(model_id, prompt, settings) - from worker
    // 2. generateImage(options) - from other places
    let model, aspectRatio, numImages, image_url, image_urls;
    
    if (typeof modelOrOptions === 'string') {
      // Format 1: (model_id, prompt, settings)
      model = modelOrOptions;
      aspectRatio = settings?.aspectRatio || settings?.ratio || '1:1';
      numImages = parseInt(settings?.quantity || settings?.numImages) || 1;
      image_url = settings?.image_url; // ✅ For edit operations (upscale, remove-bg, etc)
      image_urls = settings?.image_urls; // ✅ For models that require array (gpt-image, etc)
    } else {
      // Format 2: (options)
      const options = modelOrOptions;
      prompt = options.prompt;
      model = options.model || 'fal-ai/flux-pro';
      aspectRatio = options.aspectRatio || '1:1';
      numImages = options.numImages || 1;
      image_url = options.image_url; // ✅ For edit operations
      image_urls = options.image_urls; // ✅ For models that require array
    }
    
    // ✅ Smart routing: Only route specific inpainting models to editImage()
    // Other editing models (object-removal, etc) use standard generateImage with image_url
    const isInpaintingModel = (image_url || (image_urls && image_urls.length > 0)) && (
      model === 'fal-ai/flux-pro/inpainting' ||
      model.includes('flux') && model.includes('inpainting')
    );
    
    if (isInpaintingModel) {
      console.log('🔀 Detected FLUX inpainting model, routing to editImage()');
      return this.editImage({
        imageUrl: image_url,
        prompt: prompt || 'Enhance and improve the image naturally',
        model: model
      });
    }
    
    // For other editing models (object-removal, background-removal, etc),
    // continue with standard processing and add image_url to input
    
    try {
      // Build input based on model type - Following FAL.AI documentation
      const input = { prompt: prompt };
      
      // ✅ Add image_urls (array) if provided (for models like gpt-image-1-mini/edit)
      if (image_urls && Array.isArray(image_urls)) {
        input.image_urls = image_urls;
        console.log('🖼️  Image URLs (array) included for edit operation:', image_urls.length, 'images');
      }
      // ✅ Add image_url (string) if provided (for edit-image, upscale, remove-bg operations)
      else if (image_url) {
        input.image_url = image_url;
        console.log('🖼️  Image URL (string) included for edit operation');
      }
      
      // ========== IMAGE EDITING MODELS (Object Removal, Face Enhancement, etc) ==========
      // These models primarily need image_url and prompt, minimal other params
      if (model.includes('image-editing') || model.includes('object-removal') || 
          model.includes('face-enhance') || model.includes('face-restoration')) {
        console.log('🛠️  Image editing model detected - using minimal parameters');
        
        // Object removal may work differently - try both approaches
        if (model.includes('object-removal')) {
          console.log('🎯 Object Removal Model:');
          console.log('   - Image URL provided:', !!image_url);
          console.log('   - Prompt:', prompt || 'No prompt (may use default)');
          console.log('   ⚠️  Note: If this fails, model may require mask/coordinates instead of text prompt');
          
          // Some object removal models may not need a prompt
          // They work with automatic detection or require mask/coordinates
          // Keep prompt for now, but make it optional
          if (!prompt || prompt.trim() === '') {
            input.prompt = 'Remove unwanted object from image';
            console.log('   ✏️  Using default prompt for object removal');
          }
        }
        
        // Don't add any aspect_ratio or image_size params
      }
      
      // ========== FLUX MODELS (Black Forest Labs) ==========
      // Uses: image_size, num_images, safety_tolerance, output_format
      // Permitted: 'square_hd', 'square', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'
      else if (model.includes('flux')) {
        // Map aspect ratio to FLUX image_size format
        // Note: Format is orientation_WIDTH_HEIGHT (smaller_larger)
        input.image_size = aspectRatio === '1:1' ? 'square_hd' : 
                          aspectRatio === '16:9' ? 'landscape_16_9' :
                          aspectRatio === '9:16' ? 'portrait_16_9' :    // 9:16 → portrait_16_9 (NOT portrait_9_16)
                          aspectRatio === '4:3' ? 'landscape_4_3' :
                          aspectRatio === '3:4' ? 'portrait_4_3' :      // 3:4 → portrait_4_3 (NOT portrait_3_4)
                          'square_hd';
        input.num_images = numImages;
        input.safety_tolerance = '2';
        input.output_format = 'jpeg';
      }
      
      // ========== STABLE DIFFUSION ==========
      // Uses: image_size, num_inference_steps
      else if (model.includes('stable-diffusion') || model.includes('sdxl')) {
        input.image_size = aspectRatio === '1:1' ? 'square' : 
                          aspectRatio === '16:9' ? 'landscape_16_9' : 
                          'square';
        input.num_inference_steps = 50;
      }
      
      // ========== GOOGLE IMAGEN ==========
      // Uses: aspect_ratio, num_images
      else if (model.includes('imagen')) {
        input.aspect_ratio = aspectRatio || '1:1';
        if (numImages > 1) input.num_images = numImages;
      }
      
      // ========== IDEOGRAM ==========
      // Uses: aspect_ratio, magic_prompt_option
      else if (model.includes('ideogram')) {
        input.aspect_ratio = aspectRatio || '1:1';
        input.magic_prompt_option = 'AUTO';
      }
      
      // ========== RECRAFT V3 ==========
      // Uses: size (width x height format)
      else if (model.includes('recraft')) {
        const sizeMap = {
          '1:1': '1024x1024',
          '16:9': '1536x864',
          '9:16': '864x1536',
          '4:3': '1365x1024',
          '3:4': '1024x1365'
        };
        input.size = sizeMap[aspectRatio] || '1024x1024';
        input.style = 'realistic_image';
      }
      
      // ========== 3D GENERATION MODELS ==========
      // Image-to-3D models (like seed3d) - convert image to 3D, NO prompt needed
      else if (model.includes('seed3d') || model.includes('image-to-3d') || model.includes('img2mesh')) {
        delete input.prompt;
        console.log('🎲 Image-to-3D model detected - prompt removed, only image_url needed');
      }
      // Text-to-3D models - generate 3D from text, prompt IS needed
      // These models will keep their prompt in the input
      
      // ========== BACKGROUND REMOVAL / UTILITY MODELS ==========
      // Models like rembg, face-to-sticker that only need image_url
      else if (model.includes('rembg') || model.includes('imageutils') || 
               model.includes('face-to-sticker') || model.includes('face-swap')) {
        // These models only need image_url (already added)
        // Remove prompt if not needed
        if (model.includes('rembg')) {
          delete input.prompt; // Background removal doesn't need prompt
          console.log('🧹 Background removal - prompt removed');
        }
      }
      
      // ========== QWEN, SORA IMAGE, VEO IMAGE ==========
      // Uses: minimal params - just prompt
      // These models have smart defaults and don't require aspect_ratio
      else if (model.includes('qwen') || model.includes('sora') || model.includes('veo')) {
        // Only prompt - model handles defaults
        // Don't add aspect_ratio as it may not be supported
      }
      
      // ========== PLAYGROUND, OTHERS ==========
      // Uses: aspect_ratio (generic)
      else {
        // Generic fallback - most models support aspect_ratio
        if (aspectRatio && aspectRatio !== '1:1') {
          input.aspect_ratio = aspectRatio;
        }
        if (numImages > 1) {
          input.num_images = numImages;
        }
      }
      
      console.log(`🎨 Calling FAL.AI model: ${model}`);
      console.log(`   Input params:`, JSON.stringify(input, null, 2));

      // ✨ Smart timeout based on generation type (not too aggressive)
      let timeoutMs;
      if (model.includes('3d') || model.includes('seed3d')) {
        timeoutMs = 600000; // 10 minutes for 3D generation
        console.log(`⏱️  3D Model timeout: ${timeoutMs/1000}s`);
      } else if (model.includes('video') || model.includes('veo') || model.includes('kling')) {
        timeoutMs = 480000; // 8 minutes for video generation
        console.log(`⏱️  Video Model timeout: ${timeoutMs/1000}s`);
      } else if (model.includes('sora')) {
        timeoutMs = 600000; // 10 minutes for Sora (very complex)
        console.log(`⏱️  Sora Model timeout: ${timeoutMs/1000}s`);
      } else {
        timeoutMs = 180000; // 3 minutes for image generation
        console.log(`⏱️  Image Model timeout: ${timeoutMs/1000}s`);
      }

      const falPromise = fal.subscribe(model, {
        input,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            console.log('Generation progress:', update.logs);
          }
        }
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Generation timeout: FAL.AI tidak merespons dalam ${timeoutMs/1000} detik. Mungkin model sedang sibuk atau error.`));
        }, timeoutMs);
      });
      
      const result = await Promise.race([falPromise, timeoutPromise]);
      
      // Handle multiple possible FAL.AI response formats

      // ✅ Special handling for 3D models (they return a single model object, not images array)
      if (model.includes('3d') || model.includes('seed3d')) {
        console.log('🎲 Processing 3D model response');

        const modelData = result.model || result.output?.model || result;
        if (!modelData || !modelData.url) {
          console.error('❌ No 3D model found in FAL.AI response:', JSON.stringify(result, null, 2));
          throw new Error('No 3D model in FAL.AI response');
        }

        console.log(`✅ 3D model extracted from FAL.AI response`);
        console.log(`   📦 File: ${modelData.file_name || 'model.zip'}`);
        console.log(`   📏 Size: ${(modelData.file_size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   🔗 URL: ${modelData.url}`);

        return {
          success: true,
          model: {
            url: modelData.url,
            content_type: modelData.content_type || 'application/zip',
            file_name: modelData.file_name || 'model.zip',
            file_size: modelData.file_size || 0,
            format: this.extractModelFormat(modelData.file_name || modelData.url)
          },
          usage_tokens: result.usage_tokens,
          seed: result.seed,
          prompt: result.prompt || prompt
        };
      }

      // ✅ Standard image response handling
      const images = result.images ||
                     result.output?.images ||
                     (result.image ? [result.image] : null) ||
                     (result.output?.image ? [result.output.image] : null);

      if (!images || images.length === 0) {
        console.error('❌ No images found in FAL.AI response:', JSON.stringify(result, null, 2));
        throw new Error('No images in FAL.AI response');
      }

      console.log(`✅ ${images.length} image(s) extracted from FAL.AI response`);

      return {
        success: true,
        images: images.map(img => ({
          url: img.url || img.image_url || img.content_url,
          width: img.width,
          height: img.height,
          content_type: img.content_type || img.type
        })),
        seed: result.seed,
        prompt: result.prompt || prompt
      };
    } catch (error) {
      console.error('Image generation error:', error);
      
      // Log detailed error for debugging
      if (error.body?.detail) {
        console.error('❌ FAL.AI Validation Error Details:', JSON.stringify(error.body.detail, null, 2));
      }
      
      // Enhanced error messages for specific models
      if (model.includes('object-removal')) {
        console.error('');
        console.error('🔴 OBJECT REMOVAL MODEL ERROR');
        console.error('═══════════════════════════════════════════════');
        console.error('Model:', model);
        console.error('Error:', error.message);
        console.error('');
        console.error('💡 Possible Solutions:');
        console.error('   1. Model may require different parameters than prompt');
        console.error('   2. Try using a more specific prompt (e.g., "remove person", "remove car")');
        console.error('   3. Model may need mask/coordinates instead of text');
        console.error('   4. Check if model expects "text" instead of "prompt"');
        console.error('═══════════════════════════════════════════════');
        console.error('');
      }
      
      if (model.includes('3d') || model.includes('seed3d')) {
        console.error('');
        console.error('🔴 3D MODEL ERROR');
        console.error('═══════════════════════════════════════════════');
        console.error('Model:', model);
        console.error('Error:', error.message);
        console.error('');

        if (model.includes('seed3d') || model.includes('image-to-3d')) {
          console.error('💡 Image-to-3D Model Requirements:');
          console.error('   1. Model requires ONLY image_url (no prompt)');
          console.error('   2. Ensure image is uploaded and converted to Data URI');
          console.error('   3. No aspect_ratio, no num_images, no other parameters');
          console.error('   4. Input should be: { image_url: "data:image/..." }');
        } else {
          console.error('💡 Text-to-3D Model Requirements:');
          console.error('   1. Model requires prompt (text description)');
          console.error('   2. No image_url needed (unlike image-to-3d)');
          console.error('   3. Input should be: { prompt: "your description" }');
        }
        console.error('═══════════════════════════════════════════════');
        console.error('');
      }
      
      // If it's a validation error, try to provide helpful message
      if (error.status === 422) {
        const details = error.body?.detail || [];
        const fieldErrors = details.map(d => `${d.loc?.join('.')}: ${d.msg}`).join(', ');
        
        // For 3D models, explain specific requirements
        if (model.includes('seed3d') || model.includes('image-to-3d')) {
          throw new Error(`Invalid parameters for Image-to-3D model. FAL.AI says: ${fieldErrors || error.message}\n\nℹ️ Image-to-3D models only accept 'image_url' parameter (no prompt). Make sure you upload an image first.`);
        } else if (model.includes('3d')) {
          throw new Error(`Invalid parameters for Text-to-3D model. FAL.AI says: ${fieldErrors || error.message}\n\nℹ️ Text-to-3D models require a 'prompt' parameter with text description. Make sure you provide a description.`);
        }
        
        // For object-removal, suggest alternatives
        if (model.includes('object-removal')) {
          throw new Error(`Invalid parameters for Object Removal model. FAL.AI says: ${fieldErrors || error.message}\n\nℹ️ This model may require specific parameters like mask coordinates or different input format. Check FAL.AI documentation for ${model}`);
        }
        
        throw new Error(`Invalid parameters for model ${cleanModelName(model)}: ${fieldErrors || error.message}`);
      }
      
      throw new Error(`Failed to generate image: ${error.message}`);
    }
  },
  
  /**
   * Edit image with AI (Inpainting/Face Retouch)
   * Flexible function for various inpainting models
   */
  async editImage(options) {
    await configureFalAi();
    
    const {
      imageUrl,
      prompt = 'Enhance and retouch the image naturally, improve skin texture, remove blemishes, and enhance overall quality',
      model = 'fal-ai/flux-pro/inpainting',
      strength = 0.8, // Default strength
      ...extraParams // Allow extra parameters for model-specific needs
    } = options;
    
    console.log(`🎨 Edit/Inpainting with model: ${model}`);
    console.log(`📝 Prompt: ${prompt || 'Default: Natural enhancement'}`);
    console.log(`🖼️ Image URL: ${imageUrl ? imageUrl.substring(0, 60) + '...' : 'None'}`);
    
    if (!imageUrl) {
      throw new Error('Image URL is required for edit/inpainting');
    }
    
    try {
      // Build input for FAL.AI Inpainting API
      const input = {
        image_url: imageUrl,
        prompt: prompt
      };
      
      // Add strength for models that support it
      // Lower strength = stay closer to original image
      // Higher strength = more changes
      if (model.includes('inpainting') || model.includes('flux')) {
        input.strength = strength;
        console.log(`🎚️  Strength: ${strength}`);
      }
      
      // Add any extra parameters passed (for model-specific needs)
      Object.assign(input, extraParams);
      
      console.log('📤 Sending request to FAL.AI...');
      console.log('Input:', JSON.stringify(input, null, 2));
      
      const result = await fal.subscribe(model, {
        input: input,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            console.log('⏳ FAL.AI processing...');
          }
        }
      });
      
      console.log('📥 Received response from FAL.AI');
      console.log('Response keys:', Object.keys(result));
      
      // Handle multiple possible FAL.AI response formats
      const image = result.image || 
                    result.output?.image ||
                    (result.images && result.images[0]) ||
                    result.output;
      
      if (!image || !image.url) {
        console.error('❌ No image found in FAL.AI response');
        console.error('Full response:', JSON.stringify(result, null, 2));
        throw new Error('No image in FAL.AI response');
      }
      
      const resultImageUrl = image.url || image.image_url || image.content_url;
      
      // Safely log the image URL (handle both string and object types)
      const imageUrlString = typeof resultImageUrl === 'string' ? resultImageUrl : JSON.stringify(resultImageUrl);
      console.log('✅ Edited image URL:', imageUrlString.substring(0, 100) + '...');
      
      return {
        success: true,
        image: {
          url: resultImageUrl,
          width: image.width,
          height: image.height
        }
      };
    } catch (error) {
      console.error('❌ Image edit error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to edit image: ${error.message}`);
    }
  },
  
  /**
   * Upscale image
   */
  async upscaleImage(options) {
    await configureFalAi();
    
    const {
      imageUrl,
      scale = 2
    } = options;
    
    try {
      const result = await fal.subscribe('fal-ai/clarity-upscaler', {
        input: {
          image_url: imageUrl,
          scale: scale
        },
        logs: true
      });
      
      // Handle multiple possible FAL.AI response formats
      const image = result.image || 
                    result.output?.image ||
                    (result.images && result.images[0]) ||
                    result.output;
      
      if (!image || !image.url) {
        console.error('❌ No image found in FAL.AI response:', JSON.stringify(result, null, 2));
        throw new Error('No image in FAL.AI response');
      }
      
      const imageUrl = image.url || image.image_url || image.content_url;
      
      // Safely log the image URL (handle both string and object types)
      const imageUrlString = typeof imageUrl === 'string' ? imageUrl : JSON.stringify(imageUrl);
      console.log('✅ Upscaled image URL extracted:', imageUrlString.substring(0, 100) + '...');
      
      return {
        success: true,
        image: {
          url: imageUrl,
          width: image.width,
          height: image.height
        }
      };
    } catch (error) {
      console.error('Image upscale error:', error);
      throw new Error(`Failed to upscale image: ${error.message}`);
    }
  },
  
  /**
   * Remove background from image
   */
  async removeBackground(options) {
    await configureFalAi();
    
    const { imageUrl } = options;
    
    try {
      const result = await fal.subscribe('fal-ai/imageutils/rembg', {
        input: {
          image_url: imageUrl
        },
        logs: true
      });
      
      // Handle multiple possible FAL.AI response formats
      const image = result.image || 
                    result.output?.image ||
                    (result.images && result.images[0]) ||
                    result.output;
      
      if (!image || !image.url) {
        console.error('❌ No image found in FAL.AI response:', JSON.stringify(result, null, 2));
        throw new Error('No image in FAL.AI response');
      }
      
      const imageUrl = image.url || image.image_url || image.content_url;
      
      // Safely log the image URL (handle both string and object types)
      const imageUrlString = typeof imageUrl === 'string' ? imageUrl : JSON.stringify(imageUrl);
      console.log('✅ Background removed image URL extracted:', imageUrlString.substring(0, 100) + '...');
      
      return {
        success: true,
        image: {
          url: imageUrl,
          width: image.width,
          height: image.height
        }
      };
    } catch (error) {
      console.error('Background removal error:', error);
      throw new Error(`Failed to remove background: ${error.message}`);
    }
  },
  
  // ============ VIDEO GENERATION ============
  
  /**
   * Generate video from text
   */
  async generateVideo(modelOrOptions, prompt, settings) {
    await configureFalAi();
    
    // Handle both calling formats:
    // 1. generateVideo(model_id, prompt, settings) - from worker
    // 2. generateVideo(options) - from other places
    let model, duration, aspectRatio, image_url, end_image_url;
    
    if (typeof modelOrOptions === 'string') {
      // Format 1: (model_id, prompt, settings)
      model = modelOrOptions;
      duration = parseInt(settings?.duration) || 5;
      aspectRatio = settings?.aspectRatio || settings?.ratio || '16:9';
      image_url = settings?.image_url;
      end_image_url = settings?.end_image_url;
    } else {
      // Format 2: (options)
      const options = modelOrOptions;
      prompt = options.prompt;
      model = options.model || 'fal-ai/kling-video/v1/standard/text-to-video';
      duration = options.duration || 5;
      aspectRatio = options.aspectRatio || '16:9';
      image_url = options.image_url;
      end_image_url = options.end_image_url;
    }
    
    try {
      // Build input based on model type - Following FAL.AI documentation
      const input = { prompt: prompt };
      
      // ========== KLING MODELS (Kuaishou) ==========
      // Uses: duration (string "5" or "10" ONLY), aspect_ratio, image_url (for i2v)
      if (model.includes('kling')) {
        // ✨ Kling only accepts "5" or "10" - map other values
        if (duration) {
          const durationNum = parseInt(duration);
          if (durationNum <= 6) {
            input.duration = '5';  // 4s, 5s, 6s → '5'
          } else {
            input.duration = '10'; // 8s, 10s → '10'
          }
        }
        // Aspect ratio
        if (aspectRatio) {
          input.aspect_ratio = aspectRatio;
        }
        // Image-to-video
        if (image_url) {
          input.image_url = image_url;
        }
        if (end_image_url) {
          input.end_image_url = end_image_url;
        }
      }
      
      // ========== GOOGLE VEO MODELS ==========
      // Uses: duration (string "4s", "6s", "8s"), aspect_ratio
      else if (model.includes('veo')) {
        if (duration) {
          // Veo3 only accepts "4s", "6s", or "8s"
          const durationNum = parseInt(duration);
          let veooDuration;
          if (durationNum <= 4) {
            veooDuration = '4s';
          } else if (durationNum <= 6) {
            veooDuration = '6s';
          } else {
            veooDuration = '8s';
          }
          input.duration = veooDuration;
        }
        if (aspectRatio) {
          input.aspect_ratio = aspectRatio;
        }
      }
      
      // ========== SORA MODELS (OpenAI) ==========
      // Uses: duration (number), aspect_ratio, resolution
      else if (model.includes('sora')) {
        if (duration) {
          input.duration = parseInt(duration);
        }
        if (aspectRatio) {
          input.aspect_ratio = aspectRatio;
        }
        input.resolution = '1080p';
      }
      
      // ========== RUNWAY GEN-3 ==========
      // Uses: duration (number), aspect_ratio, image (for i2v)
      else if (model.includes('runway')) {
        if (duration) {
          input.duration = parseInt(duration);
        }
        if (aspectRatio) {
          input.aspect_ratio = aspectRatio;
        }
        if (image_url) {
          input.image = image_url; // Runway uses 'image' not 'image_url'
        }
      }
      
      // ========== LUMA DREAM MACHINE ==========
      // Uses: aspect_ratio, keyframes (for i2v)
      else if (model.includes('luma')) {
        if (aspectRatio) {
          input.aspect_ratio = aspectRatio;
        }
        if (image_url) {
          input.keyframes = {
            frame0: { type: 'image', url: image_url }
          };
        }
      }
      
      // ========== MINIMAX, HAIPER, PIKA ==========
      // Uses: duration, aspect_ratio (generic)
      else if (model.includes('minimax') || model.includes('haiper') || model.includes('pika')) {
        if (duration) {
          input.duration = duration.toString();
        }
        if (aspectRatio) {
          input.aspect_ratio = aspectRatio;
        }
        if (image_url) {
          input.image_url = image_url;
        }
      }
      
      // ========== STABLE VIDEO DIFFUSION ==========
      // Uses: image (required for SVD), motion_bucket_id, cond_aug
      else if (model.includes('stable-video')) {
        if (image_url) {
          input.image = image_url;
        }
        input.motion_bucket_id = 127;
        input.cond_aug = 0.02;
      }
      
      // ========== GENERIC FALLBACK ==========
      else {
        if (duration) {
          input.duration = duration.toString();
        }
        if (aspectRatio) {
          input.aspect_ratio = aspectRatio;
        }
        if (image_url) {
          input.image_url = image_url;
        }
        if (end_image_url) {
          input.end_image_url = end_image_url;
        }
      }
      
      console.log(`🎬 Calling FAL.AI video model: ${model}`);
      console.log(`   Input params:`, JSON.stringify(input, null, 2));
      
      // ✨ Add timeout for FAL.AI video API call (3 minutes)
      // Most video generations complete in 30-90 seconds
      const VIDEO_TIMEOUT = 180000; // 3 minutes
      const falPromise = fal.subscribe(model, {
        input,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            console.log('Video generation progress:', update.logs);
          }
        }
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Video generation timeout: FAL.AI tidak merespons dalam ${VIDEO_TIMEOUT/1000} detik. Mungkin model sedang sibuk atau error.`));
        }, VIDEO_TIMEOUT);
      });
      
      const result = await Promise.race([falPromise, timeoutPromise]);
      
      console.log('📦 FAL.AI Response received, structure:', Object.keys(result));
      
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
        console.error('❌ No video URL found in FAL.AI response');
        console.error('   Full response:', JSON.stringify(result, null, 2));
        throw new Error('No video URL in FAL.AI response. Check logs for full response.');
      }
      
      console.log('✅ Video URL extracted:', videoUrl.substring(0, 100) + '...');
      console.log('   Video metadata:', {
        width: video?.width,
        height: video?.height,
        duration: video?.duration
      });
      
      return {
        success: true,
        video: {
          url: videoUrl,
          width: video?.width || 1920,
          height: video?.height || 1080,
          duration: video?.duration || parseInt(duration)
        }
      };
    } catch (error) {
      console.error('Video generation error:', error);
      
      // Log detailed error for debugging
      if (error.body?.detail) {
        console.error('❌ FAL.AI Validation Error Details:', JSON.stringify(error.body.detail, null, 2));
      }
      
      // If it's a validation error, try to provide helpful message
      if (error.status === 422) {
        const details = error.body?.detail || [];
        const fieldErrors = details.map(d => `${d.loc?.join('.')}: ${d.msg}`).join(', ');
        throw new Error(`Invalid parameters for model ${cleanModelName(model)}: ${fieldErrors || error.message}`);
      }
      
      throw new Error(`Failed to generate video: ${error.message}`);
    }
  },
  
  /**
   * Generate video from image (image-to-video)
   */
  async imageToVideo(options) {
    await configureFalAi();
    
    const {
      imageUrl,
      prompt,
      duration = 5,
      aspectRatio = '16:9'
    } = options;
    
    try {
      const result = await fal.subscribe('fal-ai/kling-video/v1/standard/image-to-video', {
        input: {
          image_url: imageUrl,
          prompt: prompt,
          duration: duration === 5 ? '5' : '10',
          aspect_ratio: aspectRatio
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            console.log('Video generation progress:', update.logs);
          }
        }
      });
      
      // Handle multiple possible FAL.AI response formats
      const video = result.video || 
                    result.output?.video ||
                    result.output;
      
      if (!video) {
        console.error('❌ No video found in FAL.AI response:', JSON.stringify(result, null, 2));
        throw new Error('No video in FAL.AI response');
      }
      
      const videoUrl = video.url || video.video_url || video.content_url;
      
      if (!videoUrl) {
        console.error('❌ No video URL found in FAL.AI response:', JSON.stringify(video, null, 2));
        throw new Error('No video URL in FAL.AI response');
      }
      
      console.log('✅ Image-to-video URL extracted:', videoUrl.substring(0, 100) + '...');
      
      return {
        success: true,
        video: {
          url: videoUrl,
          width: video.width,
          height: video.height,
          duration: video.duration
        }
      };
    } catch (error) {
      console.error('Image-to-video error:', error);
      throw new Error(`Failed to generate video from image: ${error.message}`);
    }
  },
  
  /**
   * Generate video with start and end frames
   */
  async imageToVideoWithEndFrame(options) {
    await configureFalAi();
    
    const {
      startImageUrl,
      endImageUrl,
      prompt,
      duration = 5,
      aspectRatio = '16:9'
    } = options;
    
    try {
      const result = await fal.subscribe('fal-ai/kling-video/v1/standard/image-to-video', {
        input: {
          image_url: startImageUrl,
          image_tail_url: endImageUrl, // End frame
          prompt: prompt,
          duration: duration === 5 ? '5' : '10',
          aspect_ratio: aspectRatio
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            console.log('Video generation progress:', update.logs);
          }
        }
      });
      
      // Handle multiple possible FAL.AI response formats
      const video = result.video || 
                    result.output?.video ||
                    result.output;
      
      if (!video) {
        console.error('❌ No video found in FAL.AI response:', JSON.stringify(result, null, 2));
        throw new Error('No video in FAL.AI response');
      }
      
      const videoUrl = video.url || video.video_url || video.content_url;
      
      if (!videoUrl) {
        console.error('❌ No video URL found in FAL.AI response:', JSON.stringify(video, null, 2));
        throw new Error('No video URL in FAL.AI response');
      }
      
      console.log('✅ Video with end frame URL extracted:', videoUrl.substring(0, 100) + '...');
      
      return {
        success: true,
        video: {
          url: videoUrl,
          width: video.width,
          height: video.height,
          duration: video.duration
        }
      };
    } catch (error) {
      console.error('Image-to-video with end frame error:', error);
      throw new Error(`Failed to generate video with end frame: ${error.message}`);
    }
  },
  
  // ============ UTILITY FUNCTIONS ============
  
  /**
   * Check API balance/credits
   * Note: fal.ai doesn't have a public balance endpoint
   * This returns mock data - actual usage is tracked per request
   */
  async checkBalance() {
    try {
      const result = await pool.query(
        "SELECT api_key FROM api_configs WHERE service_name = 'FAL_AI' AND is_active = true LIMIT 1"
      );
      
      if (result.rows.length === 0 || !result.rows[0].api_key) {
        return {
          success: false,
          message: 'FAL.AI API key not configured',
          balance: 0
        };
      }
      
      const apiKey = result.rows[0].api_key;
      
      // Test API key validity by making a simple request
      try {
        const axios = require('axios');
        const testResponse = await axios.get('https://queue.fal.run/fal-ai/flux-pro/v1.1/status', {
          headers: {
            'Authorization': `Key ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000,
          validateStatus: function (status) {
            // Accept 200-299 and 404 (means API is reachable)
            return (status >= 200 && status < 300) || status === 404;
          }
        });
        
        // API key is valid if we get any response
        return {
          success: true,
          balance: 'Pay per use',
          currency: 'USD',
          formatted: 'Pay as you go',
          message: 'API key is active. fal.ai uses pay-per-use pricing.',
          apiKeyValid: true
        };
      } catch (error) {
        // If we get auth error, key is invalid
        if (error.response && error.response.status === 401) {
          return {
            success: false,
            message: 'API key is invalid',
            balance: 0,
            apiKeyValid: false
          };
        }
        
        // Otherwise, assume key is valid but can't verify
        return {
          success: true,
          balance: 'Unknown',
          currency: 'USD',
          formatted: 'Pay as you go',
          message: 'API key configured. fal.ai uses pay-per-use pricing.',
          apiKeyValid: true
        };
      }
    } catch (error) {
      console.error('Balance check error:', error.message);
      return {
        success: false,
        message: error.message,
        balance: 0
      };
    }
  },
  
  /**
   * Get pricing information
   */
  /**
   * Get cost and model details from database by model_id
   * ALWAYS uses database prices to stay in sync with admin settings
   */
  async getCostFromDatabase(modelId) {
    try {
      // Cast both sides to TEXT for comparison to handle both int and string IDs
      const result = await pool.query(
        `SELECT cost, pricing_type, max_duration, type, name, fal_price 
         FROM ai_models 
         WHERE id::text = $1::text OR model_id::text = $1::text
         LIMIT 1`,
        [modelId.toString()]
      );
      
      if (result.rows.length > 0) {
        return result.rows[0]; // Return full model data for pricing calculation
      }
      
      // If model not found, return minimum fallback
      console.warn(`⚠️ Model ${modelId} not found in database, using fallback`);
      return { cost: 1, pricing_type: 'flat', max_duration: 10, type: 'image' };
    } catch (error) {
      console.error('❌ Error getting cost from database:', error);
      return { cost: 1, pricing_type: 'flat', max_duration: 10, type: 'image' };
    }
  },
  
  /**
   * Calculate cost for generation with duration support for videos
   * Handles per-second, flat rate, and multi-tier pricing
   */
  async calculateCost(modelId, quantity = 1, duration = null, videoType = null, hasAudio = false) {
    // Get full model data from database (single source of truth)
    const model = await this.getCostFromDatabase(modelId);
    const baseCost = parseFloat(model.cost) || 1;
    
    // ===== IMPORTANT: Use pre-calculated cost from admin panel =====
    // Admin panel calculates credits using × 10 formula and stores in `cost` field
    // Backend trusts this value as single source of truth
    // DO NOT RECALCULATE here to avoid formula inconsistencies
    
    // ===== PER-SECOND PRICING =====
    // For videos with per-second pricing (stored as credits/second in database)
    if (duration && model.type === 'video' && model.pricing_type === 'per_second') {
      const maxDuration = parseInt(model.max_duration) || 10;
      const requestedDuration = parseInt(duration);
      
      // baseCost is already credits per second (calculated by admin with × 10 formula)
      // Simply multiply by actual duration
      const creditsPerSecond = baseCost;
      const adjustedCost = creditsPerSecond * requestedDuration;
      const totalCost = adjustedCost * quantity;
      
      console.log(`💰 Video cost (per-second): ${model.name}`);
      console.log(`   Credits/second: ${creditsPerSecond.toFixed(2)} cr/s`);
      console.log(`   Duration: ${requestedDuration}s`);
      console.log(`   Quantity: ${quantity}x`);
      console.log(`   Total: ${totalCost.toFixed(1)} credits`);
      
      return totalCost;
    }
    
    // ===== SIMPLE/FLAT-RATE PRICING =====
    // For images, flat-rate videos, and all other pricing structures
    // (including multi-tier, per-pixel, per-megapixel, 3D, resolution-based)
    // All use pre-calculated cost from database
    const totalCost = baseCost * quantity;
    console.log(`💰 Cost from database: ${model.name} → ${baseCost} × ${quantity} = ${totalCost} credits`);
    return totalCost;
  },
  
  /**
   * Calculate cost by model ID (modern approach)
   * Supports multi-tier pricing with videoType and hasAudio parameters
   */
  async calculateCostByModel(modelId, quantity = 1, duration = null, videoType = null, hasAudio = false) {
    return await this.calculateCost(modelId, quantity, duration, videoType, hasAudio);
  },
  
  /**
   * Save generation to history
   */
  async saveGeneration(userId, data) {
    const {
      generationType,
      subType,
      prompt,
      resultUrl,
      settings,
      creditsCost,
      status = 'completed',
      errorMessage = null  // ✅ Added error message support
    } = data;
    
    try {
      const query = `
        INSERT INTO ai_generation_history 
        (user_id, generation_type, sub_type, prompt, result_url, settings, cost_credits, status, error_message)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const values = [
        userId,
        generationType,
        subType,
        prompt,
        resultUrl,
        JSON.stringify(settings),
        creditsCost,
        status,
        errorMessage  // ✅ Now saves error message
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error saving generation:', error);
      throw error;
    }
  },
  
  /**
   * Get user generation history
   */
  async getUserHistory(userId, limit = 50) {
    try {
      const query = `
        SELECT * FROM ai_generation_history 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      `;
      
      const result = await pool.query(query, [userId, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching history:', error);
      throw error;
    }
  },
  
  /**
   * Deduct credits from user
   */
  async deductCredits(userId, amount, description) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if user has enough credits
      const checkQuery = 'SELECT credits FROM users WHERE id = $1';
      const checkResult = await client.query(checkQuery, [userId]);
      
      if (checkResult.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const currentCredits = checkResult.rows[0].credits;
      if (currentCredits < amount) {
        throw new Error('Insufficient credits');
      }
      
      // Deduct credits
      const updateQuery = `
        UPDATE users 
        SET credits = credits - $1 
        WHERE id = $2 
        RETURNING credits
      `;
      const updateResult = await client.query(updateQuery, [amount, userId]);
      const newBalance = updateResult.rows[0].credits;
      
      // Log transaction
      const logQuery = `
        INSERT INTO credit_transactions 
        (user_id, amount, transaction_type, description, balance_after)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      await client.query(logQuery, [
        userId,
        -amount,
        'debit',
        description,
        newBalance
      ]);
      
      await client.query('COMMIT');
      return { success: true, newBalance };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
  
  /**
   * Refund credits to user (when generation fails)
   */
  async refundCredits(userId, amount, description) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Add credits back
      const updateQuery = `
        UPDATE users 
        SET credits = credits + $1 
        WHERE id = $2 
        RETURNING credits
      `;
      const updateResult = await client.query(updateQuery, [amount, userId]);
      const newBalance = updateResult.rows[0].credits;
      
      // Log refund transaction
      const logQuery = `
        INSERT INTO credit_transactions 
        (user_id, amount, transaction_type, description, balance_after)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      await client.query(logQuery, [
        userId,
        amount,
        'credit',
        `REFUND: ${description}`,
        newBalance
      ]);
      
      await client.query('COMMIT');
      console.log(`✅ Refunded ${amount} credits to user ${userId}`);
      return { success: true, newBalance };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error refunding credits:', error);
      throw error;
    } finally {
      client.release();
    }
  },
  
  // ============ AUDIO GENERATION ============
  
  /**
   * Generate Text-to-Speech audio
   */
  async generateTextToSpeech(options) {
    await configureFalAi();
    
    const {
      prompt,
      model = 'fal-ai/elevenlabs-text-to-speech',
      duration = 10
    } = options;
    
    try {
      console.log('🎤 Generating TTS with model:', model);
      
      // ✨ Add timeout for FAL.AI TTS API call (90 seconds)
      const TTS_TIMEOUT = 90000; // 90 seconds
      const falPromise = fal.subscribe(model, {
        input: {
          text: prompt,
          voice: 'default', // Can be configured
          model_id: 'eleven_monolingual_v1'
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            console.log('TTS progress:', update.logs);
          }
        }
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`TTS generation timeout: FAL.AI tidak merespons dalam ${TTS_TIMEOUT/1000} detik. Mungkin model sedang sibuk atau error.`));
        }, TTS_TIMEOUT);
      });
      
      const result = await Promise.race([falPromise, timeoutPromise]);
      
      // Handle multiple possible FAL.AI response formats
      const audioUrl = result.audio_url || 
                       result.url || 
                       result.audio?.url || 
                       result.output?.audio_url ||
                       result.output?.url;
      
      if (!audioUrl) {
        console.error('❌ No audio URL found in FAL.AI response:', JSON.stringify(result, null, 2));
        throw new Error('No audio URL in FAL.AI response');
      }
      
      // Safely log the audio URL (handle both string and object types)
      const audioUrlString = typeof audioUrl === 'string' ? audioUrl : JSON.stringify(audioUrl);
      console.log('✅ TTS audio URL extracted:', audioUrlString.substring(0, 100) + '...');
      
      return {
        success: true,
        audio_url: audioUrl,
        duration: result.duration || result.audio?.duration || duration,
        prompt: prompt,
        metadata: result.metadata || result.audio?.metadata
      };
    } catch (error) {
      console.error('TTS generation error:', error);
      throw new Error(`Failed to generate speech: ${error.message}`);
    }
  },
  
  /**
   * Generate Music from text
   */
  async generateMusic(options) {
    await configureFalAi();
    
    const {
      prompt,
      model = 'fal-ai/musicgen',
      duration = 30,
      advanced = {}
    } = options;
    
    try {
      console.log('🎵 Generating music with model:', model);
      
      // ✨ Build enhanced prompt from advanced options (for better compatibility)
      let enhancedPrompt = prompt;
      const enhancements = [];
      
      if (advanced.genre) {
        enhancements.push(`${advanced.genre} music`);
        console.log('   🎸 Genre:', advanced.genre);
      }
      if (advanced.mood) {
        enhancements.push(`${advanced.mood} mood`);
        console.log('   🎭 Mood:', advanced.mood);
      }
      if (advanced.tempo) {
        const tempo = parseInt(advanced.tempo);
        const tempoDesc = tempo < 90 ? 'slow tempo' : tempo > 140 ? 'fast tempo' : 'medium tempo';
        enhancements.push(`${tempoDesc} (${tempo} BPM)`);
        console.log('   ⏱️  Tempo:', tempo, 'BPM');
      }
      if (advanced.instruments) {
        enhancements.push(`featuring ${advanced.instruments}`);
        console.log('   🎹 Instruments:', advanced.instruments);
      }
      
      // Combine prompt with enhancements
      if (enhancements.length > 0) {
        enhancedPrompt = `${prompt}, ${enhancements.join(', ')}`;
        console.log('   ✨ Enhanced prompt:', enhancedPrompt);
      }
      
      // Build FAL.AI input with STANDARD parameters only
      const falInput = {
        prompt: enhancedPrompt,
        duration: duration,
        model_version: 'large'
      };
      
      // Add lyrics as separate parameter (some models may support this)
      if (advanced.lyrics) {
        falInput.lyrics = advanced.lyrics;
        console.log('   📝 Lyrics provided:', advanced.lyrics.substring(0, 50) + '...');
      }
      
      // ✨ Add timeout for FAL.AI Music API call (3 minutes)
      const MUSIC_TIMEOUT = 180000; // 3 minutes
      const falPromise = fal.subscribe(model, {
        input: falInput,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            console.log('Music generation progress:', update.logs);
          }
        }
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Music generation timeout: FAL.AI tidak merespons dalam ${MUSIC_TIMEOUT/1000} detik. Mungkin model sedang sibuk atau error.`));
        }, MUSIC_TIMEOUT);
      });
      
      const result = await Promise.race([falPromise, timeoutPromise]);
      
      // Handle multiple possible FAL.AI response formats
      let audioUrl = result.audio_url || 
                     result.url || 
                     result.audio?.url || 
                     result.output?.audio_url ||
                     result.output?.url;
      
      // Handle case where audioUrl is an object with a url property
      if (audioUrl && typeof audioUrl === 'object' && audioUrl.url) {
        audioUrl = audioUrl.url;
      }
      
      if (!audioUrl || typeof audioUrl !== 'string') {
        console.error('❌ No valid audio URL found in FAL.AI response:', JSON.stringify(result, null, 2));
        throw new Error('No valid audio URL in FAL.AI response');
      }
      
      console.log('✅ Music audio URL extracted:', audioUrl.substring(0, 100) + '...');
      
      return {
        success: true,
        audio_url: audioUrl,
        duration: result.duration || result.audio?.duration || duration,
        prompt: prompt,
        metadata: result.metadata || result.audio?.metadata
      };
    } catch (error) {
      console.error('Music generation error:', error);
      throw new Error(`Failed to generate music: ${error.message}`);
    }
  },
  
  /**
   * Generate Sound Effects
   */
  async generateSoundEffect(options) {
    await configureFalAi();
    
    const {
      prompt,
      model = 'fal-ai/bark',
      duration = 10,
      advanced = {}
    } = options;
    
    try {
      console.log('🔊 Generating sound effect with model:', model);
      
      // ✨ Build enhanced prompt from advanced options (for better compatibility)
      let enhancedPrompt = prompt;
      const enhancements = [];
      
      if (advanced.category) {
        enhancements.push(`${advanced.category} sound`);
        console.log('   📂 Category:', advanced.category);
      }
      if (advanced.quality) {
        if (advanced.quality === 'synthesized') {
          enhancements.push('synthesized');
        } else if (advanced.quality === 'lo-fi') {
          enhancements.push('lo-fi vintage quality');
        } else if (advanced.quality === '8-bit') {
          enhancements.push('8-bit retro style');
        }
        // 'realistic' is default, no need to add
        console.log('   🎚️  Quality:', advanced.quality);
      }
      if (advanced.ambience && advanced.ambience !== 'none') {
        if (advanced.ambience === 'echo') {
          enhancements.push('with echo effect');
        } else if (advanced.ambience === 'reverb') {
          enhancements.push('with reverb');
        } else if (advanced.ambience === 'spatial') {
          enhancements.push('3D spatial audio');
        }
        console.log('   🌊 Ambience:', advanced.ambience);
      }
      
      // Combine prompt with enhancements
      if (enhancements.length > 0) {
        enhancedPrompt = `${prompt}, ${enhancements.join(', ')}`;
        console.log('   ✨ Enhanced prompt:', enhancedPrompt);
      }
      
      // Build FAL.AI input with STANDARD parameters only
      const falInput = {
        text: enhancedPrompt,
        duration: duration
      }
      
      // ✨ Add timeout for FAL.AI SFX API call (90 seconds)
      const SFX_TIMEOUT = 90000; // 90 seconds
      const falPromise = fal.subscribe(model, {
        input: falInput,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            console.log('SFX progress:', update.logs);
          }
        }
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Sound effect generation timeout: FAL.AI tidak merespons dalam ${SFX_TIMEOUT/1000} detik. Mungkin model sedang sibuk atau error.`));
        }, SFX_TIMEOUT);
      });
      
      const result = await Promise.race([falPromise, timeoutPromise]);
      
      // Handle multiple possible FAL.AI response formats
      let audioUrl = result.audio_url || 
                     result.url || 
                     result.audio?.url || 
                     result.output?.audio_url ||
                     result.output?.url;
      
      // Handle case where audioUrl is an object with a url property
      if (audioUrl && typeof audioUrl === 'object' && audioUrl.url) {
        audioUrl = audioUrl.url;
      }
      
      if (!audioUrl || typeof audioUrl !== 'string') {
        console.error('❌ No valid audio URL found in FAL.AI response:', JSON.stringify(result, null, 2));
        throw new Error('No valid audio URL in FAL.AI response');
      }
      
      console.log('✅ SFX audio URL extracted:', audioUrl.substring(0, 100) + '...');
      
      return {
        success: true,
        audio_url: audioUrl,
        duration: result.duration || result.audio?.duration || duration,
        prompt: prompt,
        metadata: result.metadata || result.audio?.metadata
      };
    } catch (error) {
      console.error('Sound effect generation error:', error);
      throw new Error(`Failed to generate sound effect: ${error.message}`);
    }
  },
  
  /**
   * Transcribe Audio (Speech-to-Text)
   */
  async transcribeAudio(options) {
    await configureFalAi();
    
    const {
      audioBuffer,
      audioMimetype,
      audioOriginalName,
      language = 'auto'
    } = options;
    
    try {
      console.log('📝 Transcribing audio:', audioOriginalName);
      
      // Convert buffer to base64 for upload
      const base64Audio = audioBuffer.toString('base64');
      const dataUrl = `data:${audioMimetype};base64,${base64Audio}`;
      
      const result = await fal.subscribe('fal-ai/whisper', {
        input: {
          audio_url: dataUrl,
          task: 'transcribe',
          language: language === 'auto' ? undefined : language,
          chunk_level: 'segment',
          version: '3'
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            console.log('Transcription progress:', update.logs);
          }
        }
      });
      
      return {
        success: true,
        text: result.text || result.transcription,
        language: result.language,
        duration: result.duration
      };
    } catch (error) {
      console.error('Transcription error:', error);
      throw new Error(`Failed to transcribe audio: ${error.message}`);
    }
  }
};

module.exports = FalAiService;

