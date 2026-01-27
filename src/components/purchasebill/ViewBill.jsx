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
  Card,
  CardContent,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { getPurchaseBillById } from "../../services/PurchaseBillService";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
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
  overflow: "auto",
};

const ViewBill = ({ open, data, handleCloseView }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  
  const [bill, setBill] = useState();
  const [printData, setPrintData] = useState();
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
        const res = await getPurchaseBillById(data);
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
    } else {
      setBill(null);
    }
  }, [data, open]);

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

  const cgst = bill?.products?.reduce((acc, p) => {
    const val = parseFloat(p.cgst) || 0;
    return acc + val;
  }, 0) || 0;

  const sgst = bill?.products?.reduce((acc, p) => {
    const val = parseFloat(p.sgst) || 0;
    return acc + val;
  }, 0) || 0;

  const igst = bill?.products?.reduce((acc, p) => {
    const val = parseFloat(p.igst) || 0;
    return acc + val;
  }, 0) || 0;

  const handlePrint = () => {
    if (!bill) return;
    
    try {
      setPrintData(bill);
      setShowPrint(true);
      setTimeout(() => {
        window.print();
        setTimeout(() => {
          setShowPrint(false);
          setPrintData(null);
        }, 1000);
      }, 500);
    } catch (error) {
      console.error("Print error:", error);
    }
  };

  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    bgcolor: "background.paper",
    boxShadow: 24,
    borderRadius: 2,
    p: isMobile ? 2 : 3,
    width: isMobile ? "95vw" : isTablet ? "90vw" : 800,
    maxWidth: "95vw",
    maxHeight: "90vh",
    overflow: "auto",
  };

  // Mobile Product Card View
  const MobileProductCard = ({ item, index }) => (
    <Card sx={{ mb: 2, border: "1px solid #e0e0e0" }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Typography variant="subtitle2" fontWeight="bold">
              #{index + 1} • {item.name}
            </Typography>
            <Typography variant="body2" color="primary" fontWeight="medium">
              ₹{(getDiscountedAmount(item) + 
                 sanitizeNumber(item.cgst) + 
                 sanitizeNumber(item.sgst) + 
                 sanitizeNumber(item.igst)).toFixed(2)}
            </Typography>
          </Box>

          {item.hsnCode && (
            <Typography variant="caption" color="textSecondary">
              HSN: {item.hsnCode}
            </Typography>
          )}

          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary">
                Price
              </Typography>
              <Typography variant="body2">
                ₹{sanitizeNumber(item.unitPrice).toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary">
                Qty
              </Typography>
              <Typography variant="body2" align="right">
                {item.qty}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary">
                Discount
              </Typography>
              <Typography variant="body2">
                {item.discount?.includes('%') ? item.discount : `₹${item.discount}`}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary">
                Taxable Amt
              </Typography>
              <Typography variant="body2" align="right">
                ₹{getDiscountedAmount(item).toFixed(2)}
              </Typography>
            </Grid>
          </Grid>

          {(cgst > 0 || sgst > 0 || igst > 0) && (
            <Box sx={{ mt: 1, pt: 1, borderTop: "1px dashed #e0e0e0" }}>
              <Grid container spacing={1}>
                {cgst > 0 && (
                  <Grid item xs={4}>
                    <Typography variant="caption" color="textSecondary">
                      CGST
                    </Typography>
                    <Typography variant="body2">
                      ₹{sanitizeNumber(item.cgst).toFixed(2)}
                    </Typography>
                  </Grid>
                )}
                {sgst > 0 && (
                  <Grid item xs={4}>
                    <Typography variant="caption" color="textSecondary">
                      SGST
                    </Typography>
                    <Typography variant="body2">
                      ₹{sanitizeNumber(item.sgst).toFixed(2)}
                    </Typography>
                  </Grid>
                )}
                {igst > 0 && (
                  <Grid item xs={4}>
                    <Typography variant="caption" color="textSecondary">
                      IGST
                    </Typography>
                    <Typography variant="body2">
                      ₹{sanitizeNumber(item.igst).toFixed(2)}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  if (!open) return null;

  return (
    <>
      <Modal 
        open={open} 
        onClose={handleCloseView}
        aria-labelledby="view-purchase-bill-modal"
      >
        <Box sx={modalStyle}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Purchase Invoice Details
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                size="small"
                disabled={!bill || loading}
              >
                {isMobile ? "Print" : "Print Invoice"}
              </Button>
              <IconButton
                aria-label="close"
                onClick={handleCloseView}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Stack>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <Typography>Loading invoice details...</Typography>
            </Box>
          ) : !bill ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <Typography color="textSecondary">No invoice data available</Typography>
            </Box>
          ) : (
            <>
              {/* Header Info */}
              <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: "#f8f9fa" }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Invoice Type
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {bill?.billType?.toUpperCase() || "N/A"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Invoice No.
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {bill?.bill_number || "N/A"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Date
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {moment(bill?.createdAt).format("DD/MM/YYYY")}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Supplier Info */}
              <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: "#f8f9fa" }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Supplier Details:
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Typography variant="body1">
                      <strong>Name:</strong> {bill?.bill_to?.name || "N/A"}
                    </Typography>
                  </Grid>
                  {bill?.bill_to?.address && (
                    <Grid item xs={12}>
                      <Typography variant="body2">
                        <strong>Address:</strong> {bill.bill_to.address}
                      </Typography>
                    </Grid>
                  )}
                  {bill?.bill_to?.phone_number && (
                    <Grid item xs={12}>
                      <Typography variant="body2">
                        <strong>Phone:</strong> {bill.bill_to.phone_number}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>

              {/* Products Section */}
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Products ({bill?.products?.length || 0})
              </Typography>
              
              {isMobile ? (
                // Mobile Card View
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {bill?.products?.map((item, index) => (
                    <MobileProductCard key={index} item={item} index={index} />
                  ))}
                </Box>
              ) : (
                // Desktop/Tablet Table View
                <TableContainer 
                  component={Paper} 
                  sx={{ 
                    maxHeight: 300, 
                    overflow: 'auto',
                    border: '1px solid #e0e0e0'
                  }}
                >
                  <Table size={isTablet ? "small" : "medium"} stickyHeader>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
                        <TableCell sx={{ fontWeight: "bold", whiteSpace: 'nowrap' }}>#</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Item Description</TableCell>
                        <TableCell sx={{ fontWeight: "bold", textAlign: 'right' }}>Price</TableCell>
                        <TableCell sx={{ fontWeight: "bold", textAlign: 'center' }}>Qty</TableCell>
                        <TableCell sx={{ fontWeight: "bold", textAlign: 'right' }}>Discount</TableCell>
                        
                        {bill?.billType === "gst" && (
                          <TableCell sx={{ fontWeight: "bold", textAlign: 'center' }}>GST %</TableCell>
                        )}
                        
                        {cgst > 0 && sgst > 0 && (
                          <>
                            <TableCell sx={{ fontWeight: "bold", textAlign: 'right' }}>CGST</TableCell>
                            <TableCell sx={{ fontWeight: "bold", textAlign: 'right' }}>SGST</TableCell>
                          </>
                        )}
                        
                        {igst > 0 && (
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
                            <TableCell align="center">{item.gstPercent || "0%"}</TableCell>
                          )}
                          
                          {cgst > 0 && sgst > 0 && (
                            <>
                              <TableCell align="right">₹{sanitizeNumber(item.cgst).toFixed(2)}</TableCell>
                              <TableCell align="right">₹{sanitizeNumber(item.sgst).toFixed(2)}</TableCell>
                            </>
                          )}
                          
                          {igst > 0 && (
                            <TableCell align="right">₹{sanitizeNumber(item.igst).toFixed(2)}</TableCell>
                          )}
                          
                          <TableCell align="right">₹{getDiscountedAmount(item).toFixed(2)}</TableCell>
                          <TableCell align="right" fontWeight="medium">
                            ₹{(getDiscountedAmount(item) + sanitizeNumber(item.cgst) + 
                                sanitizeNumber(item.sgst) + sanitizeNumber(item.igst)).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Summary Section */}
              <Grid container justifyContent="flex-end" spacing={2} mt={3}>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8f9fa" }}>
                    <Stack spacing={1}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography>Sub Total:</Typography>
                        <Typography fontWeight="medium">
                          ₹{sanitizeNumber(bill?.subtotal).toFixed(2)}
                        </Typography>
                      </Box>
                      
                      {bill?.billType === "gst" && (
                        <>
                          {cgst > 0 && (
                            <Box display="flex" justifyContent="space-between">
                              <Typography>Total CGST:</Typography>
                              <Typography>₹{cgst.toFixed(2)}</Typography>
                            </Box>
                          )}
                          {sgst > 0 && (
                            <Box display="flex" justifyContent="space-between">
                              <Typography>Total SGST:</Typography>
                              <Typography>₹{sgst.toFixed(2)}</Typography>
                            </Box>
                          )}
                          {igst > 0 && (
                            <Box display="flex" justifyContent="space-between">
                              <Typography>Total IGST:</Typography>
                              <Typography>₹{igst.toFixed(2)}</Typography>
                            </Box>
                          )}
                        </>
                      )}
                      
                      <Divider />
                      
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="h6">Grand Total:</Typography>
                        <Typography variant="h6" fontWeight="bold" color="primary">
                          ₹{sanitizeNumber(bill?.grandTotal).toFixed(2)}
                        </Typography>
                      </Box>
                      
                      {bill?.balance > 0 && (
                        <Box display="flex" justifyContent="space-between">
                          <Typography color="warning.main">Balance Due:</Typography>
                          <Typography color="warning.main" fontWeight="medium">
                            ₹{sanitizeNumber(bill?.balance).toFixed(2)}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            </>
          )}
        </Box>
      </Modal>

      {showPrint && printData && (
        <div className="print-only">
          <GenerateBill bill={printData} billName={"PURCHASE"} />
        </div>
      )}
    </>
  );
};

export default ViewBill;