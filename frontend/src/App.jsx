import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Doctors from "./pages/Doctors";
import Appointments from "./pages/Appointments";
import Prescriptions from "./pages/Prescriptions";
import Billing from "./pages/Billing";
import NotFound from "./pages/NotFound";

import ProtectedRoute from "./components/ProtectedRoute";


function App() {
  return (
    
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patients"
          element={
            <ProtectedRoute roles={["admin", "doctor", "receptionist"]}>
              <Patients />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctors"
          element={
            <ProtectedRoute>
              <Doctors />
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <Appointments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/prescriptions"
          element={
            <ProtectedRoute roles={["admin", "doctor", "patient"]}>
              <Prescriptions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/billing"
          element={
            <ProtectedRoute roles={["admin", "receptionist", "patient"]}>
              <Billing />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    
  );
}

export default App;