import React, { useEffect, useState } from "react";
import { getAllPositions } from "../services/Position";
import { getAllOrganization } from "../services/Organization";
import { getAllRoles } from "../services/Role";
import { Link, useNavigate } from "react-router-dom";
import { getAllUser, registerUser } from "../services/UserService";
import { Alert } from "@mui/material";
import invoice from "../assets/invoice.jpg";

const Registration = () => {
  const [step, setStep] = useState(0); // 0: Personal, 1: Company, 2: Bank

  const [organizations, setOrganizations] = useState([]);
  const [positions, setPositions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    userName: "",
    phone_number: "",
    email: "",
    country: "",
    address: "",
    city: "",
    company_name: "",
    password: "",
    organization_id: "",
    role_id: "",
    position_id: "",
    bio: "",
    status: "active",
  });

  const [bankDetails, setBankDetails] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
    ifscCode: "",
    upiId: "",
  });
  
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [errors, setErrors] = useState({
    email: "",
    phone_number: "",
    userName: ""
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [posData, orgData, roleData, userData] = await Promise.all([
          getAllPositions(),
          getAllOrganization(),
          getAllRoles(),
          getAllUser(),
        ]);

        setPositions(posData);
        setOrganizations(orgData);
        setRoles(roleData);
        setUsers(userData);
      } catch (err) {
        console.error("Failed to fetch form data:", err);
      }
    };
    fetchAll();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "email") {
      const emailExists = users?.some(
        (u) => u?.email?.toLowerCase() === value?.toLowerCase()
      );
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(value)) {
        setErrors((prev) => ({ ...prev, email: "Invalid email format" }));
      } else if (emailExists) {
        setErrors((prev) => ({ ...prev, email: "Email already exists" }));
        setSnackbarMessage("Email already exists!");
        setSnackbarOpen(true);
      } else {
        setErrors((prev) => ({ ...prev, email: "" }));
      }
    }

    if (name === "phone_number") {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(value)) {
        setErrors((prev) => ({
          ...prev,
          phone_number: "Invalid mobile number",
        }));
      } else {
        setErrors((prev) => ({ ...prev, phone_number: "" }));
      }
    }
    
    if (name === "userName") {
      const userNameExists = users?.some(
        (u) => u?.userName?.toLowerCase() === value?.toLowerCase()
      );
      if (userNameExists) {
        setErrors((prev) => ({
          ...prev,
          userName: "User Name already Exist",
        }));
      } else {
        setErrors((prev) => ({ ...prev, userName: "" }));
      }
    }
    
    setFormData({ ...formData, [name]: value });
  };

  const handleBankChange = (e) => {
    setBankDetails({ ...bankDetails, [e.target.name]: e.target.value });
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleSubmit = async () => {
    if (errors.email || errors.phone_number) {
      setSnackbarMessage("Please fix validation errors.");
      setSnackbarOpen(true);
      return;
    }
    
    const emailExists = users?.some(
      (u) => u?.email?.toLowerCase() === formData.email?.toLowerCase()
    );
    if (emailExists) {
      setSnackbarMessage("Email already exists!");
      setSnackbarOpen(true);
      return;
    }
    
    const userNameExists = users?.some(
      (u) => u?.userName?.toLowerCase() === formData.userName?.toLowerCase()
    );
    if (userNameExists) {
      setSnackbarMessage("User Name already exists!");
      setSnackbarOpen(true);
      return;
    }
    
    const finalData = { ...formData, bankDetails };
    const result = await registerUser(finalData);
    
    if (result) {
      setSnackbarMessage("Register successful!");
      setSnackbarOpen(true);
      navigate("/login");
    }
  };

  const formatLabel = (key) => {
    return key
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center lg:justify-start p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${invoice})` }}
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 overflow-y-auto max-h-[90vh] lg:ml-[10%] xl:ml-[15%] min-h-[500px] flex flex-col">
        {/* Fixed header height */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {step === 0
              ? "Personal Info"
              : step === 1
              ? "Company Info"
              : "Bank Details"}
          </h2>
        </div>

        {/* Form content with fixed height */}
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Step 0: Personal Info */}
            {step === 0 && (
              <>
                {[
                  "name",
                  "userName",
                  "phone_number",
                  "email",
                  "password",
                  "country",
                  "address",
                  "city",
                  "bio",
                ].map((key) => (
                  <div key={key} className={key === "bio" || key === "address" ? "sm:col-span-2" : ""}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formatLabel(key)}
                    </label>
                    <input
                      type={key === "password" ? "password" : "text"}
                      name={key}
                      value={formData[key]}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                        errors[key] ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder={`Enter ${formatLabel(key).toLowerCase()}`}
                    />
                    {errors[key] && (
                      <p className="text-red-500 text-xs mt-1">{errors[key]}</p>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* Step 1: Company Info */}
            {step === 1 && (
              <>
                {["company_name"].map((key) => (
                  <div key={key} className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formatLabel(key)}
                    </label>
                    <input
                      type="text"
                      name={key}
                      value={formData[key]}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder={`Enter ${formatLabel(key).toLowerCase()}`}
                    />
                  </div>
                ))}
                
                {/* Organization Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization
                  </label>
                  <select
                    name="organization_id"
                    value={formData.organization_id}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                  >
                    <option value="">Select Organization</option>
                    {(organizations || []).map((org) => (
                      <option key={org._id} value={org._id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Role Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    name="role_id"
                    value={formData.role_id}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                  >
                    <option value="">Select Role</option>
                    {(roles || []).map((role) => (
                      <option key={role._id} value={role._id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Position Dropdown */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <select
                    name="position_id"
                    value={formData.position_id}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                  >
                    <option value="">Select Position</option>
                    {(positions || []).map((pos) => (
                      <option key={pos._id} value={pos._id}>
                        {pos.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Step 2: Bank Details */}
            {step === 2 && (
              <>
                {Object.entries(bankDetails).map(([key, value]) => (
                  <div key={key} className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formatLabel(key)}
                    </label>
                    <input
                      type="text"
                      name={key}
                      value={value}
                      onChange={handleBankChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder={`Enter ${formatLabel(key).toLowerCase()}`}
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Navigation Buttons - Fixed at bottom */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {step > 0 && (
                <button
                  onClick={prevStep}
                  className="px-6 py-2.5 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium"
                >
                  Back
                </button>
              )}
              
              {step < 2 ? (
                <button
                  onClick={nextStep}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Submit
                </button>
              )}
            </div>
            
            <div>
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-800 font-medium transition"
              >
                Back To Login
              </Link>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mt-4 flex justify-center">
            <div className="flex items-center space-x-2">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index === step
                      ? "bg-blue-600"
                      : index < step
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Snackbar Notification */}
      {snackbarOpen && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 w-full max-w-xs sm:max-w-sm md:max-w-md z-50 animate-slideDown">
          <Alert
            severity={snackbarMessage === "Register successful!" ? "success" : "error"}
            onClose={() => setSnackbarOpen(false)}
            className="shadow-lg"
          >
            {snackbarMessage}
          </Alert>
        </div>
      )}
    </div>
  );
};

export default Registration;