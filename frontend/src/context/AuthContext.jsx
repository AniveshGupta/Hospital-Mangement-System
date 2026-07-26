import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import toast from "react-hot-toast";
import api from "../api/axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("hms_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem("hms_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("hms_user");
    }
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("hms_token", data.data.token);
      setUser(data.data);

      toast.success(`Welcome back, ${data.data.name}`);

      return data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);

    try {
      const { data } = await api.post("/auth/register", payload);

      localStorage.setItem("hms_token", data.data.token);
      setUser(data.data);

      toast.success("Account created successfully");

      return data.data;
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Registration failed"
      );

      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("hms_token");
    localStorage.removeItem("hms_user");

    setUser(null);

    toast.success("Logged out");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        register,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};