import React, { useEffect, useState } from 'react';
import { MdPeople, MdLocalHospital, MdEventNote, MdPayments } from 'react-icons/md';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import api from '../api/axios';
import { useAuth } from "../context/AuthContext";

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="card p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${accent}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-semibold text-ink">{value}</p>
      <p className="text-sm text-brand-700">{label}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ patients: 0, doctors: 0, appointments: 0, revenue: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const requests = [];
        if (['admin', 'doctor', 'receptionist'].includes(user.role)) {
          requests.push(api.get('/doctors').then((r) => ({ doctors: r.data.count })));
        }
        if (['admin', 'receptionist'].includes(user.role)) {
          requests.push(api.get('/patients?limit=1').then((r) => ({ patients: r.data.total })));
        }
        requests.push(api.get('/appointments').then((r) => ({ appointments: r.data.count })));
        if (user.role === 'admin') {
          requests.push(api.get('/billing/summary').then((r) => ({ revenue: r.data.data.totalRevenue })));
        }

        const results = await Promise.all(requests);
        setStats((prev) => results.reduce((acc, r) => ({ ...acc, ...r }), prev));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user.role]);

  return (
    <Layout>
      <h1 className="font-display text-2xl font-semibold text-brand-950 mb-1">
        Welcome back, {user.name.split(' ')[0]}
      </h1>
      <p className="text-brand-700 mb-6 capitalize">{user.role} dashboard overview</p>

      {loading ? (
        <Loader label="Fetching your overview..." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {['admin', 'receptionist', 'doctor'].includes(user.role) && (
            <StatCard icon={MdLocalHospital} label="Doctors" value={stats.doctors} accent="bg-brand-600" />
          )}
          {['admin', 'receptionist'].includes(user.role) && (
            <StatCard icon={MdPeople} label="Registered Patients" value={stats.patients} accent="bg-teal-500" />
          )}
          <StatCard icon={MdEventNote} label="Appointments" value={stats.appointments} accent="bg-cyan-600" />
          {user.role === 'admin' && (
            <StatCard icon={MdPayments} label="Total Revenue" value={`₹${stats.revenue}`} accent="bg-emerald-600" />
          )}
        </div>
      )}

      <div className="card p-6 mt-6">
        <h2 className="font-semibold text-lg mb-2">Quick Guide</h2>
        <ul className="list-disc list-inside text-sm text-brand-700 space-y-1">
          <li>Use the sidebar to navigate between modules based on your role.</li>
          <li>Admins and receptionists can register new patients and manage appointments.</li>
          <li>Doctors can view their schedule and issue prescriptions after a consultation.</li>
          <li>Patients can browse doctors, book appointments, and view their own bills and prescriptions.</li>
        </ul>
      </div>
    </Layout>
  );
};

export default Dashboard;