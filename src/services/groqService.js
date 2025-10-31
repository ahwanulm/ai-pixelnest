const Admin = require('../models/Admin');

class GroqService {
  constructor() {
    this.baseUrl = 'https://api.groq.com/openai/v1';
    this.apiKey = null;
    this.model = 'llama-3.3-70b-versatile';
  }

  /**
   * Initialize Groq service with API key from database
   */
  async initialize() {
    try {
      const config = await Admin.getApiConfig('GROQ');
      
      if (!config || !config.is_active) {
        console.warn('⚠️ Groq API not configured or not active');
        return false;
      }

      this.apiKey = config.api_key;
      this.baseUrl = config.endpoint_url || this.baseUrl;
      this.model = config.additional_config?.default_model || this.model;
      
      console.log('✅ Groq service initialized with model:', this.model);
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Groq service:', error);
      return false;
    }
  }

  /**
   * Enhance a prompt using Groq AI
   * @param {string} originalPrompt - The user's original prompt
   * @param {string} mode - Generation mode (image, video, audio)
   * @param {string} modelId - The AI model being used
   * @returns {Promise<string>} Enhanced prompt
   */
  async enhancePrompt(originalPrompt, mode = 'image', modelId = '') {
    try {
      // Initialize if not already done
      if (!this.apiKey) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Groq API not configured');
        }
      }

