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
import { updateUser } from "../../services/UserService";
import { useNavigate } from "react-router-dom";
import { createGstDetails, getGstDetails } from "../../services/GstService";

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

const EditCustomer = ({ open, data, handleCloseEdit, refresh }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    country: "",
    address: "",
    city: "",
    bio: "",
    gstRegistered: "" ,
    openingAmount : 0 ,
  });

  const [gstDetails, setGstDetails] = useState({
    gstNumber: "",
    legalName: "",
    state: "",
    stateCode: "",
  });
  // const [isGstApplicable, setIsGstApplicable] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (data) {
          setFormData({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            phone_number: data.phone_number || "",
            country: data.country || "",
            address: data.address || "",
            city: data.city || "",
            bio: data.bio || "",
            openingAmount : data.openingAmount || 0,
          });
          setGstDetails({
            gstNumber: data.gstDetails?.gstNumber || "",
            legalName: data.gstDetails?.legalName || "",
            state: data.gstDetails?.state || "",
            stateCode: data.gstDetails?.stateCode || "",
          });
        }
      } catch (err) {
        console.error("Error loading user", err);
      }
    };

    fetchUser();
  }, [data]);
  //  useEffect(() => {
  //     const fetchGstDetails = async () => {
  //       try {
  //         const gst = await getGstDetails(data?._id);
  
  //         setGstDetails({
  //           gstNumber: gst?.gstNumber || "",
  //           legalName: gst?.legalName || "",
  //           state: gst?.state || "",
  //           stateCode: gst?.stateCode || "",
  //         });
  //       } catch (err) {
  //         console.error("Error fetching GST details", err);
  //       }
  //     };
  
  //     fetchGstDetails();
  //   }, [gstDetails]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateUser = async () => {
     try {
       const updatedUser = {
      ...formData,
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
         
         
         setSnackbarMessage("Customer Updated successful!");
         setSnackbarOpen(true);
         refresh();
         handleCloseEdit();
       }
     } catch (error) {
       setSnackbarMessage("Failed to update Customer! ");
       setSnackbarOpen(true);
     }
   };
  return (
    <>
      <Modal open={open} onClose={handleCloseEdit}>
        <Box sx={style}>
          <Typography variant="h6" mb={2}>
            Edit Customer
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
                  disabled = {key === "openingAmount"}
                />
              </Grid>
            ))}
          </Grid>
            <Box mt={2}>
              <Typography variant="h6" mb={2}>
                GST Details
              </Typography>
              <Grid container spacing={2}>
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
            </Box>

          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button onClick={handleCloseEdit} sx={{ mr: 2, color: "#182848" }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              sx={{background: "linear-gradient(135deg, #182848, #324b84ff)",color: "#fff" }}
              onClick={handleUpdateUser}
            >
              Update
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
            snackbarMessage === "Customer Updated successful!"
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

export default EditCustomer;
