const axios = require('axios');
const logger = require('../config/logger');

class AfricasTalkingService {
  constructor() {
    this.apiKey = process.env.AT_API_KEY;
    this.username = process.env.AT_USERNAME;
    this.senderId = process.env.AT_SENDER_ID || 'HEALTH_RW';
    // Use sandbox host when username is "sandbox"
    const isSandbox = (this.username || '').toLowerCase() === 'sandbox';
    this.baseURL = isSandbox
      ? 'https://api.sandbox.africastalking.com/version1'
      : 'https://api.africastalking.com/version1';
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

      const payload = new URLSearchParams({
        username: this.username,
        to: formattedPhone,
        message: message,
        from: this.senderId,
      });

      const response = await axios.post(`${this.baseURL}/messaging`, payload, {
        headers: {
          'ApiKey': this.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
      });

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

  // Format detailed appointment confirmation SMS
  formatAppointmentDetails(appointment, language = 'en') {
    const moment = require('moment');
    const date = moment(appointment.appointment_date).format('DD-MM-YYYY');
    const time = appointment.appointment_time;
    const hcName = language === 'rw'
      ? appointment.health_center_name_kinyarwanda || appointment.health_center_name
      : appointment.health_center_name;

    const appointmentType = appointment.appointment_type || 'general';
    const reason = appointment.reason ? `\nReason: ${appointment.reason}` : '';
    const notes = appointment.notes ? `\nNotes: ${appointment.notes}` : '';
    const appointmentId = appointment.id ? `\nRef: ${appointment.id.substring(0, 8)}` : '';

    // Different messages based on status
    const status = appointment.status || 'scheduled';
    const isConfirmed = status === 'confirmed';

    if (language === 'rw') {
      if (isConfirmed) {
        return `Randevu yemejwe neza!\n\nIhuriro: ${hcName}\nItariki: ${date}\nIgihe: ${time}\nImiterere: Yemejwe${appointmentId}${reason ? '\nImpamvu: ' + appointment.reason : ''}${notes ? '\nInyandiko: ' + appointment.notes : ''}\n\nUzabona SMS yibuka 24h mbere. Gukuraho: SMS "CANCEL" cyangwa *384*22787#`;
      }
      return `Randevu yagenwe neza!\n\nIhuriro: ${hcName}\nItariki: ${date}\nIgihe: ${time}\nImiterere: ${status}${appointmentId}\n\nUzabona SMS yibuka 24h mbere. Gukuraho: SMS "CANCEL" cyangwa *384*22787#`;
    }

    if (isConfirmed) {
      return `Appointment Confirmed!\n\nHealth Center: ${hcName}\nDate: ${date}\nTime: ${time}\nStatus: Confirmed${appointmentId}${reason}${notes}\n\nYou'll receive a reminder 24h before. Cancel: SMS "CANCEL" or *384*22787#`;
    }

    return `Appointment Booked!\n\nHealth Center: ${hcName}\nDate: ${date}\nTime: ${time}\nStatus: ${status}${appointmentId}${reason}${notes}\n\nYou'll receive a reminder 24h before. Cancel: SMS "CANCEL" or *384*22787#`;
  }

  // Send appointment confirmation SMS with details
  async sendAppointmentConfirmation(patient, appointment, language = 'en') {
    try {
      const message = this.formatAppointmentDetails(appointment, language);
      return await this.sendSMS(patient.phone_number, message);
    } catch (error) {
      logger.error('Error sending appointment confirmation:', error);
      return { success: false, error: error.message };
    }
  }

  // Format cancellation message
  formatAppointmentCancellation(appointment, language = 'en') {
    const moment = require('moment');
    const date = moment(appointment.appointment_date).format('DD-MM-YYYY');
    const time = appointment.appointment_time;
    const hcName = language === 'rw'
      ? appointment.health_center_name_kinyarwanda || appointment.health_center_name
      : appointment.health_center_name;
    const appointmentId = appointment.id ? `\nRef: ${appointment.id.substring(0, 8)}` : '';
    const reason = appointment.cancellation_reason ? `\nReason: ${appointment.cancellation_reason}` : '';

    if (language === 'rw') {
      return `Randevu yakuweho.\n\nIhuriro: ${hcName}\nItariki: ${date}\nIgihe: ${time}${appointmentId}${reason}\n\nGusubizaho: *384*22787# cyangwa SMS "STATUS" kuri 22787.`;
    }

    return `Your appointment has been cancelled.\n\nHealth Center: ${hcName}\nDate: ${date}\nTime: ${time}${appointmentId}${reason}\n\nTo rebook dial *384*22787# or SMS "STATUS" to 22787.`;
  }

  // Send cancellation SMS
  async sendAppointmentCancellation(patient, appointment, language = 'en') {
    try {
      const message = this.formatAppointmentCancellation(appointment, language);
      return await this.sendSMS(patient.phone_number, message);
    } catch (error) {
      logger.error('Error sending appointment cancellation:', error);
      return { success: false, error: error.message };
    }
  }

  // Format prescription summary SMS
  formatPrescriptionDetails(prescription, medications = [], language = 'en') {
    const moment = require('moment');
    const date = moment(prescription.prescription_date || new Date()).format('DD-MM-YYYY');
    const hcName = prescription.health_center_name || 'Health Center';

    // Format each medication with clear labels
    const medsList = medications.slice(0, 3).map((m) => {
      if (language === 'rw') {
        return `Umuti: ${m.medication_name}\nIngano: ${m.dosage || 'N/A'}\nInshuro: ${m.frequency || 'N/A'}\nIminsi: ${m.duration_days || 'N/A'}`;
      }
      return `Medication: ${m.medication_name}\nDosage: ${m.dosage || 'N/A'}\nFrequency: ${m.frequency || 'N/A'}\nDays: ${m.duration_days || 'N/A'}`;
    }).join('\n\n');

    const more = medications.length > 3 ? `\n(+${medications.length - 3} more medications)` : '';

    if (language === 'rw') {
      return `Inyandiko y'ibikoresho yatanzwe.\nItariki: ${date}\nIvuriro: ${hcName}\n\n${medsList}${more}\n\nMwibuke amabwiriza y'ukuntu mufata imiti.`;
    }

    return `Your prescription is ready.\nDate: ${date}\nHealth Center: ${hcName}\n\n${medsList}${more}\n\nFollow the dosage instructions.`;
  }

  // Send prescription details SMS
  async sendPrescriptionDetails(patient, prescription, medications = [], language = 'en') {
    try {
      const message = this.formatPrescriptionDetails(prescription, medications, language);
      return await this.sendSMS(patient.phone_number, message);
    } catch (error) {
      logger.error('Error sending prescription details:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new AfricasTalkingService();

