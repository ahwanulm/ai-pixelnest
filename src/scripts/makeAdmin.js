const { pool } = require('../config/database');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function makeUserAdmin() {
  try {
    console.log('\n🔐 PixelNest Admin Setup\n');
    console.log('This script will make a user an admin.\n');

    // Ask for email
    rl.question('Enter user email: ', async (email) => {
      try {
        // Check if user exists
        const userQuery = 'SELECT * FROM users WHERE email = $1';
        const userResult = await pool.query(userQuery, [email]);

        if (userResult.rows.length === 0) {
          console.log('\n❌ User not found with email:', email);
          console.log('\nPlease make sure the user has registered first.\n');
          pool.end();
          rl.close();
          process.exit(1);
        }

        const user = userResult.rows[0];

        if (user.role === 'admin') {
          console.log('\n⚠️  User is already an admin!');
          pool.end();
          rl.close();
          process.exit(0);
        }

        // Update user to admin
        const updateQuery = 'UPDATE users SET role = $1 WHERE email = $2 RETURNING *';
        const updateResult = await pool.query(updateQuery, ['admin', email]);

        const adminUser = updateResult.rows[0];

        console.log('\n✅ User successfully promoted to admin!');
        console.log('\nAdmin Details:');
        console.log('  Name:', adminUser.name);
        console.log('  Email:', adminUser.email);
        console.log('  Role:', adminUser.role);
        console.log('\n🎉 You can now access the admin panel at: http://localhost:5005/admin\n');

        pool.end();
        rl.close();
        process.exit(0);
      } catch (error) {
        console.error('\n❌ Error:', error.message);
        pool.end();
        rl.close();
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('❌ Error:', error);
    pool.end();
    rl.close();
    process.exit(1);
  }
}

// Run the script
makeUserAdmin();

