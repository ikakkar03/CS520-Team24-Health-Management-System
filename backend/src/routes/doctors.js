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

// Get all doctors
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM doctors ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search doctors by name or email
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const result = await pool.query(
      `SELECT id, first_name, last_name, email, specialization, phone_number 
       FROM doctors 
       WHERE LOWER(first_name) LIKE LOWER($1) 
       OR LOWER(last_name) LIKE LOWER($1) 
       OR LOWER(email) LIKE LOWER($1)
       LIMIT 10`,
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching doctors:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctor by email
router.get('/email/:email', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM doctors WHERE email = $1', [req.params.email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching doctor by email:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single doctor
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM doctors WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create doctor
router.post('/',
  [
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('email').isEmail(),
    body('specialization').notEmpty(),
    body('phoneNumber').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { firstName, lastName, email, specialization, phoneNumber } = req.body;
      
      const result = await pool.query(
        'INSERT INTO doctors (first_name, last_name, email, specialization, phone_number) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [firstName, lastName, email, specialization, phoneNumber]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating doctor:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update doctor
router.put('/:id',
  [
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('email').isEmail(),
    body('specialization').notEmpty(),
    body('phoneNumber').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { firstName, lastName, email, specialization, phoneNumber } = req.body;
      
      const result = await pool.query(
        'UPDATE doctors SET first_name = $1, last_name = $2, email = $3, specialization = $4, phone_number = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
        [firstName, lastName, email, specialization, phoneNumber, req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Doctor not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating doctor:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete doctor
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM doctors WHERE id = $1 RETURNING *', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 