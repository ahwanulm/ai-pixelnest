const express = require('express');
const router = express.Router();
const musicController = require('../controllers/musicController');
const { ensureAuthenticated } = require('../middleware/auth');

// Callback endpoint - NO auth required (called by Suno API)
router.post('/callback/suno', async (req, res) => {
  try {
    console.log('📥 Suno callback received:', JSON.stringify(req.body, null, 2));
    
    const { code, msg, data } = req.body;
    
    // Acknowledge receipt immediately
    res.status(200).json({ 
      success: true, 
      message: 'Callback received',
      timestamp: new Date().toISOString()
    });
    
    // Process callback asynchronously (don't await, already sent response)
    setImmediate(async () => {
      if (code === 200 && data) {
        const { callbackType, task_id, data: tracks } = data;
        
        console.log(`📦 Processing callback:`);
        console.log(`   Type: ${callbackType}`);
        console.log(`   Task ID: ${task_id}`);
        console.log(`   Tracks: ${tracks?.length || 0}`);
        
        if (callbackType === 'complete' && Array.isArray(tracks)) {
        // Update database with completed tracks
        const { pool } = require('../config/database');
        
        // Find the original generation record first
        const findQuery = `
          SELECT id, user_id, prompt, model_id, model_name, credits_used, settings, sub_type 
          FROM ai_generation_history 
          WHERE metadata::text LIKE $1
          AND status = 'processing'
          ORDER BY created_at DESC
          LIMIT 1
        `;
        
        try {
          const findResult = await pool.query(findQuery, [`%${task_id}%`]);
          
          console.log(`   🔍 Search result: Found ${findResult.rows.length} matching generation(s)`);
          
          if (findResult.rows.length > 0) {
            const originalGen = findResult.rows[0];
            console.log(`   📝 Found original generation ID: ${originalGen.id}`);
            console.log(`   🎵 Processing ${tracks.length} track(s) from Suno`);
            
            // For each track, create or update a generation record
            for (let i = 0; i < tracks.length; i++) {
              const track = tracks[i];
              
              try {
                if (i === 0) {
                  // Update the first record (original)
                  const updateQuery = `
                    UPDATE ai_generation_history 
                    SET 
                      result_url = $1,
                      metadata = $2,
                      status = 'completed',
                      completed_at = NOW()
                    WHERE id = $3
                  `;
                  
                  await pool.query(updateQuery, [
                    track.audio_url,
                    JSON.stringify({ 
                      track, 
                      all_tracks: tracks, 
                      suno_track_id: track.id,
                      track_index: i + 1,
                      total_tracks: tracks.length
                    }),
                    originalGen.id
                  ]);
                  
                  console.log(`   ✅ Updated original generation ${originalGen.id} with track ${i + 1}/${tracks.length}`);
                } else {
                  // Create a new record for additional tracks
                  const insertQuery = `
                    INSERT INTO ai_generation_history 
                    (user_id, model_id, model_name, prompt, result_url, result_data, metadata, status, credits_used, generation_type, sub_type, completed_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
                    RETURNING id
                  `;
                  
                  const insertResult = await pool.query(insertQuery, [
                    originalGen.user_id,
                    originalGen.model_id,
                    originalGen.model_name,
                    originalGen.prompt,
                    track.audio_url,
                    null, // result_data
                    JSON.stringify({ 
                      track, 
                      all_tracks: tracks,
                      suno_track_id: track.id,
                      track_index: i + 1,
                      total_tracks: tracks.length,
                      task_id: task_id
                    }),
                    'completed',
                    0, // No additional credits charged for extra tracks
                    'audio',
                    originalGen.sub_type || 'text-to-music'
                  ]);
                  
                  console.log(`   ✅ Created new generation ${insertResult.rows[0].id} for track ${i + 1}/${tracks.length}`);
                }
              } catch (trackError) {
                console.error(`   ❌ Error processing track ${i + 1}:`, trackError.message);
              }
            }
          } else {
            console.warn(`   ⚠️ No matching generation found for task_id: ${task_id}`);
            console.warn(`   Search pattern: %${task_id}%`);
          }
        } catch (dbError) {
          console.error(`   ❌ DB error:`, dbError);
          console.error(`   Error details:`, dbError.message);
        }
      } else {
        console.warn(`   ⚠️ Callback not complete or no tracks`);
        console.warn(`   Type: ${callbackType}, Tracks: ${Array.isArray(tracks)}`);
      }
    } else {
      console.warn(`   ⚠️ Invalid callback data`);
      console.warn(`   Code: ${code}, Has data: ${!!data}`);
    }
    });
    
  } catch (error) {
    console.error('❌ Callback error:', error);
    // Don't send error response as we already sent 200
  }
});

// All other music routes require authentication
router.use(ensureAuthenticated);

// Render music generation page
router.get('/', musicController.renderMusicPage);

// Render lyrics generation page
router.get('/lyrics', musicController.renderLyricsPage);

// Render music extension page
router.get('/extend', musicController.renderExtendPage);

// Generate music from text
router.post('/generate', musicController.generateMusic);

// Generate lyrics from text
router.post('/generate-lyrics', musicController.generateLyrics);

// Get music generation details
router.get('/details/:taskId', musicController.getMusicDetails);

// Extend music track
router.post('/extend', musicController.extendMusic);

// Get Suno API credits
router.get('/credits', musicController.getSunoCredits);

module.exports = router;

