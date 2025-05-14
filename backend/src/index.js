// File: index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Pool } = require('pg');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');            // ← import this

const authRoutes = require('./routes/auth');
const doctorsRoutes = require('./routes/doctors');
const patientsRoutes = require('./routes/patients');
const appointmentsRoutes = require('./routes/appointments');
const prescriptionsRoutes = require('./routes/prescriptions');
const messagesRoutes = require('./routes/messages');
const refillRequestsRoutes = require('./routes/refillRequests');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring client', err.stack);
  } else {
    console.log('Successfully connected to PostgreSQL database');
    release();
  }
});

// REST routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/prescriptions', prescriptionsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/refill-requests', refillRequestsRoutes);

// Basic health-check
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Healthcare Management System API' });
});

// Create HTTP server & attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Authenticate sockets with JWT
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.userId;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Handle socket connections
io.on('connection', socket => {
  console.log(`User ${socket.userId} connected via WebSocket`);
  socket.join(`user_${socket.userId}`);

  socket.on('join_chat', () => {
    socket.join(`user_${socket.userId}`);
  });

  socket.on('typing', ({ receiverId, isTyping }) => {
    io.to(`user_${receiverId}`).emit('user_typing', {
      userId: socket.userId,
      isTyping
    });
  });

  socket.on('send_message', async ({ receiverId, content }) => {
    try {
      const result = await pool.query(
        `INSERT INTO messages (sender_id, receiver_id, content)
         VALUES ($1, $2, $3) RETURNING *`,
        [socket.userId, receiverId, content]
      );
      const message = result.rows[0];

      io.to(`user_${receiverId}`)
        .to(`user_${socket.userId}`)
        .emit('new_message', message);
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected`);
    socket.leave(`user_${socket.userId}`);
  });
});

// Start the combined HTTP + WebSocket server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server (with WebSocket) running on port ${PORT}`);
});
