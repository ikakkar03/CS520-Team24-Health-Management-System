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

// Get all appointments
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, 
        d.first_name as doctor_first_name, d.last_name as doctor_last_name,
        p.first_name as patient_first_name, p.last_name as patient_last_name
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN patients p ON a.patient_id = p.id
      ORDER BY a.appointment_date
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get appointments for a specific doctor
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, 
        p.first_name as patient_first_name, p.last_name as patient_last_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      WHERE a.doctor_id = $1
      ORDER BY a.appointment_date
    `, [req.params.doctorId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get appointments for a specific patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, 
        d.first_name as doctor_first_name, d.last_name as doctor_last_name
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE a.patient_id = $1
      ORDER BY a.appointment_date
    `, [req.params.patientId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create appointment (can be created by doctor or patient)
router.post('/',
  [
    body('doctorId').isInt(),
    body('appointmentDate').isISO8601(),
    body('status').isIn(['scheduled', 'completed', 'cancelled']),
    body('notes').optional()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { doctorId, patientId, appointmentDate, status, notes } = req.body;
      
      // Verify doctor exists
      const doctorCheck = await pool.query('SELECT * FROM doctors WHERE id = $1', [doctorId]);
      if (doctorCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Doctor not found' });
      }

      // If patientId is provided, verify patient exists
      if (patientId) {
        const patientCheck = await pool.query('SELECT * FROM patients WHERE id = $1', [patientId]);
        if (patientCheck.rows.length === 0) {
          return res.status(404).json({ message: 'Patient not found' });
        }
      }

      const result = await pool.query(
        'INSERT INTO appointments (doctor_id, patient_id, appointment_date, status, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [doctorId, patientId, appointmentDate, status || 'scheduled', notes]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating appointment:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update appointment
router.put('/:id',
  [
    body('appointmentDate').optional().isISO8601(),
    body('status').optional().isIn(['scheduled', 'completed', 'cancelled']),
    body('notes').optional()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { appointmentDate, status, notes } = req.body;
      
      // Build the update query dynamically based on provided fields
      let updateFields = [];
      let values = [];
      let paramCount = 1;

      if (appointmentDate) {
        updateFields.push(`appointment_date = $${paramCount}`);
        values.push(appointmentDate);
        paramCount++;
      }
      if (status) {
        updateFields.push(`status = $${paramCount}`);
        values.push(status);
        paramCount++;
      }
      if (notes !== undefined) {
        updateFields.push(`notes = $${paramCount}`);
        values.push(notes);
        paramCount++;
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(req.params.id);

      const result = await pool.query(
        `UPDATE appointments SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating appointment:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete appointment
router.delete('/:id', async (req, res) => {
  try {
    // First check if the appointment exists
    const appointmentCheck = await pool.query(
      'SELECT * FROM appointments WHERE id = $1',
      [req.params.id]
    );

    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Delete the appointment
    await pool.query('DELETE FROM appointments WHERE id = $1', [req.params.id]);
    
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 