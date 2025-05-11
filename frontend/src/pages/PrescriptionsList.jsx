import { useState } from "react";
import Card from "../components/Card";
import Pescription from "../components/Pescription";

export default function PrescriptionsList() {
  const [prescriptions, setPrescriptions] = useState([
    { id:1, patient:'John Doe', med:'Atorvastatin', dose:'10mg', freq:'Once daily' },
    { id:2, patient:'Jane Roe', med:'Metformin', dose:'500mg', freq:'Twice daily' },
  ]);

  const handleSend = ({ patient, medications, notes }) => {
    medications.forEach((med, idx) => {
      setPrescriptions(prev => [
        ...prev,
        {
          id: Date.now() + idx,
          patient,
          med: med.name,
          dose: med.dose,
          freq: med.freq,
          notes
        }
      ]);
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Prescriptions</h2>
      <Pescription onSend={handleSend} />
    </div>
  );
}