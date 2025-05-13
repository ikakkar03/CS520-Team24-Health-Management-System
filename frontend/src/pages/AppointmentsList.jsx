import { useState, useEffect } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import BookingCalendar from "../components/BookingCalender";
import SearchDropdown from "../components/SearchDropdown";
import { useAuth } from "../context/AuthContext";

// Add the backend base URL
const BACKEND_URL = 'http://localhost:5000';

export default function AppointmentsList() {
  const { user } = useAuth();
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [notes, setNotes] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");
  const [patientId, setPatientId] = useState(null);
  const [doctorId, setDoctorId] = useState(null);

  // Fetch appointments with doctor and patient details
  const fetchAppointments = async () => {
    try {
      const endpoint = user?.role === 'patient' 
        ? `${BACKEND_URL}/api/appointments/patient/${patientId}`
        : `${BACKEND_URL}/api/appointments/doctor/${doctorId}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to load appointments');
    }
  };

  // Fetch IDs when user logs in
  useEffect(() => {
    const fetchIds = async () => {
      try {
        if (user?.role === 'patient') {
          const response = await fetch(`${BACKEND_URL}/api/patients/email/${user.email}`);
          if (!response.ok) {
            throw new Error('Failed to fetch patient information');
          }
          const patientData = await response.json();
          console.log('Fetched patient data:', patientData);
          setPatientId(patientData.id);
        } else if (user?.role === 'doctor') {
          console.log('Fetching doctor data for email:', user.email);
          const response = await fetch(`${BACKEND_URL}/api/doctors/email/${user.email}`);
          console.log('Doctor fetch response status:', response.status);
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to fetch doctor data:', {
              status: response.status,
              statusText: response.statusText,
              errorText
            });
            throw new Error(`Failed to fetch doctor information: ${response.statusText}`);
          }
          const doctorData = await response.json();
          console.log('Fetched doctor data:', doctorData);
          if (!doctorData || !doctorData.id) {
            console.error('Invalid doctor data received:', doctorData);
            throw new Error('Doctor data is missing ID');
          }
          console.log('Setting doctor ID:', doctorData.id);
          setDoctorId(doctorData.id);
        }
      } catch (error) {
        console.error('Error fetching user information:', error);
        setError('Failed to load user information: ' + error.message);
      }
    };

    if (user?.email) {
      console.log('Fetching IDs for user:', {
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      });
      fetchIds();
    }
  }, [user]);

  // Fetch appointments when IDs are set
  useEffect(() => {
    if ((user?.role === 'patient' && patientId) || (user?.role === 'doctor' && doctorId)) {
      fetchAppointments();
    }
  }, [user, patientId, doctorId]);

  const validateAppointmentDate = (date) => {
    const selectedDate = new Date(date);
    const now = new Date();
    
    // Check if date is in the future
    if (selectedDate <= now) {
      return 'Appointment date must be in the future';
    }
    
    // Check if date is within next 6 months
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    if (selectedDate > sixMonthsFromNow) {
      return 'Appointment cannot be scheduled more than 6 months in advance';
    }
    
    return null;
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    setError("");
    
    // Debug log the form values
    console.log('Form values:', {
      selectedDoctor,
      selectedPatient,
      appointmentDate,
      notes,
      user,
      patientId,
      doctorId
    });

    // Check if all required fields are filled
    if (!appointmentDate) {
      setError('Please fill in all required fields: appointment date');
      return;
    }

    // Validate appointment date
    const dateError = validateAppointmentDate(appointmentDate);
    if (dateError) {
      setError(dateError);
      return;
    }

    if (user?.role === 'patient' && !selectedDoctor) {
      setError('Please fill in all required fields: doctor');
      return;
    }

    if (user?.role === 'doctor' && !selectedPatient) {
      setError('Please fill in all required fields: patient');
      return;
    }

    try {
      // Ensure we have valid IDs - use parseInt consistently for both IDs
      const doctorIdToUse = user.role === "patient" ? parseInt(selectedDoctor.id) : parseInt(doctorId);
      const patientIdToUse = user.role === "patient" ? parseInt(patientId) : parseInt(selectedPatient.id);

      // Debug log the IDs
      console.log('Using IDs:', {
        doctorIdToUse,
        patientIdToUse,
        selectedDoctor,
        selectedPatient,
        doctorId,
        patientId
      });

      if (!doctorIdToUse || !patientIdToUse || isNaN(doctorIdToUse) || isNaN(patientIdToUse)) {
        console.error('Invalid IDs:', {
          doctorIdToUse,
          patientIdToUse,
          selectedDoctor,
          selectedPatient,
          doctorId,
          patientId
        });
        throw new Error('Invalid doctor or patient ID');
      }

      // Convert appointment date to UTC to avoid timezone issues
      const appointmentDateUTC = new Date(appointmentDate).toISOString();

      const appointmentData = {
        doctorId: doctorIdToUse,
        patientId: patientIdToUse,
        appointmentDate: appointmentDateUTC,
        status: "scheduled",
        notes: notes || undefined
      };

      console.log('Sending appointment data:', appointmentData);

      const response = await fetch(`${BACKEND_URL}/api/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Server response:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          requestData: appointmentData
        });
        throw new Error(errorData?.message || `Failed to create appointment: ${response.statusText}`);
      }

      const newAppointment = await response.json();
      console.log('Created appointment:', newAppointment);
      
      // Reset form
      setSelectedDoctor(null);
      setSelectedPatient(null);
      setAppointmentDate("");
      setNotes("");
      setError("");

      // Fetch updated appointments list
      await fetchAppointments();
    } catch (error) {
      console.error("Error creating appointment:", error);
      setError(error.message || "Failed to create appointment. Please try again.");
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/appointments/${appointmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to delete appointment');
      }

      // Remove the deleted appointment from the state
      setAppointments(prevAppointments => 
        prevAppointments.filter(appointment => appointment.id !== appointmentId)
      );
    } catch (error) {
      console.error('Error deleting appointment:', error);
      setError(error.message || 'Failed to delete appointment');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Appointments</h1>
      
      {/* Create Appointment Form */}
      <div className="bg-white dark:bg-dark-bg rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Create New Appointment</h2>
        <form onSubmit={handleCreateAppointment} className="space-y-4">
          {error && (
            <div className="text-red-500 text-sm mb-4">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user?.role === "patient" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Doctor
                </label>
                <SearchDropdown
                  type="doctor"
                  onSelect={setSelectedDoctor}
                  placeholder="Search for a doctor..."
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Patient
                </label>
                <SearchDropdown
                  type="patient"
                  onSelect={setSelectedPatient}
                  placeholder="Search for a patient..."
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Appointment Date
              </label>
              <input
                type="datetime-local"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Add any additional notes..."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create Appointment
          </button>
        </form>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white dark:bg-dark-bg rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Upcoming Appointments</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {appointments.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No upcoming appointments</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="bg-gray-50 dark:bg-dark-bg-secondary rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">
                      {user.role === 'patient' ? (
                        `Dr. ${appointment.doctor_first_name} ${appointment.doctor_last_name}`
                      ) : (
                        `${appointment.patient_first_name} ${appointment.patient_last_name}`
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(appointment.appointment_date).toLocaleString()}
                    </p>
                    {appointment.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Notes: {appointment.notes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteAppointment(appointment.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    title="Delete appointment"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}