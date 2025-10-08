import { Box, Divider, IconButton, Modal, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import CloseIcon from "@mui/icons-material/Close";
import { getQuotationById } from '../../services/QuotationService';
import moment from 'moment';

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: 2,
  p: 3,
  minWidth: 600,
  maxHeight: "90vh",
};

const ViewQuotation = ({ open,data , handleCloseView }) => {
  const [quote, setQuote] = useState();
  
  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await getQuotationById(data);
        console.log(res)
           setQuote(res);
         } catch (err) {
           console.error("Error loading bill by ID", err);
         }
       };
   
       if (data) {
         fetchQuote();
       } else {
         console.log("No valid ID found in data prop");
       }
     }, [data]);

  return (
    <>
     <Modal open={open} onClose={handleCloseView}>
            <Box sx={style}>
              <IconButton
                aria-label="close"
                onClick={handleCloseView}
                sx={{
                  position: "absolute",
                  right: 8,
                  top: 8,
                  color: (theme) => theme.palette.grey[500],
                }}
              >
                <CloseIcon />
              </IconButton>
              {/* Quotation Info */}
        <Box display="flex" justifyContent="space-between" mt={2}>
          <Typography variant="body1">
            <strong>Quotation No:</strong> {quote?.quotationNo}
          </Typography>
          {/* <Typography variant="body1">
            <strong>Status:</strong> {quote?.status}
          </Typography> */}
        </Box>

        <Box display="flex" justifyContent="space-between" mb={2}>
          <Typography variant="body1">
            <strong>Date:</strong> {moment(quote?.date).format("DD/MM/YYYY")}
          </Typography>
          <Typography variant="body1">
            <strong>Valid Up To:</strong>{" "}
            {moment(quote?.validUpTo).format("DD/MM/YYYY")}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Customer Info */}
        <Typography variant="h6" fontSize={16} mb={1}>
          <strong>Customer Details :</strong>
        </Typography>
        <Box ml={1} mb={2}>
          <Typography><strong>Name:</strong> {quote?.customer?.name}</Typography>
          <Typography><strong>Email:</strong> {quote?.customer?.email}</Typography>
          <Typography><strong>Phone:</strong> {quote?.customer?.phone}</Typography>
          <Typography><strong>Address:</strong> {quote?.customer?.address}</Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Products Table */}
        <Typography variant="h6" fontSize={16} mb={1}>
          <strong>Product Details :</strong>
        </Typography>
        <Paper variant="outlined" sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
                <TableCell><strong>Product Name</strong></TableCell>
                <TableCell><strong>Qty</strong></TableCell>
                <TableCell><strong>Unit Price</strong></TableCell>
                <TableCell><strong>Tax %</strong></TableCell>
                <TableCell><strong>Total</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {quote?.products?.map((p, i) => (
                <TableRow key={i}>
                  <TableCell>{p.productName}</TableCell>
                  <TableCell>{p.quantity}</TableCell>
                  <TableCell>{p.unitPrice}</TableCell>
                  <TableCell>{p.tax}</TableCell>
                  <TableCell>{p.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        {/* Totals */}
        <Box display="flex" justifyContent="flex-end" flexDirection="column" alignItems="flex-end" mb={2}>
          <Typography><strong>Subtotal:</strong> ₹{quote?.subtotal.toFixed(2)}</Typography>
          <Typography><strong>Tax Total:</strong> ₹{quote?.taxTotal.toFixed(2)}</Typography>
          <Typography><strong>Grand Total:</strong> ₹{quote?.grandTotal.toFixed(2)}</Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Terms */}
        <Typography variant="body1">
          <strong>Terms & Conditions:</strong>
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
          {quote?.terms || "N/A"}
        </Typography>
              </Box>
              </Modal>
    </>
  )
}

export default ViewQuotation