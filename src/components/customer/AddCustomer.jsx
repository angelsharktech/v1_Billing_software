import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Grid,
  IconButton,
  Modal,
  Snackbar,
  TextField,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getAllPositions } from "../../services/Position";
import { getAllRoles } from "../../services/Role";
import {
  createUser,
  getAllUser,
  getUserById,
} from "../../services/UserService";
import { addPayment } from "../../services/PaymentModeService";
import CloseIcon from "@mui/icons-material/Close";
import { getAllStates } from "../../services/StatesService";

const AddCustomer = ({ open, handleClose, refresh }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  
  const { webuser } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    address: "",
    city: "",
    openingAmount: 0,
  });
  
  const [gstDetails, setGstDetails] = useState({
    gstNumber: "",
    legalName: "",
    state: "",
    stateCode: "",
  });
  
  const [positions, setPositions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [state, setState] = useState([]);
  const [mainUser, setMainUser] = useState();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [errors, setErrors] = useState({ phone_number: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [posData, roleData, userData, user, stateData] =
          await Promise.all([
            getAllPositions(),
            getAllRoles(),
            getAllUser(),
            getUserById(webuser.id),
            getAllStates(),
          ]);
        setPositions(posData);
        setRoles(roleData);
        setUsers(userData);
        setMainUser(user);
        setState(stateData);
      } catch (err) {
        console.error("Failed to fetch form data:", err);
        setSnackbarMessage("Failed to load form data");
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    bgcolor: "background.paper",
    boxShadow: 24,
    borderRadius: 2,
    p: isMobile ? 1.5 : 2,
    width: isMobile ? "95vw" : isTablet ? "85vw" : 800,
    maxWidth: "95vw",
    maxHeight: "90vh",
    overflowY: "auto",
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone_number") {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (value && !phoneRegex.test(value)) {
        setErrors((prev) => ({
          ...prev,
          phone_number: "Invalid mobile number",
        }));
      } else {
        setErrors((prev) => ({ ...prev, phone_number: "" }));
      }
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone_number: "",
      address: "",
      city: "",
      openingAmount: 0,
    });
    setGstDetails({
      gstNumber: "",
      legalName: "",
      state: "",
      stateCode: "",
    });
    setErrors({ phone_number: "" });
  };

  const handleRefreshClose = async () => {
    resetForm();
    handleClose();
  };

  const handleSubmit = async () => {
    try {
      // Validation checks
      if (errors.phone_number) {
        setSnackbarMessage(errors.phone_number);
        setSnackbarOpen(true);
        return;
      }
      if (!formData.name.trim()) {
        setSnackbarMessage("First Name is Required!");
        setSnackbarOpen(true);
        return;
      }
      if (formData.phone_number && formData.phone_number.length !== 10) {
        setSnackbarMessage("Enter Valid 10-digit Phone Number!");
        setSnackbarOpen(true);
        return;
      }
      
      const customerRole = roles.find(
        (role) => role.name.toLowerCase() === "customer"
      );
      const customerPosition = positions.find(
        (pos) => pos.name.toLowerCase() === "customer"
      );
      
      if (!customerRole || !customerPosition) {
        setSnackbarMessage("Required roles/positions not found!");
        setSnackbarOpen(true);
        return;
      }

      if (formData.phone_number) {
        const phoneExists = users.find(
          (u) => u.phone_number === formData.phone_number
        );
        if (phoneExists) {
          setSnackbarMessage("Phone number already exists!");
          setSnackbarOpen(true);
          return;
        }
      }

      if (gstDetails.gstNumber) {
        const gstExists = users.find(
          (u) => u?.gstDetails?.gstNumber === gstDetails?.gstNumber
        );
        if (gstExists) {
          setSnackbarMessage("GST number already exists!");
          setSnackbarOpen(true);
          return;
        }
      }

      const payload = {
        ...formData,
        gstDetails,
        organization_id: mainUser.organization_id?._id,
        email: formData.name.replace(/\s+/g, "").toLowerCase() + "@example.com",
        password:
          formData.name.replace(/\s+/g, "").toLowerCase() + "@example.com",
        role_id: customerRole._id,
        position_id: customerPosition._id,
        openingAmount: Number(formData.openingAmount || 0).toFixed(2),
      };

      const result = await createUser(payload);

      if (result) {
        const paymentPayload = {
          organization: mainUser.organization_id?._id,
          narration: "Opening Balance",
          client_id: result.data.data._id,
          forPayment: "sale",
          closingAmount: Number(result.data.data.openingAmount).toFixed(2),
        };
        
        await addPayment(paymentPayload);
        setSnackbarMessage("Customer Added successfully!");
        setSnackbarOpen(true);
        refresh();
        resetForm();
        handleClose();
      }
    } catch (error) {
      console.log("Error adding customer:", error);
      setSnackbarMessage(error?.response?.data?.message || "Something went wrong");
      setSnackbarOpen(true);
    }
  };

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      height: 40,
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.875rem',
    },
    '& .MuiOutlinedInput-input': {
      fontSize: '0.875rem',
      padding: '8.5px 14px',
    },
    '& .MuiFormHelperText-root': {
      fontSize: '0.75rem',
      marginTop: '2px',
    }
  };

  const renderFormField = (key, value) => {
    const labelMap = {
      phone_number: "Contact Number",
      name: "First Name",
    };

    return (
      <Grid item xs={12} sm={6} key={key}>
        <TextField
          fullWidth
          label={labelMap[key] || key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          name={key}
          value={value}
          onChange={handleChange}
          required={["name", "address", "phone_number"].includes(key)}
          error={Boolean(errors[key])}
          helperText={errors[key]}
          size="small"
          type={key === "openingAmount" ? "number" : "text"}
          inputProps={key === "phone_number" ? { maxLength: 10 } : {}}
          sx={textFieldStyle}
        />
      </Grid>
    );
  };

  return (
    <>
      <Modal open={open} onClose={handleRefreshClose}>
        <Box sx={style}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
              Add Customer
            </Typography>
            <IconButton
              onClick={handleRefreshClose}
              size="small"
            >
              <CloseIcon fontSize={isMobile ? "small" : "medium"} />
            </IconButton>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" p={2}>
              <Typography variant="body2">Loading form data...</Typography>
            </Box>
          ) : (
            <>
              {/* Basic Information */}
              <Typography variant="body1" fontWeight="bold" mb={0.5}>
                Basic Information
              </Typography>
              <Grid container spacing={1}>
                {Object.entries(formData).map(([key, value]) => 
                  renderFormField(key, value)
                )}
              </Grid>

              {/* GST Details */}
              <Box mt={2}>
                <Typography variant="body1" fontWeight="bold" mb={0.5}>
                  GST Details
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="GST Number"
                      name="gstNumber"
                      value={gstDetails.gstNumber}
                      onChange={(e) =>
                        setGstDetails({ ...gstDetails, gstNumber: e.target.value })
                      }
                      size="small"
                      sx={textFieldStyle}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Legal Name"
                      name="legalName"
                      value={gstDetails.legalName}
                      onChange={(e) =>
                        setGstDetails({ ...gstDetails, legalName: e.target.value })
                      }
                      size="small"
                      sx={textFieldStyle}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      freeSolo
                      options={state.map((s) => s.name)}
                      value={gstDetails.state}
                      onChange={(event, newValue) => {
                        const selectedState = state.find((s) => s.name === newValue);
                        setGstDetails((prev) => ({
                          ...prev,
                          state: newValue || "",
                          stateCode: selectedState ? selectedState.stateCode : "",
                        }));
                      }}
                      onInputChange={(event, newInputValue) => {
                        setGstDetails((prev) => ({ ...prev, state: newInputValue }));
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="State"
                          size="small"
                          sx={textFieldStyle}
                        />
                      )}
                      size="small"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="State Code"
                      name="stateCode"
                      value={gstDetails.stateCode}
                      InputProps={{ readOnly: true }}
                      size="small"
                      sx={textFieldStyle}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Action Buttons */}
              <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
                <Button
                  onClick={handleRefreshClose}
                  variant="outlined"
                  size="small"
                  sx={{ 
                    fontSize: '0.8125rem',
                    py: 0.5,
                    px: 1.5,
                    minWidth: '70px',
                    color: '#182848'
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    background: "linear-gradient(135deg, #182848, #324b84ff)",
                    color: "#fff",
                    fontSize: '0.8125rem',
                    py: 0.5,
                    px: 1.5,
                    minWidth: '70px'
                  }}
                  onClick={handleSubmit}
                >
                  Save
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbarMessage.includes("successfully") ? "success" : "error"}
          variant="filled"
          onClose={() => setSnackbarOpen(false)}
          sx={{ fontSize: '0.875rem' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddCustomer;