import {
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { getSaleBillById } from "../../services/SaleBillService";
import CloseIcon from "@mui/icons-material/Close";
import GenerateBill from "../shared/GenerateBill";
import moment from "moment";

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

const ViewBill = ({ open, data, handleCloseView }) => {
  const [bill, setBill] = useState();
  const [printData, setPrintData] = useState();
  const [showPrint, setShowPrint] = useState(false);

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const res = await getSaleBillById(data);
        setBill(res.data);
      } catch (err) {
        console.error("Error loading bill by ID", err);
      }
    };

    if (data) {
      fetchBill();
    } else {
      console.log("No valid ID found in data prop");
    }
  }, [data]);
  console.log('view sale bill::',bill)
    const sanitizeNumber = (v) => {
    if (v === null || v === undefined || v === "") return 0;
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    const cleaned = String(v).replace(/[,%]/g, "").trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };
 // Calculate discounted taxable value for one product
const getDiscountedAmount = (item) => {
  
  const price = sanitizeNumber(item.unitPrice);
  const qty = sanitizeNumber(item.qty);
  const base = price * qty;

  if (!item.discount) return base;

  const discountStr = item.discount.toString();

  if (discountStr.includes("%")) {
    const percent = parseFloat(discountStr) || 0;
    return base - (base * percent) / 100;
  } else {
    const flat = parseFloat(discountStr) || 0;
    return base - flat;
  }
};
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

  const handlePrint = () => {
    try {

      setPrintData(bill);
      setShowPrint(true); // Show bill for printing
      setTimeout(() => {
        window.print();
        setShowPrint(false); // Optional
      }, 500);
    } catch (error) { }
  };

  if (!open) return null;
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
          <Box display="flex" justifyContent="space-between">
            <Typography variant="h6" fontWeight="bold">
              Invoice Type: {bill?.billType.toUpperCase()}
            </Typography>
            <Typography variant="h6" fontSize={16} mt={6}>
              Invoice Number: {bill?.bill_number} <br />
              Date: {moment(bill?.createdAt).format("DD/MM/YYYY")}
            </Typography>
          </Box>
          {/* Invoice Info */}
          <Box mt={3}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="h6" fontWeight="bold">
                  Invoice to:
                </Typography>
                <Typography>{bill?.bill_to?.name}</Typography>
                <Typography>{bill?.bill_to?.address}</Typography>
                <Typography>{bill?.bill_to?.phone_number}</Typography>
              </Grid>
            </Grid>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" fontWeight="bold">
            Products:
          </Typography>
          {/* Product Table */}
          <TableContainer sx={{ mt: 2, border: "1px solid #ccc" }}>
            <Table
              size="small"
              aria-label="invoice table"
              sx={{ borderCollapse: "collapse" }}
            >
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
                  <TableCell
                    sx={{ border: "1px solid #ccc", fontWeight: "bold" }}
                  >
                    SL.
                  </TableCell>
                  <TableCell
                    sx={{ border: "1px solid #ccc", fontWeight: "bold" }}
                  >
                    Item Description
                  </TableCell>
                  <TableCell
                    sx={{ border: "1px solid #ccc", fontWeight: "bold" }}
                  >
                    Price
                  </TableCell>
                   <TableCell
                    sx={{ border: "1px solid #ccc", fontWeight: "bold" }}
                  >
                    Qty
                  </TableCell>
                  {/* <TableCell
                    sx={{ border: "1px solid #ccc", fontWeight: "bold" }}
                  >
                    Unit Price
                  </TableCell> */}
                  <TableCell
                    sx={{ border: "1px solid #ccc", fontWeight: "bold" }}
                  >
                    Discount
                  </TableCell>
                  
                  
                  {bill?.billType === "gst" && (
                    <TableCell
                      sx={{ border: "1px solid #ccc", fontWeight: "bold" }}
                    >
                      GST Rate %
                    </TableCell>
                  )}

                  {cgst > 0 && sgst > 0 && (
                    <>
                      <TableCell
                        sx={{ border: "1px solid #ccc", fontWeight: "bold" }}
                      >
                        CGST
                      </TableCell>
                      <TableCell
                        sx={{ border: "1px solid #ccc", fontWeight: "bold" }}
                      >
                        SGST
                      </TableCell>
                    </>
                  )}
                  {igst > 0 && (
                    <TableCell
                      sx={{ border: "1px solid #ccc", fontWeight: "bold" }}
                    >
                      IGST
                    </TableCell>
                  )}
                 
                  <TableCell
                    sx={{ border: "1px solid #ccc", fontWeight: "bold" }}
                  >
                    Taxable Total
                  </TableCell>
                  <TableCell
                    sx={{ border: "1px solid #ccc", fontWeight: "bold" }}
                  >
                    Total
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bill?.products?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ border: "1px solid #ccc" }}>
                      {index + 1}
                    </TableCell>
                    <TableCell sx={{ border: "1px solid #ccc" }}>
                      {item.name} - {item.hsnCode}
                    </TableCell>
                    <TableCell sx={{ border: "1px solid #ccc" }}>
                      ₹{item.unitPrice}
                    </TableCell>
                    <TableCell sx={{ border: "1px solid #ccc" }}>
                      {item.qty}
                    </TableCell>
                    <TableCell sx={{ border: "1px solid #ccc" }}>
                      {item.discount.includes('%')?item.discount : '₹' + item.discount}
                    </TableCell>
                    
                    {bill?.billType === "gst" && (
                      <TableCell sx={{ border: "1px solid #ccc" }}>
                        {item.gstPercent}
                      </TableCell>
                    )}
                    {cgst > 0 && sgst > 0 && (
                      <>
                        <TableCell sx={{ border: "1px solid #ccc" }}>
                          ₹{item.cgst.toFixed(2)}
                        </TableCell>
                        <TableCell sx={{ border: "1px solid #ccc" }}>
                          ₹{item.sgst.toFixed(2)}
                        </TableCell>
                      </>
                    )}
                    {igst > 0 && (<>
                      <TableCell sx={{ border: "1px solid #ccc" }}>
                        ₹{item.igst.toFixed(2)}
                      </TableCell>
                    </>)}
                    
                    <TableCell sx={{ border: "1px solid #ccc" }}>
                      ₹{getDiscountedAmount(item)}
                    </TableCell>
                    <TableCell sx={{ border: "1px solid #ccc" }}>
                      ₹{(item.cgst > 0 ? getDiscountedAmount(item) + item.cgst + item.sgst : getDiscountedAmount(item) + item.igst).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Grid item xs={6} textAlign="right" mt={2}>
            <Typography>
              <b>Sub Total: ₹{bill?.subtotal.toFixed(2)}</b>
            </Typography>

            {bill?.billType === "gst" && (
              <>
                {cgst > 0 && sgst > 0 && (
                  <>
                    <Typography>
                      <b>CGST:{`${cgst}`}</b>
                    </Typography>
                    <Typography>
                      <b>SGST: {`${sgst}`}</b>
                    </Typography>
                  </>
                )}
                {igst > 0 && (
                  <Typography>
                    <b>IGST: {`${igst}`}</b>
                  </Typography>
                )}
              </>
            )}
            <Typography variant="h6" fontWeight="bold" mt={1}>
              Total: ₹{bill?.grandTotal.toFixed(2)}
            </Typography>
            <Typography variant="h6" fontWeight="bold" mt={1}>
              Balance: ₹{bill?.balance.toFixed(2)}
            </Typography>
          </Grid>
          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button variant="contained" onClick={handlePrint}>
              Print
            </Button>
          </Box>
        </Box>
      </Modal>

      {showPrint && printData && (
        <div className="print-only">
          <GenerateBill bill={printData} billName={"SALE"} />
        </div>
      )}
    </>
  );
};

export default ViewBill;
