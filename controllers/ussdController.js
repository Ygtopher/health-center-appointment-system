const { query, transaction } = require('../config/database');
const ussdHandler = require('../utils/ussd');
const logger = require('../config/logger');
const moment = require('moment');

class USSDController {
  // Main USSD endpoint
  async handleUSSD(req, res) {
    try {
      const {
        sessionId,
        phoneNumber,
        text,
        serviceCode,
      } = req.body;

      // Get or create session first
      const session = ussdHandler.getSession(sessionId, phoneNumber);

      // Use session language (which persists across requests)
      const language = session.language || 'en';

      // Log incoming request for debugging
      logger.info('USSD Request:', { sessionId, phoneNumber, text, serviceCode, language: session.language });

      // If no text, show main menu
      if (!text || text.trim() === '') {
        const response = ussdHandler.formatResponse(
          ussdHandler.getMenuText('main', language),
          false
        );
        logger.info('Showing main menu:', response.response);
        return res.status(200).send(response.response);
      }

      // Process input - extract just the user input (remove service code if present)
      // Africa's Talking may send text like "*384*22787*1#" or just "1"
      let userInput = text.trim();
      // If text contains asterisks, extract the last part after the last asterisk
      if (userInput.includes('*')) {
        const parts = userInput.split('*');
        userInput = parts[parts.length - 1].replace('#', '').trim();
      }
      // Remove any remaining # characters
      userInput = userInput.replace(/#/g, '').trim();

      logger.info('Processing input:', { userInput, currentStep: session.step, language: session.language });
      let response = await ussdHandler.processInput(sessionId, phoneNumber, userInput, language);

      // Ensure response is properly formatted
      if (!response || !response.response) {
        logger.error('Invalid response from processInput:', response);
        return res.status(200).send(
          language === 'rw'
            ? 'Ikibazo cyahagaragaye. Ongera ugerageze.'
            : 'An error occurred. Please try again.'
        );
      }

      // Handle specific steps that need database interaction
      if (session.step === 'select_health_center' && !session.data.healthCenters) {
        // Fetch health centers
        const centers = await query(
          'SELECT id, name, name_kinyarwanda, code FROM health_centers WHERE is_active = true ORDER BY name'
        );
        session.data.healthCenters = centers.rows;
        response = ussdHandler.formatResponse(
          ussdHandler.getMenuText('select_health_center', language, session.data),
          false
        );
      }

      if (session.step === 'select_time' && session.data.selectedHealthCenter && session.data.selectedDate) {
        // Generate available time slots
        const timeSlots = await this.getAvailableTimeSlots(
          session.data.selectedHealthCenter.id,
          session.data.selectedDate
        );
        session.data.timeSlots = timeSlots;
        response = ussdHandler.formatResponse(
          ussdHandler.getMenuText('select_time', language, session.data),
          false
        );
      }

      if (session.step === 'booking_confirmed') {
        // Create appointment
        const appointment = await this.createAppointment(session, phoneNumber);
        if (appointment.success) {
          response = ussdHandler.formatResponse(
            language === 'rw'
              ? `Randevu yagenwe neza! Numero: ${appointment.appointmentId}. Uzabona SMS yibuka.`
              : `Appointment booked successfully! Number: ${appointment.appointmentId}. You will receive a reminder SMS.`,
            true
          );
        } else {
          response = ussdHandler.formatResponse(
            language === 'rw'
              ? `Ntibyashoboye gugena randevu: ${appointment.error}`
              : `Could not book appointment: ${appointment.error}`,
            true
          );
        }
        ussdHandler.clearSession(sessionId);
      }

      if (session.step === 'list_appointments' && session.data.nationalId) {
        // List appointments for cancellation
        const appointments = await this.getPatientAppointments(session.data.nationalId);
        if (appointments.length > 0) {
          session.data.appointments = appointments;
          const listText = this.formatAppointmentList(appointments, language);
          response = ussdHandler.formatResponse(
            `${listText}\n\n${language === 'rw' ? 'Hitamo randevu (Injiza numero):' : 'Select appointment (Enter number):'}`,
            false
          );
          session.step = 'cancel_selected';
        } else {
          response = ussdHandler.formatResponse(
            language === 'rw'
              ? 'Nta randevu ziboneka.'
              : 'No appointments found.',
            true
          );
          ussdHandler.clearSession(sessionId);
        }
      }

      if (session.step === 'cancellation_confirmed' && session.data.selectedAppointment) {
        // Cancel the selected appointment
        const cancelResult = await this.cancelAppointment(session.data.selectedAppointment.id);
        if (cancelResult.success) {
          response = ussdHandler.formatResponse(
            language === 'rw'
              ? 'Randevu yakuweho neza.'
              : 'Appointment cancelled successfully.',
            true
          );
        } else {
          response = ussdHandler.formatResponse(
            language === 'rw'
              ? `Ntibyashoboye gukuraho randevu: ${cancelResult.error}`
              : `Could not cancel appointment: ${cancelResult.error}`,
            true
          );
        }
        ussdHandler.clearSession(sessionId);
      }

      if (session.step === 'show_status' && session.data.nationalId) {
        // Show appointment status
        const appointments = await this.getPatientAppointments(session.data.nationalId);
        if (appointments.length > 0) {
          const statusText = this.formatAppointmentStatus(appointments[0], language);
          response = ussdHandler.formatResponse(statusText, true);
        } else {
          response = ussdHandler.formatResponse(
            language === 'rw'
              ? 'Nta randevu ziboneka.'
              : 'No appointments found.',
            true
          );
        }
        ussdHandler.clearSession(sessionId);
      }

      logger.info('Sending USSD response:', { step: session.step, response: response.response });
      res.status(200).send(response.response);
    } catch (error) {
      logger.error('USSD handler error:', error);
      const language = req.body.language || 'en';
      res.status(200).send(
        language === 'rw'
          ? 'Ikibazo cyahagaragaye. Ongera ugerageze.'
          : 'An error occurred. Please try again.'
      );
    }
  }

  // Get available time slots for a health center and date
  async getAvailableTimeSlots(healthCenterId, dateString) {
    try {
      // Parse date
      const [day, month, year] = dateString.split('-');
      const appointmentDate = new Date(`${year}-${month}-${day}`);

      // Get health center operating hours
      const hcResult = await query(
        'SELECT operating_hours, capacity FROM health_centers WHERE id = $1',
        [healthCenterId]
      );

      if (hcResult.rows.length === 0) {
        return [];
      }

      const operatingHours = hcResult.rows[0].operating_hours;
      const dayName = moment(appointmentDate).format('dddd').toLowerCase();
      const hours = operatingHours[dayName];

      if (!hours || hours.open === 'closed') {
        return [];
      }

      // Generate time slots (every 30 minutes)
      const slots = [];
      const [openHour, openMin] = hours.open.split(':').map(Number);
      const [closeHour, closeMin] = hours.close.split(':').map(Number);

      let currentHour = openHour;
      let currentMin = openMin;

      while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
        const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

        // Check if slot is available
        const existingAppt = await query(
          `SELECT COUNT(*) as count FROM appointments 
           WHERE health_center_id = $1 
           AND appointment_date = $2 
           AND appointment_time = $3 
           AND status IN ('scheduled', 'confirmed')`,
          [healthCenterId, appointmentDate.toISOString().split('T')[0], timeStr]
        );

        if (parseInt(existingAppt.rows[0].count) < 5) { // Max 5 appointments per slot
          slots.push(timeStr);
        }

        currentMin += 30;
        if (currentMin >= 60) {
          currentMin = 0;
          currentHour++;
        }
      }

      return slots.slice(0, 10); // Return max 10 slots
    } catch (error) {
      logger.error('Error getting time slots:', error);
      return [];
    }
  }

