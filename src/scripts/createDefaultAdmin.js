const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

async function createDefaultAdmin() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔐 Creating Default Admin Account\n');
    
    const email = 'admin@pixelnest.pro';
    const password = 'andr0Hardcore';
    const name = 'Admin PixelNest';
    
    // Check if admin already exists
    const checkQuery = 'SELECT * FROM users WHERE email = $1';
    const checkResult = await client.query(checkQuery, [email]);
    
    if (checkResult.rows.length > 0) {
      console.log('ℹ️  Admin account already exists');
      
      // Update to make sure it's admin
      const updateQuery = `
        UPDATE users 
        SET role = 'admin', is_active = true 
        WHERE email = $1
        RETURNING id, name, email, role
      `;
      const updateResult = await client.query(updateQuery, [email]);
      
      console.log('\n✅ Existing user promoted to admin!\n');
      console.log('Admin Details:');
      console.log(`  Name: ${updateResult.rows[0].name}`);
      console.log(`  Email: ${updateResult.rows[0].email}`);
      console.log(`  Role: ${updateResult.rows[0].role}`);
      
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const insertQuery = `
        INSERT INTO users (name, email, password_hash, role, is_active, credits, subscription_plan)
        VALUES ($1, $2, $3, 'admin', true, 1000, 'enterprise')
        RETURNING id, name, email, role, credits
      `;
      
      const insertResult = await client.query(insertQuery, [
        name,
        email,
        hashedPassword
      ]);
      
      console.log('\n✅ Default admin account created successfully!\n');
      console.log('Admin Details:');
      console.log(`  Name: ${insertResult.rows[0].name}`);
      console.log(`  Email: ${insertResult.rows[0].email}`);
      console.log(`  Password: ${password}`);
      console.log(`  Role: ${insertResult.rows[0].role}`);
      console.log(`  Credits: ${insertResult.rows[0].credits}`);
    }
    
    console.log('\n🎉 You can now login at: http://localhost:5005/login');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}\n`);
    console.log('⚠️  IMPORTANT: Change the password after first login!\n');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    throw error;
  } finally {
    client.release();
    pool.end();
  }
}

// Run the function
createDefaultAdmin()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

