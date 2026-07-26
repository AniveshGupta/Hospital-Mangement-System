import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ children }) => (
  <div className="flex min-h-screen bg-brand-50">
    <Sidebar />
    <div className="flex-1 flex flex-col min-w-0">
      <Navbar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  </div>
);

export default Layout;