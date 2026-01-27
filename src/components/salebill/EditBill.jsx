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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import moment from "moment";
import { addPayment } from "../../services/PaymentModeService";
import { getSaleBillById, updateSaleBill } from "../../services/SaleBillService";

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

const EditBill = ({ open, data, handleCloseEdit, refresh }) => {
  const [bill, setBill] = useState(null);
  const [newAdvance, setNewAdvance] = useState(0);
  const [balance, setBalance] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [paymentDetails, setPaymentDetails] = useState({
    advpaymode: "",
    transactionNumber: "",
    cardLastFour: "",
    bankName: "",
    chequeNumber: "",
    fullMode: "",
    utrId: "",
    financeName: "",
  });

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const res = await getSaleBillById(data?._id);
        const billData = res.data;
        
        if (billData) {
          // Handle finance payment mode
          if (billData.balancePayMode?.toLowerCase().includes("finance")) {
            const parts = billData.balancePayMode.split("-");
            const financeName = parts.length > 1 ? parts[1] : "";
            
            setPaymentDetails({
              advpaymode: parts[0] || "",
              financeName: financeName,
            });
            
            // For finance, set as fully paid
            setBill({
              ...billData,
              paymentType: "full",
              fullPaid: Number(billData.grandTotal || 0).toFixed(2),
            });
            setBalance(0);
            setNewAdvance(0);
          } else {
            // Regular payment
            setBill(billData);
            const existingAdvance = Number(billData.advance || 0);
            const grandTotal = Number(billData.grandTotal || 0);
            const fullPaid = Number(billData.fullPaid || 0);
            
            // Calculate remaining balance
            const calculatedBalance = Math.max(0, grandTotal - existingAdvance - fullPaid);
            setBalance(calculatedBalance.toFixed(2));
            setNewAdvance(0); // Reset new advance input
          }
        }
      } catch (err) {
        console.error("Error loading bill by ID", err);
        setSnackbarMessage("Failed to load bill details");
        setSnackbarOpen(true);
      }
    };

    if (data?._id && open) {
      fetchBill();
    }
  }, [data, open]);

  const handleAdvanceChange = (e) => {
    if (bill?.balancePayMode?.toLowerCase().includes("finance")) {
      return;
    }

    const value = Number(parseFloat(e.target.value || "0").toFixed(2));
    const existingAdvance = Number(bill?.advance || 0);
    const grandTotal = Number(bill?.grandTotal || 0);
    const fullPaid = Number(bill?.fullPaid || 0);
    
    // Calculate new total advance
    const totalAdvance = existingAdvance + value;
    
    // Calculate new balance
    const newBalance = Math.max(0, grandTotal - totalAdvance - fullPaid);
    
    setNewAdvance(value);
    setBalance(newBalance.toFixed(2));
  };

  const updateBill = async () => {
    try {
      if (!bill) {
        setSnackbarMessage("No bill data available");
        setSnackbarOpen(true);
        return;
      }

      const grandTotal = Number(bill.grandTotal || 0);
      const existingAdvance = Number(bill.advance || 0);
      const existingFullPaid = Number(bill.fullPaid || 0);
      const additionalAdvance = Number(newAdvance || 0);
      
      // Calculate new totals
      const totalAdvance = existingAdvance + additionalAdvance;
      const newBalance = Math.max(0, grandTotal - totalAdvance - existingFullPaid);
      const isFullPayment = newBalance === 0;
      
      // Determine payment mode
      let paymentMode = "";
      if (isFullPayment) {
        paymentMode = paymentDetails.fullMode || "cash";
      } else {
        paymentMode = paymentDetails.advpaymode || "cash";
      }
      
      // Prepare updated bill data
      const updatedBillData = {
        advance: isFullPayment ? 0 : totalAdvance,
        balance: newBalance,
        paymentType: isFullPayment ? "full" : "advance",
        fullPaid: isFullPayment ? grandTotal : existingFullPaid,
        balancePayMode: isFullPayment ? "" : paymentMode,
      };

      // Update the bill
      const res = await updateSaleBill(bill._id, updatedBillData);
      
      if (res.success) {
        // Prepare payment data if there's additional advance
        if (additionalAdvance > 0) {
          let paymentPayload = {
            paymentType: paymentMode,
            amount: additionalAdvance,
            client_id: bill.bill_to?._id,
            salebill: bill._id,
            organization: bill.org?._id || bill.organization?._id,
            billType: "sale",
            narration: `Additional advance payment for bill ${bill.bill_number || ""}`,
          };

          // Add payment mode specific details
          const mode = paymentMode.toLowerCase();
          
          if (mode === "upi") {
            paymentPayload.utrId = paymentDetails.transactionNumber || "";
          } else if (mode === "card") {
            paymentPayload.cardLastFour = paymentDetails.cardLastFour || "";
          } else if (mode === "cheque") {
            paymentPayload.bankName = paymentDetails.bankName || "";
            paymentPayload.chequeNumber = paymentDetails.chequeNumber || "";
          } else if (mode === "online" || mode === "online transfer") {
            paymentPayload.utrId = paymentDetails.utrId || "";
          } else if (mode === "finance") {
            paymentPayload.financeName = paymentDetails.financeName || "";
          }

          try {
            await addPayment(paymentPayload);
          } catch (paymentError) {
            console.error("Failed to add payment record:", paymentError);
          }
        }

        setSnackbarMessage("Sale bill updated successfully!");
        setSnackbarOpen(true);
        refresh();
        handleCloseEdit();
      } else {
        setSnackbarMessage("Failed to update bill");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Error updating bill:", error);
      setSnackbarMessage("Error updating bill: " + (error.message || "Unknown error"));
      setSnackbarOpen(true);
    }
  };

  return (
    <>
      <Modal open={open} onClose={handleCloseEdit}>
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

          <Typography variant="h6" gutterBottom>
            Sale Bill Payment Update
          </Typography>

          {bill && (
            <Grid container spacing={2} mt={1}>
              {/* Bill Information */}
              <Grid item size={{ xs: 6 }}>
                <TextField
                  label="Bill Number"
                  value={bill.bill_number || ""}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item size={{ xs: 6 }}>
                <TextField
                  label="Bill Date"
                  value={moment(bill.createdAt).format("YYYY-MM-DD")}
                  fullWidth
                  disabled
                />
              </Grid>
              
              {/* Customer Information */}
              <Grid item size={{ xs: 6 }}>
                <TextField
                  label="Customer Name"
                  value={bill.bill_to?.name || ""}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item size={{ xs: 6 }}>
                <TextField
                  label="Phone Number"
                  value={bill.bill_to?.phone_number || ""}
                  fullWidth
                  disabled
                />
              </Grid>
              
              {/* Bill Details */}
              <Grid item size={{ xs: 6 }}>
                <TextField
                  label="Payment Type"
                  value={bill.paymentType || ""}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item size={{ xs: 6 }}>
                <TextField
                  label="Bill Type"
                  value={bill.billType || ""}
                  fullWidth
                  disabled
                />
              </Grid>
              
              {/* Amount Details */}
              <Grid item size={{ xs: 4 }}>
                <TextField
                  label="Sub Total"
                  value={`₹${Number(bill.subtotal || 0).toFixed(2)}`}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item size={{ xs: 4 }}>
                <TextField
                  label="GST Total"
                  value={`₹${Number(bill.gstTotal || 0).toFixed(2)}`}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item size={{ xs: 4 }}>
                <TextField
                  label="Grand Total"
                  value={`₹${Number(bill.grandTotal || 0).toFixed(2)}`}
                  fullWidth
                  disabled
                  sx={{
                    '& .MuiInputBase-input': {
                      fontWeight: 'bold',
                      color: '#1976d2'
                    }
                  }}
                />
              </Grid>
              
              {/* Advance and Balance */}
              <Grid item size={{ xs: 4 }}>
                <TextField
                  label="Existing Advance"
                  value={`₹${Number(bill.advance || 0).toFixed(2)}`}
                  fullWidth
                  disabled
                />
              </Grid>
              
              {balance > 0 && (
                <>
                  <Grid item size={{ xs: 4 }}>
                    <TextField
                      label="Additional Advance"
                      type="number"
                      value={newAdvance}
                      onChange={handleAdvanceChange}
                      fullWidth
                      InputProps={{
                        inputProps: { 
                          min: 0,
                          max: balance,
                          step: 0.01
                        }
                      }}
                      helperText={`Max: ₹${balance}`}
                    />
                  </Grid>
                  
                  <Grid item size={{ xs: 4 }}>
                    <TextField
                      label="Remaining Balance"
                      value={`₹${Number(balance || 0).toFixed(2)}`}
                      fullWidth
                      disabled
                      sx={{
                        '& .MuiInputBase-input': {
                          color: Number(balance) > 0 ? 'error.main' : 'success.main',
                          fontWeight: 'medium'
                        }
                      }}
                    />
                  </Grid>
                </>
              )}
              
              {/* Payment Mode Selection */}
              {balance > 0 && newAdvance > 0 && (
                <>
                  <Grid item size={{ xs: 12 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Payment Details for Additional Advance
                    </Typography>
                  </Grid>
                  
                  <Grid item size={{ xs: 12, sm: 4 }}>
                    <TextField
                      select
                      fullWidth
                      label="Payment Mode"
                      value={paymentDetails.advpaymode}
                      onChange={(e) =>
                        setPaymentDetails({
                          ...paymentDetails,
                          advpaymode: e.target.value,
                        })
                      }
                    >
                      <MenuItem value="">Select Mode</MenuItem>
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="upi">UPI</MenuItem>
                      <MenuItem value="card">Card</MenuItem>
                      <MenuItem value="cheque">Cheque</MenuItem>
                      <MenuItem value="online">Online Transfer</MenuItem>
                      <MenuItem value="finance">Finance</MenuItem>
                    </TextField>
                  </Grid>

                  {/* UPI Details */}
                  {paymentDetails.advpaymode === "upi" && (
                    <Grid item size={{ xs: 12, sm: 4 }}>
                      <TextField
                        label="UPI Transaction ID"
                        fullWidth
                        value={paymentDetails.transactionNumber}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            transactionNumber: e.target.value,
                          })
                        }
                      />
                    </Grid>
                  )}

                  {/* Card Details */}
                  {paymentDetails.advpaymode === "card" && (
                    <Grid item size={{ xs: 12, sm: 4 }}>
                      <TextField
                        label="Card Last 4 Digits"
                        fullWidth
                        value={paymentDetails.cardLastFour}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            cardLastFour: e.target.value,
                          })
                        }
                        inputProps={{ maxLength: 4 }}
                      />
                    </Grid>
                  )}

                  {/* Finance Details */}
                  {paymentDetails.advpaymode === "finance" && (
                    <Grid item size={{ xs: 12, sm: 4 }}>
                      <TextField
                        label="Finance Company Name"
                        fullWidth
                        value={paymentDetails.financeName}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            financeName: e.target.value,
                          })
                        }
                      />
                    </Grid>
                  )}

                  {/* Cheque Details */}
                  {paymentDetails.advpaymode === "cheque" && (
                    <>
                      <Grid item size={{ xs: 12, sm: 4 }}>
                        <TextField
                          label="Bank Name"
                          fullWidth
                          value={paymentDetails.bankName}
                          onChange={(e) =>
                            setPaymentDetails({
                              ...paymentDetails,
                              bankName: e.target.value,
                            })
                          }
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, sm: 4 }}>
                        <TextField
                          label="Cheque Number"
                          fullWidth
                          value={paymentDetails.chequeNumber}
                          onChange={(e) =>
                            setPaymentDetails({
                              ...paymentDetails,
                              chequeNumber: e.target.value,
                            })
                          }
                        />
                      </Grid>
                    </>
                  )}

                  {/* Online Transfer Details */}
                  {paymentDetails.advpaymode === "online" && (
                    <Grid item size={{ xs: 12, sm: 4 }}>
                      <TextField
                        label="UTR/Transaction ID"
                        fullWidth
                        value={paymentDetails.utrId}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            utrId: e.target.value,
                          })
                        }
                      />
                    </Grid>
                  )}
                </>
              )}
              
              {/* Full Payment Mode (when balance becomes 0) */}
              {balance === 0 && newAdvance > 0 && (
                <>
                  <Grid item size={{ xs: 12 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Full Payment Details
                    </Typography>
                  </Grid>
                  
                  <Grid item size={{ xs: 12, sm: 4 }}>
                    <TextField
                      select
                      fullWidth
                      label="Full Payment Mode"
                      value={paymentDetails.fullMode}
                      onChange={(e) =>
                        setPaymentDetails({
                          ...paymentDetails,
                          fullMode: e.target.value,
                        })
                      }
                    >
                      <MenuItem value="">Select Mode</MenuItem>
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="upi">UPI</MenuItem>
                      <MenuItem value="card">Card</MenuItem>
                      <MenuItem value="cheque">Cheque</MenuItem>
                      <MenuItem value="online">Online Transfer</MenuItem>
                      <MenuItem value="finance">Finance</MenuItem>
                    </TextField>
                  </Grid>

                  {/* Conditional fields for full payment mode */}
                  {paymentDetails.fullMode === "upi" && (
                    <Grid item size={{ xs: 12, sm: 4 }}>
                      <TextField
                        label="UPI Transaction ID"
                        fullWidth
                        value={paymentDetails.transactionNumber}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            transactionNumber: e.target.value,
                          })
                        }
                      />
                    </Grid>
                  )}

                  {paymentDetails.fullMode === "finance" && (
                    <Grid item size={{ xs: 12, sm: 4 }}>
                      <TextField
                        label="Finance Company Name"
                        fullWidth
                        value={paymentDetails.financeName}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            financeName: e.target.value,
                          })
                        }
                      />
                    </Grid>
                  )}

                  {paymentDetails.fullMode === "cheque" && (
                    <>
                      <Grid item size={{ xs: 12, sm: 4 }}>
                        <TextField
                          label="Bank Name"
                          fullWidth
                          value={paymentDetails.bankName}
                          onChange={(e) =>
                            setPaymentDetails({
                              ...paymentDetails,
                              bankName: e.target.value,
                            })
                          }
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, sm: 4 }}>
                        <TextField
                          label="Cheque Number"
                          fullWidth
                          value={paymentDetails.chequeNumber}
                          onChange={(e) =>
                            setPaymentDetails({
                              ...paymentDetails,
                              chequeNumber: e.target.value,
                            })
                          }
                        />
                      </Grid>
                    </>
                  )}
                </>
              )}

              {/* Full Paid Display */}
              <Grid item size={{ xs: 6 }}>
                <TextField
                  label="Total Paid"
                  value={`₹${Number(bill.fullPaid || 0).toFixed(2)}`}
                  fullWidth
                  disabled
                  sx={{
                    '& .MuiInputBase-input': {
                      fontWeight: 'bold',
                      color: 'success.main'
                    }
                  }}
                />
              </Grid>

              {/* Notes */}
              <Grid item size={{ xs: 12 }}>
                <TextField
                  label="Notes"
                  value={bill.notes || ""}
                  fullWidth
                  multiline
                  rows={2}
                  disabled
                />
              </Grid>
              
              {/* Action Button */}
              <Grid item size={{ xs: 12 }} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  sx={{ 
                    backgroundColor: "#2F4F4F", 
                    color: "#fff",
                    '&:hover': {
                      backgroundColor: "#1E3A3A",
                    }
                  }}
                  onClick={updateBill}
                  disabled={newAdvance <= 0 && balance > 0}
                >
                  Update Payment
                </Button>
              </Grid>
            </Grid>
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
          onClose={() => setSnackbarOpen(false)}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EditBill;