const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function seed() {
  try {
    console.log('Starting database seeding...');

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Update all user passwords
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE password_hash = $2',
      [hashedPassword, 'temp_hash_will_be_replaced']
    );

    console.log('✓ User passwords updated');
    console.log('  Default credentials:');
    console.log('  - admin / admin123');
    console.log('  - doctor.kigali / admin123');
    console.log('  - nurse.butare / admin123');
    console.log('\n⚠️  IMPORTANT: Change passwords after first login!');
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();

