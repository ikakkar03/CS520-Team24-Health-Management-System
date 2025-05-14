const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Create a refill request
router.post('/', async (req, res) => {
  const { prescription_id, patient_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO refill_requests (prescription_id, patient_id)
       VALUES ($1, $2)
       RETURNING *`,
      [prescription_id, patient_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating refill request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// List all requests (pending *and* acted-on) with medications and responded_at
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.id,
        r.prescription_id,
        r.patient_id,
        r.status,
        r.requested_at,
        r.responded_at,
        u.first_name  AS patient_first_name,
        u.last_name   AS patient_last_name,
        json_agg(
          json_build_object(
            'medicationName', pm.medication_name,
            'dosage',          pm.dosage,
            'frequency',       pm.frequency,
            'duration',        pm.duration
          )
        ) AS medications
      FROM refill_requests r
      JOIN patients pt
        ON r.patient_id = pt.id
      JOIN users u
        ON u.id = pt.id
      JOIN prescription_medications pm
        ON pm.prescription_id = r.prescription_id
      GROUP BY
        r.id,
        r.prescription_id,
        r.patient_id,
        r.status,
        r.requested_at,
        r.responded_at,
        u.first_name,
        u.last_name
      ORDER BY r.requested_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching refill requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve or reject a refill request
router.put('/:id/:action', async (req, res) => {
  const { id, action } = req.params;
  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action' });
  }
  try {
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const result = await pool.query(
      `UPDATE refill_requests
         SET status       = $1,
             responded_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [newStatus, id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ message: 'Request not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating refill request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
