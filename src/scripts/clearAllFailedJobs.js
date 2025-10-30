/**
 * ======================================
 * Clear All Failed/Retry Jobs
 * ======================================
 * 
 * Script untuk menghapus semua failed & retry jobs
 * dari pg-boss queue
 */

const { pool } = require('../config/database');

async function clearAllFailedJobs() {
  console.log('🧹 Clearing all failed and retry jobs from queue...\n');

  try {
    // Delete all failed and retry jobs
    const deleteQuery = `
      DELETE FROM pgboss.job
      WHERE name = 'ai-generation'
        AND state IN ('failed', 'retry')
      RETURNING id, name, state, data
    `;
    
    const result = await pool.query(deleteQuery);
    
    if (result.rows.length > 0) {
      console.log(`✅ Deleted ${result.rows.length} failed/retry jobs:`);
      result.rows.forEach(job => {
        const userId = job.data ? job.data.userId : 'N/A';
        const jobId = job.data ? job.data.jobId : 'N/A';
        console.log(`   - Job ${job.id} (${job.state}) - User: ${userId}, JobID: ${jobId}`);
      });
    } else {
      console.log('✅ No failed/retry jobs found.');
    }

    // Show remaining jobs
    const countQuery = `
      SELECT state, COUNT(*) as count
      FROM pgboss.job
      WHERE name = 'ai-generation'
      GROUP BY state
      ORDER BY state
    `;
    
    const countResult = await pool.query(countQuery);
    
    console.log('\n📊 Remaining jobs in queue:');
    if (countResult.rows.length > 0) {
      countResult.rows.forEach(row => {
        console.log(`   ${row.state}: ${row.count}`);
      });
    } else {
      console.log('   (no jobs - queue is clean!)');
    }

    console.log('\n✨ Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing failed jobs:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  clearAllFailedJobs()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = clearAllFailedJobs;

