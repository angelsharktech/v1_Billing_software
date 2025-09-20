// src/routes/PrivateRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { webuser } = useAuth();
  return webuser ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
