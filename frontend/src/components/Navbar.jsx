import React from 'react';
import { MdLogout, MdPerson } from 'react-icons/md';
import useAuth from "../context/useAuth";
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-brand-100 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="md:hidden font-display text-xl font-semibold text-brand-800">MediCore</div>
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-ink">
          <MdPerson className="text-brand-600" size={20} />
          <span className="font-medium">{user?.name}</span>
        </div>
        <button onClick={handleLogout} className="btn-secondary flex items-center gap-2 text-sm !py-1.5">
          <MdLogout size={16} /> Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;