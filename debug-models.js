/**
 * 🔍 DEBUG SCRIPT: Mengapa Model Baru Tidak Muncul?
 * 
 * Jalankan: node debug-models.js
 */

require('dotenv').config();
const { pool } = require('./src/config/database');

async function debugModels() {
  console.log('🔍 Debugging Model Loading Issue...\n');
  
  try {
    // 1. Check total models in database
    const totalModels = await pool.query(`
      SELECT COUNT(*) as total FROM ai_models
    `);
    console.log(`📊 Total models in database: ${totalModels.rows[0].total}\n`);
    
    // 2. Check models by is_active status
    const activeStatus = await pool.query(`
      SELECT 
        is_active,
        COUNT(*) as count
      FROM ai_models
      GROUP BY is_active
      ORDER BY is_active DESC
    `);
    
    console.log('✅ Models by Active Status:');
    activeStatus.rows.forEach(row => {
      const status = row.is_active ? '✅ ACTIVE' : '❌ INACTIVE';
      console.log(`   ${status}: ${row.count} models`);
    });
    console.log('');
    
    // 3. Check models by type
    const byType = await pool.query(`
      SELECT 
        type,
        is_active,
        COUNT(*) as count
      FROM ai_models
      GROUP BY type, is_active
      ORDER BY type, is_active DESC
    `);
    
    console.log('📦 Models by Type & Status:');
    byType.rows.forEach(row => {
      const status = row.is_active ? 'ACTIVE' : 'INACTIVE';
      console.log(`   ${row.type || 'NULL'} (${status}): ${row.count} models`);
    });
    console.log('');
    
    // 4. Check recent models (last 5 added)
    const recentModels = await pool.query(`
      SELECT 
        id,
        name,
        model_id,
        type,
        category,
        is_active,
        created_at
      FROM ai_models
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log('🆕 Last 10 Models Added:');
    console.log('─'.repeat(100));
    console.log('ID   | Name                    | Type  | Category          | Active | Created');
    console.log('─'.repeat(100));
    recentModels.rows.forEach(model => {
      const active = model.is_active ? '✅ YES' : '❌ NO ';
      const type = model.type || 'NULL';
      const category = (model.category || 'NULL').padEnd(17);
      const name = (model.name || 'Unnamed').padEnd(23);
      const date = new Date(model.created_at).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
      console.log(`${String(model.id).padEnd(5)}| ${name}| ${type.padEnd(6)}| ${category}| ${active}  | ${date}`);
    });
    console.log('─'.repeat(100));
    console.log('');
    
    // 5. Check inactive models (potential issue)
    const inactiveModels = await pool.query(`
      SELECT 
        id,
        name,
        model_id,
        type,
        category,
        created_at
      FROM ai_models
      WHERE is_active = false
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    if (inactiveModels.rows.length > 0) {
      console.log('⚠️  INACTIVE Models (Not shown in dashboard):');
      console.log('─'.repeat(80));
      inactiveModels.rows.forEach(model => {
        console.log(`   ID: ${model.id}`);
        console.log(`   Name: ${model.name}`);
        console.log(`   Type: ${model.type || 'NULL (❌ ISSUE!)'}`);
        console.log(`   Category: ${model.category || 'NULL'}`);
        console.log(`   Created: ${new Date(model.created_at).toLocaleString('id-ID')}`);
        console.log('   ─'.repeat(40));
      });
      console.log('');
    }
    
    // 6. Check models with NULL type (BUG!)
    const nullType = await pool.query(`
      SELECT 
        id,
        name,
        model_id,
        type,
        is_active
      FROM ai_models
      WHERE type IS NULL OR type = ''
    `);
    
    if (nullType.rows.length > 0) {
      console.log('🐛 CRITICAL BUG - Models with NULL/Empty Type:');
      console.log('   These models will NEVER show in dashboard!\n');
      nullType.rows.forEach(model => {
        console.log(`   ❌ ID ${model.id}: ${model.name} (Active: ${model.is_active ? 'Yes' : 'No'})`);
      });
      console.log('');
      console.log('   💡 FIX: Update type to "image" or "video" in admin panel\n');
    }
    
    // 7. Check what dashboard API would return
    console.log('📡 Testing Dashboard API Query...\n');
    
    const imageModels = await pool.query(`
      SELECT id, name, type, category, is_active
      FROM ai_models
      WHERE is_active = true AND type = $1
      ORDER BY 
        CASE WHEN viral THEN 0 ELSE 1 END,
        CASE WHEN trending THEN 0 ELSE 1 END,
        name ASC
      LIMIT 100
    `, ['image']);
    
    const videoModels = await pool.query(`
      SELECT id, name, type, category, is_active
      FROM ai_models
      WHERE is_active = true AND type = $1
      ORDER BY 
        CASE WHEN viral THEN 0 ELSE 1 END,
        CASE WHEN trending THEN 0 ELSE 1 END,
        name ASC
      LIMIT 100
    `, ['video']);
    
    console.log(`   🖼️  Image Models (dashboard will show): ${imageModels.rows.length}`);
    console.log(`   🎬 Video Models (dashboard will show): ${videoModels.rows.length}\n`);
    
    // 8. Summary & Recommendations
    console.log('═'.repeat(80));
    console.log('📋 SUMMARY & RECOMMENDATIONS');
    console.log('═'.repeat(80));
    
    const totalActive = activeStatus.rows.find(r => r.is_active)?.count || 0;
    const totalInactive = activeStatus.rows.find(r => !r.is_active)?.count || 0;
    
    console.log('\n✅ Models Status:');
    console.log(`   Active: ${totalActive}`);
    console.log(`   Inactive: ${totalInactive}`);
    console.log(`   Showing in Dashboard: ${imageModels.rows.length + videoModels.rows.length}\n`);
    
    if (nullType.rows.length > 0) {
      console.log('🔴 ISSUE FOUND: Models with NULL type');
      console.log('   → Go to Admin Panel (/admin/models)');
      console.log('   → Edit these models and set Type to "image" or "video"\n');
    }
    
    if (totalInactive > 0) {
      console.log('⚠️  WARNING: Some models are INACTIVE');
      console.log('   → Go to Admin Panel (/admin/models)');
      console.log('   → Find inactive models (gray background)');
      console.log('   → Click "Activate" button to enable them\n');
    }
    
    if (nullType.rows.length === 0 && totalInactive === 0) {
      console.log('✅ All models look good!');
      console.log('   If model still not showing:');
      console.log('   1. Clear browser cache (Ctrl+Shift+R)');
      console.log('   2. Check browser console for errors (F12)');
      console.log('   3. Verify model type/category matches your selection\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Run debug
debugModels().then(() => {
  console.log('🏁 Debug complete!\n');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

