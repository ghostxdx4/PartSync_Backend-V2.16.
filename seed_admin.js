require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./config/db').default;

(async () => {
  try {
    const email = 'discordant2020@gmail.com';
    const plainPassword = 'administrator0';

    const password_hash = await bcrypt.hash(plainPassword, 10);

    const [result] = await db.query(
      'INSERT INTO admin (email, password_hash, failed_attempts, is_blacklisted) VALUES (?, ?, 0, 0)',
      [email, password_hash]
    );

    console.log('✅ Admin created successfully with ID:', result.insertId);
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
})();
