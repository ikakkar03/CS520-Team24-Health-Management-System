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
    body('lastName').notEmpty(),
    body('dateOfBirth')
      .if(body('role').equals('patient'))
      .isDate(),
    body('gender')
      .if(body('role').equals('patient'))
      .notEmpty(),
    body('phoneNumber')
      .if(body('role').equals('patient'))
      .notEmpty(),
    body('specialization')
      .if(body('role').equals('doctor'))
      .notEmpty(),
    body('phoneNumber')
      .if(body('role').equals('doctor'))
      .notEmpty(),
  ],
  async (req, res) => {
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
      specialization,
    } = req.body;

    // Check for existing user
    const exists = await pool.query(
      'SELECT 1 FROM users WHERE email = $1',
      [email]
    );
    if (exists.rows.length) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert into users
      const userResult = await client.query(
        `INSERT INTO users
           (email, password_hash, role, first_name, last_name)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING id, email, role, first_name, last_name`,
        [email, hashedPassword, role, firstName, lastName]
      );
      const user = userResult.rows[0];

      // If patient, insert into patients
      if (role === 'patient') {
        await client.query(
          `INSERT INTO patients
             (id, first_name, last_name, email, date_of_birth, gender, phone_number)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            user.id,
            firstName,
            lastName,
            email,
            dateOfBirth,
            gender,
            phoneNumber,
          ]
        );
      }
      // If doctor, insert into doctors
      else if (role === 'doctor') {
        await client.query(
          `INSERT INTO doctors
             (id, first_name, last_name, email, specialization, phone_number)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [
            user.id,
            firstName,
            lastName,
            email,
            specialization,
            phoneNumber,
          ]
        );
      }

      await client.query('COMMIT');

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Respond with token and user
      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
        },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error registering user:', err);
      res.status(500).json({ message: 'Server error' });
    } finally {
      client.release();
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
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
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

      // Respond with token and user
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
        },
      });
    } catch (err) {
      console.error('Error logging in:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
