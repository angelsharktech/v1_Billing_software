import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Paper,
  TableHead,
  TableContainer,
  Grid
} from '@mui/material';
import { Print as PrintIcon, Close as CloseIcon } from '@mui/icons-material';

const PrintInvoiceDialog = ({ open, onClose, bill = {} }) => {
  const handlePrint = () => {
    window.print();
  };

  // Provide default values to prevent undefined errors
  const safeBill = bill || {};
  const isGST = safeBill.billType?.toLowerCase() === "gst";
  const customer = safeBill.biller || safeBill.bill_to || {};
  const orgName = typeof safeBill.org === "string" ? safeBill.org : safeBill.org?.name || "";
  const payment = safeBill.paymentDetails || safeBill || {};
  const totals = safeBill.totals || {
    subtotal: safeBill.subtotal || 0,
    gstTotal: safeBill.gstTotal || 0,
    cgst: safeBill.cgst || 0,
    sgst: safeBill.sgst || 0,
    igst: safeBill.igst || 0,
    grandTotal: safeBill.grandTotal || 0,
  };
  const products = safeBill.products || [];

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        id: 'printable-content',
        sx: { p: 0 }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Invoice Preview</Typography>
          <Box>
            <Button 
              startIcon={<PrintIcon />} 
              variant="contained" 
              onClick={handlePrint}
              sx={{ mr: 1 }}
            >
              Print
            </Button>
            <Button 
              startIcon={<CloseIcon />} 
              onClick={onClose}
            >
              Close
            </Button>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ p: 4, minHeight: "100vh" }}>
          <Paper
            className="print-only"
            elevation={3}
            sx={{ maxWidth: 800, mx: "auto", p: 4 }}
          >
            {/* Header */}
            <Box>
              <Typography
                fontWeight="bold"
                variant="h5"
                sx={{
                  background: "linear-gradient(to right, #0072FF, #00c6ff)",
                  color: "#fff",
                  px: 1,
                  py: 1,
                  borderRadius: "4px",
                  width: "100%",
                  textAlign: "left",
                  mb: 1,
                  mr: 2,
                }}
              >
                {isGST ? "INVOICE" : "Quotation"}
              </Typography>

              {/* Org Name */}
              <Box textAlign="right" sx={{ mb: 2 }}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ color: "#00c6ff" }}
                >
                  {orgName}
                </Typography>
              </Box>
              <Box textAlign="right" sx={{ mb: 2 }}>
                <Typography>
                  <strong>Date: {new Date().toLocaleDateString()}</strong>
                </Typography>
              </Box>
            </Box>

            {/* Invoice Info */}
            <Box mt={3}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="h6" fontWeight="bold">
                    Invoice to:
                  </Typography>
                  <Typography>{customer?.first_name || "N/A"}</Typography>
                  <Typography>{customer?.address || "N/A"}</Typography>
                  <Typography>{customer?.phone_number || "N/A"}</Typography>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Products Table */}
            <Typography variant="h6" fontWeight="bold">
              Products:
            </Typography>
            <TableContainer sx={{ mt: 2, border: "1px solid #ccc" }}>
              <Table size="small" aria-label="invoice table">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
                    {[
                      "SL.",
                      "Item Description",
                      "MRP",
                      "Discount",
                      "Price",
                      "Qty",
                      "Total",
                    ].map((label) => (
                      <TableCell
                        key={label}
                        sx={{ border: "1px solid #ccc", fontWeight: "bold" }}
                      >
                        {label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ border: "1px solid #ccc" }}>
                        {index + 1}
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #ccc" }}>
                        {(item.name || item.productName || "N/A") + (item.hsnCode ? ` - ${item.hsnCode}` : "")}
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #ccc" }}>
                        {item.unitPrice || 0}
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #ccc" }}>
                        {(item.discount || item.discountPercentage || 0)}%
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #ccc" }}>
                        ₹{(item.price || 0).toFixed(2)}
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #ccc" }}>
                        {item.qty || 0}
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #ccc" }}>
                        ₹{((item.price || 0) * (item.qty || 0)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Totals */}
            <Grid item xs={6} textAlign="right" mt={2}>
              <Typography>
                <b>Sub Total: ₹{totals.subtotal.toFixed(2)}</b>
              </Typography>

              {isGST && (
                <>
                  <Typography>
                    <b>CGST: {totals.cgst}%</b>
                  </Typography>
                  <Typography>
                    <b>SGST: {totals.sgst}%</b>
                  </Typography>
                </>
              )}

              <Typography variant="h6" fontWeight="bold" mt={1}>
                Total: ₹{totals.grandTotal.toFixed(2)}
              </Typography>
            </Grid>

            {/* Payment Info */}
            <Box mt={3}>
              <Divider />
              <Grid container spacing={2} mt={1}>
                <Grid item xs={6}>
                  <Typography variant="h6" fontWeight="bold">
                    Payment Info:
                  </Typography>
                  <Typography variant="body2">
                    Payment Type : {safeBill.paymentType || "N/A"}
                  </Typography>

                  {safeBill.paymentType === "advance" && (
                    <>
                      <Typography variant="body2">
                        Advance Paid : {payment.advance || 0}
                      </Typography>
                      <Typography variant="body2">
                        Advance Pay Mode : {payment.advpaymode || "N/A"}
                      </Typography>
                      {payment.advpaymode === "upi" && (
                        <Typography variant="body2">
                          Transaction Number : {payment.transactionNumber || "N/A"}
                        </Typography>
                      )}
                      {payment.advpaymode === "card" && (
                        <Typography variant="body2">
                          Card Number : {payment.cardLastFour || "N/A"}
                        </Typography>
                      )}
                      {payment.advpaymode === "cheque" && (
                        <Typography variant="body2">
                          Cheque Number : {payment.chequeNumber || "N/A"}
                        </Typography>
                      )}
                      <Typography>Balance : {payment.balance || 0}</Typography>
                    </>
                  )}

                  {safeBill.paymentType === "full" && (
                    <>
                      <Typography variant="body2">
                        Payment Mode : {payment.fullMode || "N/A"}
                      </Typography>
                      {payment.fullMode === "upi" && (
                        <Typography variant="body2">
                          Transaction Number : {payment.transactionNumber || "N/A"}
                        </Typography>
                      )}
                      {payment.fullMode === "card" && (
                        <Typography variant="body2">
                          Card Number : {payment.cardLastFour || "N/A"}
                        </Typography>
                      )}
                      {payment.fullMode === "cheque" && (
                        <Typography variant="body2">
                          Cheque Number : {payment.chequeNumber || "N/A"}
                        </Typography>
                      )}
                    </>
                  )}
                </Grid>
              </Grid>
            </Box>

            {/* Footer */}
            <Box mt={3}>
              <Typography fontWeight="bold" gutterBottom>
                Thank you for your business
              </Typography>
            </Box>

            {/* Signature */}
            <Box display="flex" justifyContent="center" mt={4}>
              <Grid item ml={4} marginRight={"40px"}>
                <b style={{ fontSize: "12px" }}>
                  This is system generated receipt, no signature required.
                </b>
              </Grid>
            </Box>
          </Paper>
        </Box>
      </DialogContent>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-content, #printable-content * {
              visibility: visible;
            }
            #printable-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
            }
            .MuiDialogActions-root {
              display: none !important;
            }
            .MuiDialogTitle-root {
              display: none !important;
            }
            .print-only {
              box-shadow: none !important;
            }
          }
        `}
      </style>
    </Dialog>
  );
};

PrintInvoiceDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  bill: PropTypes.shape({
    billType: PropTypes.string,
    biller: PropTypes.object,
    bill_to: PropTypes.object,
    org: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    paymentDetails: PropTypes.object,
    totals: PropTypes.object,
    subtotal: PropTypes.number,
    gstTotal: PropTypes.number,
    cgst: PropTypes.number,
    sgst: PropTypes.number,
    igst: PropTypes.number,
    grandTotal: PropTypes.number,
    products: PropTypes.array,
    paymentType: PropTypes.string,
  }),
};

PrintInvoiceDialog.defaultProps = {
  bill: {},
};

export default PrintInvoiceDialog;