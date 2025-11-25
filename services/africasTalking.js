const axios = require('axios');
const logger = require('../config/logger');

class AfricasTalkingService {
  constructor() {
    this.apiKey = process.env.AT_API_KEY;
    this.username = process.env.AT_USERNAME;
    this.senderId = process.env.AT_SENDER_ID || 'HEALTH_RW';
    this.baseURL = 'https://api.africastalking.com/version1';
  }

  // Send SMS
  async sendSMS(phoneNumber, message) {
    try {
      if (!this.apiKey || !this.username) {
        logger.warn('Africa\'s Talking API credentials not configured');
        return { success: false, message: 'SMS service not configured' };
      }

      // Format phone number (ensure it starts with +)
      const formattedPhone = phoneNumber.startsWith('+') 
        ? phoneNumber 
        : `+${phoneNumber}`;

      const response = await axios.post(
        `${this.baseURL}/messaging`,
        {
          username: this.username,
          to: formattedPhone,
          message: message,
          from: this.senderId,
        },
        {
          headers: {
            'ApiKey': this.apiKey,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
        }
      );

      logger.info('SMS sent successfully', { 
        phoneNumber: formattedPhone, 
        response: response.data 
      });

      return {
        success: true,
        messageId: response.data?.SMSMessageData?.Recipients?.[0]?.messageId,
        status: response.data?.SMSMessageData?.Recipients?.[0]?.status,
        data: response.data,
      };
    } catch (error) {
      logger.error('SMS sending error', {
        phoneNumber,
        error: error.message,
        response: error.response?.data,
      });

      return {
        success: false,
        error: error.message,
        data: error.response?.data,
      };
    }
  }

  // Send SMS in both languages
  async sendBilingualSMS(phoneNumber, messageEn, messageRw, preferredLanguage = 'en') {
    const message = preferredLanguage === 'rw' ? messageRw : messageEn;
    return this.sendSMS(phoneNumber, message);
  }

  // Format appointment reminder message
  formatAppointmentReminder(appointment, language = 'en') {
    const date = new Date(appointment.appointment_date).toLocaleDateString();
    const time = appointment.appointment_time;

    if (language === 'rw') {
      return `Mwibuke: Mufite randevu kuri ${appointment.health_center_name || 'Ihuriro ry\'Ubuzima'} kuwa ${date} saa ${time}. Murakaza neza!`;
    }

    return `Reminder: You have an appointment at ${appointment.health_center_name || 'Health Center'} on ${date} at ${time}. Please arrive on time!`;
  }

  // Format medication reminder message
  formatMedicationReminder(medication, language = 'en') {
    if (language === 'rw') {
      return `Mwibuke: Mufate ${medication.medication_name} (${medication.dosage}). ${medication.instructions || ''}`;
    }

    return `Reminder: Take ${medication.medication_name} (${medication.dosage}). ${medication.instructions || ''}`;
  }
}

module.exports = new AfricasTalkingService();

