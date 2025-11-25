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

      // Determine language from phone number or default
      const language = req.body.language || 'en';

      // If no text, show main menu
      if (!text || text.trim() === '') {
        const session = ussdHandler.getSession(sessionId, phoneNumber);
        const response = ussdHandler.formatResponse(
          ussdHandler.getMenuText('main', language),
          false
        );
        return res.status(200).send(response.response);
      }

      // Process input
      const session = ussdHandler.getSession(sessionId, phoneNumber);
      let response = await ussdHandler.processInput(sessionId, phoneNumber, text, language);

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
      const { nationalId, selectedHealthCenter, selectedDate, selectedTime } = session.data;

      // Verify or create patient
      let patientResult = await query(
        'SELECT id FROM patients WHERE national_id = $1',
        [nationalId]
      );

      let patientId;
      if (patientResult.rows.length === 0) {
        // Create patient record
        const newPatient = await query(
          `INSERT INTO patients (national_id, first_name, last_name, phone_number, preferred_language)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [nationalId, 'Patient', 'Unknown', phoneNumber, session.language]
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

      // Parse date
      const [day, month, year] = selectedDate.split('-');
      const appointmentDate = new Date(`${year}-${month}-${day}`);

      // Create appointment
      const appointmentResult = await query(
        `INSERT INTO appointments 
         (patient_id, health_center_id, appointment_date, appointment_time, status, appointment_type)
         VALUES ($1, $2, $3, $4, 'scheduled', 'general')
         RETURNING id`,
        [patientId, selectedHealthCenter.id, appointmentDate.toISOString().split('T')[0], selectedTime]
      );

      const appointmentId = appointmentResult.rows[0].id;

      // Schedule reminder
      const reminderTime = moment(appointmentDate).subtract(24, 'hours').toDate();
      await query(
        `INSERT INTO reminders (type, reference_id, patient_id, scheduled_time, message, message_kinyarwanda, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
        [
          'appointment',
          appointmentId,
          patientId,
          reminderTime,
          `Reminder: You have an appointment on ${selectedDate} at ${selectedTime}`,
          `Mwibuke: Mufite randevu kuwa ${selectedDate} saa ${selectedTime}`,
        ]
      );

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
}

module.exports = new USSDController();

