const request = require('supertest');
const express = require('express');
const { Pool } = require('pg');
const appointmentsRouter = require('../routes/appointments');

// Mock the pg Pool
jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mockPool) };
});

describe('Appointments Routes', () => {
  let app;
  let pool;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create a new express app for each test
    app = express();
    app.use(express.json());
    app.use('/appointments', appointmentsRouter);
    
    // Get the mocked pool instance
    pool = new Pool();
  });

  describe('GET /appointments', () => {
    it('should return all appointments', async () => {
      const mockAppointments = [
        {
          id: 1,
          doctor_id: 1,
          patient_id: 1,
          appointment_date: '2024-03-20T10:00:00Z',
          status: 'scheduled',
          doctor_first_name: 'John',
          doctor_last_name: 'Doe',
          patient_first_name: 'Jane',
          patient_last_name: 'Smith'
        }
      ];

      pool.query.mockResolvedValueOnce({ rows: mockAppointments });

      const response = await request(app)
        .get('/appointments')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockAppointments);
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it('should handle server errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/appointments')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({ message: 'Server error' });
    });
  });

  describe('GET /appointments/doctor/:doctorId', () => {
    it('should return appointments for a specific doctor', async () => {
      const mockAppointments = [
        {
          id: 1,
          doctor_id: 1,
          patient_id: 1,
          appointment_date: '2024-03-20T10:00:00Z',
          status: 'scheduled',
          patient_first_name: 'Jane',
          patient_last_name: 'Smith'
        }
      ];

      pool.query.mockResolvedValueOnce({ rows: mockAppointments });

      const response = await request(app)
        .get('/appointments/doctor/1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockAppointments);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['1']
      );
    });

    it('should handle server errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/appointments/doctor/1')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({ message: 'Server error' });
    });

    it('should handle invalid doctor ID', async () => {
      const response = await request(app)
        .get('/appointments/doctor/invalid')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({ message: 'Server error' });
    });
  });

  describe('GET /appointments/patient/:patientId', () => {
    it('should return appointments for a specific patient', async () => {
      const mockAppointments = [
        {
          id: 1,
          doctor_id: 1,
          patient_id: 1,
          appointment_date: '2024-03-20T10:00:00Z',
          status: 'scheduled',
          doctor_first_name: 'John',
          doctor_last_name: 'Doe'
        }
      ];

      pool.query.mockResolvedValueOnce({ rows: mockAppointments });

      const response = await request(app)
        .get('/appointments/patient/1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockAppointments);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['1']
      );
    });

    it('should handle server errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/appointments/patient/1')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({ message: 'Server error' });
    });

    it('should handle invalid patient ID', async () => {
      const response = await request(app)
        .get('/appointments/patient/invalid')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({ message: 'Server error' });
    });
  });

  describe('POST /appointments', () => {
    const validAppointment = {
      doctorId: 1,
      patientId: 1,
      appointmentDate: '2024-03-20T10:00:00Z',
      status: 'scheduled',
      notes: 'Regular checkup'
    };

    it('should create a new appointment', async () => {
      const mockDoctor = { id: 1 };
      const mockPatient = { id: 1 };
      const mockCreatedAppointment = {
        id: 1,
        ...validAppointment,
        doctor_id: validAppointment.doctorId,
        patient_id: validAppointment.patientId,
        appointment_date: validAppointment.appointmentDate
      };

      pool.query
        .mockResolvedValueOnce({ rows: [mockDoctor] })
        .mockResolvedValueOnce({ rows: [mockPatient] })
        .mockResolvedValueOnce({ rows: [mockCreatedAppointment] });

      const response = await request(app)
        .post('/appointments')
        .send(validAppointment)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toEqual(mockCreatedAppointment);
    });

    it('should create appointment without patient ID', async () => {
      const appointmentWithoutPatient = {
        doctorId: 1,
        appointmentDate: '2024-03-20T10:00:00Z',
        status: 'scheduled'
      };

      const mockDoctor = { id: 1 };
      const mockCreatedAppointment = {
        id: 1,
        ...appointmentWithoutPatient,
        doctor_id: appointmentWithoutPatient.doctorId,
        patient_id: null,
        appointment_date: appointmentWithoutPatient.appointmentDate
      };

      pool.query
        .mockResolvedValueOnce({ rows: [mockDoctor] })
        .mockResolvedValueOnce({ rows: [mockCreatedAppointment] });

      const response = await request(app)
        .post('/appointments')
        .send(appointmentWithoutPatient)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toEqual(mockCreatedAppointment);
    });

    it('should return 404 if doctor not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/appointments')
        .send(validAppointment)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toEqual({ message: 'Doctor not found' });
    });

    it('should return 404 if patient not found', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Doctor exists
        .mockResolvedValueOnce({ rows: [] }); // Patient not found

      const response = await request(app)
        .post('/appointments')
        .send(validAppointment)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toEqual({ message: 'Patient not found' });
    });

    it('should validate required fields', async () => {
      const invalidAppointment = {
        doctorId: 'not-a-number',
        appointmentDate: 'invalid-date',
        status: 'invalid-status'
      };

      const response = await request(app)
        .post('/appointments')
        .send(invalidAppointment)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should handle server errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/appointments')
        .send(validAppointment)
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({ message: 'Server error' });
    });
  });

  describe('PUT /appointments/:id', () => {
    it('should update an existing appointment', async () => {
      const updateData = {
        status: 'completed',
        notes: 'Updated notes'
      };

      const mockUpdatedAppointment = {
        id: 1,
        status: 'completed',
        notes: 'Updated notes'
      };

      pool.query.mockResolvedValueOnce({ rows: [mockUpdatedAppointment] });

      const response = await request(app)
        .put('/appointments/1')
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockUpdatedAppointment);
    });

    it('should update appointment date', async () => {
      const updateData = {
        appointmentDate: '2024-03-21T10:00:00Z'
      };

      const mockUpdatedAppointment = {
        id: 1,
        appointment_date: '2024-03-21T10:00:00Z'
      };

      pool.query.mockResolvedValueOnce({ rows: [mockUpdatedAppointment] });

      const response = await request(app)
        .put('/appointments/1')
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockUpdatedAppointment);
    });

    it('should update multiple fields', async () => {
      const updateData = {
        appointmentDate: '2024-03-21T10:00:00Z',
        status: 'completed',
        notes: 'Updated notes'
      };

      const mockUpdatedAppointment = {
        id: 1,
        appointment_date: '2024-03-21T10:00:00Z',
        status: 'completed',
        notes: 'Updated notes'
      };

      pool.query.mockResolvedValueOnce({ rows: [mockUpdatedAppointment] });

      const response = await request(app)
        .put('/appointments/1')
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockUpdatedAppointment);
    });

    it('should return 404 for non-existent appointment', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .put('/appointments/999')
        .send({ status: 'completed' })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toEqual({ message: 'Appointment not found' });
    });

    it('should validate update fields', async () => {
      const invalidUpdate = {
        appointmentDate: 'invalid-date',
        status: 'invalid-status'
      };

      const response = await request(app)
        .put('/appointments/1')
        .send(invalidUpdate)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should handle server errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .put('/appointments/1')
        .send({ status: 'completed' })
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({ message: 'Server error' });
    });
  });

  describe('DELETE /appointments/:id', () => {
    it('should delete an existing appointment', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .delete('/appointments/1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({ message: 'Appointment deleted successfully' });
    });

    it('should return 404 for non-existent appointment', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .delete('/appointments/999')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toEqual({ message: 'Appointment not found' });
    });

    it('should handle server errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .delete('/appointments/1')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({ message: 'Server error' });
    });

    it('should handle invalid appointment ID', async () => {
      const response = await request(app)
        .delete('/appointments/invalid')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({ message: 'Server error' });
    });
  });
}); 