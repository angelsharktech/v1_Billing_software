import {
  Alert,
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
import { updateUser } from "../../services/UserService";
import { useNavigate } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";

const EditVendor = ({ open, data, handleCloseEdit, refresh }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    country: "",
    address: "",
    city: "",
    bio: "",
    gstRegistered: "",
    openingAmount: 0,
  });

  const [gstDetails, setGstDetails] = useState({
    gstNumber: "",
    legalName: "",
    state: "",
    stateCode: "",
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (data) {
          setLoading(true);
          setFormData({
            name: data.name || "",
            phone_number: data.phone_number || "",
            country: data.country || "",
            address: data.address || "",
            city: data.city || "",
            bio: data.bio || "",
            openingAmount: data.openingAmount || 0,
          });
          
          setGstDetails({
            gstNumber: data.gstDetails?.gstNumber || "",
            legalName: data.gstDetails?.legalName || "",
            state: data.gstDetails?.state || "",
            stateCode: data.gstDetails?.stateCode || "",
          });
          
          setBankDetails({
            bankName: data.bankDetails?.bankName || "",
            accountNumber: data.bankDetails?.accountNumber || "",
            accountName: data.bankDetails?.accountName || "",
            ifscCode: data.bankDetails?.ifscCode || "",
            upiId: data.bankDetails?.upiId || "",
          });
        }
      } catch (err) {
        console.error("Error loading user", err);
        setSnackbarMessage("Failed to load user data");
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [data]);

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

  const handleGstChange = (e) => {
    const { name, value } = e.target;
    setGstDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateUser = async () => {
    try {
      setLoading(true);
      const updatedUser = {
        ...formData,
        bankDetails,
        gstDetails,
      };
      
      const res = await updateUser(data._id, updatedUser);

      if (res === 401) {
        setSnackbarMessage("Your Session is expired. Please login again!");
        setSnackbarOpen(true);
        refresh();
        handleCloseEdit();
        setTimeout(() => {
          navigate("/login");
        }, 2000);
        return;
      }
      
      if (res) {
        setSnackbarMessage("Supplier Updated successfully!");
        setSnackbarOpen(true);
        refresh();
        handleCloseEdit();
      }
    } catch (error) {
      setSnackbarMessage("Failed to update Supplier!");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
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
  };

  const renderFormField = (key, value) => {
    const labelMap = {
      phone_number: "Contact Number",
      name: "Firm Name",
    };

    return (
      <Grid item xs={12} sm={6} key={key}>
        <TextField
          fullWidth
          label={labelMap[key] || key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          name={key}
          value={value}
          onChange={handleChange}
          required={key === "name"}
          size="small"
          type={key === "openingAmount" ? "number" : "text"}
          inputProps={key === "phone_number" ? { maxLength: 10 } : {}}
          sx={textFieldStyle}
        />
      </Grid>
    );
  };

  const renderBankField = (key, value) => {
    const labelMap = {
      ifscCode: "IFSC Code",
      upiId: "UPI ID",
      bankName: "Bank Name",
      accountNumber: "Account Number",
      accountName: "Account Name",
    };

    return (
      <Grid item xs={12} sm={6} key={key}>
        <TextField
          fullWidth
          label={labelMap[key]}
          name={key}
          value={value}
          onChange={handleBankChange}
          size="small"
          inputProps={key === "accountNumber" ? { maxLength: 18 } : {}}
          sx={textFieldStyle}
        />
      </Grid>
    );
  };

  const renderGstField = (key, value) => {
    const labelMap = {
      gstNumber: "GST Number",
      legalName: "Legal Name",
      state: "State",
      stateCode: "State Code",
    };

    return (
      <Grid item xs={12} sm={6} key={key}>
        <TextField
          fullWidth
          label={labelMap[key]}
          name={key}
          value={value}
          onChange={handleGstChange}
          size="small"
          InputProps={key === "stateCode" ? { readOnly: true } : {}}
          sx={textFieldStyle}
        />
      </Grid>
    );
  };

  return (
    <>
      <Modal open={open} onClose={handleCloseEdit}>
        <Box sx={style}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
              Edit Supplier
            </Typography>
            <IconButton
              onClick={handleCloseEdit}
              size="small"
            >
              <CloseIcon fontSize={isMobile ? "small" : "medium"} />
            </IconButton>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" p={2}>
              <Typography variant="body2">Loading supplier data...</Typography>
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
                  {Object.entries(gstDetails).map(([key, value]) => 
                    renderGstField(key, value)
                  )}
                </Grid>
              </Box>

              {/* Bank Details */}
              <Box mt={2}>
                <Typography variant="body1" fontWeight="bold" mb={0.5}>
                  Bank Details
                </Typography>
                <Grid container spacing={1}>
                  {Object.entries(bankDetails).map(([key, value]) => 
                    renderBankField(key, value)
                  )}
                </Grid>
              </Box>

              {/* Action Buttons */}
              <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
                <Button
                  onClick={handleCloseEdit}
                  variant="outlined"
                  size="small"
                  disabled={loading}
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
                  disabled={loading}
                  sx={{
                    background: "linear-gradient(135deg, #182848, #324b84ff)",
                    color: "#fff",
                    fontSize: '0.8125rem',
                    py: 0.5,
                    px: 1.5,
                    minWidth: '70px'
                  }}
                  onClick={handleUpdateUser}
                >
                  {loading ? "Updating..." : "Update"}
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

export default EditVendor;