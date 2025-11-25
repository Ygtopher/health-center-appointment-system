const { query, transaction } = require('../config/database');
const logger = require('../config/logger');
const moment = require('moment');
const { validationResult } = require('express-validator');

class AppointmentController {
  // Get all appointments with filters
  async getAppointments(req, res) {
    try {
      const {
        healthCenterId,
        patientId,
        status,
        startDate,
        endDate,
        page = 1,
        limit = 50,
      } = req.query;

      let queryText = `
        SELECT 
          a.id,
          a.appointment_date,
          a.appointment_time,
          a.status,
          a.appointment_type,
          a.reason,
          a.notes,
          a.created_at,
          p.id as patient_id,
          p.national_id,
          p.first_name,
          p.last_name,
          p.phone_number,
          hc.id as health_center_id,
          hc.name as health_center_name,
          hc.name_kinyarwanda as health_center_name_kinyarwanda,
          u.first_name || ' ' || u.last_name as created_by_name
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN health_centers hc ON a.health_center_id = hc.id
        LEFT JOIN users u ON a.created_by = u.id
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 1;

      if (healthCenterId) {
        queryText += ` AND a.health_center_id = $${paramCount}`;
        params.push(healthCenterId);
        paramCount++;
      }

      if (patientId) {
        queryText += ` AND a.patient_id = $${paramCount}`;
        params.push(patientId);
        paramCount++;
      }

      if (status) {
        queryText += ` AND a.status = $${paramCount}`;
        params.push(status);
        paramCount++;
      }

      if (startDate) {
        queryText += ` AND a.appointment_date >= $${paramCount}`;
        params.push(startDate);
        paramCount++;
      }

      if (endDate) {
        queryText += ` AND a.appointment_date <= $${paramCount}`;
        params.push(endDate);
        paramCount++;
      }

      // If user is health staff, filter by their health center
      if (req.user.role === 'health_staff' && req.user.health_center_id) {
        queryText += ` AND a.health_center_id = $${paramCount}`;
        params.push(req.user.health_center_id);
        paramCount++;
      }

      queryText += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC`;

      // Pagination
      const offset = (page - 1) * limit;
      queryText += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, offset);

      const result = await query(queryText, params);

      // Get total count
      const countQuery = queryText.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM').replace(/ORDER BY.*/, '').replace(/LIMIT.*/, '');
      const countResult = await query(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0]?.total || 0);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error fetching appointments:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching appointments',
        error: error.message,
      });
    }
  }

  // Get single appointment
  async getAppointment(req, res) {
    try {
      const { id } = req.params;

      const result = await query(
        `SELECT 
          a.*,
          p.national_id,
          p.first_name,
          p.last_name,
          p.phone_number,
          p.date_of_birth,
          p.gender,
          hc.name as health_center_name,
          hc.name_kinyarwanda as health_center_name_kinyarwanda,
          u.first_name || ' ' || u.last_name as created_by_name
         FROM appointments a
         JOIN patients p ON a.patient_id = p.id
         JOIN health_centers hc ON a.health_center_id = hc.id
         LEFT JOIN users u ON a.created_by = u.id
         WHERE a.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found',
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      logger.error('Error fetching appointment:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching appointment',
        error: error.message,
      });
    }
  }

  // Create appointment
  async createAppointment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const {
        patientId,
        healthCenterId,
        appointmentDate,
        appointmentTime,
        appointmentType = 'general',
        reason,
        notes,
      } = req.body;

      // Check availability
      const existing = await query(
        `SELECT COUNT(*) as count FROM appointments
         WHERE health_center_id = $1
         AND appointment_date = $2
         AND appointment_time = $3
         AND status IN ('scheduled', 'confirmed')`,
        [healthCenterId, appointmentDate, appointmentTime]
      );

      if (parseInt(existing.rows[0].count) > 0) {
        return res.status(400).json({
          success: false,
          message: 'Time slot already booked',
        });
      }

      // Create appointment
      const result = await query(
        `INSERT INTO appointments 
         (patient_id, health_center_id, appointment_date, appointment_time, 
          appointment_type, reason, notes, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled', $8)
         RETURNING *`,
        [
          patientId,
          healthCenterId,
          appointmentDate,
          appointmentTime,
          appointmentType,
          reason,
          notes,
          req.user.id,
        ]
      );

      const appointment = result.rows[0];

      // Schedule reminder
      const reminderTime = moment(appointmentDate).subtract(24, 'hours').toDate();
      await query(
        `INSERT INTO reminders (type, reference_id, patient_id, scheduled_time, message, message_kinyarwanda, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
        [
          'appointment',
          appointment.id,
          patientId,
          reminderTime,
          `Reminder: You have an appointment on ${appointmentDate} at ${appointmentTime}`,
          `Mwibuke: Mufite randevu kuwa ${appointmentDate} saa ${appointmentTime}`,
        ]
      );

      res.status(201).json({
        success: true,
        message: 'Appointment created successfully',
        data: appointment,
      });
    } catch (error) {
      logger.error('Error creating appointment:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating appointment',
        error: error.message,
      });
    }
  }

  // Update appointment
  async updateAppointment(req, res) {
    try {
      const { id } = req.params;
      const {
        appointmentDate,
        appointmentTime,
        status,
        reason,
        notes,
      } = req.body;

      // Get existing appointment
      const existing = await query(
        'SELECT * FROM appointments WHERE id = $1',
        [id]
      );

      if (existing.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found',
        });
      }

      // Build update query
      const updates = [];
      const params = [];
      let paramCount = 1;

      if (appointmentDate) {
        updates.push(`appointment_date = $${paramCount}`);
        params.push(appointmentDate);
        paramCount++;
      }

      if (appointmentTime) {
        updates.push(`appointment_time = $${paramCount}`);
        params.push(appointmentTime);
        paramCount++;
      }

      if (status) {
        updates.push(`status = $${paramCount}`);
        params.push(status);
        paramCount++;

        if (status === 'cancelled') {
          updates.push(`cancelled_at = CURRENT_TIMESTAMP`);
        } else if (status === 'completed') {
          updates.push(`completed_at = CURRENT_TIMESTAMP`);
        }
      }

      if (reason !== undefined) {
        updates.push(`reason = $${paramCount}`);
        params.push(reason);
        paramCount++;
      }

      if (notes !== undefined) {
        updates.push(`notes = $${paramCount}`);
        params.push(notes);
        paramCount++;
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update',
        });
      }

      params.push(id);
      const result = await query(
        `UPDATE appointments 
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        params
      );

      res.json({
        success: true,
        message: 'Appointment updated successfully',
        data: result.rows[0],
      });
    } catch (error) {
      logger.error('Error updating appointment:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating appointment',
        error: error.message,
      });
    }
  }

  // Cancel appointment
  async cancelAppointment(req, res) {
    try {
      const { id } = req.params;
      const { cancellationReason } = req.body;

      const result = await query(
        `UPDATE appointments 
         SET status = 'cancelled',
             cancelled_at = CURRENT_TIMESTAMP,
             cancellation_reason = $1
         WHERE id = $2
         RETURNING *`,
        [cancellationReason, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found',
        });
      }

      // Cancel related reminders
      await query(
        `UPDATE reminders 
         SET status = 'cancelled'
         WHERE type = 'appointment' AND reference_id = $1 AND status = 'pending'`,
        [id]
      );

      res.json({
        success: true,
        message: 'Appointment cancelled successfully',
        data: result.rows[0],
      });
    } catch (error) {
      logger.error('Error cancelling appointment:', error);
      res.status(500).json({
        success: false,
        message: 'Error cancelling appointment',
        error: error.message,
      });
    }
  }

  // Get available time slots
  async getAvailableSlots(req, res) {
    try {
      const { healthCenterId, date } = req.query;

      if (!healthCenterId || !date) {
        return res.status(400).json({
          success: false,
          message: 'healthCenterId and date are required',
        });
      }

      // Get health center operating hours
      const hcResult = await query(
        'SELECT operating_hours FROM health_centers WHERE id = $1',
        [healthCenterId]
      );

      if (hcResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Health center not found',
        });
      }

      const operatingHours = hcResult.rows[0].operating_hours;
      const dayName = moment(date).format('dddd').toLowerCase();
      const hours = operatingHours[dayName];

      if (!hours || hours.open === 'closed') {
        return res.json({
          success: true,
          data: [],
          message: 'Health center is closed on this day',
        });
      }

      // Generate time slots
      const slots = [];
      const [openHour, openMin] = hours.open.split(':').map(Number);
      const [closeHour, closeMin] = hours.close.split(':').map(Number);

      let currentHour = openHour;
      let currentMin = openMin;

      while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
        const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
        
        // Check availability
        const existing = await query(
          `SELECT COUNT(*) as count FROM appointments
           WHERE health_center_id = $1
           AND appointment_date = $2
           AND appointment_time = $3
           AND status IN ('scheduled', 'confirmed')`,
          [healthCenterId, date, timeStr]
        );

        const bookedCount = parseInt(existing.rows[0].count);
        slots.push({
          time: timeStr,
          available: bookedCount < 5, // Max 5 per slot
          bookedCount,
        });

        currentMin += 30;
        if (currentMin >= 60) {
          currentMin = 0;
          currentHour++;
        }
      }

      res.json({
        success: true,
        data: slots,
      });
    } catch (error) {
      logger.error('Error getting available slots:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting available slots',
        error: error.message,
      });
    }
  }
}

module.exports = new AppointmentController();

