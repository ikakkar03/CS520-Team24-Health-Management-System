const request = require('supertest');
const express = require('express');
const { Pool } = require('pg');
const prescriptionsRouter = require('../routes/prescriptions');

// Mock the pg Pool
jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mockPool) };
});

describe('Prescriptions Routes', () => {
  let app;
  let pool;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup pool mock
    pool = new Pool();
    
    // Create express app
    app = express();
    app.use(express.json());
    app.use('/prescriptions', prescriptionsRouter);
  });

  describe('GET /prescriptions/search-patients', () => {
    it('should search patients by query', async () => {
      const mockPatients = [
        {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          date_of_birth: '1990-01-01',
          gender: 'male'
        }
      ];

      pool.query.mockResolvedValueOnce({ rows: mockPatients });

      const response = await request(app)
        .get('/prescriptions/search-patients?query=john')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockPatients);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['%john%']
      );
    });

    it('should return 400 if query is missing', async () => {
      const response = await request(app)
        .get('/prescriptions/search-patients')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toEqual({ message: 'Search query is required' });
    });
  });

  describe('GET /prescriptions', () => {
    it('should return all prescriptions', async () => {
      const mockPrescriptions = [
        {
          id: 1,
          doctor_id: 1,
          patient_id: 1,
          medications: ['Medication A', 'Medication B'],
          notes: 'Take with food',
          doctor_first_name: 'Dr. John',
          doctor_last_name: 'Smith',
          patient_first_name: 'Jane',
          patient_last_name: 'Doe'
        }
      ];

      pool.query.mockResolvedValueOnce({ rows: mockPrescriptions });

      const response = await request(app)
        .get('/prescriptions')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockPrescriptions);
    });

    it('should handle server errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/prescriptions')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({ message: 'Server error' });
    });
  });

  describe('GET /prescriptions/doctor/:doctorId', () => {
    it('should return prescriptions for a specific doctor', async () => {
      const mockPrescriptions = [
        {
          id: 1,
          doctor_id: 1,
          patient_id: 1,
          medications: ['Medication A'],
          notes: 'Take daily',
          patient_first_name: 'Jane',
          patient_last_name: 'Doe'
        }
      ];

      pool.query.mockResolvedValueOnce({ rows: mockPrescriptions });

      const response = await request(app)
        .get('/prescriptions/doctor/1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockPrescriptions);
    });
  });

  describe('GET /prescriptions/patient/:patientId', () => {
    it('should return prescriptions for a specific patient', async () => {
      const mockPrescriptions = [
        {
          id: 1,
          doctor_id: 1,
          patient_id: 1,
          medications: ['Medication A'],
          notes: 'Take daily',
          doctor_first_name: 'Dr. John',
          doctor_last_name: 'Smith'
        }
      ];

      pool.query.mockResolvedValueOnce({ rows: mockPrescriptions });

      const response = await request(app)
        .get('/prescriptions/patient/1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockPrescriptions);
    });
  });

  describe('POST /prescriptions', () => {
    const validPrescriptionData = {
      doctorId: 1,
      patientId: 1,
      medications: [
        {
          medicationName: 'Medication A',
          dosage: '10mg',
          frequency: 'daily',
          duration: '7 days'
        }
      ],
      notes: 'Take with food'
    };

    it('should create a new prescription', async () => {
      // Mock doctor and patient existence checks
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Doctor check
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Patient check
        .mockResolvedValueOnce({ rows: [{ id: 1, ...validPrescriptionData }] }); // Insert prescription

      const response = await request(app)
        .post('/prescriptions')
        .send(validPrescriptionData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toMatchObject(validPrescriptionData);
    });

    it('should return 404 if doctor not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] }); // Doctor check

      const response = await request(app)
        .post('/prescriptions')
        .send(validPrescriptionData)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toEqual({ message: 'Doctor not found' });
    });

    it('should return 404 if patient not found', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Doctor check
        .mockResolvedValueOnce({ rows: [] }); // Patient check

      const response = await request(app)
        .post('/prescriptions')
        .send(validPrescriptionData)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toEqual({ message: 'Patient not found' });
    });

    it('should validate required fields', async () => {
      const invalidData = {
        doctorId: 'not-a-number',
        patientId: 'not-a-number',
        medications: 'not-an-array'
      };

      const response = await request(app)
        .post('/prescriptions')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /prescriptions/:id', () => {
    it('should return a single prescription with medications', async () => {
      const mockPrescription = {
        id: 1,
        doctor_id: 1,
        patient_id: 1,
        doctor_first_name: 'Dr. John',
        doctor_last_name: 'Smith',
        patient_first_name: 'Jane',
        patient_last_name: 'Doe',
        medications: [
          {
            medicationName: 'Medication A',
            dosage: '10mg',
            frequency: 'daily',
            duration: '7 days'
          }
        ]
      };

      pool.query.mockResolvedValueOnce({ rows: [mockPrescription] });

      const response = await request(app)
        .get('/prescriptions/1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockPrescription);
    });

    it('should return 404 if prescription not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/prescriptions/999')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toEqual({ message: 'Prescription not found' });
    });
  });

  describe('DELETE /prescriptions/:id', () => {
    it('should delete an existing prescription', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Check prescription exists
        .mockResolvedValueOnce({ rows: [] }); // Delete prescription

      const response = await request(app)
        .delete('/prescriptions/1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({ message: 'Prescription deleted successfully' });
    });

    it('should return 404 for non-existent prescription', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] }); // Check prescription exists

      const response = await request(app)
        .delete('/prescriptions/999')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toEqual({ message: 'Prescription not found' });
    });
  });
}); 