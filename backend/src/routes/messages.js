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

router.get('/conversations/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  try {
    const result = await pool.query(`
      SELECT
        t.other_user_id,
        t.last_message_time,
        u.first_name,
        u.last_name
      FROM (
        SELECT
          CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END AS other_user_id,
          MAX(created_at) AS last_message_time
        FROM messages
        WHERE sender_id = $1 OR receiver_id = $1
        GROUP BY other_user_id
      ) AS t
      JOIN users u ON u.id = t.other_user_id
      ORDER BY t.last_message_time DESC
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 2) Fetch full message history
router.get('/conversation/:userId/:otherId', async (req, res) => {
  const userA = parseInt(req.params.userId, 10);
  const userB = parseInt(req.params.otherId, 10);
  try {
    const result = await pool.query(`
      SELECT *
      FROM messages
      WHERE (sender_id = $1 AND receiver_id = $2)
         OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC
    `, [userA, userB]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching conversation history:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
