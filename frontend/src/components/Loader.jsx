import React from 'react';

const Loader = ({ label = 'Loading...' }) => (
  <div className="flex items-center justify-center py-16 text-brand-600">
    <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mr-3" />
    <span className="text-sm font-medium">{label}</span>
  </div>
);

export default Loader;