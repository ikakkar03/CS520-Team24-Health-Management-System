import { useState } from "react";
import Card from "../components/Card";

export default function DoctorsList() {
  const [doctors] = useState([
    { id:1, firstName:'Alice', lastName:'Smith', specialization:'Cardiology' },
    { id:2, firstName:'Bob', lastName:'Jones', specialization:'Dermatology' },
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Doctors</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {doctors.map(d => (
          <Card key={d.id} className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Dr. {d.firstName} {d.lastName}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{d.specialization}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}