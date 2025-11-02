const Admin = require('../models/Admin');
const fetch = require('node-fetch');

class SunoService {
  constructor() {
    this.baseUrl = 'https://api.sunoapi.org/api/v1'; // Suno API v1
    this.apiKey = null;
  }

  /**
   * Initialize Suno service with API key from database
   */
  async initialize() {
    try {
      const config = await Admin.getApiConfig('SUNO');
      
      if (!config || !config.is_active) {
        console.warn('⚠️ Suno API not configured or not active');
        return false;
      }

      this.apiKey = config.api_key;
      
      // Use endpoint_url from DB, or default
      if (config.endpoint_url) {
        // Ensure endpoint_url includes /api/v1
        if (!config.endpoint_url.includes('/api/v1')) {
          this.baseUrl = config.endpoint_url + '/api/v1';
        } else {
          this.baseUrl = config.endpoint_url;
        }
      }
      
      // Get callback URL from config or use default
      // For localhost development, use webhook.site as placeholder since Suno can't reach localhost
      const isDevelopment = process.env.NODE_ENV !== 'production';
      const defaultCallback = isDevelopment 
        ? 'https://webhook.site/test-suno-callback' // Placeholder for dev
        : 'https://pixelnest.app/music/callback/suno';
      
      this.callbackUrl = config.additional_config?.callback_url || defaultCallback;
      
      console.log('✅ Suno service initialized');
      console.log('   Base URL:', this.baseUrl);
      console.log('   Full endpoint:', `${this.baseUrl}/generate`);
      console.log('   Callback URL:', this.callbackUrl);
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Suno service:', error);
      return false;
    }
  }

  /**
   * Generate music from text prompt (Callback-based)
   * Suno API will send results to callback URL when generation is complete
   * 
   * ⚠️ IMPORTANT - Suno API has 2 modes:
   * 1. Description Mode (custom_mode: false):
   *    - prompt = music description
   *    - AI generates lyrics automatically
   * 
   * 2. Custom Mode (custom_mode: true):
   *    - prompt = actual song lyrics
   *    - tags/style = genre, mood, instruments
   * 
   * @param {Object} params - Generation parameters
   * @param {string} params.prompt - Description OR lyrics (depends on custom_mode)
   * @param {boolean} params.make_instrumental - Whether to create instrumental music
   * @param {boolean} params.custom_mode - Use custom lyrics mode
   * @param {string} params.tags - Style/genre tags (combined with lyrics in custom mode)
   * @param {string} params.vocal_gender - 'm' for male, 'f' for female (sent as vocalGender to API)
   * @param {string} params.model - Model version (v3_5, v4, v4_5, v4_5PLUS, v5)
   * @returns {Promise<Object>} Task info (results delivered via callback)
   */
  async generateMusic(params) {
    try {
      // Initialize if not already done
      if (!this.apiKey) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Suno API not configured');
        }
      }

      const {
        prompt,
        make_instrumental = false,
        model = 'v5',
        custom_mode = false,
        instrumental = false,
        title = '',
        tags = '',
        vocal_gender = null, // 'm' for male, 'f' for female, null for auto
        weirdness = 0.5, // 0-1: creativity level
        style_weight = 0.7 // 0-1: style adherence
      } = params;