  // Create appointment from USSD session
  async createAppointment(session, phoneNumber) {
    try {
      const { nationalId, selectedHealthCenter, selectedDate, selectedTime, appointmentType } = session.data;

      // Verify or create patient
      let patientResult = await query(
        'SELECT id FROM patients WHERE national_id = $1',
        [nationalId]
      );

      let patientId;
      if (patientResult.rows.length === 0) {
        // Create basic patient record
        const newPatient = await query(
          `INSERT INTO patients (national_id, phone_number, first_name, last_name) 
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [nationalId, phoneNumber, 'USSD', 'User']
        );
        patientId = newPatient.rows[0].id;
      } else {
        patientId = patientResult.rows[0].id;
        // Update phone number if different
        await query(
          'UPDATE patients SET phone_number = $1, preferred_language = $2 WHERE id = $3',
          [phoneNumber, session.language, patientId]
        );
      }

      // Convert date format from DD-MM-YYYY to YYYY-MM-DD
      const [day, month, year] = selectedDate.split('-');
      const formattedDate = `${year}-${month}-${day}`;

      // Create appointment with appointment type
      const appointment = await query(
        `INSERT INTO appointments 
         (patient_id, health_center_id, appointment_date, appointment_time, appointment_type, status, reason) 
         VALUES ($1, $2, $3, $4, $5, 'scheduled', 'Booked via USSD') 
         RETURNING id`,
        [patientId, selectedHealthCenter.id, formattedDate, selectedTime, appointmentType || 'general']
      );

      const appointmentId = appointment.rows[0].id;

      // Get full appointment details for SMS
      const fullAppointment = await query(
        `SELECT a.*, hc.name as health_center_name, hc.name_kinyarwanda as health_center_name_kinyarwanda
         FROM appointments a
         JOIN health_centers hc ON a.health_center_id = hc.id
         WHERE a.id = $1`,
        [appointmentId]
      );

      const healthCenter = fullAppointment.rows[0];

      // Schedule 24-hour reminder
      const appointmentDateTime = new Date(`${formattedDate}T${selectedTime}`);
      const reminderTime24h = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000);

      if (reminderTime24h > new Date()) {
        const message = `Reminder: You have an appointment at ${healthCenter.health_center_name} on ${selectedDate} at ${selectedTime}`;
        const messageRw = `Ibutsa: Ufite randevu kuri ${healthCenter.health_center_name_kinyarwanda || healthCenter.health_center_name} ku wa ${selectedDate} ku isaha ${selectedTime}`;

        await query(
          `INSERT INTO reminders (type, reference_id, patient_id, scheduled_time, message, message_kinyarwanda, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
          ['appointment', appointmentId, patientId, reminderTime24h, message, messageRw]
        );
      }

      // Schedule 2-minute reminder
      const reminderTime2min = new Date(appointmentDateTime.getTime() - 2 * 60 * 1000);

      if (reminderTime2min > new Date()) {
        const message = `Your appointment at ${healthCenter.health_center_name} is starting in 2 minutes. Please be ready.`;
        const messageRw = `Randevu yawe kuri ${healthCenter.health_center_name_kinyarwanda || healthCenter.health_center_name} itangira mu minota 2. Witegure.`;

        await query(
          `INSERT INTO reminders (type, reference_id, patient_id, scheduled_time, message, message_kinyarwanda, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
          ['appointment', appointmentId, patientId, reminderTime2min, message, messageRw]
        );
      }

      // Send confirmation SMS with appointment details
      if (process.env.SMS_ENABLED === 'true') {
        const africastalkingService = require('../services/africasTalking');
        const patientInfo = await query(
          'SELECT phone_number, preferred_language FROM patients WHERE id = $1',
          [patientId]
        );

        if (patientInfo.rows.length > 0) {
          const patient = patientInfo.rows[0];
          const appointmentData = {
            ...fullAppointment.rows[0],
            health_center_name: fullAppointment.rows[0].health_center_name,
            health_center_name_kinyarwanda: fullAppointment.rows[0].health_center_name_kinyarwanda,
          };

          await africastalkingService.sendAppointmentConfirmation(
            patient,
            appointmentData,
            patient.preferred_language || session.language
          );
        }
      }

      return { success: true, appointmentId };
    } catch (error) {
      logger.error('Error creating appointment:', error);
      return { success: false, error: error.message };
    }
  }

  // Get patient appointments
  async getPatientAppointments(nationalId) {
    try {
      const result = await query(
        `SELECT a.id, a.appointment_date, a.appointment_time, a.status, hc.name, hc.name_kinyarwanda
         FROM appointments a
         JOIN patients p ON a.patient_id = p.id
         JOIN health_centers hc ON a.health_center_id = hc.id
         WHERE p.national_id = $1 
         AND a.appointment_date >= CURRENT_DATE
         AND a.status IN ('scheduled', 'confirmed')
         ORDER BY a.appointment_date, a.appointment_time
         LIMIT 5`,
        [nationalId]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error getting appointments:', error);
      return [];
    }
  }

  // Format appointment list for USSD
  formatAppointmentList(appointments, language) {
    return appointments.map((apt, idx) => {
      const date = moment(apt.appointment_date).format('DD-MM-YYYY');
      const name = language === 'rw' ? apt.name_kinyarwanda || apt.name : apt.name;
      return `${idx + 1}. ${name} - ${date} ${apt.appointment_time}`;
    }).join('\n');
  }

  // Format appointment status
  formatAppointmentStatus(appointment, language) {
    const date = moment(appointment.appointment_date).format('DD-MM-YYYY');
    const name = language === 'rw' ? appointment.name_kinyarwanda || appointment.name : appointment.name;

    if (language === 'rw') {
      return `Randevu:\n${name}\nItariki: ${date}\nIgihe: ${appointment.appointment_time}\nImiterere: ${appointment.status}`;
    }

    return `Appointment:\n${name}\nDate: ${date}\nTime: ${appointment.appointment_time}\nStatus: ${appointment.status}`;
  }

  // Cancel appointment from USSD
  async cancelAppointment(appointmentId) {
    try {
      // Check if appointment exists and is cancellable
      const appointmentResult = await query(
        `SELECT id, status FROM appointments 
         WHERE id = $1 AND status IN ('scheduled', 'confirmed')`,
        [appointmentId]
      );

      if (appointmentResult.rows.length === 0) {
        return { success: false, error: 'Appointment not found or cannot be cancelled' };
      }

      // Cancel the appointment
      await query(
        `UPDATE appointments 
         SET status = 'cancelled',
             cancelled_at = CURRENT_TIMESTAMP,
             cancellation_reason = 'Cancelled via USSD'
         WHERE id = $1`,
        [appointmentId]
      );

      // Cancel related reminders
      await query(
        `UPDATE reminders 
         SET status = 'cancelled'
         WHERE type = 'appointment' AND reference_id = $1 AND status = 'pending'`,
        [appointmentId]
      );

      logger.info(`Appointment cancelled via USSD: ${appointmentId}`);
      return { success: true };
    } catch (error) {
      logger.error('Error cancelling appointment:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new USSDController();

