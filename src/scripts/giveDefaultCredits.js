/**
 * Give default credits to existing users who have 0 or NULL credits
 */

const pool = require('../config/database').pool;

async function giveDefaultCredits() {
  console.log('🎁 Giving default credits to existing users...\n');
  
  try {
    // Get users with 0 or NULL credits
    const usersQuery = await pool.query(`
      SELECT id, name, email, credits 
      FROM users 
      WHERE credits IS NULL OR credits = 0
      ORDER BY created_at ASC
    `);
    
    const users = usersQuery.rows;
    
    if (users.length === 0) {
      console.log('✅ No users need credits. All users already have credits!');
      process.exit(0);
    }
    
    console.log(`Found ${users.length} user(s) with 0 or no credits:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Current credits: ${user.credits || 0}`);
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💰 Giving 100 credits to each user...\n');
    
    // Update all users
    const updateResult = await pool.query(`
      UPDATE users 
      SET credits = 100 
      WHERE credits IS NULL OR credits = 0
      RETURNING id, name, email, credits
    `);
    
    console.log(`✅ Successfully updated ${updateResult.rowCount} user(s)!\n`);
    
    updateResult.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   New credits: ${user.credits} 🎉`);
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All users now have credits!');
    console.log('Users can now generate images and videos! 🚀\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error giving credits:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  giveDefaultCredits();
}

module.exports = { giveDefaultCredits };

