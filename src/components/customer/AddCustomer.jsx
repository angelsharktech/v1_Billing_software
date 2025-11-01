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
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getAllPositions } from "../../services/Position";
import { getAllRoles } from "../../services/Role";
import {
  createUser,
  deleteUser,
  getAllUser,
  getUserById,
  registerUser,
} from "../../services/UserService";
import { createGstDetails } from "../../services/GstService";
import { addPayment } from "../../services/PaymentModeService";
import CloseIcon from "@mui/icons-material/Close";
import { getAllStates } from "../../services/StatesService";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: 2,
  p: 3,
  minWidth: 800,
  maxHeight: "90vh",
  overflowY: "auto",
};

const AddCustomer = ({ open, handleClose, refresh }) => {
  const { webuser } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    // country: "",
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
  // const [isGstApplicable, setIsGstApplicable] = useState(false);
  const [positions, setPositions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [state, setState] = useState([]);
  const [mainUser, setMainUser] = useState();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [errors, setErrors] = useState({ phone_number: "" });

  useEffect(() => {
    const fetchAll = async () => {
      try {
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
      }
    };
    fetchAll();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleRefreshClose = async () => {
    handleClose();
    setFormData({
      name: "",
      phone_number: "",
      country: "",
      address: "",
      city: "",
      openingAmount: 0,
      // bio: "",
    });

    // setIsGstApplicable(false);
    setGstDetails({
      gstNumber: "",
      legalName: "",
      state: "",
      stateCode: "",
    });
  };
  const handleSubmit = async () => {
    const customerRole = roles.find(
      (role) => role.name.toLowerCase() === "customer"
    );
    const customerposition = positions.find(
      (pos) => pos.name.toLowerCase() === "customer"
    );

    const phoneExists = users.find(
      (u) => u.phone_number === formData.phone_number
    );
    const gstExists = users.find(
      (u) => u?.gstDetails?.gstNumber === gstDetails?.gstNumber
    );
    if (gstExists) {
      setSnackbarMessage("GST number already exists!");
      setSnackbarOpen(true);
      return;
    }
    if (phoneExists) {
      setSnackbarMessage("Phone number already exists!");
      setSnackbarOpen(true);
      return;
    }
    if (errors.phone_number) {
      setSnackbarMessage(errors.phone_number);
      setSnackbarOpen(true);
      return;
    }
    if (!formData.name) {
      setSnackbarMessage("First Name is Required!");
      setSnackbarOpen(true);
      return;
    }
    if (formData.phone_number.length > 10) {
      setSnackbarMessage("Enter Valid Phone Number!");
      setSnackbarOpen(true);
      return;
    }
    const payload = {
      ...formData,
      gstDetails,
      organization_id: mainUser.organization_id?._id,
      email: formData.name.replace(/\s+/g, "").toLowerCase() + "@example.com",
      password:
        formData.name.replace(/\s+/g, "").toLowerCase() + "@example.com",
      role_id: customerRole._id,
      position_id: customerposition._id,
      openingAmount: Number(formData.openingAmount || 0).toFixed(2),
      // gstRegistered: isGstApplicable
    };
    try {
      const result = await createUser(payload);

      if (result) {
        // if(isGstApplicable === true){
        //    const r = await createGstDetails(result.user.id, gstDetails);
        //    if (!r.data) {
        //     await deleteUser(result.user.id);
        //     setSnackbarMessage("Enter Valid GST Details!");
        //     setSnackbarOpen(true);
        //     return;
        //   }
        // }

        const paymentPayload = {
          organization: mainUser.organization_id?._id,
          narration: "Opening Balance",
          client_id: result.data.data._id,
          forPayment: "sale",
          closingAmount: Number(result.data.data.openingAmount).toFixed(2),
        };
        const res = await addPayment(paymentPayload);

        setSnackbarMessage("Customer Added successful!");
        setSnackbarOpen(true);
        refresh();
        handleClose();
      }

      // Optionally reset
      setFormData({
        name: "",
        phone_number: "",
        country: "",
        address: "",
        city: "",
        openingAmount: 0,
      });
      // setIsGstApplicable(false);
      setGstDetails({
        gstNumber: "",
        legalName: "",
        state: "",
        stateCode: "",
      });
      setErrors({ phone_number: "" });
    } catch (error) {
      console.log("**", error);

      setSnackbarMessage(error);
      setSnackbarOpen(true);
    }
  };
  return (
    <>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style}>
          <IconButton
            aria-label="close"
            onClick={handleRefreshClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" mb={2}>
            Add Customer
          </Typography>

          <Grid container spacing={2}>
            {Object.entries(formData).map(([key, value]) => (
              <Grid item xs={12} sm={6} key={key}>
                <TextField
                  fullWidth
                  label={
                    key === "phone_number"
                      ? "Contact Number"
                      : key
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())
                  }
                  name={key}
                  value={value}
                  onChange={handleChange}
                  required={["name", "address", "phone_number"].includes(key)}
                  error={Boolean(errors[key])}
                  helperText={errors[key]}
                />
              </Grid>
            ))}
          </Grid>
          <Typography variant="h6" mt={2}>
            GST Details
          </Typography>
          <Grid container spacing={2} mt={1}>
            {/* GST Number */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Gst Number"
                name="gstNumber"
                value={gstDetails.gstNumber}
                onChange={(e) =>
                  setGstDetails({ ...gstDetails, gstNumber: e.target.value })
                }
              />
            </Grid>

            {/* Legal Name */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Legal Name"
                name="legalName"
                value={gstDetails.legalName}
                onChange={(e) =>
                  setGstDetails({ ...gstDetails, legalName: e.target.value })
                }
              />
            </Grid>

            {/* State and statecode with Autocomplete */}
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
                    sx={{ width: "200px" }}
                  />
                )}
              />
            </Grid>

            {/* State Code (read-only) */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State Code"
                name="stateCode"
                value={gstDetails.stateCode}
                InputProps={{ readOnly: true }}
              />
            </Grid>
          </Grid>

          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button onClick={handleClose} sx={{ mr: 2, color: "#182848" }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              sx={{
                background: "linear-gradient(135deg, #182848, #324b84ff)",
                color: "#fff",
              }}
              onClick={handleSubmit}
            >
              Save
            </Button>
          </Box>
        </Box>
      </Modal>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={
            snackbarMessage === "Customer Added successful!"
              ? "success"
              : "error"
          }
          variant="filled"
          onClose={() => setSnackbarOpen(false)}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddCustomer;
