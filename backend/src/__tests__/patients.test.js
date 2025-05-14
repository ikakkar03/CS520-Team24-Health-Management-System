const request = require('supertest');
const express = require('express');
const { Pool } = require('pg');
const patientsRouter = require('../routes/patients');

// Mock the pg Pool
jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mockPool) };
});

describe('Patients Routes', () => {
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
    app.use('/patients', patientsRouter);
  });

  describe('GET /patients', () => {
    it('should return all patients', async () => {
      const mockPatients = [
        {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          date_of_birth: '1990-01-01',
          gender: 'male',
          phone_number: '1234567890',
          address: '123 Main St'
        },
        {
          id: 2,
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          date_of_birth: '1992-02-02',
          gender: 'female',
          phone_number: '0987654321',
          address: '456 Oak St'
        }
      ];

      pool.query.mockResolvedValueOnce({ rows: mockPatients });

      const response = await request(app)
        .get('/patients')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockPatients);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM patients ORDER BY id');
    });

    it('should handle server errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/patients')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({ message: 'Server error' });
    });
  });

  describe('GET /patients/search', () => {
    it('should search patients by query', async () => {
      const mockPatients = [
        {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          date_of_birth: '1990-01-01',
          gender: 'male',
          phone_number: '1234567890'
        }
      ];

      pool.query.mockResolvedValueOnce({ rows: mockPatients });

      const response = await request(app)
        .get('/patients/search?query=john')
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
        .get('/patients/search')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toEqual({ message: 'Search query is required' });
    });
  });

  describe('GET /patients/email/:email', () => {
    it('should return patient by email', async () => {
      const mockPatient = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        date_of_birth: '1990-01-01',
        gender: 'male',
        phone_number: '1234567890',
        address: '123 Main St'
      };

      pool.query.mockResolvedValueOnce({ rows: [mockPatient] });

      const response = await request(app)
        .get('/patients/email/john@example.com')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockPatient);
    });

    it('should return 404 if patient not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/patients/email/nonexistent@example.com')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toEqual({ message: 'Patient not found' });
    });
  });

  describe('GET /patients/:id', () => {
    it('should return patient by id', async () => {
      const mockPatient = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        date_of_birth: '1990-01-01',
        gender: 'male',
        phone_number: '1234567890',
        address: '123 Main St'
      };

      pool.query.mockResolvedValueOnce({ rows: [mockPatient] });

      const response = await request(app)
        .get('/patients/1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockPatient);
    });

    it('should return 404 if patient not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/patients/999')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toEqual({ message: 'Patient not found' });
    });
  });

  describe('POST /patients', () => {
    const validPatientData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      phoneNumber: '1234567890',
      address: '123 Main St'
    };

    it('should create a new patient', async () => {
      const mockCreatedPatient = {
        id: 1,
        ...validPatientData,
        first_name: validPatientData.firstName,
        last_name: validPatientData.lastName,
        date_of_birth: validPatientData.dateOfBirth,
        phone_number: validPatientData.phoneNumber
      };

      pool.query.mockResolvedValueOnce({ rows: [mockCreatedPatient] });

      const response = await request(app)
        .post('/patients')
        .send(validPatientData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toEqual(mockCreatedPatient);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        firstName: '',
        lastName: '',
        email: 'invalid-email',
        dateOfBirth: 'invalid-date',
        gender: '',
        phoneNumber: ''
      };

      const response = await request(app)
        .post('/patients')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('PUT /patients/:id', () => {
    const validUpdateData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      phoneNumber: '1234567890',
      address: '123 Main St'
    };

    it('should update an existing patient', async () => {
      const mockUpdatedPatient = {
        id: 1,
        ...validUpdateData,
        first_name: validUpdateData.firstName,
        last_name: validUpdateData.lastName,
        date_of_birth: validUpdateData.dateOfBirth,
        phone_number: validUpdateData.phoneNumber
      };

      pool.query.mockResolvedValueOnce({ rows: [mockUpdatedPatient] });

      const response = await request(app)
        .put('/patients/1')
        .send(validUpdateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockUpdatedPatient);
    });

    it('should return 404 for non-existent patient', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .put('/patients/999')
        .send(validUpdateData)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toEqual({ message: 'Patient not found' });
    });

    it('should validate required fields', async () => {
      const invalidData = {
        firstName: '',
        lastName: '',
        email: 'invalid-email',
        dateOfBirth: 'invalid-date',
        gender: '',
        phoneNumber: ''
      };

      const response = await request(app)
        .put('/patients/1')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('DELETE /patients/:id', () => {
    it('should delete an existing patient', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const response = await request(app)
        .delete('/patients/1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({ message: 'Patient deleted successfully' });
    });

    it('should return 404 for non-existent patient', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .delete('/patients/999')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toEqual({ message: 'Patient not found' });
    });
  });
}); 