const FalAiService = require('../services/falAiService');
const { pool } = require('../config/database');

// Generate Audio (TTS, Music, SFX)
exports.generateAudio = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, prompt, model, duration } = req.body;

        console.log('🎵 Audio generation request:', { type, model, duration });

        // Validate inputs
        if (!type || !prompt || !model) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: type, prompt, or model'
            });
        }

        // Validate type
        const validTypes = ['tts', 'music', 'sfx'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid audio type. Must be: tts, music, or sfx'
            });
        }

        // Get model info from database
        const modelResult = await pool.query(
            `SELECT id, model_id, name, cost, fal_price, pricing_type, type
             FROM ai_models 
             WHERE model_id = $1 AND type = 'audio' AND is_active = true
             LIMIT 1`,
            [model]
        );

        if (modelResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Model not found or not active'
            });
        }

        const modelData = modelResult.rows[0];

        // Calculate cost
        let cost = parseFloat(modelData.cost);
        
        // For per-second pricing, modelData.cost is already credits/second (from admin)
        // Simply multiply by actual duration
        if (modelData.pricing_type === 'per_second' && duration) {
            const creditsPerSecond = cost;
            cost = creditsPerSecond * parseInt(duration);
            console.log(`🎵 Audio cost (per-second): ${creditsPerSecond} cr/s × ${duration}s = ${cost} cr`);
        }

        // Check user credits
        const userResult = await pool.query(
            'SELECT credits FROM users WHERE id = $1',
            [userId]
        );

        const userCredits = parseFloat(userResult.rows[0].credits);

        if (userCredits < cost) {
            return res.status(400).json({
                success: false,
                message: `Insufficient credits. Required: ${cost}, Available: ${userCredits}`
            });
        }

        // Deduct credits
        await pool.query(
            'UPDATE users SET credits = credits - $1 WHERE id = $2',
            [cost, userId]
        );

        // Generate audio based on type
        let result;
        try {
            if (type === 'tts') {
                result = await FalAiService.generateTextToSpeech({
                    prompt,
                    model: modelData.model_id,
                    duration
                });
            } else if (type === 'music') {
                result = await FalAiService.generateMusic({
                    prompt,
                    model: modelData.model_id,
                    duration
                });
            } else if (type === 'sfx') {
                result = await FalAiService.generateSoundEffect({
                    prompt,
                    model: modelData.model_id,
                    duration
                });
            }
        } catch (error) {
            // Refund credits on failure
            await pool.query(
                'UPDATE users SET credits = credits + $1 WHERE id = $2',
                [cost, userId]
            );
            throw error;
        }

        // Extract audio URL (should already be normalized by service)
        const audioUrl = result.audio_url || 
                        result.url || 
                        result.audio?.url || 
                        result.output?.audio_url ||
                        result.output?.url;
        
        if (!audioUrl) {
            throw new Error('No audio URL in generation result');
        }

        // Save to history
        await pool.query(
            `INSERT INTO ai_generation_history 
             (user_id, type, generation_type, model_name, prompt, result_url, cost_credits, metadata)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                userId,
                'audio',
                type,
                modelData.name,
                prompt,
                audioUrl,
                cost,
                JSON.stringify({
                    duration: duration || result.duration,
                    model_id: modelData.model_id
                })
            ]
        );

        // Get updated credits
        const updatedUser = await pool.query(
            'SELECT credits FROM users WHERE id = $1',
            [userId]
        );

        console.log('✅ Audio generated successfully');

        res.json({
            success: true,
            message: 'Audio generated successfully',
            audio: {
                url: audioUrl,
                duration: duration || result.duration,
                prompt: prompt,
                model: modelData.name,
                filename: `audio_${Date.now()}.mp3`
            },
            remainingCredits: parseFloat(updatedUser.rows[0].credits),
            costCredits: parseFloat(cost)
        });

    } catch (error) {
        console.error('❌ Audio generation error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate audio'
        });
    }
};

// Transcribe Audio (Speech-to-Text)
exports.transcribeAudio = async (req, res) => {
    try {
        const userId = req.user.id;
        const { language } = req.body;
        const audioFile = req.file;

        console.log('📝 Transcription request:', { language, fileSize: audioFile?.size });

        if (!audioFile) {
            return res.status(400).json({
                success: false,
                message: 'No audio file uploaded'
            });
        }

        // Get Whisper model from database
        const modelResult = await pool.query(
            `SELECT id, model_id, name, cost, fal_price, pricing_type
             FROM ai_models 
             WHERE model_id LIKE '%whisper%' AND type = 'audio' AND is_active = true
             LIMIT 1`
        );

        if (modelResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Whisper model not available'
            });
        }

        const modelData = modelResult.rows[0];

        // Calculate cost (based on audio duration or flat rate)
        const cost = modelData.cost || 1;

        // Check user credits
        const userResult = await pool.query(
            'SELECT credits FROM users WHERE id = $1',
            [userId]
        );

        const userCredits = parseFloat(userResult.rows[0].credits);

        if (userCredits < cost) {
            return res.status(400).json({
                success: false,
                message: `Insufficient credits. Required: ${cost}, Available: ${userCredits}`
            });
        }

        // Deduct credits
        await pool.query(
            'UPDATE users SET credits = credits - $1 WHERE id = $2',
            [cost, userId]
        );

        // Transcribe audio
        let result;
        try {
            result = await FalAiService.transcribeAudio({
                audioBuffer: audioFile.buffer,
                audioMimetype: audioFile.mimetype,
                audioOriginalName: audioFile.originalname,
                language: language || 'auto'
            });
        } catch (error) {
            // Refund credits on failure
            await pool.query(
                'UPDATE users SET credits = credits + $1 WHERE id = $2',
                [cost, userId]
            );
            throw error;
        }

        // Save to history
        await pool.query(
            `INSERT INTO ai_generation_history 
             (user_id, type, generation_type, model_name, prompt, result_url, cost_credits, metadata)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                userId,
                'audio',
                'speech-to-text',
                modelData.name,
                'Audio transcription',
                null,
                cost,
                JSON.stringify({
                    language: language || 'auto',
                    filename: audioFile.originalname,
                    text: result.text.substring(0, 200) // Store first 200 chars in metadata
                })
            ]
        );

        // Get updated credits
        const updatedUser = await pool.query(
            'SELECT credits FROM users WHERE id = $1',
            [userId]
        );

        console.log('✅ Audio transcribed successfully');

        res.json({
            success: true,
            message: 'Audio transcribed successfully',
            transcription: {
                text: result.text,
                language: result.language || language,
                duration: result.duration
            },
            remainingCredits: parseFloat(updatedUser.rows[0].credits),
            costCredits: parseFloat(cost)
        });

    } catch (error) {
        console.error('❌ Transcription error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to transcribe audio'
        });
    }
};

