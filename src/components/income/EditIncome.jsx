import React, { useEffect, useState } from "react";
import {
  Box,
  IconButton,
  Modal,
  Typography,
  Grid,
  TextField,
  Button,
  MenuItem,
  Snackbar,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
import IncomeNameAutocomplete from "./IncomeNameAutocomplete";
import { updateIncome } from "../../services/IncomeService";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: 2,
  p: 2,
  width: { xs: "90%", sm: 600, md: 700 },
  maxHeight: "85vh",
  overflowY: "auto",
};

const EditIncome = ({ open, data, handleCloseEdit, refresh }) => {
  const [formData, setFormData] = useState({
    date: "",
    amount: "",
    paymentType: "",
    description: "",
    name: "",
    groupOfIncome: "",
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Custom styles for consistent height
  const textFieldStyles = {
    '& .MuiOutlinedInput-root': {
      height: 40, // Fixed height for all text fields
    },
    '& .MuiInputBase-input': {
      padding: '8px 14px',
      fontSize: '0.875rem',
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.875rem',
      lineHeight: '1.2',
    },
    '& .MuiSelect-select': {
      padding: '8px 14px',
      fontSize: '0.875rem',
    },
  };

  const datePickerStyles = {
    '& .MuiOutlinedInput-root': {
      height: 40,
    },
    '& .MuiInputBase-input': {
      padding: '8px 14px',
      fontSize: '0.875rem',
      height: '100%',
    },
  };

  const autocompleteStyles = {
    '& .MuiAutocomplete-inputRoot': {
      height: 40,
      padding: '0 14px',
    },
    '& .MuiInputBase-input': {
      padding: '8px 4px',
      fontSize: '0.875rem',
    },
  };

  // ✅ Pre-fill form when modal opens
  useEffect(() => {
    if (data) {
      setFormData({
        date: data.date || "",
        amount: data.amount || "",
        paymentType: data.paymentType || "",
        description: data.description || "",
        name: data.name || "",
        groupOfIncome: data.groupOfIncome || "",
      });
    }
  }, [data]);

  // ✅ Handle change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle submit
  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      const res = await updateIncome(data._id, formData);
      if (res.status === true) {
        setSnackbarMessage("Income Updated successful!");
        setSnackbarOpen(true);
      }
      refresh && refresh();
      handleCloseEdit();
    } catch (error) {
      setSnackbarMessage(error);
      setSnackbarOpen(true);
    }
  };

  return (
    <>
      <Modal open={open} onClose={handleCloseEdit}>
        <Box sx={style}>
          {/* Close Button */}
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

          <Typography variant="h6" mb={2}>
            Edit Income
          </Typography>

          <Grid container spacing={2}>
            {/* Date */}
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DatePicker
                  label="Date"
                  value={
                    formData.date ? moment(formData.date, "YYYY-MM-DD") : null
                  }
                  format="DD/MM/YYYY"
                  onChange={(newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      date: newValue ? newValue.format("YYYY-MM-DD") : "",
                    }));
                  }}
                  slotProps={{
                    textField: { 
                      fullWidth: true, 
                      required: true,
                      sx: datePickerStyles
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>

            {/* Amount */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                required
                sx={textFieldStyles}
              />
            </Grid>

            {/* Payment Type */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Payment Type"
                name="paymentType"
                value={formData.paymentType}
                onChange={handleChange}
                required
                sx={textFieldStyles}
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
              </TextField>
            </Grid>

            {/* Name of Income (with autocomplete) */}
            <Grid item xs={12} sm={6}>
              <Box sx={autocompleteStyles}>
                <IncomeNameAutocomplete
                  formData={formData}
                  setFormData={setFormData}
                />
              </Box>
            </Grid>

            {/* Group of Income */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Group of Income"
                name="groupOfIncome"
                value={formData.groupOfIncome}
                onChange={handleChange}
                required
                sx={textFieldStyles}
              >
                <MenuItem value="Direct Income">Direct Income</MenuItem>
                <MenuItem value="Indirect Income">Indirect Income</MenuItem>
              </TextField>
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    minHeight: 80, // Taller for multiline
                    alignItems: 'flex-start',
                  },
                  '& .MuiInputBase-input': {
                    padding: '8px 14px',
                    fontSize: '0.875rem',
                  },
                }}
              />
            </Grid>

            {/* Update Button */}
            <Grid item xs={12} textAlign="right">
              <Button
                variant="contained"
                sx={{
                  background: "linear-gradient(135deg, #182848, #324b84ff)",
                  color: "#fff",
                  height: 40, // Same as input fields
                  fontSize: "0.875rem",
                  padding: "8px 24px",
                  minWidth: 120,
                }}
                onClick={handleSubmit}
              >
                Update Income
              </Button>
            </Grid>
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
            snackbarMessage === "Income Updated successful!"
              ? "success"
              : "error"
          }
          variant="filled"
          onClose={() => setSnackbarOpen(false)}
          sx={{ 
            width: '100%',
            fontSize: '0.875rem'
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EditIncome;