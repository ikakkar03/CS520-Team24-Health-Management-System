const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { body, validationResult } = require('express-validator');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Register user
router.post('/register',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['patient', 'doctor', 'admin']),
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('dateOfBirth').if(body('role').equals('patient')).isDate(),
    body('gender').if(body('role').equals('patient')).notEmpty(),
    body('phoneNumber').if(body('role').equals('patient')).notEmpty(),
    body('specialization').if(body('role').equals('doctor')).notEmpty(),
    body('phoneNumber').if(body('role').equals('doctor')).notEmpty()
  ],
  async (req, res) => {
    try {
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

      // Check if user already exists
      const userExists = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (userExists.rows.length > 0) {
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
        const userResult = await client.query(
          'INSERT INTO users (email, password_hash, role, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role, first_name, last_name',
          [email, hashedPassword, role, firstName, lastName]
        );

        // If user is a patient, create a patient record
        if (role === 'patient') {
          await client.query(
            'INSERT INTO patients (first_name, last_name, email, date_of_birth, gender, phone_number) VALUES ($1, $2, $3, $4, $5, $6)',
            [firstName, lastName, email, dateOfBirth, gender, phoneNumber]
          );
        }
        // If user is a doctor, create a doctor record
        else if (role === 'doctor') {
          console.log('Creating doctor record:', {
            firstName,
            lastName,
            email,
            specialization,
            phoneNumber
          });
          await client.query(
            'INSERT INTO doctors (first_name, last_name, email, specialization, phone_number) VALUES ($1, $2, $3, $4, $5)',
            [firstName, lastName, email, specialization, phoneNumber]
          );
        }

        await client.query('COMMIT');

        // Generate JWT token
        const token = jwt.sign(
          { 
            id: userResult.rows[0].id,
            email: userResult.rows[0].email,
            role: userResult.rows[0].role,
            firstName: userResult.rows[0].first_name,
            lastName: userResult.rows[0].last_name
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.status(201).json({
          token,
          user: {
            id: userResult.rows[0].id,
            email: userResult.rows[0].email,
            role: userResult.rows[0].role,
            firstName: userResult.rows[0].first_name,
            lastName: userResult.rows[0].last_name
          }
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Login user
router.post('/login',
  [
    body('email').isEmail(),
    body('password').exists()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Check if user exists
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const user = result.rows[0];

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Create JWT token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name
        }
      });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router; 