// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";

// Create context
const AuthContext = createContext();

// Custom hook
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }) => {
  const [webuser, setWebuser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("webuser");
    if (token && user) {
      setWebuser(JSON.parse(user));
    }
  }, []);

  const loginData = (user, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("webuser", JSON.stringify(user));
    setWebuser(user);
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("webuser");
    setWebuser(null);
  };

  return (
    <AuthContext.Provider value={{ webuser, loginData, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};
