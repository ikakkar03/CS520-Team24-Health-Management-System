CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE doctors (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    specialization VARCHAR(100),
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20),
    phone_number VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    doctor_id INTEGER REFERENCES doctors(id),
    appointment_date TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
    
CREATE TABLE prescriptions (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    doctor_id INTEGER REFERENCES doctors(id),
    appointment_id INTEGER REFERENCES appointments(id),
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(100),
    instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE prescriptions
  ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;


CREATE TABLE refill_requests (
  id SERIAL PRIMARY KEY,
  prescription_id INTEGER NOT NULL REFERENCES prescriptions(id),
  patient_id       INTEGER NOT NULL REFERENCES patients(id),
  status           VARCHAR(20) NOT NULL DEFAULT 'pending',
  requested_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responded_at     TIMESTAMP NULL,
  response         VARCHAR(20) NULL  -- 'approved' or 'rejected'
);

CREATE TABLE IF NOT EXISTS prescription_medications (
  id               SERIAL PRIMARY KEY,
  prescription_id  INTEGER NOT NULL
                       REFERENCES prescriptions(id)
                       ON DELETE CASCADE,
  medication_name  VARCHAR(255) NOT NULL,
  dosage           VARCHAR(100) NOT NULL,
  frequency        VARCHAR(100) NOT NULL,
  duration         VARCHAR(100) NOT NULL
);

INSERT INTO prescription_medications (prescription_id, medication_name, dosage, frequency, duration)
SELECT id, medication_name, dosage, frequency, duration
  FROM prescriptions
 WHERE medication_name IS NOT NULL;

 ALTER TABLE prescriptions
  DROP COLUMN medication_name,
  DROP COLUMN dosage,
  DROP COLUMN frequency,
  DROP COLUMN duration;


ALTER TABLE prescriptions
    ADD COLUMN notes TEXT;