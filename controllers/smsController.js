const { query } = require('../config/database');
const logger = require('../config/logger');
const africastalkingService = require('../services/africasTalking');

class SMSController {
  // Handle incoming SMS from Africa's Talking
  async receiveSMS(req, res) {
    try {
      // Log raw request for debugging
      logger.info('SMS endpoint hit - Raw request:', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        query: req.query,
        rawBody: req.body,
        bodyType: typeof req.body,
        bodyKeys: Object.keys(req.body || {}),
      });

      // Africa's Talking sends SMS data as form-urlencoded
      // All available fields from Africa's Talking documentation
      const {
        from,          // Sender's phone number
        to,            // Your short code or number
        text,          // Message content
        date,          // Timestamp when message was received
        id,            // Internal ID that Africa's Talking uses
        linkId,        // Link ID (required for premium messages)
        cost,          // Amount incurred (format: "KES 1.00" or "RWF 50.00")
        networkCode,   // Telco identifier (e.g., 63510 for MTN Rwanda)
      } = req.body;

      // Check if we received any data
      if (!from && !text && Object.keys(req.body || {}).length === 0) {
        logger.warn('SMS endpoint called but no data received:', {
          body: req.body,
          headers: req.headers['content-type'],
        });
        // Still return 200 to acknowledge
        return res.status(200).send('');
      }

      // Log all incoming SMS data for debugging
      logger.info('Incoming SMS received:', {
        id,
        from,
        to,
        text,
        date,
        linkId,
        cost,
        networkCode,
        rawBody: req.body, // Log full body for debugging
      });

      // Log the incoming SMS to database (optional)
      await this.logIncomingSMS({
        id,
        from,
        to,
        text,
        date,
        linkId,
        cost,
        networkCode,
      });

      // Process the SMS based on content
      const response = await this.processIncomingSMS(from, text);

      // Africa's Talking expects a response
      // Format: Empty string or acknowledgment message
      res.status(200).send(response || '');
    } catch (error) {
      logger.error('Error processing incoming SMS:', {
        error: error.message,
        stack: error.stack,
        body: req.body,
      });
      // Still return 200 to acknowledge receipt (important!)
      res.status(200).send('');
    }
  }

  // Process incoming SMS and determine response
  async processIncomingSMS(phoneNumber, message) {
    try {
      const normalizedMessage = message.trim().toLowerCase();
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

      // Find patient by phone number
      const patientResult = await query(
        'SELECT id, national_id, first_name, last_name, preferred_language FROM patients WHERE phone_number = $1 OR phone_number = $2',
        [phoneNumber, normalizedPhone]
      );

      if (patientResult.rows.length === 0) {
        logger.info('SMS from unknown number:', phoneNumber);
        // Could send a registration message or ignore
        return '';
      }

      const patient = patientResult.rows[0];
      const language = patient.preferred_language || 'en';

      // Handle different message types
      // Example: "STATUS" to check appointment status
      if (normalizedMessage === 'status' || normalizedMessage === 'imiterere' || normalizedMessage === 'reba') {
        return await this.handleStatusRequest(patient, language);
      }

      // Example: "CANCEL" to cancel appointment
      if (normalizedMessage === 'cancel' || normalizedMessage === 'kuraho' || normalizedMessage === 'gukuraho') {
        return await this.handleCancelRequest(patient, language);
      }

      // Example: "HELP" for help message
      if (normalizedMessage === 'help' || normalizedMessage === 'ubufasha' || normalizedMessage === 'fasha') {
        return this.getHelpMessage(language);
      }

      // Default: Send acknowledgment or help message
      logger.info('Unrecognized SMS command:', { phoneNumber, message });
      return this.getHelpMessage(language);
    } catch (error) {
      logger.error('Error processing SMS:', error);
      return '';
    }
  }

  // Handle status request via SMS
  async handleStatusRequest(patient, language) {
    try {
      const appointments = await query(
        `SELECT a.*, hc.name as health_center_name, hc.name_kinyarwanda as health_center_name_kinyarwanda
         FROM appointments a
         JOIN health_centers hc ON a.health_center_id = hc.id
         WHERE a.patient_id = $1 
         AND a.appointment_date >= CURRENT_DATE
         AND a.status IN ('scheduled', 'confirmed')
         ORDER BY a.appointment_date, a.appointment_time
         LIMIT 1`,
        [patient.id]
      );

      if (appointments.rows.length === 0) {
        const message = language === 'rw'
          ? 'Nta randevu ziboneka. Gena randevu gusa *384*22787#'
          : 'No appointments found. Book appointment: *384*22787#';
        await africastalkingService.sendSMS(patient.phone_number, message);
        return '';
      }

      const appointment = appointments.rows[0];
      
      // Use the detailed appointment formatting
      const message = africastalkingService.formatAppointmentDetails(appointment, language);
      await africastalkingService.sendSMS(patient.phone_number, message);
      return '';
    } catch (error) {
      logger.error('Error handling status request:', error);
      return '';
    }
  }

  // Handle cancel request via SMS
  async handleCancelRequest(patient, language) {
    try {
      const appointments = await query(
        `SELECT a.id, a.appointment_date, a.appointment_time, hc.name, hc.name_kinyarwanda
         FROM appointments a
         JOIN health_centers hc ON a.health_center_id = hc.id
         WHERE a.patient_id = $1 
         AND a.appointment_date >= CURRENT_DATE
         AND a.status IN ('scheduled', 'confirmed')
         ORDER BY a.appointment_date, a.appointment_time
         LIMIT 1`,
        [patient.id]
      );

      if (appointments.rows.length === 0) {
        const message = language === 'rw'
          ? 'Nta randevu ziboneka.'
          : 'No appointments found.';
        await africastalkingService.sendSMS(patient.phone_number, message);
        return '';
      }

      const appointment = appointments.rows[0];
      
      // Cancel the appointment
      await query(
        `UPDATE appointments 
         SET status = 'cancelled',
             cancelled_at = CURRENT_TIMESTAMP,
             cancellation_reason = 'Cancelled via SMS'
         WHERE id = $1`,
        [appointment.id]
      );

      // Cancel related reminders
      await query(
        `UPDATE reminders 
         SET status = 'cancelled'
         WHERE type = 'appointment' AND reference_id = $1 AND status = 'pending'`,
        [appointment.id]
      );

      const message = language === 'rw'
        ? `Randevu yakuweho neza. Itariki: ${new Date(appointment.appointment_date).toLocaleDateString()}`
        : `Appointment cancelled successfully. Date: ${new Date(appointment.appointment_date).toLocaleDateString()}`;

      await africastalkingService.sendSMS(patient.phone_number, message);
      return '';
    } catch (error) {
      logger.error('Error handling cancel request:', error);
      return '';
    }
  }

  // Get help message
  getHelpMessage(language) {
    if (language === 'rw') {
      return 'Ubufasha:\nSTATUS - Reba randevu\nCANCEL - Kuraho randevu\nHELP - Ubufasha\nGena randevu: *384*22787#';
    }
    return 'Help:\nSTATUS - Check appointment\nCANCEL - Cancel appointment\nHELP - This message\nBook: *384*22787#';
  }

  // Normalize phone number format
  normalizePhoneNumber(phoneNumber) {
    // Remove spaces, dashes, etc.
    let normalized = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // If doesn't start with +, add country code for Rwanda
    if (!normalized.startsWith('+')) {
      if (normalized.startsWith('250')) {
        normalized = '+' + normalized;
      } else if (normalized.startsWith('0')) {
        normalized = '+250' + normalized.substring(1);
      } else {
        normalized = '+250' + normalized;
      }
    }
    
    return normalized;
  }

  // Log incoming SMS to database (optional)
  async logIncomingSMS(smsData) {
    try {
      // Log all SMS data for debugging and audit
      logger.info('Incoming SMS logged:', {
        id: smsData.id,
        from: smsData.from,
        to: smsData.to,
        text: smsData.text,
        date: smsData.date,
        linkId: smsData.linkId,
        cost: smsData.cost,
        networkCode: smsData.networkCode,
        networkName: this.getNetworkName(smsData.networkCode),
      });
      
      // Optional: Store in database for audit trail
      // You can create a table like this:
      /*
      CREATE TABLE incoming_sms (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        at_message_id VARCHAR(255),
        from_number VARCHAR(20) NOT NULL,
        to_number VARCHAR(20) NOT NULL,
        message TEXT,
        received_at TIMESTAMP,
        link_id VARCHAR(255),
        cost VARCHAR(50),
        network_code VARCHAR(20),
        processed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      */
      
      // Then uncomment this:
      /*
      await query(
        `INSERT INTO incoming_sms 
         (at_message_id, from_number, to_number, message, received_at, link_id, cost, network_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          smsData.id,
          smsData.from,
          smsData.to,
          smsData.text,
          smsData.date,
          smsData.linkId,
          smsData.cost,
          smsData.networkCode,
        ]
      );
      */
    } catch (error) {
      logger.error('Error logging incoming SMS:', error);
    }
  }

  // Get network name from network code
  getNetworkName(networkCode) {
    const networks = {
      '63510': 'MTN Rwanda',
      '63513': 'Tigo Rwanda',
      '63514': 'Airtel Rwanda',
      '62120': 'Airtel Nigeria',
      '62130': 'MTN Nigeria',
      '62150': 'Glo Nigeria',
      '62160': 'Etisalat Nigeria',
      '63902': 'Safaricom',
      '63903': 'Airtel Kenya',
      '63907': 'Orange Kenya',
      '63999': 'Equitel Kenya',
      '64002': 'Tigo Tanzania',
      '64003': 'Zantel Tanzania',
      '64004': 'Vodacom Tanzania',
      '64005': 'Airtel Tanzania',
      '64007': 'TTCL Tanzania',
      '64009': 'Halotel Tanzania',
      '64101': 'Airtel Uganda',
      '64110': 'MTN Uganda',
      '64111': 'UTL Uganda',
      '64114': 'Africell Uganda',
      '65001': 'TNM Malawi',
      '65010': 'Airtel Malawi',
      '99999': 'Athena (Sandbox)',
    };
    return networks[networkCode] || `Unknown (${networkCode})`;
  }
}

module.exports = new SMSController();

