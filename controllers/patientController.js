const { query } = require('../config/database');
const logger = require('../config/logger');
const { validationResult } = require('express-validator');

class PatientController {
  // Get all patients
  async getPatients(req, res) {
    try {
      const {
        search,
        district,
        page = 1,
        limit = 50,
      } = req.query;

      let queryText = `
        SELECT 
          id,
          national_id,
          first_name,
          last_name,
          phone_number,
          date_of_birth,
          gender,
          district,
          sector,
          cell,
          village,
          preferred_language,
          cbhi_number,
          created_at
        FROM patients
        WHERE is_active = true
      `;

      const params = [];
      let paramCount = 1;

      if (search) {
        queryText += ` AND (
          national_id ILIKE $${paramCount} OR
          first_name ILIKE $${paramCount} OR
          last_name ILIKE $${paramCount} OR
          phone_number ILIKE $${paramCount} OR
          cbhi_number ILIKE $${paramCount}
        )`;
        params.push(`%${search}%`);
        paramCount++;
      }

      if (district) {
        queryText += ` AND district = $${paramCount}`;
        params.push(district);
        paramCount++;
      }

      queryText += ` ORDER BY last_name, first_name`;

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
      logger.error('Error fetching patients:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching patients',
        error: error.message,
      });
    }
  }

  // Get single patient
  async getPatient(req, res) {
    try {
      const { id } = req.params;

      const result = await query(
        'SELECT * FROM patients WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found',
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      logger.error('Error fetching patient:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching patient',
        error: error.message,
      });
    }
  }

  // Get patient by National ID
  async getPatientByNationalId(req, res) {
    try {
      const { nationalId } = req.params;

      const result = await query(
        'SELECT * FROM patients WHERE national_id = $1',
        [nationalId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found',
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      logger.error('Error fetching patient:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching patient',
        error: error.message,
      });
    }
  }

  // Create patient
  async createPatient(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const {
        nationalId,
        firstName,
        lastName,
        phoneNumber,
        dateOfBirth,
        gender,
        district,
        sector,
        cell,
        village,
        preferredLanguage,
        cbhiNumber,
      } = req.body;

      // Check if patient already exists
      const existing = await query(
        'SELECT id FROM patients WHERE national_id = $1',
        [nationalId]
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Patient with this National ID already exists',
        });
      }

      const result = await query(
        `INSERT INTO patients 
         (national_id, first_name, last_name, phone_number, date_of_birth, 
          gender, district, sector, cell, village, preferred_language, cbhi_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          nationalId,
          firstName,
          lastName,
          phoneNumber,
          dateOfBirth,
          gender,
          district,
          sector,
          cell,
          village,
          preferredLanguage || 'en',
          cbhiNumber || null,
        ]
      );

      res.status(201).json({
        success: true,
        message: 'Patient created successfully',
        data: result.rows[0],
      });
    } catch (error) {
      logger.error('Error creating patient:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating patient',
        error: error.message,
      });
    }
  }

  // Update patient
  async updatePatient(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const allowedFields = [
        'first_name',
        'last_name',
        'phone_number',
        'date_of_birth',
        'gender',
        'district',
        'sector',
        'cell',
        'village',
        'preferred_language',
        'cbhi_number',
      ];

      const updateFields = [];
      const params = [];
      let paramCount = 1;

      for (const field of allowedFields) {
        const camelField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        if (updates[camelField] !== undefined) {
          updateFields.push(`${field} = $${paramCount}`);
          params.push(updates[camelField]);
          paramCount++;
        }
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update',
        });
      }

      params.push(id);
      const result = await query(
        `UPDATE patients 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        params
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found',
        });
      }

      res.json({
        success: true,
        message: 'Patient updated successfully',
        data: result.rows[0],
      });
    } catch (error) {
      logger.error('Error updating patient:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating patient',
        error: error.message,
      });
    }
  }
}

module.exports = new PatientController();

