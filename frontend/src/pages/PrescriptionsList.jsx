import { useState } from "react";
import Card from "../components/Card";

export default function PrescriptionsList() {
  const [prescriptions] = useState([
    { id:1, patient:'John Doe', med:'Atorvastatin', dose:'10mg', freq:'Once daily' },
    { id:2, patient:'Jane Roe', med:'Metformin', dose:'500mg', freq:'Twice daily' },
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Prescriptions</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {prescriptions.map(p => (
          <Card key={p.id} className="flex flex-col">
            <p><span className="font-semibold">Patient:</span> {p.patient}</p>
            <p><span className="font-semibold">Medication:</span> {p.med}</p>
            <p><span className="font-semibold">Dose:</span> {p.dose}</p>
            <p><span className="font-semibold">Frequency:</span> {p.freq}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}