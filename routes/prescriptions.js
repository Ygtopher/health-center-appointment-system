const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { authenticate, authorize } = require('../middleware/auth');
const { body } = require('express-validator');

// All routes require authentication
router.use(authenticate);

// Validation rules
const prescriptionValidation = [
  body('patientId').isUUID().withMessage('Valid patient ID required'),
  body('healthCenterId').isUUID().withMessage('Valid health center ID required'),
  body('medications').isArray().withMessage('Medications array required'),
  body('medications.*.medicationName').notEmpty().withMessage('Medication name required'),
  body('medications.*.dosage').notEmpty().withMessage('Dosage required'),
  body('medications.*.frequency').notEmpty().withMessage('Frequency required'),
  body('medications.*.startDate').isISO8601().withMessage('Valid start date required'),
  body('medications.*.endDate').isISO8601().withMessage('Valid end date required'),
];

// Routes
router.get('/', prescriptionController.getPrescriptions.bind(prescriptionController));
router.get('/:id', prescriptionController.getPrescription.bind(prescriptionController));
router.post('/', prescriptionValidation, prescriptionController.createPrescription.bind(prescriptionController));
router.put('/:id', prescriptionController.updatePrescription.bind(prescriptionController));
router.delete('/:id', prescriptionController.deletePrescription.bind(prescriptionController));
router.patch('/:id/restore', prescriptionController.restorePrescription.bind(prescriptionController));

module.exports = router;

