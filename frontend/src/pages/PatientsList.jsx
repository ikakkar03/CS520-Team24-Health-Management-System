import { useState } from "react";
import Card from "../components/Card";

export default function PatientsList() {
  const [patients] = useState([
    { id:1, name:'John Doe', dob:'1985-04-12' },
    { id:2, name:'Jane Roe', dob:'1990-09-30' },
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Patients</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {patients.map(p => (
          <Card key={p.id} className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">DOB: {p.dob}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}