import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  MdSpaceDashboard, MdPeople, MdLocalHospital, MdEventNote, MdReceiptLong, MdMedicalServices,
} from 'react-icons/md';
import useAuth from "../context/useAuth";

const linksByRole = {
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: MdSpaceDashboard },
    { to: '/patients', label: 'Patients', icon: MdPeople },
    { to: '/doctors', label: 'Doctors', icon: MdLocalHospital },
    { to: '/appointments', label: 'Appointments', icon: MdEventNote },
    { to: '/prescriptions', label: 'Prescriptions', icon: MdMedicalServices },
    { to: '/billing', label: 'Billing', icon: MdReceiptLong },
  ],
  receptionist: [
    { to: '/dashboard', label: 'Dashboard', icon: MdSpaceDashboard },
    { to: '/patients', label: 'Patients', icon: MdPeople },
    { to: '/doctors', label: 'Doctors', icon: MdLocalHospital },
    { to: '/appointments', label: 'Appointments', icon: MdEventNote },
    { to: '/billing', label: 'Billing', icon: MdReceiptLong },
  ],
  doctor: [
    { to: '/dashboard', label: 'Dashboard', icon: MdSpaceDashboard },
    { to: '/appointments', label: 'Appointments', icon: MdEventNote },
    { to: '/prescriptions', label: 'Prescriptions', icon: MdMedicalServices },
  ],
  patient: [
    { to: '/dashboard', label: 'Dashboard', icon: MdSpaceDashboard },
    { to: '/doctors', label: 'Find a Doctor', icon: MdLocalHospital },
    { to: '/appointments', label: 'My Appointments', icon: MdEventNote },
    { to: '/prescriptions', label: 'My Prescriptions', icon: MdMedicalServices },
    { to: '/billing', label: 'My Bills', icon: MdReceiptLong },
  ],
};

const Sidebar = () => {
  const { user } = useAuth();
  const links = linksByRole[user?.role] || [];

  return (
    <aside className="w-64 shrink-0 bg-brand-950 text-brand-50 min-h-screen hidden md:flex flex-col">
      <div className="px-6 py-6 border-b border-brand-800">
        <h1 className="font-display text-2xl font-semibold text-white">MediCore</h1>
        <p className="text-xs text-brand-300 mt-1 tracking-wide uppercase">Hospital Management</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-600 text-white' : 'text-brand-200 hover:bg-brand-900'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-6 py-4 text-xs text-brand-400 border-t border-brand-800">
        Logged in as <span className="capitalize font-semibold text-brand-200">{user?.role}</span>
      </div>
    </aside>
  );
};

export default Sidebar;