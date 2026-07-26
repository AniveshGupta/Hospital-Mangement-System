import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-brand-50 text-center px-4">
    <h1 className="font-display text-6xl font-semibold text-brand-800 mb-2">404</h1>
    <p className="text-brand-600 mb-6">The page you're looking for doesn't exist.</p>
    <Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>
  </div>
);

export default NotFound;