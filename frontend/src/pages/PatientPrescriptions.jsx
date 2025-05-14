import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../constants';
import Card from '../components/Card';

export default function PatientPrescriptions() {
  const { user } = useAuth();
  const [active, setActive]     = useState([]);
  const [history, setHistory]   = useState([]);
  const [error, setError]       = useState('');
  const [tab, setTab]           = useState('active'); // 'active' | 'history'

  useEffect(() => {
    if (user?.role !== 'patient') return;

    (async () => {
      try {
        // 1) lookup patient record by email
        const pRes = await fetch(
          `${API_URL}/api/patients/email/${encodeURIComponent(user.email)}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        if (!pRes.ok) throw new Error('Failed to fetch patient info');
        const patient = await pRes.json();
        const pid = patient.id;

        // 2) fetch active prescriptions
        const aRes = await fetch(
          `${API_URL}/api/prescriptions/patient/${pid}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        if (!aRes.ok) throw new Error('Failed to fetch current prescriptions');
        const aData = await aRes.json();
        setActive(aData);

        // 3) fetch prescription history
        const hRes = await fetch(
          `${API_URL}/api/prescriptions/patient/history/${pid}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        if (!hRes.ok) throw new Error('Failed to fetch prescription history');
        const hData = await hRes.json();
        setHistory(hData);
      } catch (err) {
        console.error('Error fetching prescriptions:', err);
        setError(err.message);
      }
    })();
  }, [user]);

  if (user?.role !== 'patient') {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Only patients can access this page.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">My Prescriptions</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6 space-x-2">
        <button
          onClick={() => setTab('active')}
          className={`px-4 py-2 rounded ${tab === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          Current
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-4 py-2 rounded ${tab === 'history' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          History
        </button>
      </div>

      {tab === 'active' && (
        active.length === 0 ? (
          <p className="text-gray-500">You have no active prescriptions.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {active.map(presc => (
              <Card key={presc.id} className="p-4">
                <h3 className="text-lg font-semibold mb-2">
                  Dr. {presc.doctor_first_name} {presc.doctor_last_name}
                </h3>
                <ul className="list-disc list-inside mb-2 text-sm">
                  {presc.medications.map((m, i) => (
                    <li key={i}>
                      {m.medicationName} — {m.dosage}, {m.frequency}, {m.duration}
                    </li>
                  ))}
                </ul>
                {presc.instructions && (
                  <p className="text-sm italic mb-2">Notes: {presc.instructions}</p>
                )}
                <p className="text-xs text-gray-500">
                  Prescribed on: {new Date(presc.created_at).toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === 'history' && (
        history.length === 0 ? (
          <p className="text-gray-500">You have no past prescriptions.</p>
        ) : (
          <div className="space-y-4">
            {history.map(presc => (
              <Card key={presc.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      Dr. {presc.doctor_first_name} {presc.doctor_last_name}
                    </h3>
                    <ul className="list-disc list-inside mb-2 text-sm">
                      {presc.medications.map((m, i) => (
                        <li key={i}>
                          {m.medicationName} — {m.dosage}, {m.frequency}, {m.duration}
                        </li>
                      ))}
                    </ul>
                    {presc.instructions && (
                      <p className="text-sm italic mb-2">Notes: {presc.instructions}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Prescribed on: {new Date(presc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Ended on: {new Date(presc.deleted_at).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}
