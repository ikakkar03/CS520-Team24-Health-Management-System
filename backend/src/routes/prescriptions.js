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

// Search patients by name or email
router.get('/search-patients', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const result = await pool.query(
      `SELECT id, first_name, last_name, email, date_of_birth, gender 
       FROM patients 
       WHERE LOWER(first_name) LIKE LOWER($1) 
       OR LOWER(last_name) LIKE LOWER($1) 
       OR LOWER(email) LIKE LOWER($1)
       LIMIT 10`,
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all prescriptions
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, 
        d.first_name as doctor_first_name, d.last_name as doctor_last_name,
        pt.first_name as patient_first_name, pt.last_name as patient_last_name
      FROM prescriptions p
      LEFT JOIN doctors d ON p.doctor_id = d.id
      LEFT JOIN patients pt ON p.patient_id = pt.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get prescriptions for a specific doctor
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, 
        pt.first_name as patient_first_name, pt.last_name as patient_last_name
      FROM prescriptions p
      LEFT JOIN patients pt ON p.patient_id = pt.id
      WHERE p.doctor_id = $1
      ORDER BY p.created_at DESC
    `, [req.params.doctorId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching doctor prescriptions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get prescriptions for a specific patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, 
        d.first_name as doctor_first_name, d.last_name as doctor_last_name
      FROM prescriptions p
      LEFT JOIN doctors d ON p.doctor_id = d.id
      WHERE p.patient_id = $1
      ORDER BY p.created_at DESC
    `, [req.params.patientId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create prescription
router.post('/',
  [
    body('doctorId').isInt(),
    body('patientId').isInt(),
    body('appointmentId').optional().isInt(),
    body('medications').isArray(),
    body('medications.*.medicationName').notEmpty(),
    body('medications.*.dosage').notEmpty(),
    body('medications.*.frequency').notEmpty(),
    body('medications.*.duration').notEmpty(),
    body('instructions').optional()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { doctorId, patientId, appointmentId, medications, instructions } = req.body;
      
      // Verify doctor exists
      const doctorCheck = await pool.query('SELECT * FROM doctors WHERE id = $1', [doctorId]);
      if (doctorCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Doctor not found' });
      }

      // Verify patient exists
      const patientCheck = await pool.query('SELECT * FROM patients WHERE id = $1', [patientId]);
      if (patientCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      // If appointmentId is provided, verify appointment exists and belongs to the doctor and patient
      if (appointmentId) {
        const appointmentCheck = await pool.query(
          'SELECT * FROM appointments WHERE id = $1 AND doctor_id = $2 AND patient_id = $3',
          [appointmentId, doctorId, patientId]
        );
        if (appointmentCheck.rows.length === 0) {
          return res.status(404).json({ message: 'Appointment not found or does not belong to the specified doctor and patient' });
        }
      }

      // Create prescription
      const prescriptionResult = await pool.query(
        'INSERT INTO prescriptions (doctor_id, patient_id, appointment_id, instructions) VALUES ($1, $2, $3, $4) RETURNING *',
        [doctorId, patientId, appointmentId, instructions]
      );

      const prescription = prescriptionResult.rows[0];

      // Add medications
      for (const medication of medications) {
        await pool.query(
          'INSERT INTO prescription_medications (prescription_id, medication_name, dosage, frequency, duration) VALUES ($1, $2, $3, $4, $5)',
          [prescription.id, medication.medicationName, medication.dosage, medication.frequency, medication.duration]
        );
      }

      // Get the complete prescription with medications
      const completePrescription = await pool.query(`
        SELECT p.*, 
          d.first_name as doctor_first_name, d.last_name as doctor_last_name,
          pt.first_name as patient_first_name, pt.last_name as patient_last_name,
          json_agg(json_build_object(
            'medicationName', pm.medication_name,
            'dosage', pm.dosage,
            'frequency', pm.frequency,
            'duration', pm.duration
          )) as medications
        FROM prescriptions p
        LEFT JOIN doctors d ON p.doctor_id = d.id
        LEFT JOIN patients pt ON p.patient_id = pt.id
        LEFT JOIN prescription_medications pm ON p.id = pm.prescription_id
        WHERE p.id = $1
        GROUP BY p.id, d.first_name, d.last_name, pt.first_name, pt.last_name
      `, [prescription.id]);

      res.status(201).json(completePrescription.rows[0]);
    } catch (error) {
      console.error('Error creating prescription:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get single prescription with medications
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, 
        d.first_name as doctor_first_name, d.last_name as doctor_last_name,
        pt.first_name as patient_first_name, pt.last_name as patient_last_name,
        json_agg(json_build_object(
          'medicationName', pm.medication_name,
          'dosage', pm.dosage,
          'frequency', pm.frequency,
          'duration', pm.duration
        )) as medications
      FROM prescriptions p
      LEFT JOIN doctors d ON p.doctor_id = d.id
      LEFT JOIN patients pt ON p.patient_id = pt.id
      LEFT JOIN prescription_medications pm ON p.id = pm.prescription_id
      WHERE p.id = $1
      GROUP BY p.id, d.first_name, d.last_name, pt.first_name, pt.last_name
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 