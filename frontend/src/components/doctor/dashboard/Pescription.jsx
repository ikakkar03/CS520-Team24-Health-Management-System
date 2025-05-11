import { useState } from "react";

export default function Pescription({ onSend }) {
  const [patient, setPatient] = useState("");
  const [medications, setMedications] = useState([
    { name: "", dose: "", freq: "" }
  ]);
  const [notes, setNotes] = useState("");

  const handleMedChange = (idx, field, value) => {
    setMedications(meds => meds.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  const addMedication = () => {
    setMedications(meds => [...meds, { name: "", dose: "", freq: "" }]);
  };

  const removeMedication = idx => {
    setMedications(meds => meds.filter((_, i) => i !== idx));
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (onSend) onSend({ patient, medications, notes });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto border rounded-lg p-6 bg-white shadow flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-2">Electronic Prescription</h2>
      <input
        className="border rounded px-3 py-2 mb-2"
        placeholder="Patient Search"
        value={patient}
        onChange={e => setPatient(e.target.value)}
      />
      {medications.map((med, idx) => (
        <div key={idx} className="flex gap-2 mb-2">
          <input
            className="border rounded px-2 py-1 flex-1"
            placeholder={`Medication #${idx + 1}`}
            value={med.name}
            onChange={e => handleMedChange(idx, "name", e.target.value)}
          />
          <input
            className="border rounded px-2 py-1 w-20"
            placeholder="Dose"
            value={med.dose}
            onChange={e => handleMedChange(idx, "dose", e.target.value)}
          />
          <input
            className="border rounded px-2 py-1 w-28"
            placeholder="Frequency"
            value={med.freq}
            onChange={e => handleMedChange(idx, "freq", e.target.value)}
          />
          {medications.length > 1 && (
            <button type="button" className="text-red-500 px-2" onClick={() => removeMedication(idx)}>&times;</button>
          )}
        </div>
      ))}
      <button type="button" className="text-blue-600 text-sm self-start" onClick={addMedication}>+ Add Medication</button>
      <textarea
        className="border rounded px-3 py-2 min-h-[60px]"
        placeholder="Additional Notes"
        value={notes}
        onChange={e => setNotes(e.target.value)}
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded mt-2 hover:bg-blue-700"
      >
        Send Prescription
      </button>
    </form>
  );
}
