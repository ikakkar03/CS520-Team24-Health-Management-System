require('dotenv').config();
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { body, validationResult } = require('express-validator');

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// -----------------------------------------------------------------------------
// 1) Search patients by name or email
// -----------------------------------------------------------------------------
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
         OR LOWER(last_name)  LIKE LOWER($1)
         OR LOWER(email)      LIKE LOWER($1)
       LIMIT 10`,
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// -----------------------------------------------------------------------------
// 2) Active prescriptions for a doctor (deleted_at IS NULL)
// -----------------------------------------------------------------------------
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const result = await pool.query(
      `
      SELECT 
        p.*,
        d.first_name  AS doctor_first_name,
        d.last_name   AS doctor_last_name,
        pt.first_name AS patient_first_name,
        pt.last_name  AS patient_last_name,
        json_agg(
          json_build_object(
            'medicationName', pm.medication_name,
            'dosage',          pm.dosage,
            'frequency',       pm.frequency,
            'duration',        pm.duration
          )
        ) FILTER (WHERE pm.medication_name IS NOT NULL) AS medications
      FROM prescriptions p
      LEFT JOIN doctors d ON p.doctor_id = d.id
      LEFT JOIN patients pt ON p.patient_id = pt.id
      LEFT JOIN prescription_medications pm ON pm.prescription_id = p.id
      WHERE p.doctor_id = $1
        AND p.deleted_at IS NULL
      GROUP BY p.id, d.first_name, d.last_name, pt.first_name, pt.last_name
      ORDER BY p.created_at DESC
      `,
      [doctorId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching active prescriptions for doctor:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// -----------------------------------------------------------------------------
// 3) Archived (history) prescriptions for a doctor (deleted_at IS NOT NULL)
// -----------------------------------------------------------------------------
router.get('/history/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const result = await pool.query(
      `
      SELECT 
        p.*,
        d.first_name  AS doctor_first_name,
        d.last_name   AS doctor_last_name,
        pt.first_name AS patient_first_name,
        pt.last_name  AS patient_last_name,
        json_agg(
          json_build_object(
            'medicationName', pm.medication_name,
            'dosage',          pm.dosage,
            'frequency',       pm.frequency,
            'duration',        pm.duration
          )
        ) FILTER (WHERE pm.medication_name IS NOT NULL) AS medications
      FROM prescriptions p
      LEFT JOIN doctors d ON p.doctor_id = d.id
      LEFT JOIN patients pt ON p.patient_id = pt.id
      LEFT JOIN prescription_medications pm ON pm.prescription_id = p.id
      WHERE p.doctor_id = $1
        AND p.deleted_at IS NOT NULL
      GROUP BY p.id, d.first_name, d.last_name, pt.first_name, pt.last_name
      ORDER BY p.deleted_at DESC
      `,
      [doctorId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching prescription history for doctor:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// -----------------------------------------------------------------------------
// 4) Active prescriptions for a patient (deleted_at IS NULL)
// -----------------------------------------------------------------------------
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const result = await pool.query(
      `
      SELECT 
        p.*,
        d.first_name  AS doctor_first_name,
        d.last_name   AS doctor_last_name,
        pt.first_name AS patient_first_name,
        pt.last_name  AS patient_last_name,
        json_agg(
          json_build_object(
            'medicationName', pm.medication_name,
            'dosage',          pm.dosage,
            'frequency',       pm.frequency,
            'duration',        pm.duration
          )
        ) FILTER (WHERE pm.medication_name IS NOT NULL) AS medications
      FROM prescriptions p
      LEFT JOIN doctors d ON p.doctor_id = d.id
      LEFT JOIN patients pt ON p.patient_id = pt.id
      LEFT JOIN prescription_medications pm ON pm.prescription_id = p.id
      WHERE p.patient_id = $1
        AND p.deleted_at IS NULL
      GROUP BY p.id, d.first_name, d.last_name, pt.first_name, pt.last_name
      ORDER BY p.created_at DESC
      `,
      [patientId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching active prescriptions for patient:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// -----------------------------------------------------------------------------
// 5) Archived prescriptions for a patient (deleted_at IS NOT NULL)
// -----------------------------------------------------------------------------
router.get('/patient/history/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const result = await pool.query(
      `
      SELECT 
        p.*,
        d.first_name  AS doctor_first_name,
        d.last_name   AS doctor_last_name,
        pt.first_name AS patient_first_name,
        pt.last_name  AS patient_last_name,
        json_agg(
          json_build_object(
            'medicationName', pm.medication_name,
            'dosage',          pm.dosage,
            'frequency',       pm.frequency,
            'duration',        pm.duration
          )
        ) FILTER (WHERE pm.medication_name IS NOT NULL) AS medications
      FROM prescriptions p
      LEFT JOIN doctors d ON p.doctor_id = d.id
      LEFT JOIN patients pt ON p.patient_id = pt.id
      LEFT JOIN prescription_medications pm ON pm.prescription_id = p.id
      WHERE p.patient_id = $1
        AND p.deleted_at IS NOT NULL
      GROUP BY p.id, d.first_name, d.last_name, pt.first_name, pt.last_name
      ORDER BY p.deleted_at DESC
      `,
      [patientId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patient prescription history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// -----------------------------------------------------------------------------
// 6) Create a new prescription (with medications array)
// -----------------------------------------------------------------------------
router.post(
  '/',
  [
    body('patientId').isInt(),
    body('medications').isArray({ min: 1 }),
    body('medications.*.medicationName').notEmpty(),
    body('medications.*.dosage').notEmpty(),
    body('medications.*.frequency').notEmpty(),
    body('medications.*.duration').notEmpty(),
    body('notes').optional()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const doctorId = req.doctorId
    const { patientId, medications, notes } = req.body;
    
    try {
      
      const pat = await pool.query('SELECT 1 FROM patients WHERE id=$1', [patientId]);
      if (!pat.rows.length) return res.status(404).json({ message: 'Patient not found' });

      // insert prescription
      const presRes = await pool.query(
        `INSERT INTO prescriptions 
          (doctor_id, patient_id, notes) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        [doctorId, patientId, notes]
      );
      const presc = presRes.rows[0];

      // insert meds
      for (const m of medications) {
        await pool.query(
          `INSERT INTO prescription_medications 
            (prescription_id, medication_name, dosage, frequency, duration)
           VALUES ($1, $2, $3, $4, $5)`,
          [presc.id, m.medicationName, m.dosage, m.frequency, m.duration]
        );
      }

      // Return the exact same data that was sent in the request
      res.status(201).json({
        doctorId,
        patientId,
        medications,
        notes
      });
    } catch (error) {
      console.error('Error creating prescription:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// -----------------------------------------------------------------------------
// 7) Soft-delete (archive) a prescription by setting deleted_at
// -----------------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First check if prescription exists
    const checkResult = await pool.query('SELECT 1 FROM prescriptions WHERE id = $1', [id]);
    if (!checkResult.rows.length) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Then try to delete it
    try {
      await pool.query(
        `UPDATE prescriptions
           SET deleted_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id]
      );
      res.json({ message: 'Prescription deleted successfully' });
    } catch (error) {
      console.error('Error deleting prescription:', error);
      res.status(500).json({ message: 'Server error' });
    }
  } catch (error) {
    console.error('Error checking prescription:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// -----------------------------------------------------------------------------
// 8) Get a single prescription with its medications
// -----------------------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `
      SELECT
        p.*,
        d.first_name  AS doctor_first_name,
        d.last_name   AS doctor_last_name,
        pt.first_name AS patient_first_name,
        pt.last_name  AS patient_last_name,
        json_agg(
          json_build_object(
            'medicationName', pm.medication_name,
            'dosage',          pm.dosage,
            'frequency',       pm.frequency,
            'duration',        pm.duration
          )
        ) AS medications
      FROM prescriptions p
      LEFT JOIN doctors d ON p.doctor_id = d.id
      LEFT JOIN patients pt ON p.patient_id = pt.id
      LEFT JOIN prescription_medications pm ON pm.prescription_id = p.id
      WHERE p.id = $1
      GROUP BY p.id, d.first_name, d.last_name, pt.first_name, pt.last_name
      `,
      [id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /prescriptions
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        p.*,
        d.first_name AS doctor_first_name,
        d.last_name AS doctor_last_name,
        pt.first_name AS patient_first_name,
        pt.last_name AS patient_last_name,
        json_agg(
          json_build_object(
            'medicationName', pm.medication_name,
            'dosage', pm.dosage,
            'frequency', pm.frequency,
            'duration', pm.duration
          )
        ) AS medications
      FROM prescriptions p
      LEFT JOIN doctors d ON p.doctor_id = d.id
      LEFT JOIN patients pt ON p.patient_id = pt.id
      LEFT JOIN prescription_medications pm ON pm.prescription_id = p.id
      WHERE p.deleted_at IS NULL
      GROUP BY p.id, d.first_name, d.last_name, pt.first_name, pt.last_name
      ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
