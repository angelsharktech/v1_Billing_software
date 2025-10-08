// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [webuser, setWebuser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore user + token from localStorage on refresh
    useEffect(() => {
        const savedToken = localStorage.getItem("token");
        const savedUser = localStorage.getItem("webuser");

        if (savedToken && savedUser) {
            const parsed = JSON.parse(savedUser);
            setWebuser({ ...parsed, id: parsed._id || parsed.id });
            setToken(savedToken);
        }
        setLoading(false);
    }, []);

    // Login
    const loginData = (user, newToken) => {
        const normalizedUser = { ...user, id: user._id || user.id };

        localStorage.setItem("token", newToken);
        localStorage.setItem("webuser", JSON.stringify(normalizedUser));

        setWebuser(normalizedUser);
        setToken(newToken);
    };

    // Logout
    const logoutUser = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("webuser");
        setWebuser(null);
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ webuser, token, loginData, loading,logoutUser }}>
            {children}
        </AuthContext.Provider>
    );
};