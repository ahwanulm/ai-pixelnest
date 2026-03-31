const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkPricing() {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        type,
        pricing_type,
        fal_price,
        cost,
        max_duration,
        CASE 
          WHEN pricing_type = 'per_second' THEN
            ROUND((fal_price * 10)::numeric, 1)
          ELSE
            ROUND((fal_price * 10)::numeric, 1)
        END as should_be,
        (cost - ROUND((fal_price * 10)::numeric, 1)) as difference
      FROM ai_models
      WHERE type = 'video'
        AND is_active = true
        AND fal_price IS NOT NULL
      ORDER BY ABS(cost - ROUND((fal_price * 10)::numeric, 1)) DESC
      LIMIT 10
    `);
    
    console.log('\n📊 VIDEO MODELS PRICING CHECK:\n');
    console.log('ID | Name | Pricing | FAL $ | Current Cost | Should Be | Diff');
    console.log('---|------|---------|-------|--------------|-----------|-----');
    
    result.rows.forEach(row => {
      const diff = parseFloat(row.difference || 0).toFixed(1);
      const status = Math.abs(diff) < 0.1 ? '✅' : '❌';
      console.log(`${row.id} | ${row.name.substring(0, 20).padEnd(20)} | ${row.pricing_type.padEnd(10)} | $${parseFloat(row.fal_price).toFixed(3)} | ${parseFloat(row.cost).toFixed(1).padStart(6)} cr | ${parseFloat(row.should_be).toFixed(1).padStart(6)} cr | ${diff.padStart(6)} ${status}`);
    });
    
    console.log('\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkPricing();
