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
  useMediaQuery,
  useTheme,
  Paper,
  Stack,
  Chip,
  Card,
  CardContent,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { getSaleBillById } from "../../services/SaleBillService";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GenerateBill from "../shared/GenerateBill";
import moment from "moment";

const ViewBill = ({ open, data, handleCloseView }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  
  const [bill, setBill] = useState(null);
  const [printData, setPrintData] = useState(null);
  const [showPrint, setShowPrint] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBill = async () => {
      if (!data) {
        console.log("No valid ID found in data prop");
        return;
      }

      setLoading(true);
      try {
        const res = await getSaleBillById(data);
        if (res.data) {
          setBill(res.data);
        }
      } catch (err) {
        console.error("Error loading bill by ID", err);
      } finally {
        setLoading(false);
      }
    };

    if (open && data) {
      fetchBill();
    }
  }, [data, open]);

  const sanitizeNumber = (v) => {
    if (v === null || v === undefined || v === "") return 0;
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    const cleaned = String(v).replace(/[,%]/g, "").trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

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

  const calculateTaxes = () => {
    if (!bill?.products) return { cgst: 0, sgst: 0, igst: 0 };
    
    const cgst = bill.products.reduce((acc, p) => acc + (parseFloat(p.cgst) || 0), 0);
    const sgst = bill.products.reduce((acc, p) => acc + (parseFloat(p.sgst) || 0), 0);
    const igst = bill.products.reduce((acc, p) => acc + (parseFloat(p.igst) || 0), 0);
    
    return { cgst, sgst, igst };
  };

  const taxes = calculateTaxes();

  const handlePrint = () => {
    if (!bill) return;
    
    try {
      setPrintData(bill);
      setShowPrint(true);
      setTimeout(() => {
        window.print();
        setTimeout(() => {
          setShowPrint(false);
        }, 1000);
      }, 500);
    } catch (error) {
      console.error("Print error:", error);
    }
  };

  const getModalStyle = () => ({
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    bgcolor: "background.paper",
    boxShadow: 24,
    borderRadius: 0,
    p: 0,
    width: "100vw",
    height: "100vh",
    overflow: "auto",
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-track": {
      background: "#f1f1f1",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "#888",
      borderRadius: "3px",
    },
  });

  const getDesktopModalStyle = () => ({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    bgcolor: "background.paper",
    boxShadow: 24,
    borderRadius: 2,
    p: 3,
    width: "95vw",
    maxWidth: "900px",
    maxHeight: "90vh",
    overflow: "auto",
  });

  const renderMobileProductCard = (item, index) => (
    <Card key={index} sx={{ mb: 2, border: "1px solid #e0e0e0" }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack spacing={1.5}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" color="primary">
                {index + 1}. {item.name}
              </Typography>
              {item.hsnCode && (
                <Typography variant="caption" color="textSecondary">
                  HSN: {item.hsnCode}
                </Typography>
              )}
            </Box>
            <Chip 
              label={`₹${(getDiscountedAmount(item) + sanitizeNumber(item.cgst) + 
                      sanitizeNumber(item.sgst) + sanitizeNumber(item.igst)).toFixed(2)}`}
              size="small"
              color="primary"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>

          <Divider />

          {/* Basic Info */}
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary">Price</Typography>
              <Typography variant="body2">₹{sanitizeNumber(item.unitPrice).toFixed(2)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary" align="right">Quantity</Typography>
              <Typography variant="body2" align="right">
                <Chip 
                  label={item.qty} 
                  size="small" 
                  variant="outlined"
                  sx={{ height: 24 }}
                />
              </Typography>
            </Grid>
          </Grid>

          {/* Discount & GST */}
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary">Discount</Typography>
              <Typography variant="body2">
                {item.discount?.includes('%') ? item.discount : `₹${item.discount || 0}`}
              </Typography>
            </Grid>
            {bill?.billType === "gst" && (
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary" align="right">GST Rate</Typography>
                <Typography variant="body2" align="right">{item.gstPercent || "0%"}</Typography>
              </Grid>
            )}
          </Grid>

          {/* Tax Details */}
          <Box sx={{ bgcolor: '#f8f9fa', p: 1.5, borderRadius: 1 }}>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Typography variant="caption" color="textSecondary">Taxable Amount</Typography>
                <Typography variant="body2" fontWeight="medium">
                  ₹{getDiscountedAmount(item).toFixed(2)}
                </Typography>
              </Grid>
              
              {(sanitizeNumber(item.cgst) > 0 || sanitizeNumber(item.sgst) > 0) && (
                <>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">CGST</Typography>
                    <Typography variant="body2" color="success.main">
                      ₹{sanitizeNumber(item.cgst).toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">SGST</Typography>
                    <Typography variant="body2" color="success.main">
                      ₹{sanitizeNumber(item.sgst).toFixed(2)}
                    </Typography>
                  </Grid>
                </>
              )}
              
              {sanitizeNumber(item.igst) > 0 && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">IGST</Typography>
                  <Typography variant="body2" color="success.main">
                    ₹{sanitizeNumber(item.igst).toFixed(2)}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  const renderMobileView = () => (
    <Box sx={{ p: 2 }}>
      {/* Mobile Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={handleCloseView} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Invoice
            </Typography>
            <Typography variant="caption" color="textSecondary">
              #{bill?.bill_number || "Loading..."}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          size="small"
          disabled={!bill}
        >
          Print
        </Button>
      </Box>

      {/* Invoice Type & Date */}
      <Paper sx={{ p: 2, mb: 2, bgcolor: '#f8f9fa' }}>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Typography variant="caption" color="textSecondary">Invoice Type</Typography>
            <Chip 
              label={bill?.billType === "gst" ? "GST" : "NON-GST"} 
              size="small"
              color={bill?.billType === "gst" ? "primary" : "default"}
              sx={{ mt: 0.5 }}
            />
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="textSecondary" align="right">Date</Typography>
            <Typography variant="body2" align="right" fontWeight="medium">
              {moment(bill?.createdAt).format("DD/MM/YYYY")}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Customer Info */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa' }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Billed To
        </Typography>
        <Stack spacing={0.5}>
          <Typography variant="body1" fontWeight="medium">
            {bill?.bill_to?.name || "N/A"}
          </Typography>
          {bill?.bill_to?.phone_number && (
            <Typography variant="body2" color="textSecondary">
              📞 {bill.bill_to.phone_number}
            </Typography>
          )}
          {bill?.bill_to?.address && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              {bill.bill_to.address}
            </Typography>
          )}
        </Stack>
      </Paper>

      {/* Products Section */}
      <Box mb={3}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Products ({bill?.products?.length || 0})
        </Typography>
        {bill?.products?.map((item, index) => renderMobileProductCard(item, index))}
      </Box>

      {/* Summary Section */}
      <Paper sx={{ p: 2.5, bgcolor: '#f8f9fa', position: 'sticky', bottom: 0 }}>
        <Stack spacing={1.5}>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2">Sub Total</Typography>
            <Typography variant="body2" fontWeight="medium">
              ₹{sanitizeNumber(bill?.subtotal).toFixed(2)}
            </Typography>
          </Box>

          {bill?.billType === "gst" && (
            <>
              {taxes.cgst > 0 && (
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">CGST</Typography>
                  <Typography variant="body2" color="success.main">
                    ₹{taxes.cgst.toFixed(2)}
                  </Typography>
                </Box>
              )}
              {taxes.sgst > 0 && (
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">SGST</Typography>
                  <Typography variant="body2" color="success.main">
                    ₹{taxes.sgst.toFixed(2)}
                  </Typography>
                </Box>
              )}
              {taxes.igst > 0 && (
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">IGST</Typography>
                  <Typography variant="body2" color="success.main">
                    ₹{taxes.igst.toFixed(2)}
                  </Typography>
                </Box>
              )}
            </>
          )}

          <Divider />

          <Box display="flex" justifyContent="space-between">
            <Typography variant="h6">Grand Total</Typography>
            <Typography variant="h6" fontWeight="bold" color="primary">
              ₹{sanitizeNumber(bill?.grandTotal).toFixed(2)}
            </Typography>
          </Box>

          {bill?.balance > 0 && (
            <Box display="flex" justifyContent="space-between" sx={{ bgcolor: '#fff3e0', p: 1, borderRadius: 1 }}>
              <Typography variant="body2" color="warning.main">Balance Due</Typography>
              <Typography variant="body2" color="warning.main" fontWeight="bold">
                ₹{sanitizeNumber(bill?.balance).toFixed(2)}
              </Typography>
            </Box>
          )}
        </Stack>
      </Paper>
    </Box>
  );

  const renderDesktopView = () => (
    <Box sx={getDesktopModalStyle()}>
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
      
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Invoice Type: {bill?.billType === "gst" ? "GST" : "NON-GST"}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            #{bill?.bill_number}
          </Typography>
        </Box>
        <Box textAlign="right">
          <Typography variant="body1" fontWeight="medium">
            Invoice Number: {bill?.bill_number}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Date: {moment(bill?.createdAt).format("DD/MM/YYYY")}
          </Typography>
        </Box>
      </Box>

      {/* Invoice Info */}
      <Box mt={3}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Invoice to:
            </Typography>
            <Stack spacing={0.5}>
              <Typography>{bill?.bill_to?.name}</Typography>
              {bill?.bill_to?.address && (
                <Typography variant="body2" color="textSecondary">
                  {bill.bill_to.address}
                </Typography>
              )}
              {bill?.bill_to?.phone_number && (
                <Typography variant="body2" color="textSecondary">
                  📞 {bill.bill_to.phone_number}
                </Typography>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Products:
      </Typography>

      {/* Product Table - Desktop */}
      <TableContainer sx={{ mt: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: "bold" }}>SL.</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Item Description</TableCell>
              <TableCell sx={{ fontWeight: "bold", textAlign: 'right' }}>Price</TableCell>
              <TableCell sx={{ fontWeight: "bold", textAlign: 'center' }}>Qty</TableCell>
              <TableCell sx={{ fontWeight: "bold", textAlign: 'right' }}>Discount</TableCell>
              
              {bill?.billType === "gst" && (
                <TableCell sx={{ fontWeight: "bold", textAlign: 'center' }}>GST %</TableCell>
              )}

              {taxes.cgst > 0 && taxes.sgst > 0 && (
                <>
                  <TableCell sx={{ fontWeight: "bold", textAlign: 'right' }}>CGST</TableCell>
                  <TableCell sx={{ fontWeight: "bold", textAlign: 'right' }}>SGST</TableCell>
                </>
              )}
              
              {taxes.igst > 0 && (
                <TableCell sx={{ fontWeight: "bold", textAlign: 'right' }}>IGST</TableCell>
              )}
              
              <TableCell sx={{ fontWeight: "bold", textAlign: 'right' }}>Taxable Amt</TableCell>
              <TableCell sx={{ fontWeight: "bold", textAlign: 'right' }}>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bill?.products?.map((item, index) => (
              <TableRow key={index} hover>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">{item.name}</Typography>
                    {item.hsnCode && (
                      <Typography variant="caption" color="textSecondary">
                        HSN: {item.hsnCode}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">₹{sanitizeNumber(item.unitPrice).toFixed(2)}</TableCell>
                <TableCell align="center">{item.qty}</TableCell>
                <TableCell align="right">
                  {item.discount?.includes('%') ? item.discount : `₹${item.discount}`}
                </TableCell>
                
                {bill?.billType === "gst" && (
                  <TableCell align="center">{item.gstPercent}</TableCell>
                )}
                
                {taxes.cgst > 0 && taxes.sgst > 0 && (
                  <>
                    <TableCell align="right">₹{sanitizeNumber(item.cgst).toFixed(2)}</TableCell>
                    <TableCell align="right">₹{sanitizeNumber(item.sgst).toFixed(2)}</TableCell>
                  </>
                )}
                
                {taxes.igst > 0 && (
                  <TableCell align="right">₹{sanitizeNumber(item.igst).toFixed(2)}</TableCell>
                )}
                
                <TableCell align="right">₹{getDiscountedAmount(item).toFixed(2)}</TableCell>
                <TableCell align="right" fontWeight="bold">
                  ₹{(getDiscountedAmount(item) + sanitizeNumber(item.cgst) + 
                      sanitizeNumber(item.sgst) + sanitizeNumber(item.igst)).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Summary - Desktop */}
      <Grid container justifyContent="flex-end" mt={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, bgcolor: '#f8f9fa' }}>
            <Stack spacing={1}>
              <Box display="flex" justifyContent="space-between">
                <Typography>Sub Total:</Typography>
                <Typography fontWeight="medium">₹{sanitizeNumber(bill?.subtotal).toFixed(2)}</Typography>
              </Box>

              {bill?.billType === "gst" && (
                <>
                  {taxes.cgst > 0 && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography>CGST:</Typography>
                      <Typography color="success.main">₹{taxes.cgst.toFixed(2)}</Typography>
                    </Box>
                  )}
                  {taxes.sgst > 0 && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography>SGST:</Typography>
                      <Typography color="success.main">₹{taxes.sgst.toFixed(2)}</Typography>
                    </Box>
                  )}
                  {taxes.igst > 0 && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography>IGST:</Typography>
                      <Typography color="success.main">₹{taxes.igst.toFixed(2)}</Typography>
                    </Box>
                  )}
                </>
              )}

              <Divider />

              <Box display="flex" justifyContent="space-between">
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  ₹{sanitizeNumber(bill?.grandTotal).toFixed(2)}
                </Typography>
              </Box>

              {bill?.balance > 0 && (
                <Box display="flex" justifyContent="space-between" sx={{ mt: 1 }}>
                  <Typography color="warning.main">Balance Due:</Typography>
                  <Typography color="warning.main" fontWeight="bold">
                    ₹{sanitizeNumber(bill?.balance).toFixed(2)}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Print Button */}
      <Box mt={3} display="flex" justifyContent="flex-end">
        <Button variant="contained" onClick={handlePrint} startIcon={<PrintIcon />}>
          Print Invoice
        </Button>
      </Box>
    </Box>
  );

  if (!open) return null;

  return (
    <>
      <Modal open={open} onClose={handleCloseView}>
        {isMobile ? renderMobileView() : renderDesktopView()}
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