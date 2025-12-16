const { query } = require('../config/database');
const logger = require('../config/logger');

class StatsController {
    // Get dashboard statistics
    async getStats(req, res) {
        try {
            const today = new Date().toISOString().split('T')[0];

            // Get total patients count
            const patientsResult = await query(
                'SELECT COUNT(*) as total FROM patients WHERE is_active = true'
            );

            // Get total prescriptions count
            const prescriptionsResult = await query(
                'SELECT COUNT(*) as total FROM prescriptions WHERE is_active = true'
            );

            // Get today's appointments count
            const todayAppointmentsResult = await query(
                `SELECT COUNT(*) as total FROM appointments 
         WHERE appointment_date = $1 AND status != 'cancelled'`,
                [today]
            );

            // Get upcoming appointments count (today and future)
            const upcomingAppointmentsResult = await query(
                `SELECT COUNT(*) as total FROM appointments 
         WHERE appointment_date >= $1 AND status != 'cancelled'`,
                [today]
            );

            // Get total appointments count
            const totalAppointmentsResult = await query(
                'SELECT COUNT(*) as total FROM appointments'
            );

            res.json({
                success: true,
                data: {
                    patients: parseInt(patientsResult.rows[0].total),
                    prescriptions: parseInt(prescriptionsResult.rows[0].total),
                    appointments: {
                        today: parseInt(todayAppointmentsResult.rows[0].total),
                        upcoming: parseInt(upcomingAppointmentsResult.rows[0].total),
                        total: parseInt(totalAppointmentsResult.rows[0].total),
                    },
                },
            });
        } catch (error) {
            logger.error('Error fetching stats:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching statistics',
                error: error.message,
            });
        }
    }
}

module.exports = new StatsController();
