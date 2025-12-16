// Medication Adherence Controller
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
 * Get adherence rate for a specific patient
 * GET /api/adherence/patient/:id
 */
exports.getPatientAdherence = async (req, res) => {
    const { id: patientId } = req.params;
    const { start_date, end_date } = req.query;

    try {
        let query = `
            SELECT 
                COUNT(*) as total_reminders,
                COUNT(*) FILTER (WHERE adherence_confirmed = true) as confirmed_count,
                COUNT(*) FILTER (WHERE adherence_confirmed = false) as not_taken_count,
                COUNT(*) FILTER (WHERE adherence_confirmed IS NULL) as no_response_count,
                CASE 
                    WHEN COUNT(*) > 0 THEN 
                        ROUND((COUNT(*) FILTER (WHERE adherence_confirmed = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
                    ELSE 0
                END as adherence_rate
            FROM reminders
            WHERE patient_id = $1 AND type = 'medication' AND status = 'sent'
        `;

        const params = [patientId];

        if (start_date && end_date) {
            query += ` AND scheduled_time BETWEEN $2 AND $3`;
            params.push(start_date, end_date);
        }

        const result = await pool.query(query, params);

        res.json({
            success: true,
            patient_id: patientId,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error fetching patient adherence:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch adherence data',
            error: error.message
        });
    }
};

/**
 * Generate adherence report
 * GET /api/adherence/report
 */
exports.generateAdherenceReport = async (req, res) => {
    const { start_date, end_date, health_center_id } = req.query;

    try {
        let query = `
            SELECT 
                hc.name as health_center_name,
                COUNT(DISTINCT r.patient_id) as total_patients,
                COUNT(*) as total_reminders,
                COUNT(*) FILTER (WHERE r.adherence_confirmed = true) as confirmed_count,
                COUNT(*) FILTER (WHERE r.adherence_confirmed = false) as not_taken_count,
                COUNT(*) FILTER (WHERE r.adherence_confirmed IS NULL) as no_response_count,
                CASE 
                    WHEN COUNT(*) > 0 THEN 
                        ROUND((COUNT(*) FILTER (WHERE r.adherence_confirmed = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
                    ELSE 0
                END as adherence_rate
            FROM reminders r
            JOIN patients p ON r.patient_id = p.id
            JOIN prescriptions pr ON r.reference_id IN (
                SELECT m.id FROM medications m WHERE m.prescription_id = pr.id
            )
            JOIN health_centers hc ON pr.health_center_id = hc.id
            WHERE r.type = 'medication' AND r.status = 'sent'
        `;

        const params = [];
        let paramCount = 0;

        if (start_date && end_date) {
            paramCount++;
            query += ` AND r.scheduled_time BETWEEN $${paramCount} AND $${paramCount + 1}`;
            params.push(start_date, end_date);
            paramCount++;
        }

        if (health_center_id) {
            paramCount++;
            query += ` AND pr.health_center_id = $${paramCount}`;
            params.push(health_center_id);
        }

        query += ` GROUP BY hc.id, hc.name ORDER BY adherence_rate DESC`;

        const result = await pool.query(query, params);

        // Calculate overall statistics
        const overallStats = {
            total_patients: result.rows.reduce((sum, row) => sum + parseInt(row.total_patients), 0),
            total_reminders: result.rows.reduce((sum, row) => sum + parseInt(row.total_reminders), 0),
            confirmed_count: result.rows.reduce((sum, row) => sum + parseInt(row.confirmed_count), 0),
            not_taken_count: result.rows.reduce((sum, row) => sum + parseInt(row.not_taken_count), 0),
            no_response_count: result.rows.reduce((sum, row) => sum + parseInt(row.no_response_count), 0)
        };

        overallStats.adherence_rate = overallStats.total_reminders > 0
            ? ((overallStats.confirmed_count / overallStats.total_reminders) * 100).toFixed(2)
            : 0;

        res.json({
            success: true,
            overall: overallStats,
            by_health_center: result.rows,
            filters: { start_date, end_date, health_center_id }
        });

    } catch (error) {
        console.error('Error generating adherence report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate adherence report',
            error: error.message
        });
    }
};

/**
 * Confirm medication taken
 * POST /api/adherence/confirm
 */
exports.confirmMedicationTaken = async (req, res) => {
    const { reminder_id, taken, confirmation_method } = req.body;

    try {
        // Validate required fields
        if (!reminder_id || taken === undefined) {
            return res.status(400).json({
                success: false,
                message: 'reminder_id and taken are required'
            });
        }

        // Update reminder with adherence confirmation
        const result = await pool.query(
            `UPDATE reminders
            SET adherence_confirmed = $1,
                confirmed_at = CURRENT_TIMESTAMP,
                confirmation_method = $2
            WHERE id = $3 AND type = 'medication'
            RETURNING *`,
            [taken, confirmation_method || 'ussd', reminder_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Medication reminder not found'
            });
        }

        res.json({
            success: true,
            message: 'Medication adherence confirmed',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error confirming medication:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to confirm medication',
            error: error.message
        });
    }
};

/**
 * Get pending medication confirmations for a patient
 * GET /api/adherence/pending/:nationalId
 */
exports.getPendingConfirmations = async (req, res) => {
    const { nationalId } = req.params;

    try {
        const result = await pool.query(
            `SELECT 
                r.id as reminder_id,
                r.scheduled_time,
                r.message,
                m.medication_name,
                m.dosage,
                m.frequency
            FROM reminders r
            JOIN patients p ON r.patient_id = p.id
            JOIN medications m ON r.reference_id = m.id
            WHERE p.national_id = $1 
                AND r.type = 'medication' 
                AND r.status = 'sent'
                AND r.adherence_confirmed IS NULL
                AND r.scheduled_time >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
            ORDER BY r.scheduled_time DESC
            LIMIT 5`,
            [nationalId]
        );

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error('Error fetching pending confirmations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending confirmations',
            error: error.message
        });
    }
};

/**
 * Get essential medicines list
 * GET /api/adherence/essential-medicines
 */
exports.getEssentialMedicines = async (req, res) => {
    const { category, search } = req.query;

    try {
        let query = `
            SELECT * FROM essential_medicines
            WHERE is_active = true
        `;

        const params = [];
        let paramCount = 0;

        if (category) {
            paramCount++;
            query += ` AND category = $${paramCount}`;
            params.push(category);
        }

        if (search) {
            paramCount++;
            query += ` AND (medicine_name ILIKE $${paramCount} OR medicine_name_kinyarwanda ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        query += ` ORDER BY medicine_name`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error('Error fetching essential medicines:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch essential medicines',
            error: error.message
        });
    }
};
