const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./config/logger');
const reminderScheduler = require('./services/reminderScheduler');
const { scheduleBackups } = require('./scripts/backupScheduler');
require('dotenv').config();

// Import routes
const ussdRoutes = require('./routes/ussd');
const smsRoutes = require('./routes/sms');
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const patientRoutes = require('./routes/patients');
const prescriptionRoutes = require('./routes/prescriptions');
const consentRoutes = require('./routes/consent');
const adherenceRoutes = require('./routes/adherence');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting - more lenient in development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 in dev, 100 in production
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// USSD endpoint (no rate limit, handled by provider)
app.use('/ussd', ussdRoutes);

// SMS endpoint (no rate limit, handled by provider)
// Note: Africa's Talking sends SMS as form-urlencoded, so we need to handle it before JSON parser
app.use('/sms', express.urlencoded({ extended: true }), smsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Health Center Appointment System',
  });
});

// SMS endpoint test/debug
app.get('/sms/test', (req, res) => {
  res.json({
    status: 'SMS endpoint is accessible',
    endpoint: '/sms',
    method: 'POST',
    expectedFormat: 'application/x-www-form-urlencoded',
    fields: ['from', 'to', 'text', 'date', 'id', 'linkId', 'cost', 'networkCode'],
    callbackUrl: 'https://overrigged-michaele-curtate.ngrok-free.dev/sms',
  });
});

// Test SMS endpoint (for debugging)
app.post('/sms/test', express.urlencoded({ extended: true }), (req, res) => {
  logger.info('Test SMS endpoint called:', {
    body: req.body,
    headers: req.headers,
    query: req.query,
  });
  res.json({
    success: true,
    message: 'SMS endpoint is working!',
    received: req.body,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/consent', consentRoutes); // Consent routes (includes /api/patients/:id/consent)
app.use('/api/adherence', adherenceRoutes); // Adherence routes
app.use('/api/stats', statsRoutes);

// Health centers route (basic implementation)
app.get('/api/health-centers', async (req, res) => {
  try {
    const { query } = require('./config/database');
    const result = await query(
      'SELECT id, name, name_kinyarwanda, code, district, phone, capacity FROM health_centers WHERE is_active = true ORDER BY name'
    );
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    logger.error('Error fetching health centers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching health centers',
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Start reminder scheduler
  if (process.env.SMS_ENABLED === 'true') {
    reminderScheduler.start();
    logger.info('Reminder scheduler started');
  } else {
    logger.warn('SMS reminders are disabled');
  }

  // Start backup scheduler
  if (process.env.BACKUP_ENABLED !== 'false') {
    scheduleBackups();
    logger.info('Backup scheduler started');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

module.exports = app;

