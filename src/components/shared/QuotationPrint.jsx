import { Box, Paper } from "@mui/material";

import React from "react";

const QuotationPrint = React.forwardRef(({ quotation }, ref) => {
  const termsArray = quotation?.terms
    ?.split(/\d+\./) // split on "1." "2." etc
    ?.map((term) => term.trim()) // remove spaces
    ?.filter((term) => term.length > 0); // remove empty
  return (
    <Paper
      ref={ref}
      className="print-only"
      // elevation={3}
      sx={{
        maxWidth: 800,
        mx: "auto",
        p: 4,
        mt: 2,
        height: 960,
        border: "1px solid #182848",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ color: "#182848", margin: "5" }}>
            {quotation?.organization_id?.name}
          </h2>
          <p>
            {quotation?.createdBy?.first_name +
              " " +
              quotation?.createdBy?.last_name}
          </p>
          <p>{quotation?.createdBy?.address}</p>
          <p>{quotation?.createdBy?.phone_number}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <h2 style={{ color: "#182848", margin: "5" }}>QUOTATION</h2>
          <table
            style={{ borderCollapse: "collapse", marginTop: "10px" }}
            border="1"
            cellPadding="5"
          >
            <tbody>
              <tr>
                <td>Date</td>
                <td>{new Date(quotation.createdAt).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td>Quote #</td>
                <td>{quotation.quotationNo}</td>
              </tr>
              {/* <tr>
                <td>Customer ID</td>
                <td>{quotation.customer.phone}</td>
              </tr>
              <tr>
                <td>Valid Until</td>
                <td>{new Date(quotation.date).toLocaleDateString()}</td>
              </tr> */}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer */}
      <h3 style={{ background: "linear-gradient(135deg, #182848, #324b84ff)", color: "white", padding: "5px" }}>
        CUSTOMER
      </h3>
      <div style={{ padding: "10px" }}>
        <p>NAME : {quotation.customer.name}</p>
        <p>ADDRESS: {quotation.customer.address || "-"}</p>
        <p>CONTACT NO.: {quotation.customer.phone}</p>
      </div>

      {/* Description */}
      <h3 style={{ background: "linear-gradient(135deg, #182848, #324b84ff)", color: "white", padding: "5px" }}>
        DESCRIPTION
      </h3>
      <table
        width="100%"
        border="1"
        cellPadding="8"
        style={{ borderCollapse: "collapse", marginBottom: "20px" }}
      >
        <thead style={{ background: "#f5f5f5" }}>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Tax %</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {quotation.products.map((p, i) => (
            <tr key={i}>
              <td align="center">{p.productName}</td>
              <td align="center">{p.quantity}</td>
              <td align="center">{p.unitPrice}</td>
              <td align="center">{p.tax}</td>
              <td align="center">{p.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Terms and Totals */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
       

         
        <p style={{ marginTop: "50px" }}>
          Customer Acceptance (sign below):
          <br />X _____________________________
        </p>
        
         
        
        {/* Totals */}
        <div style={{ width: "35%", border: "1px solid #ccc" }}>
          <table
            width="100%"
            cellPadding="8"
            style={{ borderCollapse: "collapse" }}
          >
            <tbody>
              <tr>
                <td>Subtotal</td>
                <td style={{ textAlign: "right" }}>{quotation.subtotal}</td>
              </tr>
              <tr>
                <td>Taxable</td>
                <td style={{ textAlign: "right" }}>{quotation.subtotal}</td>
              </tr>
              <tr>
                <td>Tax Value</td>
                <td style={{ textAlign: "right" }}>{quotation.taxTotal}</td>
              </tr>
              <tr style={{ background: "linear-gradient(135deg, #182848, #324b84ff)",color:"white", fontWeight: "bold" }}>
                <td>Total</td>
                <td style={{ textAlign: "right" }}>₹ {quotation.grandTotal}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
       <div
            style={{
              textAlign: "left",
              // marginTop: "150px",
              fontStyle: "italic",
            }}
          >
             <h3 style={{ color: "#182848" }}>TERMS AND CONDITIONS</h3>
            <ol style={{ display: "inline-block", textAlign: "left" }}>
              {termsArray?.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ol>
          </div>
    </Paper>
  );
});

export default QuotationPrint;
