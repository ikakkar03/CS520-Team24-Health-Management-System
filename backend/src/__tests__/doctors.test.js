const request = require('supertest');
const express = require('express');
const { Pool } = require('pg');
const doctorsRouter = require('../routes/doctors');

// Mock the pg Pool
jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mockPool) };
});

describe('Doctors Routes', () => {
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
    app.use('/doctors', doctorsRouter);
  });

  describe('GET /doctors', () => {
    it('should return all doctors', async () => {
      const mockDoctors = [
        {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          specialization: 'Cardiology',
          phone_number: '1234567890'
        },
        {
          id: 2,
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          specialization: 'Neurology',
          phone_number: '0987654321'
        }
      ];

      pool.query.mockResolvedValueOnce({ rows: mockDoctors });

      const response = await request(app)
        .get('/doctors')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockDoctors);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM doctors ORDER BY id');
    });

    it('should handle server errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/doctors')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({ message: 'Server error' });
    });
  });

  describe('GET /doctors/search', () => {
    it('should search doctors by query', async () => {
      const mockDoctors = [
        {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          specialization: 'Cardiology',
          phone_number: '1234567890'
        }
      ];

      pool.query.mockResolvedValueOnce({ rows: mockDoctors });

      const response = await request(app)
        .get('/doctors/search?query=john')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockDoctors);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['%john%']
      );
    });

    it('should return 400 if query is missing', async () => {
      const response = await request(app)
        .get('/doctors/search')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toEqual({ message: 'Search query is required' });
    });
  });

  describe('GET /doctors/email/:email', () => {
    it('should return doctor by email', async () => {
      const mockDoctor = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        specialization: 'Cardiology',
        phone_number: '1234567890'
      };

      pool.query.mockResolvedValueOnce({ rows: [mockDoctor] });

      const response = await request(app)
        .get('/doctors/email/john@example.com')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockDoctor);
    });

    it('should return 404 if doctor not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/doctors/email/nonexistent@example.com')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toEqual({ message: 'Doctor not found' });
    });
  });

  describe('GET /doctors/:id', () => {
    it('should return doctor by id', async () => {
      const mockDoctor = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        specialization: 'Cardiology',
        phone_number: '1234567890'
      };

      pool.query.mockResolvedValueOnce({ rows: [mockDoctor] });

      const response = await request(app)
        .get('/doctors/1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockDoctor);
    });

    it('should return 404 if doctor not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/doctors/999')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toEqual({ message: 'Doctor not found' });
    });
  });

  describe('POST /doctors', () => {
    const validDoctorData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      specialization: 'Cardiology',
      phoneNumber: '1234567890'
    };

    it('should create a new doctor', async () => {
      const mockCreatedDoctor = {
        id: 1,
        ...validDoctorData,
        first_name: validDoctorData.firstName,
        last_name: validDoctorData.lastName,
        phone_number: validDoctorData.phoneNumber
      };

      pool.query.mockResolvedValueOnce({ rows: [mockCreatedDoctor] });

      const response = await request(app)
        .post('/doctors')
        .send(validDoctorData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toEqual(mockCreatedDoctor);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        firstName: '',
        lastName: '',
        email: 'invalid-email',
        specialization: '',
        phoneNumber: ''
      };

      const response = await request(app)
        .post('/doctors')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('PUT /doctors/:id', () => {
    const validUpdateData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      specialization: 'Cardiology',
      phoneNumber: '1234567890'
    };

    it('should update an existing doctor', async () => {
      const mockUpdatedDoctor = {
        id: 1,
        ...validUpdateData,
        first_name: validUpdateData.firstName,
        last_name: validUpdateData.lastName,
        phone_number: validUpdateData.phoneNumber
      };

      pool.query.mockResolvedValueOnce({ rows: [mockUpdatedDoctor] });

      const response = await request(app)
        .put('/doctors/1')
        .send(validUpdateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockUpdatedDoctor);
    });

    it('should return 404 for non-existent doctor', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .put('/doctors/999')
        .send(validUpdateData)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toEqual({ message: 'Doctor not found' });
    });

    it('should validate required fields', async () => {
      const invalidData = {
        firstName: '',
        lastName: '',
        email: 'invalid-email',
        specialization: '',
        phoneNumber: ''
      };

      const response = await request(app)
        .put('/doctors/1')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('DELETE /doctors/:id', () => {
    it('should delete an existing doctor', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const response = await request(app)
        .delete('/doctors/1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({ message: 'Doctor deleted successfully' });
    });

    it('should return 404 for non-existent doctor', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .delete('/doctors/999')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toEqual({ message: 'Doctor not found' });
    });
  });
}); 