import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  IconButton,
  Divider,
  Snackbar,
  Alert,
  Box,
  MenuItem,
  useMediaQuery,
  useTheme,
  Stack,
  Paper,
} from "@mui/material";
import { Delete, Add, Close } from "@mui/icons-material";
import moment from "moment";
import { updateQuotation } from "../../services/QuotationService";
import QuotationPrint from "../shared/QuotationPrint";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

const EditQuotationDialog = ({ open, onClose, quotation, refresh }) => {
  const [formData, setFormData] = useState({
    quotationNo: "",
    validUpTo: "",
    date: "",
    customer: { name: "", email: "", phone: "", address: "", terms: "" },
    status: "",
    products: [],
    subtotal: 0,
    taxTotal: 0,
    grandTotal: 0,
    terms: "",
  });
  
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [showPrint, setShowPrint] = useState(false);
  const [printData, setPrintData] = useState();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Load quotation data into form
  useEffect(() => {
    if (quotation) {
      setFormData({
        quotationNo: quotation.quotationNo || "",
        date: quotation.date
          ? moment(quotation.date).format("YYYY-MM-DD")
          : "",
        validUpTo: quotation.validUpTo
          ? moment(quotation.validUpTo).format("YYYY-MM-DD")
          : "",
        customer: quotation.customer || {
          name: "",
          email: "",
          phone: "",
          address: "",
          terms: "",
        },
        status: quotation.status || "Draft",
        products: quotation.products?.map(p => ({
          ...p,
          quantity: p.quantity || 1,
          unitPrice: p.unitPrice || 0,
          tax: p.tax || 0,
          total: p.total || 0
        })) || [],
        subtotal: quotation.subtotal || 0,
        taxTotal: quotation.taxTotal || 0,
        grandTotal: quotation.grandTotal || 0,
        terms: quotation.terms || "",
      });
    }
  }, [quotation]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      customer: {
        ...prev.customer,
        [name]: value,
      },
    }));
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...formData.products];
    updatedProducts[index][field] = value;

    // Auto recalc product total
    if (field === "quantity" || field === "unitPrice" || field === "tax") {
      const qty = Number(updatedProducts[index].quantity) || 0;
      const price = Number(updatedProducts[index].unitPrice) || 0;
      const tax = Number(updatedProducts[index].tax) || 0;
      const total = qty * price + (qty * price * tax) / 100;
      updatedProducts[index].total = total;
    }

    // Recalculate totals
    const newSubtotal = updatedProducts.reduce(
      (sum, p) => sum + (p.quantity || 0) * (p.unitPrice || 0),
      0
    );
    const newTaxTotal = updatedProducts.reduce(
      (sum, p) => sum + ((p.quantity || 0) * (p.unitPrice || 0) * (p.tax || 0)) / 100,
      0
    );
    const newGrandTotal = newSubtotal + newTaxTotal;

    setFormData((prev) => ({
      ...prev,
      products: updatedProducts,
      subtotal: newSubtotal,
      taxTotal: newTaxTotal,
      grandTotal: newGrandTotal,
    }));
  };

  const handleAddProduct = () => {
    setFormData((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        { productName: "", quantity: 1, unitPrice: 0, tax: 18, total: 0 },
      ],
    }));
  };

  const handleRemoveProduct = (index) => {
    const updatedProducts = formData.products.filter((_, i) => i !== index);

    const newSubtotal = updatedProducts.reduce(
      (sum, p) => sum + (p.quantity || 0) * (p.unitPrice || 0),
      0
    );
    const newTaxTotal = updatedProducts.reduce(
      (sum, p) => sum + ((p.quantity || 0) * (p.unitPrice || 0) * (p.tax || 0)) / 100,
      0
    );
    const newGrandTotal = newSubtotal + newTaxTotal;

    setFormData((prev) => ({
      ...prev,
      products: updatedProducts,
      subtotal: newSubtotal,
      taxTotal: newTaxTotal,
      grandTotal: newGrandTotal,
    }));
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        date: new Date(formData.date),
        validUpTo: formData.validUpTo ? new Date(formData.validUpTo) : null,
      };

      const response = await updateQuotation(quotation._id, payload);

      if (response.status === true) {
        setSnackbarOpen(true);
        setSnackbarMessage(response.message);
        refresh();
        onClose();
      } else {
        setSnackbarOpen(true);
        setSnackbarMessage(response.message);
        return;
      }
    } catch (error) {
      console.error("Failed to update quotation", error);
      setSnackbarOpen(true);
      setSnackbarMessage("Failed to update quotation");
    }
  };

  // Compact Product Row Component
  const CompactProductRow = ({ product, index }) => {
    return (
      <Grid container spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Grid item xs={isMobile ? 12 : 4}>
          <TextField
            fullWidth
            size="small"
            placeholder="Product name"
            value={product.productName}
            onChange={(e) => handleProductChange(index, "productName", e.target.value)}
            sx={{ '& .MuiInputBase-root': { height: '40px' } }}
          />
        </Grid>
        <Grid item xs={isMobile ? 4 : 2}>
          <TextField
            fullWidth
            type="number"
            size="small"
            placeholder="Qty"
            value={product.quantity}
            onChange={(e) => handleProductChange(index, "quantity", Number(e.target.value))}
            sx={{ '& .MuiInputBase-root': { height: '40px' } }}
          />
        </Grid>
        <Grid item xs={isMobile ? 4 : 2}>
          <TextField
            fullWidth
            type="number"
            size="small"
            placeholder="Price"
            value={product.unitPrice}
            onChange={(e) => handleProductChange(index, "unitPrice", Number(e.target.value))}
            sx={{ '& .MuiInputBase-root': { height: '40px' } }}
          />
        </Grid>
        <Grid item xs={isMobile ? 3 : 2}>
          <TextField
            select
            fullWidth
            size="small"
            value={product.tax}
            onChange={(e) => handleProductChange(index, "tax", Number(e.target.value))}
            sx={{ '& .MuiInputBase-root': { height: '40px' } }}
          >
            {[0, 3, 5, 6, 9, 12, 18].map((t) => (
              <MenuItem key={t} value={t} sx={{ py: 0.5 }}>
                {t}%
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={isMobile ? 3 : 1}>
          <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 500 }}>
            ₹ {product.total?.toFixed(2) || 0}
          </Typography>
        </Grid>
        <Grid item xs={isMobile ? 2 : 1}>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleRemoveProduct(index)}
            sx={{ height: '40px', width: '40px' }}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Grid>
      </Grid>
    );
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ 
          p: 2,
          position: 'relative',
          backgroundColor: theme.palette.grey[50],
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight={600}>
              Edit Quotation
            </Typography>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers sx={{ p: 2 }}>
          <Grid container spacing={2}>
            {/* Header Section - Compact */}
            <Grid item xs={12}>
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Quotation No"
                    size="small"
                    value={formData.quotationNo}
                    disabled
                    sx={{ '& .MuiInputBase-root': { height: '40px' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Date"
                    size="small"
                    value={formData.date}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiInputBase-root': { height: '40px' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Valid Up To"
                      value={formData.validUpTo ? dayjs(formData.validUpTo) : null}
                      format="DD/MM/YYYY"
                      onChange={(newValue) => {
                        setFormData({
                          ...formData,
                          validUpTo: newValue ? newValue.format("YYYY-MM-DD") : "",
                        });
                      }}
                      slotProps={{
                        textField: { 
                          fullWidth: true,
                          size: 'small',
                          sx: { '& .MuiInputBase-root': { height: '40px' } }
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    select
                    fullWidth
                    label="Status"
                    size="small"
                    value={formData.status}
                    onChange={handleChange}
                    sx={{ '& .MuiInputBase-root': { height: '40px' } }}
                  >
                    <MenuItem value="Draft" sx={{ py: 0.5 }}>Draft</MenuItem>
                    <MenuItem value="Sent" sx={{ py: 0.5 }}>Sent</MenuItem>
                    <MenuItem value="Accepted" sx={{ py: 0.5 }}>Accepted</MenuItem>
                    <MenuItem value="Rejected" sx={{ py: 0.5 }}>Rejected</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </Grid>

            {/* Customer Section - Compact */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 1 }}>
                Customer Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={1}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Customer Name"
                    name="name"
                    size="small"
                    value={formData.customer.name}
                    onChange={handleCustomerChange}
                    sx={{ '& .MuiInputBase-root': { height: '40px' } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Contact Number"
                    name="phone"
                    size="small"
                    value={formData.customer.phone}
                    onChange={handleCustomerChange}
                    sx={{ '& .MuiInputBase-root': { height: '40px' } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    size="small"
                    value={formData.customer.email}
                    onChange={handleCustomerChange}
                    sx={{ '& .MuiInputBase-root': { height: '40px' } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    size="small"
                    multiline
                    rows={1}
                    value={formData.customer.address}
                    onChange={handleCustomerChange}
                    sx={{ '& .MuiInputBase-root': { minHeight: '40px' } }}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Products Section */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Products & Services
                </Typography>
                <Button
                  startIcon={<Add />}
                  onClick={handleAddProduct}
                  size="small"
                  sx={{ color: "#182848", minWidth: 'auto', px: 1 }}
                >
                  Add Item
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {/* Product Table Header - Compact */}
              {!isMobile && (
                <Grid container spacing={1} sx={{ mb: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      PRODUCT NAME
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      QTY
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      PRICE
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      TAX %
                    </Typography>
                  </Grid>
                  <Grid item xs={1}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      AMOUNT
                    </Typography>
                  </Grid>
                  <Grid item xs={1}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      ACTION
                    </Typography>
                  </Grid>
                </Grid>
              )}

              {/* Product Rows */}
              {isMobile ? (
                // Mobile Product View
                <Stack spacing={1}>
                  {formData.products.map((product, index) => (
                    <Paper key={index} sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}` }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Product name"
                            value={product.productName}
                            onChange={(e) => handleProductChange(index, "productName", e.target.value)}
                            sx={{ mb: 1 }}
                          />
                          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                            <TextField
                              fullWidth
                              type="number"
                              size="small"
                              placeholder="Qty"
                              value={product.quantity}
                              onChange={(e) => handleProductChange(index, "quantity", Number(e.target.value))}
                            />
                            <TextField
                              fullWidth
                              type="number"
                              size="small"
                              placeholder="Price"
                              value={product.unitPrice}
                              onChange={(e) => handleProductChange(index, "unitPrice", Number(e.target.value))}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                              select
                              fullWidth
                              size="small"
                              value={product.tax}
                              onChange={(e) => handleProductChange(index, "tax", Number(e.target.value))}
                            >
                              {[0, 3, 5, 6, 9, 12, 18].map((t) => (
                                <MenuItem key={t} value={t} sx={{ py: 0.5 }}>
                                  {t}%
                                </MenuItem>
                              ))}
                            </TextField>
                            <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                              ₹ {(product.total || 0).toFixed(2)}
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveProduct(index)}
                          sx={{ ml: 1 }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                // Desktop Product View
                <Box sx={{ maxHeight: '300px', overflowY: 'auto', pr: 1 }}>
                  {formData.products.map((product, index) => (
                    <CompactProductRow key={index} product={product} index={index} />
                  ))}
                </Box>
              )}
            </Grid>

            {/* Summary Section - Compact */}
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end',
                mt: 2,
                p: 2,
                backgroundColor: theme.palette.grey[50],
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`
              }}>
                <Stack spacing={0.5} sx={{ width: '300px' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                    <Typography variant="body2" fontWeight={500}>₹ {formData.subtotal.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Tax Total:</Typography>
                    <Typography variant="body2" fontWeight={500}>₹ {formData.taxTotal.toFixed(2)}</Typography>
                  </Box>
                  <Divider sx={{ my: 0.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" fontWeight={600}>Grand Total:</Typography>
                    <Typography variant="h6" fontWeight={700} color="primary">
                      ₹ {formData.grandTotal.toFixed(2)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Grid>

            {/* Terms and Conditions - Compact */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Terms & Conditions
              </Typography>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                name="terms"
                value={formData.terms}
                onChange={handleChange}
                placeholder="Enter terms and conditions (optional)"
                sx={{ '& .MuiInputBase-root': { minHeight: '60px' } }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ 
          p: 2,
          backgroundColor: theme.palette.grey[50],
          borderTop: `1px solid ${theme.palette.divider}`
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Button 
              onClick={onClose} 
              variant="outlined"
              size="small"
              sx={{ 
                borderColor: theme.palette.grey[400],
                color: theme.palette.text.primary,
                minWidth: '80px'
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              size="small"
              sx={{ 
                backgroundColor: "#182848", 
                color: "#fff",
                minWidth: '120px',
                '&:hover': {
                  backgroundColor: "#0d1c3a",
                }
              }}
            >
              Update Quotation
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbarMessage.includes("successfully") ? "success" : "error"}
          variant="filled"
          onClose={() => setSnackbarOpen(false)}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {showPrint && printData && (
        <div className="print-only">
          <QuotationPrint quotation={printData} />
        </div>
      )}
    </>
  );
};

export default EditQuotationDialog;