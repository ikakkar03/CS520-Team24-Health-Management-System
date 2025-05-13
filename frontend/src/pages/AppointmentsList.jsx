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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Appointments</h2>
      
      <Card className="p-6">
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
      </Card>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Upcoming Appointments</h3>
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">
                    {user?.role === "patient"
                      ? `Dr. ${appointment.doctor_first_name} ${appointment.doctor_last_name}`
                      : `${appointment.patient_first_name} ${appointment.patient_last_name}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(appointment.appointment_date).toLocaleString()}
                  </p>
                  {appointment.notes && (
                    <p className="text-sm text-gray-600 mt-2">{appointment.notes}</p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded text-sm ${
                  appointment.status === "scheduled"
                    ? "bg-blue-100 text-blue-800"
                    : appointment.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {appointment.status}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}