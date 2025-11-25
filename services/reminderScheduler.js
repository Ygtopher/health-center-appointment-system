const cron = require('node-cron');
const { query } = require('../config/database');
const africastalkingService = require('./africasTalking');
const logger = require('../config/logger');
const moment = require('moment');

class ReminderScheduler {
  constructor() {
    this.isRunning = false;
  }

  // Start the scheduler
  start() {
    if (this.isRunning) {
      logger.warn('Reminder scheduler is already running');
      return;
    }

    // Run every 5 minutes to check for pending reminders
    cron.schedule('*/5 * * * *', async () => {
      await this.processReminders();
    });

    logger.info('Reminder scheduler started');
    this.isRunning = true;
  }

  // Process pending reminders
  async processReminders() {
    try {
      const now = moment().toDate();
      const fiveMinutesFromNow = moment().add(5, 'minutes').toDate();

      // Get reminders that are due
      const result = await query(
        `SELECT r.*, p.phone_number, p.preferred_language as patient_preferred_language, p.first_name, p.last_name
         FROM reminders r
         JOIN patients p ON r.patient_id = p.id
         WHERE r.status = 'pending'
         AND r.scheduled_time <= $1
         AND r.scheduled_time >= $2
         ORDER BY r.scheduled_time ASC
         LIMIT 50`,
        [fiveMinutesFromNow, moment().subtract(1, 'hour').toDate()]
      );

      logger.info(`Processing ${result.rows.length} reminders`);

      for (const reminder of result.rows) {
        await this.sendReminder(reminder);
      }
    } catch (error) {
      logger.error('Error processing reminders:', error);
    }
  }

  // Send a reminder
  async sendReminder(reminder) {
    try {
      let message = reminder.message;
      const language = reminder.patient_preferred_language || 'en';

      // Use Kinyarwanda message if available and preferred
      if (language === 'rw' && reminder.message_kinyarwanda) {
        message = reminder.message_kinyarwanda;
      }

      // Format message with patient name if available
      if (reminder.first_name) {
        const greeting = language === 'rw' ? 'Mwiriwe' : 'Hello';
        message = `${greeting} ${reminder.first_name}, ${message}`;
      }

      // Send SMS
      const smsResult = await africastalkingService.sendSMS(
        reminder.phone_number,
        message
      );

      // Update reminder status
      if (smsResult.success) {
        await query(
          `UPDATE reminders 
           SET status = 'sent',
               sent_at = CURRENT_TIMESTAMP,
               delivery_status = $1
           WHERE id = $2`,
          [smsResult.status || 'sent', reminder.id]
        );

        logger.info(`Reminder sent successfully`, {
          reminderId: reminder.id,
          patientId: reminder.patient_id,
        });
      } else {
        // Retry logic
        const retryCount = reminder.retry_count + 1;
        if (retryCount < 3) {
          await query(
            `UPDATE reminders 
             SET retry_count = $1,
                 error_message = $2
             WHERE id = $3`,
            [retryCount, smsResult.error || 'SMS sending failed', reminder.id]
          );

          // Reschedule for 30 minutes later
          const newScheduledTime = moment(reminder.scheduled_time)
            .add(30, 'minutes')
            .toDate();

          await query(
            `UPDATE reminders 
             SET scheduled_time = $1
             WHERE id = $2`,
            [newScheduledTime, reminder.id]
          );

          logger.warn(`Reminder failed, will retry`, {
            reminderId: reminder.id,
            retryCount,
          });
        } else {
          await query(
            `UPDATE reminders 
             SET status = 'failed',
                 error_message = $1
             WHERE id = $2`,
            [smsResult.error || 'SMS sending failed after retries', reminder.id]
          );

          logger.error(`Reminder failed after retries`, {
            reminderId: reminder.id,
          });
        }
      }
    } catch (error) {
      logger.error('Error sending reminder:', error);
      await query(
        `UPDATE reminders 
         SET status = 'failed',
             error_message = $1
         WHERE id = $2`,
        [error.message, reminder.id]
      );
    }
  }

  // Schedule medication reminders for a prescription
  async scheduleMedicationReminders(medication, prescription, patient) {
    try {
      const startDate = moment(medication.start_date);
      const endDate = moment(medication.end_date);
      const frequency = this.parseFrequency(medication.frequency);

      let currentDate = startDate.clone();
      const reminders = [];

      while (currentDate.isSameOrBefore(endDate)) {
        for (const time of frequency.times) {
          const reminderTime = moment(currentDate).set({
            hour: time.hour,
            minute: time.minute,
          });

          // Schedule reminder 30 minutes before (or as configured)
          const scheduledTime = reminderTime.subtract(
            parseInt(process.env.MEDICATION_REMINDER_MINUTES || 30),
            'minutes'
          );

          if (scheduledTime.isAfter(moment())) {
            const message = `Take ${medication.medication_name} (${medication.dosage}). ${medication.instructions || ''}`;
            const messageRw = `Mufate ${medication.medication_name} (${medication.dosage}). ${medication.instructions || ''}`;

            reminders.push({
              type: 'medication',
              reference_id: medication.id,
              patient_id: patient.id,
              scheduled_time: scheduledTime.toDate(),
              message,
              message_kinyarwanda: messageRw,
              status: 'pending',
            });
          }
        }

        // Move to next day
        currentDate.add(1, 'day');
      }

      // Insert reminders in batches
      if (reminders.length > 0) {
        for (const reminder of reminders) {
          await query(
            `INSERT INTO reminders 
             (type, reference_id, patient_id, scheduled_time, message, message_kinyarwanda, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              reminder.type,
              reminder.reference_id,
              reminder.patient_id,
              reminder.scheduled_time,
              reminder.message,
              reminder.message_kinyarwanda,
              reminder.status,
            ]
          );
        }

        logger.info(`Scheduled ${reminders.length} medication reminders`, {
          medicationId: medication.id,
          patientId: patient.id,
        });
      }
    } catch (error) {
      logger.error('Error scheduling medication reminders:', error);
      throw error;
    }
  }

  // Parse frequency string (e.g., "twice daily", "every 8 hours")
  parseFrequency(frequency) {
    const lower = frequency.toLowerCase();
    const times = [];

    if (lower.includes('once daily') || lower.includes('once a day')) {
      times.push({ hour: 9, minute: 0 }); // Default to 9 AM
    } else if (lower.includes('twice daily') || lower.includes('twice a day')) {
      times.push({ hour: 9, minute: 0 });
      times.push({ hour: 21, minute: 0 }); // 9 AM and 9 PM
    } else if (lower.includes('three times daily') || lower.includes('three times a day')) {
      times.push({ hour: 8, minute: 0 });
      times.push({ hour: 14, minute: 0 });
      times.push({ hour: 20, minute: 0 });
    } else if (lower.includes('every 8 hours')) {
      times.push({ hour: 8, minute: 0 });
      times.push({ hour: 16, minute: 0 });
      times.push({ hour: 0, minute: 0 });
    } else if (lower.includes('every 12 hours')) {
      times.push({ hour: 8, minute: 0 });
      times.push({ hour: 20, minute: 0 });
    } else {
      // Default to once daily
      times.push({ hour: 9, minute: 0 });
    }

    return { times };
  }
}

module.exports = new ReminderScheduler();