// Get Audio Generation History
exports.getHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 20;

        const result = await pool.query(
            `SELECT 
                id,
                generation_type,
                model_name,
                prompt,
                result_url,
                cost_credits,
                metadata,
                created_at
             FROM ai_generation_history
             WHERE user_id = $1 AND type = 'audio'
             ORDER BY created_at DESC
             LIMIT $2`,
            [userId, limit]
        );

        const history = result.rows.map(row => ({
            id: row.id,
            type: row.generation_type,
            model: row.model_name,
            prompt: row.prompt,
            url: row.result_url,
            cost: parseFloat(row.cost_credits),
            timestamp: row.created_at,
            duration: row.metadata?.duration
        }));

        res.json({
            success: true,
            history
        });

    } catch (error) {
        console.error('❌ Error fetching history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch history'
        });
    }
};

// Get Audio Statistics
exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT 
                COUNT(*) as total_audio,
                COALESCE(SUM(cost_credits), 0) as total_cost,
                COUNT(CASE WHEN generation_type = 'tts' THEN 1 END) as tts_count,
                COUNT(CASE WHEN generation_type = 'music' THEN 1 END) as music_count,
                COUNT(CASE WHEN generation_type = 'sfx' THEN 1 END) as sfx_count,
                COUNT(CASE WHEN generation_type = 'speech-to-text' THEN 1 END) as stt_count
             FROM ai_generation_history
             WHERE user_id = $1 AND type = 'audio'`,
            [userId]
        );

        const stats = {
            totalAudio: parseInt(result.rows[0].total_audio) || 0,
            totalCost: parseFloat(result.rows[0].total_cost) || 0,
            ttsCount: parseInt(result.rows[0].tts_count) || 0,
            musicCount: parseInt(result.rows[0].music_count) || 0,
            sfxCount: parseInt(result.rows[0].sfx_count) || 0,
            sttCount: parseInt(result.rows[0].stt_count) || 0
        };

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('❌ Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stats'
        });
    }
};

