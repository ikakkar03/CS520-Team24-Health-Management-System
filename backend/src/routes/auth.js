require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { body, validationResult } = require('express-validator');

// Configure your Postgres pool
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// REGISTER
router.post(
  '/register',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['patient', 'doctor', 'admin']),
    body('firstName').notEmpty(),
    body('lastName').notEmpty()
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { 
        email, 
        password, 
        role, 
        firstName, 
        lastName, 
        dateOfBirth, 
        gender, 
        phoneNumber,
        specialization 
      } = req.body;

      // Check for existing user
      const exists = await pool.query(
        'SELECT 1 FROM users WHERE email = $1',
        [email]
      );
      if (exists.rows.length) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Start a transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert new user
      const result = await pool.query(
        'INSERT INTO users (email, password_hash, role, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role, first_name, last_name',
        [email, hashedPassword, role, firstName, lastName]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// LOGIN
router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').exists(),
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const userResult = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      if (!userResult.rows.length) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      const user = userResult.rows[0];

      // Check password
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Generate token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Send back token and user info
      res.json({
        token,
        user: {
          id:        user.id,
          email:     user.email,
          role:      user.role,
          firstName: user.first_name,
          lastName:  user.last_name,
        },
      });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
