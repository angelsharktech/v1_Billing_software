import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, sendOtp, verifyOtp } from "../services/UserService";
import { useAuth } from "../context/AuthContext";
import { Alert } from "@mui/material";
import invoice from "../assets/invoice.jpg";

const Login = () => {
  const { loginData } = useAuth();
  const [credentials, setCredentials] = useState({
    userName: "",
    password: "",
  });
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [open, setOpen] = useState(false);
  const [otp, setOTP] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSendOtp = async () => {
    try {
      const res = await sendOtp(credentials);
      if (res) {
        setSnackbarMessage("OTP sent successfully!");
        setShowSnackbar(true);
        setOpen(true);
      }
    } catch (err) {
      if (err.error) {
        setSnackbarMessage(err.error);
        setShowSnackbar(true);
      }
      if (err.message) {
        setSnackbarMessage(err.message);
        setShowSnackbar(true);
      }
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const payload = {
        userName: credentials.userName,
        password: credentials.password,
        otp: otp,
      };
      const res = await verifyOtp(payload);
      if (res) {
        loginData(res.user, res.token);
        localStorage.setItem("token", res.token);
        setSnackbarMessage("Login successful!");
        setShowSnackbar(true);
        setTimeout(() => {
          navigate("/dashboard");
        }, 500);
      }
    } catch (err) {
      if (err.error) {
        setSnackbarMessage(err.error);
        setShowSnackbar(true);
      }
      if (err.message) {
        setSnackbarMessage(err.message);
        setShowSnackbar(true);
      }
    }
  };

  const handleLogin = async () => {
    try {
      const res = await loginUser(credentials);
      if (res) {
        loginData(res.user, res.token);
        localStorage.setItem("token", res.token);
        setSnackbarMessage("Login successful!");
        setShowSnackbar(true);
        setTimeout(() => {
          navigate("/dashboard");
        }, 500);
      }
    } catch (err) {
      if (err.error) {
        setSnackbarMessage(err.error);
        setShowSnackbar(true);
      }
      if (err.message) {
        setSnackbarMessage(err.message);
        setShowSnackbar(true);
      }
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${invoice})` }}
    >
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 lg:justify-start lg:pl-[10%] xl:pl-[15%]">
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-sm xl:max-w-md bg-white rounded-2xl shadow-2xl p-5 sm:p-6 lg:p-6 xl:p-8 overflow-y-auto max-h-[90vh]">
          <h2 className="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-bold text-gray-800 mb-4 sm:mb-6 lg:mb-6 xl:mb-8">
            Login
          </h2>
          
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Name
              </label>
              <input
                type="text"
                name="userName"
                value={credentials.userName}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm sm:text-base"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm sm:text-base pr-10 sm:pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {!open && (
            <div className="mt-5 sm:mt-6 lg:mt-6 xl:mt-8 space-y-3 sm:space-y-4">
              <button
                onClick={handleLogin}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 sm:py-3 px-4 rounded-lg transition duration-300 hover:-translate-y-0.5 active:translate-y-0 text-sm sm:text-base"
              >
                Login
              </button>
              
              <div className="text-right pt-1 sm:pt-2">
                <Link
                  to="/register"
                  className="text-blue-600 hover:text-blue-800 font-medium transition text-sm sm:text-base"
                >
                  No Account? Register Here
                </Link>
              </div>
            </div>
          )}

          {open && (
            <>
              <div className="mt-5 sm:mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOTP(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm sm:text-base"
                  placeholder="Enter 6-digit OTP"
                />
              </div>
              
              <button
                onClick={handleVerifyOtp}
                className="w-full mt-5 sm:mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 sm:py-3 px-4 rounded-lg transition duration-300 hover:-translate-y-0.5 active:translate-y-0 text-sm sm:text-base"
              >
                Verify OTP
              </button>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-3 sm:py-4 text-center text-gray-800 text-xs sm:text-sm lg:text-base bg-white/80 backdrop-blur-sm mt-auto px-2">
        <p>
          © {new Date().getFullYear()} Angel Shark IT Solution. All rights reserved. 
          Visit our website{" "}
          <a
            href="https://www.angelshark.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            www.angelshark.in
          </a>
        </p>
      </footer>

      {/* Snackbar Notification */}
      {showSnackbar && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 w-full max-w-xs sm:max-w-sm md:max-w-md z-50 animate-slideDown">
          <Alert
            severity={snackbarMessage.includes("successful!") ? "success" : "error"}
            onClose={() => setShowSnackbar(false)}
            className="shadow-lg"
          >
            {snackbarMessage}
          </Alert>
        </div>
      )}
    </div>
  );
};

export default Login;