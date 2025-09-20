// step 2
import React from "react";
import {
  Grid,
  TextField,
  MenuItem,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  Typography,
  Divider,
  Box,
} from "@mui/material";

const PaymentDetails = ({
  paymentType,
  setPaymentType,
  paymentDetails,
  setPaymentDetails,
  totals,
  notes,
  setNotes,
}) => {
  return (
    <>
     <Box mt={3}>
            <Typography variant="h6">Payment Type</Typography>
            <Divider />
            <FormControl>
              <RadioGroup
                row
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
              >
                <FormControlLabel value="full" control={<Radio />} label="Full" />
                <FormControlLabel
                  value="advance"
                  control={<Radio />}
                  label="Advance"
                />
              </RadioGroup>
            </FormControl>
          </Box>
    
          {/* Payment Details Form */}
          <Box mt={2}>
            {paymentType === "advance" ? (
              <Grid container spacing={2}>
                {/* Row 1 - Advance */}
                <Grid item xs={12}>
                  <Grid container spacing={2} alignItems="flex-start">
                    <Grid item xs={12} sm={3}>
                      <TextField
                        label="Advance Paid"
                        type="number"
                        fullWidth
                        value={paymentDetails.advance}
                        onChange={(e) => {
                          const adv = e.target.value;
                          const balance = Math.max(totals.grandTotal - adv, 0);
                          setPaymentDetails({
                            ...paymentDetails,
                            advance: adv,
                            balance,
                          });
                        }}
                      />
                    </Grid>
    
                    <Grid item xs={12} sm={3}>
                      <TextField
                        select
                        sx={{ width: "200px" }}
                        label="Advance Pay Mode"
                        value={paymentDetails.advpaymode}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            advpaymode: e.target.value,
                          })
                        }
                      >
                        <MenuItem value=""></MenuItem>
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
                          value={paymentDetails.transactionNumber || ""}
                          onChange={(e) =>
                            setPaymentDetails({
                              ...paymentDetails,
                              transactionNumber: e.target.value,
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
                          value={paymentDetails.financeName || ""}
                          onChange={(e) =>
                            setPaymentDetails({
                              ...paymentDetails,
                              financeName: e.target.value,
                            })
                          }
                        />
                      </Grid>
                    )}
                    {paymentDetails.advpaymode === "card" && (
                      <>
                      {/* <Grid item xs={12} sm={3}>
                        <TextField
                          label="Last 4 digit on Card "
                          fullWidth
                          value={paymentDetails.cardLastFour || ""}
                          onChange={(e) =>
                            setPaymentDetails({
                              ...paymentDetails,
                              cardLastFour: e.target.value,
                            })
                          }
                        />
                        </Grid> */}
                        <Grid item xs={12} sm={3}>
                        <TextField
                          label="Card Type"
                          select
                          sx={{ width: "200px" }}
                          value={paymentDetails.cardType || ""}
                          onChange={(e) =>
                            setPaymentDetails({
                              ...paymentDetails,
                              cardType: e.target.value,
                            })
                          }
                        >
                          <MenuItem value="Debit">Debit</MenuItem>
                          <MenuItem value="Credit">Credit</MenuItem>
                        </TextField>
                      </Grid>
                      </>
                    )}
                    {paymentDetails.advpaymode === "cheque" && (
                      <>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            label="Bank Name"
                            fullWidth
                            value={paymentDetails.bankName || ""}
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
                            value={paymentDetails.chequeNumber || ""}
                            onChange={(e) =>
                              setPaymentDetails({
                                ...paymentDetails,
                                chequeNumber: e.target.value,
                              })
                            }
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                     <TextField
                      label="Cheque Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={paymentDetails.chequeDate}
                      onChange={(e) =>
                        setPaymentDetails({
                          ...paymentDetails,
                          chequeDate: e.target.value,
                        })
                      }
                    />
                    </Grid>
                      </>
                    )}
                  </Grid>
                </Grid>
    
                {/* Row 2 - Balance */}
                <Grid item xs={12}>
                  <Grid container spacing={2} alignItems="flex-start">
                    <Grid item xs={12} sm={3}>
                      <TextField
                        label="Balance"
                        type="number"
                        fullWidth
                        value={paymentDetails.balance}
                        InputProps={{
                          readOnly: true,
                        }}
                      />
                    </Grid>
    
                    <Grid item xs={12} sm={3}>
                      <TextField
                        select
                        sx={{ width: "200px" }}
                        label="Balance Pay Mode"
                        value={paymentDetails.balpaymode}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            balpaymode: e.target.value,
                          })
                        }
                      >
                        <MenuItem value=""></MenuItem>
                        <MenuItem value="cash">Cash</MenuItem>
                        <MenuItem value="upi">UPI</MenuItem>
                        <MenuItem value="card">Card</MenuItem>
                        <MenuItem value="cheque">Cheque</MenuItem>
                        <MenuItem value="finance">Finance</MenuItem>
                      </TextField>
                    </Grid>
    
                    {paymentDetails.balpaymode === "upi" && (
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label="UPI Transaction No."
                          fullWidth
                          value={paymentDetails.transactionNumber2 || ""}
                          onChange={(e) =>
                            setPaymentDetails({
                              ...paymentDetails,
                              transactionNumber2: e.target.value,
                            })
                          }
                        />
                      </Grid>
                    )}
                    {paymentDetails.balpaymode === "card" && (
                      <>
                      {/* <Grid item xs={12} sm={3}>
                        <TextField
                          label="Last 4 digit on Card "
                          fullWidth
                          value={paymentDetails.cardLastFour2 || ""}
                          onChange={(e) =>
                            setPaymentDetails({
                              ...paymentDetails,
                              cardLastFour2: e.target.value,
                            })
                          }
                        />
                        </Grid> */}
                         <Grid item xs={12} sm={3}>
                        <TextField
                          label="Card Type"
                          select
                          sx={{ width: "200px" }}
                          value={paymentDetails.cardType || ""}
                          onChange={(e) =>
                            setPaymentDetails({
                              ...paymentDetails,
                              cardType: e.target.value,
                            })
                          }
                        >
                          <MenuItem value="Debit">Debit</MenuItem>
                          <MenuItem value="Credit">Credit</MenuItem>
                        </TextField>
                      </Grid>
                      </>
                    )}
                    {paymentDetails.balpaymode === "cheque" && (
                      <>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            label="Bank Name"
                            fullWidth
                            value={paymentDetails.bankName2 || ""}
                            onChange={(e) =>
                              setPaymentDetails({
                                ...paymentDetails,
                                bankName2: e.target.value,
                              })
                            }
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            label="Cheque Number"
                            fullWidth
                            value={paymentDetails.chequeNumber2 || ""}
                            onChange={(e) =>
                              setPaymentDetails({
                                ...paymentDetails,
                                chequeNumber2: e.target.value,
                              })
                            }
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                     <TextField
                      label="Cheque Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={paymentDetails.chequeDate}
                      onChange={(e) =>
                        setPaymentDetails({
                          ...paymentDetails,
                          chequeDate: e.target.value,
                        })
                      }
                    />
                    </Grid>
                      </>
                    )}
                    {paymentDetails.balpaymode === "finance" && (
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label="Finance Name"
                          fullWidth
                          value={paymentDetails.financeName || ""}
                          onChange={(e) =>
                            setPaymentDetails({
                              ...paymentDetails,
                              financeName: e.target.value,
                            })
                          }
                        />
                      </Grid>
                    )}
                    <TextField
                      label="End Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={paymentDetails.dueDate}
                      onChange={(e) =>
                        setPaymentDetails({
                          ...paymentDetails,
                          dueDate: e.target.value,
                        })
                      }
                    />
                  </Grid>
                </Grid>
              </Grid>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Full Paid"
                    type="number"
                    fullWidth
                    value={totals.grandTotal}
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    sx={{ width: "200px" }}
                    select
                    value={paymentDetails.fullMode}
                    onChange={(e) =>
                      setPaymentDetails({
                        ...paymentDetails,
                        fullMode: e.target.value,
                        fullPaid: totals.grandTotal,
                      })
                    }
                    label="Pay Mode"
                  >
                    <MenuItem value=""></MenuItem>
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
                      value={paymentDetails.transactionNumber || ""}
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
                  <Grid item xs={12} sm={3}>
                    <TextField
                      label="Finance Name"
                      fullWidth
                      value={paymentDetails.financeName || ""}
                      onChange={(e) =>
                        setPaymentDetails({
                          ...paymentDetails,
                          financeName: e.target.value,
                        })
                      }
                    />
                  </Grid>
                )}
                {paymentDetails.fullMode === "card" && (
                  <>
                  {/* <Grid item xs={12} sm={3}>
                    <TextField
                      label="Last 4 digit on Card"
                      fullWidth
                      value={paymentDetails.cardLastFour || ""}
                      onChange={(e) =>
                        setPaymentDetails({
                          ...paymentDetails,
                          cardLastFour: e.target.value,
                        })
                      }
                    />
                    </Grid> */}
                    <Grid item xs={12} sm={3}>
                    <TextField
                          label="Card Type"
                          select
                           sx={{ width: "200px" }}
                          value={paymentDetails.cardType || ""}
                          onChange={(e) =>
                            setPaymentDetails({
                              ...paymentDetails,
                              cardType: e.target.value,
                            })
                          }
                        >
                          <MenuItem value="Debit">Debit</MenuItem>
                          <MenuItem value="Credit">Credit</MenuItem>
                        </TextField>
                  </Grid>
                  </>
                )}
    
                {paymentDetails.fullMode === "cheque" && (
                  <>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        label="Bank Name"
                        fullWidth
                        value={paymentDetails.bankName || ""}
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
                        value={paymentDetails.chequeNumber || ""}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            chequeNumber: e.target.value,
                          })
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                     <TextField
                      label="Cheque Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={paymentDetails.chequeDate}
                      onChange={(e) =>
                        setPaymentDetails({
                          ...paymentDetails,
                          chequeDate: e.target.value,
                        })
                      }
                    />
                    </Grid>
                  </>
                )}
              </Grid>
            )}
            <Box mt={2}>
              <Grid container spacing={2}>
                <TextField
                  label="Notes"
                  name="notes"
                  sx={{ width: "440px" }}
                  multiline
                  minRows={4}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Grid>
            </Box>
          </Box>
    </>
  );
};

export default PaymentDetails;