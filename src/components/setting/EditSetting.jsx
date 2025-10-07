import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  TextField,
  Typography,
  Button,
  MenuItem,
  Avatar,
  Divider,
  Modal,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../../context/AuthContext";
import { getUserById } from "../../services/UserService";
import { UpdateOrganization } from "../../services/Organization";

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
};

const EditSetting = ({ edit, data, handleCloseEdit, refresh }) => {
  const { webuser } = useAuth();
  const [mainUser, setMainUser] = useState();
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    address: "",
    logo: "",
  });
  const [gstDetails, setGstDetails] = useState({
    gstNumber: "",
    legalName: "",
    state: "",
    stateCode: "",
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  useEffect(() => {
    const fetchUser = async () => {
      setFormData({
        name: data?.name || "",
        phone_number: data?.phone_number || "",
        address: data?.address || "",
        logo: data?.logo || "",
      });
      setGstDetails({
        gstNumber: data?.gstDetails?.gstNumber || "",
        legalName: data?.gstDetails?.legalName || "",
        state: data?.gstDetails?.state || "",
        stateCode: data?.gstDetails?.stateCode || "",
      });
    };
    fetchUser();
  }, [data]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files) {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    } else if (
      ["gstNumber", "legalName", "state", "stateCode"].includes(name)
    ) {
      setGstDetails((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSave = async () => {
    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("phone_number", formData.phone_number);
      form.append("address", formData.address);
      form.append("gstDetails", JSON.stringify(gstDetails));

      if (formData.logo instanceof File) {
        form.append("logo", formData.logo);
      }

      const result = await UpdateOrganization(data._id, form);
      if (result.status === true) {
        setSnackbarMessage("Details updated successfully!");
        setSnackbarOpen(true);
        refresh();
        handleCloseEdit();
      } else {
        console.error("❌ Update failed:", result);
      }
    } catch (error) {
      console.error("Error saving organization:", error);
      setSnackbarMessage(error.response);
      setSnackbarOpen(true);
    }
  };

  return (
    <>
      <Modal open={edit} onClose={handleCloseEdit}>
        <Box sx={style}>
          <IconButton
            aria-label="close"
            onClick={handleCloseEdit}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Settings
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2}>
            {/* Shop Name */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Organization Name"
                name="organization_id"
                value={formData?.name}
                onChange={handleChange}
              />
            </Grid>

            {/* Mobile */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
              />
            </Grid>

            {/* Address */}
            <Grid item xs={12}>
              <TextField
                sx={{ width: "220px" }}
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                multiline
                rows={2}
              />
            </Grid>

            {/* GST Number */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="GST Number"
                name="gstNumber"
                value={gstDetails.gstNumber}
                onChange={handleChange}
              />
            </Grid>
            {/* legalName */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Business Name"
                name="legalName"
                value={gstDetails.legalName}
                onChange={handleChange}
              />
            </Grid>
            {/* stateCode */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State"
                name="state"
                value={gstDetails.state}
                onChange={handleChange}
              />
            </Grid>
            {/* GST Number */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State Code"
                name="stateCode"
                value={gstDetails.stateCode}
                onChange={handleChange}
              />
            </Grid>

            {/* Logo Upload */}
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar
                  alt="Logo"
                  src={
                    formData.logo
                      ? typeof formData.logo === "string"
                        ? formData.logo
                        : URL.createObjectURL(formData.logo)
                      : ""
                  }
                  sx={{ width: 56, height: 56 }}
                />
                <Button variant="outlined" component="label">
                  Upload Logo
                  <input
                    type="file"
                    accept="image/*"
                    name="logo"
                    hidden
                    onChange={handleChange}
                  />
                </Button>
              </Box>
            </Grid>

            {/* Last Updated */}
            {/* <Grid item xs={12}>
              <TextField
                fullWidth
                label="Last Updated"
                name="lastUpdated"
                value={formData.lastUpdated}
                InputProps={{ readOnly: true }}
              />
            </Grid> */}
          </Grid>
          {/* Save Button */}
          <Grid item xs={12} textAlign="left" sx={{ mt: 2 }}>
            <Button
              variant="contained"
              sx={{
                background: "#182848",
                px: 4,
                py: 1,
                borderRadius: 2,
              }}
              onClick={handleSave}
            >
              Save
            </Button>
          </Grid>
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
            snackbarMessage === "Details updated successfully!"
              ? "success"
              : "error"
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

export default EditSetting;
