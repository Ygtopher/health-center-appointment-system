// Medication Adherence Routes
// Health Center Appointment & Medication Reminder System

const express = require('express');
const router = express.Router();
const adherenceController = require('../controllers/adherenceController');
const { authenticate } = require('../middleware/auth');

/**
 * @route   GET /api/adherence/patient/:id
 * @desc    Get adherence rate for a specific patient
 * @access  Private (Health Staff, Admin)
 */
router.get('/patient/:id', authenticate, adherenceController.getPatientAdherence);

/**
 * @route   GET /api/adherence/report
 * @desc    Generate adherence report
 * @access  Private (Health Staff, Admin)
 */
router.get('/report', authenticate, adherenceController.generateAdherenceReport);

/**
 * @route   POST /api/adherence/confirm
 * @desc    Confirm medication taken (can be called from USSD)
 * @access  Public (for USSD integration)
 */
router.post('/confirm', adherenceController.confirmMedicationTaken);

/**
 * @route   GET /api/adherence/pending/:nationalId
 * @desc    Get pending medication confirmations for a patient
 * @access  Public (for USSD integration)
 */
router.get('/pending/:nationalId', adherenceController.getPendingConfirmations);

/**
 * @route   GET /api/adherence/essential-medicines
 * @desc    Get essential medicines list
 * @access  Private (Health Staff, Admin)
 */
router.get('/essential-medicines', authenticate, adherenceController.getEssentialMedicines);

module.exports = router;
