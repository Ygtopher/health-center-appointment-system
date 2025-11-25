const express = require('express');
const router = express.Router();
const ussdController = require('../controllers/ussdController');

// USSD endpoint (POST from Africa's Talking)
router.post('/', ussdController.handleUSSD.bind(ussdController));

module.exports = router;

