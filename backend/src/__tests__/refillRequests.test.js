const request = require('supertest');
const express = require('express');
const { Pool } = require('pg');
const refillRequestsRouter = require('../routes/refillRequests');

// Mock the pg Pool
jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mockPool) };
});

describe('Refill Requests Routes', () => {
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
    app.use('/refill-requests', refillRequestsRouter);
  });

  describe('POST /refill-requests', () => {
    it('should create a new refill request', async () => {
      const mockRequest = {
        id: 1,
        prescription_id: 1,
        patient_id: 1,
        status: 'pending',
        requested_at: '2024-03-20T10:00:00Z'
      };

      pool.query.mockResolvedValueOnce({ rows: [mockRequest] });

      const response = await request(app)
        .post('/refill-requests')
        .send({
          prescription_id: 1,
          patient_id: 1
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toEqual(mockRequest);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO refill_requests'),
        [1, 1]
      );
    });

    it('should handle server errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/refill-requests')
        .send({
          prescription_id: 1,
          patient_id: 1
        })
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({ message: 'Server error' });
    });
  });

  describe('GET /refill-requests', () => {
    it('should return all refill requests with medications', async () => {
      const mockRequests = [
        {
          id: 1,
          prescription_id: 1,
          patient_id: 1,
          status: 'pending',
          requested_at: '2024-03-20T10:00:00Z',
          responded_at: null,
          patient_first_name: 'John',
          patient_last_name: 'Doe',
          medications: [
            {
              medicationName: 'Medication A',
              dosage: '10mg',
              frequency: 'daily',
              duration: '7 days'
            }
          ]
        }
      ];

      pool.query.mockResolvedValueOnce({ rows: mockRequests });

      const response = await request(app)
        .get('/refill-requests')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockRequests);
    });

    it('should handle server errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/refill-requests')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({ message: 'Server error' });
    });
  });

  describe('PUT /refill-requests/:id/:action', () => {
    it('should approve a refill request', async () => {
      const mockRequest = {
        id: 1,
        prescription_id: 1,
        patient_id: 1,
        status: 'approved',
        requested_at: '2024-03-20T10:00:00Z',
        responded_at: '2024-03-20T10:05:00Z'
      };

      pool.query.mockResolvedValueOnce({ rows: [mockRequest] });

      const response = await request(app)
        .put('/refill-requests/1/approve')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockRequest);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE refill_requests'),
        ['approved', '1']
      );
    });

    it('should reject a refill request', async () => {
      const mockRequest = {
        id: 1,
        prescription_id: 1,
        patient_id: 1,
        status: 'rejected',
        requested_at: '2024-03-20T10:00:00Z',
        responded_at: '2024-03-20T10:05:00Z'
      };

      pool.query.mockResolvedValueOnce({ rows: [mockRequest] });

      const response = await request(app)
        .put('/refill-requests/1/reject')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockRequest);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE refill_requests'),
        ['rejected', '1']
      );
    });

    it('should return 400 for invalid action', async () => {
      const response = await request(app)
        .put('/refill-requests/1/invalid')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toEqual({ message: 'Invalid action' });
    });

    it('should return 404 for non-existent request', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .put('/refill-requests/999/approve')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toEqual({ message: 'Request not found' });
    });

    it('should handle server errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .put('/refill-requests/1/approve')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({ message: 'Server error' });
    });
  });
}); 