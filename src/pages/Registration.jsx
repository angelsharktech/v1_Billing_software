import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import invoice from "../assets/invoice.jpg";
import { getAllPositions } from "../services/Position";
import { getAllOrganization } from "../services/Organization";
import { getAllRoles } from "../services/Role";
import { Link } from "react-router-dom";
import { getAllUser, registerUser } from "../services/UserService";
import { Snackbar, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Registration = () => {
  const [step, setStep] = useState(0); // 0: Personal, 1: Company, 2: Bank

  const [organizations, setOrganizations] = useState([]);
  const [positions, setPositions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    userName:"",
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
    userName:""
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
      (u) => u?.email?.toLowerCase() === formData.email.toLowerCase()
    );
    if (emailExists) {
      setSnackbarMessage("Email already exists!");
      setSnackbarOpen(true);
      return;
    }
    const userNameExists = users?.some(
      (u) => u?.userName?.toLowerCase() === formData.userName.toLowerCase()
    );
    if (userNameExists) {
      setSnackbarMessage("User Name already exists!");
      setSnackbarOpen(true);
      return;
    }
    const finalData = { ...formData, bankDetails };
    // Add API call here
    const result = await registerUser(finalData);
    if (result) {
      setSnackbarMessage("Register successful!");
      setSnackbarOpen(true);
      navigate("/login");
      // setTimeout(() => {
      // }, 2000);
    }
  };

  const renderPersonalInfo = () => (
    <>
      {[
        "first_name",
        "last_name",
        "userName",
        "phone_number",
        "email",
        "password",
        "country",
        "address",
        "city",
        "bio",
      ].map((key) => (
        <Grid item xs={12} sm={6} key={key}>
          <TextField
            fullWidth
            label={key
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())}
            name={key}
            value={formData[key]}
            type={key === "password" ? "password" : "text"}
            error={Boolean(errors[key])}
            helperText={errors[key]}
            onChange={handleChange}
          />
        </Grid>
      ))}
    </>
  );

  const renderCompanyInfo = () => (
    <>
      {["company_name"].map((key) => (
        <Grid item xs={12} sm={6} key={key}>
          <TextField
            fullWidth
            label={key
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())}
            name={key}
            value={formData[key]}
            onChange={handleChange}
          />
        </Grid>
      ))}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          select
          label="Organization"
          name="organization_id"
          value={formData.organization_id}
          onChange={handleChange}
          sx={{
            minWidth: 200,
            maxWidth: "100%",
          }}
        >
          {(organizations || []).map((org) => (
            <MenuItem key={org._id} value={org._id}>
              {org.name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          select
          label="Role"
          name="role_id"
          value={formData.role_id}
          onChange={handleChange}
          sx={{
            minWidth: 225,
            maxWidth: "100%",
          }}
        >
          {(roles || []).map((role) => (
            <MenuItem key={role._id} value={role._id}>
              {role.name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          select
          label="Position"
          name="position_id"
          value={formData.position_id}
          onChange={handleChange}
          sx={{
            minWidth: 200,
            maxWidth: "100%",
          }}
        >
          {(positions || []).map((pos) => (
            <MenuItem key={pos._id} value={pos._id}>
              {pos.name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
    </>
  );

  const renderBankDetails = () => (
    <>
      {Object.entries(bankDetails).map(([key, value]) => (
        <Grid item xs={12} sm={6} key={key}>
          <TextField
            fullWidth
            label={key
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase())}
            name={key}
            value={value}
            onChange={handleBankChange}
          />
        </Grid>
      ))}
    </>
  );

  return (
    <>
      <Box
        sx={{
          height: "100vh",
          backgroundImage: `url(${invoice})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "left",
          // p: 2,
          overflow: "hidden",
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 4,
            maxWidth: 500,
            width: "50%",
            maxHeight: "90vh",
            overflowY: "auto",
            marginLeft: "15%",
            borderRadius: 5,
            //   marginTop: "10%",
          }}
        >
          <Typography variant="h5" mb={2}>
            {step === 0
              ? "Personal Info"
              : step === 1
              ? "Company Info"
              : "Bank Details"}
          </Typography>

          <Grid container spacing={2}>
            {step === 0 && renderPersonalInfo()}
            {step === 1 && renderCompanyInfo()}
            {step === 2 && renderBankDetails()}

            <Grid item xs={12} sx={{ mt: 2 }}>
              {step > 0 && (
                <Button variant="outlined" onClick={prevStep} sx={{ mr: 2 }}>
                  Back
                </Button>
              )}
              {step < 2 ? (
                <Button variant="contained" onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                >
                  Submit
                </Button>
              )}
            </Grid>
          </Grid>
          <Grid item xs={12} textAlign="right" mt={"3%"}>
            <Link
              to="/login"
              style={{ textDecoration: "none", color: "#1976d2" }}
            >
              Back To Login
            </Link>
          </Grid>
        </Paper>
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={
            snackbarMessage === "Register successful!" ? "success" : "error"
          }
          onClose={() => setSnackbarOpen(false)}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Registration;
