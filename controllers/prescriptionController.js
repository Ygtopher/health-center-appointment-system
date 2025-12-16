const { query, transaction } = require('../config/database');
const logger = require('../config/logger');
const reminderScheduler = require('../services/reminderScheduler');
const { validationResult } = require('express-validator');

class PrescriptionController {
  // Get all prescriptions
  async getPrescriptions(req, res) {
    try {
      const {
        patientId,
        healthCenterId,
        page = 1,
        limit = 50,
      } = req.query;

      let queryText = `
        SELECT 
          p.id,
          p.prescription_date,
          p.diagnosis,
          p.notes,
          p.is_active,
          p.created_at,
          pt.id as patient_id,
          pt.national_id,
          pt.first_name,
          pt.last_name,
          hc.name as health_center_name,
          u.first_name || ' ' || u.last_name as prescribed_by_name
        FROM prescriptions p
        JOIN patients pt ON p.patient_id = pt.id
        JOIN health_centers hc ON p.health_center_id = hc.id
        JOIN users u ON p.prescribed_by = u.id
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 1;

      if (patientId) {
        queryText += ` AND p.patient_id = $${paramCount}`;
        params.push(patientId);
        paramCount++;
      }

      if (healthCenterId) {
        queryText += ` AND p.health_center_id = $${paramCount}`;
        params.push(healthCenterId);
        paramCount++;
      }

      // If user is health staff, filter by their health center
      if (req.user.role === 'health_staff' && req.user.health_center_id) {
        queryText += ` AND p.health_center_id = $${paramCount}`;
        params.push(req.user.health_center_id);
        paramCount++;
      }

      // Sort: active prescriptions first, then by date (newest first)
      queryText += ` ORDER BY p.is_active DESC, p.prescription_date DESC, p.created_at DESC`;

      // Pagination
      const offset = (page - 1) * limit;
      queryText += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, offset);

      const result = await query(queryText, params);

      // Get medications for each prescription
      for (const prescription of result.rows) {
        const medications = await query(
          'SELECT * FROM medications WHERE prescription_id = $1 AND is_active = true',
          [prescription.id]
        );
        prescription.medications = medications.rows;
      }

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
      logger.error('Error fetching prescriptions:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching prescriptions',
        error: error.message,
      });
    }
  }

  // Get single prescription
  async getPrescription(req, res) {
    try {
      const { id } = req.params;

      const result = await query(
        `SELECT p.*, 
         pt.national_id, pt.first_name, pt.last_name, pt.phone_number,
         hc.name as health_center_name,
         u.first_name || ' ' || u.last_name as prescribed_by_name
         FROM prescriptions p
         JOIN patients pt ON p.patient_id = pt.id
         JOIN health_centers hc ON p.health_center_id = hc.id
         JOIN users u ON p.prescribed_by = u.id
         WHERE p.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Prescription not found',
        });
      }

      const prescription = result.rows[0];

      // Get medications
      const medications = await query(
        'SELECT * FROM medications WHERE prescription_id = $1',
        [id]
      );
      prescription.medications = medications.rows;

      res.json({
        success: true,
        data: prescription,
      });
    } catch (error) {
      logger.error('Error fetching prescription:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching prescription',
        error: error.message,
      });
    }
  }

  // Create prescription with medications
  async createPrescription(req, res) {
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
        prescriptionDate,
        diagnosis,
        notes,
        medications,
      } = req.body;

      // Get patient info for reminders
      const patientResult = await query(
        'SELECT * FROM patients WHERE id = $1',
        [patientId]
      );

      if (patientResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found',
        });
      }

      const patient = patientResult.rows[0];

      // Create prescription in transaction
      const prescription = await transaction(async (client) => {
        // Create prescription
        const prescriptionResult = await client.query(
          `INSERT INTO prescriptions 
           (patient_id, health_center_id, prescription_date, diagnosis, notes, prescribed_by)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [
            patientId,
            healthCenterId,
            prescriptionDate || new Date().toISOString().split('T')[0],
            diagnosis,
            notes,
            req.user.id,
          ]
        );

        const prescription = prescriptionResult.rows[0];

        // Create medications
        if (medications && medications.length > 0) {
          for (const med of medications) {
            const medResult = await client.query(
              `INSERT INTO medications 
               (prescription_id, medication_name, dosage, frequency, quantity, 
                duration_days, start_date, end_date, instructions)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               RETURNING *`,
              [
                prescription.id,
                med.medicationName,
                med.dosage,
                med.frequency,
                med.quantity,
                med.durationDays,
                med.startDate,
                med.endDate,
                med.instructions,
              ]
            );

            // Schedule medication reminders
            try {
              await reminderScheduler.scheduleMedicationReminders(
                medResult.rows[0],
                prescription,
                patient
              );
            } catch (reminderError) {
              logger.error('Error scheduling medication reminders:', reminderError);
              // Don't fail the prescription creation if reminders fail
            }
          }
        }

        return prescription;
      });

      // Fetch medications and health center for SMS
      if (process.env.SMS_ENABLED === 'true') {
        try {
          const africastalkingService = require('../services/africasTalking');

          // Reload medications with saved values
          const medsResult = await query(
            `SELECT medication_name, dosage, frequency, duration_days 
             FROM medications 
             WHERE prescription_id = $1 AND is_active = true`,
            [prescription.id]
          );

          // Get health center name
          const hcResult = await query(
            'SELECT name as health_center_name FROM health_centers WHERE id = $1',
            [healthCenterId]
          );

          const prescriptionForSms = {
            ...prescription,
            health_center_name: hcResult.rows[0]?.health_center_name,
          };

          await africastalkingService.sendPrescriptionDetails(
            patient,
            prescriptionForSms,
            medsResult.rows,
            patient.preferred_language || 'en'
          );
        } catch (smsError) {
          logger.error('Error sending prescription SMS:', smsError);
          // Do not fail the API call if SMS fails
        }
      }

      res.status(201).json({
        success: true,
        message: 'Prescription created successfully',
        data: prescription,
      });
    } catch (error) {
      logger.error('Error creating prescription:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating prescription',
        error: error.message,
      });
    }
  }

  // Update prescription
  async updatePrescription(req, res) {
    try {
      const { id } = req.params;
      const { diagnosis, notes, isActive, medications } = req.body;

      const updates = [];
      const params = [];
      let paramCount = 1;

      if (diagnosis !== undefined) {
        updates.push(`diagnosis = $${paramCount}`);
        params.push(diagnosis);
        paramCount++;
      }

      if (notes !== undefined) {
        updates.push(`notes = $${paramCount}`);
        params.push(notes);
        paramCount++;
      }

      if (isActive !== undefined) {
        updates.push(`is_active = $${paramCount}`);
        params.push(isActive);
        paramCount++;
      }

      // Update prescription and medications in transaction
      const result = await transaction(async (client) => {
        let prescription;

        // Update prescription if there are fields to update
        if (updates.length > 0) {
          params.push(id);
          const prescriptionResult = await client.query(
            `UPDATE prescriptions 
             SET ${updates.join(', ')}
             WHERE id = $${paramCount}
             RETURNING *`,
            params
          );

          if (prescriptionResult.rows.length === 0) {
            throw new Error('Prescription not found');
          }
          prescription = prescriptionResult.rows[0];
        } else {
          // Just fetch the prescription
          const prescriptionResult = await client.query(
            'SELECT * FROM prescriptions WHERE id = $1',
            [id]
          );
          if (prescriptionResult.rows.length === 0) {
            throw new Error('Prescription not found');
          }
          prescription = prescriptionResult.rows[0];
        }

        // Update medications if provided
        if (medications && medications.length > 0) {
          // Deactivate all existing medications for this prescription
          await client.query(
            'UPDATE medications SET is_active = false WHERE prescription_id = $1',
            [id]
          );

          // Get patient info for reminders
          const patientResult = await client.query(
            'SELECT * FROM patients WHERE id = $1',
            [prescription.patient_id]
          );
          const patient = patientResult.rows[0];

          // Insert new medications
          for (const med of medications) {
            const medResult = await client.query(
              `INSERT INTO medications 
               (prescription_id, medication_name, dosage, frequency, quantity, 
                duration_days, start_date, end_date, instructions)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               RETURNING *`,
              [
                id,
                med.medicationName,
                med.dosage,
                med.frequency,
                med.quantity,
                med.durationDays,
                med.startDate,
                med.endDate,
                med.instructions,
              ]
            );

            // Schedule medication reminders
            try {
              await reminderScheduler.scheduleMedicationReminders(
                medResult.rows[0],
                prescription,
                patient
              );
            } catch (reminderError) {
              logger.error('Error scheduling medication reminders:', reminderError);
              // Don't fail the update if reminders fail
            }
          }
        }

        return prescription;
      });

      res.json({
        success: true,
        message: 'Prescription updated successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Error updating prescription:', error);

      if (error.message === 'Prescription not found') {
        return res.status(404).json({
          success: false,
          message: 'Prescription not found',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error updating prescription',
        error: error.message,
      });
    }
  }

  // Delete prescription (soft delete)
  async deletePrescription(req, res) {
    try {
      const { id } = req.params;

      // Soft delete: mark prescription and medications as inactive
      const result = await transaction(async (client) => {
        // Mark prescription as inactive
        const prescriptionResult = await client.query(
          'UPDATE prescriptions SET is_active = false WHERE id = $1 RETURNING *',
          [id]
        );

        if (prescriptionResult.rows.length === 0) {
          throw new Error('Prescription not found');
        }

        return prescriptionResult.rows[0];
      });

      res.json({
        success: true,
        message: 'Prescription deleted successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Error deleting prescription:', error);

      if (error.message === 'Prescription not found') {
        return res.status(404).json({
          success: false,
          message: 'Prescription not found',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error deleting prescription',
        error: error.message,
      });
    }
  }

  // Restore prescription (reactivate)
  async restorePrescription(req, res) {
    try {
      const { id } = req.params;

      const result = await query(
        'UPDATE prescriptions SET is_active = true WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Prescription not found',
        });
      }

      res.json({
        success: true,
        message: 'Prescription restored successfully',
        data: result.rows[0],
      });
    } catch (error) {
      logger.error('Error restoring prescription:', error);

      res.status(500).json({
        success: false,
        message: 'Error restoring prescription',
        error: error.message,
      });
    }
  }
}

module.exports = new PrescriptionController();

