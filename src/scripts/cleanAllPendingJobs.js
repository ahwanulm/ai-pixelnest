/**
 * =========================================
 * Clean ALL Pending/Processing Jobs
 * =========================================
 * 
 * Script untuk membersihkan SEMUA pending/processing jobs
 * tanpa melihat waktu (untuk reset database)
 * 
 * ⚠️  WARNING: Ini akan menghapus SEMUA active jobs!
 * Gunakan hanya untuk development atau maintenance mode.
 */

const { pool } = require('../config/database');

async function cleanAllPendingJobs(options = {}) {
  const {
    dryRun = false,
    verbose = true
  } = options;

  const client = await pool.connect();
  
  try {
    console.log('🧹 Cleaning ALL pending/processing jobs...\n');
    
    if (dryRun) {
      console.log('⚠️  DRY RUN MODE - Preview only\n');
    } else {
      console.log('⚠️  WARNING: This will mark ALL active jobs as failed!\n');
    }
    
    await client.query('BEGIN');
    
    // Get count of jobs to clean
    const countQuery = `
      SELECT 
        status,
        COUNT(*) as count,
        generation_type,
        COUNT(*) as type_count
      FROM ai_generation_history
      WHERE status IN ('pending', 'processing')
      GROUP BY status, generation_type
    `;
    
    const counts = await client.query(countQuery);
    
    if (counts.rows.length === 0) {
      console.log('✅ No pending or processing jobs found. Database is clean!\n');
      await client.query('ROLLBACK');
      return;
    }
    
    console.log('📊 Jobs to clean:');
    console.table(counts.rows);
    
    // Get total
    const totalQuery = `
      SELECT COUNT(*) as total
      FROM ai_generation_history
      WHERE status IN ('pending', 'processing')
    `;
    const total = await client.query(totalQuery);
    const totalJobs = parseInt(total.rows[0].total);
    
    console.log(`\n📋 Total jobs to clean: ${totalJobs}\n`);
    
    if (verbose) {
      // Show details
      const detailsQuery = `
        SELECT id, job_id, generation_type, sub_type, status, started_at,
               EXTRACT(EPOCH FROM (NOW() - started_at))/60 as minutes_old
        FROM ai_generation_history
        WHERE status IN ('pending', 'processing')
        ORDER BY started_at ASC
        LIMIT 20
      `;
      
      const details = await client.query(detailsQuery);
      
      if (details.rows.length > 0) {
        console.log('📝 Jobs preview (showing first 20):');
        details.rows.forEach(job => {
          const age = Math.round(job.minutes_old);
          console.log(`   - ${job.job_id} | ${job.generation_type} | ${job.status} | ${age}m old`);
        });
        
        if (totalJobs > 20) {
          console.log(`   ... and ${totalJobs - 20} more`);
        }
        console.log('');
      }
    }
    
    if (!dryRun) {
      // Confirm before proceeding
      console.log('⚠️  About to mark all active jobs as failed...');
      
      // Update all pending/processing jobs
      const updateResult = await client.query(`
        UPDATE ai_generation_history
        SET 
          status = 'failed',
          error_message = 'Job cancelled: Manual cleanup/reset',
          completed_at = NOW()
        WHERE status IN ('pending', 'processing')
        RETURNING id, job_id, generation_type
      `);
      
      console.log(`✅ Cleaned ${updateResult.rowCount} job(s)\n`);
      
      await client.query('COMMIT');
      
      console.log('✅ All pending/processing jobs have been cleaned!');
    } else {
      await client.query('ROLLBACK');
      console.log(`ℹ️  Would clean ${totalJobs} job(s) (dry run mode)\n`);
    }
    
    // Show final stats
    const finalStats = await client.query(`
      SELECT status, COUNT(*) as count
      FROM ai_generation_history
      GROUP BY status
      ORDER BY status
    `);
    
    console.log('\n📊 Final Statistics:');
    console.table(finalStats.rows);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    client.release();
  }
}

// CLI Usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  const verbose = !args.includes('--quiet') && !args.includes('-q');
  const force = args.includes('--force') || args.includes('-f');
  
  console.log('═══════════════════════════════════════════════');
  console.log('🧹 Clean ALL Pending Jobs');
  console.log('═══════════════════════════════════════════════\n');
  
  if (!force && !dryRun) {
    console.log('⚠️  ERROR: This is a destructive operation!');
    console.log('   Use --force to confirm, or --dry-run to preview\n');
    console.log('Usage:');
    console.log('  node src/scripts/cleanAllPendingJobs.js --dry-run  # Preview');
    console.log('  node src/scripts/cleanAllPendingJobs.js --force    # Execute');
    process.exit(1);
  }
  
  cleanAllPendingJobs({ dryRun, verbose })
    .then(() => {
      console.log('\n✅ Done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Failed:', error.message);
      process.exit(1);
    });
}

module.exports = cleanAllPendingJobs;

