// Backup Scheduler
// Schedules automated database backups using node-cron

const cron = require('node-cron');
const { createBackup } = require('./backup');
const logger = require('../config/logger');

/**
 * Schedule daily backups at 2:00 AM
 */
function scheduleBackups() {
    // Run daily at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
        logger.info('🕐 Scheduled backup starting...');
        try {
            await createBackup();
            logger.info('✅ Scheduled backup completed');
        } catch (error) {
            logger.error('❌ Scheduled backup failed:', error);
            // TODO: Send email notification on failure
        }
    }, {
        timezone: 'Africa/Kigali'
    });

    logger.info('📅 Backup scheduler initialized (daily at 2:00 AM CAT)');
}

module.exports = { scheduleBackups };
