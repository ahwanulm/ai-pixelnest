const { pool } = require('../config/database');

/**
 * Clear Stale Sessions
 * 
 * This script clears sessions that reference users that no longer exist
 * or have invalid data. Useful when you get passport deserialize errors.
 * 
 * Usage: node src/scripts/clearStaleSessions.js
 */

async function clearStaleSessions() {
  console.log('\n🧹 Clearing Stale Sessions...\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    // 1. Check total sessions
    const totalSessions = await pool.query('SELECT COUNT(*) FROM sessions');
    console.log(`📊 Total sessions: ${totalSessions.rows[0].count}`);
    
    // 2. Find sessions with invalid user data
    const staleSessions = await pool.query(`
      SELECT 
        sid,
        sess,
        expire
      FROM sessions
      WHERE 
        sess::text LIKE '%"passport":{"user":%'
        AND (
          -- Session expired
          expire < NOW()
          OR
          -- Session data is invalid JSON
          NOT (sess::text ~ '"passport":\s*\{\s*"user":\s*\d+')
        )
    `);
    
    console.log(`🔍 Found ${staleSessions.rows.length} stale/expired sessions\n`);
    
    if (staleSessions.rows.length === 0) {
      console.log('✅ No stale sessions found. Your sessions are clean!\n');
      return;
    }
    
    // 3. Delete expired sessions
    const deleteExpired = await pool.query(`
      DELETE FROM sessions
      WHERE expire < NOW()
      RETURNING sid
    `);
    
    console.log(`✅ Deleted ${deleteExpired.rows.length} expired sessions`);
    
    // 4. Delete sessions for users that don't exist (using CTE)
    const deleteOrphaned = await pool.query(`
      WITH session_users AS (
        SELECT 
          s.sid,
          CAST((regexp_matches(s.sess::text, '"passport":\s*\{\s*"user":\s*(\d+)'))[1] AS INTEGER) as user_id
        FROM sessions s
        WHERE sess::text LIKE '%"passport":{"user":%'
      )
      DELETE FROM sessions
      WHERE sid IN (
        SELECT su.sid 
        FROM session_users su
        LEFT JOIN users u ON u.id = su.user_id
        WHERE u.id IS NULL
      )
      RETURNING sid
    `);
    
    console.log(`✅ Deleted ${deleteOrphaned.rows.length} orphaned sessions (user doesn't exist)`);
    
    // 5. Delete sessions for inactive users (using CTE)
    const deleteInactive = await pool.query(`
      WITH session_users AS (
        SELECT 
          s.sid,
          CAST((regexp_matches(s.sess::text, '"passport":\s*\{\s*"user":\s*(\d+)'))[1] AS INTEGER) as user_id
        FROM sessions s
        WHERE sess::text LIKE '%"passport":{"user":%'
      )
      DELETE FROM sessions
      WHERE sid IN (
        SELECT su.sid 
        FROM session_users su
        JOIN users u ON u.id = su.user_id
        WHERE u.is_active = false
      )
      RETURNING sid
    `);
    
    console.log(`✅ Deleted ${deleteInactive.rows.length} sessions for inactive users`);
    
    // 6. Final count
    const finalCount = await pool.query('SELECT COUNT(*) FROM sessions');
    const cleaned = parseInt(totalSessions.rows[0].count) - parseInt(finalCount.rows[0].count);
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎉 Cleanup Complete!\n');
    console.log('📊 Summary:');
    console.log(`  • Sessions before: ${totalSessions.rows[0].count}`);
    console.log(`  • Sessions after: ${finalCount.rows[0].count}`);
    console.log(`  • Sessions cleaned: ${cleaned}`);
    console.log('\n✅ All stale sessions have been removed!');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Error clearing sessions:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('  1. Make sure PostgreSQL is running');
    console.error('  2. Check database connection in .env');
    console.error('  3. Verify sessions table exists\n');
    throw error;
  }
}

// Run cleanup if called directly
if (require.main === module) {
  clearStaleSessions()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('\n❌ Cleanup failed:', error);
      await pool.end();
      process.exit(1);
    });
}

module.exports = clearStaleSessions;

