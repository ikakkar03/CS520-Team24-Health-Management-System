ALTER TABLE prescriptions
  ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;

-- 2) Refill requests table
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