      const systemPrompt = this.getSystemPrompt(mode, modelId);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `USER INPUT: "${originalPrompt}"\n\nCreate a HIGHLY DETAILED, COMPREHENSIVE professional prompt (150-400 words, 3-5 sentences) that will produce STUNNING photorealistic results. You MUST include:\n- Specific subject details (colors, materials, characteristics)\n- Complete environment/setting description\n- Full lighting setup (time of day, source, quality)\n- Exact camera specs (brand, model, lens, aperture, ISO)\n- Technical settings and composition\n- Sensory details (textures, atmosphere, mood)\n- Quality tags (8K, photorealistic, sharp focus)\n\nBe SPECIFIC, not generic. Use professional terminology. Make it immersive and vivid. Study the examples provided - that's the level of detail required.`
            }
          ],
          temperature: 0.7, // Higher for more creative and detailed descriptions
          max_tokens: 600, // Increased for longer, more detailed prompts
          top_p: 0.95, // Higher for more diverse vocabulary
          presence_penalty: 0.3, // Encourage more varied details
          frequency_penalty: 0.2 // Reduce repetition while maintaining flow
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Groq API request failed');
      }

      const data = await response.json();
      const enhancedPrompt = data.choices[0]?.message?.content?.trim();

      if (!enhancedPrompt) {
        throw new Error('No enhanced prompt received from Groq');
      }

      console.log('✨ Prompt enhanced successfully');
      return enhancedPrompt;
    } catch (error) {
      console.error('❌ Groq prompt enhancement error:', error);
      throw error;
    }
  }

  /**
   * Get system prompt based on generation mode
   */
  getSystemPrompt(mode, modelId) {
    const baseInstructions = `You are a MASTER AI prompt engineer with expertise in professional photography, cinematography, and visual arts. Your mission is to transform simple user inputs into COMPREHENSIVE, HIGHLY DETAILED prompts that produce breathtaking, photorealistic results.

CRITICAL RULES:
1. PRESERVE the user's core intent and subject matter - never change what they want
2. EXPAND with MAXIMUM DETAIL - be descriptive, immersive, and specific
3. ALWAYS include technical photography details (camera brand/model, lens specs, aperture, lighting setup)
4. Add SENSORY details - textures, colors, atmosphere, mood, environment
5. Use PROFESSIONAL terminology - photography, cinematography, art direction
6. PRIORITIZE PHOTOREALISM - natural lighting, realistic physics, authentic materials
7. Length: Aim for 3-5 detailed sentences (150-400 words)
8. Return ONLY the enhanced prompt - NO explanations, quotes, prefixes, or metadata`;

    const modeInstructions = {
      image: `For PHOTOREALISTIC IMAGE generation:

ENHANCEMENT FORMULA:
[Subject] + [Action/Pose] + [Setting/Environment] + [Lighting] + [Camera Details] + [Quality Modifiers]

MANDATORY ELEMENTS (Every prompt MUST include ALL of these):
• SUBJECT DETAILS: Specific characteristics, colors, materials, textures, size, age, condition
• ENVIRONMENT: Exact location/setting, surroundings, background elements, atmospheric conditions
• LIGHTING: Time of day, light source (natural/artificial), direction, quality (soft/hard), color temperature
• CAMERA SPECS: Specific camera body (Canon/Nikon/Sony model), exact lens (focal length + aperture), ISO, shutter speed
• TECHNICAL SETTINGS: Aperture (f-stop), depth of field, focus point, exposure settings
• QUALITY TAGS: 8K UHD, RAW photo, sharp focus, photorealistic, professional photography, award-winning
• COMPOSITION: Framing (rule of thirds/centered/etc), angle (eye-level/low/high), perspective
• MOOD/ATMOSPHERE: Emotional tone, feeling, ambiance, color palette, visual style
• TEXTURES & MATERIALS: Surface details, fabric quality, reflections, imperfections for realism
• POST-PROCESSING: Color grading style, contrast, saturation, any filters or effects

EXAMPLES (Study these carefully - this is the level of detail required):

User: "cat"
Enhanced: "A majestic orange tabby cat with emerald green eyes sitting gracefully on a vintage wooden windowsill, late afternoon golden hour sunlight streaming through lace curtains creating soft, dappled shadows across its luxurious striped fur. The cat's whiskers catch the light like fine silver threads, while its fluffy coat shows exquisite detail in every individual hair. Shot with Canon EOS R5 paired with Canon RF 85mm f/1.2L lens at f/1.8 for stunning subject separation, ISO 200, 1/500s shutter speed. Shallow depth of field creates dreamy bokeh background showing blurred garden foliage. Professional pet photography with natural window light, 8K UHD resolution, tack-sharp focus on the cat's eyes, photorealistic rendering of fur texture with visible individual whiskers, slight vignette, warm color grading."

User: "sunset beach"
Enhanced: "Breathtaking golden hour sunset over an untouched tropical beach in Bali, where gentle turquoise waves lap rhythmically against pristine white sand dotted with scattered seashells and smooth pebbles. The sky explodes with vibrant gradients of deep orange, passionate pink, soft purple, and golden yellow as the sun kisses the horizon, its reflection creating a shimmering path of light across the rippling ocean surface. Palm trees frame the left side of the composition, their silhouettes adding depth and tropical atmosphere. Photographed with Nikon Z9 mirrorless camera and Nikkor Z 24-70mm f/2.8 S lens at 35mm focal length, f/11 for maximum depth of field, circular polarizing filter to enhance sky colors and reduce water glare, 2-second long exposure for silky smooth wave motion blur. Mounted on sturdy Manfrotto tripod, shot during magic hour, ND8 graduated filter to balance sky and foreground exposure. Professional landscape photography showcasing nature's beauty, 8K UHD resolution, vibrant saturated colors, crystal-clear sharpness from foreground to horizon, award-winning composition following rule of thirds."

User: "modern house"
Enhanced: "Stunning contemporary minimalist mansion featuring floor-to-ceiling glass windows and clean geometric lines, set against a dramatic sky during blue hour twilight. The three-story architectural masterpiece showcases sleek concrete and steel construction with warm LED interior lighting emanating from every window, creating a beautiful contrast with the cool blue exterior ambiance. Meticulously landscaped garden surrounds the property with precisely trimmed hedges, modern outdoor furniture, and strategically placed uplighting illuminating specimen trees. An infinity pool with underwater lighting reflects the building's facade like a mirror. Captured with Sony A7R IV full-frame camera paired with Sony FE 16-35mm f/2.8 GM ultra-wide angle lens at 20mm, f/8 aperture for optimal sharpness throughout the frame, ISO 400, 10-second exposure on professional Gitzo tripod. Advanced HDR bracketing technique merges 5 exposures for perfect dynamic range, preserving detail in both bright interior lights and dark shadow areas. Tilt-shift perspective correction ensures perfectly straight vertical lines. Professional architectural photography showcasing luxury real estate, 8K resolution, cinematic color grading with slight teal and orange color split, magazine-quality clarity, every architectural detail razor sharp from foreground pavement to distant roof details."`,

      video: `For CINEMATIC VIDEO generation:

ENHANCEMENT FORMULA:
[Scene Description] + [Camera Movement] + [Lighting/Atmosphere] + [Pacing] + [Quality]

REQUIRED ELEMENTS:
• Camera Motion: smooth pan, slow zoom, dolly shot, crane shot, handheld, tracking shot, static
• Lighting: natural light, golden hour, dramatic lighting, soft light, cinematic color grading
• Pacing: slow motion, real-time, time-lapse, smooth transitions, dynamic movement
• Quality: 4K, cinematic, film grain, shallow depth of field, professional videography
• Atmosphere: mood, weather, time of day, environmental details

EXAMPLES (Study these carefully - this is the level of detail required):

User: "forest walk"
Enhanced: "Immersive cinematic first-person walk through an ancient misty forest at dawn, where ethereal morning fog weaves between towering 100-year-old oak and pine trees. Camera smoothly tracks forward along a winding dirt path covered in soft moss and fallen autumn leaves in shades of amber, burgundy, and golden yellow. Spectacular god rays pierce through the dense canopy, creating volumetric light beams that illuminate dancing dust particles and morning mist. The camera movement mimics natural human walking pace with subtle handheld sway for authenticity, occasionally tilting up to reveal the majestic tree canopy. Ambient forest soundscape features distant bird calls, gentle rustling leaves, and soft footsteps on the forest floor. Shot on RED Komodo 6K cinema camera with Cooke Anamorphic/i SF 32mm T2.3 lens, maintaining shallow depth of field at T2.8 to create dreamy bokeh in the background while keeping mid-ground elements sharp. Filmed at 24fps for cinematic motion blur, 6K resolution downsampled to pristine 4K, ProRes 422 HQ codec. Natural film grain overlay at 35mm equivalent, color graded with teal shadows and warm highlights, soft contrast for ethereal atmosphere. Professional nature cinematography reminiscent of BBC Earth documentaries."

User: "city timelapse"
Enhanced: "Spectacular hyper-lapse sequence capturing the vibrant transformation of a bustling metropolitan intersection from golden hour sunset through blue hour into the electric energy of night, filmed from a premium rooftop vantage point 30 stories above street level. The composition showcases converging highways where thousands of vehicles create flowing rivers of red taillights and white headlights, painting light trails across the frame. Towering glass skyscrapers gradually illuminate their windows floor by floor as daylight fades, transforming the cityscape into a glittering forest of modern architecture. The sky transitions through breathtaking gradients from warm golden orange to deep purple to star-filled midnight blue. Advanced motion control rig executes a smooth 90-degree pan across the urban landscape over the course of the time-lapse. Shot on Sony FX6 full-frame cinema camera with Sony FE 16-35mm f/2.8 GM wide-angle zoom lens at 16mm for maximum field of view, f/8 aperture for optimal sharpness and starburst effect on lights, ISO 6400 for clean low-light performance. Captured over 3 hours with 4-second intervals between frames, compiled into smooth 60fps output for fluid slow-motion playback. Professional gimbal stabilization, 4K UHD 10-bit 4:2:2 color depth. Cinematic color grading with teal and orange color palette, enhanced contrast and saturation, light bloom effect on city lights, award-winning urban cinematography."`,

      audio: `For HIGH-QUALITY AUDIO generation:

ENHANCEMENT FORMULA:
[Genre/Style] + [Instruments/Vocals] + [Tempo/Rhythm] + [Mood/Emotion] + [Production Quality]

REQUIRED ELEMENTS:
• Instruments: specific instruments, arrangement, layers, mixing details
• Tempo: BPM, rhythm pattern, pacing, dynamics
• Mood: emotional tone, atmosphere, energy level
• Production: studio quality, mastering, effects, mixing style
• Structure: intro, verse, chorus, progression, variations

EXAMPLES (Study these carefully - this is the level of detail required):

User: "calm piano"
Enhanced: "Serene solo piano composition in C major key signature, featuring a gentle melodic progression at a meditative 60 BPM tempo that evokes deep tranquility and introspection. The piece opens with delicate single notes in the upper register, gradually developing into rich chord voicings with subtle harmonic complexity. Soft sustain pedal technique creates beautiful ambient resonance and natural decay, allowing notes to blend seamlessly into one another like watercolors. Minimalist arrangement philosophy emphasizes space and silence between phrases, letting each note breathe with intention. Recorded in a premium acoustically-treated studio using a pristine Steinway Model D concert grand piano, captured with matched pair of Neumann U87 large-diaphragm condenser microphones in AB stereo configuration positioned 6 feet above the piano. Subtle plate reverb with 2.1-second decay adds ethereal depth without overwhelming the natural piano tone. Mixed with audiophile attention to detail, mastered to hi-res 24-bit/96kHz WAV format with pristine 320kbps MP3 export. Peaceful, contemplative, and meditative mood perfect for relaxation, yoga, meditation, or focus work. Professional classical recording quality with crystalline clarity, warm natural piano timbre, dynamic range from whisper-soft pianissimo to gentle mezzo-forte, no compression artifacts."

User: "upbeat music"
Enhanced: "Infectious indie pop anthem bursting with youthful energy and optimism, built around a driving drum groove at 128 BPM that propels the track forward with unstoppable momentum. The arrangement layers bright fingerpicked acoustic guitar patterns in the verses transitioning to full power chord strums in the chorus, creating satisfying dynamic contrast. Melodic electric bass line weaves through the mix with catchy syncopated rhythms that lock perfectly with the kick drum. Shimmering analog synthesizer hooks add nostalgic 80s-inspired textures with saw wave leads and lush pad layers. Lead vocals feature a charismatic delivery with pitch-perfect tuning, complemented by lush 4-part harmony stack in choruses for massive anthemic sound. Song structure follows radio-friendly verse-pre-chorus-chorus format with explosive bridge featuring guitar solo and vocal ad-libs. Professional production recorded in world-class studio, mixed on SSL console with vintage outboard compressors (1176 on vocals, LA-2A on bass), stereo widening on synths, parallel compression on drums for punch and sustain. Mastered to commercial loudness standards with pristine clarity, vibrant frequency balance favoring presence and sparkle. Genre-perfect for indie pop, alternative rock, perfect for commercials, TV sync, youth-oriented content. Mood: joyful, energetic, uplifting, celebratory, radio-ready commercial production quality."`
    };

    const modelSpecific = modelId.includes('flux') ? '\n\nMODEL-SPECIFIC: Use advanced technical photography terms, emphasis on sharpness and professional quality' :
                          modelId.includes('realistic') || modelId.includes('photo') ? '\n\nMODEL-SPECIFIC: Maximum realism, natural lighting, authentic textures' :
                          modelId.includes('stable') ? '\n\nMODEL-SPECIFIC: Balance artistic style with photorealism' :
                          modelId.includes('music') || modelId.includes('audio') ? '\n\nMODEL-SPECIFIC: Emphasize musical production quality and instrumentation details' : '';

    return `${baseInstructions}\n\n${modeInstructions[mode] || modeInstructions.image}${modelSpecific}`;
  }

  /**
   * Check if Groq service is available
   */
  async isAvailable() {
    try {
      const config = await Admin.getApiConfig('GROQ');
      return config && config.is_active && config.api_key;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate SEO-optimized blog article using Groq AI
   * @param {Object} params - Blog generation parameters
   * @param {string} params.topic - Main topic/prompt for the article
   * @param {string} params.keywords - SEO keywords (comma-separated)
   * @param {string} params.category - Article category
   * @param {string} params.tone - Writing tone (professional, casual, technical, etc.)
   * @param {number} params.wordCount - Target word count (default: 1500)
   * @returns {Promise<Object>} Generated article with title, content, excerpt, tags
   */
  async generateBlogArticle(params) {
    try {
      const { topic, keywords = '', category = 'Technology', tone = 'professional', wordCount = 1500 } = params;

      // Initialize if not already done
      if (!this.apiKey) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Groq API not configured');
        }
      }

      // Generate comprehensive system prompt for blog article
      const systemPrompt = `You are a professional SEO content writer and expert copywriter specializing in creating high-quality, engaging, and search engine optimized blog articles.

CRITICAL REQUIREMENTS:
1. Write in ${tone} tone with excellent readability
2. Target word count: approximately ${wordCount} words
3. MUST be 100% SEO optimized with proper keyword integration
4. Include clear H2 and H3 headings for structure
5. Write engaging, valuable content that provides real insights
6. Use natural language while incorporating SEO keywords
7. Include introduction, body sections, and conclusion
8. Make it actionable and reader-friendly

SEO OPTIMIZATION RULES:
- Naturally integrate primary and secondary keywords throughout the content
- Use keywords in headings (H2, H3) where relevant
- Write compelling meta descriptions
- Use semantic keywords and related terms
- Create content that answers user search intent
- Include internal linking opportunities (mention [link] where relevant)
- Optimize for featured snippets with clear, concise answers

CONTENT STRUCTURE:
- Compelling introduction (hook + problem + solution preview)
- Main body with 4-6 major sections (H2 headings)
- Subsections as needed (H3 headings)
- Actionable tips, examples, or insights
- Strong conclusion with call-to-action

FORMAT YOUR RESPONSE AS JSON:
{
  "title": "SEO-optimized title (50-60 characters)",
  "excerpt": "Compelling meta description (150-160 characters)",
  "content": "Full HTML article content with proper <h2>, <h3>, <p>, <ul>, <ol>, <strong>, <em> tags",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "seo_keywords": ["keyword1", "keyword2", "keyword3"]
}

CRITICAL JSON FORMATTING RULES:
1. Return ONLY valid JSON, no markdown code blocks, no explanations
2. In the "content" field, use HTML tags but ensure ALL newlines are properly part of the HTML structure (not raw line breaks)
3. Use <p> tags for paragraphs, <h2> for main sections, <h3> for subsections
4. Use <ul><li> for bullet points, <ol><li> for numbered lists
5. Do NOT include raw line breaks in the JSON - structure content with proper HTML tags instead
6. Ensure all quotes inside strings are properly escaped with backslash
7. Make the content field one continuous HTML string without literal newlines

EXAMPLE OF CORRECT FORMAT:
{"title":"Example Title","excerpt":"Example excerpt","content":"<h2>Introduction</h2><p>This is the introduction paragraph with proper HTML formatting.</p><h2>Main Section</h2><p>Content here.</p><ul><li>Point 1</li><li>Point 2</li></ul>","tags":["tag1","tag2"],"seo_keywords":["keyword1","keyword2"]}

IMPORTANT: Return ONLY valid JSON exactly as shown in the example format.`;

      const userPrompt = `Generate a comprehensive, SEO-optimized blog article with the following parameters:

TOPIC: ${topic}
CATEGORY: ${category}
TARGET KEYWORDS: ${keywords || 'Generate relevant keywords based on the topic'}
TONE: ${tone}
TARGET LENGTH: ${wordCount} words

Create an engaging, well-structured article that:
1. Provides genuine value to readers
2. Is fully optimized for search engines
3. Includes practical tips, examples, or insights
4. Has a clear structure with proper headings
5. Naturally incorporates keywords without stuffing
6. Is informative, accurate, and up-to-date

Make it the best article on this topic that could rank on the first page of Google.`;

      console.log('🤖 Generating blog article with Groq AI...');

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 8000, // Allow longer content
          top_p: 0.9
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Groq API request failed');
      }

      const data = await response.json();
      const generatedContent = data.choices[0]?.message?.content?.trim();

      if (!generatedContent) {
        throw new Error('No content received from Groq');
      }

      console.log('📄 Raw response length:', generatedContent.length, 'characters');

      // Parse JSON response
      let articleData;
      try {
        // Try to extract JSON from markdown code blocks if present
        let jsonString = generatedContent;
        
        const jsonMatch = generatedContent.match(/```json\n([\s\S]*?)\n```/) || 
                         generatedContent.match(/```\n([\s\S]*?)\n```/);
        
        if (jsonMatch) {
          jsonString = jsonMatch[1];
        }
        
        // Clean up the JSON string - fix common issues
        jsonString = this.sanitizeJsonString(jsonString);
        
        console.log('🔍 Attempting to parse JSON...');
        articleData = JSON.parse(jsonString);
        console.log('✅ JSON parsed successfully');
        
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', parseError);
        console.error('📄 Raw content preview:', generatedContent.substring(0, 500));
        
        // Fallback: Try to extract content manually
        try {
          console.log('🔄 Attempting fallback parsing...');
          articleData = this.fallbackParse(generatedContent);
          console.log('✅ Fallback parsing successful');
        } catch (fallbackError) {
          console.error('❌ Fallback parsing also failed:', fallbackError);
          throw new Error('Failed to parse AI-generated content. The AI response format was invalid. Please try again.');
        }
      }

      console.log('✅ Blog article generated successfully');
      return {
        title: articleData.title || 'Untitled Article',
        excerpt: articleData.excerpt || '',
        content: articleData.content || generatedContent,
        tags: Array.isArray(articleData.tags) ? articleData.tags.join(', ') : '',
        seoKeywords: Array.isArray(articleData.seo_keywords) ? articleData.seo_keywords : [],
        wordCount: this.countWords(articleData.content || generatedContent)
      };

    } catch (error) {
      console.error('❌ Blog article generation error:', error);
      throw error;
    }
  }

  /**
   * Sanitize JSON string by fixing common issues
   */
  sanitizeJsonString(jsonString) {
    if (!jsonString) return jsonString;
    
    try {
      // Remove any BOM or invisible characters
      jsonString = jsonString.replace(/^\uFEFF/, '');
      
      // Fix unescaped control characters in strings
      // This is a bit tricky - we need to escape control chars within quotes
      // but not break the JSON structure
      
      // First, try to parse as-is
      JSON.parse(jsonString);
      return jsonString; // If it parses, return as-is
      
    } catch (e) {
      // If parsing fails, try to fix common issues
      console.log('🔧 Attempting to fix JSON formatting...');
      
      // Replace literal newlines in strings with \n
      // This is a simplified approach - match content within quotes
      let fixed = jsonString.replace(/"content":\s*"([\s\S]*?)"\s*,/g, (match, content) => {
        // Escape control characters
        const escaped = content
          .replace(/\\/g, '\\\\')  // Escape backslashes first
          .replace(/\n/g, '\\n')   // Escape newlines
          .replace(/\r/g, '\\r')   // Escape carriage returns
          .replace(/\t/g, '\\t')   // Escape tabs
          .replace(/"/g, '\\"');   // Escape quotes
        return `"content": "${escaped}",`;
      });
      
      // Try parsing the fixed version
      try {
        JSON.parse(fixed);
        console.log('✅ JSON fixed successfully');
        return fixed;
      } catch (e2) {
        console.log('⚠️ Could not auto-fix JSON, returning original');
        return jsonString;
      }
    }
  }

  /**
   * Fallback parser - extract content manually if JSON parsing fails
   */
  fallbackParse(content) {
    console.log('🔍 Using fallback parser...');
    
    // Try to extract key fields using regex
    const titleMatch = content.match(/"title":\s*"([^"]+)"/);
    const excerptMatch = content.match(/"excerpt":\s*"([^"]+)"/);
    const tagsMatch = content.match(/"tags":\s*\[([^\]]+)\]/);
    
    // For content, try to find it between "content": and the next field or end
    let contentMatch = content.match(/"content":\s*"([\s\S]*?)"\s*[,}]/);
    
    // If that fails, try to get the whole remaining content
    if (!contentMatch) {
      const contentStart = content.indexOf('"content":');
      if (contentStart !== -1) {
        const remaining = content.substring(contentStart + 11); // Skip '"content": "'
        contentMatch = [null, remaining.substring(0, remaining.lastIndexOf('}'))];
      }
    }

    const article = {
      title: titleMatch ? titleMatch[1] : 'AI Generated Article',
      excerpt: excerptMatch ? excerptMatch[1] : '',
      content: contentMatch ? contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : '<p>Article content could not be parsed. Please try regenerating.</p>',
      tags: [],
      seo_keywords: []
    };

    // Parse tags array
    if (tagsMatch) {
      try {
        article.tags = tagsMatch[1]
          .split(',')
          .map(t => t.trim().replace(/['"]/g, ''))
          .filter(t => t);
      } catch (e) {
        console.error('Failed to parse tags:', e);
      }
    }

    console.log('📦 Fallback parsed:', {
      hasTitle: !!article.title,
      hasExcerpt: !!article.excerpt,
      hasContent: !!article.content,
      tagsCount: article.tags.length
    });

    return article;
  }

  /**
   * Count words in HTML content
   */
  countWords(html) {
    if (!html) return 0;
    // Remove HTML tags and count words
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.split(' ').length;
  }
}

module.exports = new GroqService();