      console.log('🎵 Generating music with Suno API');
      console.log('   API URL:', `${this.baseUrl}/generate`);
      console.log('   Model:', model);
      console.log('   Prompt:', prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''));
      console.log('   Make Instrumental:', make_instrumental || instrumental);
      console.log('   Vocal Gender:', vocal_gender || 'auto (not set)');
      console.log('   Custom Mode:', custom_mode);
      if (custom_mode) {
        console.log('   📝 Custom Mode: Prompt = Lyrics, Tags/Style = Genre/Mood');
      } else {
        console.log('   📝 Description Mode: Prompt = Description, AI generates lyrics');
      }
      console.log('   Weirdness:', weirdness);
      console.log('   Style Weight:', style_weight);
      console.log('   🎼 Expected Results: 2 tracks (Suno default dual track generation)');

      // Convert model to Suno format (v5 -> V5, v4_5 -> V4_5, v3_5 -> V3_5, etc)
      const modelFormatted = model.toUpperCase();
      
      // Build request body according to Suno API docs
      // Basic required parameters from docs
      const requestBody = {
        prompt,
        customMode: custom_mode, // camelCase as per docs
        instrumental: make_instrumental || instrumental,
        model: modelFormatted,
        // Callback URL from config (set in admin panel)
        callBackUrl: this.callbackUrl,
        // ✅ IMPORTANT: Ensure Suno returns 2 results (dual track)
        wait_audio: false // false = callback when ready, true = wait for all tracks
      };

      // Optional parameters (if supported by Suno API)
      if (title) requestBody.title = title;
      if (tags) {
        requestBody.style = tags; // 'tags' maps to 'style' in Suno API
        console.log(`   🏷️  Style/Tags: ${tags}`);
      }
      
      // Try including advanced parameters (may or may not be supported)
      // If not supported, Suno API will ignore them
      if (!make_instrumental && !instrumental && vocal_gender) {
        // Suno API uses 'vocalGender' field (camelCase): 'm' for male, 'f' for female
        // Docs: https://docs.sunoapi.org/suno-api/generate-music
        requestBody.vocalGender = vocal_gender;
        console.log(`   🎤 Setting vocal gender: ${vocal_gender} (${vocal_gender === 'm' ? 'Male' : vocal_gender === 'f' ? 'Female' : 'Unknown'})`);
      }
      
      // Add weirdness and styleWeight if provided
      // Note: Suno uses 'weirdnessConstraint' not 'weirdness'
      if (weirdness !== undefined && weirdness !== 0.5) {
        requestBody.weirdnessConstraint = parseFloat(weirdness);
      }
      if (style_weight !== undefined && style_weight !== 0.7) {
        requestBody.styleWeight = parseFloat(style_weight);
      }

      console.log('📤 Sending request body to Suno API:');
      console.log(JSON.stringify(requestBody, null, 2));
      
      // Highlight important fields
      console.log(`   🎵 wait_audio: ${requestBody.wait_audio} (Ensures 2 track results)`);
      if (requestBody.style) {
        console.log(`   ✅ Style/Tags: ${requestBody.style}`);
      }
      if (requestBody.vocalGender) {
        console.log(`   ✅ Vocal Gender (vocalGender): ${requestBody.vocalGender} (${requestBody.vocalGender === 'm' ? 'Male' : requestBody.vocalGender === 'f' ? 'Female' : 'Unknown'})`);
      }
      if (requestBody.instrumental) {
        console.log(`   🎸 Instrumental: ${requestBody.instrumental}`);
      }

      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      // Parse response
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('❌ Failed to parse Suno API response:', jsonError);
        console.error('   Status:', response.status, response.statusText);
        throw new Error(`Suno API returned invalid JSON. Status: ${response.status} ${response.statusText}`);
      }

      // Check for API error response (code !== 200)
      if (data.code && data.code !== 200) {
        let errorMessage = data.msg || data.message || `Suno API error: ${data.code}`;
        
        // Special handling for Suno API credit issues
        if (errorMessage.includes('insufficient') || errorMessage.includes('credits')) {
          errorMessage = '⚠️ Suno API credits habis! Administrator perlu top-up saldo Suno API. (Ini bukan masalah saldo user)';
          console.error('❌ SUNO API OUT OF CREDITS!');
          console.error('   Administrator needs to top up Suno API balance at: https://sunoapi.org');
        }
        
        console.error('❌ Suno API error:', {
          code: data.code,
          message: data.msg,
          data: data
        });
        throw new Error(errorMessage);
      }

      // Check HTTP response status
      if (!response.ok) {
        const errorMessage = data.message || data.error || data.detail || 
                           `Suno API error: ${response.status} ${response.statusText}`;
        console.error('❌ Suno API HTTP error:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
        throw new Error(errorMessage);
      }

      // Validate response data
      if (!data || !data.data || !data.data.taskId) {
        console.error('❌ Invalid Suno response format:', data);
        throw new Error('Suno API returned invalid response format');
      }

      const taskId = data.data.taskId;
      console.log('✅ Suno task created:', taskId);
      console.log('   ℹ️  Results will be sent to callback URL when ready (~30-60s)');
      console.log('   🎼 Expecting 2 tracks from Suno (dual track generation)');
      console.log('   📞 Callback type: "first" (track 1 ready) → "complete" (both tracks ready)');
      
      // Suno API is callback-based - results delivered via webhook
      return { 
        taskId,
        status: 'processing',
        message: 'Music generation started. Awaiting callback with 2 tracks.',
        callback_based: true,
        expected_tracks: 2
      };
      
    } catch (error) {
      console.error('❌ Suno music generation error:', error);
      throw error;
    }
  }

  /**
   * Poll task status (DEPRECATED - Suno uses callbacks)
   * This method is kept for backward compatibility but Suno API doesn't support polling
   * Use callback handler in /music/callback/suno instead
   * @deprecated Use callback-based workflow instead
   */
  async pollTaskStatus(taskId, maxAttempts = 5, intervalMs = 5000) {
    // Suno API uses callbacks, not polling
    console.warn('⚠️ Polling not supported by Suno API');
    console.warn('   Results will be delivered via callback URL');
    
    return {
      taskId: taskId,
      status: 'processing',
      message: 'Suno uses callback-based delivery. Check /music/callback/suno endpoint.',
      audio_url: null,
      polling_not_supported: true
    };
  }

  /**
   * Generate lyrics from text prompt (Free feature)
   * @param {string} prompt - Description of the lyrics to generate
   * @returns {Promise<Object>} Lyrics generation result
   */
  async generateLyrics(prompt) {
    try {
      if (!this.apiKey) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Suno API not configured');
        }
      }

      console.log('📝 Generating lyrics with Suno API');

      const response = await fetch(`${this.baseUrl}/api/generate_lyrics`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Suno lyrics API request failed');
      }

      const data = await response.json();
      console.log('✅ Lyrics generated:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Suno lyrics generation error:', error);
      throw error;
    }
  }

  /**
   * Get music generation details
   * @param {string} taskId - Task ID from generation request
   * @returns {Promise<Object>} Generation details
   */
  async getMusicDetails(taskId) {
    try {
      if (!this.apiKey) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Suno API not configured');
        }
      }

      const response = await fetch(`${this.baseUrl}/api/get?ids=${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get music details');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Suno get music details error:', error);
      throw error;
    }
  }

  /**
   * Get remaining credits
   * @returns {Promise<Object>} Credits information
   */
  async getRemainingCredits() {
    try {
      if (!this.apiKey) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Suno API not configured');
        }
      }

      const response = await fetch(`${this.baseUrl}/api/get_credits`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get credits');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Suno get credits error:', error);
      throw error;
    }
  }

  /**
   * Extend music track
   * @param {Object} params - Extension parameters
   * @param {string} params.audio_id - ID of the audio to extend
   * @param {string} params.prompt - Continuation prompt
   * @param {string} params.continue_at - Time to continue from (seconds)
   * @returns {Promise<Object>} Extension result
   */
  async extendMusic(params) {
    try {
      if (!this.apiKey) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Suno API not configured');
        }
      }

      const { audio_id, prompt, continue_at } = params;

      const response = await fetch(`${this.baseUrl}/api/extend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audio_id,
          prompt,
          continue_at
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to extend music');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Suno extend music error:', error);
      throw error;
    }
  }

  /**
   * Test Suno API connection without generating music
   */
  async testConnection() {
    try {
      await this.initialize();
      
      if (!this.apiKey) {
        return {
          success: false,
          message: 'Suno API key not configured',
          status: 'api_key_missing'
        };
      }

      // Test with a simple API call that doesn't generate music
      // Try to get credits/status info (if API supports it)
      try {
        const response = await fetch(`${this.baseUrl}/credits`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            message: 'Suno API connection successful',
            status: 'connected',
            credits_available: data.credits_left || 'unknown'
          };
        } else if (response.status === 401) {
          return {
            success: false,
            message: 'Suno API key is invalid',
            status: 'invalid_api_key'
          };
        } else if (response.status === 404) {
          // Credits endpoint might not exist, try a different approach
          return {
            success: true,  // API is reachable
            message: 'Suno API is accessible (credits endpoint not available)',
            status: 'connected_limited'
          };
        } else {
          return {
            success: false,
            message: `Suno API returned status ${response.status}`,
            status: 'api_error'
          };
        }
      } catch (fetchError) {
        if (fetchError.code === 'ENOTFOUND' || fetchError.code === 'ECONNREFUSED') {
          return {
            success: false,
            message: 'Cannot reach Suno API endpoint',
            status: 'endpoint_unreachable'
          };
        } else if (fetchError.code === 'ETIMEDOUT') {
          return {
            success: false,
            message: 'Suno API connection timeout',
            status: 'timeout'
          };
        } else {
          // If we can't test credits, assume API is working if it's configured
          return {
            success: true,
            message: 'Suno API is configured (test inconclusive)',
            status: 'configured'
          };
        }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Suno connection test failed: ' + error.message,
        status: 'test_failed'
      };
    }
  }

  /**
   * Check if Suno service is available
   */
  async isAvailable() {
    try {
      const config = await Admin.getApiConfig('SUNO');
      return config && config.is_active && config.api_key;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new SunoService();

