import React, { useEffect, useState } from "react";
import {
  Box,
  IconButton,
  Modal,
  TextField,
  Grid,
  Typography,
  Button,
  MenuItem,
  Snackbar,
  Alert,
  Paper,
  Divider,
  Stack,
  useTheme,
  useMediaQuery,
  Container,
  InputAdornment,
  Chip,
  FormControlLabel,
  Radio,
  RadioGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import moment from "moment";
import { addPayment } from "../../services/PaymentModeService";
import { getSaleBillById, updateSaleBill } from "../../services/SaleBillService";

// Responsive modal styles
const getModalStyle = (isMobile, isTablet) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: 2,
  p: { xs: 2, sm: 3, md: 4 },
  width: {
    xs: "95vw",
    sm: "90vw",
    md: "80vw",
    lg: "70vw",
  },
  maxWidth: "1200px",
  maxHeight: "90vh",
  overflowY: "auto",
});

const EditBill = ({ open, data, handleCloseEdit, refresh }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  
  const [bill, setBill] = useState(null);
  const [advance, setAdvance] = useState(0);
  const [balance, setBalance] = useState(0);
  const [fullPay, setFullPay] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    advpaymode: "",
    transactionNumber: "",
    cardLastFour: "",
    bankName: "",
    chequeNumber: "",
    fullMode: "",
    utrId: "",
    financeName: "",
    balancePayMode: "",
  });

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const res = await getSaleBillById(data?._id);
        const billData = res.data;
        
        if (billData.balancePayMode?.toLowerCase().includes("finance")) {
          const parts = billData.balancePayMode.split("-");
          const financeName = parts.length > 1 ? parts[1] : "";

          setPaymentDetails({
            ...paymentDetails,
            advpaymode: parts[0],
            financeName: financeName,
          });
          setBill({
            ...billData,
            paymentType: "full",
            fullPaid: billData.grandTotal || 0,
          });
          setAdvance(billData.balance);
          setBalance(0);
        } else {
          setBill(billData);
          setAdvance(Number(billData.advance || 0));
          const calculatedBalance =
            Number(billData.grandTotal || 0) -
            Number(billData.fullPaid || 0) -
            Number(billData.advance || 0);
          setBalance(calculatedBalance);
        }
      } catch (err) {
        console.error("Error loading bill by ID", err);
        setSnackbarMessage("Failed to load bill details");
        setSnackbarOpen(true);
      }
    };

    if (data?._id) {
      fetchBill();
    }
  }, [data]);

  useEffect(() => {
    const fullPayment = balance === 0 ? bill?.grandTotal : 0;
    setFullPay(fullPayment);
  }, [advance, balance, bill]);

  const handleAdvanceChange = (e) => {
    if (bill?.balancePayMode?.toLowerCase().includes("finance")) {
      return;
    }

    const newAdvance = parseFloat(e.target.value || "0");
    const totalAdvance = (bill?.advance || 0) + newAdvance;
    const newBalance =
      (bill?.grandTotal || 0) - totalAdvance - (bill?.fullPaid || 0);

    setAdvance(newAdvance);

    if (newBalance <= 0) {
      setBalance(0);
      setFullPay(bill?.grandTotal || 0);
    } else {
      setBalance(newBalance);
      setFullPay(0);
    }
  };

  const handleUpdateConfirmation = () => {
    setConfirmDialogOpen(true);
  };

  const updateBill = async () => {
    setConfirmDialogOpen(false);
    
    try {
      const billTotal = bill?.grandTotal || 0;
      let updatedData = {};
      let paymentType = "";

      if (bill?.balancePayMode?.toLowerCase().includes("finance")) {
        const parts = bill.balancePayMode.split("-");
        const financeName = parts.length > 1 ? parts[1] : "";

        updatedData = {
          advance: 0,
          balance: 0,
          paymentType: "full",
          fullPaid: billTotal,
        };
        paymentType = "full";
      } else {
        const newAdvance = advance || 0;
        const totalAdvance = (bill?.advance || 0) + newAdvance;
        const remainingBalance = billTotal - totalAdvance;
        const isFullPayment = remainingBalance <= 0;

        updatedData = {
          advance: isFullPayment ? 0 : totalAdvance,
          balance: isFullPayment ? 0 : remainingBalance,
          paymentType: isFullPayment ? "full" : "advance",
          fullPaid: isFullPayment ? billTotal : 0,
        };
        paymentType = updatedData.paymentType;
      }

      const res = await updateSaleBill(bill._id, updatedData);
      if (res.success === true) {
        // Prepare payment payload
        const paymentType = balance > 0 ? "advance" : "full";
        const selectedMode = paymentType === "advance" 
          ? paymentDetails.advpaymode 
          : paymentDetails.fullMode;

        let paymentPayload = {
          paymentType: selectedMode,
          amount: advance,
          client_id: bill?.bill_to?._id,
          salebill: bill?._id,
          organization: bill?.org?._id || bill?.organization?._id,
          billType: "sale",
          narration: `${paymentType === "advance" ? "Advance" : "Full"} payment for Bill ${bill?.bill_number || ""}`,
        };

        // Add payment mode-specific fields
        if (selectedMode?.toLowerCase() === "upi" || selectedMode?.toLowerCase() === "online transfer") {
          paymentPayload.utrId = paymentDetails.transactionNumber || paymentDetails.utrId;
        } else if (selectedMode?.toLowerCase() === "cheque") {
          paymentPayload.bankName = paymentDetails.bankName;
          paymentPayload.chequeNumber = paymentDetails.chequeNumber;
        } else if (selectedMode?.toLowerCase() === "finance") {
          paymentPayload.financeName = paymentDetails.financeName;
        }

        // Add payment record
        try {
          await addPayment(paymentPayload);
        } catch (error) {
          console.error("Failed to add payment:", error);
        }

        setSnackbarMessage("Sale bill updated successfully!");
        setSnackbarOpen(true);
        refresh();
        handleCloseEdit();
      }
    } catch (error) {
      console.error("Update error:", error);
      setSnackbarMessage(error.message || "Failed to update bill");
      setSnackbarOpen(true);
    }
  };

  // Mobile view components
  const MobileBillView = () => (
    <Stack spacing={2}>
      {/* Bill Header */}
      <Paper sx={{ p: 2, backgroundColor: "#f5f5f5" }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Bill #{bill.bill_number || "N/A"}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {moment(bill.createdAt).format("DD/MM/YYYY")}
        </Typography>
      </Paper>

      {/* Customer Info */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Customer Information
        </Typography>
        <Stack spacing={1}>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="textSecondary">Name:</Typography>
            <Typography variant="body2">{bill.bill_to?.name || "N/A"}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="textSecondary">Phone:</Typography>
            <Typography variant="body2">{bill.bill_to?.phone_number || "N/A"}</Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Bill Summary */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Bill Summary
        </Typography>
        <Stack spacing={1}>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="textSecondary">Bill Type:</Typography>
            <Chip label={bill.billType?.toUpperCase() || "N/A"} size="small" />
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="textSecondary">Payment Type:</Typography>
            <Chip 
              label={bill.paymentType?.toUpperCase() || "N/A"} 
              size="small" 
              color={bill.paymentType === "full" ? "success" : "warning"}
            />
          </Box>
        </Stack>
      </Paper>

      {/* Amounts */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Amount Details
        </Typography>
        <Stack spacing={1}>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="textSecondary">Subtotal:</Typography>
            <Typography variant="body2">₹{bill.subtotal?.toFixed(2) || "0.00"}</Typography>
          </Box>
          {bill.gstTotal > 0 && (
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="textSecondary">GST:</Typography>
              <Typography variant="body2">₹{bill.gstTotal?.toFixed(2) || "0.00"}</Typography>
            </Box>
          )}
          <Box display="flex" justifyContent="space-between" sx={{ borderTop: '1px solid #e0e0e0', pt: 1 }}>
            <Typography variant="body2" fontWeight={600}>Grand Total:</Typography>
            <Typography variant="body2" fontWeight={600}>₹{bill.grandTotal?.toFixed(2) || "0.00"}</Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Payment Update Section */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Update Payment
        </Typography>
        {bill?.balance > 0 && (
          <Stack spacing={2}>
            <TextField
              label="Add Advance Amount"
              type="number"
              value={advance}
              onChange={handleAdvanceChange}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                inputProps: { min: 0, max: bill.grandTotal }
              }}
              helperText={`Max: ₹${bill.grandTotal?.toFixed(2)}`}
            />
            
            <Box sx={{ p: 1.5, backgroundColor: '#e8f5e9', borderRadius: 1 }}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="textSecondary">Current Balance:</Typography>
                <Typography variant="body2" fontWeight={600}>₹{balance?.toFixed(2)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="textSecondary">New Balance:</Typography>
                <Typography variant="body2" fontWeight={600} color={balance - advance <= 0 ? "success.main" : "warning.main"}>
                  ₹{(balance - advance).toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Stack>
        )}
      </Paper>

      {/* Payment Mode Selection */}
      {advance > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Payment Mode
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={paymentDetails.advpaymode}
            onChange={(e) => setPaymentDetails({ ...paymentDetails, advpaymode: e.target.value })}
          >
            <MenuItem value="">Select Payment Mode</MenuItem>
            <MenuItem value="cash">Cash</MenuItem>
            <MenuItem value="upi">UPI</MenuItem>
            <MenuItem value="online transfer">Online Transfer</MenuItem>
            <MenuItem value="card">Card</MenuItem>
            <MenuItem value="cheque">Cheque</MenuItem>
            <MenuItem value="finance">Finance</MenuItem>
          </TextField>

          {/* Payment mode specific fields */}
          {paymentDetails.advpaymode === "upi" && (
            <TextField
              label="UPI Transaction ID"
              fullWidth
              size="small"
              value={paymentDetails.transactionNumber}
              onChange={(e) => setPaymentDetails({ ...paymentDetails, transactionNumber: e.target.value })}
              sx={{ mt: 2 }}
            />
          )}

          {paymentDetails.advpaymode === "online transfer" && (
            <TextField
              label="UTR Number"
              fullWidth
              size="small"
              value={paymentDetails.utrId}
              onChange={(e) => setPaymentDetails({ ...paymentDetails, utrId: e.target.value })}
              sx={{ mt: 2 }}
            />
          )}

          {paymentDetails.advpaymode === "cheque" && (
            <Stack spacing={2} mt={2}>
              <TextField
                label="Bank Name"
                fullWidth
                size="small"
                value={paymentDetails.bankName}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, bankName: e.target.value })}
              />
              <TextField
                label="Cheque Number"
                fullWidth
                size="small"
                value={paymentDetails.chequeNumber}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, chequeNumber: e.target.value })}
              />
            </Stack>
          )}

          {paymentDetails.advpaymode === "finance" && (
            <TextField
              label="Finance Company"
              fullWidth
              size="small"
              value={paymentDetails.financeName}
              onChange={(e) => setPaymentDetails({ ...paymentDetails, financeName: e.target.value })}
              sx={{ mt: 2 }}
            />
          )}

          {paymentDetails.advpaymode === "card" && (
            <TextField
              label="Card Last 4 Digits"
              fullWidth
              size="small"
              value={paymentDetails.cardLastFour}
              onChange={(e) => setPaymentDetails({ ...paymentDetails, cardLastFour: e.target.value })}
              sx={{ mt: 2 }}
              inputProps={{ maxLength: 4 }}
            />
          )}
        </Paper>
      )}

      {/* Notes */}
      {bill?.notes && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Notes
          </Typography>
          <Typography variant="body2">{bill.notes}</Typography>
        </Paper>
      )}
    </Stack>
  );

  // Desktop view
  const DesktopBillView = () => (
    <Grid container spacing={3}>
      {/* Bill Information Section */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Bill Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Bill Number"
                value={bill.bill_number || ""}
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Bill Date"
                value={moment(bill.createdAt).format("DD/MM/YYYY")}
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Bill Type"
                value={bill.billType?.toUpperCase() || ""}
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Payment Type"
                value={bill.paymentType?.toUpperCase() || ""}
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Customer Information */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Customer Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Customer Name"
                value={bill.bill_to?.name || ""}
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Phone Number"
                value={bill.bill_to?.phone_number || ""}
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
              />
            </Grid>
            {bill.bill_to?.address && (
              <Grid item xs={12}>
                <TextField
                  label="Address"
                  value={bill.bill_to.address}
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            )}
          </Grid>
        </Paper>
      </Grid>

      {/* Amount Summary */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Amount Summary
          </Typography>
          <Stack spacing={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body1">Subtotal:</Typography>
              <Chip 
                label={`₹${bill.subtotal?.toFixed(2) || "0.00"}`} 
                size="medium" 
                variant="outlined"
              />
            </Box>
            
            {bill.gstTotal > 0 && (
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body1">GST:</Typography>
                <Chip 
                  label={`₹${bill.gstTotal?.toFixed(2) || "0.00"}`} 
                  size="medium" 
                  color="error"
                  variant="outlined"
                />
              </Box>
            )}
            
            <Divider />
            
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Grand Total:</Typography>
              <Chip 
                label={`₹${bill.grandTotal?.toFixed(2) || "0.00"}`} 
                color="primary" 
                size="large"
                sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}
              />
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body1">Advance Paid:</Typography>
              <Chip 
                label={`₹${bill.advance?.toFixed(2) || "0.00"}`} 
                color="success" 
                size="medium"
              />
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body1">Balance Due:</Typography>
              <Chip 
                label={`₹${balance?.toFixed(2) || "0.00"}`} 
                color={balance > 0 ? "warning" : "success"}
                size="medium"
              />
            </Box>
          </Stack>
        </Paper>
      </Grid>

      {/* Payment Update Section */}
      {bill?.balance > 0 && (
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Update Payment
            </Typography>
            <Grid container spacing={3}>
              {/* Advance Input */}
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom color="textSecondary">
                    Add Advance Amount
                  </Typography>
                  <TextField
                    type="number"
                    value={advance}
                    onChange={handleAdvanceChange}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      inputProps: { min: 0, max: bill.grandTotal, step: 0.01 }
                    }}
                    helperText={`Maximum: ₹${bill.grandTotal?.toFixed(2)}`}
                  />
                </Box>
              </Grid>

              {/* Balance Calculation */}
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, backgroundColor: '#f5f7fa', borderRadius: 1, height: '100%' }}>
                  <Typography variant="subtitle2" gutterBottom color="textSecondary">
                    Balance Calculation
                  </Typography>
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Current Balance:</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        ₹{balance?.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">New Payment:</Typography>
                      <Typography variant="body2" fontWeight={600} color="primary.main">
                        ₹{advance?.toFixed(2)}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body1" fontWeight={600}>New Balance:</Typography>
                      <Typography variant="body1" fontWeight={600} color={balance - advance <= 0 ? "success.main" : "warning.main"}>
                        ₹{(balance - advance).toFixed(2)}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Grid>

              {/* Payment Mode */}
              <Grid item xs={12}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom color="textSecondary">
                    Payment Mode
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={paymentDetails.advpaymode}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, advpaymode: e.target.value })}
                    sx={{ maxWidth: 300 }}
                  >
                    <MenuItem value="">Select Payment Mode</MenuItem>
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="upi">UPI</MenuItem>
                    <MenuItem value="online transfer">Online Transfer</MenuItem>
                    <MenuItem value="card">Card</MenuItem>
                    <MenuItem value="cheque">Cheque</MenuItem>
                    <MenuItem value="finance">Finance</MenuItem>
                  </TextField>
                </Box>
              </Grid>

              {/* Payment Mode Specific Fields */}
              {(paymentDetails.advpaymode === "upi" || paymentDetails.advpaymode === "online transfer") && (
                <Grid item xs={12} md={6}>
                  <TextField
                    label={paymentDetails.advpaymode === "upi" ? "UPI Transaction ID" : "UTR Number"}
                    fullWidth
                    size="small"
                    value={paymentDetails.advpaymode === "upi" ? paymentDetails.transactionNumber : paymentDetails.utrId}
                    onChange={(e) => paymentDetails.advpaymode === "upi" 
                      ? setPaymentDetails({ ...paymentDetails, transactionNumber: e.target.value })
                      : setPaymentDetails({ ...paymentDetails, utrId: e.target.value })
                    }
                  />
                </Grid>
              )}

              {paymentDetails.advpaymode === "cheque" && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Bank Name"
                      fullWidth
                      size="small"
                      value={paymentDetails.bankName}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, bankName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Cheque Number"
                      fullWidth
                      size="small"
                      value={paymentDetails.chequeNumber}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, chequeNumber: e.target.value })}
                    />
                  </Grid>
                </>
              )}

              {paymentDetails.advpaymode === "finance" && (
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Finance Company"
                    fullWidth
                    size="small"
                    value={paymentDetails.financeName}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, financeName: e.target.value })}
                  />
                </Grid>
              )}

              {paymentDetails.advpaymode === "card" && (
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Card Last 4 Digits"
                    fullWidth
                    size="small"
                    value={paymentDetails.cardLastFour}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, cardLastFour: e.target.value })}
                    inputProps={{ maxLength: 4 }}
                  />
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>
      )}

      {/* Notes Section */}
      {bill?.notes && (
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notes
            </Typography>
            <TextField
              value={bill.notes || ""}
              fullWidth
              multiline
              rows={3}
              size="small"
              InputProps={{ readOnly: true }}
            />
          </Paper>
        </Grid>
      )}
    </Grid>
  );

  return (
    <>
      <Modal open={open} onClose={handleCloseEdit}>
        <Box sx={getModalStyle(isMobile, isTablet)}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" fontWeight={600}>
              Edit Sale Bill
            </Typography>
            <IconButton onClick={handleCloseEdit} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {bill ? (
            <>
              {isMobile ? <MobileBillView /> : <DesktopBillView />}
              
              {/* Action Buttons */}
              <Box display="flex" justifyContent="flex-end" gap={2} mt={4} pt={3} borderTop="1px solid #e0e0e0">
                <Button
                  variant="outlined"
                  onClick={handleCloseEdit}
                  size={isMobile ? "small" : "medium"}
                >
                  Cancel
                </Button>
                {bill?.balance > 0 && (
                  <Button
                    variant="contained"
                    onClick={handleUpdateConfirmation}
                    disabled={advance <= 0}
                    size={isMobile ? "small" : "medium"}
                    sx={{
                      background: "linear-gradient(135deg, #182848, #324b84ff)",
                      color: "#fff",
                      '&:hover': {
                        background: "linear-gradient(135deg, #0d1c3c, #1e3a8a)",
                      },
                      '&:disabled': {
                        opacity: 0.6,
                      }
                    }}
                  >
                    Update Payment
                  </Button>
                )}
              </Box>
            </>
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <Typography color="textSecondary">Loading bill details...</Typography>
            </Box>
          )}
        </Box>
      </Modal>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Payment Update</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Are you sure you want to update the payment for this bill?
          </Typography>
          <Stack spacing={1} mt={2}>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="textSecondary">Amount:</Typography>
              <Typography variant="body2" fontWeight={600}>₹{advance?.toFixed(2)}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="textSecondary">Mode:</Typography>
              <Typography variant="body2" fontWeight={600}>{paymentDetails.advpaymode || "Cash"}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="textSecondary">New Balance:</Typography>
              <Typography variant="body2" fontWeight={600} color={balance - advance <= 0 ? "success.main" : "warning.main"}>
                ₹{(balance - advance).toFixed(2)}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={updateBill} 
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, #182848, #324b84ff)",
              color: "#fff",
            }}
          >
            Confirm Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbarMessage.includes("successfully") ? "success" : "error"}
          onClose={() => setSnackbarOpen(false)}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EditBill;