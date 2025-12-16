// Patient Consent Controller
// Health Center Appointment & Medication Reminder System

const { Pool } = require('pg');
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

/**
 * Record patient consent
 * POST /api/patients/:id/consent
 */
exports.recordConsent = async (req, res) => {
    const { id: patientId } = req.params;
    const { consent_type, consent_given, consent_method, notes } = req.body;
    const recordedBy = req.user?.id || null;

    try {
        // Validate required fields
        if (!consent_type || consent_given === undefined) {
            return res.status(400).json({
                success: false,
                message: 'consent_type and consent_given are required'
            });
        }

        // Validate consent type
        const validConsentTypes = ['sms_notifications', 'data_sharing', 'treatment'];
        if (!validConsentTypes.includes(consent_type)) {
            return res.status(400).json({
                success: false,
                message: `Invalid consent_type. Must be one of: ${validConsentTypes.join(', ')}`
            });
        }

        // Check if patient exists
        const patientCheck = await pool.query(
            'SELECT id FROM patients WHERE id = $1',
            [patientId]
        );

        if (patientCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Insert consent record
        const result = await pool.query(
            `INSERT INTO patient_consent 
            (patient_id, consent_type, consent_given, consent_method, recorded_by, notes)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [patientId, consent_type, consent_given, consent_method, recordedBy, notes]
        );

        res.status(201).json({
            success: true,
            message: 'Consent recorded successfully',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error recording consent:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record consent',
            error: error.message
        });
    }
};

/**
 * Get all consent records for a patient
 * GET /api/patients/:id/consent
 */
exports.getPatientConsent = async (req, res) => {
    const { id: patientId } = req.params;

    try {
        const result = await pool.query(
            `SELECT 
                pc.*,
                u.first_name || ' ' || u.last_name as recorded_by_name
            FROM patient_consent pc
            LEFT JOIN users u ON pc.recorded_by = u.id
            WHERE pc.patient_id = $1
            ORDER BY pc.consent_date DESC, pc.created_at DESC`,
            [patientId]
        );

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error('Error fetching patient consent:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch consent records',
            error: error.message
        });
    }
};

/**
 * Get specific consent type status for a patient
 * GET /api/patients/:id/consent/:type
 */
exports.getConsentStatus = async (req, res) => {
    const { id: patientId, type: consentType } = req.params;

    try {
        // Get the most recent consent record for this type
        const result = await pool.query(
            `SELECT * FROM patient_consent
            WHERE patient_id = $1 AND consent_type = $2
            ORDER BY consent_date DESC, created_at DESC
            LIMIT 1`,
            [patientId, consentType]
        );

        if (result.rows.length === 0) {
            return res.json({
                success: true,
                consent_given: null,
                message: 'No consent record found for this type'
            });
        }

        res.json({
            success: true,
            consent_given: result.rows[0].consent_given,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error checking consent status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check consent status',
            error: error.message
        });
    }
};

/**
 * Update consent record
 * PUT /api/consent/:id
 */
exports.updateConsent = async (req, res) => {
    const { id: consentId } = req.params;
    const { consent_given, notes } = req.body;

    try {
        const result = await pool.query(
            `UPDATE patient_consent
            SET consent_given = COALESCE($1, consent_given),
                notes = COALESCE($2, notes),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *`,
            [consent_given, notes, consentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Consent record not found'
            });
        }

        res.json({
            success: true,
            message: 'Consent updated successfully',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error updating consent:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update consent',
            error: error.message
        });
    }
};

/**
 * Check if patient has given consent for a specific type
 * Helper function for other controllers
 */
exports.hasConsent = async (patientId, consentType) => {
    try {
        const result = await pool.query(
            `SELECT consent_given FROM patient_consent
            WHERE patient_id = $1 AND consent_type = $2
            ORDER BY consent_date DESC, created_at DESC
            LIMIT 1`,
            [patientId, consentType]
        );

        if (result.rows.length === 0) {
            return false; // No consent record = no consent
        }

        return result.rows[0].consent_given;

    } catch (error) {
        console.error('Error checking consent:', error);
        return false; // Default to no consent on error
    }
};
