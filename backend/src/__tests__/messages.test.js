const request = require('supertest');
const express = require('express');
const { Pool } = require('pg');
const messagesRouter = require('../routes/messages');

// Mock the pg Pool
jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mockPool) };
});

describe('Messages Routes', () => {
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
    app.use('/messages', messagesRouter);
  });

  describe('GET /messages/conversations/:userId', () => {
    it('should return all conversations for a user', async () => {
      const mockConversations = [
        {
          other_user_id: 2,
          last_message_time: '2024-03-20T10:00:00Z',
          first_name: 'John',
          last_name: 'Doe'
        },
        {
          other_user_id: 3,
          last_message_time: '2024-03-19T15:30:00Z',
          first_name: 'Jane',
          last_name: 'Smith'
        }
      ];

      pool.query.mockResolvedValueOnce({ rows: mockConversations });

      const response = await request(app)
        .get('/messages/conversations/1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockConversations);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      );
    });

    it('should handle server errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/messages/conversations/1')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({ message: 'Server error' });
    });

    it('should handle invalid user ID', async () => {
      const response = await request(app)
        .get('/messages/conversations/invalid')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({ message: 'Server error' });
    });
  });

  describe('GET /messages/conversation/:userId/:otherId', () => {
    it('should return conversation history between two users', async () => {
      const mockMessages = [
        {
          id: 1,
          sender_id: 1,
          receiver_id: 2,
          content: 'Hello',
          created_at: '2024-03-20T10:00:00Z'
        },
        {
          id: 2,
          sender_id: 2,
          receiver_id: 1,
          content: 'Hi there',
          created_at: '2024-03-20T10:01:00Z'
        }
      ];

      pool.query.mockResolvedValueOnce({ rows: mockMessages });

      const response = await request(app)
        .get('/messages/conversation/1/2')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockMessages);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1, 2]
      );
    });

    it('should handle server errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/messages/conversation/1/2')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({ message: 'Server error' });
    });

    it('should handle invalid user IDs', async () => {
      const response = await request(app)
        .get('/messages/conversation/invalid/invalid')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({ message: 'Server error' });
    });

    it('should return empty array when no messages exist', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/messages/conversation/1/999')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });
}); 