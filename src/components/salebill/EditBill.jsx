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
import { addPayment, updatePayment } from "../../services/PaymentModeService";
import {
  getSaleBillById,
  updateSaleBill,
} from "../../services/SaleBillService";

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
  const [advance, setAdvance] = useState(0);
  const [balance, setBalance] = useState(0);
  const [fullPay, setFullPay] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [paymentDetails, setPaymentDetails] = useState({
    advpaymode: "",
    transactionNumber: "",
    cardLastFour: "",
    bankName: "",
    chequeNumber: "",
    fullMode: "", // for full payment if needed
    utrId: "", // for online transfer 16.08.25
    financeName: "", //16.08.25
    balancePayMode: "",
  });

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const res = await getSaleBillById(data?._id);
        const billData = res.data;
        if (billData.balancePayMode?.toLowerCase().includes("finance")) {
          // Extract finance name
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
      }
    };

    if (data?._id) {
      fetchBill();
    }
  }, [data]);

  useEffect(() => {
    const fullPayment = balance === 0 ? bill?.grandTotal : 0;
    setFullPay(fullPayment);
  }, [advance, balance]);

  const handleAdvanceChange = async (e) => {
    if (bill?.balancePayMode?.toLowerCase().includes("finance")) {
      return;
    } // 16.08.25

    const newAdvance = parseFloat(e.target.value || "0");

    // Calculate total advance (existing advance + new advance)
    const totalAdvance = (bill?.advance || 0) + newAdvance;

    // Calculate new balance
    const newBalance =
      (bill?.grandTotal || 0) - totalAdvance - (bill?.fullPaid || 0);

    setAdvance(newAdvance); // Store just the new advance amount

    if (newBalance <= 0) {
      setBalance(0);
      setFullPay(bill?.grandTotal || 0);
    } else {
      setBalance(newBalance);
      setFullPay(0);
    }
  };

  const updateBill = async () => {
    try {
      const billTotal = bill?.grandTotal || 0;
      let updatedData = {};
      let paymentType = "";
      let financeName = "";

      // Special case: Finance
      if (bill?.balancePayMode?.toLowerCase().includes("finance")) {
        const parts = bill.balancePayMode.split("-");
        financeName = parts.length > 1 ? parts[1] : "";

        updatedData = {
          advance: 0,
          balance: 0,
          paymentType: "full",
          fullPaid: billTotal,
        };
        paymentType = "full";
      } else {
        // Normal case
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
        setSnackbarMessage("Sale bill Updated !");
        setSnackbarOpen(true);

        const paymentType = balance > 0 ? "advance" : "full";

        // Build base payment payload
        let paymentPayload = {
          paymentType:
            paymentType === "advance"
              ? paymentDetails.advpaymode
              : paymentDetails.fullMode,
          // amount: paymentType === "advance" ? advance : bill?.grandTotal || 0,
          amount: advance,
          client_id: bill?.bill_to?._id, // customer_id
          salebill: bill?._id, // sale_bill_id
          organization: bill?.org?._id || bill?.organization?._id, // fallback if org is saved in different path
          billType: "sale",
        };

        // Add payment mode-specific fields
        const selectedMode = paymentPayload.paymentType?.toLowerCase();

        if (selectedMode === "upi") {
          paymentPayload.utrId = paymentDetails.transactionNumber;
        } else if (selectedMode === "cheque") {
          paymentPayload.bankName = paymentDetails.bankName;
          paymentPayload.chequeNumber = paymentDetails.chequeNumber;
        }
        if (
          paymentDetails.advpaymode.toLowerCase() === "online transfer" ||
          paymentDetails.balancePayMode.toLowerCase() === "online transfer" ||
          paymentDetails.fullMode.toLowerCase() === "online transfer"
        ) {
          paymentPayload = {
            ...paymentPayload,
            utrId: paymentDetails.utrId,
          };
        } else if (
          paymentDetails.advpaymode === "finance" ||
          paymentDetails.fullMode === "finance"
        ) {
          paymentPayload.financeName = paymentDetails.financeName;
        } else {
          paymentPayload.description = `${
            paymentType === "advance" ? "Advance" : "Full"
          } payment for Bill`;
        }

        // Optional: Send payment data to server
        try {
          const paymentResult = await addPayment(paymentPayload);
          if (paymentResult?.success) {
          }
        } catch (error) {
          console.error("Failed to add payment:", error);
          setSnackbarMessage("Customer " + error);
          setSnackbarOpen(true);
        }
        refresh();
        handleCloseEdit();
      }
    } catch (error) {
      console.log(error);
      setSnackbarMessage(error);
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
            Purchase Bill Details
          </Typography>

          {bill && (
            <Grid container spacing={2} mt={1}>
              <Grid item xs={6}>
                <TextField
                  label="Bill Number"
                  value={bill.bill_number || ""}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Bill Date"
                  value={moment(bill.createdAt).format("YYYY-MM-DD")}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Customer Name"
                  value={bill.bill_to?.first_name || ""}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Phone Number"
                  value={bill.bill_to?.phone_number || ""}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Payment Type"
                  value={bill.paymentType}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Bill Type"
                  value={bill.billType}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Sub Total"
                  value={bill.subtotal?.toFixed(2)}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="GST Total"
                  value={bill.gstTotal?.toFixed(2)}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Grand Total"
                  value={bill.grandTotal?.toFixed(2)}
                  fullWidth
                  disabled
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="Advance"
                  type="number"
                  value={bill?.advance}
                  fullWidth
                  disabled
                />
              </Grid>
              {bill?.balance > 0 && (
                <>
                  <Grid item xs={6}>
                    <TextField
                      label="Remaining amount"
                      type="number"
                      // value={advance}
                      onChange={handleAdvanceChange}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Balance"
                      value={balance.toFixed(2)}
                      fullWidth
                      disabled
                    />
                  </Grid>
                </>
              )}
              {/* Advance Pay Mode Fields */}
              {advance < bill?.grandTotal && (
                <>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      select
                      label="Advance Pay Mode"
                      sx={{ width: "225px" }}
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
                      <MenuItem value="finance">Finance</MenuItem>
                    </TextField>
                  </Grid>

                  {paymentDetails.advpaymode === "upi" && (
                    <Grid item xs={12} sm={3}>
                      <TextField
                        label="UPI Transaction No."
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
                  {paymentDetails.advpaymode === "card" && (
                    <Grid item xs={12} sm={3}>
                      <TextField
                        label="Card No."
                        fullWidth
                        value={paymentDetails.cardLastFour}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            cardLastFour: e.target.value,
                          })
                        }
                      />
                    </Grid>
                  )}
                  {paymentDetails.advpaymode === "finance" && (
                    <Grid item xs={12} sm={3}>
                      <TextField
                        label="Finance Name"
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
                  {paymentDetails.advpaymode === "cheque" && (
                    <>
                      <Grid item xs={12} sm={3}>
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
                      <Grid item xs={12} sm={3}>
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

              <Grid item xs={6}>
                <TextField
                  label="Full Paid"
                  value={bill.fullPaid ? bill.fullPaid : fullPay?.toFixed(2)}
                  fullWidth
                  disabled
                />
              </Grid>

              {/* Full Pay Mode (Optional) */}
              {advance === bill?.grandTotal && (
                <>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      select
                      label="Full Payment Mode"
                      value={paymentDetails.fullMode}
                      onChange={(e) =>
                        setPaymentDetails({
                          ...paymentDetails,
                          fullMode: e.target.value,
                        })
                      }
                      sx={{ width: "225px" }}
                    >
                      <MenuItem value="">Select Mode</MenuItem>
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="upi">UPI</MenuItem>
                      <MenuItem value="card">Card</MenuItem>
                      <MenuItem value="cheque">Cheque</MenuItem>
                      <MenuItem value="finance">Finance</MenuItem>
                    </TextField>
                  </Grid>
                  {paymentDetails.fullMode === "upi" && (
                    <Grid item xs={12} sm={3}>
                      <TextField
                        label="UPI Transaction No."
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
                  {paymentDetails.fullMode === "card" && (
                    <Grid item xs={12} sm={3}>
                      <TextField
                        label="Card No."
                        fullWidth
                        value={paymentDetails.cardLastFour}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            cardLastFour: e.target.value,
                          })
                        }
                      />
                    </Grid>
                  )}
                  {paymentDetails.fullMode === "finance" && (
                    <Grid item xs={12} sm={3}>
                      <TextField
                        label="Finance Nane"
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
                      <Grid item xs={12} sm={3}>
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
                      <Grid item xs={12} sm={3}>
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

              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  value={bill.notes || ""}
                  fullWidth
                  multiline
                  rows={3}
                  disabled
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  sx={{ backgroundColor: "#2F4F4F", color: "#fff" }}
                  onClick={updateBill}
                >
                  Update
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
          severity={
            snackbarMessage === "Sale bill Updated !" ? "success" : "error"
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

export default EditBill;
