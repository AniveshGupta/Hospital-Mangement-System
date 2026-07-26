import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MdLocalHospital } from 'react-icons/md';
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(form);
      navigate('/dashboard');
    } catch {
      // toast already shown
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-950 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 text-brand-50">
          <MdLocalHospital size={40} className="text-brand-400 mb-2" />
          <h1 className="font-display text-3xl font-semibold">MediCore</h1>
          <p className="text-brand-300 text-sm mt-1">Create your patient account</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8">
          <div className="mb-4">
            <label className="label">Full Name</label>
            <input className="input" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="mb-4">
            <label className="label">Email</label>
            <input className="input" type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>
          <div className="mb-4">
            <label className="label">Phone</label>
            <input className="input" name="phone" value={form.phone} onChange={handleChange} required />
          </div>
          <div className="mb-6">
            <label className="label">Password</label>
            <input className="input" type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-sm text-center mt-6 text-brand-700">
            Already have an account? <Link to="/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;