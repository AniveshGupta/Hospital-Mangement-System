import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import api from '../api/axios';
import { useAuth } from "../context/AuthContext";

const statusColors = {
  scheduled: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  'no-show': 'bg-gray-200 text-gray-700',
};

const Appointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/appointments');
      setAppointments(data.data);
    } catch (err) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/appointments/${id}`, { status });
      toast.success(`Marked as ${status}`);
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const cancelAppointment = async (id) => {
    try {
      await api.put(`/appointments/${id}/cancel`, { reason: 'Cancelled by user' });
      toast.success('Appointment cancelled');
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed');
    }
  };

  return (
    <Layout>
      <h1 className="font-display text-2xl font-semibold text-brand-950 mb-1">Appointments</h1>
      <p className="text-brand-700 text-sm mb-6 capitalize">{user.role} view</p>

      {loading ? (
        <Loader />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-100 text-brand-900 text-left">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a._id} className="border-t border-brand-100 hover:bg-brand-50">
                  <td className="px-4 py-3">{new Date(a.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{a.startTime} - {a.endTime}</td>
                  <td className="px-4 py-3">{a.patient?.name}</td>
                  <td className="px-4 py-3">{a.doctor?.name}</td>
                  <td className="px-4 py-3">{a.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${statusColors[a.status]}`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    {['admin', 'doctor', 'receptionist'].includes(user.role) && a.status === 'scheduled' && (
                      <button onClick={() => updateStatus(a._id, 'confirmed')} className="text-brand-600 hover:underline text-xs font-medium">Confirm</button>
                    )}
                    {['admin', 'doctor', 'receptionist'].includes(user.role) && ['scheduled', 'confirmed'].includes(a.status) && (
                      <button onClick={() => updateStatus(a._id, 'completed')} className="text-emerald-600 hover:underline text-xs font-medium">Complete</button>
                    )}
                    {['scheduled', 'confirmed'].includes(a.status) && (
                      <button onClick={() => cancelAppointment(a._id)} className="text-red-600 hover:underline text-xs font-medium">Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-brand-500">No appointments found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

export default Appointments;