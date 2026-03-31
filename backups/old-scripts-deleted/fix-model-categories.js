/**
 * 🔧 FIX: Model Categories from Browse FAL.AI
 * 
 * Problem: Models added via "Browse FAL.AI" button have invalid categories
 *          ('video-generation', 'image-generation') which don't match
 *          the valid categories used by dashboard filters.
 * 
 * Valid Categories:
 *   - Text-to-Image
 *   - Image Editing
 *   - Upscaling
 *   - Text-to-Video
 *   - Image-to-Video
 * 
 * Run: node fix-model-categories.js
 */

require('dotenv').config();
const { pool } = require('./src/config/database');

async function fixModelCategories() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔧 Fixing Model Categories Bug');
  console.log('═══════════════════════════════════════════════════════\n');
  
  try {
    // 1. Check for invalid categories
    console.log('Step 1: Checking for invalid categories...\n');
    
    const invalidModels = await pool.query(`
      SELECT 
        id,
        name,
        type,
        category,
        is_active
      FROM ai_models
      WHERE category IN ('video-generation', 'image-generation')
      ORDER BY created_at DESC
    `);
    
    if (invalidModels.rows.length === 0) {
      console.log('✅ No models with invalid categories found!');
      console.log('   All models are using proper categories.\n');
      await pool.end();
      process.exit(0);
    }
    
    console.log(`⚠️  Found ${invalidModels.rows.length} model(s) with invalid categories:\n`);
    console.log('─'.repeat(80));
    console.log('ID  | Name                          | Type  | Current Category   | Active');
    console.log('─'.repeat(80));
    
    invalidModels.rows.forEach(model => {
      const name = (model.name || 'Unnamed').padEnd(29);
      const type = (model.type || 'NULL').padEnd(6);
      const category = (model.category || 'NULL').padEnd(18);
      const active = model.is_active ? '✅' : '❌';
      console.log(`${String(model.id).padEnd(4)}| ${name}| ${type}| ${category}| ${active}`);
    });
    console.log('─'.repeat(80));
    console.log('');
    
    // 2. Fix video-generation → Text-to-Video
    console.log('Step 2: Fixing video models...');
    
    const videoResult = await pool.query(`
      UPDATE ai_models 
      SET 
        category = 'Text-to-Video',
        updated_at = CURRENT_TIMESTAMP
      WHERE 
        type = 'video' 
        AND category = 'video-generation'
      RETURNING id, name
    `);
    
    if (videoResult.rows.length > 0) {
      console.log(`✅ Fixed ${videoResult.rows.length} video model(s):`);
      videoResult.rows.forEach(model => {
        console.log(`   - ${model.name} (ID: ${model.id})`);
      });
    } else {
      console.log('   No video models to fix.');
    }
    console.log('');
    
    // 3. Fix image-generation → Text-to-Image
    console.log('Step 3: Fixing image models...');
    
    const imageResult = await pool.query(`
      UPDATE ai_models 
      SET 
        category = 'Text-to-Image',
        updated_at = CURRENT_TIMESTAMP
      WHERE 
        type = 'image' 
        AND category = 'image-generation'
      RETURNING id, name
    `);
    
    if (imageResult.rows.length > 0) {
      console.log(`✅ Fixed ${imageResult.rows.length} image model(s):`);
      imageResult.rows.forEach(model => {
        console.log(`   - ${model.name} (ID: ${model.id})`);
      });
    } else {
      console.log('   No image models to fix.');
    }
    console.log('');
    
    // 4. Verify the fix
    console.log('Step 4: Verifying categories...\n');
    
    const categorySummary = await pool.query(`
      SELECT 
        category,
        type,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE is_active = true) as active_count
      FROM ai_models
      GROUP BY category, type
      ORDER BY type, category
    `);
    
    console.log('📊 Category Distribution (After Fix):');
    console.log('─'.repeat(80));
    console.log('Type  | Category           | Total | Active');
    console.log('─'.repeat(80));
    
    categorySummary.rows.forEach(row => {
      const type = (row.type || 'NULL').padEnd(6);
      const category = (row.category || 'NULL').padEnd(18);
      const total = String(row.count).padEnd(6);
      const active = String(row.active_count).padEnd(6);
      console.log(`${type}| ${category}| ${total}| ${active}`);
    });
    console.log('─'.repeat(80));
    console.log('');
    
    // 5. Final check
    const remainingInvalid = await pool.query(`
      SELECT COUNT(*) as count
      FROM ai_models
      WHERE category IN ('video-generation', 'image-generation')
    `);
    
    if (remainingInvalid.rows[0].count > 0) {
      console.log(`⚠️  WARNING: ${remainingInvalid.rows[0].count} model(s) still have invalid categories!`);
      console.log('   Please check the logs above for details.\n');
    } else {
      console.log('✅ SUCCESS! All models now have valid categories.\n');
    }
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 Fix Complete!');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('📝 Next Steps:');
    console.log('   1. Clear browser cache (Ctrl+Shift+R)');
    console.log('   2. Refresh dashboard to see new models');
    console.log('   3. If still not showing, run: node debug-models.js\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

// Run the fix
fixModelCategories().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

