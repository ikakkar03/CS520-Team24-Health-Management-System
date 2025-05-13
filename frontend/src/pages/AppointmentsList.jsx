import { useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import BookingCalendar from "../components/BookingCalender";
import SearchDropdown from "../components/SearchDropdown";
import { useAuth } from "../context/AuthContext";

export default function AppointmentsList() {
  const { user } = useAuth();
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [notes, setNotes] = useState("");
  const [appointments, setAppointments] = useState([]);

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    
    if (!selectedDoctor || !selectedPatient || !appointmentDate) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          patientId: selectedPatient.id,
          appointmentDate,
          status: "scheduled",
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create appointment");
      }

      const newAppointment = await response.json();
      setAppointments([...appointments, newAppointment]);
      
      // Reset form
      setSelectedDoctor(null);
      setSelectedPatient(null);
      setAppointmentDate("");
      setNotes("");
    } catch (error) {
      console.error("Error creating appointment:", error);
      alert("Failed to create appointment");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Appointments</h2>
      
      <Card className="p-6">
        <form onSubmit={handleCreateAppointment} className="space-y-4">
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