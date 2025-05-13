const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { body, validationResult } = require('express-validator');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Get all patients
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM patients ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single patient
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM patients WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create patient
router.post('/',
  [
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('email').isEmail(),
    body('dateOfBirth').isDate(),
    body('gender').notEmpty(),
    body('phoneNumber').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { 
        firstName, 
        lastName, 
        email, 
        dateOfBirth, 
        gender, 
        phoneNumber, 
        address 
      } = req.body;
      
      const result = await pool.query(
        'INSERT INTO patients (first_name, last_name, email, date_of_birth, gender, phone_number, address) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [firstName, lastName, email, dateOfBirth, gender, phoneNumber, address]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating patient:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update patient
router.put('/:id',
  [
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('email').isEmail(),
    body('dateOfBirth').isDate(),
    body('gender').notEmpty(),
    body('phoneNumber').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { 
        firstName, 
        lastName, 
        email, 
        dateOfBirth, 
        gender, 
        phoneNumber, 
        address 
      } = req.body;
      
      const result = await pool.query(
        'UPDATE patients SET first_name = $1, last_name = $2, email = $3, date_of_birth = $4, gender = $5, phone_number = $6, address = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *',
        [firstName, lastName, email, dateOfBirth, gender, phoneNumber, address, req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating patient:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete patient
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM patients WHERE id = $1 RETURNING *', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 