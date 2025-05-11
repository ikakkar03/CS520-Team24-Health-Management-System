import { useState, useEffect } from "react";

const times = ["10:00 AM", "10:30 AM", "11:00 AM"];

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  return days;
}

function getCalendarMatrix(year, month) {
  const days = getMonthDays(year, month);
  const firstDayOfWeek = days[0].getDay();
  const matrix = [];
  let week = new Array(firstDayOfWeek).fill(null);
  days.forEach((date) => {
    if (week.length === 7) {
      matrix.push(week);
      week = [];
    }
    week.push(date);
  });
  while (week.length < 7) week.push(null);
  matrix.push(week);
  return matrix;
}

export default function BookingCalendar({ onBack, onBook, initialDate, initialTime, isReschedule }) {
  // Parse initialDate if provided
  const initialDateObj = initialDate ? new Date(initialDate) : new Date(2025, 4, 11);
  const [year, setYear] = useState(initialDateObj.getFullYear());
  const [month, setMonth] = useState(initialDateObj.getMonth());
  const [selectedDate, setSelectedDate] = useState(initialDateObj);
  const [selectedTime, setSelectedTime] = useState(initialTime || times[1]);

  useEffect(() => {
    if (initialDate) {
      const d = new Date(initialDate);
      setYear(d.getFullYear());
      setMonth(d.getMonth());
      setSelectedDate(d);
    }
    if (initialTime) {
      setSelectedTime(initialTime);
    }
    // eslint-disable-next-line
  }, [initialDate, initialTime]);

  const calendar = getCalendarMatrix(year, month);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };
  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-start justify-center pt-12">
      <div className="bg-transparent w-full flex flex-col md:flex-row items-center justify-center gap-12 py-8">
        <div className="mb-8 md:mb-0">
          <div className="flex items-center justify-between mb-2">
            <button onClick={handlePrevMonth} className="text-2xl px-2">&#60;</button>
            <h3 className="font-bold text-lg">{monthNames[month]} {year}</h3>
            <button onClick={handleNextMonth} className="text-2xl px-2">&#62;</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2 text-gray-500">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-xs font-semibold">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendar.map((week, i) =>
              week.map((date, j) =>
                date ? (
                  <button
                    key={date.toISOString()}
                    className={`w-8 h-8 rounded-full text-sm transition-all
                      ${date.getTime() === selectedDate.getTime()
                        ? "bg-blue-600 text-white"
                        : "hover:bg-blue-100 text-black"}
                    `}
                    onClick={() => setSelectedDate(date)}
                  >
                    {date.getDate()}
                  </button>
                ) : (
                  <div key={`empty-${i}-${j}`} />
                )
              )
            )}
          </div>
        </div>
        {/* Time Picker */}
        <div className="w-full max-w-xs">
          <h3 className="font-bold mb-4 text-center text-lg">Select the Time</h3>
          <div className="flex flex-col gap-2">
            {times.map((time) => (
              <button
                key={time}
                className={`rounded-full px-8 py-2 border transition-all
                  ${selectedTime === time
                    ? "bg-blue-600 text-white"
                    : "bg-white text-black border-gray-300"}
                `}
                onClick={() => setSelectedTime(time)}
              >
                {time}
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-6">
            <button onClick={onBack} className="text-gray-500">Back</button>
            <button
              onClick={() => onBook(selectedDate.toISOString().slice(0, 10), selectedTime)}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              {isReschedule ? 'Reschedule' : 'Book'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
