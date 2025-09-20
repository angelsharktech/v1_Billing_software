import React, { useEffect, useState } from "react";
import {
  Box,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

const GenerateBill = React.forwardRef(({ bill, billName }, ref) => {

  // ✅ Unified handling
  const isGST = bill.billType?.toLowerCase() === "gst";

  const cgst = bill?.products.reduce((acc, p) => {
    const val = parseFloat(p.cgst) || 0;  // ensure number
    return acc + val;
  }, 0);
  const sgst = bill?.products.reduce((acc, p) => {
    const val = parseFloat(p.sgst) || 0;  // ensure number
    return acc + val;
  }, 0);
  const igst = bill?.products.reduce((acc, p) => {
    const val = parseFloat(p.igst) || 0;  // ensure number
    return acc + val;
  }, 0);
  const customer = bill.biller || bill.bill_to;
  const orgName = typeof bill.org === "string" ? bill.org : bill.org?.name;
  const orgId = typeof bill.org === "string" ? bill.org : bill.org?._id;

  // const firmName = typeof bill.firm_id === "string" ? bill.firm_id : bill.firm_id?.name;
  const payment = bill.paymentDetails || bill;
  const totals = bill.totals || {
    subtotal: bill.subtotal,
    gstTotal: bill.gstTotal,
    cgst: bill.cgst,
    sgst: bill.sgst,
    igst: bill.igst,
    grandTotal: bill.grandTotal,
  };
 
  return (
    // <Box sx={{ p: 4, minHeight: "100vh" }}>
    <Paper
      ref={ref}
      className="print-only"
      elevation={3}
      sx={{
        maxWidth: 1000,
        mx: "auto",
        p: 4,
        mt: 2,
        border: "0.5px solid black",
        height: "80vh",
      }}
    >
      {/* Header */}
      <Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mt: 2,
            ml: 9,
          }}
        >

          {/* Text content on right */}
          <Box sx={{ ml: 3 ,textAlign:'center' }} >
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{ color: "#00c6ff" }}
            >
              {orgName}
            </Typography>

            <Typography variant="body2" fontWeight="bold">
              {bill.createdBy?.address}
            </Typography>

          </Box>
        </Box>

        <Divider />
        <Typography variant="h6" fontWeight="bold" m={2} textAlign={"center"}>
          Tax Invoice{" "}
        </Typography>
        <Divider />
      </Box>

      {/* Invoice Info */}
      <Box mt={3} sx={{ display: "flex", flexDirection: "row" }}>
        <Grid container spacing={2}>
          <Grid item xs={6} width={450}>
            <Typography variant="h6" fontWeight="bold" p={0.5}>
              To: {customer?.first_name}
            </Typography>
            <Typography p={0.5}>{customer?.address}</Typography>
            <Typography p={0.5}>{customer?.phone_number}</Typography>
            <Typography p={0.5}>GSTIN: {customer?.gstDetails?.gstNumber}</Typography>
          </Grid>
          {/* </Grid> */}
          <hr></hr>
          {/* <Grid container spacing={2}> */}
          <Grid item xs={6}>
            <Typography variant="h6" p={0.5}>
              Invoice No:{bill?.bill_number}
            </Typography>
            <Typography p={0.5}>
              <strong>Date: {new Date().toLocaleDateString()}</strong>
            </Typography>
           
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Products Table */}
      <Typography variant="h6" fontWeight="bold">
        Products:
      </Typography>
      <TableContainer sx={{ mt: 2, border: "1px solid #ccc" }}>
        <Table
          size="small"
          aria-label="invoice table"
          sx={{ minWidth: 700, tableLayout: "fixed", height: "10vh" }}
        >
          <TableHead>
            {/* First header row */}
            <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
              <TableCell
                rowSpan={2}
                align="center"
                sx={{
                  border: "1px solid #ccc",
                  fontWeight: "bold",
                  width: "0%",
                }}
              >
                Sr.
                <br />
                No
              </TableCell>
              <TableCell
                rowSpan={2}
                align="left"
                sx={{
                  border: "1px solid #ccc",
                  fontWeight: "bold",
                  width: "8%",
                }}
              >
                Description
              </TableCell>
              <TableCell
                rowSpan={2}
                align="center"
                sx={{
                  border: "1px solid #ccc",
                  fontWeight: "bold",
                  width: "0.5%",
                }}
              >
                HSN
              </TableCell>
              <TableCell
                rowSpan={2}
                align="center"
                sx={{
                  border: "1px solid #ccc",
                  fontWeight: "bold",
                  width: "0.1%",
                }}
              >
                Qty
              </TableCell>
              <TableCell
                rowSpan={2}
                align="right"
                sx={{
                  border: "1px solid #ccc",
                  fontWeight: "bold",
                  width: "2%",
                }}
              >
                Rate
              </TableCell>
              {/* <TableCell
                rowSpan={2}
                align="right"
                sx={{
                  border: "1px solid #ccc",
                  fontWeight: "bold",
                  width: "2%",
                }}
              >
                Balance
              </TableCell> */}
              {/* <TableCell
                rowSpan={2}
                align="right"
                sx={{
                  border: "1px solid #ccc",
                  fontWeight: "bold",
                  width: "2%",
                }}
              >
                Taxable
                <br />
                Amt
              </TableCell> */}

              {/* Group headers */}
              {cgst > 0 && (
                <>
                <TableCell
                  colSpan={2}
                  align="center"
                  sx={{
                    border: "1px solid #ccc",
                    fontWeight: "bold",
                    width: "9%",
                  }}
                >
                  CGST
                </TableCell>
              
                <TableCell
                  colSpan={2}
                  align="center"
                  sx={{
                    border: "1px solid #ccc",
                    fontWeight: "bold",
                    width: "9%",
                  }}
                >
                  SGST
                </TableCell>
                </>
              )}
              {igst > 0 && (
                <TableCell
                  colSpan={2}
                  align="center"
                  sx={{
                    border: "1px solid #ccc",
                    fontWeight: "bold",
                    width: "9%",
                  }}
                >
                  IGST
                </TableCell>
              )}
              <TableCell
                rowSpan={2}
                align="right"
                sx={{
                  border: "1px solid #ccc",
                  fontWeight: "bold",
                  width: "2%",
                }}
              >
                Total
              </TableCell>
            </TableRow>

            {/* Second header row for Rate + Amt */}
            <TableRow sx={{ backgroundColor: "#f9f9f9" }}>
              {cgst > 0 && (
                <>
                  <TableCell
                    align="center"
                    sx={{ border: "1px solid #ccc", fontWeight: "bold" }}
                  >
                    Rate %
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      border: "1px solid #ccc",
                      fontWeight: "bold",
                      width: "0.5%",
                    }}
                  >
                    Amt.
                  </TableCell>
                </>
              )}
              {sgst > 0 && (
                <>
                  <TableCell
                    align="center"
                    sx={{
                      border: "1px solid #ccc",
                      fontWeight: "bold",
                      width: "0.5%",
                    }}
                  >
                    Rate %
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      border: "1px solid #ccc",
                      fontWeight: "bold",
                      width: "0.5%",
                    }}
                  >
                    Amt.
                  </TableCell>
                </>
              )}
              {igst > 0 && (
                <>
                  <TableCell
                    align="center"
                    sx={{
                      border: "1px solid #ccc",
                      fontWeight: "bold",
                      width: "0.5%",
                    }}
                  >
                    Rate
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      border: "1px solid #ccc",
                      fontWeight: "bold",
                      width: "0.5%",
                    }}
                  >
                    Amt.
                  </TableCell>
                </>
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {bill.products.map((item, index) => (
              <TableRow key={index}>
                <TableCell
                  sx={{ border: "1px solid #ccc", textAlign: "center" }}
                >
                  {index + 1}
                </TableCell>
                <TableCell sx={{ border: "1px solid #ccc" }}>
                  {item.name || item.productName}
                </TableCell>
                <TableCell
                  sx={{ border: "1px solid #ccc", textAlign: "center" }}
                >
                  {item.hsnCode}
                </TableCell>
                <TableCell
                  sx={{ border: "1px solid #ccc", textAlign: "center" }}
                >
                  {item.qty}
                </TableCell>
                <TableCell
                  sx={{ border: "1px solid #ccc", textAlign: "right" }}
                >
                  {item.price.toFixed(2)}
                </TableCell>
                {/* <TableCell
                  sx={{ border: "1px solid #ccc", textAlign: "right" }}
                >
                  {bill?.balance?.toFixed(2)}
                </TableCell> */}
                {/* taxable value */}
                {/* <TableCell
                  sx={{ border: "1px solid #ccc", textAlign: "right" }}
                >
                  {(item.price * item.qty).toFixed(2)}
                </TableCell> */}

                {/* CGST */}
                {item.cgst > 0 && (
                  <>
                    <TableCell
                      sx={{ border: "1px solid #ccc", textAlign: "center" }}
                    >
                      {item.gstPercent/2 || 0}
                    </TableCell>
                    <TableCell
                      sx={{ border: "1px solid #ccc", textAlign: "right" }}
                    >
                      {item.cgst?.toFixed(2) || "0.00"}
                    </TableCell>
                  
                  
                    <TableCell
                      sx={{ border: "1px solid #ccc", textAlign: "center" }}
                    >
                      {item.gstPercent/2  || 0}
                    </TableCell>
                    <TableCell
                      sx={{ border: "1px solid #ccc", textAlign: "right" }}
                    >
                      {item.sgst?.toFixed(2) || "0.00"}
                    </TableCell>
                  </>
                )}

                {/* IGST */}
                {item.igst > 0 && (
                  <>
                    <TableCell
                      sx={{ border: "1px solid #ccc", textAlign: "center" }}
                    >
                      {item.gstPercent || 0}
                    </TableCell>
                    <TableCell
                      sx={{ border: "1px solid #ccc", textAlign: "right" }}
                    >
                      {item.igst?.toFixed(2) || "0.00"}
                    </TableCell>
                  </>
                )}

                {/* Total */}
                <TableCell
                  sx={{ border: "1px solid #ccc", textAlign: "right" }}
                >
                  {cgst> 0 ? (item.price + item.cgst + item.sgst)?.toFixed(2) : (item.price + item.igst )?.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      
       <div
          style={{ width: "35%", border: "1px solid #ccc", marginTop: "10px" }}
        >
          <table
            width="100%"
            cellPadding="8"
            style={{ borderCollapse: "collapse" }}
          >
            <tbody>
              <tr>
                <td>Subtotal</td>
                <td style={{ textAlign: "right" }}>
                  ₹ {bill.subtotal?.toFixed(2)}
                </td>
              </tr>
            {cgst > 0 && (
              <>
              <tr>
                <td>CGST </td>
                <td style={{ textAlign: "right" }}> ₹ {cgst}</td>
              </tr>
              <tr>
                <td>SGST </td>
                <td style={{ textAlign: "right" }}>₹ {sgst}</td>
              </tr>
              </>
            )}
            {igst > 0 &&(

              <tr>
                <td>IGST: </td>
                <td style={{ textAlign: "right" }}>₹ {igst}</td>
              </tr>
            )}

              <tr style={{ fontWeight: "bold" }}>
                <td>Total</td>
                <td style={{ textAlign: "right" }}>
                  ₹{bill.grandTotal?.toFixed(2)}
                </td>
              </tr>
             
              <tr style={{ fontWeight: "bold" }}>
                <td>Paid Amount</td>
                <td style={{ textAlign: "right" }}>
                   ₹ {bill.advance > 0 ? bill.advance?.toFixed(2) : bill.grandTotal}
                </td>
              </tr>
              {bill.balance > 0 && (
              <tr style={{ fontWeight: "bold" }}>
                <td>Balance</td>
                <td style={{ textAlign: "right" }}>
                  ₹{bill.balance?.toFixed(2)}
                </td>
              </tr>)}
             
            </tbody>
          </table>
        
        </div>

      {/* Signature */}
      <Box display="flex" justifyContent="center" mt={4}>
        <Grid item ml={4} marginRight={"40px"}>
          <b style={{ fontSize: "12px" }}>
            This is system generated receipt, no signature required.
          </b>
        </Grid>
      </Box>
    </Paper>
    // </Box>
  );
});

export default GenerateBill;
