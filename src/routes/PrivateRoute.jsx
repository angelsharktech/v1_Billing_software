// src/routes/PrivateRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
    const { webuser, loading } = useAuth();

    if (loading) return null; // or loader/spinner
    return webuser ? children : <Navigate to="/login" />;
};

export default PrivateRoute;