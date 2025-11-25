const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const logger = require('../config/logger');
const { validationResult } = require('express-validator');

class AuthController {
  // Login
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { username, password } = req.body;

      // Find user
      const result = await query(
        `SELECT id, username, email, password_hash, first_name, last_name, 
         role, health_center_id, is_active
         FROM users WHERE username = $1 OR email = $1`,
        [username]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      const user = result.rows[0];

      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Account is inactive',
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Update last login
      await query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Generate token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // Remove password from response
      delete user.password_hash;

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Error during login',
        error: error.message,
      });
    }
  }

  // Get current user
  async getCurrentUser(req, res) {
    try {
      const result = await query(
        `SELECT u.id, u.username, u.email, u.first_name, u.last_name, 
         u.role, u.health_center_id, u.phone_number,
         hc.name as health_center_name
         FROM users u
         LEFT JOIN health_centers hc ON u.health_center_id = hc.id
         WHERE u.id = $1`,
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      logger.error('Error fetching current user:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user',
        error: error.message,
      });
    }
  }
}

module.exports = new AuthController();

