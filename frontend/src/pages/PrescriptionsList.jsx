import { useState, useEffect } from "react";
import SearchDropdown from "../components/SearchDropdown";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../constants";

export default function PrescriptionsList() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([
    { id:1, patient:'John Doe', med:'Atorvastatin', dose:'10mg', freq:'Once daily' },
    { id:2, patient:'Jane Roe', med:'Metformin', dose:'500mg', freq:'Twice daily' },
  ]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [medications, setMedications] = useState([{ name: '', dose: '', freq: '' }]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState("");

  // Only allow doctors to access this page
  useEffect(() => {
    if (user?.role !== 'doctor') {
      setError('Only doctors can access this page');
    }
  }, [user]);

  const handleAddMedication = () => {
    setMedications([...medications, { name: '', dose: '', freq: '' }]);
  };

  const handleMedicationChange = (index, field, value) => {
    const newMedications = [...medications];
    newMedications[index][field] = value;
    setMedications(newMedications);
  };

  const handleRemoveMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      setError('Please select a patient');
      return;
    }

    // Add new prescription
    const newPrescription = {
      id: Date.now(),
      patient: `${selectedPatient.first_name} ${selectedPatient.last_name}`,
      med: medications[0].name,
      dose: medications[0].dose,
      freq: medications[0].freq,
      notes
    };

    setPrescriptions([...prescriptions, newPrescription]);
    
    // Reset form
    setSelectedPatient(null);
    setMedications([{ name: '', dose: '', freq: '' }]);
    setNotes('');
    setError('');
  };

  if (user?.role !== 'doctor') {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Prescriptions</h1>
      
      {/* Create Prescription Form */}
      <div className="bg-white dark:bg-dark-bg rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Create New Prescription</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-red-500 text-sm mb-4">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {/* Medications */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Medications</h3>
              <button
                type="button"
                onClick={handleAddMedication}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Medication
              </button>
            </div>

            {medications.map((med, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medication Name
                  </label>
                  <input
                    type="text"
                    value={med.name}
                    onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    value={med.dose}
                    onChange={(e) => handleMedicationChange(index, 'dose', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <input
                    type="text"
                    value={med.freq}
                    onChange={(e) => handleMedicationChange(index, 'freq', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                {medications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMedication(index)}
                    className="px-3 py-2 text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              rows="3"
            />
          </div>

          <button
            type="submit"
            className="w-full md:w-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Prescription
          </button>
        </form>
      </div>

      {/* Prescriptions List */}
      <div className="bg-white dark:bg-dark-bg rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Prescriptions List</h2>
        {prescriptions.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No prescriptions yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prescriptions.map((prescription) => (
              <div key={prescription.id} className="bg-gray-50 dark:bg-dark-bg-secondary rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold mb-2">{prescription.patient}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Medication: {prescription.med}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Dosage: {prescription.dose}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Frequency: {prescription.freq}
                    </p>
                    {prescription.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Notes: {prescription.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}