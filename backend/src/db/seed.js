require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const seedDoctors = async () => {
  try {
    // First, delete related records in order
    await pool.query('DELETE FROM appointments');
    await pool.query('DELETE FROM prescriptions');
    await pool.query('DELETE FROM doctors');

    // Insert test doctors
    const doctors = [
      ['John', 'Smith', 'john.smith@example.com', 'Cardiology', '123-456-7890'],
      ['Sarah', 'Johnson', 'sarah.johnson@example.com', 'Pediatrics', '234-567-8901'],
      ['Michael', 'Brown', 'michael.brown@example.com', 'Neurology', '345-678-9012'],
      ['Emily', 'Davis', 'emily.davis@example.com', 'Dermatology', '456-789-0123'],
      ['David', 'Wilson', 'david.wilson@example.com', 'Orthopedics', '567-890-1234']
    ];

    for (const doctor of doctors) {
      await pool.query(
        'INSERT INTO doctors (first_name, last_name, email, specialization, phone_number) VALUES ($1, $2, $3, $4, $5)',
        doctor
      );
    }

    console.log('Successfully seeded doctors table');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDoctors(); 