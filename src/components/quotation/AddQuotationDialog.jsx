import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  IconButton,
  Typography,
  Divider,
  Snackbar,
  Alert,
  Box,
  Stack,
  useMediaQuery,
  useTheme,
  Paper,
} from "@mui/material";
import { Delete, Add, Close } from "@mui/icons-material";
import {
  addQuotation,
  generateQuotationNoByOrganization,
  getQuotationById,
} from "../../services/QuotationService";
import QuotationPrint from "../shared/QuotationPrint";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useAuth } from "../../context/AuthContext";
import { getUserById } from "../../services/UserService";

const AddQuotationDialog = ({ open, handleClose, refresh }) => {
  const { webuser } = useAuth();
  const [mainUser, setMainUser] = useState(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();
  const formatted = `${dd}/${mm}/${yyyy}`;

  const [formData, setFormData] = useState({
    quotationNo: "",
    date: formatted,
    validUpTo: "",
    customer: {
      name: "",
      email: "",
      phone: "",
      address: "",
      terms: "",
    },
    status: "Draft",
    products: [{ productName: "", quantity: 1, unitPrice: 0, tax: 18 }],
  });

  const [errors, setErrors] = useState({});
  const [showPrint, setShowPrint] = useState(false);
  const [printData, setPrintData] = useState();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getUserById(webuser?.id);
      setMainUser(user);
    };
    fetchUser();
  }, [webuser]);

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const res = await generateQuotationNoByOrganization(
          mainUser?.organization_id?._id
        );
        setFormData((prev) => ({
          ...prev,
          quotationNo: res.quoteNo,
        }));
      } catch (err) {
        console.log(err);
      }
    };
    if (open) fetchQuotation();
  }, [open, mainUser]);

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

  const handleRefresh = async () => {
    setFormData({
      quotationNo: "",
      customer: { name: "", email: "", phone: "", address: "" },
      status: "Draft",
      products: [{ productName: "", quantity: 1, unitPrice: 0, tax: 18 }],
    });
    handleClose();
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...formData.products];
    updatedProducts[index][field] = value;
    setFormData((prev) => ({ ...prev, products: updatedProducts }));
  };

  const handleAddProduct = () => {
    setFormData((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        { productName: "", quantity: 1, unitPrice: 0, tax: 18 },
      ],
    }));
  };

  const handleDeleteProduct = (index) => {
    const updatedProducts = formData.products.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, products: updatedProducts }));
  };

  // Totals calculation
  const subtotal = formData.products.reduce(
    (acc, p) => acc + p.quantity * p.unitPrice,
    0
  );
  const taxTotal = formData.products.reduce(
    (acc, p) => acc + (p.quantity * p.unitPrice * p.tax) / 100,
    0
  );
  const grandTotal = subtotal + taxTotal;

  const handleSubmit = async () => {
    const newErrors = {
      customerName: formData.customer.name.trim() === "",
      customerPhone: formData.customer.phone.trim() === "",
      products: formData.products.some((p) => p.productName.trim() === ""),
    };

    setErrors(newErrors);

    if (!Object.values(newErrors).some((err) => err)) {
      try {
        const updatedProducts = formData.products.map((p) => ({
          ...p,
          total: p.quantity * p.unitPrice * (1 + p.tax / 100),
        }));

        const payload = {
          ...formData,
          products: updatedProducts,
          organization_id: mainUser?.organization_id?._id,
          createdBy: mainUser?._id,
        };

        const response = await addQuotation(payload);

        if (response.status === true) {
          setSnackbarOpen(true);
          setSnackbarMessage(response.message);
          const quotationData = await getQuotationById(response.quotation._id);
          setPrintData(quotationData);
          setShowPrint(true);
          setTimeout(() => {
            window.print();
            setShowPrint(false);
          }, 500);
          setFormData({
            quotationNo: "",
            customer: { name: "", email: "", phone: "", address: "" },
            status: "Draft",
            products: [{ productName: "", quantity: 1, unitPrice: 0, tax: 18 }],
          });
          handleClose();
          refresh();
        } else {
          setSnackbarOpen(true);
          setSnackbarMessage(response.message);
          return;
        }
      } catch (err) {
        console.error("Error adding quotation:", err);
      }
    }
  };

  // Compact Product Row for Desktop
  const CompactProductRow = ({ product, index }) => {
    return (
      <Grid container spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Grid item xs={4}>
          <TextField
            fullWidth
            size="small"
            placeholder="Product name"
            value={product.productName}
            onChange={(e) => handleProductChange(index, "productName", e.target.value)}
            error={errors.products && product.productName.trim() === ""}
            helperText={errors.products && product.productName.trim() === "" ? "Required" : ""}
            sx={{ '& .MuiInputBase-root': { height: '40px' } }}
          />
        </Grid>
        <Grid item xs={2}>
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
        <Grid item xs={2}>
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
        <Grid item xs={2}>
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
        <Grid item xs={1}>
          <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 500 }}>
            ₹ {(product.quantity * product.unitPrice * (1 + product.tax / 100)).toFixed(2)}
          </Typography>
        </Grid>
        <Grid item xs={1}>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDeleteProduct(index)}
            disabled={formData.products.length === 1}
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
        onClose={handleClose} 
        fullWidth 
        maxWidth="md"
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
              Create Quotation
            </Typography>
            <IconButton
              onClick={handleClose}
              size="small"
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers sx={{ 
          p: 2,
          '& .MuiTextField-root': {
            marginBottom: '8px',
          }
        }}>
          <Grid container spacing={2}>
            {/* Header Section - Compact */}
            <Grid item xs={12}>
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Quotation No"
                    size="small"
                    value={formData.quotationNo || ""}
                    disabled
                    sx={{ '& .MuiInputBase-root': { height: '40px' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Date"
                    size="small"
                    value={formData.date}
                    InputLabelProps={{ shrink: true }}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
                    error={errors.customerName}
                    helperText={errors.customerName ? "Required" : ""}
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
                    error={errors.customerPhone || (formData.customer.phone.trim() !== "" && formData.customer.phone.trim().length !== 10)}
                    helperText={
                      errors.customerPhone
                        ? "Required"
                        : formData.customer.phone.trim() !== "" && formData.customer.phone.trim().length !== 10
                        ? "Invalid Phone"
                        : ""
                    }
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

            {/* Products Section - Very Compact */}
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
                      TAX
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
                            error={errors.products && product.productName.trim() === ""}
                            helperText={errors.products && product.productName.trim() === "" ? "Required" : ""}
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
                              ₹ {(product.quantity * product.unitPrice * (1 + product.tax / 100)).toFixed(2)}
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteProduct(index)}
                          disabled={formData.products.length === 1}
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
                    <Typography variant="body2" fontWeight={500}>₹ {subtotal.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Tax Total:</Typography>
                    <Typography variant="body2" fontWeight={500}>₹ {taxTotal.toFixed(2)}</Typography>
                  </Box>
                  <Divider sx={{ my: 0.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" fontWeight={600}>Grand Total:</Typography>
                    <Typography variant="h6" fontWeight={700} color="primary">
                      ₹ {grandTotal.toFixed(2)}
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
                placeholder="Enter terms and conditions (optional)"
                value={formData.customer.terms}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    customer: {
                      ...prev.customer,
                      terms: e.target.value,
                    },
                  }));
                }}
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
              onClick={handleRefresh} 
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
            <Box sx={{ display: 'flex', gap: 1 }}>
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
                Save Quotation
              </Button>
            </Box>
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
          severity={snackbarMessage.includes("successful") ? "success" : "error"}
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

export default AddQuotationDialog;