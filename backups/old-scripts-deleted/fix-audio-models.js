#!/usr/bin/env node

/**
 * Quick Fix: Add Correct Audio Models
 * 
 * This script adds the correct models for audio generation:
 * - fal-ai/bark (Text-to-Audio/SFX)
 * - fal-ai/musicgen (Text-to-Music)
 * 
 * And disables fal-ai/whisper for generation (it's for transcription only)
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixAudioModels() {
  console.log('🔧 Fixing Audio Models...\n');
  
  try {
    // 1. Add/Update Bark (Text-to-Audio)
    console.log('1️⃣  Adding/Updating Bark (Text-to-Audio)...');
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
        'Generate sound effects and audio from text descriptions. Supports category, quality, and ambience options.',
        true
      ) ON CONFLICT (model_id) DO UPDATE SET
        category = 'Text-to-Audio',
        status = 'active',
        is_default = true,
        description = 'Generate sound effects and audio from text descriptions. Supports category, quality, and ambience options.'
    `);
    console.log('   ✅ Bark added/updated\n');
    
    // 2. Add/Update MusicGen (Text-to-Music)
    console.log('2️⃣  Adding/Updating MusicGen (Text-to-Music)...');
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
        'Generate music from text descriptions. Supports genre, mood, tempo, instruments, and lyrics.',
        true
      ) ON CONFLICT (model_id) DO UPDATE SET
        category = 'Text-to-Music',
        status = 'active',
        is_default = true,
        description = 'Generate music from text descriptions. Supports genre, mood, tempo, instruments, and lyrics.'
    `);
    console.log('   ✅ MusicGen added/updated\n');
    
    // 3. Update Whisper (mark as transcription, not generation)
    console.log('3️⃣  Updating Whisper (Speech-to-Text only)...');
    const whisperResult = await pool.query(`
      UPDATE ai_models 
      SET 
        category = 'Speech-to-Text',
        description = 'Audio transcription (Speech-to-Text). NOT for audio generation!',
        status = 'inactive'
      WHERE model_id = 'fal-ai/whisper'
      RETURNING model_id
    `);
    
    if (whisperResult.rowCount > 0) {
      console.log('   ✅ Whisper updated (disabled for generation)\n');
    } else {
      console.log('   ℹ️  Whisper not found in database (skipped)\n');
    }
    
    // 4. Show current audio models
    console.log('📋 Current Audio Models:\n');
    const modelsResult = await pool.query(`
      SELECT model_id, name, category, status, is_default
      FROM ai_models 
      WHERE type = 'audio' 
      ORDER BY category, name
    `);
    
    if (modelsResult.rows.length === 0) {
      console.log('   ⚠️  No audio models found!\n');
    } else {
      console.table(modelsResult.rows);
    }
    
    console.log('\n✅ Audio models fixed successfully!');
    console.log('\n📌 Next steps:');
    console.log('   1. Refresh your dashboard');
    console.log('   2. Select "Text-to-Audio" type');
    console.log('   3. Choose "Bark Text-to-Audio" model');
    console.log('   4. Try generating audio! 🎵\n');
    
  } catch (error) {
    console.error('\n❌ Error fixing audio models:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the fix
fixAudioModels();

