const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');

// Validation rules
const loginValidation = [
  body('username').notEmpty().withMessage('Username or email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Routes
router.post('/login', loginValidation, authController.login.bind(authController));
router.get('/me', authenticate, authController.getCurrentUser.bind(authController));

module.exports = router;

