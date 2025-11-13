import React, { useState } from "react";
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
import { createIncomes } from "../../services/IncomeService";

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

const CreateIncome = ({ user, open, handleClose, refresh }) => {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      const payload = {
        ...formData,
        org: user.organization_id._id,
      };
      console.log("Income Data:", payload);
      const result = await createIncomes(payload);
      if (result.status === true) {
        setSnackbarMessage("Income Added successful!");
        setSnackbarOpen(true);
      }
      handleRefreshClose();
      refresh && refresh();
    } catch (error) {
      setSnackbarMessage(error);
      setSnackbarOpen(true);
    }
  };

  const handleRefreshClose = async () => {
    handleClose();
    setFormData({
      date: "",
      amount: "",
      paymentType: "",
      description: "",
      name: "",
      groupOfIncome: "",
    });
  };
  return (
    <>
    <Modal open={open} onClose={handleRefreshClose}>
      <Box sx={style}>
        {/* Close Button */}
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
          Add Income
        </Typography>

        {/* Form Fields */}
        {/* Date */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box mb={4}>
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
            </Box>
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
              sx={{ width: "200px" }}
              label="Payment Type"
              name="paymentType"
              value={formData.paymentType}
              onChange={handleChange}
            >
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="UPI">UPI</MenuItem>
            </TextField>
          </Grid>
          {/*  Name of Income*/}
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
              sx={{ width: "200px" }}
              label="Group of Income"
              name="groupOfIncome"
              value={formData.groupOfIncome}
              onChange={handleChange}
              placeholder="e.g. Office, Travel, Maintenance"
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

          <Grid item xs={12} textAlign="right">
            <Button
              variant="contained"
              sx={{
                background: "linear-gradient(135deg, #182848, #324b84ff)",
                color: "#fff",
              }}
              onClick={handleSubmit}
            >
              Save Income
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
                snackbarMessage === "Income Added successful!"
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

export default CreateIncome;
