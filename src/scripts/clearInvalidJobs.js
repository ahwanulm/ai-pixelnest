/**
 * ======================================
 * Clear Invalid/Old Jobs from Queue
 * ======================================
 * 
 * Script untuk menghapus job yang invalid atau corrupted
 * dari pg-boss queue
 */

const { pool } = require('../config/database');

async function clearInvalidJobs() {
  console.log('🧹 Starting to clear invalid jobs from queue...\n');

  try {
    // 1. Delete jobs with NULL or invalid data
    const deleteInvalidQuery = `
      DELETE FROM pgboss.job
      WHERE name = 'ai-generation'
        AND (
          data IS NULL 
          OR data::text = 'null'
          OR data::text = '{}'
          OR NOT (data ? 'userId')
          OR NOT (data ? 'jobId')
        )
      RETURNING id, name, state, created_on
    `;
    
    const invalidResult = await pool.query(deleteInvalidQuery);
    
    if (invalidResult.rows.length > 0) {
      console.log(`✅ Deleted ${invalidResult.rows.length} invalid jobs:`);
      invalidResult.rows.forEach(job => {
        console.log(`   - Job ${job.id} (${job.state}) created: ${job.created_on}`);
      });
    } else {
      console.log('✅ No invalid jobs found.');
    }

    // 2. Delete very old completed/failed jobs (older than 7 days)
    const deleteOldQuery = `
      DELETE FROM pgboss.job
      WHERE name = 'ai-generation'
        AND state IN ('completed', 'failed', 'cancelled')
        AND completed_on < NOW() - INTERVAL '7 days'
      RETURNING id, name, state
    `;
    
    const oldResult = await pool.query(deleteOldQuery);
    
    if (oldResult.rows.length > 0) {
      console.log(`\n✅ Deleted ${oldResult.rows.length} old completed/failed jobs (>7 days)`);
    } else {
      console.log('\n✅ No old jobs to clean up.');
    }

    // 3. Show remaining jobs
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
      console.log('   (no jobs)');
    }

    console.log('\n✨ Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing invalid jobs:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  clearInvalidJobs()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = clearInvalidJobs;

