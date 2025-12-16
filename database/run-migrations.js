// Migration Runner Script
// Health Center Appointment & Medication Reminder System

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

// Migration files to run
const migrations = [
    'migration_001_cbhi_consent.sql',
    'migration_002_adherence.sql'
];

async function runMigrations() {
    console.log('🚀 Starting database migrations...\n');
    
    const client = await pool.connect();
    
    try {
        for (const migrationFile of migrations) {
            const filePath = path.join(__dirname, migrationFile);
            
            console.log(`📄 Running migration: ${migrationFile}`);
            
            // Check if file exists
            if (!fs.existsSync(filePath)) {
                console.error(`❌ Migration file not found: ${filePath}`);
                continue;
            }
            
            // Read SQL file
            const sql = fs.readFileSync(filePath, 'utf8');
            
            // Execute migration
            try {
                await client.query(sql);
                console.log(`✅ Migration completed: ${migrationFile}\n`);
            } catch (error) {
                console.error(`❌ Migration failed: ${migrationFile}`);
                console.error(`Error: ${error.message}\n`);
                throw error; // Stop on first error
            }
        }
        
        console.log('✅ All migrations completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Migration process failed:');
        console.error(error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run migrations
runMigrations();
