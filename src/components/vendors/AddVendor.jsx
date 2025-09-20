import {
  Alert,
  Box,
  Button,
  Grid,
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
  getAllUser,
  getUserById,
  registerUser,
} from "../../services/UserService";
import { createGstDetails } from "../../services/GstService";
import { addPayment } from "../../services/PaymentModeService";

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

const AddVendor = ({ open, handleClose, refresh }) => {
  const { webuser } = useAuth();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    // country: "",
    address: "",
    city: "",
     openingAmount: 0, 
    // bio: "",
  });

  const [bankDetails, setBankDetails] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
    ifscCode: "",
    upiId: "",
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
  const [mainUser, setMainUser] = useState();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [errors, setErrors] = useState({ phone_number: "" });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [posData, roleData, userData, user] = await Promise.all([
          getAllPositions(),
          getAllRoles(),
          getAllUser(),
          getUserById(webuser.id),
        ]);
        setPositions(posData);
        setRoles(roleData);
        setUsers(userData);
        setMainUser(user);
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

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setBankDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const vendorRole = roles.find(
        (role) => role.name.toLowerCase() === "vendor"
      );
      const vendorposition = positions.find(
        (pos) => pos.name.toLowerCase() === "vendor"
      );

      const phoneExists = users.find(
        (u) => u.phone_number === formData.phone_number
      );
      if (phoneExists) {
        setSnackbarMessage("Contact number already exists!");
        setSnackbarOpen(true);
        return;
      }
      if (errors.phone_number) {
        setSnackbarMessage(errors.phone_number);
        setSnackbarOpen(true);
        return;
      }
      if (!formData.first_name) {
        setSnackbarMessage("First Name is Required!");
        setSnackbarOpen(true);
        return;
      }
      const payload = {
        ...formData,
        bankDetails,
        gstDetails,
        organization_id: mainUser.organization_id?._id,
        email: formData.first_name + "@example.com",
        password: formData.first_name + "@example.com",
        role_id: vendorRole._id,
        position_id: vendorposition._id,
        // gstRegistered: isGstApplicable
      };      
      
      const result = await createUser(payload);
      if (result) {
        //  if (result) {
        //         if(isGstApplicable === true){
        //            const r = await createGstDetails(result.user.id, gstDetails); 
        //            if (!r.data) {
        //             await deleteUser(result.user.id);                                                       
        //             setSnackbarMessage("Enter Valid GST Details!");
        //             setSnackbarOpen(true);
        //             return;
        //           } 
        //         }
        //       }
        const paymentPayload = {
           organization: mainUser.organization_id?._id,
          narration : "Opening Balance",
          client_id : result.data.data._id,
          forPayment : "purchase",
          closingAmount : result.data.data.openingAmount
        }
        const res = await addPayment(paymentPayload);
        
        setSnackbarMessage("Supplier Added successful!");
        setSnackbarOpen(true);
        refresh();
        handleClose();
      }

      // Optionally reset
      setFormData({
        first_name: "",
        last_name: "",
        phone_number: "",
        country: "",
        address: "",
        city: "",
        openingAmount : 0,
        // bio: "",
      });
      setBankDetails({
        bankName: "",
        accountNumber: "",
        accountName: "",
        ifscCode: "",
        upiId: "",
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
      console.log("Error adding vendor:", error);
      
      setSnackbarMessage(error);
      setSnackbarOpen(true);
    }
   
    
  };
  return (
    <>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style}>
          <Typography variant="h6" mb={2}>
            Add Supplier
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
                  required={key === "first_name"}
                  error={Boolean(errors[key])}
                  helperText={errors[key]}
                />
              </Grid>

            ))}
          </Grid>
          
          <Typography variant="h6" mt={2} mb={2}>
            GST Details
          </Typography>
          {/* {isGstApplicable && ( */}
            <Grid container spacing={2} mt={1}>
              {Object.entries(gstDetails).map(([key, value]) => (
                <Grid item xs={12} sm={6} key={key}>
                  <TextField
                    fullWidth
                    label={key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (s) => s.toUpperCase())}
                    name={key}
                    value={value}
                    onChange={(e) =>
                      setGstDetails((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                  />
                </Grid>
              ))}
            </Grid>
          <Typography variant="h6" mt={2} mb={2}>
            Bank Details
          </Typography>

          <Grid container spacing={2}>
            {Object.entries(bankDetails).map(([key, value]) => (
              <Grid item xs={12} sm={6} key={key}>
                <TextField
                  fullWidth
                  label={
                    key === "ifscCode"
                      ? "IFSC Code"
                      : key === "upiId"
                      ? "UPI Id"
                      : key
                          .replace(/_/g, " ")
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())
                  }
                  name={key}
                  value={value}
                  onChange={handleBankChange}
                />
              </Grid>
            ))}
          </Grid>

          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button onClick={handleClose} sx={{ mr: 2, color: "#182848" }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              sx={{background: "linear-gradient(135deg, #182848, #324b84ff)",color: "#fff" }}  
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
          severity={snackbarMessage === "Supplier Added successful!" ? "success" : "error"}
          variant="filled"
          onClose={() => setSnackbarOpen(false)}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddVendor;
