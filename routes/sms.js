const express = require('express');
const router = express.Router();
const smsController = require('../controllers/smsController');

// Incoming SMS endpoint (POST from Africa's Talking)
// Note: Africa's Talking sends data as application/x-www-form-urlencoded
router.post('/', smsController.receiveSMS.bind(smsController));

module.exports = router;

