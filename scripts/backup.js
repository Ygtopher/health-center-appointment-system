// Automated Database Backup Script
// Health Center Appointment & Medication Reminder System

require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

// Configuration
const BACKUP_DIR = process.env.BACKUP_DIR || (process.platform === 'win32'
    ? 'C:\\backups\\health_center_db'
    : '/var/backups/health_center_db');
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;

/**
 * Ensure backup directory exists
 */
function ensureBackupDirectory() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        logger.info(`Created backup directory: ${BACKUP_DIR}`);
    }
}

/**
 * Create database backup
 */
async function createBackup() {
    try {
        ensureBackupDirectory();

        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const filename = `health_center_db_${timestamp}.sql`;
        const filepath = path.join(BACKUP_DIR, filename);
        const gzipFilepath = `${filepath}.gz`;

        logger.info('Starting database backup...');

        // Set PGPASSWORD environment variable for pg_dump
        const env = { ...process.env, PGPASSWORD: DB_PASSWORD };

        // Create pg_dump command
        const dumpCommand = process.platform === 'win32'
            ? `"C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe" -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -F p -f "${filepath}"`
            : `pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -F p -f "${filepath}"`;

        // Execute pg_dump
        await new Promise((resolve, reject) => {
            exec(dumpCommand, { env }, (error, stdout, stderr) => {
                if (error) {
                    logger.error('pg_dump error:', error);
                    reject(error);
                    return;
                }
                if (stderr) {
                    logger.warn('pg_dump stderr:', stderr);
                }
                resolve();
            });
        });

        // Check if backup file was created
        if (!fs.existsSync(filepath)) {
            throw new Error('Backup file was not created');
        }

        const fileSize = fs.statSync(filepath).size;
        if (fileSize === 0) {
            throw new Error('Backup file is empty');
        }

        logger.info(`Backup created: ${filepath} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

        // Compress backup (optional, for space saving)
        if (process.platform !== 'win32') {
            await new Promise((resolve, reject) => {
                exec(`gzip "${filepath}"`, (error, stdout, stderr) => {
                    if (error) {
                        logger.warn('Compression failed, keeping uncompressed backup:', error);
                        resolve(); // Don't fail the backup if compression fails
                        return;
                    }
                    logger.info(`Backup compressed: ${gzipFilepath}`);
                    resolve();
                });
            });
        }

        // Cleanup old backups
        await cleanupOldBackups();

        logger.info('✅ Database backup completed successfully');
        return { success: true, filepath: process.platform === 'win32' ? filepath : gzipFilepath };

    } catch (error) {
        logger.error('❌ Database backup failed:', error);
        throw error;
    }
}

/**
 * Delete backups older than retention period
 */
async function cleanupOldBackups() {
    try {
        const files = fs.readdirSync(BACKUP_DIR);
        const now = Date.now();
        const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;

        let deletedCount = 0;

        for (const file of files) {
            if (file.startsWith('health_center_db_') && (file.endsWith('.sql') || file.endsWith('.sql.gz'))) {
                const filepath = path.join(BACKUP_DIR, file);
                const stats = fs.statSync(filepath);
                const fileAge = now - stats.mtimeMs;

                if (fileAge > retentionMs) {
                    fs.unlinkSync(filepath);
                    logger.info(`Deleted old backup: ${file}`);
                    deletedCount++;
                }
            }
        }

        if (deletedCount > 0) {
            logger.info(`Cleaned up ${deletedCount} old backup(s)`);
        }

    } catch (error) {
        logger.error('Error cleaning up old backups:', error);
        // Don't throw - cleanup failure shouldn't fail the backup
    }
}

/**
 * List all backups
 */
function listBackups() {
    try {
        ensureBackupDirectory();

        const files = fs.readdirSync(BACKUP_DIR);
        const backups = files
            .filter(file => file.startsWith('health_center_db_') && (file.endsWith('.sql') || file.endsWith('.sql.gz')))
            .map(file => {
                const filepath = path.join(BACKUP_DIR, file);
                const stats = fs.statSync(filepath);
                return {
                    filename: file,
                    filepath: filepath,
                    size: stats.size,
                    created: stats.mtime,
                    age_days: Math.floor((Date.now() - stats.mtimeMs) / (24 * 60 * 60 * 1000))
                };
            })
            .sort((a, b) => b.created - a.created);

        return backups;

    } catch (error) {
        logger.error('Error listing backups:', error);
        return [];
    }
}

/**
 * Restore database from backup
 */
async function restoreBackup(backupFilepath) {
    try {
        logger.info(`Starting database restore from: ${backupFilepath}`);

        if (!fs.existsSync(backupFilepath)) {
            throw new Error('Backup file not found');
        }

        // Set PGPASSWORD environment variable
        const env = { ...process.env, PGPASSWORD: DB_PASSWORD };

        // Decompress if needed
        let sqlFilepath = backupFilepath;
        if (backupFilepath.endsWith('.gz')) {
            sqlFilepath = backupFilepath.replace('.gz', '');
            await new Promise((resolve, reject) => {
                exec(`gunzip -c "${backupFilepath}" > "${sqlFilepath}"`, (error) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve();
                });
            });
        }

        // Restore using psql
        const restoreCommand = process.platform === 'win32'
            ? `"C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe" -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f "${sqlFilepath}"`
            : `psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f "${sqlFilepath}"`;

        await new Promise((resolve, reject) => {
            exec(restoreCommand, { env }, (error, stdout, stderr) => {
                if (error) {
                    logger.error('psql error:', error);
                    reject(error);
                    return;
                }
                if (stderr) {
                    logger.warn('psql stderr:', stderr);
                }
                resolve();
            });
        });

        logger.info('✅ Database restore completed successfully');
        return { success: true };

    } catch (error) {
        logger.error('❌ Database restore failed:', error);
        throw error;
    }
}

// Export functions
module.exports = {
    createBackup,
    cleanupOldBackups,
    listBackups,
    restoreBackup
};

// If run directly, create a backup
if (require.main === module) {
    createBackup()
        .then(() => {
            console.log('Backup completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Backup failed:', error);
            process.exit(1);
        });
}
