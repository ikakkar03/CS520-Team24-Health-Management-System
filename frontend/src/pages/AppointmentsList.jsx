import { useState } from "react";
import Card from "../components/Card";

export default function AppointmentsList() {
  const [appointments] = useState([
    { id:1, patient:'John Doe', doctor:'Alice Smith', date:'2025-05-15 10:00' },
    { id:2, patient:'Jane Roe', doctor:'Bob Jones', date:'2025-05-16 14:30' },
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Appointments</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {appointments.map(a => (
          <Card key={a.id} className="flex flex-col">
            <p><span className="font-semibold">Patient:</span> {a.patient}</p>
            <p><span className="font-semibold">Doctor:</span> {a.doctor}</p>
            <p><span className="font-semibold">When:</span> {a.date}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}