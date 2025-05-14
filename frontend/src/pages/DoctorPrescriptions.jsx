// File: src/pages/DoctorPrescriptions.jsx
import React, { useState, useEffect } from 'react';
import { useAuth }       from '../context/AuthContext';
import { API_URL }       from '../constants';
import Card              from '../components/Card';
import Button            from '../components/Button';
import SearchDropdown    from '../components/SearchDropdown';
import Input             from '../components/Input';

export default function DoctorPrescriptions() {
  const { user }                         = useAuth();
  const [activeAll, setActiveAll]       = useState([]);
  const [historyAll, setHistoryAll]     = useState([]);
  const [requestsAll, setRequestsAll]   = useState([]);
  const [tab, setTab]                   = useState('active'); 
  const [formError, setFormError]       = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  // **Moved these hooks up so they're always called**
  const [medications, setMedications]   = useState([
    { medicationName: '', dosage: '', frequency: '', duration: '' }
  ]);
  const [instructions, setInstructions] = useState('');

  // Fetch data once
  useEffect(() => {
    if (user?.role !== 'doctor') return;
    (async () => {
      try {
        const [r1, r2, r3] = await Promise.all([
          fetch(`${API_URL}/api/prescriptions/doctor/${user.id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }),
          fetch(`${API_URL}/api/prescriptions/history/${user.id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }),
          fetch(`${API_URL}/api/refill-requests`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          })
        ]);
        if (!r1.ok) throw new Error(await r1.text());
        if (!r2.ok) throw new Error(await r2.text());
        if (!r3.ok) throw new Error(await r3.text());
        const [data1, data2, data3] = await Promise.all([r1.json(), r2.json(), r3.json()]);
        setActiveAll(data1);
        setHistoryAll(data2);
        setRequestsAll(data3);
      } catch (err) {
        console.error(err);
        setFormError(err.message);
      }
    })();
  }, [user]);

  if (user?.role !== 'doctor') {
    return <Card className="p-6">Only doctors may view this page.</Card>;
  }

  // Require selecting a patient first
  if (!selectedPatient) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6 max-w-md mx-auto">
          <h2 className="text-2xl font-semibold mb-4">Select a Patient</h2>
          <SearchDropdown
            type="patient"
            onSelect={setSelectedPatient}
            placeholder="Search for a patient..."
          />
        </Card>
      </div>
    );
  }

  // Filter by the chosen patient
  const active   = activeAll.filter(p => p.patient_id === selectedPatient.id);
  const history  = historyAll.filter(p => p.patient_id === selectedPatient.id);
  const requests = requestsAll.filter(r => r.patient_id === selectedPatient.id);

  // Archive (move from active to history)
  const archive = async id => {
    try {
      const res = await fetch(`${API_URL}/api/prescriptions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      const removed = active.find(p => p.id === id);
      setActiveAll(a => a.filter(p => p.id !== id));
      setHistoryAll(h => [{ ...removed, deleted_at: new Date().toISOString() }, ...h]);
    } catch (err) {
      console.error(err);
      setFormError(err.message);
    }
  };

  // Handle refill approve/reject
  const handleRequest = async (id, action) => {
    try {
      const res = await fetch(`${API_URL}/api/refill-requests/${id}/${action}`, { method: 'PUT' });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.message || JSON.stringify(updated));
      setRequestsAll(rq => rq.map(r => (r.id === updated.id ? updated : r)));
    } catch (err) {
      console.error(err);
      setFormError(err.message);
    }
  };

  // Manage new-prescription form
  const addMedication    = () => setMedications(m => [...m, { medicationName:'', dosage:'', frequency:'', duration:'' }]);
  const changeMedication = (i, f, v) => setMedications(m => m.map((med,idx) => idx===i ? { ...med, [f]:v } : med));
  const removeMedication = i => setMedications(m => m.filter((_,idx) => idx!==i));

  const submitNew = async e => {
    e.preventDefault();
    setFormError('');
    if (medications.some(m => !m.medicationName || !m.dosage || !m.frequency || !m.duration)) {
      return setFormError('Please fill out all medication fields');
    }
    try {
      const res = await fetch(`${API_URL}/api/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type':'application/json',
          Authorization:`Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          doctorId: user.id,
          patientId: selectedPatient.id,
          medications,
          instructions
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const newPresc = await res.json();
      setActiveAll(a => [newPresc, ...a]);
      setTab('active');
      setMedications([{ medicationName:'', dosage:'', frequency:'', duration:'' }]);
      setInstructions('');
    } catch (err) {
      console.error(err);
      setFormError(err.message);
    }
  };

  // Choose which list to show
  let list = [];
  if (tab === 'active')   list = active;
  if (tab === 'history')  list = history;
  if (tab === 'requests') list = requests;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">
        Prescriptions for {selectedPatient.first_name} {selectedPatient.last_name}
      </h1>

      {formError && <div className="text-red-600 mb-4">{formError}</div>}

      <div className="mb-4 space-x-2">
        {['active','history','requests','new'].map(t => (
          <Button
            key={t}
            onClick={() => setTab(t)}
            className={tab===t?'bg-blue-600 text-white':'bg-gray-200 text-black'}
          >
            {t==='active'
              ? 'Current'
              : t==='history'
              ? 'History'
              : t==='requests'
              ? 'Refill Requests'
              : 'New Prescription'}
          </Button>
        ))}
      </div>

      {/* New Prescription Form */}
      {tab === 'new' && (
        <Card className="p-6 mb-6">
          <form onSubmit={submitNew} className="space-y-4">
            {medications.map((med,i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  label="Medication Name"
                  value={med.medicationName}
                  onChange={e => changeMedication(i,'medicationName',e.target.value)}
                  required
                />
                <Input
                  label="Dosage"
                  value={med.dosage}
                  onChange={e => changeMedication(i,'dosage',e.target.value)}
                  required
                />
                <Input
                  label="Frequency"
                  value={med.frequency}
                  onChange={e => changeMedication(i,'frequency',e.target.value)}
                  required
                />
                <Input
                  label="Duration"
                  value={med.duration}
                  onChange={e => changeMedication(i,'duration',e.target.value)}
                  required
                />
                {medications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMedication(i)}
                    className="text-red-500 self-end"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <Button type="button" onClick={addMedication} className="bg-green-500">
              + Add Medication
            </Button>

            <div>
              <label className="block mb-1 font-medium">Instructions</label>
              <textarea
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                className="w-full border rounded p-2"
                rows={3}
              />
            </div>

            <Button type="submit" className="bg-blue-600 text-white">
              Create Prescription
            </Button>
          </form>
        </Card>
      )}

      {/* Refill Requests */}
      {tab === 'requests' && (
        requests.length === 0
          ? <p className="text-gray-500">No refill requests.</p>
          : requests.map(req => (
              <Card key={req.id} className="p-4 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p>
                      <strong>
                        {req.patient_first_name} {req.patient_last_name}
                      </strong>{' '}
                      requested refill for <strong>{req.medications?.[0]?.medicationName}</strong>
                    </p>
                    <p className="text-xs text-gray-500">
                      Requested: {new Date(req.requested_at).toLocaleString()}
                    </p>
                    {req.status !== 'pending' && req.responded_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}:{' '}
                        {new Date(req.responded_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {req.status === 'pending' && (
                    <div className="space-x-2">
                      <Button onClick={() => handleRequest(req.id,'approve')} className="bg-green-500">
                        Approve
                      </Button>
                      <Button onClick={() => handleRequest(req.id,'reject')} className="bg-red-500">
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
      )}

      {/* Active / History Prescriptions */}
      {['active','history'].includes(tab) && (
        list.length === 0
          ? <p className="text-gray-500">No {tab === 'active' ? 'current' : 'past'} prescriptions.</p>
          : (
            <div className="space-y-4">
              {list.map(item => (
                <Card key={item.id} className="p-4 flex justify-between items-start">
                  <div>
                    <p className="font-semibold">
                      {item.patient_first_name} {item.patient_last_name}
                    </p>
                    <p className="text-sm">{item.medications?.[0]?.medicationName}</p>
                    <p className="text-xs text-gray-500">
                      {tab === 'history'
                        ? `Ended: ${new Date(item.deleted_at).toLocaleDateString()}`
                        : `Prescribed: ${new Date(item.created_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  {tab === 'active' && (
                    <Button onClick={() => archive(item.id)} className="bg-red-500">
                      Archive
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )
      )}
    </div>
  );
}
