/**
 * =========================================
 * Cleanup Expired/Stuck Generation Jobs
 * =========================================
 * 
 * Membersihkan job yang:
 * 1. Status 'pending' lebih dari 30 menit (stuck, never processed)
 * 2. Status 'processing' lebih dari 15 menit (worker crashed/timeout)
 * 3. Tidak ada job_id (invalid jobs)
 * 
 * RECOMMENDED TIMEOUTS:
 * - Pending: 30 menit (cukup lama untuk queue delay)
 * - Processing: 15 menit (max generation time untuk video panjang)
 * - Image: biasanya < 1 menit
 * - Video: biasanya 2-10 menit
 * - Audio: biasanya < 5 menit
 */

const { pool } = require('../config/database');

// Configurable timeouts (dalam menit)
const TIMEOUTS = {
  PENDING: 30,      // Job yang stuck di pending > 30 menit
  PROCESSING: 15,   // Job yang processing > 15 menit (kemungkinan worker crash)
  ORPHAN: 60        // Job tanpa job_id > 1 jam (invalid)
};

async function cleanupExpiredJobs(options = {}) {
  const {
    dryRun = false,  // Set true untuk preview tanpa delete
    verbose = true
  } = options;

  const client = await pool.connect();
  
  try {
    console.log('🧹 Starting cleanup of expired generation jobs...\n');
    
    if (dryRun) {
      console.log('⚠️  DRY RUN MODE - No actual changes will be made\n');
    }
    
    await client.query('BEGIN');
    
    // ============================================
    // 1. CLEANUP STUCK PENDING JOBS
    // ============================================
    console.log(`📋 Checking for pending jobs older than ${TIMEOUTS.PENDING} minutes...`);
    
    const stuckPendingQuery = `
      SELECT id, job_id, generation_type, sub_type, prompt, started_at,
             EXTRACT(EPOCH FROM (NOW() - started_at))/60 as minutes_elapsed
      FROM ai_generation_history
      WHERE status = 'pending'
        AND started_at < NOW() - INTERVAL '${TIMEOUTS.PENDING} minutes'
      ORDER BY started_at ASC
    `;
    
    const stuckPending = await client.query(stuckPendingQuery);
    
    if (stuckPending.rows.length > 0) {
      console.log(`❌ Found ${stuckPending.rows.length} stuck pending job(s):`);
      
      if (verbose) {
        stuckPending.rows.forEach(job => {
          console.log(`   - Job ${job.job_id} (${job.generation_type}): ${Math.round(job.minutes_elapsed)} minutes old`);
        });
      }
      
      if (!dryRun) {
        const updateResult = await client.query(`
          UPDATE ai_generation_history
          SET status = 'failed',
              error_message = 'Job expired: stuck in pending for more than ${TIMEOUTS.PENDING} minutes',
              completed_at = NOW()
          WHERE status = 'pending'
            AND started_at < NOW() - INTERVAL '${TIMEOUTS.PENDING} minutes'
        `);
        console.log(`   ✅ Marked ${updateResult.rowCount} job(s) as failed\n`);
      } else {
        console.log(`   ℹ️  Would mark ${stuckPending.rows.length} job(s) as failed (dry run)\n`);
      }
    } else {
      console.log(`   ✅ No stuck pending jobs found\n`);
    }
    
    // ============================================
    // 2. CLEANUP STUCK PROCESSING JOBS
    // ============================================
    console.log(`⚙️  Checking for processing jobs older than ${TIMEOUTS.PROCESSING} minutes...`);
    
    const stuckProcessingQuery = `
      SELECT id, job_id, generation_type, sub_type, prompt, started_at,
             EXTRACT(EPOCH FROM (NOW() - started_at))/60 as minutes_elapsed
      FROM ai_generation_history
      WHERE status = 'processing'
        AND started_at < NOW() - INTERVAL '${TIMEOUTS.PROCESSING} minutes'
      ORDER BY started_at ASC
    `;
    
    const stuckProcessing = await client.query(stuckProcessingQuery);
    
    if (stuckProcessing.rows.length > 0) {
      console.log(`❌ Found ${stuckProcessing.rows.length} stuck processing job(s):`);
      
      if (verbose) {
        stuckProcessing.rows.forEach(job => {
          console.log(`   - Job ${job.job_id} (${job.generation_type}): ${Math.round(job.minutes_elapsed)} minutes old`);
        });
      }
      
      if (!dryRun) {
        const updateResult = await client.query(`
          UPDATE ai_generation_history
          SET status = 'failed',
              error_message = 'Job timeout: processing exceeded ${TIMEOUTS.PROCESSING} minutes (worker may have crashed)',
              completed_at = NOW()
          WHERE status = 'processing'
            AND started_at < NOW() - INTERVAL '${TIMEOUTS.PROCESSING} minutes'
        `);
        console.log(`   ✅ Marked ${updateResult.rowCount} job(s) as failed\n`);
      } else {
        console.log(`   ℹ️  Would mark ${stuckProcessing.rows.length} job(s) as failed (dry run)\n`);
      }
    } else {
      console.log(`   ✅ No stuck processing jobs found\n`);
    }
    
    // ============================================
    // 3. CLEANUP ORPHAN JOBS (no job_id)
    // ============================================
    console.log(`🔍 Checking for orphan jobs (no job_id)...`);
    
    const orphanQuery = `
      SELECT id, generation_type, sub_type, prompt, started_at,
             EXTRACT(EPOCH FROM (NOW() - started_at))/60 as minutes_elapsed
      FROM ai_generation_history
      WHERE (job_id IS NULL OR job_id = '')
        AND status IN ('pending', 'processing')
        AND started_at < NOW() - INTERVAL '${TIMEOUTS.ORPHAN} minutes'
      ORDER BY started_at ASC
    `;
    
    const orphans = await client.query(orphanQuery);
    
    if (orphans.rows.length > 0) {
      console.log(`❌ Found ${orphans.rows.length} orphan job(s):`);
      
      if (verbose) {
        orphans.rows.forEach(job => {
          console.log(`   - ID ${job.id} (${job.generation_type}): ${Math.round(job.minutes_elapsed)} minutes old`);
        });
      }
      
      if (!dryRun) {
        const updateResult = await client.query(`
          UPDATE ai_generation_history
          SET status = 'failed',
              error_message = 'Invalid job: missing job_id',
              completed_at = NOW()
          WHERE (job_id IS NULL OR job_id = '')
            AND status IN ('pending', 'processing')
            AND started_at < NOW() - INTERVAL '${TIMEOUTS.ORPHAN} minutes'
        `);
        console.log(`   ✅ Marked ${updateResult.rowCount} orphan job(s) as failed\n`);
      } else {
        console.log(`   ℹ️  Would mark ${orphans.rows.length} orphan job(s) as failed (dry run)\n`);
      }
    } else {
      console.log(`   ✅ No orphan jobs found\n`);
    }
    
    // ============================================
    // 4. STATISTICS
    // ============================================
    console.log('📊 Current Job Statistics:');
    
    const stats = await client.query(`
      SELECT 
        status,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE started_at > NOW() - INTERVAL '1 hour') as last_hour,
        COUNT(*) FILTER (WHERE started_at > NOW() - INTERVAL '24 hours') as last_24h
      FROM ai_generation_history
      GROUP BY status
      ORDER BY status
    `);
    
    console.table(stats.rows);
    
    // Total active jobs
    const activeJobs = await client.query(`
      SELECT COUNT(*) as count
      FROM ai_generation_history
      WHERE status IN ('pending', 'processing')
    `);
    
    console.log(`\n🔄 Currently active jobs: ${activeJobs.rows[0].count}`);
    
    if (!dryRun) {
      await client.query('COMMIT');
      console.log('\n✅ Cleanup completed successfully!');
    } else {
      await client.query('ROLLBACK');
      console.log('\n✅ Dry run completed (no changes made)');
    }
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    console.log(`   - Schedule this cleanup to run every 30 minutes`);
    console.log(`   - Monitor worker health if you see many stuck jobs`);
    console.log(`   - Adjust timeouts in TIMEOUTS config if needed`);
    console.log(`   - Current timeouts: Pending=${TIMEOUTS.PENDING}m, Processing=${TIMEOUTS.PROCESSING}m, Orphan=${TIMEOUTS.ORPHAN}m`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    client.release();
  }
}

// ============================================
// CLI Usage
// ============================================
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  const verbose = !args.includes('--quiet') && !args.includes('-q');
  
  console.log('═══════════════════════════════════════════════');
  console.log('🧹 Generation Jobs Cleanup Script');
  console.log('═══════════════════════════════════════════════\n');
  
  cleanupExpiredJobs({ dryRun, verbose })
    .then(() => {
      console.log('\n✅ Done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Failed:', error.message);
      process.exit(1);
    });
}

module.exports = { cleanupExpiredJobs, TIMEOUTS };

