import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MdAdd, MdSearch, MdEdit, MdClose } from 'react-icons/md';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import api from '../api/axios';
import { useAuth } from "../context/AuthContext";

const emptyForm = { name: '', email: '', phone: '', gender: 'male', dateOfBirth: '', bloodGroup: 'unknown', address: '' };

const Patients = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const canManage = ['admin', 'receptionist'].includes(user.role);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/patients?search=${search}`);
      setPatients(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchPatients, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setForm({
      name: p.name, email: p.email || '', phone: p.phone,
      gender: p.gender || 'male',
      dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : '',
      bloodGroup: p.bloodGroup || 'unknown', address: p.address || '',
    });
    setEditingId(p._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/patients/${editingId}`, form);
        toast.success('Patient updated');
      } else {
        await api.post('/patients', form);
        toast.success('Patient registered');
      }
      setShowForm(false);
      fetchPatients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-950">Patients</h1>
          <p className="text-brand-700 text-sm">Manage patient records</p>
        </div>
        {canManage && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <MdAdd /> Register Patient
          </button>
        )}
      </div>

      <div className="card p-3 mb-4 flex items-center gap-2 max-w-md">
        <MdSearch className="text-brand-500" size={20} />
        <input
          className="flex-1 outline-none bg-transparent text-sm"
          placeholder="Search by name, phone or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-100 text-brand-900 text-left">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Blood Group</th>
                <th className="px-4 py-3">Gender</th>
                {canManage && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p._id} className="border-t border-brand-100 hover:bg-brand-50">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3">{p.phone}</td>
                  <td className="px-4 py-3">{p.email || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-brand-100 text-brand-800">{p.bloodGroup}</span>
                  </td>
                  <td className="px-4 py-3 capitalize">{p.gender || '-'}</td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(p)} className="text-brand-600 hover:text-brand-800">
                        <MdEdit />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {patients.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-brand-500">No patients found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20 p-4">
          <div className="card w-full max-w-lg p-6 relative">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-brand-500 hover:text-brand-800">
              <MdClose size={22} />
            </button>
            <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit Patient' : 'Register New Patient'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Full Name</label>
                <input className="input" name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" name="phone" value={form.phone} onChange={handleChange} required />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" name="email" value={form.email} onChange={handleChange} />
              </div>
              <div>
                <label className="label">Gender</label>
                <select className="input" name="gender" value={form.gender} onChange={handleChange}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Date of Birth</label>
                <input className="input" type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} />
              </div>
              <div>
                <label className="label">Blood Group</label>
                <select className="input" name="bloodGroup" value={form.bloodGroup} onChange={handleChange}>
                  {['unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Address</label>
                <input className="input" name="address" value={form.address} onChange={handleChange} />
              </div>
              <div className="col-span-2 flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingId ? 'Save Changes' : 'Register'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Patients;