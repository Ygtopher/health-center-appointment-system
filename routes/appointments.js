const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticate, authorize } = require('../middleware/auth');
const { body } = require('express-validator');

// All routes require authentication
router.use(authenticate);

// Validation rules
const appointmentValidation = [
  body('patientId').isUUID().withMessage('Valid patient ID required'),
  body('healthCenterId').isUUID().withMessage('Valid health center ID required'),
  body('appointmentDate').isISO8601().withMessage('Valid date required'),
  body('appointmentTime').matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format required (HH:MM)'),
];

// Routes
router.get('/', appointmentController.getAppointments.bind(appointmentController));
router.get('/slots', appointmentController.getAvailableSlots.bind(appointmentController));
router.get('/:id', appointmentController.getAppointment.bind(appointmentController));
router.post('/', appointmentValidation, appointmentController.createAppointment.bind(appointmentController));
router.put('/:id', appointmentController.updateAppointment.bind(appointmentController));
router.delete('/:id', appointmentController.cancelAppointment.bind(appointmentController));

module.exports = router;

