// Patient Consent Routes
// Health Center Appointment & Medication Reminder System

const express = require('express');
const router = express.Router();
const consentController = require('../controllers/consentController');
const { authenticate } = require('../middleware/auth');

// All consent routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/patients/:id/consent
 * @desc    Record patient consent
 * @access  Private (Health Staff, Admin)
 */
router.post('/patients/:id/consent', consentController.recordConsent);

/**
 * @route   GET /api/patients/:id/consent
 * @desc    Get all consent records for a patient
 * @access  Private (Health Staff, Admin)
 */
router.get('/patients/:id/consent', consentController.getPatientConsent);

/**
 * @route   GET /api/patients/:id/consent/:type
 * @desc    Get specific consent type status for a patient
 * @access  Private (Health Staff, Admin)
 */
router.get('/patients/:id/consent/:type', consentController.getConsentStatus);

/**
 * @route   PUT /api/consent/:id
 * @desc    Update consent record
 * @access  Private (Health Staff, Admin)
 */
router.put('/consent/:id', consentController.updateConsent);

module.exports = router;
