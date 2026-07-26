import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MdLocalHospital } from "react-icons/md";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      // Error toast AuthContext me show ho raha hai
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-950 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 text-brand-50">
          <MdLocalHospital
            size={40}
            className="text-brand-400 mb-2"
          />

          <h1 className="font-display text-3xl font-semibold">
            MediCore
          </h1>

          <p className="text-brand-300 text-sm mt-1">
            Hospital Management System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8">
          <h2 className="text-xl font-semibold mb-1">
            Sign in
          </h2>

          <p className="text-sm text-brand-700 mb-6">
            Access your dashboard
          </p>

          <div className="mb-4">
            <label className="label">Email</label>

            <input
              className="input"
              type="email"
              value={email}
              placeholder="Enter your email"
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label className="label">Password</label>

            <input
              className="input"
              type="password"
              value={password}
              placeholder="Enter your password"
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-sm text-center mt-6 text-brand-700">
            New patient?{" "}
            <Link
              to="/register"
              className="text-brand-600 font-semibold hover:underline"
            >
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;