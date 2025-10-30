#!/usr/bin/env node

/**
 * Fix Audio Models Category
 * 
 * This script normalizes audio model categories to standard format
 * and ensures correct models are available
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixAudioCategories() {
  console.log('🔧 Fixing Audio Model Categories...\n');
  
  try {
    // 1. Get all audio models
    const current = await pool.query(`
      SELECT model_id, name, category, type, status 
      FROM ai_models 
      WHERE type = 'audio'
      ORDER BY model_id
    `);
    
    console.log('📋 Current Audio Models:\n');
    console.table(current.rows);
    console.log('');
    
    // 2. Fix MusicGen and similar models
    console.log('1️⃣  Normalizing Text-to-Music models...');
    const musicResult = await pool.query(`
      UPDATE ai_models 
      SET 
        category = 'Text-to-Music',
        status = CASE WHEN status = 'inactive' THEN 'active' ELSE status END
      WHERE type = 'audio' 
        AND (
          model_id LIKE '%musicgen%' 
          OR model_id LIKE '%music%'
          OR LOWER(category) LIKE '%music%'
          OR LOWER(name) LIKE '%music%'
        )
      RETURNING model_id, name, category
    `);
    
    if (musicResult.rowCount > 0) {
      console.log(`   ✅ Updated ${musicResult.rowCount} music model(s):`);
      musicResult.rows.forEach(r => console.log(`      - ${r.model_id} → ${r.category}`));
    } else {
      console.log('   ℹ️  No music models found to update');
    }
    console.log('');
    
    // 3. Fix Bark and SFX models
    console.log('2️⃣  Normalizing Text-to-Audio models...');
    const audioResult = await pool.query(`
      UPDATE ai_models 
      SET 
        category = 'Text-to-Audio',
        status = CASE WHEN status = 'inactive' THEN 'active' ELSE status END
      WHERE type = 'audio' 
        AND (
          model_id LIKE '%bark%'
          OR model_id LIKE '%audiocraft%'
          OR model_id LIKE '%stable-audio%'
          OR LOWER(category) LIKE '%audio%'
          OR LOWER(category) LIKE '%sfx%'
          OR LOWER(category) LIKE '%sound%'
        )
        AND model_id NOT LIKE '%whisper%'
      RETURNING model_id, name, category
    `);
    
    if (audioResult.rowCount > 0) {
      console.log(`   ✅ Updated ${audioResult.rowCount} audio model(s):`);
      audioResult.rows.forEach(r => console.log(`      - ${r.model_id} → ${r.category}`));
    } else {
      console.log('   ℹ️  No audio models found to update');
    }
    console.log('');
    
    // 4. Fix TTS models
    console.log('3️⃣  Normalizing Text-to-Speech models...');
    const ttsResult = await pool.query(`
      UPDATE ai_models 
      SET 
        category = 'Text-to-Speech',
        status = CASE WHEN status = 'inactive' THEN 'active' ELSE status END
      WHERE type = 'audio' 
        AND (
          model_id LIKE '%elevenlabs%'
          OR model_id LIKE '%parler%'
          OR model_id LIKE '%tts%'
          OR LOWER(category) LIKE '%speech%'
          OR LOWER(category) LIKE '%tts%'
          OR LOWER(category) LIKE '%voice%'
        )
        AND model_id NOT LIKE '%whisper%'
      RETURNING model_id, name, category
    `);
    
    if (ttsResult.rowCount > 0) {
      console.log(`   ✅ Updated ${ttsResult.rowCount} TTS model(s):`);
      ttsResult.rows.forEach(r => console.log(`      - ${r.model_id} → ${r.category}`));
    } else {
      console.log('   ℹ️  No TTS models found to update');
    }
    console.log('');
    
    // 5. Fix Whisper (transcription only)
    console.log('4️⃣  Marking Whisper as Speech-to-Text (transcription)...');
    const whisperResult = await pool.query(`
      UPDATE ai_models 
      SET 
        category = 'Speech-to-Text',
        description = 'Audio transcription (Speech-to-Text). NOT for audio generation!',
        status = 'inactive'
      WHERE model_id LIKE '%whisper%'
      RETURNING model_id, name, category, status
    `);
    
    if (whisperResult.rowCount > 0) {
      console.log(`   ✅ Updated ${whisperResult.rowCount} Whisper model(s):`);
      whisperResult.rows.forEach(r => console.log(`      - ${r.model_id} → ${r.category} (${r.status})`));
    } else {
      console.log('   ℹ️  No Whisper models found');
    }
    console.log('');
    
    // 6. Ensure default models exist
    console.log('5️⃣  Ensuring default models exist...');
    
    // Add Bark if not exists
    await pool.query(`
      INSERT INTO ai_models (
        model_id, name, provider, category, type, 
        speed, quality, cost, pricing_type, max_duration, 
        status, description, is_default
      ) VALUES (
        'fal-ai/bark',
        'Bark Text-to-Audio',
        'Suno AI',
        'Text-to-Audio',
        'audio',
        'fast',
        'good',
        50,
        'flat',
        30,
        'active',
        'Generate sound effects and audio from text descriptions',
        true
      ) ON CONFLICT (model_id) DO UPDATE SET
        category = 'Text-to-Audio',
        status = 'active',
        is_default = true
    `);
    console.log('   ✅ Bark ensured');
    
    // Add MusicGen if not exists
    await pool.query(`
      INSERT INTO ai_models (
        model_id, name, provider, category, type, 
        speed, quality, cost, pricing_type, max_duration, 
        status, description, is_default
      ) VALUES (
        'fal-ai/musicgen',
        'MusicGen',
        'Meta',
        'Text-to-Music',
        'audio',
        'medium',
        'excellent',
        100,
        'per_second',
        240,
        'active',
        'Generate music from text descriptions with advanced options',
        true
      ) ON CONFLICT (model_id) DO UPDATE SET
        category = 'Text-to-Music',
        status = 'active',
        is_default = true
    `);
    console.log('   ✅ MusicGen ensured');
    console.log('');
    
    // 7. Show final state
    console.log('📊 Final Audio Models State:\n');
    const final = await pool.query(`
      SELECT 
        model_id, 
        name, 
        category, 
        status,
        is_default,
        CASE WHEN is_default THEN '⭐' ELSE '' END as default_mark
      FROM ai_models 
      WHERE type = 'audio'
      ORDER BY category, name
    `);
    
    console.table(final.rows);
    
    // Group by category
    const grouped = {};
    final.rows.forEach(r => {
      if (!grouped[r.category]) grouped[r.category] = [];
      grouped[r.category].push(r.name);
    });
    
    console.log('\n📋 Models by Category:\n');
    Object.entries(grouped).forEach(([cat, models]) => {
      console.log(`   ${cat}:`);
      models.forEach(m => console.log(`      - ${m}`));
    });
    
    console.log('\n✅ Audio model categories fixed successfully!');
    console.log('\n📌 Next steps:');
    console.log('   1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)');
    console.log('   2. Refresh dashboard');
    console.log('   3. Go to Audio tab');
    console.log('   4. Select "Text-to-Music" - models should appear! 🎵\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run
fixAudioCategories();

