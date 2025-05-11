import { useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import BookingCalendar from "../components/BookingCalender";

export default function AppointmentsList() {
  // Only one appointment for demo; extend for multiple if needed
  const [appointment, setAppointment] = useState(null); // {date, time, ...}
  const [showBookingCalendar, setShowBookingCalendar] = useState(false);
  const [isReschedule, setIsReschedule] = useState(false);

  // Open calendar for booking (no pre-selected date/time)
  const handleBookAppointment = () => {
    setIsReschedule(false);
    setShowBookingCalendar(true);
  };

  // Open calendar for rescheduling (pre-select current booking)
  const handleReschedule = () => {
    setIsReschedule(true);
    setShowBookingCalendar(true);
  };

  // Close calendar
  const handleBack = () => {
    setShowBookingCalendar(false);
    setIsReschedule(false);
  };

  // Save booking or reschedule
  const handleBook = (date, time) => {
    setAppointment({
      doctor: 'Dr. Sarah White',
      specialization: 'Cardiology',
      date,
      time
    });
    setShowBookingCalendar(false);
    setIsReschedule(false);
  };

  return (
    <div className="space-y-6">
      {showBookingCalendar ? (
        <BookingCalendar
          onBack={handleBack}
          onBook={handleBook}
          initialDate={isReschedule && appointment ? appointment.date : null}
          initialTime={isReschedule && appointment ? appointment.time : null}
          isReschedule={isReschedule}
        />
      ) : (
        <>
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Upcoming Appointment</h2>
            {appointment ? (
              <Card className="p-4">
                <div className="flex items-center">
                  <div className="h-16 w-16 rounded-full bg-gray-300 mr-4"></div>
                  <div>
                    <p className="font-semibold">{appointment.doctor}</p>
                    <p className="text-sm text-gray-600">{appointment.specialization}</p>
                    <p className="text-sm">{appointment.date} at {appointment.time}</p>
                  </div>
                </div>
                <div className="flex justify-end mt-4 space-x-2">
                  <Button
                    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded"
                    onClick={handleReschedule}
                  >
                    Reschedule
                  </Button>
                  <Button className="bg-blue-600 text-white px-4 py-2 rounded">
                    Cancel
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-4 text-center text-gray-500">No appointment booked yet.</Card>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">Schedule Appointment</h2>
            <Card className="p-4 flex justify-center">
              <Button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={handleBookAppointment}
              >
                Book Appointment
              </Button>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}