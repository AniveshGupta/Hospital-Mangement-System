import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MdAdd, MdClose } from 'react-icons/md';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import api from '../api/axios';
import { useAuth } from "../context/AuthContext";

const emptyMedicine = { name: '', dosage: '', frequency: '', duration: '', instructions: '' };

const Prescriptions = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ patient: '', diagnosis: '', advice: '', medicines: [{ ...emptyMedicine }] });

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/prescriptions');
      setPrescriptions(data.data);
    } catch (err) {
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
    if (user.role === 'doctor') {
      api.get('/patients?limit=100').then((r) => setPatients(r.data.data)).catch(() => {});
    }
  }, [user.role]);

  const updateMedicine = (idx, field, value) => {
    const meds = [...form.medicines];
    meds[idx][field] = value;
    setForm({ ...form, medicines: meds });
  };

  const addMedicineRow = () => setForm({ ...form, medicines: [...form.medicines, { ...emptyMedicine }] });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/prescriptions', form);
      toast.success('Prescription issued');
      setShowForm(false);
      setForm({ patient: '', diagnosis: '', advice: '', medicines: [{ ...emptyMedicine }] });
      fetchPrescriptions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue prescription');
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-950">Prescriptions</h1>
          <p className="text-brand-700 text-sm">Diagnosis, medication and advice history</p>
        </div>
        {user.role === 'doctor' && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <MdAdd /> New Prescription
          </button>
        )}
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="space-y-4">
          {prescriptions.map((p) => (
            <div key={p._id} className="card p-5">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <h3 className="font-semibold">{p.patient?.name}</h3>
                  <p className="text-sm text-brand-600">Dr. {p.doctor?.name} &middot; {p.doctor?.specialization}</p>
                </div>
                <span className="text-xs text-brand-500">{new Date(p.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-sm mt-3"><span className="font-medium">Diagnosis:</span> {p.diagnosis}</p>
              {p.medicines?.length > 0 && (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="text-brand-500">
                      <tr>
                        <th className="text-left py-1 pr-4">Medicine</th>
                        <th className="text-left py-1 pr-4">Dosage</th>
                        <th className="text-left py-1 pr-4">Frequency</th>
                        <th className="text-left py-1 pr-4">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.medicines.map((m, i) => (
                        <tr key={i} className="border-t border-brand-100">
                          <td className="py-1.5 pr-4 font-medium">{m.name}</td>
                          <td className="py-1.5 pr-4">{m.dosage}</td>
                          <td className="py-1.5 pr-4">{m.frequency}</td>
                          <td className="py-1.5 pr-4">{m.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {p.advice && <p className="text-sm mt-3 text-brand-700"><span className="font-medium">Advice:</span> {p.advice}</p>}
            </div>
          ))}
          {prescriptions.length === 0 && <p className="text-center text-brand-500 py-10">No prescriptions found</p>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20 p-4 overflow-y-auto">
          <div className="card w-full max-w-2xl p-6 relative my-8">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-brand-500 hover:text-brand-800">
              <MdClose size={22} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Issue New Prescription</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Patient</label>
                <select className="input" value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })} required>
                  <option value="">Select patient</option>
                  {patients.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.phone})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Diagnosis</label>
                <input className="input" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} required />
              </div>

              <div>
                <label className="label">Medicines</label>
                <div className="space-y-2">
                  {form.medicines.map((m, i) => (
                    <div key={i} className="grid grid-cols-4 gap-2">
                      <input className="input" placeholder="Name" value={m.name} onChange={(e) => updateMedicine(i, 'name', e.target.value)} required />
                      <input className="input" placeholder="Dosage" value={m.dosage} onChange={(e) => updateMedicine(i, 'dosage', e.target.value)} required />
                      <input className="input" placeholder="Frequency" value={m.frequency} onChange={(e) => updateMedicine(i, 'frequency', e.target.value)} required />
                      <input className="input" placeholder="Duration" value={m.duration} onChange={(e) => updateMedicine(i, 'duration', e.target.value)} required />
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addMedicineRow} className="text-brand-600 text-sm font-medium mt-2">+ Add another medicine</button>
              </div>

              <div>
                <label className="label">Advice</label>
                <textarea className="input" rows={2} value={form.advice} onChange={(e) => setForm({ ...form, advice: e.target.value })} />
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Issue Prescription</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Prescriptions;