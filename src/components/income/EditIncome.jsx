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
import IncomeNameAutocomplete from "./IncomeNameAutocomplete"; // ✅ reuse autocomplete
import { updateIncome } from "../../services/IncomeService";

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

  // ✅ Handle submit (API call placeholder)
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
                    textField: { fullWidth: true, required: true },
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
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
              </TextField>
            </Grid>

            {/* Name of Income (with autocomplete) */}
            <Grid item xs={12} sm={6}>
              <IncomeNameAutocomplete
                formData={formData}
                setFormData={setFormData}
              />
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
                rows={3}
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Grid>

            {/* Save Button */}
            <Grid item xs={12} textAlign="right">
              <Button
                variant="contained"
                sx={{
                  background: "linear-gradient(135deg, #182848, #324b84ff)",
                  color: "#fff",
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
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EditIncome;
