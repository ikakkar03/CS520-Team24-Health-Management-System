const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const authRouter = require('../routes/auth');

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('dotenv', () => ({
  config: jest.fn()
}));
jest.mock('pg', () => {
  const mockPool = {
    connect: jest.fn(),
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mockPool) };
});

describe('Authentication Routes', () => {
  let app;
  let pool;
  let mockClient;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock client for transactions
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    
    // Setup pool mock
    pool = new Pool();
    pool.connect.mockResolvedValue(mockClient);
    
    // Create express app
    app = express();
    app.use(express.json());
    app.use('/auth', authRouter);

    // Mock JWT secret
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.JWT_SECRET;
  });

  describe('POST /auth/register', () => {
    const validPatientData = {
      email: 'patient@test.com',
      password: 'password123',
      role: 'patient',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      phoneNumber: '1234567890'
    };

    const validDoctorData = {
      email: 'doctor@test.com',
      password: 'password123',
      role: 'doctor',
      firstName: 'Jane',
      lastName: 'Smith',
      specialization: 'Cardiology',
      phoneNumber: '1234567890'
    };

    it('should register a new patient successfully', async () => {
      // Mock database responses
      pool.query.mockResolvedValueOnce({ rows: [] }); // Check existing user
      
      // Mock transaction queries
      mockClient.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ 
        rows: [{ 
          id: 1, 
          email: validPatientData.email, 
          role: validPatientData.role,
          first_name: validPatientData.firstName,
          last_name: validPatientData.lastName
        }] 
      }) // INSERT INTO users
      .mockResolvedValueOnce({ rows: [] }) // INSERT INTO patients
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

      // Mock bcrypt
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');

      // Mock JWT
      jwt.sign.mockReturnValue('test-token');

      const response = await request(app)
        .post('/auth/register')
        .send(validPatientData)
        .expect('Content-Type', /json/)
        .expect(201);

      // Verify SQL queries
      expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
      // expect(mockClient.query).toHaveBeenNthCalledWith(2, expect.any(String), ['salt']);
      expect(mockClient.query).toHaveBeenNthCalledWith(2, 
        expect.stringContaining('INSERT INTO users'),
        [validPatientData.email, 'hashedPassword', validPatientData.role, validPatientData.firstName, validPatientData.lastName]
      );
      expect(mockClient.query).toHaveBeenNthCalledWith(3, 
        expect.stringContaining('INSERT INTO patients'),
        [validPatientData.firstName, validPatientData.lastName, validPatientData.email, validPatientData.dateOfBirth, validPatientData.gender, validPatientData.phoneNumber]
      );
      expect(mockClient.query).toHaveBeenNthCalledWith(4, 'COMMIT');

      expect(response.body).toHaveProperty('token', 'test-token');
      expect(response.body.user).toMatchObject({
        id: 1,
        email: validPatientData.email,
        role: validPatientData.role,
        firstName: validPatientData.firstName,
        lastName: validPatientData.lastName
      });
    });

    it('should register a new doctor successfully', async () => {
      // Mock database responses
      pool.query.mockResolvedValueOnce({ rows: [] }); // Check existing user
      
      // Mock transaction queries
      mockClient.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ 
        rows: [{ 
          id: 1, 
          email: validDoctorData.email, 
          role: validDoctorData.role,
          first_name: validDoctorData.firstName,
          last_name: validDoctorData.lastName
        }] 
      }) // INSERT INTO users
      .mockResolvedValueOnce({ rows: [] }) // INSERT INTO doctors
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

      // Mock bcrypt
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');

      // Mock JWT
      jwt.sign.mockReturnValue('test-token');

      const response = await request(app)
        .post('/auth/register')
        .send(validDoctorData)
        .expect('Content-Type', /json/)
        .expect(201);

      // Verify SQL queries
      expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
      // expect(mockClient.query).toHaveBeenNthCalledWith(2, expect.any(String), ['salt']);
      expect(mockClient.query).toHaveBeenNthCalledWith(2, 
        expect.stringContaining('INSERT INTO users'),
        [validDoctorData.email, 'hashedPassword', validDoctorData.role, validDoctorData.firstName, validDoctorData.lastName]
      );
      expect(mockClient.query).toHaveBeenNthCalledWith(3, 
        expect.stringContaining('INSERT INTO doctors'),
        [validDoctorData.firstName, validDoctorData.lastName, validDoctorData.email, validDoctorData.specialization, validDoctorData.phoneNumber]
      );
      expect(mockClient.query).toHaveBeenNthCalledWith(4, 'COMMIT');

      expect(response.body).toHaveProperty('token', 'test-token');
      expect(response.body.user).toMatchObject({
        id: 1,
        email: validDoctorData.email,
        role: validDoctorData.role,
        firstName: validDoctorData.firstName,
        lastName: validDoctorData.lastName
      });
    });

    it('should return 400 for invalid input', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123', // Too short
        role: 'invalid-role'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 if user already exists', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // User exists

      const response = await request(app)
        .post('/auth/register')
        .send(validPatientData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toEqual({ message: 'User already exists' });
    });
  });

  describe('POST /auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    it('should login successfully with valid credentials', async () => {
      // Mock database response
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: validLoginData.email,
          password_hash: 'hashedPassword',
          role: 'patient',
          first_name: 'John',
          last_name: 'Doe'
        }]
      });

      // Mock bcrypt
      bcrypt.compare.mockResolvedValue(true);

      // Mock JWT
      jwt.sign.mockReturnValue('test-token');

      const response = await request(app)
        .post('/auth/login')
        .send(validLoginData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('token', 'test-token');
      expect(response.body.user).toMatchObject({
        email: validLoginData.email,
        role: 'patient',
        firstName: 'John',
        lastName: 'Doe'
      });
    });

    it('should return 400 for invalid credentials', async () => {
      // Mock database response
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: validLoginData.email,
          password_hash: 'hashedPassword',
          role: 'patient',
          first_name: 'John',
          last_name: 'Doe'
        }]
      });

      // Mock bcrypt
      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app)
        .post('/auth/login')
        .send(validLoginData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toEqual({ message: 'Invalid credentials' });
    });

    it('should return 400 for non-existent user', async () => {
      // Mock database response
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/auth/login')
        .send(validLoginData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toEqual({ message: 'Invalid credentials' });
    });

    it('should return 400 for invalid input', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '' // Empty password
      };

      const response = await request(app)
        .post('/auth/login')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });
}); 