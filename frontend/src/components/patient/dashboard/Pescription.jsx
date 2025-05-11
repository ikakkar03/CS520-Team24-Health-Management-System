import { useState } from "react";

export default function PrescriptionPatient() {
  const [prescriptions, setPrescriptions] = useState([
    {
      id: 1,
      doctor: "Dr. John Smith",
      date: "2023-06-15",
      medications: [
        { name: "Amoxicillin", dose: "500mg", freq: "3x daily" },
        { name: "Ibuprofen", dose: "400mg", freq: "as needed" }
      ],
      notes: "Take with food. Complete full course of antibiotics."
    },
    {
      id: 2,
      doctor: "Dr. Sarah Johnson",
      date: "2023-05-28",
      medications: [
        { name: "Loratadine", dose: "10mg", freq: "1x daily" }
      ],
      notes: "Take in the morning for seasonal allergies."
    }
  ]);

  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">My Prescriptions</h2>
      
      {prescriptions.length === 0 ? (
        <p className="text-gray-500 text-center py-8">You have no prescriptions yet.</p>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <div 
              key={prescription.id} 
              className="border rounded-lg bg-white shadow overflow-hidden"
            >
              <div 
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleExpand(prescription.id)}
              >
                <div>
                  <h3 className="font-semibold">{prescription.doctor}</h3>
                  <p className="text-sm text-gray-600">{prescription.date}</p>
                </div>
                <div className="text-blue-600">
                  {expandedId === prescription.id ? "▲" : "▼"}
                </div>
              </div>
              
              {expandedId === prescription.id && (
                <div className="p-4 border-t">
                  <h4 className="font-medium mb-2">Medications:</h4>
                  <ul className="mb-4">
                    {prescription.medications.map((med, idx) => (
                      <li key={idx} className="mb-2 pl-2 border-l-2 border-blue-200">
                        <span className="font-medium">{med.name}</span> - {med.dose}, {med.freq}
                      </li>
                    ))}
                  </ul>
                  
                  {prescription.notes && (
                    <>
                      <h4 className="font-medium mb-2">Doctor's Notes:</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded">{prescription.notes}</p>
                    </>
                  )}
                  
                  <div className="mt-4 flex gap-2">
                    <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                      Print
                    </button>
                    <button className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200">
                      Request Refill
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
