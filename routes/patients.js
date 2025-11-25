const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');

// All routes require authentication
router.use(authenticate);

// Validation rules
const patientValidation = [
  body('nationalId').notEmpty().withMessage('National ID is required'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
];

// Routes
router.get('/', patientController.getPatients.bind(patientController));
router.get('/national-id/:nationalId', patientController.getPatientByNationalId.bind(patientController));
router.get('/:id', patientController.getPatient.bind(patientController));
router.post('/', patientValidation, patientController.createPatient.bind(patientController));
router.put('/:id', patientController.updatePatient.bind(patientController));

module.exports = router;

