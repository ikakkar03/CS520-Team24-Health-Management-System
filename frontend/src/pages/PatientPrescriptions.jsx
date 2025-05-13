import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const BACKEND_URL = 'http://localhost:5000';

export default function PatientPrescriptions() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        // First get the patient ID from the email
        const patientResponse = await fetch(`${BACKEND_URL}/api/patients/email/${user.email}`);
        if (!patientResponse.ok) {
          throw new Error('Failed to fetch patient information');
        }
        const patientData = await patientResponse.json();
        
        // Then fetch prescriptions for this patient
        const prescriptionsResponse = await fetch(`${BACKEND_URL}/api/prescriptions/patient/${patientData.id}`);
        if (!prescriptionsResponse.ok) {
          throw new Error('Failed to fetch prescriptions');
        }
        const prescriptionsData = await prescriptionsResponse.json();
        setPrescriptions(prescriptionsData);
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
        setError(error.message);
      }
    };

    if (user?.role === 'patient') {
      fetchPrescriptions();
    }
  }, [user]);

  if (user?.role !== 'patient') {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Only patients can access this page
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Prescriptions</h1>
      
      {/* Prescriptions List */}
      <div className="bg-white dark:bg-dark-bg rounded-lg shadow-md p-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {prescriptions.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No prescriptions found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prescriptions.map((prescription) => (
              <div key={prescription.id} className="bg-gray-50 dark:bg-dark-bg-secondary rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold mb-2">
                      Dr. {prescription.doctor_first_name} {prescription.doctor_last_name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Medication: {prescription.medications[0]?.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Dosage: {prescription.medications[0]?.dose}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Frequency: {prescription.medications[0]?.freq}
                    </p>
                    {prescription.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Notes: {prescription.notes}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Prescribed on: {new Date(prescription.created_at).toLocaleDateString()}
                    </p>
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